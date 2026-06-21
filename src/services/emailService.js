const nodemailer = require('nodemailer');
const logger = require('./loggerService');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && port && user && pass) {
      const isSecure = parseInt(port, 10) === 465;
      this.transporter = nodemailer.createTransport({
        host,
        port: parseInt(port, 10),
        secure: isSecure,
        auth: {
          user,
          pass,
        },
        tls: {
          rejectUnauthorized: false
        }
      });
      logger.info(`SMTP Mailer initialized successfully targeting host: ${host}:${port} (secure: ${isSecure})`);
    } else {
      logger.warn('SMTP configurations are missing in environment variables. Email service will run in Mock/Console fallback mode.');
    }
  }

  async sendMail({ to, subject, html, text }) {
    const from = process.env.SMTP_FROM || 'noreply@portfoliobuilder.com';

    if (!this.transporter) {
      logger.info(`[Mock Email Fallback]
=========================================
TO:      ${to}
FROM:    ${from}
SUBJECT: ${subject}
TEXT:    ${text}
HTML:    [HTML Content Hidden]
=========================================`);
      return { messageId: 'mock-id-' + Date.now() };
    }

    try {
      const info = await this.transporter.sendMail({
        from,
        to,
        subject,
        text,
        html,
      });
      logger.info(`Email sent successfully to ${to}. Message ID: ${info.messageId}`);
      return info;
    } catch (error) {
      logger.error(`Error sending email to ${to}: ${error.message}`);
      // Fallback log to console if it fails so the OTP is not lost
      logger.info(`[Fallback due to error] OTP or Token for ${to}: ${text || subject}`);
      return { messageId: 'error-fallback-' + Date.now(), error: error.message };
    }
  }

  async sendPasswordResetEmail(email, token) {
    const subject = 'PortfolioBuilder — Reset Your Password';
    const text = `You requested a password reset. Your 6-digit verification code is: ${token}. This code is valid for 10 minutes.`;
    const html = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
        <!-- Logo Header -->
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #4f6ef7; font-weight: 800; font-size: 26px; margin: 0; letter-spacing: -0.5px;">PortfolioBuilder</h2>
        </div>
        
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        
        <!-- Content -->
        <div style="color: #1f2937; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          <p>Hello,</p>
          <p>We received a request to reset the password for your **PortfolioBuilder** account. Use the verification code below to set a new password:</p>
          
          <!-- Code Card -->
          <div style="text-align: center; margin: 30px 0; padding: 20px; background: linear-gradient(135deg, rgba(79, 110, 247, 0.05) 0%, rgba(155, 92, 246, 0.05) 100%); border: 1px solid rgba(79, 110, 247, 0.15); border-radius: 8px;">
            <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #4f6ef7; display: inline-block;">${token}</span>
          </div>
          
          <p style="font-size: 14px; color: #6b7280; font-style: italic;">Note: This code will expire in <strong>10 minutes</strong>. If you did not make this request, you can safely ignore this email.</p>
        </div>
        
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
        
        <!-- Footer -->
        <div style="text-align: center; color: #9ca3af; font-size: 12px; line-height: 1.4;">
          <p>This is an automated security notification from PortfolioBuilder.</p>
          <p style="margin-top: 5px;">&copy; ${new Date().getFullYear()} PortfolioBuilder SaaS MVP. All rights reserved.</p>
        </div>
      </div>
    `;

    return this.sendMail({ to: email, subject, text, html });
  }

  async sendEmailVerification(email, token) {
    const subject = 'PortfolioBuilder — Verify Your Email';
    const verificationUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/api/auth/verify-email?token=${token}`;
    const text = `Thank you for registering at PortfolioBuilder! Please verify your email by opening this link: ${verificationUrl}`;
    const html = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
        <!-- Logo Header -->
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #4f6ef7; font-weight: 800; font-size: 26px; margin: 0; letter-spacing: -0.5px;">PortfolioBuilder</h2>
        </div>
        
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        
        <!-- Content -->
        <div style="color: #1f2937; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          <p>Hello,</p>
          <p>Thank you for signing up with **PortfolioBuilder**! To complete your registration and activate your account, please verify your email address by clicking the button below:</p>
          
          <!-- Button Card -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" target="_blank" style="background: linear-gradient(135deg, #4f6ef7 0%, #9b5cf6 100%); color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(79, 110, 247, 0.3);">Verify Email Address</a>
          </div>
          
          <p style="font-size: 14px; color: #6b7280; word-break: break-all;">Or copy and paste this link in your browser: <br/><a href="${verificationUrl}" style="color: #4f6ef7;">${verificationUrl}</a></p>
        </div>
        
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
        
        <!-- Footer -->
        <div style="text-align: center; color: #9ca3af; font-size: 12px; line-height: 1.4;">
          <p>This is an automated notification from PortfolioBuilder.</p>
          <p style="margin-top: 5px;">&copy; ${new Date().getFullYear()} PortfolioBuilder SaaS MVP. All rights reserved.</p>
        </div>
      </div>
    `;

    return this.sendMail({ to: email, subject, text, html });
  }
}

module.exports = new EmailService();
