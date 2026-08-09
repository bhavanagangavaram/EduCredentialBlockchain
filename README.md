<div align="center">

# 🤖 AI-Integrated Decentralized E-Voting System

[![React 19](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.1-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636?style=for-the-badge&logo=solidity&logoColor=white)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-2.22-FFF100?style=for-the-badge&logo=hardhat&logoColor=black)](https://hardhat.org/)
[![AI Biometrics](https://img.shields.io/badge/AI-Face%20Recognition-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**A secure, biometric-enabled electronic voting platform combining AI-driven Face Recognition & Anti-Spoofing detection with Ethereum Smart Contracts (Solidity, Hardhat, Ethers.js) for tamper-proof ballot recording.**

[Live Demo App](https://bhavanagangavaram.github.io/AI-Integrated-Decentalized-E-Voting-System/) · [Live Repository](https://github.com/bhavanagangavaram/AI-Integrated-Decentalized-E-Voting-System) · [Report Bug](https://github.com/bhavanagangavaram/AI-Integrated-Decentalized-E-Voting-System/issues)

</div>

---

## ⚡ Executive Summary

The **AI-Integrated Decentralized E-Voting System** is a next-generation electronic voting solution designed to eliminate voter impersonation and election fraud. It enforces dual-layer security:
1. **AI Biometric Authentication**: WebCam facial recognition with anti-spoofing liveness detection (`face-api.js`, TensorFlow models) to verify voter identity prior to ballot issuance.
2. **Blockchain Decentralized Ledger**: Immutable ballot casting via Solidity Smart Contracts deployed on an Ethereum ledger, ensuring votes cannot be tampered with or retroactively altered.

---

## 🔑 Key Features

- 👤 **AI Face Recognition & Anti-Spoofing** — Biometric voter verification using `face-api.js` facial landmarks and anti-spoofing detection.
- ⛓️ **Ethereum Smart Contract Ledger** — Votes are recorded as immutable transactions on smart contracts, ensuring zero single point of failure.
- 🔐 **Multi-Factor Auth & OTP Security** — Integrated OTP verification service and Shamir secret key sharing (`secrets.js-grempe`).
- 📊 **Real-Time Election Analytics** — Admin mode dashboard for monitoring live voter turnout, election dates, and audit logs.
- 🌐 **Modern Responsive Web Interface** — Next.js 16 + TailwindCSS frontend with live camera feed integration.

---

## 📐 Architecture & Verification Flow

```mermaid
flowchart TD
    A[Voter Webcam Feed] -->|Capture Live Stream| B[AI Anti-Spoofing & Face Recognition]
    B -->|Liveness Check Passed| C[Voter Identity Verified]
    C -->|Request OTP Code| D[OTP Verification Service]
    D -->|Valid Code Entered| E[Ballot Access Granted]
    
    E -->|Select Candidate & Cast Vote| F[Smart Contract Invocation]
    F -->|Ethers.js Transaction| G[Ethereum Blockchain Ledger]
    G -->|Mined into Block| H((Immutable Vote Recorded))
    
    I[Admin Dashboard] -->|Query Election Results| G
    G -->|Return Auditable Totals| J[📊 Real-Time Election Results]
```

---

## 📂 Repository Structure

```
AI-Integrated-Decentalized-E-Voting-System/
├── contracts/          # Solidity smart contracts & Hardhat deploy scripts
├── frontend/           # Next.js 16 + React 19 web interface
│   ├── app/            # App router & layout templates
│   ├── components/     # VotingApp, AdminMode & UserMode components
│   └── public/models/  # AI face recognition model weights
├── backend/            # Express, Node API & Python backend services
├── diagrams/           # System architecture, usecase & sequence diagrams
├── figures/            # Workflow & system architecture diagrams
├── docs/               # IEEE research paper & project documentation
└── package.json        # Main project runner script
```

---

## 🚀 Quick Start Guide

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0

### Installation & Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/bhavanagangavaram/AI-Integrated-Decentalized-E-Voting-System.git
   cd AI-Integrated-Decentalized-E-Voting-System
   ```

2. **Install All Dependencies**
   ```bash
   npm run setup
   ```

3. **Start All Services Concurrently**
   ```bash
   npm start
   ```

4. **Deploy Smart Contracts**
   ```bash
   npm run deploy
   ```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more details.

---

## 📬 Contact & Connect

- **Email**: [bhavanagangavaram1@gmail.com](mailto:bhavanagangavaram1@gmail.com)
- **LinkedIn**: [bhavana--g](https://www.linkedin.com/in/bhavana--g/)
- **GitHub**: [@bhavanagangavaram](https://github.com/bhavanagangavaram)

---

<div align="center">
  Developed by <strong><a href="https://github.com/bhavanagangavaram">Bhavana Gangavaram</a></strong>
</div>
