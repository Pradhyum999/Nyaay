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
  if (mt.includes('crim') || mt.includes('bail') || mt.includes('police') || mt.includes('cheque') || mt.includes('138')) {
    return MATTER_STAGES.criminal;
  }
  if (mt.includes('civ') || mt.includes('prop') || mt.includes('rent') || mt.includes('contract') || mt.includes('suit')) {
    return MATTER_STAGES.civil;
  }
  return MATTER_STAGES.default;
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

