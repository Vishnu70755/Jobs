import nodemailer from "nodemailer";
import { logger } from "./logger";

/**
 * Notification for welcome email
 */
export function getWelcomeEmailTemplate(userName: string, verificationUrl?: string): { subject: string; html: string; text: string } {
  return {
    subject: verificationUrl
      ? `Please verify your email address for Vishnu's Job Quest`
      : `Welcome to Vishnu's Job Quest, ${userName}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <style>
          .container { line-height: 1.6; color: #333; }
          .header { color: #2c3e50; border-bottom: 2px solid ${verificationUrl ? '#e74c3c' : '#2ecc71'}; padding-bottom: 10px; }
          .content { margin: 20px 0; }
          .info-box { background-color: ${verificationUrl ? '#fadbd8' : '#d4efdf'}; border: 1px solid ${verificationUrl ? '#d5a6a6' : '#a9dfbf'}; border-radius: 4px; padding: 20px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #7f8c8d; }
          .highlight { color: #27ae60; font-weight: bold; }
          .verification-link { color: #3498db; text-decoration: none; font-weight: bold; }
        </style>
        <div class="container">
          <div class="header">
            <h1>${verificationUrl ? 'Email Verification' : 'Welcome to Vishnu\'s Job Quest!'}</h1>
          </div>
          <p>Hello ${userName},</p>
          <p>${verificationUrl
            ? 'Please click the link below to verify your email address:'
            : 'Welcome to Vishnu\'s Job Quest - your ultimate job search companion!'}
          </p>
          ${verificationUrl
            ? `
            <div class="info-box">
              <p><strong>Verification Link:</strong></p>
              <p><a href="${verificationUrl}" class="verification-link">${verificationUrl}</a></p>
              <p>This link will expire in 24 hours for security reasons.</p>
            </div>
            `
            : `
            <div class="info-box">
              <p><strong>Welcome Benefits:</strong></p>
              <ul>
                <li>Access to thousands of job listings from top companies</li>
                <li>Resume building and optimization tools</li>
                <li>Application tracking and management</li>
                <li>Interview scheduling and reminders</li>
                <li>Career resources and advice</li>
              </ul>
            </div>
            `}
          <p>${verificationUrl
            ? 'If you did not request this verification, please ignore this email.'
            : 'Get started by completing your profile and uploading your resume.'}
          </p>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Vishnu's Job Quest. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </div>
    `,
    text: `
${verificationUrl
  ? `Email Verification for Vishnu's Job Quest`
  : `Welcome to Vishnu's Job Quest, ${userName}!`}

Hello ${userName},

${verificationUrl
  ? 'Please click the link below to verify your email address:'
  : 'Welcome to Vishnu\'s Job Quest - your ultimate job search companion!'}

${verificationUrl
  ? `
Verification Link: ${verificationUrl}
This link will expire in 24 hours for security reasons.

If you did not request this verification, please ignore this email.
`
  : `
Welcome Benefits:
- Access to thousands of job listings from top companies
- Resume building and optimization tools
- Application tracking and management
- Interview scheduling and reminders
- Career resources and advice

Get started by completing your profile and uploading your resume.
`}

----------------------------------------
© ${new Date().getFullYear()} Vishnu's Job Quest. All rights reserved.
This is an automated message, please do not reply.
    `
  };
}

/**
 * Notification for login email
 */
export function getLoginEmailTemplate(userName: string, loginTime: string, ipAddress: string, location?: string): { subject: string; html: string; text: string } {
  const displayLocation = location || "New Sign-in";
  return {
    subject: `Login Notification - Vishnu's Job Quest`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <style>
          .container { line-height: 1.6; color: #333; }
          .header { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
          .content { margin: 20px 0; }
          .info-box { background-color: #ebf5fb; border: 1px solid #aed6f1; border-radius: 4px; padding: 15px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #7f8c8d; }
          .alert-text { color: #e74c3c; font-weight: bold; }
        </style>
        <div class="container">
          <div class="header">
            <h1>Login Notification</h1>
          </div>
          <p>Hello ${userName},</p>
          <p>We detected a sign-in to your Vishnu's Job Quest account.</p>
          <div class="info-box">
            <p><strong>Time:</strong> ${loginTime}</p>
            <p><strong>IP Address:</strong> ${ipAddress}</p>
            <p><strong>Location:</strong> ${displayLocation}</p>
          </div>
          <p>If this was you, you can safely ignore this email.</p>
          <p>If this wasn't you, please secure your account immediately:</p>
          <ul>
            <li>Change your password</li>
            <li>Enable two-factor authentication</li>
            <li>Contact our support team</li>
          </ul>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Vishnu's Job Quest. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </div>
    `,
    text: `
Login Notification - Vishnu's Job Quest

Hello ${userName},

We detected a sign-in to your Vishnu's Job Quest account.

Details:
- Time: ${loginTime}
- IP Address: ${ipAddress}
- Location: ${displayLocation}

If this was you, you can safely ignore this email.

If this wasn't you, please secure your account immediately:
- Change your password
- Enable two-factor authentication
- Contact our support team

----------------------------------------
© ${new Date().getFullYear()} Vishnu's Job Quest. All rights reserved.
This is an automated message, please do not reply.
    `
  };
}

/**
 * Notification for password reset email
 */
export function getPasswordResetEmailTemplate(userName: string, resetUrl: string): { subject: string; html: string; text: string } {
  return {
    subject: `Reset your password for Vishnu's Job Quest`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <style>
          .container { line-height: 1.6; color: #333; }
          .header { color: #2c3e50; border-bottom: 2px solid #e74c3c; padding-bottom: 10px; }
          .content { margin: 20px 0; }
          .info-box { background-color: #fadbd8; border: 1px solid #d5a6a6; border-radius: 4px; padding: 20px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #7f8c8d; }
          .highlight { color: #e74c3c; font-weight: bold; }
          .reset-link { color: #3498db; text-decoration: none; font-weight: bold; }
        </style>
        <div class="container">
          <div class="header">
            <h1>Reset Your Password</h1>
          </div>
          <p>Hello ${userName},</p>
          <p>We received a request to reset your password for your Vishnu's Job Quest account.</p>
          <div class="info-box">
            <p><strong>Reset Link:</strong></p>
            <p><a href="${resetUrl}" class="reset-link">${resetUrl}</a></p>
            <p>This link will expire in 1 hour for security reasons.</p>
            <p>If you didn't request this reset, please ignore this email and your password will remain unchanged.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Vishnu's Job Quest. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </div>
    `,
    text: `
Reset your password for Vishnu's Job Quest

Hello ${userName},

We received a request to reset your password for your Vishnu's Job Quest account.

Reset Link: ${resetUrl}
This link will expire in 1 hour for security reasons.

If you didn't request this reset, please ignore this email and your password will remain unchanged.

----------------------------------------
© ${new Date().getFullYear()} Vishnu's Job Quest. All rights reserved.
This is an automated message, please do not reply.
    `
  };
}

/**
 * Notification for import job started
 */
export function getImportStartedEmailTemplate(sourceName: string, startedAt: string): { subject: string; html: string; text: string } {
  return {
    subject: `Job Import Started: ${sourceName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <style>
          .container { line-height: 1.6; color: #333; }
          .header { color: #2c3e50; border-bottom: 2px solid #2ecc71; padding-bottom: 10px; }
          .content { margin: 20px 0; }
          .info-box { background-color: #d4efdf; border: 1px solid #a9dfbf; border-radius: 4px; padding: 15px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #7f8c8d; }
        </style>
        <div class="container">
          <div class="header">
            <h1>Job Import Started</h1>
          </div>
          <p>The job import process has started for the following source:</p>
          <div class="info-box">
            <p><strong>Source:</strong> ${sourceName}</p>
            <p><strong>Started At:</strong> ${startedAt}</p>
            <p><strong>Status:</strong> Running</p>
          </div>
          <p>You can monitor the progress in the admin panel.</p>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Vishnu's Job Quest. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </div>
    `,
    text: `
Job Import Started: ${sourceName}

The job import process has started for the following source:

Details:
- Source: ${sourceName}
- Started At: ${startedAt}
- Status: Running

You can monitor the progress in the admin panel.

----------------------------------------
© ${new Date().getFullYear()} Vishnu's Job Quest. All rights reserved.
This is an automated message, please do not reply.
    `
  };
}

/**
 * Notification for import job completed
 */
export function getImportCompletedEmailTemplate(sourceName: string, startedAt: string, completedAt: string, jobsFound: number, jobsAdded: number, duplicates: number, failed: number): { subject: string; html: string; text: string } {
  return {
    subject: `Job Import Completed: ${sourceName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <style>
          .container { line-height: 1.6; color: #333; }
          .header { color: #2c3e50; border-bottom: 2px solid #2ecc71; padding-bottom: 10px; }
          .content { margin: 20px 0; }
          .results-box { background-color: #d5f5e3; border: 1px solid #a9dfbf; border-radius: 4px; padding: 20px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #7f8c8d; }
          .success { color: #27ae60; font-weight: bold; }
          .warning { color: #e67e22; font-weight: bold; }
          .error { color: #e74c3c; font-weight: bold; }
        </style>
        <div class="container">
          <div class="header">
            <h1>Job Import Completed</h1>
          </div>
          <p>The job import process has completed for the following source:</p>
          <div class="results-box">
            <p><strong>Source:</strong> ${sourceName}</p>
            <p><strong>Started At:</strong> ${startedAt}</p>
            <p><strong>Completed At:</strong> ${completedAt}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 15px 0;">
            <p><strong>Results:</strong></p>
            <p>• Jobs Found: <span class="success">${jobsFound}</span></p>
            <p>• Jobs Added: <span class="success">${jobsAdded}</span></p>
            <p>• Duplicate Jobs Skipped: <span class="warning">${duplicates}</span></p>
            <p>• Failed Jobs: <span class="error">${failed}</span></p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Vishnu's Job Quest. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </div>
    `,
    text: `
Job Import Completed: ${sourceName}

The job import process has completed for the following source:

Details:
- Source: ${sourceName}
- Started At: ${startedAt}
- Completed At: ${completedAt}

Results:
- Jobs Found: ${jobsFound}
- Jobs Added: ${jobsAdded}
- Duplicate Jobs Skipped: ${duplicates}
- Failed Jobs: ${failed}

----------------------------------------
© ${new Date().getFullYear()} Vishnu's Job Quest. All rights reserved.
This is an automated message, please do not reply.
    `
  };
}

/**
 * Notification for import job failed
 */
export function getImportFailedEmailTemplate(sourceName: string, errorMessage: string, startedAt: string): { subject: string; html: string; text: string } {
  return {
    subject: `Job Import Failed: ${sourceName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <style>
          .container { line-height: 1.6; color: #333; }
          .header { color: #2c3e50; border-bottom: 2px solid #e74c3c; padding-bottom: 10px; }
          .content { margin: 20px 0; }
          .error-box { background-color: #fadbd8; border: 1px solid #d5a6a6; border-radius: 4px; padding: 20px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #7f8c8d; }
          .error-text { color: #e74c3c; font-weight: bold; }
        </style>
        <div class="container">
          <div class="header">
            <h1>Job Import Failed</h1>
          </div>
          <p>The job import process has failed for the following source:</p>
          <div class="error-box">
            <p><strong>Source:</strong> ${sourceName}</p>
            <p><strong>Started At:</strong> ${startedAt}</p>
            <p><strong>Error:</strong> <span class="error-text">${errorMessage}</span></p>
          </div>
          <p>Please check the admin panel for more details and consider restarting the import process.</p>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Vishnu's Job Quest. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </div>
    `,
    text: `
Job Import Failed: ${sourceName}

The job import process has failed for the following source:

Details:
- Source: ${sourceName}
- Started At: ${startedAt}
- Error: ${errorMessage}

Please check the admin panel for more details and consider restarting the import process.

----------------------------------------
© ${new Date().getFullYear()} Vishnu's Job Quest. All rights reserved.
This is an automated message, please do not reply.
    `
  };
}

/**
 * Notification for new source added
 */
export function getSourceAddedEmailTemplate(sourceName: string, sourceType: string, addedAt: string): { subject: string; html: string; text: string } {
  return {
    subject: `New Source Added: ${sourceName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <style>
          .container { line-height: 1.6; color: #333; }
          .header { color: #2c3e50; border-bottom: 2px solid #2ecc71; padding-bottom: 10px; }
          .content { margin: 20px 0; }
          .info-box { background-color: #d4efdf; border: 1px solid #a9dfbf; border-radius: 4px; padding: 15px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #7f8c8d; }
        </style>
        <div class="container">
          <div class="header">
            <h1>New Source Added</h1>
          </div>
          <p>A new job source has been added to the system:</p>
          <div class="info-box">
            <p><strong>Source Name:</strong> ${sourceName}</p>
            <p><strong>Source Type:</strong> ${sourceType}</p>
            <p><strong>Added At:</strong> ${addedAt}</p>
            <p><strong>Status:</strong> Active</p>
          </div>