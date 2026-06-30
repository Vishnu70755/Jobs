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
      from: process.env.SMTP_FROM || '"Job Aggregator" <no-reply@example.com>',
      to,
      subject,
      text: body,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      logger.info({ to, subject }, "E‑mail sent successfully");
    } catch (err) {
      logger.error({ to, subject, err }, "Failed to send e‑mail");
      throw err; // let the caller decide whether to fail the request
    }
  }
}

/**
 * Singleton – import and use MailService.instance wherever you need it.
 */
export const mailService = new MailService();