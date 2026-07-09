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
          <p>The source is now active and will participate in job imports according to its schedule.</p>
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

Details:
- Source Name: ${sourceName}
- Source Type: ${sourceType}
- Added At: ${addedAt}
- Status: Active

The source is now active and will participate in job imports according to its schedule.

----------------------------------------
© ${new Date().getFullYear()} Vishnu's Job Quest. All rights reserved.
This is an automated message, please do not reply.
    `
  };
}

/**
 * Notification for source updated
 */
export function getSourceUpdatedEmailTemplate(sourceName: string, sourceType: string, updatedAt: string): { subject: string; html: string; text: string } {
  return {
    subject: `Source Updated: ${sourceName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <style>
          .container { line-height: 1.6; color: #333; }
          .header { color: #2c3e50; border-bottom: 2px solid #f39c12; padding-bottom: 10px; }
          .content { margin: 20px 0; }
          .info-box { background-color: #fdebd0; border: 1px solid #f5cba7; border-radius: 4px; padding: 15px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #7f8c8d; }
        </style>
        <div class="container">
          <div class="header">
            <h1>Source Updated</h1>
          </div>
          <p>An existing job source has been updated:</p>
          <div class="info-box">
            <p><strong>Source Name:</strong> ${sourceName}</p>
            <p><strong>Source Type:</strong> ${sourceType}</p>
            <p><strong>Updated At:</strong> ${updatedAt}</p>
          </div>
          <p>The changes have been saved and will take effect immediately.</p>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Vishnu's Job Quest. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </div>
    `,
    text: `
Source Updated: ${sourceName}

An existing job source has been updated:

Details:
- Source Name: ${sourceName}
- Source Type: ${sourceType}
- Updated At: ${updatedAt}

The changes have been saved and will take effect immediately.

----------------------------------------
© ${new Date().getFullYear()} Vishnu's Job Quest. All rights reserved.
This is an automated message, please do not reply.
    `
  };
}

/**
 * Notification for source disabled
 */
export function getSourceDisabledEmailTemplate(sourceName: string, sourceType: string, disabledAt: string): { subject: string; html: string; text: string } {
  return {
    subject: `Source Disabled: ${sourceName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <style>
          .container { line-height: 1.6; color: #333; }
          .header { color: #2c3e50; border-bottom: 2px solid #e74c3c; padding-bottom: 10px; }
          .content { margin: 20px 0; }
          .notice-box { background-color: #fadbd8; border: 1px solid #d5a6a6; border-radius: 4px; padding: 20px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #7f8c8d; }
        </style>
        <div class="container">
          <div class="header">
            <h1>Source Disabled</h1>
          </div>
          <p>The following job source has been disabled:</p>
          <div class="notice-box">
            <p><strong>Source Name:</strong> ${sourceName}</p>
            <p><strong>Source Type:</strong> ${sourceType}</p>
            <p><strong>Disabled At:</strong> ${disabledAt}</p>
          </div>
          <p>Disabled sources will not participate in job imports until they are re-enabled.</p>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Vishnu's Job Quest. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </div>
    `,
    text: `
Source Disabled: ${sourceName}

The following job source has been disabled:

Details:
- Source Name: ${sourceName}
- Source Type: ${sourceType}
- Disabled At: ${disabledAt}

Disabled sources will not participate in job imports until they are re-enabled.

----------------------------------------
© ${new Date().getFullYear()} Vishnu's Job Quest. All rights reserved.
This is an automated message, please do not reply.
    `
  };
}

/**
 * Notification for source enabled
 */
export function getSourceEnabledEmailTemplate(sourceName: string, sourceType: string, enabledAt: string): { subject: string; html: string; text: string } {
  return {
    subject: `Source Enabled: ${sourceName}`,
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
            <h1>Source Enabled</h1>
          </div>
          <p>The following job source has been enabled:</p>
          <div class="info-box">
            <p><strong>Source Name:</strong> ${sourceName}</p>
            <p><strong>Source Type:</strong> ${sourceType}</p>
            <p><strong>Enabled At:</strong> ${enabledAt}</p>
          </div>
          <p>Enabled sources will participate in job imports according to their schedule.</p>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Vishnu's Job Quest. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </div>
    `,
    text: `
Source Enabled: ${sourceName}

The following job source has been enabled:

Details:
- Source Name: ${sourceName}
- Source Type: ${sourceType}
- Enabled At: ${enabledAt}

Enabled sources will participate in job imports according to their schedule.

----------------------------------------
© ${new Date().getFullYear()} Vishnu's Job Quest. All rights reserved.
This is an automated message, please do not reply.
    `
  };
}

/**
 * Notification for source deleted
 */
export function getSourceDeletedEmailTemplate(sourceName: string, sourceType: string, deletedAt: string): { subject: string; html: string; text: string } {
  return {
    subject: `Source Deleted: ${sourceName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <style>
          .container { line-height: 1.6; color: #333; }
          .header { color: #2c3e50; border-bottom: 2px solid #e74c3c; padding-bottom: 10px; }
          .content { margin: 20px 0; }
          .notice-box { background-color: #fadbd8; border: 1px solid #d5a6a6; border-radius: 4px; padding: 20px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #7f8c8d; }
        </style>
        <div class="container">
          <div class="header">
            <h1>Source Deleted</h1>
          </div>
          <p>The following job source has been deleted:</p>
          <div class="notice-box">
            <p><strong>Source Name:</strong> ${sourceName}</p>
            <p><strong>Source Type:</strong> ${sourceType}</p>
            <p><strong>Deleted At:</strong> ${deletedAt}</p>
          </div>
          <p>This action cannot be undone. To use this source again, it will need to be re-added.</p>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Vishnu's Job Quest. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </div>
    `,
    text: `
Source Deleted: ${sourceName}

The following job source has been deleted:

Details:
- Source Name: ${sourceName}
- Source Type: ${sourceType}
- Deleted At: ${deletedAt}

This action cannot be undone. To use this source again, it will need to be re-added.

----------------------------------------
© ${new Date().getFullYear()} Vishnu's Job Quest. All rights reserved.
This is an automated message, please do not reply.
    `
  };
}

/**
 * Daily summary email
 */
export function getDailySummaryEmailTemplate(date: string, stats: any): { subject: string; html: string; text: string } {
  return {
    subject: `Daily Summary: ${date}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <style>
          .container { line-height: 1.6; color: #333; }
          .header { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
          .content { margin: 20px 0; }
          .stats-container { display: flex; flex-wrap: wrap; gap: 20px; margin: 20px 0; }
          .stat-card { background-color: #f8f9fa; border: 1px solid #eee; border-radius: 4px; padding: 15px; flex: 1; min-width: 120px; text-align: center; }
          .stat-value { font-size: 24px; font-weight: bold; color: #2c3e50; display: block; }
          .stat-label { font-size: 14px; color: #7f8c8d; margin-top: 5px; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #7f8c8d; }
        </style>
        <div class="container">
          <div class="header">
            <h1>Daily Summary</h1>
          </div>
          <p>Here's your daily summary for ${date}:</p>
          <div class="content">
            <div class="stats-container">
              <div class="stat-card">
                <span class="stat-value">${stats.newUsers || 0}</span>
                <span class="stat-label">New Users</span>
              </div>
              <div class="stat-card">
                <span class="stat-value">${stats.activeUsers || 0}</span>
                <span class="stat-label">Active Users</span>
              </div>
              <div class="stat-card">
                <span class="stat-value">${stats.jobsImported || 0}</span>
                <span class="stat-label">Jobs Imported</span>
              </div>
              <div class="stat-card">
                <span class="stat-value">${stats.applications || 0}</span>
                <span class="stat-label">Applications</span>
              </div>
              <div class="stat-card">
                <span class="stat-value">${stats.interviews || 0}</span>
                <span class="stat-label">Interviews Scheduled</span>
              </div>
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Vishnu's Job Quest. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </div>
    `,
    text: `
Daily Summary: ${date}

Here's your daily summary for ${date}:

Statistics:
- New Users: ${stats.newUsers || 0}
- Active Users: ${stats.activeUsers || 0}
- Jobs Imported: ${stats.jobsImported || 0}
- Applications: ${stats.applications || 0}
- Interviews Scheduled: ${stats.interviews || 0}

----------------------------------------
© ${new Date().getFullYear()} Vishnu's Job Quest. All rights reserved.
This is an automated message, please do not reply.
    `
  };
}

/**
 * System error notification
 */
export function getSystemErrorEmailTemplate(errorMessage: string, occurredAt: string, service: string): { subject: string; html: string; text: string } {
  return {
    subject: `System Error Alert: ${service}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <style>
          .container { line-height: 1.6; color: #333; }
          .header { color: #2c3e50; border-bottom: 2px solid #e74c3c; padding-bottom: 10px; }
          .content { margin: 20px 0; }
          .error-box { background-color: #fadbd8; border: 1px solid #d5a6a6; border-radius: 4px; padding: 20px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #7f8c8d; }
          .error-text { color: #e74c3c; font-weight: bold; }
          .service-text { color: #e74c3c; font-weight: bold; }
        </style>
        <div class="container">
          <div class="header">
            <h1>System Error Alert</h1>
          </div>
          <p>A system error has occurred in the Vishnu's Job Quest platform:</p>
          <div class="error-box">
            <p><strong>Service:</strong> <span class="service-text">${service}</span></p>
            <p><strong>Occurred At:</strong> ${occurredAt}</p>
            <p><strong>Error Message:</strong> <span class="error-text">${errorMessage}</span></p>
          </div>
          <p>Please investigate and resolve this issue as soon as possible.</p>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Vishnu's Job Quest. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </div>
    `,
    text: `
System Error Alert: ${service}

A system error has occurred in the Vishnu's Job Quest platform:

Details:
- Service: ${service}
- Occurred At: ${occurredAt}
- Error Message: ${errorMessage}

Please investigate and resolve this issue as soon as possible.

----------------------------------------
© ${new Date().getFullYear()} Vishnu's Job Quest. All rights reserved.
This is an automated message, please do not reply.
    `
  };
}

/**
 * Application confirmation email
 */
export function getApplicationConfirmationEmailTemplate(userName: string, jobTitle: string, companyName: string, appliedDate: string): { subject: string; html: string; text: string } {
  return {
    subject: `Application Confirmed: ${jobTitle} at ${companyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <style>
          .container { line-height: 1.6; color: #333; }
          .header { color: #2c3e50; border-bottom: 2px solid #2ecc71; padding-bottom: 10px; }
          .content { margin: 20px 0; }
          .info-box { background-color: #d4efdf; border: 1px solid #a9dfbf; border-radius: 4px; padding: 15px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #7f8c8d; }
          .highlight { color: #27ae60; font-weight: bold; }
        </style>
        <div class="container">
          <div class="header">
            <h1>Application Confirmed!</h1>
          </div>
          <p>Hello ${userName},</p>
          <p>Your application has been successfully submitted!</p>
          <div class="info-box">
            <p><strong>Position:</strong> <span class="highlight">${jobTitle}</span></p>
            <p><strong>Company:</strong> <span class="highlight">${companyName}</span></p>
            <p><strong>Applied On:</strong> ${appliedDate}</p>
            <p><strong>Status:</strong> <span class="highlight">Application Submitted</span></p>
          </div>
          <p>Our team will review your application and get back to you soon.</p>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Vishnu's Job Quest. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </div>
    `,
    text: `
Application Confirmed: ${jobTitle} at ${companyName}

Hello ${userName},

Your application has been successfully submitted!

Details:
- Position: ${jobTitle}
- Company: ${companyName}
- Applied On: ${appliedDate}
- Status: Application Submitted

Our team will review your application and get back to you soon.

----------------------------------------
© ${new Date().getFullYear()} Vishnu's Job Quest. All rights reserved.
This is an automated message, please do not reply.
    `
  };
}

/**
 * Application status update email
 */
export function getApplicationStatusUpdateEmailTemplate(userName: string, jobTitle: string, companyName: string, status: string, updatedAt: string): { subject: string; html: string; text: string } {
  return {
    subject: `Application Status Update: ${jobTitle} at ${companyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <style>
          .container { line-height: 1.6; color: #333; }
          .header { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
          .content { margin: 20px 0; }
          .info-box { background-color: #ebf5fb; border: 1px solid #aed6f1; border-radius: 4px; padding: 15px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #7f8c8d; }
          .status-update { color: #2980b9; font-weight: bold; }
        </style>
        <div class="container">
          <div class="header">
            <h1>Application Status Update</h1>
          </div>
          <p>Hello ${userName},</p>
          <p>There's an update on your application for the position of ${jobTitle} at ${companyName}:</p>
          <div class="info-box">
            <p><strong>Position:</strong> ${jobTitle}</p>
            <p><strong>Company:</strong> ${companyName}</p>
            <p><strong>Status:</strong> <span class="status-update">${status}</span></p>
            <p><strong>Updated On:</strong> ${updatedAt}</p>
          </div>
          <p>You can view more details in your dashboard.</p>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Vishnu's Job Quest. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </div>
    `,
    text: `
Application Status Update: ${jobTitle} at ${companyName}

Hello ${userName},

There's an update on your application for the position of ${jobTitle} at ${companyName}:

Details:
- Position: ${jobTitle}
- Company: ${companyName}
- Status: ${status}
- Updated On: ${updatedAt}

You can view more details in your dashboard.

----------------------------------------
© ${new Date().getFullYear()} Vishnu's Job Quest. All rights reserved.
This is an automated message, please do not reply.
    `
  };
}

/**
 * Interview scheduled email
 */
export function getInterviewScheduledEmailTemplate(userName: string, jobTitle: string, companyName: string, interviewDate: string, interviewTime: string, interviewType: string): { subject: string; html: string; text: string } {
  return {
    subject: `Interview Scheduled: ${jobTitle} at ${companyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <style>
          .container { line-height: 1.6; color: #333; }
          .header { color: #2c3e50; border-bottom: 2px solid #9b59b6; padding-bottom: 10px; }
          .content { margin: 20px 0; }
          .info-box { background-color: #f4ecf7; border: 1px solid #d7bde2; border-radius: 4px; padding: 20px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #7f8c8d; }
          .interview-info { color: #8e44ad; font-weight: bold; }
        </style>
        <div class="container">
          <div class="header">
            <h1>Interview Scheduled!</h1>
          </div>
          <p>Hello ${userName},</p>
          <p>Congratulations! Your interview has been scheduled.</p>
          <div class="info-box">
            <p><strong>Position:</strong> ${jobTitle}</p>
            <p><strong>Company:</strong> ${companyName}</p>
            <p><strong>Interview Type:</strong> <span class="interview-info">${interviewType}</span></p>
            <p><strong>Date:</strong> ${interviewDate}</p>
            <p><strong>Time:</strong> ${interviewTime}</p>
          </div>
          <p>Please make sure to be ready 10 minutes before the scheduled time.</p>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Vishnu's Job Quest. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </div>
    `,
    text: `
Interview Scheduled: ${jobTitle} at ${companyName}

Hello ${userName},

Congratulations! Your interview has been scheduled.

Details:
- Position: ${jobTitle}
- Company: ${companyName}
- Interview Type: ${interviewType}
- Date: ${interviewDate}
- Time: ${interviewTime}

Please make sure to be ready 10 minutes before the scheduled time.

----------------------------------------
© ${new Date().getFullYear()} Vishnu's Job Quest. All rights reserved.
This is an automated message, please do not reply.
    `
  };
}

/**
 * Interview reminder email
 */
export function getInterviewReminderEmailTemplate(userName: string, jobTitle: string, companyName: string, interviewDate: string, interviewTime: string, interviewType: string): { subject: string; html: string; text: string } {
  return {
    subject: `Interview Reminder: ${jobTitle} at ${companyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <style>
          .container { line-height: 1.6; color: #333; }
          .header { color: #2c3e50; border-bottom: 2px solid #e67e22; padding-bottom: 10px; }
          .content { margin: 20px 0; }
          .info-box { background-color: #fdf2e9; border: 1px solid #d7bde2; border-radius: 4px; padding: 20px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #7f8c8d; }
          .reminder-text { color: #d35400; font-weight: bold; }
        </style>
        <div class="container">
          <div class="header">
            <h1>Interview Reminder</h1>
          </div>
          <p>Hello ${userName},</p>
          <p>This is a reminder about your upcoming interview:</p>
          <div class="info-box">
            <p><strong>Position:</strong> ${jobTitle}</p>
            <p><strong>Company:</strong> ${companyName}</p>
            <p><strong>Interview Type:</strong> <span class="reminder-text">${interviewType}</span></p>
            <p><strong>Date:</strong> ${interviewDate}</p>
            <p><strong>Time:</strong> ${interviewTime}</p>
          </div>
          <p>Please make sure to be ready 10 minutes before the scheduled time.</p>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Vishnu's Job Quest. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </div>
    `,
    text: `
Interview Reminder: ${jobTitle} at ${companyName}

Hello ${userName},

This is a reminder about your upcoming interview:

Details:
- Position: ${jobTitle}
- Company: ${companyName}
- Interview Type: ${interviewType}
- Date: ${interviewDate}
- Time: ${interviewTime}

Please make sure to be ready 10 minutes before the scheduled time.

----------------------------------------
© ${new Date().getFullYear()} Vishnu's Job Quest. All rights reserved.
This is an automated message, please do not reply.
    `
  };
}

/**
 * Interview cancelled email
 */
export function getInterviewCancelledEmailTemplate(userName: string, jobTitle: string, companyName: string, interviewDate: string, interviewTime: string, interviewType: string): { subject: string; html: string; text: string } {
  return {
    subject: `Interview Cancelled: ${jobTitle} at ${companyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <style>
          .container { line-height: 1.6; color: #333; }
          .header { color: #2c3e50; border-bottom: 2px solid #e74c3c; padding-bottom: 10px; }
          .content { margin: 20px 0; }
          .info-box { background-color: #fadbd8; border: 1px solid #d5a6a6; border-radius: 4px; padding: 15px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #7f8c8d; }
          .cancelled-text { color: #e74c3c; font-weight: bold; }
        </style>
        <div class="container">
          <div class="header">
            <h1>Interview Cancelled</h1>
          </div>
          <p>Hello ${userName},</p>
          <p>We regret to inform you that your interview has been cancelled.</p>
          <div class="info-box">
            <p><strong>Position:</strong> ${jobTitle}</p>
            <p><strong>Company:</strong> ${companyName}</p>
            <p><strong>Interview Type:</strong> <span class="cancelled-text">${interviewType}</span></p>
            <p><strong>Date:</strong> ${interviewDate}</p>
            <p><strong>Time:</strong> ${interviewTime}</p>
          </div>
          <p>Please check your dashboard for updates or contact support if you have any questions.</p>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Vishnu's Job Quest. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </div>
    `,
    text: `
Interview Cancelled: ${jobTitle} at ${companyName}

Hello ${userName},

We regret to inform you that your interview has been cancelled.

Details:
- Position: ${jobTitle}
- Company: ${companyName}
- Interview Type: ${interviewType}
- Date: ${interviewDate}
- Time: ${interviewTime}

Please check your dashboard for updates or contact support if you have any questions.

----------------------------------------
© ${new Date().getFullYear()} Vishnu's Job Quest. All rights reserved.
This is an automated message, please do not reply.
    `
  };
}

/**
 * Resume upload email
 */
export function getResumeUploadEmailTemplate(userName: string, fileName: string, uploadedAt: string): { subject: string; html: string; text: string } {
  return {
    subject: `Resume Uploaded Successfully`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <style>
          .container { line-height: 1.6; color: #333; }
          .header { color: #2c3e50; border-bottom: 2px solid #27ae60; padding-bottom: 10px; }
          .content { margin: 20px 0; }
          .info-box { background-color: #d5f5e3; border: 1px solid #a9dfbf; border-radius: 4px; padding: 15px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #7f8c8d; }
          .success-text { color: #27ae60; font-weight: bold; }
        </style>
        <div class="container">
          <div class="header">
            <h1>Resume Uploaded Successfully</h1>
          </div>
          <p>Hello ${userName},</p>
          <p>Your resume has been successfully uploaded to your profile.</p>
          <div class="info-box">
            <p><strong>File Name:</strong> ${fileName}</p>
            <p><strong>Uploaded At:</strong> ${uploadedAt}</p>
            <p><strong>Status:</strong> <span class="success-text">Upload Successful</span></p>
          </div>
          <p>Your resume is now ready to be used for job applications.</p>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Vishnu's Job Quest. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </div>
    `,
    text: `
Resume Uploaded Successfully

Hello ${userName},

Your resume has been successfully uploaded to your profile.

Details:
- File Name: ${fileName}
- Uploaded At: ${uploadedAt}
- Status: Upload Successful

Your resume is now ready to be used for job applications.

----------------------------------------
© ${new Date().getFullYear()} Vishnu's Job Quest. All rights reserved.
This is an automated message, please do not reply.
    `
  };
}

/**
 * Resume update email
 */
export function getResumeUpdateEmailTemplate(userName: string, fileName: string, updatedAt: string): { subject: string; html: string; text: string } {
  return {
    subject: `Resume Updated Successfully`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <style>
          .container { line-height: 1.6; color: #333; }
          .header { color: #2c3e50; border-bottom: 2px solid #27ae60; padding-bottom: 10px; }
          .content { margin: 20px 0; }
          .info-box { background-color: #d5f5e3; border: 1px solid #a9dfbf; border-radius: 4px; padding: 15px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #7f8c8d; }
          .success-text { color: #27ae60; font-weight: bold; }
        </style>
        <div class="container">
          <div class="header">
            <h1>Resume Updated Successfully</h1>
          </div>
          <p>Hello ${userName},</p>
          <p>Your resume has been successfully updated.</p>
          <div class="info-box">
            <p><strong>File Name:</strong> ${fileName}</p>
            <p><strong>Updated At:</strong> ${updatedAt}</p>
            <p><strong>Status:</strong> <span class="success-text">Update Successful</span></p>
          </div>
          <p>Your resume is now ready to be used for job applications.</p>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Vishnu's Job Quest. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </div>
    `,
    text: `
Resume Updated Successfully

Hello ${userName},

Your resume has been successfully updated.

Details:
- File Name: ${fileName}
- Updated At: ${updatedAt}
- Status: Update Successful

Your resume is now ready to be used for job applications.

----------------------------------------
© ${new Date().getFullYear()} Vishnu's Job Quest. All rights reserved.
This is an automated message, please do not reply.
    `
  };
}

/**
 * ATS analysis email
 */
export function getATSAnalysisEmailTemplate(userName: string, jobTitle: string, companyName: string, matchPercentage: number, suggestions: string[]): { subject: string; html: string; text: string } {
  const suggestionsList = suggestions.map(s => `<li>${s}</li>`).join('');

  return {
    subject: `ATS Analysis Report: ${jobTitle} at ${companyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <style>
          .container { line-height: 1.6; color: #333; }
          .header { color: #2c3e50; border-bottom: 2px solid #f39c12; padding-bottom: 10px; }
          .content { margin: 20px 0; }
          .info-box { background-color: #fdebd0; border: 1px solid #f5cba7; border-radius: 4px; padding: 20px; margin: 20px 0; }
          .suggestions-list { margin: 15px 0; padding-left: 20px; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #7f8c8d; }
          .match-score { font-size: 24px; font-weight: bold; }
          .high { color: #27ae60; }
          .medium { color: #f39c12; }
          .low { color: #e74c3c; }
        </style>
        <div class="container">
          <div class="header">
            <h1>ATS Analysis Report</h1>
          </div>
          <p>Hello ${userName},</p>
          <p>Here's the ATS (Applicant Tracking System) analysis for your resume:</p>
          <div class="info-box">
            <p><strong>Position:</strong> ${jobTitle}</p>
            <p><strong>Company:</strong> ${companyName}</p>
            <p><strong>Match Score:</strong> <span class="match-score ${matchPercentage >= 80 ? 'high' : matchPercentage >= 60 ? 'medium' : 'low'}">${matchPercentage}%</span></p>
            ${suggestions.length > 0 ? `
            <p><strong>Suggestions for Improvement:</strong></p>
            <ul class="suggestions-list">
              ${suggestionsList}
            </ul>
            ` : ''}
          </div>
          <p>Improving your ATS score can increase your chances of getting noticed by recruiters.</p>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Vishnu's Job Quest. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </div>
    `,
    text: `
ATS Analysis Report: ${jobTitle} at ${companyName}

Hello ${userName},

Here's the ATS (Applicant Tracking System) analysis for your resume:

Details:
- Position: ${jobTitle}
- Company: ${companyName}
- Match Score: ${matchPercentage}%
${suggestions.length > 0 ? `
Suggestions for Improvement:
${suggestions.map(s => `- ${s}`).join('\n')
}` : ''}

Improving your ATS score can increase your chances of getting noticed by recruiters.

----------------------------------------
© ${new Date().getFullYear()} Vishnu's Job Quest. All rights reserved.
This is an automated message, please do not reply.
    `
  };
}

/**
 * Welcome email
 */
export function getWelcomeEmailTemplate(userName: string): { subject: string; html: string; text: string } {
  return {
    subject: `Welcome to Vishnu's Job Quest, ${userName}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <style>
          .container { line-height: 1.6; color: #333; }
          .header { color: #2c3e50; border-bottom: 2px solid #2ecc71; padding-bottom: 10px; }
          .content { margin: 20px 0; }
          .info-box { background-color: #d4efdf; border: 1px solid #a9dfbf; border-radius: 4px; padding: 20px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #7f8c8d; }
          .highlight { color: #27ae60; font-weight: bold; }
        </style>
        <div class="container">
          <div class="header">
            <h1>Welcome to Vishnu's Job Quest!</h1>
          </div>
          <p>Hello ${userName},</p>
          <p>Welcome to Vishnu's Job Quest - your ultimate job search companion!</p>
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
          <p>Get started by completing your profile and uploading your resume.</p>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Vishnu's Job Quest. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </div>
    `,
    text: `
Welcome to Vishnu's Job Quest, ${userName}!

Hello ${userName},

Welcome to Vishnu's Job Quest - your ultimate job search companion!

Welcome Benefits:
- Access to thousands of job listings from top companies
- Resume building and optimization tools
- Application tracking and management
- Interview scheduling and reminders
- Career resources and advice

Get started by completing your profile and uploading your resume.

----------------------------------------
© ${new Date().getFullYear()} Vishnu's Job Quest. All rights reserved.
This is an automated message, please do not reply.
    `
  };
}

/**
 * Login email
 */
/**
 * Password reset email
 */
export function getPasswordResetEmailTemplate(userName: string, resetUrl: string): { subject: string; html: string; text: string } {
  return {
    subject: `Reset Your Password - Vishnu's Job Quest`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <style>
          .container { line-height: 1.6; color: #333; }
          .header { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
          .button { display: inline-block; background-color: #3498db; color: #fff; padding: 12px 24px; border-radius: 4px; text-decoration: none; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #7f8c8d; }
        </style>
        <div class="container">
          <div class="header">
            <h1>Reset Your Password</h1>
          </div>
          <p>Hello ${userName},</p>
          <p>We received a request to reset your password for your Vishnu's Job Quest account. Click the button below to choose a new password. This link expires in 1 hour.</p>
          <p><a href="${resetUrl}" class="button">Reset Password</a></p>
          <p>If you didn't request this, you can safely ignore this email — your password will remain unchanged.</p>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Vishnu's Job Quest. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </div>
    `,
    text: `
Reset Your Password - Vishnu's Job Quest

Hello ${userName},

We received a request to reset your password. Visit the link below to choose a new password (expires in 1 hour):
${resetUrl}

If you didn't request this, you can safely ignore this email.

----------------------------------------
© ${new Date().getFullYear()} Vishnu's Job Quest. All rights reserved.
This is an automated message, please do not reply.
    `
  };
}

/**
 * Admin notification: new user signed up (currently unused elsewhere, kept for completeness)
 */
export function getAdminNewUserEmailTemplate(fullName: string, email: string, signedUpAt: string): { subject: string; html: string; text: string } {
  return {
    subject: `New User Signed Up - Vishnu's Job Quest`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p>A new user has signed up.</p>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Signed Up At:</strong> ${signedUpAt}</p>
      </div>
    `,
    text: `New User Signed Up - Vishnu's Job Quest\n\nName: ${fullName}\nEmail: ${email}\nSigned Up At: ${signedUpAt}`
  };
}

/**
 * Admin notification: a specific user logged in (currently unused elsewhere, kept for completeness)
 */
export function getAdminUserLoginEmailTemplate(fullName: string, email: string, loginTime: string): { subject: string; html: string; text: string } {
  return {
    subject: `User Login - Vishnu's Job Quest`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p>A user has logged in.</p>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Login Time:</strong> ${loginTime}</p>
      </div>
    `,
    text: `User Login - Vishnu's Job Quest\n\nName: ${fullName}\nEmail: ${email}\nLogin Time: ${loginTime}`
  };
}

/**
 * Admin login notification email
 */
export function getAdminLoginEmailTemplate(
  fullName: string,
  loginTime: string,
  email: string,
  userId: string,
  ip: string,
  userAgent: string,
  loginType: string
): { subject: string; html: string; text: string } {
  return {
    subject: `${loginType} Login Detected - Vishnu's Job Quest`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <style>
          .container { line-height: 1.6; color: #333; }
          .header { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
          .content { margin: 20px 0; }
          .info-box { background-color: #ebf5fb; border: 1px solid #aed6f1; border-radius: 4px; padding: 15px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #7f8c8d; }
        </style>
        <div class="container">
          <div class="header">
            <h1>${loginType} Login Detected</h1>
          </div>
          <p>A user has logged into Vishnu's Job Quest.</p>
          <div class="info-box">
            <p><strong>Name:</strong> ${fullName}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>User ID:</strong> ${userId}</p>
            <p><strong>Login Time:</strong> ${loginTime}</p>
            <p><strong>IP Address:</strong> ${ip}</p>
            <p><strong>User Agent:</strong> ${userAgent}</p>
            <p><strong>Login Type:</strong> ${loginType}</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Vishnu's Job Quest. All rights reserved.</p>
            <p>This is an automated admin notification.</p>
          </div>
        </div>
      </div>
    `,
    text: `
${loginType} Login Detected - Vishnu's Job Quest

A user has logged into Vishnu's Job Quest.

Details:
- Name: ${fullName}
- Email: ${email}
- User ID: ${userId}
- Login Time: ${loginTime}
- IP Address: ${ip}
- User Agent: ${userAgent}
- Login Type: ${loginType}

----------------------------------------
© ${new Date().getFullYear()} Vishnu's Job Quest. All rights reserved.
This is an automated admin notification.
    `
  };
}

/**
 * User-facing login notification email
 */
export function getLoginEmailTemplate(userName: string, loginTime: string, ipAddress: string): { subject: string; html: string; text: string } {
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
            <p><strong>Location:</strong> New Sign-in</p>
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
- Location: New Sign-in

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