/**
 * NAYANEETI Privacy & Sensitive PII Masking Utilities
 * Follows Digital Personal Data Protection (DPDP) Act 2023 & UIDAI Guidelines
 */

export function maskAadhaar(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 4) return 'XXXX-XXXX-XXXX';
  const last4 = digits.slice(-4);
  return `XXXX-XXXX-${last4}`;
}

export function maskIdNumber(docType: string, raw: string): string {
  if (!raw) return '';
  const clean = raw.trim();
  if (clean.length <= 4) return 'XXXX';
  
  if (docType.toLowerCase().includes('aadhaar')) {
    return maskAadhaar(clean);
  }
  
  // For Voter ID, Passport, DL: show last 4 chars, mask rest
  const last4 = clean.slice(-4);
  const maskedPrefix = 'X'.repeat(Math.min(clean.length - 4, 8));
  return `${maskedPrefix}-${last4}`;
}

export function generateAdminEmailContent(params: {
  applicantName: string;
  role: 'lawyer' | 'client';
  documentType: string;
  maskedIdNumber?: string;
  barCouncilId?: string;
  requestId: string;
}) {
  const subject = `[NAYANEETI Action Required] Verify ${params.role === 'lawyer' ? 'Advocate' : 'Citizen'}: ${params.applicantName}`;
  const body = `Dear NAYANEETI Administrator,

A new verification request has been submitted and is pending your manual approval.

Applicant Details:
------------------------------------------
Name: ${params.applicantName}
Role: ${params.role.toUpperCase()}
Document Type: ${params.documentType}
${params.maskedIdNumber ? `ID Number (Masked): ${params.maskedIdNumber}\n` : ''}${params.barCouncilId ? `Bar Council Enrollment: ${params.barCouncilId}\n` : ''}Request ID: ${params.requestId}
Submitted At: ${new Date().toLocaleString()}

Direct Decision Actions:
------------------------------------------
Approve:
https://nyaay-legal-app-f6e99.web.app/?adminAction=approve&reqId=${params.requestId}

Reject / Request Resubmission:
https://nyaay-legal-app-f6e99.web.app/?adminAction=reject&reqId=${params.requestId}

Or review inside the NAYANEETI Admin Dashboard at https://nyaay-legal-app-f6e99.web.app

--
NAYANEETI Legal Operating System (Autonomous Verification Pipeline)`;

  return {
    subject: encodeURIComponent(subject),
    body: encodeURIComponent(body),
    rawSubject: subject,
    rawBody: body,
  };
}
