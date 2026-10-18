// Top Indian Legal Drafting Templates with intelligent variable placeholders
// Grounded in BNS 2023, BNSS 2023, CPC 1908, CrPC, and Negotiable Instruments Act 1881

export interface LegalTemplate {
  id: string;
  title: string;
  category: 'Notice' | 'Bail' | 'Civil Application' | 'Vakalatnama' | 'Pleading';
  description: string;
  statutoryReference: string;
  courtHierarchy: 'Supreme Court' | 'High Court' | 'District Court / Tribunal' | 'All Courts';
  placeholders: Array<{
    key: string;
    label: string;
    defaultValue?: string;
  }>;
  templateContent: string;
}

export const TOP_LEGAL_TEMPLATES: LegalTemplate[] = [
  {
    id: 's138-ni-notice',
    title: 'Statutory Demand Notice (Section 138 Negotiable Instruments Act)',
    category: 'Notice',
    description: 'Mandatory 15-day pre-litigation demand notice upon dishonour of cheque for insufficient funds / account closed.',
    statutoryReference: 'Section 138 read with Section 142 of Negotiable Instruments Act, 1881',
    courtHierarchy: 'District Court / Tribunal',
    placeholders: [
      { key: 'CLIENT_NAME', label: 'Complainant / Payee Name' },
      { key: 'OPPOSITE_PARTY', label: 'Accused / Drawer Name' },
      { key: 'OPPOSITE_ADDRESS', label: 'Drawer Complete Address' },
      { key: 'CHEQUE_NUMBER', label: 'Cheque Number', defaultValue: 'CHQ-849201' },
      { key: 'CHEQUE_DATE', label: 'Cheque Date', defaultValue: '12/10/2026' },
      { key: 'CHEQUE_AMOUNT', label: 'Cheque Amount (INR)', defaultValue: '5,00,000' },
      { key: 'BANK_NAME', label: 'Drawee Bank & Branch', defaultValue: 'State Bank of India, Main Branch' },
      { key: 'MEMO_DATE', label: 'Bank Return Memo Date', defaultValue: '15/10/2026' },
      { key: 'RETURN_REASON', label: 'Return Reason', defaultValue: 'Funds Insufficient' },
      { key: 'LAWYER_NAME', label: 'Advocate Name' },
      { key: 'LAWYER_OFFICE', label: 'Chambers Address' },
    ],
    templateContent: `LEGAL NOTICE UNDER SECTION 138 READ WITH SECTION 142 OF THE NEGOTIABLE INSTRUMENTS ACT, 1881

REGISTERED POST WITH A.D. / SPEED POST / LEGAL EMAIL

To,
{{OPPOSITE_PARTY}}
{{OPPOSITE_ADDRESS}}

Sir/Madam,

Under instructions and on behalf of my client {{CLIENT_NAME}}, I hereby serve upon you the following Statutory Legal Demand Notice:

1. That you, the Noticee, in discharge of your legally enforceable debt and subsisting liability towards my client, issued and handed over Cheque bearing No. {{CHEQUE_NUMBER}} dated {{CHEQUE_DATE}} for an amount of ₹{{CHEQUE_AMOUNT}}/- drawn on {{BANK_NAME}}.

2. That at the time of issuing the aforesaid Cheque, you expressly assured and represented to my client that the said Cheque would be honoured upon presentation for encashment.

3. That believing upon your solemn assurances, my client presented the said Cheque for clearing through their bankers. However, to the utter shock and dismay of my client, the said Cheque was returned dishonoured and unpaid vide Bank Return Memo dated {{MEMO_DATE}} with the endorsement "{{RETURN_REASON}}".

4. That by issuing a Cheque without maintaining sufficient balance or arrangements with your banker, you have committed an offence under Section 138 of the Negotiable Instruments Act, 1881, as well as offences under Section 318(4) of Bharatiya Nyaya Sanhita, 2023 (Cheating).

5. I therefore, through this Statutory Demand Notice, call upon you to make the payment of the entire Cheque amount of ₹{{CHEQUE_AMOUNT}}/- to my client within 15 (fifteen) days from the date of receipt of this notice.

6. PLEASE TAKE NOTE that in the event of your failure or neglect to pay the aforesaid amount within 15 days, my client shall be constrained to institute criminal proceedings against you under Section 138 read with Section 142 of the Negotiable Instruments Act, 1881 before the Competent Judicial Magistrate / Metropolitan Magistrate, entirely at your risk, costs, and consequences.

Dated this {{TODAY_DATE}} at {{COURT_LOCATION}}.

Yours faithfully,

{{LAWYER_NAME}}
Advocate & Legal Consultant
{{LAWYER_OFFICE}}`,
  },
  {
    id: 'cpc-order-39-injunction',
    title: 'Application for Temporary Injunction (Order XXXIX Rule 1 & 2 CPC)',
    category: 'Civil Application',
    description: 'Urgent interlocutory application seeking ad-interim ex-parte stay / injunction against dispossession, alienation, or structural demolition.',
    statutoryReference: 'Order XXXIX Rules 1 & 2 read with Section 151 of Code of Civil Procedure, 1908',
    courtHierarchy: 'District Court / Tribunal',
    placeholders: [
      { key: 'COURT_NAME', label: 'Court Name & Bench' },
      { key: 'CASE_NUMBER', label: 'Civil Suit Number' },
      { key: 'CLIENT_NAME', label: 'Plaintiff Name' },
      { key: 'OPPOSITE_PARTY', label: 'Defendant Name' },
      { key: 'PROPERTY_DESCRIPTION', label: 'Schedule Property Details', defaultValue: 'Plot No. 42, Sector 14, Commercial Hub' },
      { key: 'LAWYER_NAME', label: 'Advocate for Plaintiff' },
    ],
    templateContent: `IN THE COURT OF THE PRINCIPAL SENIOR CIVIL JUDGE / DISTRICT JUDGE AT {{COURT_NAME}}

CIVIL SUIT NO. {{CASE_NUMBER}}

IN THE MATTER OF:
{{CLIENT_NAME}}                                                      ... PLAINTIFF / APPLICANT
                              VERSUS
{{OPPOSITE_PARTY}}                                                  ... DEFENDANT / RESPONDENT

APPLICATION UNDER ORDER XXXIX RULES 1 & 2 READ WITH SECTION 151 OF THE CODE OF CIVIL PROCEDURE, 1908 FOR GRANT OF AD-INTERIM EX-PARTE TEMPORARY INJUNCTION

MOST RESPECTFULLY SHOWETH:

1. That the Plaintiff has instituted the accompanying suit for declaration of title, possession, and permanent injunction against the Defendant, the contents whereof may kindly be read as part and parcel of this application.

2. That the Plaintiff is the absolute, lawful, and registered owner in peaceful possession of the suit property described as: {{PROPERTY_DESCRIPTION}}.

3. That on recent dates, the Defendant along with their agents and associates attempted to forcefully dispossess the Plaintiff from the suit schedule property and threatened to create third-party interests / alienate the property illegally.

4. That the Plaintiff satisfies all three mandatory judicial parameters for the grant of injunction:
   a) PRIMA FACIE CASE: The Plaintiff possesses undisputed registered title deeds and lawful possession.
   b) BALANCE OF CONVENIENCE: The balance of convenience tilts overwhelmingly in favour of the Plaintiff as against the Defendant.
   c) IRREPARABLE INJURY: If the Defendant succeeds in changing the status quo or alienating the suit property, the Plaintiff shall suffer irreparable loss that cannot be compensated in monetary terms.

PRAYER:
Wherefore, it is most respectfully prayed that this Hon'ble Court may graciously be pleased to:
a) Pass an ad-interim ex-parte temporary injunction restraining the Defendant, their agents, servants, and representatives from entering upon, dispossessing, or alienating the suit schedule property {{PROPERTY_DESCRIPTION}} till the final disposal of the suit;
b) Pass such other and further orders as this Hon'ble Court may deem fit and proper in the interest of justice.

FILED BY:
{{LAWYER_NAME}}
Advocate for Plaintiff / Applicant
Date: {{TODAY_DATE}}`,
  },
  {
    id: 'bnss-anticipatory-bail',
    title: 'Anticipatory Bail Application (Section 482 BNSS / S.438 CrPC)',
    category: 'Bail',
    description: 'Pre-arrest bail petition before Sessions Court or High Court apprehending imminent arrest in non-bailable cognizable offense.',
    statutoryReference: 'Section 482 Bharatiya Nagarik Suraksha Sanhita, 2023 (formerly Section 438 CrPC)',
    courtHierarchy: 'High Court',
    placeholders: [
      { key: 'COURT_NAME', label: 'Court Name (Sessions / High Court)' },
      { key: 'CLIENT_NAME', label: 'Accused / Applicant Name' },
      { key: 'POLICE_STATION', label: 'Police Station & District', defaultValue: 'P.S. Cyber Crime, Central District' },
      { key: 'FIR_NUMBER', label: 'FIR Number & Year', defaultValue: 'FIR No. 204/2026' },
      { key: 'BNS_SECTIONS', label: 'Penal Sections Implicated', defaultValue: 'Sections 318(4), 316(2), 61(2) BNS, 2023' },
      { key: 'LAWYER_NAME', label: 'Advocate for Applicant' },
    ],
    templateContent: `IN THE COURT OF THE HON'BLE SESSIONS JUDGE / HIGH COURT OF JUDICATURE AT {{COURT_NAME}}

CRIMINAL MISCELLANEOUS (BAIL) APPLICATION NO. ________ OF {{TODAY_YEAR}}

IN THE MATTER OF:
{{CLIENT_NAME}}
S/o ________________, Aged about ___ years,
R/o __________________________________________                 ... ACCUSED / APPLICANT
                              VERSUS
STATE OF NCT / GOVERNMENT OF INDIA                           ... RESPONDENT

APPLICATION UNDER SECTION 482 OF THE BHARATIYA NAGARIK SURAKSHA SANHITA, 2023 (CORRESPONDING TO SECTION 438 CrPC) FOR GRANT OF ANTICIPATORY BAIL IN {{FIR_NUMBER}} REGISTERED AT {{POLICE_STATION}}

MOST RESPECTFULLY SHOWETH:

1. That the Applicant is a law-abiding citizen with deep roots in society, holding clean antecedents, and has never been convicted by any Court of Law.

2. That the Applicant has strong, bona fide apprehension of imminent arrest in connection with {{FIR_NUMBER}} registered at {{POLICE_STATION}} for alleged offences punishable under {{BNS_SECTIONS}}.

3. That the allegations levelled in the FIR are false, frivolous, fabricated, and motivated by commercial malice. No custodial interrogation of the Applicant is warranted as the entire dispute stems from documentary transactions.

4. That the Applicant undertakes to join and cooperate fully with the investigation as and when summoned by the Investigating Officer, and shall not tamper with evidence or influence any witness directly or indirectly.

5. That the Applicant is ready and willing to furnish solvent surety and adhere to all terms and conditions under Section 482(2) BNSS.

PRAYER:
It is therefore respectfully prayed that this Hon'ble Court may graciously be pleased to:
a) Direct that in the event of arrest in connection with {{FIR_NUMBER}} at {{POLICE_STATION}}, the Applicant {{CLIENT_NAME}} be released on anticipatory bail on such terms and conditions as this Hon'ble Court may deem fit;
b) Grant interim ad-interim protection from coercive action during the pendency of this application.

APPLICANT THROUGH COUNSEL:
{{LAWYER_NAME}}
Advocate for Applicant
Date: {{TODAY_DATE}}`,
  },
  {
    id: 'vakalatnama-standard',
    title: 'Standard Vakalatnama (Supreme Court / High Court / District Court)',
    category: 'Vakalatnama',
    description: 'Statutory authority letter empowering advocate to plead, act, compromise, and represent client in all judicial proceedings.',
    statutoryReference: 'Order III Rule 4 Code of Civil Procedure, 1908 & Advocates Act, 1961',
    courtHierarchy: 'All Courts',
    placeholders: [
      { key: 'COURT_NAME', label: 'Name of Court' },
      { key: 'CASE_NUMBER', label: 'Case / Petition Number' },
      { key: 'CLIENT_NAME', label: 'Principal / Client Name' },
      { key: 'OPPOSITE_PARTY', label: 'Opposite Party Name' },
      { key: 'LAWYER_NAME', label: 'Advocate Name' },
      { key: 'BAR_ENROLLMENT', label: 'Bar Council Enrollment Number', defaultValue: 'D/1482/2015' },
      { key: 'LAWYER_OFFICE', label: 'Office Address' },
    ],
    templateContent: `VAKALATNAMA
IN THE COURT OF {{COURT_NAME}}

CASE / SUIT / PETITION NO. {{CASE_NUMBER}}

IN THE MATTER OF:
{{CLIENT_NAME}}                                              ... PETITIONER / PLAINTIFF / APPELLANT
                              VERSUS
{{OPPOSITE_PARTY}}                                          ... RESPONDENT / DEFENDANT

KNOW ALL to whom these presents shall come that I/we, {{CLIENT_NAME}}, do hereby appoint, nominate, and constitute:

{{LAWYER_NAME}}
Advocate, Enrollment No. {{BAR_ENROLLMENT}}
Chambers: {{LAWYER_OFFICE}}

to be my/our Advocate in the above-captioned matter.

I/we authorize the said Advocate to:
1. Appear, plead, act, and conduct all proceedings in the said Court or any other Court to which the matter may be transferred;
2. Present and sign plaints, petitions, written statements, appeals, affidavits, execution petitions, applications, and documents;
3. Withdraw or compromise the suit, receive moneys, grant receipts, and adjust accounts;
4. Engage junior/senior counsel and instruct them on my behalf.

And I/we hereby agree to ratify and confirm all acts done by the said Advocate in connection with the said matter as if done by me/us personally.

IN WITNESS WHEREOF I/we have signed this Vakalatnama on this {{TODAY_DATE}}.

ACCEPTED:                                                    EXECUTANT / CLIENT:

________________________                                     ________________________
{{LAWYER_NAME}}                                              {{CLIENT_NAME}}
Advocate`,
  },
  {
    id: 'general-legal-demand-notice',
    title: 'Comprehensive Legal Notice (Breach of Contract & Money Recovery)',
    category: 'Notice',
    description: 'Pre-litigation legal notice demanding settlement of outstanding dues, damages for breach of contract, or performance within 15 days.',
    statutoryReference: 'Section 73 & 74 Indian Contract Act, 1872 & Section 34 CPC',
    courtHierarchy: 'All Courts',
    placeholders: [
      { key: 'CLIENT_NAME', label: 'Claimant / Client Name' },
      { key: 'OPPOSITE_PARTY', label: 'Defaulting Party Name' },
      { key: 'OPPOSITE_ADDRESS', label: 'Defaulting Party Address' },
      { key: 'AGREEMENT_DATE', label: 'Contract / Agreement Date', defaultValue: '15/01/2026' },
      { key: 'CLAIM_AMOUNT', label: 'Total Outstanding Claim (INR)', defaultValue: '12,50,000' },
      { key: 'INTEREST_RATE', label: 'Interest Rate per Annum', defaultValue: '18%' },
      { key: 'LAWYER_NAME', label: 'Advocate Name' },
      { key: 'LAWYER_OFFICE', label: 'Chambers Address' },
    ],
    templateContent: `BY SPEED POST WITH A.D. & REGISTERED EMAIL

To,
{{OPPOSITE_PARTY}}
{{OPPOSITE_ADDRESS}}

SUB: LEGAL NOTICE FOR PAYMENT OF ₹{{CLAIM_AMOUNT}}/- ALONG WITH ACCRUED INTEREST @ {{INTEREST_RATE}} P.A. ON ACCOUNT OF BREACH OF CONTRACT DATED {{AGREEMENT_DATE}}

Sir/Madam,

Under instructions and on behalf of my client {{CLIENT_NAME}}, I hereby serve upon you this Legal Notice:

1. That you entered into a valid and binding contract/agreement dated {{AGREEMENT_DATE}} with my client, whereby you explicitly agreed and undertook to perform contractual obligations and make timely payments against invoices raised.

2. That my client diligently, faithfully, and completely performed all their obligations thereunder to your complete satisfaction.

3. That despite receipt of benefits, invoices, and multiple written reminders, you have wrongfully, illegally, and without justification failed and neglected to remit the outstanding principal sum of ₹{{CLAIM_AMOUNT}}/-.

4. That on account of your deliberate default and breach of trust, my client has suffered substantial financial loss, hardship, and loss of business opportunities.

5. I therefore call upon you to pay the said sum of ₹{{CLAIM_AMOUNT}}/- together with interest calculated at {{INTEREST_RATE}} per annum from the due date until realization, within 15 (fifteen) days of receipt of this notice, failing which my client shall initiate appropriate Civil Suit for recovery along with summary proceedings under Order XXXVII CPC or criminal prosecution under Section 318 BNS 2023, at your sole risk and costs.

Dated: {{TODAY_DATE}}

{{LAWYER_NAME}}
Advocate
{{LAWYER_OFFICE}}`,
  },
  {
    id: 'affidavit-section-297',
    title: 'Supporting Affidavit in Court Proceedings (Section 297 BNSS / CPC)',
    category: 'Pleading',
    description: 'Sworn affidavit verifying petition, pleadings, urgent applications, or document compliance before Judicial Oath Commissioner.',
    statutoryReference: 'Section 297 Bharatiya Nagarik Suraksha Sanhita, 2023 / Order XIX CPC',
    courtHierarchy: 'All Courts',
    placeholders: [
      { key: 'COURT_NAME', label: 'Court Name' },
      { key: 'CASE_NUMBER', label: 'Case Number' },
      { key: 'CLIENT_NAME', label: 'Deponent Name' },
      { key: 'DEPONENT_AGE', label: 'Deponent Age', defaultValue: '42' },
      { key: 'DEPONENT_RESIDENCE', label: 'Residential Address', defaultValue: 'New Delhi, India' },
      { key: 'MATTER_TITLE', label: 'Petition / Application Title', defaultValue: 'Interlocutory Application' },
    ],
    templateContent: `IN THE COURT OF {{COURT_NAME}}

CASE NO. {{CASE_NUMBER}}

AFFIDAVIT OF {{CLIENT_NAME}}

I, {{CLIENT_NAME}}, aged about {{DEPONENT_AGE}} years, residing at {{DEPONENT_RESIDENCE}}, do hereby solemnly affirm and declare on oath as under:

1. That I am the Petitioner / Applicant in the above-captioned matter and am fully conversant with the facts and circumstances of the case, and as such competent to depose to this affidavit.

2. That the accompanying {{MATTER_TITLE}} has been drafted under my instructions and the contents thereof have been read over and explained to me in vernacular, which I state to be true and correct to the best of my knowledge and belief.

3. That the annexures attached to the petition are true copies of their respective originals.

4. That no similar application/petition on the same cause of action has previously been filed before this or any other Court.

DEPONENT

VERIFICATION:
Verified at {{COURT_LOCATION}} on this {{TODAY_DATE}} that the contents of paragraphs 1 to 4 of the above affidavit are true and correct to my personal knowledge. Nothing material has been concealed therefrom.

DEPONENT`,
  },
  {
    id: 'bnss-regular-bail-480',
    title: 'Regular Bail Application (Section 480 BNSS / S.437-439 CrPC)',
    category: 'Bail',
    description: 'Post-arrest regular bail petition before Magistrate / Sessions Court seeking release on personal bond and solvent surety.',
    statutoryReference: 'Section 480 Bharatiya Nagarik Suraksha Sanhita, 2023 (formerly Sections 437/439 CrPC)',
    courtHierarchy: 'District Court / Tribunal',
    placeholders: [
      { key: 'COURT_NAME', label: 'Court Name (Magistrate / Sessions)' },
      { key: 'CASE_NUMBER', label: 'Case / Bail Application Number' },
      { key: 'CLIENT_NAME', label: 'Accused / Applicant Name' },
      { key: 'CLIENT_PHONE', label: 'Applicant / Relative Mobile' },
      { key: 'POLICE_STATION', label: 'Police Station & District', defaultValue: 'P.S. Saket, South District' },
      { key: 'FIR_NUMBER', label: 'FIR Number & Year', defaultValue: 'FIR No. 118/2026' },
      { key: 'BNS_SECTIONS', label: 'Penal Sections Implicated', defaultValue: 'Section 303(2), 351(2) BNS, 2023' },
      { key: 'CUSTODY_DATE', label: 'Date of Judicial Remand', defaultValue: '05/10/2026' },
      { key: 'LAWYER_NAME', label: 'Advocate for Applicant' },
      { key: 'LAWYER_OFFICE', label: 'Chambers Address' },
    ],
    templateContent: `IN THE COURT OF CHIEF JUDICIAL MAGISTRATE / SESSIONS JUDGE AT {{COURT_NAME}}

CRIMINAL MISCELLANEOUS (BAIL) APPLICATION NO. {{CASE_NUMBER}}

IN THE MATTER OF:
{{CLIENT_NAME}}
Mobile: {{CLIENT_PHONE}}
(Presently confined in Judicial Custody since {{CUSTODY_DATE}})      ... ACCUSED / APPLICANT
                              VERSUS
STATE (NCT OF DELHI / STATE POLICE)                              ... RESPONDENT

APPLICATION UNDER SECTION 480 OF THE BHARATIYA NAGARIK SURAKSHA SANHITA, 2023 FOR GRANT OF REGULAR BAIL IN {{FIR_NUMBER}} REGISTERED AT {{POLICE_STATION}} UNDER {{BNS_SECTIONS}}

MOST RESPECTFULLY SHOWETH:

1. That the Applicant was arrested by the police of {{POLICE_STATION}} on {{CUSTODY_DATE}} in connection with {{FIR_NUMBER}} for alleged offences punishable under {{BNS_SECTIONS}} and has been in continuous judicial custody since then.

2. That the investigation qua the Applicant is substantially complete, material recoveries have been effected, and no further custodial interrogation or police remand is warranted under Section 187 BNSS.

3. That the Applicant is a permanent resident of {{COURT_LOCATION}} having deep family roots and business interests, with clean past antecedents and no risk of absconding or fleeing the course of justice.

4. That the Applicant undertakes to abide by all conditions imposed by this Hon'ble Court under Section 480(3) BNSS, including attending trial dates promptly and refraining from contacting or influencing any prosecution witnesses.

👉 [CLIENT QUESTIONNAIRE / MEDICAL & MITIGATING GROUNDS:
   Please specify if applicant has any urgent medical conditions, sole breadwinner dependency, or prior clean antecedents to be inserted here.]

PRAYER:
Wherefore, it is most respectfully prayed that this Hon'ble Court may graciously be pleased to:
a) Enlarge the Applicant {{CLIENT_NAME}} on regular bail in {{FIR_NUMBER}} registered at {{POLICE_STATION}} upon furnishing reasonable personal bond and solvent surety to the satisfaction of this Hon'ble Court;
b) Pass any other order in the interest of justice.

FILED BY:
{{LAWYER_NAME}}
Advocate for the Applicant
{{LAWYER_OFFICE}}
Dated: {{TODAY_DATE}}`,
  },
];

// ── Persistent Custom Templates Storage Helpers ──
export const CUSTOM_TEMPLATES_STORAGE_KEY = 'nyaay_custom_legal_templates';

export function getCustomTemplates(): LegalTemplate[] {
  try {
    const raw = localStorage.getItem(CUSTOM_TEMPLATES_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load custom legal templates from storage:', err);
    return [];
  }
}

export function saveCustomTemplate(
  template: Omit<LegalTemplate, 'id'> & { id?: string }
): LegalTemplate {
  const customList = getCustomTemplates();
  const id = template.id || `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newTemplate: LegalTemplate = {
    ...template,
    id,
  };
  const filtered = customList.filter(t => t.id !== id);
  const updated = [newTemplate, ...filtered];
  try {
    localStorage.setItem(CUSTOM_TEMPLATES_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save custom legal template:', err);
  }
  return newTemplate;
}

export function deleteCustomTemplate(id: string): void {
  const customList = getCustomTemplates();
  const updated = customList.filter(t => t.id !== id);
  try {
    localStorage.setItem(CUSTOM_TEMPLATES_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete custom legal template:', err);
  }
}

export function getAllTemplates(): LegalTemplate[] {
  return [...getCustomTemplates(), ...TOP_LEGAL_TEMPLATES];
}

