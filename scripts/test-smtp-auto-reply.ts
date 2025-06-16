// scripts/test-smtp-auto-reply.ts
import imaps from 'imap-simple';
import nodemailer from 'nodemailer';
import logger from '../lib/logger';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Test SMTP and IMAP connections with proper error handling
 * This script will:
 * 1. Try to connect to the IMAP server
 * 2. Watch for new emails
 * 3. Send an auto-reply when a new email is received
 */
async function testEmailIntegration(options = { pollTime: 15000, runOnce: false }) {
  // Use environment variables instead of hardcoded credentials
  const EMAIL_USER = process.env.EMAIL_USER || '';
  const EMAIL_PASS = process.env.EMAIL_PASS || '';
  const EMAIL_FROM = process.env.EMAIL_FROM || '';
  const CC_EMAIL = process.env.CC_EMAIL || '';
  
  // Validate required environment variables
  if (!EMAIL_USER || !EMAIL_PASS) {
    logger.error('Missing required environment variables', { 
      required: ['EMAIL_USER', 'EMAIL_PASS'],
      hint: 'Please set these in your .env file'
    });
    return { success: false, error: 'Missing required environment variables' };
  }

  // Track the start time
  const startTime = new Date();
  logger.info('Starting email monitoring', { startTime: startTime.toISOString() });
  
  try {
    // Test IMAP connection once before entering the polling loop
    logger.info('Testing IMAP connection...');
    const imapConfig = {
      imap: {
        user: EMAIL_USER,
        password: EMAIL_PASS,
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
        authTimeout: 10000,
      },
    };
    
    try {
      const testConnection = await imaps.connect(imapConfig);
      await testConnection.openBox('INBOX');
      logger.info('IMAP connection successful');
      await testConnection.end();
    } catch (imapError: any) {
      logger.error('IMAP connection test failed', {
        error: imapError.message,
        host: 'imap.gmail.com',
        port: 993
      });
      return { success: false, error: `IMAP connection failed: ${imapError.message}` };
    }
    
    // Test SMTP connection
    logger.info('Testing SMTP connection...');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: EMAIL_USER, pass: EMAIL_PASS },
    });
    
    try {
      await transporter.verify();
      logger.info('SMTP connection successful');
    } catch (smtpError: any) {
      logger.error('SMTP connection test failed', {
        error: smtpError.message,
        service: 'gmail'
      });
      return { success: false, error: `SMTP connection failed: ${smtpError.message}` };
    }

    // Start the polling loop if all connections are successful
    let pollCount = 0;
    
    do {
      pollCount++;
      logger.debug(`Starting poll #${pollCount}`);
      
      try {
        const connection = await imaps.connect(imapConfig);
        await connection.openBox('INBOX');
        
        // Search for unseen emails received after the script started
        const sinceStr = startTime.toISOString().replace(/T/, ' ').replace(/\..+/, '');
        const searchCriteria = [
          'UNSEEN',
          ['SINCE', sinceStr],
        ];
        const fetchOptions = { bodies: ['HEADER', 'TEXT'], markSeen: true };
        const results = await connection.search(searchCriteria, fetchOptions);
        
        if (results.length > 0) {
          logger.info(`Found ${results.length} new messages`);
          
          for (const res of results) {
            const header = res.parts.find((p: any) => p.which === 'HEADER');
            if (!header) {
              logger.warn('Message without header found, skipping');
              continue;
            }
            
            const from = header.body.from[0];
            const subject = header.body.subject ? header.body.subject[0] : '(No subject)';
            const senderEmail = from.match(/<(.+)>/)?.[1] || from;
            
            logger.info('New email received', { 
              from: senderEmail,
              subject
            });
            
            // Send auto-reply with CC if configured
            try {
              await transporter.sendMail({
                from: EMAIL_FROM || EMAIL_USER,
                to: senderEmail,
                cc: CC_EMAIL || undefined,
                subject: `Re: ${subject}`,
                text: `Thank you for contacting us. We have received your inquiry and will get back to you soon.`,
                html: `
                  <p>Thank you for contacting us.</p>
                  <p>We have received your inquiry and will get back to you soon.</p>
                  <p><em>This is an automated response, please do not reply directly to this email.</em></p>
                `
              });
              
              logger.info('Auto-reply sent successfully', { 
                to: senderEmail,
                cc: CC_EMAIL || 'none'
              });
            } catch (replyError: any) {
              logger.error('Failed to send auto-reply', { 
                error: replyError.message,
                recipient: senderEmail
              });
            }
          }
        } else {
          logger.debug('No new messages found');
        }
        
        // Close the connection properly
        await connection.end();
      } catch (pollError: any) {
        logger.error('Error during polling cycle:', { 
          error: pollError.message,
          pollCount
        });
      }
      
      // Only continue polling if we're not in runOnce mode
      if (!options.runOnce) {
        logger.debug(`Waiting ${options.pollTime / 1000} seconds before next poll`);
        await new Promise((resolve) => setTimeout(resolve, options.pollTime));
      }
    } while (!options.runOnce);
    
    return { success: true };
  } catch (error: any) {
    logger.error('Unhandled error in testEmailIntegration:', { 
      error: error.message,
      stack: error.stack
    });
    return { success: false, error: error.message };
  }
}

// Command line arguments
const args = process.argv.slice(2);
const runOnce = args.includes('--once');

(async () => {
  try {
    logger.info('===== Starting Email Integration Test =====', { runOnce });
    
    const result = await testEmailIntegration({ 
      pollTime: 15000,  // 15 seconds between polls
      runOnce
    });
    
    if (result.success) {
      logger.info('Email integration test completed successfully');
      // Only exit if running once, otherwise keep the process alive
      if (runOnce) {
        process.exit(0);
      }
    } else {
      logger.error('Email integration test failed', { error: result.error });
      process.exit(1);
    }
  } catch (err: any) {
    logger.error('Fatal error running email integration test:', { 
      error: err.message,
      stack: err.stack
    });
    process.exit(1);
  }
})();
