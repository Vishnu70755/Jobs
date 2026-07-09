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