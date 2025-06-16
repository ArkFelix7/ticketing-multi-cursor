import imaps from 'imap-simple';
import nodemailer from 'nodemailer';

export async function testImap({ imapHost, imapPort, imapUser, imapPass, imapSSL }) {
  try {
    const config = {
      imap: {
        user: imapUser,
        password: imapPass,
        host: imapHost,
        port: Number(imapPort),
        tls: imapSSL,
        tlsOptions: { rejectUnauthorized: false },
        authTimeout: 10000,
      },
    };
    const conn = await imaps.connect(config);
    await conn.openBox('INBOX');
    await conn.end();
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function testSmtp({ smtpHost, smtpPort, smtpUser, smtpPass, smtpSSL }) {
  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(smtpPort),
      secure: smtpSSL,
      auth: { user: smtpUser, pass: smtpPass },
    });
    await transporter.verify();
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
