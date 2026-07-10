import nodemailer from "nodemailer";
import { logger } from "./logger";
import { db, emailLogsTable } from "@workspace/db";
import {
  getWelcomeEmailTemplate,
  getLoginEmailTemplate,
  getResumeUploadEmailTemplate,
  getResumeUpdateEmailTemplate,
  getApplicationStatusUpdateEmailTemplate,
  getInterviewScheduledEmailTemplate,
  getInterviewReminderEmailTemplate,
  getInterviewCancelledEmailTemplate,
  getApplicationConfirmationEmailTemplate,
  getATSAnalysisEmailTemplate,
  getPasswordResetEmailTemplate,
  getAdminNewUserEmailTemplate,
  getAdminLoginEmailTemplate,
  getAdminUserLoginEmailTemplate,
  getImportStartedEmailTemplate,
  getImportCompletedEmailTemplate,
  getImportFailedEmailTemplate,
  getSourceAddedEmailTemplate,
  getSourceUpdatedEmailTemplate,
  getSourceDisabledEmailTemplate,
  getSourceEnabledEmailTemplate,
  getSourceDeletedEmailTemplate,
  getDailySummaryEmailTemplate,
  getSystemErrorEmailTemplate
} from "./email-templates";

/**
 * Enhanced email service with template support
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
   * Writes a record of the email attempt to the email_logs table.
   * Never throws — a logging failure must never break the actual email flow.
   */
  private async logEmail(params: {
    recipient: string;
    subject: string;
    event: string;
    status: "sent" | "failed";
    error?: string;
  }): Promise<void> {
    try {
      await db.insert(emailLogsTable).values({
        recipient: params.recipient,
        subject: params.subject,
        event: params.event,
        status: params.status,
        error: params.error ?? null,
        retryCount: 0,
      });
    } catch (dbErr) {
      logger.error(dbErr, "Failed to write email log to database");
    }
  }

  /**
   * Sends an email using a template
   * @param to      Recipient e‑mail address
   * @param template    Template object with subject, html, and text properties
   * @param event   Logical event name for this email (e.g. "welcome", "interview_scheduled").
   *                Defaults to the subject line if not provided.
   */
  async sendTemplateEmail(
    to: string,
    template: { subject: string; html: string; text: string },
    event?: string
  ): Promise<void> {
    const mailOptions = {
      from: process.env.SMTP_FROM || `"Vishnu's Job Quest" <vishnu252223@gmail.com>`,
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    };

    const eventName = event || template.subject;

    try {
      await this.transporter.sendMail(mailOptions);
      logger.info({
        to,
        subject: template.subject,
        timestamp: new Date().toISOString(),
        event: 'email_sent'
      }, "Email sent successfully");
      await this.logEmail({ recipient: to, subject: template.subject, event: eventName, status: "sent" });
    } catch (err) {
      logger.error({
        to,
        subject: template.subject,
        timestamp: new Date().toISOString(),
        event: 'email_failed',
        error: err.message
      }, "Failed to send email");
      await this.logEmail({ recipient: to, subject: template.subject, event: eventName, status: "failed", error: err.message });
      throw err; // let the caller decide whether to fail the request
    }
  }

  /**
   * Sends a plain‑text e‑mail (kept for backward compatibility)
   * @param to      Recipient e‑mail address
   * @param subject Subject line
   * @param body    Body (plain text)
   * @param event   Logical event name for this email. Defaults to the subject line.
   */
  async sendMail(to: string, subject: string, body: string, event?: string): Promise<void> {
    const mailOptions = {
      from: process.env.SMTP_FROM || `"Vishnu's Job Quest" <vishnu252223@gmail.com>`,
      to,
      subject,
      text: body,
    };

    const eventName = event || subject;

    try {
      await this.transporter.sendMail(mailOptions);
      logger.info({
        to,
        subject,
        timestamp: new Date().toISOString(),
        event: 'email_sent'
      }, "Plain‑text e‑mail sent successfully");
      await this.logEmail({ recipient: to, subject, event: eventName, status: "sent" });
    } catch (err) {
      logger.error({
        to,
        subject,
        timestamp: new Date().toISOString(),
        event: 'email_failed',
        error: err.message
      }, "Failed to send plain‑text e‑mail");
      await this.logEmail({ recipient: to, subject, event: eventName, status: "failed", error: err.message });
      throw err;
    }
  }

  /**
   * Sends an HTML e‑mail (with optional plain‑text fallback)
   * @param to      Recipient e‑mail address
   * @param subject Subject line
   * @param html    Body (HTML)
   * @param event   Logical event name for this email. Defaults to the subject line.
   */
  async sendHtmlMail(to: string, subject: string, html: string, event?: string): Promise<void> {
    // Generate a simple plain‑text version by stripping HTML tags (naive)
    const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

    const mailOptions = {
      from: process.env.SMTP_FROM || `"Vishnu's Job Quest" <vishnu252223@gmail.com>`,
      to,
      subject,
      html,
      text, // fallback for clients that don't render HTML
    };

    const eventName = event || subject;

    try {
      await this.transporter.sendMail(mailOptions);
      logger.info({
        to,
        subject,
        timestamp: new Date().toISOString(),
        event: 'html_email_sent'
      }, "HTML e‑mail sent successfully");
      await this.logEmail({ recipient: to, subject, event: eventName, status: "sent" });
    } catch (err) {
      logger.error({
        to,
        subject,
        timestamp: new Date().toISOString(),
        event: 'html_email_failed',
        error: err.message
      }, "Failed to send HTML e‑mail");
      await this.logEmail({ recipient: to, subject, event: eventName, status: "failed", error: err.message });
      throw err;
    }
  }
}

/**
 * Singleton – import and use MailService.instance wherever needed
 */
export const mailService = new MailService();