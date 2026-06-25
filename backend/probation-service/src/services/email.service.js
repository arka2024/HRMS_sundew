/**
 * Email Notification Service
 * Handles sending emails for all system events
 */

export class EmailService {
  constructor() {
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@hrms-sundew.com';
  }

  async sendEmail(to, subject, body) {
    try {
      // In a production environment, you'd use a service like SendGrid, Mailgun, etc.
      // For now, we'll just log the email to console
      console.log('\n=== Email Sent ===');
      console.log(`From: ${this.fromEmail}`);
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log('Body:');
      console.log(body);
      console.log('==================\n');
      
      return { success: true };
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error('Email sending failed');
    }
  }

  async sendManagerCreated(manager) {
    const subject = 'Manager Account Created';
    const body = `
Hi ${manager.managerName},

Your manager account has been created successfully!

Manager ID: ${manager.managerId}
Department: ${manager.department}

Please login to your account.

Best regards,
HRMS Sundew Team
    `;
    return this.sendEmail(manager.email, subject, body);
  }

  async sendAssociateCreated(associate, managerEmail) {
    const subject = 'Associate Account Created';
    const body = `
Hi ${associate.employeeName},

Your associate account has been created successfully!

Employee Number: ${associate.employeeNumber}
Department: ${associate.department}
Manager ID: ${associate.managerId}

Best regards,
HRMS Sundew Team
    `;
    return this.sendEmail(managerEmail, subject, body);
  }

  async sendEvaluationAssigned(employeeName, managerEmail, evaluationPeriod) {
    const subject = 'New Evaluation Assigned';
    const body = `
Hi Manager,

A new evaluation has been assigned for ${employeeName} for period ${evaluationPeriod}.

Please complete the evaluation as soon as possible.

Best regards,
HRMS Sundew Team
    `;
    return this.sendEmail(managerEmail, subject, body);
  }

  async sendEvaluationSubmitted(employeeName, hrEmail, evaluationPeriod) {
    const subject = 'Evaluation Submitted';
    const body = `
Hi HR Team,

An evaluation for ${employeeName} for period ${evaluationPeriod} has been submitted and is ready for review.

Best regards,
HRMS Sundew Team
    `;
    return this.sendEmail(hrEmail, subject, body);
  }

  async sendUnlockRequested(employeeName, hrEmail, reason, evaluationPeriod) {
    const subject = 'Evaluation Unlock Requested';
    const body = `
Hi HR Team,

A request to unlock the evaluation for ${employeeName} (period ${evaluationPeriod}) has been received.

Reason: ${reason}

Please review and take action.

Best regards,
HRMS Sundew Team
    `;
    return this.sendEmail(hrEmail, subject, body);
  }

  async sendUnlockApproved(employeeName, managerEmail, evaluationPeriod) {
    const subject = 'Evaluation Unlock Approved';
    const body = `
Hi Manager,

Your request to unlock the evaluation for ${employeeName} (period ${evaluationPeriod}) has been approved.

You may now edit the evaluation.

Best regards,
HRMS Sundew Team
    `;
    return this.sendEmail(managerEmail, subject, body);
  }

  async sendUnlockRejected(employeeName, managerEmail, evaluationPeriod, rejectionReason) {
    const subject = 'Evaluation Unlock Rejected';
    const body = `
Hi Manager,

Your request to unlock the evaluation for ${employeeName} (period ${evaluationPeriod}) has been rejected.

Reason: ${rejectionReason}

Best regards,
HRMS Sundew Team
    `;
    return this.sendEmail(managerEmail, subject, body);
  }

  async sendProbationExtensionRequested(employeeName, hrEmail, durationMonths, reason) {
    const subject = 'Probation Extension Requested';
    const body = `
Hi HR Team,

A request for probation extension for ${employeeName} has been submitted.

Duration: ${durationMonths} months
Reason: ${reason}

Please review and take action.

Best regards,
HRMS Sundew Team
    `;
    return this.sendEmail(hrEmail, subject, body);
  }

  async sendProbationExtensionApproved(employeeName, managerEmail, durationMonths) {
    const subject = 'Probation Extension Approved';
    const body = `
Hi Manager,

The probation extension for ${employeeName} has been approved.

Extension Duration: ${durationMonths} months

Best regards,
HRMS Sundew Team
    `;
    return this.sendEmail(managerEmail, subject, body);
  }

  async sendProbationExtensionRejected(employeeName, managerEmail, rejectionReason) {
    const subject = 'Probation Extension Rejected';
    const body = `
Hi Manager,

The probation extension for ${employeeName} has been rejected.

Reason: ${rejectionReason}

Best regards,
HRMS Sundew Team
    `;
    return this.sendEmail(managerEmail, subject, body);
  }

  async sendProbationExtended(employeeName, employeeEmail, durationMonths) {
    const subject = 'Your Probation Period Has Been Extended';
    const body = `
Hi ${employeeName},

Your probation period has been extended by ${durationMonths} months.

Please contact your manager for more details.

Best regards,
HRMS Sundew Team
    `;
    return this.sendEmail(employeeEmail, subject, body);
  }
}

export const emailService = new EmailService();
