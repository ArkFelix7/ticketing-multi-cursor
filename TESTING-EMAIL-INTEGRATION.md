# Email Integration Guide

This document provides detailed instructions for setting up, testing, and troubleshooting the email integration functionality in the multi-tenant ticketing system.

## Configuration

### Prerequisites

1. Gmail account with one of:
   - "Less secure app access" enabled (not recommended for production)
   - **Recommended:** An App Password (requires 2FA to be enabled on your Google account)
   
2. Environment variables in `.env`:
   ```
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_FROM=your-email@gmail.com
   CC_EMAIL=optional-cc-email@example.com
   ```

### Creating a Google App Password

1. Go to your Google Account settings at [myaccount.google.com](https://myaccount.google.com)
2. Enable 2-Factor Authentication if not already enabled
3. Go to Security > App passwords
4. Create a new app password for "Mail" and "Other (Custom name)" - name it "Ticketing System"
5. Copy the generated password and use it as your `EMAIL_PASS` environment variable

## Mailbox Setup

### Adding a Mailbox in the Application

1. Go to Settings > Mailboxes
2. Click "Add New Mailbox"
3. Enter the following details:
   - **Name**: Descriptive name (e.g., "Support Inbox")
   - **Email**: your-email@gmail.com
   - **Provider**: gmail
   - **IMAP Settings**:
     - Host: imap.gmail.com
     - Port: 993
     - SSL: Enabled
     - Username: your-email@gmail.com
     - Password: your-app-password
   - **SMTP Settings**:
     - Host: smtp.gmail.com
     - Port: 465 (or 587 with TLS)
     - SSL: Enabled
     - Username: your-email@gmail.com
     - Password: your-app-password
4. Click "Test Connection" to verify settings
5. Save the mailbox configuration

## Testing the Integration

### 1. Test Connection Script

Run the dedicated test script to verify your settings:

```bash
# Test connection once and exit
npx tsx scripts/test-smtp-auto-reply.ts --once

# Run continuous monitoring (Ctrl+C to exit)
npx tsx scripts/test-smtp-auto-reply.ts
```

This script will:
- Test IMAP connection to your mailbox
- Test SMTP connection for sending emails
- Monitor for incoming emails
- Send an auto-reply when a new email is received

### 2. Manual Sync Testing

1. Navigate to the Inbox page in your company dashboard
2. Click "Sync Mailboxes Now" button
3. Send a test email to your configured mailbox from another account
4. Click sync again 
5. Verify that the email appears in the inbox
6. Check that a new ticket was created from the email

### 3. Automatic Sync Testing

1. Navigate to the Inbox page
2. The automatic sync runs every 5 minutes by default
3. Send a test email from another account to your configured mailbox
4. Wait for the automatic sync to run or click the refresh button
5. Verify that the email appears and a ticket is created

### 4. Testing the Complete Workflow

1. Send an email to your configured mailbox from another account
2. The system should:
   - Fetch the email during the next sync
   - Create a ticket automatically
   - Send an auto-reply to the sender
   - Link the email to the ticket
   - Mark the email as read
3. Reply to the ticket within the system
4. Verify that your reply is sent to the original sender

## Running the Email Sync Process Manually

For quick testing or debugging, you can run the sync process directly:

```bash
# Sync all active mailboxes
npx tsx scripts/sync-mailboxes.ts
```

## Troubleshooting

### Common Issues

#### Emails Not Appearing
- Verify mailbox configuration (credentials, IMAP/SMTP settings)
- Check that you're viewing the correct company inbox (company slug in URL parameters)
- Ensure Gmail account settings allow external access
- Wait for the auto-sync cycle or manually trigger a sync
- Check logs for any errors (see below for log checking)

#### Auto-replies Not Being Sent
- Verify SMTP credentials and settings
- Check if Gmail is blocking the sending application
- Ensure your application has permission to send emails
- Check if rate limits are being hit

#### Connection Errors
- Verify network connectivity
- Check if Gmail is blocking connections due to security settings
- Ensure you're using an App Password if 2FA is enabled
- Try resetting your App Password and updating the configuration

### Checking Logs

The application now uses a structured logging system. To view detailed logs:

```bash
# View logs from mailbox sync process
npx tsx scripts/sync-mailboxes.ts > mailbox-sync.log 2>&1

# View logs from the test script
npx tsx scripts/test-smtp-auto-reply.ts --once > email-test.log 2>&1
```

### Security Considerations

1. **Never commit email passwords to version control**
2. Always use environment variables for sensitive information
3. Consider using OAuth2 authentication for production environments
4. Rotate App Passwords periodically
5. Monitor for unauthorized access to your email accounts

## Adding New Email Providers

The current implementation supports Gmail. To add support for other email providers:

1. Update the provider selection in the mailbox form
2. Add the appropriate IMAP/SMTP server details for the provider
3. Test the connection thoroughly
4. Update this documentation with the new provider settings
