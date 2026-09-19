import { HearingItem, LimitationAlert, CaseFile, DocumentItem, AIIntakeBrief, InvoiceItem, ForumPost, JudicialAnalytic } from '../types';

export const mockLimitationAlerts: LimitationAlert[] = [
  {
    id: "lim-1",
    caseNumber: "CC/4128/2026",
    titleEn: "Statutory Demand Notice Expiring (Sec 138 NI Act)",
    titleHi: "वैधानिक मांग नोटिस की अवधि समाप्त हो रही है (धारा 138 एनआई एक्ट)",
    statutoryAct: "Negotiable Instruments Act, 1881",
    daysRemaining: 4,
    deadlineDate: "23 Sep 2026",
    severity: "critical",
    descriptionEn: "15-day statutory payment window for ₹14,50,000 dishonoured cheque expires in 4 days. File complaint before MM Patiala House.",
    descriptionHi: "₹14,50,000 के चेक अनादरण हेतु 15 दिवसीय वैधानिक भुगतान अवधि 4 दिनों में समाप्त। पटियाला हाउस में वाद दायर करें।"
  },
  {
    id: "lim-2",
    caseNumber: "RFA/109/2026",
    titleEn: "Limitation for Regular First Appeal (Sec 96 CPC)",
    titleHi: "नियमित प्रथम अपील हेतु परिसीमा अवधि (धारा 96 सीपीसी)",
    statutoryAct: "Limitation Act, 1963 - Article 116",
    daysRemaining: 12,
    deadlineDate: "01 Oct 2026",
    severity: "warning",
    descriptionEn: "90-day statutory limitation to challenge District Judge decree. Certified copy already obtained.",
    descriptionHi: "जिला न्यायाधीश के निर्णय को चुनौती देने हेतु 90 दिनों की वैधानिक अवधि। प्रमाणित प्रति प्राप्त हो चुकी है।"
  },
  {
    id: "lim-3",
    caseNumber: "CS(OS)/204/2026",
    titleEn: "Written Statement Filing Deadline (Order VIII Rule 1)",
    titleHi: "लिखित कथन (WS) दाखिल करने की समय-सीमा (ऑर्डर 8 नियम 1)",
    statutoryAct: "Code of Civil Procedure, 1908",
    daysRemaining: 18,
    deadlineDate: "07 Oct 2026",
    severity: "normal",
    descriptionEn: "Standard 30-day window from date of service of summons. Draft ready for advocate review.",
    descriptionHi: "समन की तामील से 30 दिवसीय मानक अवधि। मसौदा अधिवक्ता समीक्षा हेतु तैयार है।"
  }
];

export const mockHearings: HearingItem[] = [
  {
    id: "hr-1",
    caseNumber: "CRL.A./882/2025",
    clientName: "Vikramaditya Singhania",
    courtName: "Delhi High Court",
    itemNumber: 7,
    courtRoom: "Court No. 14",
    judgeName: "Hon'ble Mr. Justice S. K. Kaul",
    stage: "Final Arguments",
    hearingDate: "Today, 10:30 AM",
    hearingTime: "10:30 AM",
    purposeEn: "Arguments on Suspension of Sentence & Bail Application",
    purposeHi: "सजा के निलंबन एवं जमानत याचिका पर अंतिम बहस",
    previousOrderSummaryEn: "Ld. State counsel directed to file status report. Interim protection extended till today.",
    previousOrderSummaryHi: "राज्य अभियोजक को स्थिति रिपोर्ट दाखिल करने का निर्देश दिया गया। अंतरिम संरक्षण आज तक प्रभावी।",
    isUrgent: true
  },
  {
    id: "hr-2",
    caseNumber: "CC/4128/2026",
    clientName: "M/s Apex Logistics Ltd.",
    courtName: "Tis Hazari District Court",
    itemNumber: 15,
    courtRoom: "Court No. 208 (MM Special NI Court)",
    judgeName: "Sh. Ankit Verma, MM",
    stage: "Evidence",
    hearingDate: "Today, 01:45 PM",
    hearingTime: "01:45 PM",
    purposeEn: "Cross-Examination of Complainant Witness (CW-1)",
    purposeHi: "शिकायतकर्ता के गवाह (CW-1) से जिरह (Cross-examination)",
    previousOrderSummaryEn: "Original return memo and ledger statements placed on record. Cost of ₹2,000 paid.",
    previousOrderSummaryHi: "मूल चेक वापसी मेमो और खाता विवरण रिकॉर्ड पर लिए गए। ₹2,000 की लागत अदा की गई।"
  },
  {
    id: "hr-3",
    caseNumber: "CS/330/2024",
    clientName: "Smt. Sunita Goyal",
    courtName: "Patiala House Courts",
    itemNumber: 22,
    courtRoom: "Court No. 34 (ADJ-02)",
    judgeName: "Ms. Neha Sharma, ADJ",
    stage: "Framing of Issues",
    hearingDate: "Tomorrow, 11:00 AM",
    hearingTime: "11:00 AM",
    purposeEn: "Proposed issues filed by plaintiff; settlement of issues under Order XIV",
    purposeHi: "वादी द्वारा प्रस्तावित मुद्दों का दाखिल होना; आदेश 14 के तहत मुद्दों का निर्धारण",
    previousOrderSummaryEn: "Admission/denial of documents completed. Both counsels directed to exchange proposed issues.",
    previousOrderSummaryHi: "दस्तावेजों का प्रवेश/अस्वीकृति संपन्न। दोनों पक्षों को प्रस्तावित मुद्दे साझा करने के निर्देश।"
  },
  {
    id: "hr-4",
    caseNumber: "CP(IB)/94/2025",
    clientName: "BlueHorizon Infrastructure",
    courtName: "NCLT New Delhi (Bench-III)",
    itemNumber: 3,
    courtRoom: "Court Room 2",
    judgeName: "Hon'ble Member (Judicial) & Member (Technical)",
    stage: "Admission",
    hearingDate: "24 Sep 2026, 11:30 AM",
    hearingTime: "11:30 AM",
    purposeEn: "Section 7 IBC Application - Default Verification",
    purposeHi: "धारा 7 आईबीसी आवेदन - वित्तीय चूक का सत्यापन",
    previousOrderSummaryEn: "Corporate debtor sought 1 week to present OTS proposal to financial creditor.",
    previousOrderSummaryHi: "कॉर्पोरेट देनदार ने ओटीएस प्रस्ताव प्रस्तुत करने के लिए 1 सप्ताह का समय मांगा।"
  }
];

export const mockCaseFiles: CaseFile[] = [
  {
    id: "case-1",
    caseNumber: "CRL.A./882/2025",
    clientName: "Vikramaditya Singhania",
    clientPhone: "+91 98101 22334",
    opponentName: "State (Govt. of NCT of Delhi)",
    court: "High Court",
    courtLocation: "Delhi High Court (Bench No. 3)",
    actSections: ["Section 389 CrPC", "Sections 420, 120B IPC", "Sec 318 BNS"],
    caseType: "Criminal Appeal",
    filingDate: "14 Nov 2025",
    nextHearingDate: "Today, 10:30 AM",
    status: "Active",
    unreadDocuments: 1,
    pendingChecklistItems: 0,
    totalBilled: 85000,
    totalCollected: 65000
  },
  {
    id: "case-2",
    caseNumber: "CC/4128/2026",
    clientName: "M/s Apex Logistics Ltd.",
    clientPhone: "+91 98711 44556",
    opponentName: "Skyline Exports Pvt. Ltd.",
    court: "District Court",
    courtLocation: "Tis Hazari Court (MM-04)",
    actSections: ["Section 138 NI Act", "Section 142 NI Act"],
    caseType: "Negotiable Instruments Matter",
    filingDate: "12 Feb 2026",
    nextHearingDate: "Today, 01:45 PM",
    status: "Active",
    unreadDocuments: 2,
    pendingChecklistItems: 1,
    totalBilled: 45000,
    totalCollected: 45000
  },
  {
    id: "case-3",
    caseNumber: "CS/330/2024",
    clientName: "Smt. Sunita Goyal",
    clientPhone: "+91 99530 88990",
    opponentName: "Rameshwar Dayal & Ors.",
    court: "District Court",
    courtLocation: "Patiala House Courts (ADJ-02)",
    actSections: ["Section 34 Specific Relief Act", "Order VII CPC"],
    caseType: "Civil Suit for Declaration & Injunction",
    filingDate: "03 Aug 2024",
    nextHearingDate: "Tomorrow, 11:00 AM",
    status: "Active",
    unreadDocuments: 0,
    pendingChecklistItems: 2,
    totalBilled: 70000,
    totalCollected: 50000
  }
];

export const mockDocuments: DocumentItem[] = [
  {
    id: "doc-1",
    caseNumber: "CRL.A./882/2025",
    titleEn: "Trial Court Judgment & Conviction Order",
    titleHi: "निचली अदालत का निर्णय एवं दोषसिद्धि आदेश",
    requiredFormat: "Certified Copy",
    status: "Verified",
    uploadedAt: "18 Sep 2026",
    fileSize: "4.8 MB PDF"
  },
  {
    id: "doc-2",
    caseNumber: "CRL.A./882/2025",
    titleEn: "Medical Custody & Health Status Report",
    titleHi: "चिकित्सा हिरासत एवं स्वास्थ्य स्थिति रिपोर्ट",
    requiredFormat: "Original",
    status: "Verified",
    uploadedAt: "19 Sep 2026",
    fileSize: "1.2 MB PDF"
  },
  {
    id: "doc-3",
    caseNumber: "CC/4128/2026",
    titleEn: "Dishonoured Cheque & Bank Return Memo",
    titleHi: "अनादरित चेक एवं बैंक वापसी मेमो",
    requiredFormat: "Original",
    status: "Verified",
    uploadedAt: "15 Sep 2026",
    fileSize: "2.1 MB PDF"
  },
  {
    id: "doc-4",
    caseNumber: "CC/4128/2026",
    titleEn: "Postal Receipt & Tracking Consignment Report",
    titleHi: "डाक रसीद एवं ट्रैकिंग रिपोर्ट (वैधानिक नोटिस)",
    requiredFormat: "Self-Attested",
    status: "Format_Issue",
    uploadedAt: "19 Sep 2026",
    validationNoteEn: "Notice: Low-resolution camera photo uploaded without post-office stamp stamp clearly visible. Client requested to rescan.",
    validationNoteHi: "सूचना: कम रिज़ॉल्यूशन वाली तस्वीर मिली। डाकघर की मोहर स्पष्ट नहीं है। मुवक्किल से पुनः स्कैन की मांग की गई।",
    fileSize: "850 KB JPG"
  },
  {
    id: "doc-5",
    caseNumber: "CS/330/2024",
    titleEn: "Registered Sale Deed & Mutation Certificate",
    titleHi: "पंजीकृत बैनामा (सेल डीड) एवं नामांतरण प्रमाणपत्र",
    requiredFormat: "Certified Copy",
    status: "Pending",
    validationNoteEn: "Awaiting client upload from Sub-Registrar Office.",
    validationNoteHi: "उप-पंजीयक कार्यालय से प्रमाणित प्रति अपलोड प्रतीक्षारत।"
  }
];

export const mockAIBriefs: AIIntakeBrief[] = [
  {
    id: "ai-brief-1",
    clientName: "Rohit Malhotra (Commercial Client)",
    caseCategory: "Cheque Dishonour / Banking Law",
    briefTitleEn: "Dishonour of ₹14.5 Lakh Business Payment Cheque",
    briefTitleHi: "₹14.5 लाख के व्यावसायिक चेक का अनादरण",
    summaryTextEn: "Client supplied industrial valves worth ₹14,50,000 on credit. Cheque issued on 10 Aug 2026 returned with remark 'Funds Insufficient'. Statutory notice dispatched via Speed Post on 22 Aug 2026 was delivered on 25 Aug 2026. 15-day notice period expired with no payment.",
    summaryTextHi: "मुवक्किल ने ₹14,50,000 मूल्य के औद्योगिक वॉल्व क्रेडिट पर दिए थे। 10 अगस्त 2026 को जारी चेक 'अपर्याप्त निधि' के कारण वापस लौटा। 22 अगस्त को स्पीड पोस्ट द्वारा भेजा गया कानूनी नोटिस 25 अगस्त को प्राप्त हुआ। 15 दिनों की अवधि बिना भुगतान समाप्त हो चुकी है।",
    extractedFactsEn: [
      "Cheque No. 492019 drawn on HDFC Bank Ltd. for ₹14,50,000",
      "Bank Return Memo dated 12 Aug 2026 ('Funds Insufficient')",
      "Statutory demand notice issued on Day 10 of receiving memo (within 30 days limitation)",
      "Postal tracking confirmation shows delivery on 25 Aug 2026",
      "30-day limitation to file complaint before Magistrate expires in 4 days"
    ],
    extractedFactsHi: [
      "एचडीएफसी बैंक पर आहरित चेक संख्या 492019 (राशि ₹14,50,000)",
      "बैंक रिटर्न मेमो दिनांक 12 अगस्त 2026 ('अपर्याप्त निधि')",
      "मेमो प्राप्ति के 10वें दिन कानूनी मांग नोटिस प्रेषित (30 दिन की सीमा में)",
      "डाक ट्रैकिंग रिकॉर्ड 25 अगस्त 2026 को सफल डिलीवरी दर्शाता है",
      "मजिस्ट्रेट के समक्ष परिवाद दायर करने की 30 दिवसीय अवधि 4 दिनों में समाप्त"
    ],
    applicableSections: ["Section 138 NI Act", "Section 142 NI Act", "Section 406/420 IPC / Sec 318 BNS"],
    confidenceScore: 96,
    intakeTimestamp: "Yesterday, 08:30 PM",
    readinessScore: 92,
    clientConsentGiven: true
  },
  {
    id: "ai-brief-2",
    clientName: "Dr. Ananya Sen (Consumer Dispute)",
    caseCategory: "Consumer Protection / Medical Negligence",
    briefTitleEn: "Deficiency of Service against Apex Multi-Specialty Hospital",
    briefTitleHi: "एपेक्स मल्टी-स्पेशियलिटी अस्पताल के विरुद्ध सेवा में कमी",
    summaryTextEn: "Client paid ₹4,20,000 for planned laparoscopic procedure. Hospital billing included duplicate ICU bed charges and unauthorized diagnostic panels without informed consent. Grievance escalated to Medical Superintendent yielded no response.",
    summaryTextHi: "मुवक्किल ने लैप्रोस्कोपिक प्रक्रिया हेतु ₹4,20,000 का भुगतान किया। बिल में आईसीयू के दोहरे शुल्क और बिना सहमति के अनधिकृत जांच शुल्क शामिल किए गए। अस्पताल अधीक्षक से की गई शिकायत का कोई उत्तर नहीं मिला।",
    extractedFactsEn: [
      "Original admission package estimate: ₹2,10,000; Final bill: ₹4,20,000",
      "Consent form lacked signatures for high-tier diagnostic panels",
      "Digital payment receipts and discharge summary preserved in high resolution",
      "Jurisdiction lies with State Consumer Disputes Redressal Commission"
    ],
    extractedFactsHi: [
      "प्रारंभिक अनुमान: ₹2,10,000; अंतिम बिल: ₹4,20,000",
      "उच्च-स्तरीय जांच पैनल पर मुवक्किल के सहमति हस्ताक्षर अनुपस्थित",
      "डिजिटल भुगतान रसीदें एवं डिस्चार्ज सारांश उच्च गुणवत्ता में उपलब्ध",
      "क्षेत्राधिकार: राज्य उपभोक्ता विवाद निवारण आयोग (SCDRC)"
    ],
    applicableSections: ["Section 2(11) Consumer Protection Act, 2019", "Section 35 & 47 CPA 2019"],
    confidenceScore: 91,
    intakeTimestamp: "Today, 09:15 AM",
    readinessScore: 84,
    clientConsentGiven: true
  }
];

export const mockInvoices: InvoiceItem[] = [
  {
    id: "inv-101",
    invoiceNumber: "NYAAY/2026/094",
    caseNumber: "CRL.A./882/2025",
    clientName: "Vikramaditya Singhania",
    date: "18 Sep 2026",
    appearanceFee: 35000,
    draftingFee: 15000,
    clerkageAndMisc: 3500,
    totalAmount: 53500,
    status: "Paid",
    paidVia: "UPI",
    upiRef: "UPI/328910482910/AXIS"
  },
  {
    id: "inv-102",
    invoiceNumber: "NYAAY/2026/098",
    caseNumber: "CC/4128/2026",
    clientName: "M/s Apex Logistics Ltd.",
    date: "19 Sep 2026",
    appearanceFee: 18000,
    draftingFee: 7000,
    clerkageAndMisc: 1500,
    totalAmount: 26500,
    status: "Pending"
  },
  {
    id: "inv-103",
    invoiceNumber: "NYAAY/2026/089",
    caseNumber: "CS/330/2024",
    clientName: "Smt. Sunita Goyal",
    date: "05 Sep 2026",
    appearanceFee: 20000,
    draftingFee: 8000,
    clerkageAndMisc: 2000,
    totalAmount: 30000,
    status: "Paid",
    paidVia: "UPI",
    upiRef: "UPI/325591024419/SBI"
  }
];

export const mockJudicialAnalytics: JudicialAnalytic[] = [
  {
    id: "bench-1",
    judgeName: "Court No. 14 (Hon'ble Justice S. K. Kaul)",
    court: "Delhi High Court - Criminal Appellate Division",
    dispositionTrendEn: "Strict adherence to procedural deadlines; high preference for concise written synopses before oral hearing.",
    dispositionTrendHi: "प्रक्रियात्मक समय-सीमा का कड़ाई से पालन; मौखिक बहस से पूर्व संक्षिप्त लिखित सारांश को प्राथमिकता।",
    avgHearingIntervalDays: 16,
    adjournmentFrequencyEn: "Low (< 12% grant rate for casual requests)",
    adjournmentFrequencyHi: "बहुत कम (अनावश्यक स्थगन अनुरोधों पर 12% से कम स्वीकृति)",
    keyObservationEn: "Focus oral arguments strictly on health records or parity with co-accused in suspension of sentence petitions.",
    keyObservationHi: "सजा के निलंबन याचिकाओं में विशेष रूप से स्वास्थ्य कारणों अथवा सह-अभियुक्तों से समानता पर ध्यान केंद्रित करें।"
  },
  {
    id: "bench-2",
    judgeName: "Court No. 208 (Sh. Ankit Verma, MM)",
    court: "Tis Hazari Courts - Special NI Act Court",
    dispositionTrendEn: "Encourages pre-trial mediation; strictly monitors Sec 143A interim compensation orders.",
    dispositionTrendHi: "पूर्व-परीक्षण मध्यस्थता को बढ़ावा; धारा 143A के अंतरिम मुआवजे के आदेशों की कड़ी निगरानी।",
    avgHearingIntervalDays: 28,
    adjournmentFrequencyEn: "Moderate (Cost imposed on second adjournment)",
    adjournmentFrequencyHi: "मध्यम (दूसरी बार तारीख मांगने पर हर्जाना आरोपित)",
    keyObservationEn: "Ensure original ledger statement with Section 65B Indian Evidence Act certificate is filed before CW-1 enters box.",
    keyObservationHi: "सुनिश्चित करें कि धारा 65B साक्ष्य अधिनियम प्रमाणपत्र सहित मूल खाता बही गवाह पेशी से पूर्व दाखिल हो।"
  }
];

export const mockForumPosts: ForumPost[] = [
  {
    id: "post-1",
    authorName: "Adv. Meenakshi Sundaram",
    authorBarCouncil: "Bar Council of Tamil Nadu (MS/920/2012)",
    titleEn: "Admissibility of WhatsApp chat logs under Bharatiya Sakshya Adhiniyam, 2023",
    titleHi: "भारतीय साक्ष्य अधिनियम, 2023 के तहत व्हाट्सएप चैट लॉग्स की ग्राह्यता",
    contentEn: "Sharing practical experience from Madras HC: Certificate requirements under Section 63 BSA have specific wording parameters for hashed cloud backups. Draft template attached for peer advocates.",
    contentHi: "मद्रास उच्च न्यायालय का व्यावहारिक अनुभव: धारा 63 बीएसए के तहत क्लाउड बैकअप हेतु प्रमाणपत्र प्रारूप में विशिष्ट शब्दावली आवश्यक है। अधिवक्ता बंधुओं हेतु प्रारूप संलग्न।",
    tags: ["BSA 2023", "Digital Evidence", "High Court"],
    repliesCount: 19,
    upvotes: 47,
    timeAgoEn: "2 hours ago",
    timeAgoHi: "2 घंटे पूर्व"
  },
  {
    id: "post-2",
    authorName: "Adv. Tarun Chawla",
    authorBarCouncil: "Bar Council of Delhi (D/2219/2018)",
    titleEn: "Standard practice for Sec 138 NI summons service via Registered Speed Post & Email",
    titleHi: "स्पीड पोस्ट एवं ईमेल द्वारा धारा 138 समन तामील की मानक प्रक्रिया",
    contentEn: "Recent coordinate bench judgment in Delhi reinforces that affidavit of service attaching postal tracking consignment report with blue delivery tick is conclusive under Section 27 General Clauses Act.",
    contentHi: "दिल्ली उच्च न्यायालय का हालिया निर्णय: डाक डिलीवरी रिपोर्ट के साथ तामीली शपथपत्र सामान्य खंड अधिनियम की धारा 27 के तहत पूर्ण साक्ष्य माना जाता है।",
    tags: ["NI Act", "Summons Service", "Precedents"],
    repliesCount: 14,
    upvotes: 32,
    timeAgoEn: "5 hours ago",
    timeAgoHi: "5 घंटे पूर्व"
  }
];
