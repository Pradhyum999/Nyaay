// Comprehensive Indian Court Complexes, Halls, Classifications & Statutes config

export interface CourtComplexDef {
  name: string;
  hierarchy: string;
  city: string;
  state: string;
  halls: string[];
}

export const INDIAN_COURT_COMPLEXES: CourtComplexDef[] = [
  {
    name: 'Supreme Court of India, New Delhi',
    hierarchy: 'Supreme Court',
    city: 'New Delhi',
    state: 'Delhi',
    halls: [
      'Court Room 01 (CJI Court)',
      'Court Room 02',
      'Court Room 03',
      'Court Room 04',
      'Court Room 05',
      'Court Room 06',
      'Court Room 07',
      'Court Room 08',
      'Court Room 09',
      'Court Room 10',
      'Court Room 11',
      'Court Room 12',
      'Chambers of Chief Justice',
    ],
  },
  {
    name: 'Delhi High Court, Sher Shah Road',
    hierarchy: 'High Court',
    city: 'New Delhi',
    state: 'Delhi',
    halls: [
      'Court Room 01 (Division Bench I / CJ)',
      'Court Room 02 (Division Bench II)',
      'Court Room 03 (Division Bench III)',
      'Court Room 04 (Single Bench - Civil)',
      'Court Room 05 (Single Bench - Criminal)',
      'Court Room 07 (Commercial Division)',
      'Court Room 14 (Arbitration & IPR)',
      'Court Room 19 (Appellate)',
      'Court Room 24 (Bail Bench)',
    ],
  },
  {
    name: 'Patiala House Courts Complex, New Delhi',
    hierarchy: 'District Court',
    city: 'New Delhi',
    state: 'Delhi',
    halls: [
      'Court Room 01 (Principal District & Sessions Judge)',
      'Court Room 04 (Special CBI Judge)',
      'Court Room 07 (Additional Sessions Judge - ASJ)',
      'Court Room 11 (Chief Metropolitan Magistrate - CMM)',
      'Court Room 16 (ACMM - Commercial)',
      'Court Room 21 (Metropolitan Magistrate - MM 01)',
      'Court Room 25 (MM - NI Act Special Court)',
      'Court Room 30 (Civil Judge)',
    ],
  },
  {
    name: 'Tis Hazari Courts Complex, Central Delhi',
    hierarchy: 'District Court',
    city: 'Delhi',
    state: 'Delhi',
    halls: [
      'Court Room 01 (Principal District Judge)',
      'Court Room 101 (Sessions Court)',
      'Court Room 112 (CMM Central)',
      'Court Room 125 (Special NDPS Court)',
      'Court Room 138 (MM - Sec 138 NI Act)',
      'Court Room 204 (Senior Civil Judge)',
      'Court Room 218 (Commercial Court)',
      'Court Room 305 (Family Court)',
    ],
  },
  {
    name: 'Saket Courts Complex, South Delhi',
    hierarchy: 'District Court',
    city: 'New Delhi',
    state: 'Delhi',
    halls: [
      'Court Room 01 (District Judge South)',
      'Court Room 102 (ASJ Special POCSO)',
      'Court Room 205 (CMM South)',
      'Court Room 301 (Motor Accident Claims - MACT)',
      'Court Room 402 (Civil Judge Junior Division)',
      'Court Room 501 (Family Court Bench 1)',
    ],
  },
  {
    name: 'Karkardooma Courts Complex, East Delhi',
    hierarchy: 'District Court',
    city: 'Delhi',
    state: 'Delhi',
    halls: [
      'Court Room 01 (District Judge East)',
      'Court Room 05 (Sessions Judge Special Court)',
      'Court Room 12 (CMM East)',
      'Court Room 22 (MM East 02)',
      'Court Room 34 (Civil Judge)',
    ],
  },
  {
    name: 'Rohini Courts Complex, North Delhi',
    hierarchy: 'District Court',
    city: 'Delhi',
    state: 'Delhi',
    halls: [
      'Court Room 01 (District Judge North)',
      'Court Room 103 (ASJ North)',
      'Court Room 201 (CMM North)',
      'Court Room 302 (Commercial Court)',
    ],
  },
  {
    name: 'Dwarka Courts Complex, South-West Delhi',
    hierarchy: 'District Court',
    city: 'New Delhi',
    state: 'Delhi',
    halls: [
      'Court Room 01 (District Judge South-West)',
      'Court Room 104 (ASJ South-West)',
      'Court Room 208 (CMM South-West)',
      'Court Room 310 (Civil Court)',
    ],
  },
  {
    name: 'Rouse Avenue District Court Complex, Central Delhi',
    hierarchy: 'District Court',
    city: 'New Delhi',
    state: 'Delhi',
    halls: [
      'Court Room 01 (Special Judge PC Act / CBI)',
      'Court Room 02 (Special MP/MLA Court)',
      'Court Room 03 (Special ED / Money Laundering Court)',
      'Court Room 05 (CMM Rouse Avenue)',
    ],
  },
  {
    name: 'Bombay High Court, Fort, Mumbai',
    hierarchy: 'High Court',
    city: 'Mumbai',
    state: 'Maharashtra',
    halls: [
      'Court Room 01 (Chief Justice Court)',
      'Court Room 03 (Division Bench Criminal)',
      'Court Room 08 (Single Judge Civil)',
      'Court Room 15 (Commercial Division)',
      'Court Room 22 (Bail / Anticipatory Bail Bench)',
      'Court Room 31 (Arbitration Bench)',
    ],
  },
  {
    name: 'City Civil & Sessions Court, Fort, Mumbai',
    hierarchy: 'Sessions Court',
    city: 'Mumbai',
    state: 'Maharashtra',
    halls: [
      'Court Hall 01 (Principal Sessions Judge)',
      'Court Hall 04 (Special CBI / ACB Court)',
      'Court Hall 09 (Sessions Judge Crime Against Women)',
      'Court Hall 14 (City Civil Judge)',
      'Court Hall 22 (Special NDPS Judge)',
    ],
  },
  {
    name: 'National Company Law Tribunal (NCLT), Principal Bench, New Delhi',
    hierarchy: 'NCLT',
    city: 'New Delhi',
    state: 'Delhi',
    halls: [
      'Court Room 01 (President / Principal Bench)',
      'Court Room 02 (Division Bench II)',
      'Court Room 03 (Division Bench III)',
      'Court Room 04 (Insolvency Bench)',
    ],
  },
  {
    name: 'Consumer Disputes Redressal Commission (NCDRC), New Delhi',
    hierarchy: 'Consumer Forum',
    city: 'New Delhi',
    state: 'Delhi',
    halls: [
      'Court Hall 01 (National Commission Bench I)',
      'Court Hall 02 (National Commission Bench II)',
      'Court Hall 03 (State Commission)',
    ],
  },
  {
    name: 'Debt Recovery Tribunal (DRT-I), New Delhi',
    hierarchy: 'District Court',
    city: 'New Delhi',
    state: 'Delhi',
    halls: [
      'Court Room 01 (Presiding Officer Bench I)',
      'Court Room 02 (Presiding Officer Bench II)',
      'Recovery Officer Room 01',
    ],
  },
];

export const COURT_HALLS_BY_COMPLEX: Record<string, string[]> = Object.fromEntries(
  INDIAN_COURT_COMPLEXES.map(c => [c.name, c.halls])
);

export const PREDEFINED_MATTER_CLASSIFICATIONS = [
  'Civil Suit / Commercial Dispute',
  'Criminal Defense & Trial',
  'Constitutional / Writ Petition (Art. 226/32)',
  'Family / Matrimonial & Custody',
  'Corporate / Insolvency (IBC & NCLT)',
  'Cheque Bounce (Sec 138 NI Act)',
  'Consumer Protection Complaint',
  'Bail / Anticipatory Bail Matter',
  'Labour & Industrial Disputes',
  'Motor Accident Claims (MACT)',
  'Revenue, Land & RERA Property Dispute',
  'Arbitration & Conciliation Proceedings',
  'Intellectual Property (Trademark / Copyright)',
  'Taxation / GST & Customs',
  'Cyber Crime & IT Act Matter',
];

export const PREDEFINED_INITIAL_STAGES = [
  'Admission / Preliminary Hearing',
  'Notice / Summons Issued',
  'Written Statement / Reply Filing',
  'Framing of Issues / Charges',
  'Petitioner / Complainant Evidence',
  'Respondent / Defense Evidence',
  'Final Arguments',
  'Judgment / Final Order',
  'Execution of Decree / Order',
  'Bail Hearing / Police Report',
  'Interim Injunction / Stay Hearing',
  'Cross-Examination of Witnesses',
];

export const POPULAR_ACTS_AND_SECTIONS = [
  'Sec 138 NI Act (Cheque Dishonour)',
  'Sec 302 IPC / Sec 103 BNS (Murder)',
  'Sec 420 IPC / Sec 318 BNS (Cheating)',
  'Sec 498A IPC / Sec 85 BNS (Matrimonial Cruelty)',
  'Sec 439 CrPC / Sec 483 BNSS (Regular Bail)',
  'Sec 438 CrPC / Sec 482 BNSS (Anticipatory Bail)',
  'Sec 9 CPC (Civil Jurisdiction)',
  'Order 39 Rule 1 & 2 CPC (Temporary Injunction)',
  'Art 226 Constitution of India (Writ Jurisdiction)',
  'Art 32 Constitution of India (Supreme Court Writ)',
  'Sec 7 IBC (Insolvency Resolution by Financial Creditor)',
  'Sec 9 IBC (Insolvency Resolution by Operational Creditor)',
  'Sec 11 Arbitration & Conciliation Act (Appointment of Arbitrator)',
  'Sec 34 Arbitration & Conciliation Act (Setting Aside Award)',
  'Sec 35 Consumer Protection Act (Consumer Complaint)',
  'Sec 166 Motor Vehicles Act (Accident Compensation)',
  'Sec 12 Protection of Women from Domestic Violence Act',
  'Sec 13 Hindu Marriage Act (Divorce Petition)',
  'Sec 25 Guardians & Wards Act (Child Custody)',
  'Sec 66 IT Act (Computer-Related Offences)',
];

export const PREDEFINED_FEE_DESCRIPTIONS = [
  'Legal Consultation Fee',
  'Court Appearance Fee',
  'Drafting & Vetting of Petition / Plaint',
  'Notice Preparation & Dispatch Charges',
  'Bail Application Appearance & Argument',
  'Cross-Examination of Witness Appearance',
  'Final Arguments Appearance',
  'Clerkage, Registry & Filing Charges',
  'Senior Counsel Briefing & Conference Fee',
  'Affidavit, Notary & Attestation Charges',
  'Inspection of Court Records Fee',
  'Miscellaneous Court Expenses & Photocopying',
  'Retainership Monthly Fee',
];

export function getHallsForCourtComplex(complexName: string): string[] {
  const found = INDIAN_COURT_COMPLEXES.find(c =>
    c.name.toLowerCase().includes(complexName.toLowerCase().trim()) ||
    complexName.toLowerCase().trim().includes(c.name.toLowerCase())
  );
  if (found) return found.halls;
  // Default generic courtroom suggestions
  return [
    'Court Room 01 (Principal Judge)',
    'Court Room 02',
    'Court Room 03',
    'Court Room 04',
    'Court Room 05',
    'Court Hall 01',
    'Court Hall 02',
    'Court Hall 03',
    'Chamber 01',
    'Chamber 02',
  ];
}
