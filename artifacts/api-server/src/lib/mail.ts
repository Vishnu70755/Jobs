import nodemailer from "nodemailer";
import { logger } from "./logger";

/**
 * Simple wrapper around nodemailer.
 * Expects the following env vars (add them to your .env or platform config):
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 */
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Validate required environment variables
    const requiredEnvVars = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'];
    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingEnvVars.length > 0) {
      const errorMsg = `Missing required SMTP environment variables: ${missingEnvVars.join(', ')}`;
      logger.error(new Error(errorMsg), "SMTP configuration error");
      // We still create the transporter to avoid breaking the app, but it will fail when used
    }

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT || 587) === 465, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Verify connection at startup – logs any config error early
    this.transporter.verify((err) => {
      if (err) {
        logger.error(err, "SMTP connection failed");
      } else {
        logger.info("SMTP server is ready to send e‑mails");
      }
    });
  }

  /**
   * Sends a plain‑text e‑mail.
   * @param to      Recipient e‑mail address
   * @param subject Subject line
   * @param body    Body (plain text)
   */
  async sendMail(to: string, subject: string, body: string): Promise<void> {
    const mailOptions = {
      from: process.env.SMTP_FROM || '"Vishnu\'s Job Quest" <no-reply@example.com>',
      to,
      subject,
      text: body,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      logger.info({
        to,
        subject,
        timestamp: new Date().toISOString(),
        event: 'email_sent'
      }, "Plain-text e‑mail sent successfully");
    } catch (err) {
      logger.error({
        to,
        subject,
        timestamp: new Date().toISOString(),
        event: 'email_failed',
        error: err.message
      }, "Failed to send plain-text e‑mail");
      throw err; // let the caller decide whether to fail the request
    }
  }

  /**
   * Sends an HTML e‑mail (with optional plain‑text fallback).
   * @param to      Recipient e‑mail address
   * @param subject Subject line
   * @param html    Body (HTML)
   */
  async sendHtmlMail(to: string, subject: string, html: string): Promise<void> {
    // Generate a simple plain-text version by stripping HTML tags (naive)
    const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

    const mailOptions = {
      from: process.env.SMTP_FROM || '"Vishnu\'s Job Quest" <no-reply@example.com>',
      to,
      subject,
      html,
      text, // fallback for clients that don't render HTML
    };

    try {
      await this.transporter.sendMail(mailOptions);
      logger.info({
        to,
        subject,
        timestamp: new Date().toISOString(),
        event: 'html_email_sent'
      }, "HTML e‑mail sent successfully");
    } catch (err) {
      logger.error({
        to,
        subject,
        timestamp: new Date().toISOString(),
        event: 'html_email_failed',
        error: err.message
      }, "Failed to send HTML e‑mail");
      throw err;
    }
  }
}

/**
 * Singleton – import and use MailService.instance wherever you need it.
 */
export const mailService = new MailService();