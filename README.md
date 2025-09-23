# 🎓 EduCredChain – Salesforce Blockchain Credential & Scholarship Manager  

![License](https://img.shields.io/badge/License-MIT-blue.svg)  
![Salesforce](https://img.shields.io/badge/Salesforce-Cloud-blue)  
![Blockchain](https://img.shields.io/badge/Blockchain-Enabled-green)  

A Salesforce-powered **Education CRM** that manages the complete student lifecycle, issues **tamper-proof blockchain credentials**, and automates **scholarship/loan disbursements** using smart contracts.  

---

## 📌 Project Overview  

Educational institutions and recruiters face increasing problems with:  
- Fake certificates and forged degrees  
- Manual and slow credential verification  
- Delayed scholarship and loan disbursements  

**EduCredChain** solves these challenges by combining **Salesforce CRM + Blockchain** to:  
- Issue blockchain-backed, verifiable certificates  
- Provide recruiters with instant verification via Salesforce Experience Cloud  
- Automate scholarship/loan disbursements via milestone-based smart contracts  

---

## 📌 Key Features  

### 🎓 Student Features  
- View verified blockchain certificates  
- Apply for scholarships/loans digitally  
- Track disbursement status in real time  

### 🏫 University Features  
- Manage student lifecycle (admission → courses → graduation)  
- Issue blockchain-anchored credentials directly from Salesforce  
- Automate milestone-based scholarship releases  

### 🏢 Recruiter Features  
- Instantly verify candidate credentials  
- Access verified transcripts & certificates  
- Reduce hiring fraud and verification delays  

### 💰 Finance Features  
- Manage scholarships, loans, and refunds via CRM  
- Smart contracts auto-release funds when milestones are met (e.g., GPA ≥ 3.5, course completion)  
- Full visibility of financial disbursements  

---

## 📌 Salesforce Implementation  

### Phase 1: Problem Understanding & Industry Analysis  
- **Challenges:** Fake certificates, delayed verification, scholarship fraud  
- **Industry Needs:** Tamper-proof credentials, faster verification, automated fund flows  
- **Solution Scope:** Salesforce CRM + Blockchain APIs (Polygon, Hyperledger, Avalanche)  

### Phase 2: Org Setup & Configuration  

**Custom Objects:**  
- `Student__c` – Name, Contact, Enrollment Info  
- `Course__c` – Course Name, Duration, Credits  
- `Credential__c` – Certificate Hash, Blockchain TxID, Issue Date  
- `Scholarship__c` – Amount, Eligibility, Status, Smart Contract Link  
- `Recruiter__c` – Company, Verification Requests  

**Profiles & Permission Sets:**  
- Admin – Full Access  
- University Staff – Manage Students, Courses, Credentials  
- Finance Officer – Manage Scholarships & Loans  
- Recruiter – Verification-only access (via portal)  
- Student – Access to own records (via Experience Cloud)  

**Page Layouts:**  
- Student → Courses, Credentials, Scholarships  
- Recruiter → Verification requests, student details  
- Scholarship → Smart contract status & logs  

### Phase 3: Data Modeling & Relationships  
- Student ↔ Course → M:M (via `Enrollment__c`)  
- Student ↔ Credential → 1:M  
- Student ↔ Scholarship → 1:M  
- Recruiter ↔ Verification_Request → 1:M  

### Phase 4: Process Automation  
- **Credential Issuance Flow** → Generates blockchain hash on credential creation  
- **Scholarship Disbursement Flow** → Auto-release payment on milestone completion  
- **Verification Flow** → Notifies recruiters when credential is verified  
- **Email/SMS Alerts** → For certificate issuance, scholarship payouts, and verification updates  

---

## 📌 Benefits  

✅ Tamper-proof Credentials – Eliminates fake certificates  
✅ Faster Verification – Recruiters verify instantly via blockchain  
✅ Automated Payouts – Scholarships/loans released via smart contracts  
✅ Transparency & Trust – Real-time visibility for all stakeholders  
✅ Scalability – Works for universities, EdTechs, and recruiters globally  

---

## 📌 Tech Stack  

- **Platform:** Salesforce (Education Cloud / Core CRM)  
- **Blockchain:** Hyperledger / Polygon / Avalanche (via API integration)  
- **Automation:** Salesforce Flows, Validation Rules, Email Alerts  
- **Data Model:** Custom Objects & Relationships  
- **Portal:** Salesforce Experience Cloud (for students & recruiters)  

---

## 📌 How to Get Started  

1. Sign up for a [Salesforce Developer Org](https://developer.salesforce.com).  
2. Clone this repository.  
3. Create custom objects & relationships.  
4. Configure profiles, layouts, and portals.  
5. Implement automation flows & blockchain API integration.  
6. Deploy dashboards for real-time insights.  

---

## 📌 System Architecture  

- AI Student Portal (Experience Cloud)  
- Salesforce Blockchain Layer  
- Smart Contract Engine  
- External Data Sources  
- Real-Time Dashboard & Analytics
