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
          <p>You can manage this source in the admin panel.</p>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Vishnu's Job Quest. All rights reserved.</p>     
        <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </div>
    `,
    text: `
New Source Added: ${sourceName}
A new job source has been added to the system:
- Source Name: ${sourceName}
- Source Type: ${sourceType}
- Added At: ${addedAt}
- Status: Active
You can
  manage this source in the admin panel.      
----------------------------------------
© ${new Date().getFullYear()} Vishnu's Job Quest. All rights reserved.
This is an automated message, please do not reply.
    `
  };
} 


export function getAdminUserLoginEmailTemplate(userName: string, userEmail: string, loginTime: string, userId: string, ipAddress: string, userAgent: string, userType: string): { subject: string; html: string; text: string } {
  return {
    subject: `User Login: ${userName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1>User Login</h1>
        <p><strong>Name:</strong> ${userName}</p>
        <p><strong>Email:</strong> ${userEmail}</p>
        <p><strong>User ID:</strong> ${userId}</p>
        <p><strong>User Type:</strong> ${userType}</p>
        <p><strong>Login Time:</strong> ${loginTime}</p>
        <p><strong>IP Address:</strong> ${ipAddress}</p>
        <p><strong>User Agent:</strong> ${userAgent}</p>
      </div>
    `,
    text: `${userName} (${userEmail}) logged in at ${loginTime} from ${ipAddress}`
  };
}

/**
 * Confirmation sent to a user after they submit a job application
 */
export function getApplicationConfirmationEmailTemplate(userName: string, jobTitle: string, companyName: string): { subject: string; html: string; text: string } {
  return {
    subject: `Application Submitted: ${jobTitle} at ${companyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1>Application Submitted</h1>
        <p>Hi ${userName},</p>
        <p>Your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been recorded.</p>
      </div>
    `,
    text: `Hi ${userName}, your application for ${jobTitle} at ${companyName} has been recorded.`
  };
}

/**
 * Sent to a user when their application status changes
 */
export function getApplicationStatusUpdateEmailTemplate(userName: string, jobTitle: string, companyName: string, oldStatus: string, newStatus: string, applicationDate: string): { subject: string; html: string; text: string } {
  return {
    subject: `Application Update: ${jobTitle} at ${companyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1>Application Status Updated</h1>
        <p>Hi ${userName},</p>
        <p>Your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> (applied on ${applicationDate}) changed from <strong>${oldStatus}</strong> to <strong>${newStatus}</strong>.</p>
      </div>
    `,
    text: `Hi ${userName}, your application for ${jobTitle} at ${companyName} changed from ${oldStatus} to ${newStatus}.`
  };
}

/**
 * Sent to a user when an interview is scheduled
 */
export function getInterviewScheduledEmailTemplate(userName: string, jobTitle: string, companyName: string, formattedDate: string, formattedTime: string, interviewMode: string, meetingLink: string): { subject: string; html: string; text: string } {
  return {
    subject: `Interview Scheduled: ${jobTitle} at ${companyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1>Interview Scheduled</h1>
        <p>Hi ${userName},</p>
        <p>Your interview for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> is scheduled for ${formattedDate} at ${formattedTime}.</p>
        <p><strong>Mode:</strong> ${interviewMode}</p>
        <p><strong>Link:</strong> ${meetingLink}</p>
      </div>
    `,
    text: `Interview for ${jobTitle} at ${companyName} scheduled ${formattedDate} ${formattedTime} (${interviewMode}). Link: ${meetingLink}`
  };
}

/**
 * Reminder sent to a user ahead of a scheduled interview
 */
export function getInterviewReminderEmailTemplate(userName: string, jobTitle: string, companyName: string, formattedDate: string, formattedTime: string): { subject: string; html: string; text: string } {
  return {
    subject: `Reminder: Interview for ${jobTitle} at ${companyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1>Interview Reminder</h1>
        <p>Hi ${userName},</p>
        <p>This is a reminder that your interview for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> is on ${formattedDate} at ${formattedTime}.</p>
      </div>
    `,
    text: `Reminder: interview for ${jobTitle} at ${companyName} on ${formattedDate} at ${formattedTime}.`
  };
}

/**
 * Sent to a user when an interview is cancelled
 */
export function getInterviewCancelledEmailTemplate(userName: string, jobTitle: string, companyName: string): { subject: string; html: string; text: string } {
  return {
    subject: `Interview Cancelled: ${jobTitle} at ${companyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1>Interview Cancelled</h1>
        <p>Hi ${userName},</p>
        <p>Your interview for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been cancelled.</p>
      </div>
    `,
    text: `Your interview for ${jobTitle} at ${companyName} has been cancelled.`
  };
}

/**
 * Sent to a user after they upload a resume
 */
export function getResumeUploadEmailTemplate(userName: string, resumeName: string): { subject: string; html: string; text: string } {
  return {
    subject: `Resume Uploaded: ${resumeName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1>Resume Uploaded</h1>
        <p>Hi ${userName},</p>
        <p>Your resume <strong>${resumeName}</strong> has been uploaded successfully.</p>
      </div>
    `,
    text: `Hi ${userName}, your resume ${resumeName} has been uploaded successfully.`
  };
}

/**
 * Sent to a user after they update a resume
 */
export function getResumeUpdateEmailTemplate(userName: string, resumeName: string): { subject: string; html: string; text: string } {
  return {
    subject: `Resume Updated: ${resumeName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1>Resume Updated</h1>
        <p>Hi ${userName},</p>
        <p>Your resume <strong>${resumeName}</strong> has been updated successfully.</p>
      </div>
    `,
    text: `Hi ${userName}, your resume ${resumeName} has been updated successfully.`
  };
}

/**
 * Sent to a user with their ATS resume-match analysis results
 */
export function getATSAnalysisEmailTemplate(userName: string, resumeName: string, matchPercentage: number, suggestions: string[]): { subject: string; html: string; text: string } {
  const suggestionsHtml = suggestions.map(s => `<li>${s}</li>`).join("");
  return {
    subject: `ATS Analysis Complete: ${resumeName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1>ATS Analysis Complete</h1>
        <p>Hi ${userName},</p>
        <p>Your resume <strong>${resumeName}</strong> scored <strong>${matchPercentage}%</strong> match.</p>
        <ul>${suggestionsHtml}</ul>
      </div>
    `,
    text: `Hi ${userName}, ${resumeName} scored ${matchPercentage}% match. Suggestions: ${suggestions.join("; ")}`
  };
}

/**
 * Notification when a job source is updated
 */
export function getSourceUpdatedEmailTemplate(sourceName: string, sourceType: string, updatedAt: string): { subject: string; html: string; text: string } {
  return {
    subject: `Source Updated: ${sourceName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1>Source Updated</h1>
        <p><strong>Source Name:</strong> ${sourceName}</p>
        <p><strong>Source Type:</strong> ${sourceType}</p>
        <p><strong>Updated At:</strong> ${updatedAt}</p>
      </div>
    `,
    text: `Source ${sourceName} (${sourceType}) updated at ${updatedAt}`
  };
}

/**
 * Notification when a job source is deleted
 */
export function getSourceDeletedEmailTemplate(sourceName: string, sourceType: string, deletedAt: string): { subject: string; html: string; text: string } {
  return {
    subject: `Source Deleted: ${sourceName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1>Source Deleted</h1>
        <p><strong>Source Name:</strong> ${sourceName}</p>
        <p><strong>Source Type:</strong> ${sourceType}</p>
        <p><strong>Deleted At:</strong> ${deletedAt}</p>
      </div>
    `,
    text: `Source ${sourceName} (${sourceType}) deleted at ${deletedAt}`
  };
}

/**
 * Notification when a job source is enabled
 */
export function getSourceEnabledEmailTemplate(sourceName: string, sourceType: string, enabledAt: string): { subject: string; html: string; text: string } {
  return {
    subject: `Source Enabled: ${sourceName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1>Source Enabled</h1>
        <p><strong>Source Name:</strong> ${sourceName}</p>
        <p><strong>Source Type:</strong> ${sourceType}</p>
        <p><strong>Enabled At:</strong> ${enabledAt}</p>
      </div>
    `,
    text: `Source ${sourceName} (${sourceType}) enabled at ${enabledAt}`
  };
}

/**
 * Notification when a job source is disabled
 */
export function getSourceDisabledEmailTemplate(sourceName: string, sourceType: string, disabledAt: string): { subject: string; html: string; text: string } {
  return {
    subject: `Source Disabled: ${sourceName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1>Source Disabled</h1>
        <p><strong>Source Name:</strong> ${sourceName}</p>
        <p><strong>Source Type:</strong> ${sourceType}</p>
        <p><strong>Disabled At:</strong> ${disabledAt}</p>
      </div>
    `,
    text: `Source ${sourceName} (${sourceType}) disabled at ${disabledAt}`
  };
}

/**
 * Notification to admin when someone logs into the admin panel
 */
export function getAdminLoginEmailTemplate(fullName: string, loginTime: string, email: string, userId: string, ipAddress: string, userAgent: string, loginType: string): { subject: string; html: string; text: string } {
  return {
    subject: `Admin Login: ${fullName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1>Admin Login</h1>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>User ID:</strong> ${userId}</p>
        <p><strong>Login Type:</strong> ${loginType}</p>
        <p><strong>Login Time:</strong> ${loginTime}</p>
        <p><strong>IP Address:</strong> ${ipAddress}</p>
        <p><strong>User Agent:</strong> ${userAgent}</p>
      </div>
    `,
    text: `${fullName} (${email}) logged in at ${loginTime} from ${ipAddress}`
  };
}

/**
 * Notification to admin when an unhandled system error occurs
 */
export function getSystemErrorEmailTemplate(errorMessage: string, timestamp: string, path: string): { subject: string; html: string; text: string } {
  return {
    subject: `System Error at ${path}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1>System Error</h1>
        <p><strong>Path:</strong> ${path}</p>
        <p><strong>Time:</strong> ${timestamp}</p>
        <p><strong>Error:</strong> ${errorMessage}</p>
      </div>
    `,
    text: `System error at ${path} (${timestamp}): ${errorMessage}`
  };
}

/**
 * Notification to admin when a new user signs up
 */
export function getAdminNewUserEmailTemplate(userName: string, userEmail: string, timestamp: string): { subject: string; html: string; text: string } {
  return {
    subject: `New User Registration: ${userName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1>New User Registration</h1>
        <p><strong>Name:</strong> ${userName}</p>
        <p><strong>Email:</strong> ${userEmail}</p>
        <p><strong>Registration Time:</strong> ${timestamp}</p>
      </div>
    `,
    text: `New user registered: ${userName} (${userEmail}) at ${timestamp}`
  };
}

/**
 * Daily summary sent to admin with key platform stats
 */
export function getDailySummaryEmailTemplate(dateLabel: string, stats: { newUsers: number; activeUsers: number; jobsImported: number; applications: number; interviews: number; resumeUploads: number; atsAnalysis: number; successRate: string }): { subject: string; html: string; text: string } {
  return {
    subject: `Daily Summary: ${dateLabel}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1>Daily Summary — ${dateLabel}</h1>
        <ul>
          <li>New Users: ${stats.newUsers}</li>
          <li>Active Users: ${stats.activeUsers}</li>
          <li>Jobs Imported: ${stats.jobsImported}</li>
          <li>Applications: ${stats.applications}</li>
          <li>Interviews: ${stats.interviews}</li>
          <li>Resume Uploads: ${stats.resumeUploads}</li>
          <li>ATS Analyses: ${stats.atsAnalysis}</li>
          <li>Success Rate: ${stats.successRate}</li>
        </ul>
      </div>
    `,
    text: `Daily Summary ${dateLabel}: newUsers=${stats.newUsers}, activeUsers=${stats.activeUsers}, jobsImported=${stats.jobsImported}, applications=${stats.applications}, interviews=${stats.interviews}, resumeUploads=${stats.resumeUploads}, atsAnalysis=${stats.atsAnalysis}, successRate=${stats.successRate}`
  };
}