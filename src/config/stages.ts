export interface StageDefinition {
  id: string;
  name: string;
  nameHi: string;
  nameMr: string;
  description: string;
}

export const MATTER_STAGES: Record<string, StageDefinition[]> = {
  criminal: [
    { id: 'filing_fir', name: 'FIR & Filing', nameHi: 'प्राथमिकी व फाइलिंग', nameMr: 'प्रथम खबरी व दाखल', description: 'Initial complaint registration and filing.' },
    { id: 'bail_remand', name: 'Bail / Remand', nameHi: 'जमानत / रिमांड', nameMr: 'जामीन / कोठडी', description: 'Remand hearing or bail petition arguments.' },
    { id: 'chargesheet', name: 'Chargesheet / Cognizance', nameHi: 'आरोप पत्र / संज्ञान', nameMr: 'दोषारोपपत्र / दखल', description: 'Filing of police report and judicial cognizance.' },
    { id: 'framing_charges', name: 'Framing of Charges', nameHi: 'आरोप तय करना', nameMr: 'आरोप निश्चिती', description: 'Formal charges read out by court.' },
    { id: 'evidence_pw', name: 'Prosecution Evidence (PW)', nameHi: 'अभियोजन साक्ष्य', nameMr: 'सरकारी पुरावे', description: 'Examination and cross-examination of prosecution witnesses.' },
    { id: 'statement_313', name: 'Statement of Accused (S. 313/351)', nameHi: 'अभियुक्त का बयान', nameMr: 'आरोपीचे जबाब', description: 'Accused personally questioned by the judge.' },
    { id: 'defense_evidence', name: 'Defense Evidence (DW)', nameHi: 'बचाव साक्ष्य', nameMr: 'बचाव पुरावा', description: 'Defense witnesses and documentation.' },
    { id: 'final_arguments', name: 'Final Arguments', nameHi: 'अंतिम बहस', nameMr: 'अंतिम युक्तिवाद', description: 'Closing oral and written submissions.' },
    { id: 'judgment_order', name: 'Judgment / Order', nameHi: 'फैसला / आदेश', nameMr: 'निकाल / आदेश', description: 'Pronouncement of final verdict or sentencing.' },
  ],
  civil: [
    { id: 'plaint_filing', name: 'Plaint & Summons', nameHi: 'वाद पत्र व समन', nameMr: 'दावा व समन्स', description: 'Filing of plaint and service of summons to defendant.' },
    { id: 'written_statement', name: 'Written Statement (WS)', nameHi: 'लिखित जवाब', nameMr: 'लेखी म्हणणे', description: 'Defendant files reply within statutory period.' },
    { id: 'framing_issues', name: 'Framing of Issues', nameHi: 'मुद्दे तय करना', nameMr: 'मुद्दे काढणे', description: 'Court formulates questions of dispute.' },
    { id: 'plaintiff_evidence', name: 'Plaintiff Evidence (PE)', nameHi: 'वादी का साक्ष्य', nameMr: 'वादीचे पुरावे', description: 'Affidavits in lieu of examination in chief.' },
    { id: 'defendant_evidence', name: 'Defendant Evidence (DE)', nameHi: 'प्रतिवादी साक्ष्य', nameMr: 'प्रतिवादी पुरावे', description: 'Cross-examination of defense witnesses.' },
    { id: 'final_arguments', name: 'Final Arguments', nameHi: 'अंतिम बहस', nameMr: 'अंतिम युक्तिवाद', description: 'Comprehensive legal argument by advocates.' },
    { id: 'decree_judgment', name: 'Judgment & Decree', nameHi: 'निर्णय व डिक्री', nameMr: 'निकाल व हुकूमनामा', description: 'Formal judicial determination of rights.' },
  ],
  ni_act_138: [
    { id: 'legal_notice', name: 'Legal Demand Notice', nameHi: 'विधिक मांग नोटिस', nameMr: 'कायदेशीर मागणी नोटीस', description: 'Statutory 15-day notice dispatched within 30 days of bank return memo.' },
    { id: 'complaint_filing', name: 'Complaint Filing (S.142)', nameHi: 'परिवाद / शिकायत फाइलिंग', nameMr: 'तक्रार दाखल (कलम १४२)', description: 'Criminal complaint filed before Judicial Magistrate under Section 142 NI Act.' },
    { id: 'cognizance_pse', name: 'Cognizance & Pre-Summoning', nameHi: 'संज्ञान व प्राथमिक साक्ष्य', nameMr: 'दखल व प्राथमिक पुरावा', description: 'Magistrate takes cognizance; verification of complainant affidavit (S.145).' },
    { id: 'summons_appearance', name: 'Summons & Appearance', nameHi: 'समन व उपस्थिति', nameMr: 'समन्स व हजेरी', description: 'Service of court summons; appearance / bail of the accused drawer.' },
    { id: 'notice_plea', name: 'Notice of Accusation (Plea)', nameHi: 'आरोप सूचना (प्लिया)', nameMr: 'आरोपांची नोटीस', description: 'Notice framed under Section 251 CrPC / BNSS; plea of defense recorded.' },
    { id: 'complainant_ce', name: 'Cross-Exam of Complainant', nameHi: 'परिवादी से जिरह', nameMr: 'तक्रारदाराची उलटतपासणी', description: 'Application under S.145(2) and cross-examination of complainant on debt liability.' },
    { id: 'defense_evidence', name: 'Defense Evidence (DE)', nameHi: 'बचाव साक्ष्य', nameMr: 'बचाव पुरावा', description: 'Accused statement (S.313/351) and defense witnesses on rebuttal of presumption.' },
    { id: 'final_arguments', name: 'Final Arguments', nameHi: 'अंतिम बहस', nameMr: 'अंतिम युक्तिवाद', description: 'Submissions on statutory presumptions (S. 118, 139 NI Act) and legally enforceable debt.' },
    { id: 'judgment_sentence', name: 'Judgment & Sentence', nameHi: 'फैसला व सजा / क्षतिपूर्ति', nameMr: 'निकाल व शिक्षा', description: 'Verdict, compensation up to double cheque amount, or imprisonment.' },
  ],
  writ: [
    { id: 'writ_filing', name: 'Writ Petition Filing', nameHi: 'रिट याचिका फाइलिंग', nameMr: 'रिट याचिका दाखल', description: 'Filing of extraordinary writ petition under Art. 226/32.' },
    { id: 'motion_admission', name: 'Preliminary Motion / Admission', nameHi: 'प्रवेश व प्रारंभिक सुनवाई', nameMr: 'प्रवेश व प्राथमिक सुनावणी', description: 'Initial motion hearing before Division/Single Bench for rule nisi.' },
    { id: 'notice_stay', name: 'Notice & Interim Relief / Stay', nameHi: 'नोटिस व अंतरिम स्थगन आदेश', nameMr: 'नोटीस व अंतरिम स्थगिती', description: 'Issuance of notice to respondents and adjudication of ad-interim stay.' },
    { id: 'counter_affidavit', name: 'Counter Affidavit (Reply)', nameHi: 'जवाबी हलफनामा (उत्तर)', nameMr: 'उत्तर प्रतिज्ञापत्र (म्हणणे)', description: 'Opposing state/authority files comprehensive counter affidavit.' },
    { id: 'rejoinder_affidavit', name: 'Rejoinder Affidavit', nameHi: 'प्रत्युत्तर हलफनामा', nameMr: 'प्रत्युत्तर प्रतिज्ञापत्र', description: 'Petitioner rebuts factual averments raised in counter.' },
    { id: 'final_hearing', name: 'Final Arguments & Rule Nisi', nameHi: 'अंतिम बहस व सुनवाई', nameMr: 'अंतिम युक्तिवाद व सुनावणी', description: 'Substantive constitutional and administrative law submissions.' },
    { id: 'judgment_mandamus', name: 'Pronouncement of Judgment', nameHi: 'निर्णय / रिट आदेश', nameMr: 'निकाल / रिट हुकूम', description: 'Final writ (Mandamus, Certiorari, Habeas Corpus) or dismissal order.' },
  ],
  family_matrimonial: [
    { id: 'petition_service', name: 'Petition & Service of Summons', nameHi: 'याचिका व समन तामील', nameMr: 'याचिका व समन्स बजावणी', description: 'Filing of matrimonial petition and service upon respondent spouse.' },
    { id: 'mediation_counseling', name: 'Mandatory Mediation & Counseling', nameHi: 'अनिवार्य मध्यस्थता व परामर्श', nameMr: 'अनिवार्य समुपदेशन व मध्यस्थता', description: 'Statutory conciliation and mediation sessions before court counselor.' },
    { id: 'interim_maintenance', name: 'Interim Maintenance (S. 24 / 125)', nameHi: 'अंतरिम भरण-पोषण सुनवाई', nameMr: 'अंतरिम पोटगी सुनावणी', description: 'Hearing on interim monthly maintenance, litigation costs, and custody.' },
    { id: 'written_statement', name: 'Written Statement & Issues', nameHi: 'लिखित जवाब व विवादक तय होना', nameMr: 'लेखी उत्तर व मुद्दे निश्चिती', description: 'Pleadings concluded and points of dispute framed by Family Court.' },
    { id: 'petitioner_evidence', name: 'Petitioner Evidence', nameHi: 'याचिकाकर्ता साक्ष्य', nameMr: 'याचिकाकर्ता पुरावे', description: 'Affidavit of assets/liabilities and examination of spouse.' },
    { id: 'respondent_evidence', name: 'Respondent Evidence', nameHi: 'प्रत्यर्थी साक्ष्य', nameMr: 'प्रतिवादी पुरावे', description: 'Defense deposition and cross-examination.' },
    { id: 'final_arguments', name: 'Final Arguments', nameHi: 'अंतिम बहस', nameMr: 'अंतिम युक्तिवाद', description: 'Summations on grounds of relief and permanent alimony.' },
    { id: 'decree_order', name: 'Decree & Final Order', nameHi: 'डिक्री व अंतिम फैसला', nameMr: 'हुकूमनामा व अंतिम निकाल', description: 'Judgment, decree of divorce/restitution, or settlement order.' },
  ],
  mact: [
    { id: 'claim_dar', name: 'Claim Petition & DAR Filing', nameHi: 'दावा याचिका व DAR फाइलिंग', nameMr: 'दावा याचिका व DAR दाखल', description: 'Filing claim petition or Detailed Accident Report by police/claimant.' },
    { id: 'notice_insurance', name: 'Notice to Insurer & Driver/Owner', nameHi: 'बीमा कंपनी व चालक को नोटिस', nameMr: 'विमा कंपनी व चालकास नोटीस', description: 'Service of notice on registered owner, driver, and insurance firm.' },
    { id: 'written_statement', name: 'Written Statement by Insurer', nameHi: 'बीमा कंपनी का लिखित जवाब', nameMr: 'विमा कंपनीचे लेखी म्हणणे', description: 'Insurer files defense on policy coverage, breach, or driver license validity.' },
    { id: 'issues_framing', name: 'Framing of Issues', nameHi: 'विवादक तय करना', nameMr: 'मुद्दे निश्चित करणे', description: 'Issues framed on negligence, liability, and compensation quantum.' },
    { id: 'claimant_evidence', name: 'Claimant Evidence (Medical/Income)', nameHi: 'दावेदार साक्ष्य (आय व चिकित्सा)', nameMr: 'दावेदार पुरावे (वैद्यकीय व उत्पन्न)', description: 'Proof of income, disability board certificates, and hospital expenditures.' },
    { id: 'insurance_evidence', name: 'Insurer Defense Evidence', nameHi: 'बीमा कंपनी बचाव साक्ष्य', nameMr: 'विमा कंपनी बचाव पुरावा', description: 'Evidence on policy exclusion, contributory negligence, or invalid permit.' },
    { id: 'final_arguments', name: 'Final Arguments', nameHi: 'अंतिम बहस', nameMr: 'अंतिम युक्तिवाद', description: 'Submissions under Motor Vehicles Act & multiplier formula.' },
    { id: 'award_disbursement', name: 'Award & Compensation Disbursement', nameHi: 'अधिनिर्णय व मुआवजा भुगतान', nameMr: 'निवाडा व भरपाई वाटप', description: 'Pronouncement of MACT award and deposit into bank FDR.' },
  ],
  consumer: [
    { id: 'complaint_filing', name: 'Consumer Complaint Filing', nameHi: 'उपभोक्ता परिवाद फाइलिंग', nameMr: 'ग्राहक तक्रार दाखल', description: 'Complaint filed before District/State Consumer Commission under CPA 2019.' },
    { id: 'admission_notice', name: 'Admissibility & Notice', nameHi: 'स्वीकार्यता व नोटिस प्रेषण', nameMr: 'ग्राह्यता व नोटीस बजावणी', description: 'Commission admits complaint and issues statutory 30-day notice to opposite party.' },
    { id: 'written_version', name: 'Written Version / Defense', nameHi: 'विपरीत पक्ष का लिखित संस्करण', nameMr: 'विरुद्ध पक्षाचे लेखी म्हणणे', description: 'Opposite party submits response within statutory 30-45 day window.' },
    { id: 'evidence_affidavits', name: 'Evidence by Way of Affidavits', nameHi: 'शपथ पत्र द्वारा साक्ष्य', nameMr: 'प्रतिज्ञापत्राद्वारे पुरावा', description: 'Both parties file documentary proof, invoices, and expert technician reports.' },
    { id: 'written_arguments', name: 'Written Arguments & Submissions', nameHi: 'लिखित तर्क व बहस', nameMr: 'लेखी युक्तिवाद व युक्तिवाद', description: 'Brief written arguments on unfair trade practice or service deficiency.' },
    { id: 'final_order', name: 'Final Order & Compensation', nameHi: 'अंतिम आदेश व क्षतिपूर्ति', nameMr: 'अंतिम आदेश व नुकसानभरपाई', description: 'Commission directs replacement, refund with interest, and mental agony damages.' },
  ],
  arbitration: [
    { id: 'notice_invocation', name: 'Notice Invoking Arbitration (S.21)', nameHi: 'मध्यस्थता सूचना (धारा 21)', nameMr: 'लवाद नोटीस (कलम २१)', description: 'Notice calling upon counterparty to appoint arbitral tribunal.' },
    { id: 'appointment_tribunal', name: 'Tribunal Constitution / S.11', nameHi: 'ट्रिब्यूनल गठन / धारा 11', nameMr: 'लवाद मंडळ नियुक्ती / कलम ११', description: 'Mutual appointment or court appointment under Section 11 of Act.' },
    { id: 'statement_claim', name: 'Statement of Claim (SOC)', nameHi: 'दावा विवरण (SOC)', nameMr: 'दावा निवेदन (SOC)', description: 'Claimant submits comprehensive claims, invoices, and quantification.' },
    { id: 'statement_defence', name: 'Statement of Defence & Counterclaim', nameHi: 'बचाव पत्र व जवाबी दावा', nameMr: 'बचाव निवेदन व प्रतिदावा', description: 'Respondent files defense reply and counterclaims.' },
    { id: 'admission_evidence', name: 'Admission/Denial & Evidence', nameHi: 'दस्तावेज स्वीकार/अस्वीकार व साक्ष्य', nameMr: 'कागदपत्रे दाखल व पुरावा', description: 'Inspection of documents and witness cross-examination.' },
    { id: 'oral_arguments', name: 'Oral Hearing & Written Notes', nameHi: 'मौखिक बहस व लिखित नोट्स', nameMr: 'तोंडी युक्तिवाद व लेखी नोंदी', description: 'Advocate arguments on contractual interpretation and liquidated damages.' },
    { id: 'arbitral_award', name: 'Arbitral Award (S.31)', nameHi: 'अंतिम लवाद निर्णय / पंचाट', nameMr: 'अंतिम लवाद निवाडा (कलम ३१)', description: 'Tribunal publishes signed binding award with interest and costs.' },
  ],
  default: [
    { id: 'institution', name: 'Filing & Admission', nameHi: 'फाइलिंग व प्रवेश', nameMr: 'दाखल व प्रवेश', description: 'Initial petition presentation.' },
    { id: 'notice_issued', name: 'Notice / Appearance', nameHi: 'नोटिस / उपस्थिति', nameMr: 'नोटीस / हजेरी', description: 'Opposite party notified.' },
    { id: 'pleadings', name: 'Pleadings & Affidavits', nameHi: 'दलीलें व हलफनामे', nameMr: 'अर्ज व प्रतिज्ञापत्रे', description: 'Submission of formal statements.' },
    { id: 'evidence_hearing', name: 'Evidence / Hearing', nameHi: 'साक्ष्य व सुनवाई', nameMr: 'पुरावा व सुनावणी', description: 'Witnesses and substantive proceedings.' },
    { id: 'final_arguments', name: 'Final Arguments', nameHi: 'अंतिम बहस', nameMr: 'अंतिम युक्तिवाद', description: 'Closing submissions.' },
    { id: 'disposed', name: 'Disposed / Judgment', nameHi: 'निस्तारित / आदेश', nameMr: 'विल्हेवाट / निर्णय', description: 'Final order concluded.' },
  ]
};

export function getStagesForMatter(matterType?: string): StageDefinition[] {
  if (!matterType) return MATTER_STAGES.default;
  const mt = matterType.toLowerCase();

  // Check Cheque Dishonour / Section 138 first
  if (mt.includes('cheque') || mt.includes('138') || mt.includes('dishonour') || mt.includes('dishonor') || mt.includes('negotiable') || mt.includes('ni act')) {
    return MATTER_STAGES.ni_act_138;
  }
  // Writ / Constitutional
  if (mt.includes('writ') || mt.includes('226') || mt.includes('art 32') || mt.includes('quashing') || mt.includes('habeas') || mt.includes('mandamus')) {
    return MATTER_STAGES.writ;
  }
  // Matrimonial / Family
  if (mt.includes('matrimonial') || mt.includes('divorce') || mt.includes('family') || mt.includes('maintenance') || mt.includes('custody') || mt.includes('domestic violence') || mt.includes('dv act')) {
    return MATTER_STAGES.family_matrimonial;
  }
  // Motor Accident
  if (mt.includes('mact') || mt.includes('accident') || mt.includes('motor vehicle') || mt.includes('claim tribunal')) {
    return MATTER_STAGES.mact;
  }
  // Consumer
  if (mt.includes('consumer') || mt.includes('cpa') || mt.includes('deficiency') || mt.includes('district commission')) {
    return MATTER_STAGES.consumer;
  }
  // Arbitration
  if (mt.includes('arbitrat') || mt.includes('conciliat') || mt.includes('tribunal') || mt.includes('award')) {
    return MATTER_STAGES.arbitration;
  }
  // Criminal
  if (mt.includes('crim') || mt.includes('bail') || mt.includes('police') || mt.includes('fir') || mt.includes('ipc') || mt.includes('bns') || mt.includes('bnss') || mt.includes('sessions')) {
    return MATTER_STAGES.criminal;
  }
  // Civil
  if (mt.includes('civ') || mt.includes('prop') || mt.includes('rent') || mt.includes('contract') || mt.includes('suit') || mt.includes('injunction') || mt.includes('recovery')) {
    return MATTER_STAGES.civil;
  }
  return MATTER_STAGES.default;
}

/**
 * Smart fuzzy matcher to map any real-world docket or eCourts stage string
 * to the appropriate stage index within the stage progression list.
 */
export function matchStageIndex(stages: StageDefinition[], currentStage?: string): number {
  if (!currentStage || !stages || stages.length === 0) return 0;
  const raw = currentStage.toLowerCase().trim();

  // 1. Direct equality check on name or id
  const exactIdx = stages.findIndex(
    s => s.name.toLowerCase() === raw || s.id.toLowerCase() === raw || s.nameHi?.toLowerCase() === raw || s.nameMr?.toLowerCase() === raw
  );
  if (exactIdx >= 0) return exactIdx;

  // 2. Keyword-based matching
  for (let i = 0; i < stages.length; i++) {
    const s = stages[i];
    const sName = s.name.toLowerCase();
    const sDesc = s.description.toLowerCase();

    // Word tokens check
    const words = raw.split(/[\s,/\-()]+/).filter(w => w.length > 2);
    for (const w of words) {
      if (sName.includes(w) || sDesc.includes(w)) {
        return i;
      }
    }
  }

  // 3. Normalized standard eCourts stage keywords fallback
  if (raw.includes('judgment') || raw.includes('order') || raw.includes('decree') || raw.includes('disposed') || raw.includes('sentence')) {
    return stages.length - 1;
  }
  if (raw.includes('argument') || raw.includes('final hearing') || raw.includes('submissions')) {
    return Math.max(0, stages.length - 2);
  }
  if (raw.includes('evidence') || raw.includes('witness') || raw.includes('cross') || raw.includes('pw') || raw.includes('dw') || raw.includes('pe') || raw.includes('de')) {
    const evIdx = stages.findIndex(s => s.name.toLowerCase().includes('evidence'));
    if (evIdx >= 0) return evIdx;
    return Math.floor(stages.length / 2);
  }
  if (raw.includes('charge') || raw.includes('issue') || raw.includes('plea')) {
    const chargeIdx = stages.findIndex(s => s.name.toLowerCase().includes('charge') || s.name.toLowerCase().includes('issue') || s.name.toLowerCase().includes('plea'));
    if (chargeIdx >= 0) return chargeIdx;
  }
  if (raw.includes('notice') || raw.includes('summons') || raw.includes('appearance') || raw.includes('service')) {
    const noticeIdx = stages.findIndex(s => s.name.toLowerCase().includes('notice') || s.name.toLowerCase().includes('summons') || s.name.toLowerCase().includes('appearance'));
    if (noticeIdx >= 0) return noticeIdx;
  }
  if (raw.includes('filing') || raw.includes('admission') || raw.includes('institution') || raw.includes('fir')) {
    return 0;
  }

  return 0;
}

export const STAGE_KEYWORDS: Record<string, string[]> = {
  'Admission': ['admission', 'admitted', 'preliminary', 'fresh', 'institution'],
  'Notice/Summons': ['notice', 'summons', 'service', 'served', 'dasti', 'process'],
  'Written Statement': ['written statement', 'reply', 'rejoinder', 'counter', 'ws'],
  'Framing of Issues': ['framing', 'issues', 'charge', 'framing of issues', 'charge framing'],
  'Evidence': ['evidence', 'witness', 'cross', 'pw', 'dw', 'affidavit of evidence'],
  'Final Arguments': ['argument', 'arguments', 'final argument', 'hearing', 'final hearing', 'submissions'],
  'Judgment/Order': ['judgment', 'order', 'verdict', 'disposed', 'decree', 'sentencing'],
  'Execution': ['execution', 'warrant', 'attachment', 'decree holder'],
};

export function getStarterTasksForStage(stage?: string): string[] {
  if (!stage) return ['Initial review of case brief', 'Verify court filing documents'];
  const s = stage.toLowerCase();
  if (s.includes('notice') && s.includes('demand')) {
    return ['Dispatch Section 138 statutory demand notice via Registered Post AD', 'Collect bank return memo with official dishonour seal', 'Track speed post consignment tracking delivery report'];
  }
  if (s.includes('142') || s.includes('complaint')) {
    return ['Draft Section 142 NI Act criminal complaint', 'Prepare pre-summoning evidence affidavit under Section 145 NI Act', 'File within 30 days of notice grace period expiration'];
  }
  if (s.includes('bail')) {
    return ['Draft bail petition under Sec 480 BNSS', 'Obtain certified copy of FIR / remand order', 'Verify surety and local solvency certificate'];
  }
  if (s.includes('notice') || s.includes('summons')) {
    return ['Verify tracking status of speed post summons', 'Prepare process fee and dasti service notice'];
  }
  if (s.includes('written') || s.includes('reply') || s.includes('ws')) {
    return ['Compile para-wise response facts from client', 'Draft Written Statement / Reply affidavit', 'Gather counter-evidence annexures'];
  }
  if (s.includes('issue') || s.includes('charge')) {
    return ['Draft proposed issues / defense discharge grounds', 'Legal research on statutory ingredients'];
  }
  if (s.includes('evidence')) {
    return ['Prepare examination-in-chief affidavit', 'Draft cross-examination questionnaire', 'Collate supporting original documents'];
  }
  if (s.includes('argument')) {
    return ['Prepare synopsis and chronological list of dates', 'Compile supporting High Court & Supreme Court precedents', 'Draft written submissions'];
  }
  return ['Review case status on eCourts', 'Prepare next hearing checklist', 'Notify client of hearing proceedings'];
}

