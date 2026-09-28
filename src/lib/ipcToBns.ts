// IPC Section ↔ BNS Section Mapping (Bharatiya Nyaya Sanhita 2023)
export interface BnsSectionInfo {
  bns: string;
  title: string;
  description?: string;
  punishment?: string;
}

export interface LegalSectionEntry {
  id: string;
  ipc: string;
  bns: string;
  title: string;
  punishment?: string;
  description?: string;
  category?: 'Crimes Against Women' | 'Crimes Against Body' | 'Property Crimes' | 'Public Order' | 'State & Terrorism' | 'General';
  keywords?: string[];
}

export const COMPREHENSIVE_SECTIONS: LegalSectionEntry[] = [
  // ── New & Landmark BNS Provisions ───────────────────────────────────────
  {
    id: 'bns-69',
    ipc: '376/417/420',
    bns: '69',
    title: 'Sexual intercourse by deceitful means or false promise of marriage',
    description: 'Whoever, by deceitful means or by making promise to marry to a woman without any intention of fulfilling the same, and has sexual intercourse with her not amounting to the offence of rape.',
    punishment: 'Rigorous imprisonment up to 10 years, and fine',
    category: 'Crimes Against Women',
    keywords: ['69', 'section 69', 'bns 69', 'promise to marry', 'marriage', 'false promise', 'deceit', 'sexual intercourse', 'deceitful means'],
  },
  {
    id: 'ipc-69',
    ipc: '69',
    bns: '9',
    title: 'Termination of imprisonment on payment of proportional part of fine',
    description: 'If, before expiration of the term of imprisonment fixed in default of payment of fine, such proportion of the fine be paid or levied that the term of imprisonment suffered in default is not less than proportional to the part still unpaid.',
    punishment: 'Release upon proportional payment of judicial fine',
    category: 'General',
    keywords: ['69', 'section 69', 'ipc 69', 'fine', 'default of fine', 'proportional part of fine', 'imprisonment'],
  },
  {
    id: 'bns-103-2',
    ipc: '302/149',
    bns: '103(2)',
    title: 'Mob lynching by group of 5 or more persons',
    description: 'When a group of five or more persons acting in concert commits murder on ground of race, caste, sex, place of birth, language, personal belief or any other ground.',
    punishment: 'Death or imprisonment for life, and fine',
    category: 'Crimes Against Body',
    keywords: ['103', '103(2)', 'lynching', 'mob lynching', 'murder by mob', 'caste murder', 'hate crime'],
  },
  {
    id: 'bns-111',
    ipc: 'MCOCA / Special Acts',
    bns: '111',
    title: 'Organised crime',
    description: 'Any continuing unlawful activity including kidnapping, robbery, vehicle theft, extortion, land grabbing, contract killing, economic offenses by a member or on behalf of a crime syndicate.',
    punishment: 'Death or life imprisonment if death ensues, otherwise 5 years to life + minimum 5 lakh fine',
    category: 'Public Order',
    keywords: ['111', 'bns 111', 'organised crime', 'gang', 'syndicate', 'extortion', 'contract killing'],
  },
  {
    id: 'bns-112',
    ipc: 'Special Acts',
    bns: '112',
    title: 'Petty organised crime',
    description: 'Theft, snatching, cheating, unauthorized selling of tickets, illegal betting, or selling public exam question papers done by an organized group.',
    punishment: 'Imprisonment 1 to 7 years, and fine',
    category: 'Property Crimes',
    keywords: ['112', 'bns 112', 'petty organised crime', 'paper leak', 'betting', 'organized theft'],
  },
  {
    id: 'bns-113',
    ipc: 'UAPA / 121',
    bns: '113',
    title: 'Terrorist act',
    description: 'Any act with intent to threaten unity, integrity, sovereignty, or security of India or strike terror in people.',
    punishment: 'Death or life imprisonment without parole, and fine',
    category: 'State & Terrorism',
    keywords: ['113', 'bns 113', 'terrorist act', 'terrorism', 'sovereignty'],
  },
  {
    id: 'bns-152',
    ipc: '124A (Sedition)',
    bns: '152',
    title: 'Act endangering sovereignty, unity and integrity of India',
    description: 'Whoever purposively or knowingly excites or attempts to excite secession or armed rebellion or subversive activities, or encourages feelings of separatist activities.',
    punishment: 'Imprisonment for life or up to 7 years, and fine',
    category: 'State & Terrorism',
    keywords: ['152', '124A', 'sedition', 'sovereignty', 'subversion', 'secession', 'separatist'],
  },
  {
    id: 'bns-304',
    ipc: '379 (Enhanced)',
    bns: '304',
    title: 'Snatching (Chain snatching / Phone snatching)',
    description: 'Theft is snatching if, in order to commit theft, the offender suddenly or quickly or forcibly seizes, secures, grabs or takes away from any person any movable property.',
    punishment: 'Imprisonment up to 3 years, and fine',
    category: 'Property Crimes',
    keywords: ['304', 'snatching', 'chain snatching', 'mobile snatching', 'quick theft'],
  },

  // ── Crimes Against Body (Murder, Hurt, Kidnapping) ─────────────────────
  {
    id: 'ipc-302',
    ipc: '302',
    bns: '103(1)',
    title: 'Murder',
    description: 'Whoever commits murder shall be punished with death, or imprisonment for life, and shall also be liable to fine.',
    punishment: 'Death or imprisonment for life, and fine',
    category: 'Crimes Against Body',
    keywords: ['302', '103', 'murder', 'killing', 'homicide', 'hatya'],
  },
  {
    id: 'ipc-304',
    ipc: '304',
    bns: '105',
    title: 'Culpable homicide not amounting to murder',
    description: 'Punishment for culpable homicide not amounting to murder caused with intention or knowledge.',
    punishment: 'Imprisonment for life, or up to 10 years, and fine',
    category: 'Crimes Against Body',
    keywords: ['304', '105', 'culpable homicide', 'manslaughter'],
  },
  {
    id: 'ipc-304a',
    ipc: '304A',
    bns: '106(1)',
    title: 'Causing death by negligence / rash driving',
    description: 'Whoever causes death of any person by doing any rash or negligent act not amounting to culpable homicide.',
    punishment: 'Imprisonment up to 5 years, and fine',
    category: 'Crimes Against Body',
    keywords: ['304a', '106', 'negligence', 'hit and run', 'accident', 'rash driving'],
  },
  {
    id: 'bns-106-2',
    ipc: '304A (Aggravated)',
    bns: '106(2)',
    title: 'Hit and run (Failure to report accident to police or magistrate)',
    description: 'Causing death by rash and negligent driving and escaping without reporting to police officer or magistrate soon after the incident.',
    punishment: 'Imprisonment up to 10 years, and fine',
    category: 'Crimes Against Body',
    keywords: ['106(2)', 'hit and run', 'escape accident', 'negligent driving'],
  },
  {
    id: 'ipc-304b',
    ipc: '304B',
    bns: '80',
    title: 'Dowry death',
    description: 'Death of a woman caused by burns or bodily injury occurring within seven years of marriage with evidence of dowry harassment.',
    punishment: 'Imprisonment not less than 7 years, up to life',
    category: 'Crimes Against Women',
    keywords: ['304b', '80', 'dowry death', 'dahej', 'dowry harassment'],
  },
  {
    id: 'ipc-307',
    ipc: '307',
    bns: '109',
    title: 'Attempt to murder',
    description: 'Whoever does any act with such intention or knowledge and under such circumstances that, if he by that act caused death, he would be guilty of murder.',
    punishment: 'Imprisonment up to 10 years and fine; if hurt caused, up to life',
    category: 'Crimes Against Body',
    keywords: ['307', '109', 'attempt to murder', 'murder attempt', 'jaanleva hamla'],
  },
  {
    id: 'ipc-308',
    ipc: '308',
    bns: '110',
    title: 'Attempt to commit culpable homicide',
    description: 'Doing an act with intention or knowledge of culpable homicide not amounting to murder.',
    punishment: 'Imprisonment up to 3 years or fine; if hurt caused, up to 7 years',
    category: 'Crimes Against Body',
    keywords: ['308', '110', 'culpable homicide attempt'],
  },
  {
    id: 'ipc-323',
    ipc: '323',
    bns: '115(2)',
    title: 'Voluntarily causing hurt',
    description: 'Punishment for voluntarily causing hurt to any person.',
    punishment: 'Imprisonment up to 1 year, or fine up to ₹1,000, or both',
    category: 'Crimes Against Body',
    keywords: ['323', '115', '115(2)', 'hurt', 'marpeet', 'assault'],
  },
  {
    id: 'ipc-324',
    ipc: '324',
    bns: '117',
    title: 'Voluntarily causing hurt by dangerous weapons or means',
    description: 'Causing hurt using shooting, stabbing, cutting instruments, fire, or poison.',
    punishment: 'Imprisonment up to 3 years, or fine, or both',
    category: 'Crimes Against Body',
    keywords: ['324', '117', 'weapon hurt', 'dangerous weapons'],
  },
  {
    id: 'ipc-325',
    ipc: '325',
    bns: '116',
    title: 'Voluntarily causing grievous hurt',
    description: 'Punishment for voluntarily causing fracture, dislocation of bone, or permanent privation of sight/hearing.',
    punishment: 'Imprisonment up to 7 years, and fine',
    category: 'Crimes Against Body',
    keywords: ['325', '116', 'grievous hurt', 'bone fracture'],
  },
  {
    id: 'ipc-326',
    ipc: '326',
    bns: '118(1)',
    title: 'Voluntarily causing grievous hurt by dangerous weapons',
    description: 'Grievous hurt caused by deadly instruments, corrosive substance, or fire.',
    punishment: 'Imprisonment for life, or up to 10 years, and fine',
    category: 'Crimes Against Body',
    keywords: ['326', '118', 'grievous hurt weapon', 'deadly weapon'],
  },
  {
    id: 'ipc-326a',
    ipc: '326A',
    bns: '124(1)',
    title: 'Voluntarily causing grievous hurt by use of acid, etc.',
    description: 'Acid attack causing permanent or partial damage, deformity, or disability.',
    punishment: 'Imprisonment not less than 10 years up to life, and fine payable to medical treatment of victim',
    category: 'Crimes Against Body',
    keywords: ['326a', '124', 'acid attack', 'acid throw'],
  },
  {
    id: 'ipc-341',
    ipc: '341',
    bns: '126(2)',
    title: 'Punishment for wrongful restraint',
    description: 'Obstructing any person so as to prevent that person from proceeding in any direction.',
    punishment: 'Simple imprisonment up to 1 month, or fine up to ₹500, or both',
    category: 'Crimes Against Body',
    keywords: ['341', '126', 'wrongful restraint', 'blocking path'],
  },
  {
    id: 'ipc-342',
    ipc: '342',
    bns: '127(2)',
    title: 'Punishment for wrongful confinement',
    description: 'Wrongfully restraining any person in such manner as to prevent that person from proceeding beyond certain circumscribing limits.',
    punishment: 'Imprisonment up to 1 year, or fine up to ₹1,000, or both',
    category: 'Crimes Against Body',
    keywords: ['342', '127', 'confinement', 'illegal detention'],
  },

  // ── Crimes Against Women & Modesty ───────────────────────────────────────
  {
    id: 'ipc-354',
    ipc: '354',
    bns: '74',
    title: 'Assault or criminal force to woman with intent to outrage her modesty',
    description: 'Assaulting or using criminal force to any woman intending to outrage her modesty.',
    punishment: 'Imprisonment 1 to 5 years, and fine',
    category: 'Crimes Against Women',
    keywords: ['354', '74', 'outrage modesty', 'molestation', 'छेड़छाड़'],
  },
  {
    id: 'ipc-354a',
    ipc: '354A',
    bns: '75',
    title: 'Sexual harassment and punishment for sexual harassment',
    description: 'Unwelcome physical contact, advances involving explicit sexual overtures, demanding sexual favours, or showing pornography.',
    punishment: 'Rigorous imprisonment up to 3 years, or fine, or both',
    category: 'Crimes Against Women',
    keywords: ['354a', '75', 'sexual harassment', 'harassment'],
  },
  {
    id: 'ipc-354b',
    ipc: '354B',
    bns: '76',
    title: 'Assault or use of criminal force to woman with intent to disrobe',
    description: 'Assaulting woman with intent to disrobe or compel her to be naked.',
    punishment: 'Imprisonment 3 to 7 years, and fine',
    category: 'Crimes Against Women',
    keywords: ['354b', '76', 'disrobe', 'stripping'],
  },
  {
    id: 'ipc-354c',
    ipc: '354C',
    bns: '77',
    title: 'Voyeurism',
    description: 'Watching, capturing, or disseminating image of a woman engaging in a private act.',
    punishment: 'Imprisonment 1 to 3 years for first conviction; up to 7 years on subsequent',
    category: 'Crimes Against Women',
    keywords: ['354c', '77', 'voyeurism', 'hidden camera', 'recording private act'],
  },
  {
    id: 'ipc-354d',
    ipc: '354D',
    bns: '78',
    title: 'Stalking',
    description: 'Following a woman, contacting or attempting to contact her despite clear disinterest, or monitoring internet/electronic communication.',
    punishment: 'Imprisonment up to 3 years for first conviction; up to 5 years for subsequent',
    category: 'Crimes Against Women',
    keywords: ['354d', '78', 'stalking', 'cyberstalking', 'tracking woman'],
  },
  {
    id: 'ipc-376',
    ipc: '376',
    bns: '63',
    title: 'Punishment for rape',
    description: 'Committing rape as defined in Section 63 BNS.',
    punishment: 'Rigorous imprisonment not less than 10 years, up to life, and fine',
    category: 'Crimes Against Women',
    keywords: ['376', '63', 'rape', 'sexual assault', 'balatkar'],
  },
  {
    id: 'ipc-376a',
    ipc: '376A',
    bns: '66',
    title: 'Causing death or persistent vegetative state of victim of rape',
    description: 'Inflicting injury causing death or vegetative state during sexual assault.',
    punishment: 'Rigorous imprisonment not less than 20 years up to life or death',
    category: 'Crimes Against Women',
    keywords: ['376a', '66', 'fatal rape', 'vegetative state'],
  },
  {
    id: 'ipc-376d',
    ipc: '376D',
    bns: '70(1)',
    title: 'Gang rape',
    description: 'Where a woman is raped by one or more persons constituting a group or acting in furtherance of common intention.',
    punishment: 'Rigorous imprisonment not less than 20 years, up to life, and fine',
    category: 'Crimes Against Women',
    keywords: ['376d', '70', 'gang rape', 'group assault'],
  },
  {
    id: 'ipc-498a',
    ipc: '498A',
    bns: '85',
    title: 'Husband or relative of husband of a woman subjecting her to cruelty',
    description: 'Willful conduct of husband or relative driving woman to commit suicide or causing grave injury or danger to life/limb, or harassment for dowry.',
    punishment: 'Imprisonment up to 3 years, and fine',
    category: 'Crimes Against Women',
    keywords: ['498a', '85', 'cruelty by husband', 'domestic cruelty', 'harassment of wife'],
  },
  {
    id: 'ipc-509',
    ipc: '509',
    bns: '79',
    title: 'Word, gesture or act intended to insult the modesty of a woman',
    description: 'Uttering any word, making sound/gesture or exhibiting any object intruding upon privacy of woman.',
    punishment: 'Simple imprisonment up to 3 years, and fine',
    category: 'Crimes Against Women',
    keywords: ['509', '79', 'insult modesty', 'indecent gesture'],
  },

  // ── Kidnapping & Abduction ───────────────────────────────────────────────
  {
    id: 'ipc-363',
    ipc: '363',
    bns: '137(2)',
    title: 'Punishment for kidnapping',
    description: 'Kidnapping any person from India or from lawful guardianship.',
    punishment: 'Imprisonment up to 7 years, and fine',
    category: 'Crimes Against Body',
    keywords: ['363', '137', 'kidnapping', 'minor kidnapping'],
  },
  {
    id: 'ipc-364a',
    ipc: '364A',
    bns: '140',
    title: 'Kidnapping for ransom, etc.',
    description: 'Kidnapping or abducting any person and threatening with death or hurt in order to compel government or person to pay ransom.',
    punishment: 'Death or imprisonment for life, and fine',
    category: 'Crimes Against Body',
    keywords: ['364a', '140', 'kidnapping ransom', 'firauti', 'hostage'],
  },
  {
    id: 'ipc-366',
    ipc: '366',
    bns: '142',
    title: 'Kidnapping, abducting or inducing woman to compel her marriage, etc.',
    description: 'Kidnapping woman with intent that she may be compelled to marry any person against her will.',
    punishment: 'Imprisonment up to 10 years, and fine',
    category: 'Crimes Against Women',
    keywords: ['366', '142', 'compel marriage', 'forced marriage'],
  },
  {
    id: 'ipc-370',
    ipc: '370',
    bns: '143',
    title: 'Trafficking of persons',
    description: 'Recruiting, transporting, harbouring, transferring, or receiving persons for physical or sexual exploitation or servitude.',
    punishment: 'Rigorous imprisonment 7 to 10 years, and fine; up to life for trafficking minors/multiple persons',
    category: 'Crimes Against Body',
    keywords: ['370', '143', 'human trafficking', 'trafficking', 'smuggling persons'],
  },

  // ── Property Offences (Theft, Extortion, Cheating, Forgery) ───────────────
  {
    id: 'ipc-379',
    ipc: '379',
    bns: '303(2)',
    title: 'Punishment for theft',
    description: 'Intending to take dishonestly any moveable property out of the possession of any person without consent.',
    punishment: 'Imprisonment up to 3 years, or fine, or both; community service for first-time petty theft under ₹5,000 with restoration',
    category: 'Property Crimes',
    keywords: ['379', '303', '303(2)', 'theft', 'chori', 'stealing'],
  },
  {
    id: 'ipc-380',
    ipc: '380',
    bns: '305',
    title: 'Theft in dwelling house, etc.',
    description: 'Theft in any building, tent or vessel used as human dwelling or for custody of property.',
    punishment: 'Imprisonment up to 7 years, and fine',
    category: 'Property Crimes',
    keywords: ['380', '305', 'theft in house', 'burglary theft'],
  },
  {
    id: 'ipc-384',
    ipc: '384',
    bns: '308(2)',
    title: 'Punishment for extortion',
    description: 'Intentionally putting any person in fear of injury and thereby dishonestly inducing delivery of property.',
    punishment: 'Imprisonment up to 3 years, or fine, or both',
    category: 'Property Crimes',
    keywords: ['384', '308', 'extortion', 'blackmail', 'vasooli'],
  },
  {
    id: 'ipc-392',
    ipc: '392',
    bns: '309(4)',
    title: 'Punishment for robbery',
    description: 'Theft or extortion with wrongful hurt or fear of instant death or hurt.',
    punishment: 'Rigorous imprisonment up to 10 years, and fine; up to 14 years on highway after sunset',
    category: 'Property Crimes',
    keywords: ['392', '309', 'robbery', 'loot', 'dakait'],
  },
  {
    id: 'ipc-395',
    ipc: '395',
    bns: '310(2)',
    title: 'Punishment for dacoity',
    description: 'Robbery committed by five or more persons conjointly.',
    punishment: 'Imprisonment for life, or rigorous imprisonment up to 10 years, and fine',
    category: 'Property Crimes',
    keywords: ['395', '310', 'dacoity', 'dacoit', 'armed loot'],
  },
  {
    id: 'ipc-406',
    ipc: '406',
    bns: '316(2)',
    title: 'Punishment for criminal breach of trust',
    description: 'Dishonestly misappropriating or converting property entrusted to one’s custody.',
    punishment: 'Imprisonment up to 5 years, or fine, or both',
    category: 'Property Crimes',
    keywords: ['406', '316', 'criminal breach of trust', 'amanat me khayanat', 'misappropriation'],
  },
  {
    id: 'ipc-420',
    ipc: '420',
    bns: '318(4)',
    title: 'Cheating and dishonestly inducing delivery of property',
    description: 'Cheating and thereby dishonestly inducing person deceived to deliver property or alter valuable security.',
    punishment: 'Imprisonment up to 7 years, and fine',
    category: 'Property Crimes',
    keywords: ['420', '318', '318(4)', 'cheating', 'fraud', 'dhokhadhadi', '420 dhara'],
  },
  {
    id: 'ipc-467',
    ipc: '467',
    bns: '337',
    title: 'Forgery of valuable security, will, etc.',
    description: 'Forging document purporting to be a valuable security, will, or authority to receive money/goods.',
    punishment: 'Imprisonment for life, or up to 7 years, and fine',
    category: 'Property Crimes',
    keywords: ['467', '337', 'forgery of will', 'forgery of security', 'fake deed'],
  },
  {
    id: 'ipc-468',
    ipc: '468',
    bns: '336(3)',
    title: 'Forgery for purpose of cheating',
    description: 'Committing forgery intending that the document forged shall be used for cheating.',
    punishment: 'Imprisonment up to 7 years, and fine',
    category: 'Property Crimes',
    keywords: ['468', '336', 'forgery for cheating', 'fake document'],
  },
  {
    id: 'ipc-471',
    ipc: '471',
    bns: '336(4)',
    title: 'Using as genuine a forged document',
    description: 'Fraudulently or dishonestly using any forged document as genuine knowing it to be forged.',
    punishment: 'Same punishment as if person had forged the document',
    category: 'Property Crimes',
    keywords: ['471', '336(4)', 'using forged document', 'fake certificate'],
  },

  // ── Defamation & Intimidation ───────────────────────────────────────────
  {
    id: 'ipc-499',
    ipc: '499/500',
    bns: '356(1)',
    title: 'Defamation and punishment for defamation',
    description: 'Making or publishing any imputation concerning any person intending to harm the reputation of such person.',
    punishment: 'Simple imprisonment up to 2 years, or fine, or both, or community service',
    category: 'General',
    keywords: ['499', '500', '356', 'defamation', 'maan hani', 'slander', 'libel'],
  },
  {
    id: 'ipc-506',
    ipc: '506',
    bns: '351(2)',
    title: 'Punishment for criminal intimidation',
    description: 'Threatening another with injury to person, reputation or property with intent to cause alarm.',
    punishment: 'Imprisonment up to 2 years, or fine, or both; up to 7 years if threat to cause death/grievous hurt',
    category: 'General',
    keywords: ['506', '351', 'criminal intimidation', 'threat', 'dhamki'],
  },

  // ── General Liability, Conspiracy, Evidence ──────────────────────────────
  {
    id: 'ipc-120b',
    ipc: '120B',
    bns: '61(2)',
    title: 'Punishment of criminal conspiracy',
    description: 'Conspiring to commit an offence punishable with death, imprisonment for life or rigorous imprisonment of 2 years or upwards.',
    punishment: 'Same manner as if abetted such offence',
    category: 'General',
    keywords: ['120b', '61', 'conspiracy', 'criminal conspiracy', 'saazish'],
  },
  {
    id: 'ipc-34',
    ipc: '34',
    bns: '3(5)',
    title: 'Acts done by several persons in furtherance of common intention',
    description: 'When a criminal act is done by several persons in furtherance of the common intention of all, each of such persons is liable as if done by him alone.',
    punishment: 'Joint and several liability',
    category: 'General',
    keywords: ['34', '3(5)', 'common intention', 'joint liability', 'group crime'],
  },
  {
    id: 'ipc-147',
    ipc: '147',
    bns: '191(2)',
    title: 'Punishment for rioting',
    description: 'Guilty of rioting by use of force or violence by an unlawful assembly.',
    punishment: 'Imprisonment up to 2 years, or fine, or both',
    category: 'Public Order',
    keywords: ['147', '191', 'rioting', 'danga', 'riot'],
  },
  {
    id: 'ipc-148',
    ipc: '148',
    bns: '191(3)',
    title: 'Rioting, armed with deadly weapon',
    description: 'Guilty of rioting being armed with a deadly weapon or anything used as a weapon of offence.',
    punishment: 'Imprisonment up to 5 years, or fine, or both',
    category: 'Public Order',
    keywords: ['148', '191(3)', 'armed rioting', 'weapons in riot'],
  },
  {
    id: 'ipc-149',
    ipc: '149',
    bns: '190',
    title: 'Every member of unlawful assembly guilty of offence committed in prosecution of common object',
    description: 'Constructive liability of all members of unlawful assembly.',
    punishment: 'Punishment prescribed for the offence committed',
    category: 'Public Order',
    keywords: ['149', '190', 'unlawful assembly', 'common object'],
  },
  {
    id: 'ipc-193',
    ipc: '193',
    bns: '229',
    title: 'Punishment for false evidence / perjury',
    description: 'Intentionally giving false evidence in any stage of a judicial proceeding or fabricating false evidence.',
    punishment: 'Imprisonment up to 7 years, and fine',
    category: 'General',
    keywords: ['193', '229', 'false evidence', 'perjury', 'jhoothi gawahi'],
  },
  {
    id: 'ipc-201',
    ipc: '201',
    bns: '238',
    title: 'Causing disappearance of evidence or giving false information to screen offender',
    description: 'Causing evidence of commission of offence to disappear with intention of screening offender from legal punishment.',
    punishment: 'Imprisonment up to 7 years, and fine (depending on principal crime)',
    category: 'General',
    keywords: ['201', '238', 'destroy evidence', 'sabot evidence', 'tampering evidence'],
  },
];

// Backwards-compatible map
export const IPC_TO_BNS_MAP: Record<string, BnsSectionInfo> = COMPREHENSIVE_SECTIONS.reduce((acc, item) => {
  const cleanIpc = item.ipc.replace(/[^0-9A-Z]/gi, '').toUpperCase();
  if (cleanIpc && !acc[cleanIpc]) {
    acc[cleanIpc] = {
      bns: item.bns,
      title: item.title,
      description: item.description,
      punishment: item.punishment,
    };
  }
  return acc;
}, {} as Record<string, BnsSectionInfo>);

// Also index BNS numbers directly
export const BNS_TO_IPC_MAP: Record<string, LegalSectionEntry> = COMPREHENSIVE_SECTIONS.reduce((acc, item) => {
  const cleanBns = item.bns.replace(/[^0-9A-Z]/gi, '').toUpperCase();
  if (cleanBns && !acc[cleanBns]) {
    acc[cleanBns] = item;
  }
  return acc;
}, {} as Record<string, LegalSectionEntry>);

/**
 * Universal legal search helper that parses any user query:
 * - "section 69" -> matches both BNS 69 and IPC 69
 * - "bns 69" / "ipc 302" -> direct number matching
 * - "promise to marry" -> matches BNS 69
 * - "cheating" -> matches 420 / 318
 */
export function searchLegalSections(rawQuery: string): LegalSectionEntry[] {
  if (!rawQuery) return COMPREHENSIVE_SECTIONS;
  const q = rawQuery.toLowerCase().trim();

  // Guard: Common greetings and non-legal stop words must NEVER trigger section lookups
  const COMMON_NON_LEGAL = new Set([
    'hi', 'hello', 'hey', 'hii', 'namaste', 'pranam', 'namaskar', 'good', 'morning',
    'evening', 'night', 'help', 'start', 'test', 'ok', 'okay', 'yes', 'no', 'thanks',
    'thank', 'you', 'what', 'why', 'how', 'who', 'where', 'when', 'is', 'are', 'was',
    'were', 'can', 'could', 'the', 'this', 'that', 'with', 'from', 'have', 'has', 'had',
    'please', 'tell', 'me', 'sir', 'madam', 'हाय', 'नमस्ते', 'नमस्कार'
  ]);
  if (COMMON_NON_LEGAL.has(q)) return [];
  if (q.length < 3 && !/\d/.test(q)) return [];

  // Extract explicit numerical tokens e.g. "69" from "section 69" or "sec 69 bns"
  const digitsOnly = q.replace(/[^0-9]/g, '');
  const tokens = q.split(/[\s,+/]+/).filter(t => t.length > 0);

  return COMPREHENSIVE_SECTIONS.filter((entry) => {
    // 1. Exact or clear number match
    if (digitsOnly) {
      const bnsDigits = entry.bns.replace(/[^0-9]/g, '');
      const ipcTokens = entry.ipc.split(/[\s,/]+/).map(s => s.replace(/[^0-9]/g, ''));
      if (bnsDigits === digitsOnly || ipcTokens.includes(digitsOnly)) {
        return true;
      }
    }

    // 2. Direct match on IPC or BNS section strings
    const matchIpc = entry.ipc.toLowerCase() === q || entry.ipc.toLowerCase().includes(`ipc ${q}`);
    const matchBns = entry.bns.toLowerCase() === q || entry.bns.toLowerCase().includes(`bns ${q}`);
    if (matchIpc || matchBns) return true;

    // 3. Match keywords with word boundaries or substring if keyword is multi-word
    if (entry.keywords && entry.keywords.some(k => {
      const kLower = k.toLowerCase();
      if (kLower === q) return true;
      if (kLower.length >= 4 && q.includes(kLower)) return true;
      if (q.length >= 4 && kLower.includes(q)) return true;
      return false;
    })) {
      return true;
    }

    // 4. Match title with word boundary regex (prevent "hi" matching "relationship")
    if (q.length >= 4 && entry.title.toLowerCase().includes(q)) {
      return true;
    }

    return false;
  });
}

/**
 * Returns BNS equivalent for given IPC section string (e.g. "302", "Section 420 IPC", "69")
 */
export function getBnsEquivalent(ipcInput: string): BnsSectionInfo | null {
  if (!ipcInput) return null;
  const cleaned = ipcInput
    .replace(/ipc|i\.p\.c\.|bns|section|sec\.|u\/s|§/gi, '')
    .trim()
    .toUpperCase();
  
  if (IPC_TO_BNS_MAP[cleaned]) {
    return IPC_TO_BNS_MAP[cleaned];
  }

  // Fallback to searching comprehensive registry
  const match = COMPREHENSIVE_SECTIONS.find(
    s => s.ipc.toUpperCase().includes(cleaned) || s.bns.toUpperCase() === cleaned
  );
  if (match) {
    return {
      bns: match.bns,
      title: match.title,
      description: match.description,
      punishment: match.punishment,
    };
  }

  return null;
}

/**
 * Converts a list of legal sections (mix of IPC or other acts) and highlights/replaces with BNS equivalents
 */
export function convertSectionsToBns(sections: string[]): Array<{ original: string; bnsEquivalent?: BnsSectionInfo }> {
  return sections.map(s => ({
    original: s,
    bnsEquivalent: getBnsEquivalent(s) || undefined,
  }));
}
