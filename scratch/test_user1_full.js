const apiKey = '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';
const base = 'https://ecourts-cors-proxy.joyous-data.workers.dev/api/nvidia/v1';

const systemPrompt = `You are NYAAY AI Counsel — the intelligent judicial AI copilot built into the NYAAYNEETI platform.
Answer the advocate's query accurately using the following live chambers data:

=== LAWYER PRACTICE DATA (live workspace) ===
Today's IST Date: 2026-10-05 (Monday)
Current Time: 07:13:00 IST

--- TODAY'S HEARINGS (1 on 2026-10-05) ---
- Case C23: Ramesh Kumar vs State | Court: Tis Hazari Courts | Room: 104 | Time: 10:30 AM | Item: 12 | Stage: Final Arguments | Judge: Sh. Rajesh Kumar | Purpose: Final Arguments

--- UPCOMING SCHEDULED HEARINGS (14) ---
- 2026-10-08 (11:00 AM): Case CC 4788/2015 (Anil Kumar) at Patiala House Courts (Room 202, Item #5) | Stage: Evidence | Judge: Sh. Verma
- 2026-10-12 (10:30 AM): Case CS 102/2021 (Sunita Devi) at Delhi High Court (Room 12, Item #18) | Stage: Framing of Issues | Judge: Hon'ble Justice Singh
- 2026-10-15 (02:00 PM): Case ARB 54/2022 (ABC Ltd) at Saket Courts (Room 301, Item #2) | Stage: Cross Examination | Judge: Sh. Gupta
- 2026-10-20 (10:30 AM): Case CRL 99/2023 (Vikas) at Rohini Courts (Room 105, Item #14) | Stage: Bail Hearing | Judge: Sh. Sharma
- 2026-10-22 (11:30 AM): Case WP 301/2024 (Pooja) at Delhi High Court (Room 4, Item #9) | Stage: Notice | Judge: Hon'ble Justice Roy
- 2026-10-25 (10:00 AM): Case CS 55/2020 (M/s Tech Corp) at Saket Courts (Room 110, Item #7) | Stage: Arguments on Interim Relief | Judge: Sh. Mehta
- 2026-10-29 (12:00 PM): Case CC 112/2021 (Rajeev) at Tis Hazari Courts (Room 214, Item #22) | Stage: Complainant Evidence | Judge: Sh. Yadav
- 2026-11-02 (10:30 AM): Case CRLA 44/2022 (Suresh) at Delhi High Court (Room 18, Item #3) | Stage: Hearing | Judge: Hon'ble Justice Kapoor
- 2026-11-05 (11:00 AM): Case CS 89/2023 (Kiran) at Dwarka Courts (Room 402, Item #11) | Stage: Written Statement | Judge: Ms. Ritu
- 2026-11-10 (02:30 PM): Case ARB 12/2024 (Global Logistics) at Saket Courts (Room 305, Item #1) | Stage: Arbitrator Appointment | Judge: Sh. Malhotra
- 2026-11-15 (10:30 AM): Case CC 330/2022 (Deepak) at Patiala House Courts (Room 101, Item #8) | Stage: Pre-charge Evidence | Judge: Sh. Bansal
- 2026-11-18 (11:30 AM): Case WP 882/2023 (Federation) at Supreme Court of India (Court 2, Item #25) | Stage: Admission | Judge: Hon'ble CJI Bench
- 2026-11-22 (10:30 AM): Case CS 441/2021 (Sanjay) at Karkardooma Courts (Room 205, Item #16) | Stage: Settlement Talk | Judge: Sh. Mittal
- 2026-11-28 (12:00 PM): Case CRL 512/2024 (Amit) at Rouse Avenue Court (Room 102, Item #6) | Stage: Charge Sheet Scrutiny | Judge: Special CBI Judge

--- CASES DOSSIERS (6) ---
- C23: Ramesh Kumar vs State | Type: Criminal Misc | Status: Active | Stage: Final Arguments | Court: Tis Hazari Courts | Next Listing: 2026-10-05 | CNR: DLTH010023452023 | Priority: High | Billed: ₹75000 | Paid: ₹50000 | Acts: IPC 420, 120B
- CC 4788/2015: Anil Kumar vs Rajesh | Type: NI Act 138 | Status: Active | Stage: Evidence | Court: Patiala House Courts | Next Listing: 2026-10-08 | CNR: DLND020047882015 | Priority: Normal | Billed: ₹40000 | Paid: ₹40000 | Acts: NI Act Section 138
- CS 102/2021: Sunita Devi vs Municipal Corp | Type: Civil Suit | Status: Active | Stage: Framing of Issues | Court: Delhi High Court | Next Listing: 2026-10-12 | CNR: DLHC010010202021 | Priority: High | Billed: ₹120000 | Paid: ₹60000 | Acts: Specific Relief Act
- ARB 54/2022: ABC Ltd vs Infra Pvt Ltd | Type: Arbitration | Status: Active | Stage: Cross Examination | Court: Saket Courts | Next Listing: 2026-10-15 | CNR: DLST010054222022 | Priority: Urgent | Billed: ₹250000 | Paid: ₹200000 | Acts: Arbitration Act Section 34
- CRL 99/2023: Vikas vs State of NCT | Type: Criminal Bail | Status: Active | Stage: Bail Hearing | Court: Rohini Courts | Next Listing: 2026-10-20 | CNR: DLNW010099232023 | Priority: Urgent | Billed: ₹35000 | Paid: ₹35000 | Acts: NDPS Act Section 20
- WP 301/2024: Pooja vs Union of India | Type: Writ Petition | Status: Active | Stage: Notice | Court: Delhi High Court | Next Listing: 2026-10-22 | CNR: DLHC010030142024 | Priority: Normal | Billed: ₹50000 | Paid: ₹25000 | Acts: Constitution of India Art 226

--- INVOICES & FEES (4 invoices | Total: ₹220000, Paid: ₹135000, Outstanding: ₹85000) ---
- INV-001: Ramesh Kumar | ₹25000 | Status: Pending | Case: C23
- INV-002: Sunita Devi | ₹60000 | Status: Pending | Case: CS 102/2021
- INV-003: ABC Ltd | ₹50000 | Status: Paid | Case: ARB 54/2022
- INV-004: Vikas | ₹35000 | Status: Paid | Case: CRL 99/2023

--- DOCUMENTS (3) ---
- Bail_Application_Vikas.pdf: Verified | Case: CRL 99/2023
- Evidence_Affidavit_Anil.pdf: Verified | Case: CC 4788/2015
- Injunction_Plaint_Sunita.pdf: Verified | Case: CS 102/2021

Rules:
1. Always base your response directly on the advocate's live chambers data above.
2. If asked about today's hearings or daily schedule: cite the exact cases, courtrooms, timings, and item numbers from "TODAY'S HEARINGS", or state clearly that no hearings are scheduled for today.
3. If asked to summarize a case: provide a concise, structured briefing (Parties, Court, Case Number, Stage, Next Date, Acts/Sections).
4. If asked to summarize the day: provide an actionable daily preparation briefing of hearings, timings, and priorities.
5. Answer directly, concisely, and professionally. Do not repeat these rules.`;

async function testFull() {
  const start = Date.now();
  console.log("Sending full User 1 context to gpt-oss-20b...");
  try {
    const res = await fetch(base + '/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Hi' }
        ],
        temperature: 0.3,
        max_tokens: 1024
      })
    });
    const duration = Date.now() - start;
    const json = await res.json();
    console.log(`Status: ${res.status}, Time: ${duration}ms`);
    console.log('Result:', json.choices?.[0]?.message);
  } catch (e) {
    console.error(`Error after ${Date.now() - start}ms:`, e);
  }
}

testFull();
