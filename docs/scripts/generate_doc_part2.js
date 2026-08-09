// Part 2: Chapters 1-3 — Clean academic formatting, no duplicate headings
const P1 = require('./generate_doc_part1');
const { chapterTitle, h2, h3, p, bp, bull, nItem, tc,
  Table, TableRow, TableCell, WidthType, ShadingType, Paragraph, TextRun, AlignmentType, PageBreak } = P1;
const TNR = "Times New Roman";

function getChapter1() {
  return [
    ...chapterTitle("1", "Introduction"),

    h2("1.1 Introduction"),
    p("The democratic process is based on the integrity, accessibility, and total secrecy of the voting process. As the scale of the election process increases globally, paper-based voting has incurred considerable logistical costs, contributing to delays in the tabulation of results. Electronic Voting Machines (EVMs) and electronic remote voting were introduced to alleviate these issues. However, EVMs have brought core issues of database tampering, spoofing of identities by proxy votes, and voter coercion."),
    p("In the traditional approach to identity verification in physical voting stations, identity documents are verified manually. This approach is prone to human errors and can be tampered with. The need for a secure, transparent, and verifiable voting system that preserves ballot secrecy while providing cryptographic auditability has motivated this research."),
    p("Blockchain technology has provided an environment that can be verified by cryptographic means via an immutable distributed ledger. However, the storage of votes in plaintext on the blockchain violates the secrecy of votes. This core issue of public verifiability versus vote secrecy has been the primary research gap addressed by this project."),
    p("This project presents a novel AI-integrated decentralized e-voting system that leverages Ethereum blockchain technology, three-factor authentication, RSA-2048 ballot encryption, Shamir's Secret Sharing for decentralized key management, and real-time AI-based anti-coercion monitoring to address all known vulnerabilities in electronic voting systems."),

    h2("1.2 Domain Description"),
    h3("1.2.1 Blockchain Technology"),
    p("Blockchain is a distributed, immutable ledger technology that records transactions across a peer-to-peer network. In the context of e-voting, blockchain provides transparency, immutability, and decentralization. The Ethereum blockchain, used in this project, supports smart contracts — self-executing programs that enforce voting rules without a trusted intermediary. Smart contracts written in Solidity handle voter registration, encrypted ballot storage, and candidate management."),
    h3("1.2.2 Artificial Intelligence and Computer Vision"),
    p("Artificial Intelligence (AI) plays a critical role in this system through biometric face recognition and anti-coercion monitoring. The face recognition module uses Convolutional Neural Networks (CNNs) via the Face-api.js library, which is built on TensorFlow.js. The system extracts 128-dimensional facial descriptors for identity verification and performs continuous real-time monitoring during voting to detect multiple faces (coercion indicators), unrecognized persons, and identity switches."),
    h3("1.2.3 Cryptography"),
    p("The project employs RSA-2048 asymmetric encryption for ballot secrecy. Votes are encrypted client-side using the election public key before being stored on the blockchain. Shamir's Secret Sharing (SSS) scheme splits the election private key into 5 shares with a threshold of 3 for reconstruction, ensuring no single authority can decrypt votes independently. SHA-256 hashing is used for biometric data privacy."),
    h3("1.2.4 Web Application Development"),
    p("The system is built as a decentralized application (DApp) using React.js with Next.js framework for the frontend, Node.js with Express for the backend API server, Python with FastAPI for the AI processing server, and Hardhat for blockchain development and deployment. MetaMask browser extension provides wallet connectivity for blockchain interactions."),

    h2("1.3 Problem Definition"),
    p("Existing electronic voting systems face the following critical problems:"),
    bull("Centralized Database Vulnerability: Traditional EVMs store vote data in centralized databases controlled by a single authority, creating a single point of failure vulnerable to manipulation and tampering."),
    bull("Identity Fraud and Proxy Voting: Manual identity verification at physical polling stations relies on document checks that are prone to human error, impersonation, and proxy voting."),
    bull("Absence of Ballot Secrecy on Blockchain: While blockchain provides immutability and transparency, existing blockchain-based voting implementations store votes in plaintext, violating the fundamental principle of ballot secrecy."),
    bull("No Real-Time Coercion Detection: Current systems lack any mechanism to detect voter coercion in real-time. A coercer can stand behind the voter and influence their choice without detection."),
    bull("Single-Authority Key Management: In systems that encrypt votes, decryption is typically controlled by a single authority, creating a trust bottleneck and potential for abuse."),
    bull("Weak Authentication: Most systems rely on single-factor authentication (password or ID card), which is easily compromised."),

    h2("1.4 Proposed Solution"),
    p("The proposed system addresses all identified problems through a multi-layered security architecture:"),
    bp("Decentralized Storage: ", "All vote records are stored on the Ethereum blockchain, eliminating centralized points of failure. The immutable ledger ensures that once a vote is recorded, it cannot be modified or deleted."),
    bp("Three-Factor Authentication (3FA): ", "The system combines three independent authentication factors — (1) MetaMask wallet possession (something you have), (2) Dual-channel OTP via Email and SMS (something you know), and (3) CNN-based live face recognition (something you are) — creating a robust identity verification pipeline."),
    bp("Client-Side RSA-2048 Encryption: ", "Votes are encrypted in the voter's browser using the election public key before transmission to the blockchain. Only the encrypted ciphertext is stored on-chain, preserving ballot secrecy even on a transparent ledger."),
    bp("Shamir's Secret Sharing (SSS): ", "The election private key is split into 5 shares using SSS over GF(2^8), with a threshold of 3 shares required for reconstruction. Shares are distributed to independent election committee members, preventing any single authority from decrypting votes."),
    bp("AI Anti-Coercion Monitoring: ", "During ballot casting, the system continuously monitors the voter's webcam feed using Face-api.js. It detects multiple faces (indicating a coercer), identity switches, and face absence. A 5-second grace period is provided before triggering a tiered lockout system."),
    bp("Booth Mode with VVPAT: ", "For supervised voting environments, the system provides a dedicated booth mode where an administrator verifies the voter's identity and facilitates the voting process, with a digital Voter-Verified Paper Audit Trail."),

    h2("1.5 Objectives"),
    p("The primary objectives of this project are:"),
    nItem(1, "To develop a decentralized e-voting system on the Ethereum blockchain that ensures transparency, immutability, and tamper-resistance of voting records."),
    nItem(2, "To implement end-to-end ballot encryption using RSA-2048 to preserve vote secrecy on a public blockchain."),
    nItem(3, "To deploy Shamir's Secret Sharing scheme (3-of-5 threshold) for decentralized key management, eliminating single points of failure in vote decryption."),
    nItem(4, "To implement three-factor authentication combining blockchain wallet ownership, dual-channel OTP verification (Email + SMS), and CNN-based biometric face recognition."),
    nItem(5, "To integrate real-time AI-based anti-coercion monitoring using computer vision for detecting multiple faces, identity switches, and coercion attempts during the voting process."),
    nItem(6, "To develop a supervised booth mode with VVPAT support for secure voting in physical polling stations."),
    nItem(7, "To evaluate the system's performance using real-world benchmark datasets including LFW, CelebA-Spoof, and controlled video recordings."),
    nItem(8, "To conduct formal security analysis against six categories of attacks: replay, Sybil, man-in-the-middle, coercion, spoofing, and key compromise attacks."),

    h2("1.6 Organization of the Project Report"),
    p("This project report is organized into seven chapters as follows:"),
    bp("Chapter 1 — Introduction: ", "Provides an overview of the project, domain description, problem definition, proposed solution, and project objectives."),
    bp("Chapter 2 — Literature Survey: ", "Reviews existing research on blockchain-based voting systems, biometric authentication, and anti-coercion mechanisms. Identifies research gaps addressed by this project."),
    bp("Chapter 3 — System Analysis: ", "Analyzes the existing system's limitations, describes the proposed system's advantages, defines software and hardware requirements, and details the system modules and architecture."),
    bp("Chapter 4 — System Design: ", "Presents the system design through Data Flow Diagrams (DFDs) and UML diagrams including Use Case, Sequence, Class, Collaboration, and Activity diagrams."),
    bp("Chapter 5 — System Coding & Testing: ", "Describes the implementation details, technologies used, sample code from key modules, and software testing techniques and strategies employed."),
    bp("Chapter 6 — Results: ", "Presents the experimental results, performance metrics, and output screens of the implemented system."),
    bp("Chapter 7 — Conclusion & Future Enhancements: ", "Summarizes the project findings and discusses potential future enhancements including Layer 2 scaling and zero-knowledge proofs."),

    // Required statement at end of Chapter 1
    new Paragraph({ spacing: { before: 400 } }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 360 },
      indent: { firstLine: 720 },
      children: [new TextRun({ text: "This project report has been prepared by referring to three standard documentation templates to maintain consistency in structure, formatting, and professional presentation.", font: TNR, size: 24, italics: true })]
    }),
  ];
}

function getChapter2() {
  return [
    ...chapterTitle("2", "Literature Survey"),

    h2("2.1 Introduction"),
    p("This chapter reviews the existing literature on blockchain-based voting systems, biometric authentication mechanisms, and anti-coercion techniques. The survey identifies the research gaps that motivate the development of the proposed AI-integrated decentralized e-voting system. A systematic analysis of eight significant research works is presented, followed by a comparative overview."),

    h2("2.2 Related Work"),
    h3("2.2.1 Blockchain-Based Voting Systems"),
    p("Sah et al. [1] demonstrated that Ethereum smart contracts can improve vote transparency by providing an immutable public record of all transactions. However, their implementation recorded votes in plaintext on the blockchain without any form of biometric authentication, which violates the fundamental principle of ballot secrecy in democratic elections."),
    p("Alown et al. [3] conducted a comprehensive survey of Direct Recording Electronic (DRE), Internet-based, and blockchain voting systems. Their analysis concluded that decentralized systems are significantly more efficient than centralized systems in terms of auditability. However, the surveyed systems did not support encrypted ballot storage, leaving vote secrecy unaddressed."),
    p("Barelli et al. [2] systematically identified attack surfaces in electronic voting systems and emphasized the need for robust multi-factor authentication. Their work cataloged potential vulnerabilities but did not propose or implement any AI-based solution for addressing these threats."),

    h3("2.2.2 Cryptographic Key Management"),
    p("Reyes-Macedo et al. [4] introduced a threshold-blind signature scheme that demonstrated the viability of distributed key management for blockchain systems. Their approach to splitting cryptographic authority among multiple parties is conceptually similar to the Shamir's Secret Sharing method utilized in this project for election key management."),

    h3("2.2.3 Biometric Authentication Systems"),
    p("Maheshwari et al. [5] proposed a multimodal biometric system that achieved a 100% true acceptance rate on ARM-specific hardware. Despite this impressive performance, the system did not integrate blockchain storage for tamper-proof record-keeping and lacked any form of anti-coercion analysis."),
    p("Kumar et al. [6] developed a system that combined face recognition with mobile one-time passwords and blockchain storage. While this represents a step toward multi-factor authentication in voting, the system ignored the critical issue of voter coercion and did not implement encrypted ballot storage."),
    p("The ViT-LoRA system [7] achieved 97.36% accuracy in facial authentication using Vision Transformer architecture with Low-Rank Adaptation. However, this system focused exclusively on authentication accuracy without addressing anti-coercion analysis or decentralized key management."),
    p("Faruk et al. [8] combined Hyperledger Fabric blockchain with biometric authentication for an online voting system. Their implementation improved upon simple password-based systems but did not include anti-coercion detection or RSA encryption for ballot secrecy."),

    h3("2.2.4 Comparative Analysis"),
    new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
      new TableRow({ children: [tc("Feature", {header:true}), tc("[1]", {header:true}), tc("[3]", {header:true}), tc("[5]", {header:true}), tc("[7]", {header:true}), tc("[8]", {header:true}), tc("Proposed", {header:true})] }),
      new TableRow({ children: [tc("Blockchain",{bold:true}), tc("YES"), tc("YES"), tc("NO"), tc("YES"), tc("YES"), tc("YES")] }),
      new TableRow({ children: [tc("Biometric Auth",{bold:true}), tc("NO"), tc("NO"), tc("YES"), tc("YES"), tc("YES"), tc("YES")] }),
      new TableRow({ children: [tc("Encrypted Ballots",{bold:true}), tc("NO"), tc("NO"), tc("NO"), tc("NO"), tc("NO"), tc("YES")] }),
      new TableRow({ children: [tc("Coercion Detection",{bold:true}), tc("NO"), tc("NO"), tc("NO"), tc("NO"), tc("NO"), tc("YES")] }),
      new TableRow({ children: [tc("Decentralized Keys",{bold:true}), tc("NO"), tc("NO"), tc("NO"), tc("NO"), tc("NO"), tc("YES")] }),
      new TableRow({ children: [tc("OTP Authentication",{bold:true}), tc("NO"), tc("NO"), tc("NO"), tc("NO"), tc("NO"), tc("YES")] }),
    ]}),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 200 },
      children: [new TextRun({ text: "Table 2.1: Comparison of Related E-Voting Systems", font: TNR, size: 22, italics: true })] }),

    h2("2.3 Overview"),
    p("The literature survey reveals that while existing systems have made significant progress in individual aspects of electronic voting — blockchain transparency, biometric authentication, or cryptographic key management — none simultaneously address all critical security dimensions. The key research gaps identified are:"),
    nItem(1, "No existing system combines blockchain immutability with encrypted ballot storage to simultaneously achieve transparency and vote secrecy."),
    nItem(2, "None of the surveyed systems implement real-time AI-based coercion detection during the voting process."),
    nItem(3, "Decentralized key management via threshold secret sharing has not been applied to e-voting ballot decryption in existing implementations."),
    nItem(4, "Multi-factor authentication in surveyed systems is limited to two factors at most, without integrating blockchain wallet ownership as an authentication factor."),
    p("The proposed system addresses all these gaps by integrating six security dimensions: blockchain immutability, biometric verification, ballot encryption, coercion detection, decentralized key recovery, and multi-channel OTP authentication into a single cohesive architecture."),
  ];
}

function getChapter3() {
  return [
    ...chapterTitle("3", "System Analysis"),

    h2("3.1 Introduction"),
    p("This chapter presents a detailed analysis of the existing electronic voting systems, identifies their limitations, and describes the proposed system along with its advantages. The chapter also covers the system modules, architecture, feasibility study, and hardware/software requirements."),

    h2("3.2 Existing System & Disadvantages"),
    p("The existing electronic voting systems, particularly Electronic Voting Machines (EVMs), rely on centralized architectures where vote data is stored in a single database controlled by an election authority."),
    h3("Disadvantages of the Existing System:"),
    nItem(1, "Centralized Storage creates a single point of failure vulnerable to database tampering and unauthorized modifications by insiders."),
    nItem(2, "Manual Identity Verification at polling stations relies on physical document checks that are prone to human error and proxy voting through impersonation."),
    nItem(3, "No End-to-End Encryption means votes stored in plaintext can be read by administrators with database access, compromising ballot secrecy."),
    nItem(4, "No Coercion Detection leaves voters vulnerable to intimidation, as no mechanism exists to detect the presence of a coercer during the voting process."),
    nItem(5, "Limited Audit Trail where internal logs maintained by the election authority can potentially be modified, undermining accountability."),
    nItem(6, "Single Authority Key Management in systems that use encryption creates a trust bottleneck where one entity controls the decryption capability."),

    h2("3.3 Proposed System & Advantages"),
    p("The proposed AI-integrated decentralized e-voting system leverages Ethereum blockchain, artificial intelligence, and advanced cryptography to overcome all limitations of the existing system."),
    h3("Advantages of the Proposed System:"),
    nItem(1, "Decentralized Immutable Storage on Ethereum blockchain eliminates single points of failure and ensures every transaction is permanently recorded and publicly verifiable."),
    nItem(2, "Three-Factor Authentication (3FA) combining wallet possession, dual OTP verification, and CNN-based face recognition makes identity fraud virtually impossible."),
    nItem(3, "Client-Side RSA-2048 Encryption ensures vote secrecy even on a transparent blockchain, as only encrypted ciphertext is stored on-chain."),
    nItem(4, "AI-Powered Anti-Coercion Monitoring with real-time multi-face detection and identity verification provides automated protection against voter intimidation."),
    nItem(5, "Shamir's Secret Sharing (3-of-5 threshold) distributes decryption authority among multiple committee members, preventing single-authority abuse."),
    nItem(6, "Comprehensive Audit Trail with blockchain event logs that are immutable and publicly accessible for independent verification."),

    h2("3.4 Software Requirements"),
    bull("Operating System: Windows 10/11, macOS 12+, or Ubuntu 20.04+"),
    bull("Runtime Environment: Node.js v18.0+, Python 3.9+"),
    bull("Blockchain Framework: Hardhat v2.19+ (local), Ethereum Sepolia Testnet (deployment)"),
    bull("Smart Contract Language: Solidity ^0.8.28"),
    bull("Frontend Framework: React.js 18+ with Next.js 14+"),
    bull("Backend Frameworks: Express.js 4.18+ (Node.js), FastAPI 0.100+ (Python)"),
    bull("Database: SQLite 3 (off-chain voter data storage)"),
    bull("Browser: Google Chrome 110+, Firefox 110+, or Brave with MetaMask v11+"),
    bull("AI/ML Libraries: Face-api.js 0.22+ (built on TensorFlow.js)"),
    bull("Cryptography: JSEncrypt (RSA-2048), Secrets.js-grempe (Shamir's Secret Sharing)"),
    bull("OTP Services: Nodemailer (Email OTP), Twilio SDK (SMS OTP)"),

    h2("3.5 Hardware Requirements"),
    bull("Processor: Intel Core i5 (8th Gen) or equivalent — minimum; Intel Core i7 recommended"),
    bull("RAM: 8 GB minimum, 16 GB recommended for running all services simultaneously"),
    bull("Storage: 10 GB free disk space minimum"),
    bull("Webcam: 720p HD minimum (for face recognition and anti-coercion monitoring)"),
    bull("Network: Stable broadband internet connection (minimum 2 Mbps for blockchain transactions)"),
    bull("Display: 1366×768 minimum resolution"),

    h2("3.6 Modules Description"),
    h3("3.6.1 Voter Registration Module"),
    p("This module handles the registration of voters by the election administrator. The admin captures the voter's facial image through a webcam, extracts a 128-dimensional facial descriptor using Face-api.js SSD MobileNet v1 model, and stores the voter's details (name, wallet address, mobile, email, date of birth) in the SQLite database. A SHA-256 hash of the facial descriptor (faceHash) is stored on the Ethereum blockchain via the registerVoter() smart contract function. Age verification ensures voters are 18 years or older."),

    h3("3.6.2 Three-Factor Authentication Module"),
    p("This module implements the 3FA verification pipeline for voters. Factor 1 verifies wallet possession by checking the MetaMask-connected address against the blockchain registration. Factor 2 sends One-Time Passwords via two independent channels — Email (via Nodemailer/Gmail SMTP) and SMS (via Twilio API) — and verifies both codes through the OTP service. Factor 3 captures a live facial image and compares it against the stored descriptor using Euclidean distance with a threshold of 0.65."),

    h3("3.6.3 Encrypted Voting Module"),
    p("Once 3FA succeeds, this module enables vote casting. The frontend retrieves the election public key from the smart contract, encrypts the selected candidate's ID using RSA-2048 (via JSEncrypt library), and submits the encrypted ciphertext to the blockchain through the vote() function. The smart contract enforces one-vote-per-voter via the hasVoted flag and stores the encrypted ballot on-chain."),

    h3("3.6.4 AI Anti-Coercion Monitoring Module"),
    p("This module provides continuous real-time surveillance during the voting process. Using Face-api.js, it analyzes webcam frames every second to detect: (a) multiple faces — indicating a potential coercer, (b) unrecognized faces — suggesting the verified voter has been replaced, and (c) face absence — indicating the voter has moved away. A 5-second grace period prevents false positives. If violations persist, a tiered lockout system blocks the booth for 1 minute (identity issue) or 3 minutes (multiple faces)."),

    h3("3.6.5 Booth Mode with VVPAT Module"),
    p("This module provides a supervised voting environment for physical polling stations. An administrator registers walk-in voters with auto-generated wallet credentials, verifies their identity through face recognition, and facilitates ballot casting via the boothVote() smart contract function. A digital VVPAT receipt is displayed after successful voting. The booth mode includes privacy shield overlay and voice guidance using Web Speech API."),

    h3("3.6.6 Result Tallying Module"),
    p("After the election closes, this module reconstructs the election private key from Shamir's Secret Sharing shares. At least 3 of the 5 distributed shares must be provided. The module then reads all encrypted ballots from the blockchain, decrypts each vote using the reconstructed private key, and computes the final vote count for each candidate."),

    h2("3.7 System Architecture"),
    p("The system follows a multi-tier decentralized architecture with the following layers:"),
    bp("Presentation Layer: ", "React.js/Next.js frontend with MetaMask integration, face-api.js for client-side AI processing, and JSEncrypt for client-side encryption."),
    bp("Application Layer: ", "Node.js/Express backend server (port 5000) for voter CRUD, candidate management, and election configuration. OTP Service (port 4000) for dual-channel verification. Python/FastAPI server (port 8000) for face verification and monitoring."),
    bp("Blockchain Layer: ", "Ethereum network (Hardhat local or Sepolia testnet) with Voting.sol smart contract managing on-chain state including voter registration, encrypted ballot storage, and candidate records."),
    bp("Data Layer: ", "SQLite database for off-chain voter data (face descriptors, contact details) and JSON files for election configuration. On-chain storage for voter structs, candidate structs, and election public key."),

    h2("3.8 Feasibility Study"),
    h3("3.8.1 Economic Feasibility"),
    p("The project is economically feasible as it uses entirely free and open-source technologies. Development tools (Node.js, Python, Hardhat, React.js, Face-api.js, MetaMask) are all open-source. The Ethereum Sepolia testnet provides free deployment for testing. For production, the average gas cost per vote is approximately 45,000 gas units, making it viable for organizational elections."),
    h3("3.8.2 Technical Feasibility"),
    p("All technologies used are mature, well-documented, and actively maintained. Ethereum blockchain provides battle-tested infrastructure for decentralized applications. Face-api.js provides reliable CNN-based face recognition directly in the browser. RSA-2048 and Shamir's Secret Sharing are mathematically proven cryptographic schemes with well-audited JavaScript implementations."),
    h3("3.8.3 Procedural Feasibility"),
    p("The system is operationally feasible with minimal training requirements. The voter interface provides a clear step-by-step guided process (Wallet → Face → OTP → Vote). The admin panel organizes all administrative functions into intuitive tabs. The system requires only a modern web browser with MetaMask extension."),

    h2("3.9 System Requirements"),
    h3("3.9.1 Hardware Requirements"),
    bull("Development Machine: Intel i5+ processor, 8GB+ RAM, 10GB+ storage, HD webcam"),
    bull("Server (if hosted): Any cloud VM with 2+ CPU cores, 4GB+ RAM"),
    bull("Client Machine: Any modern computer/laptop with webcam and internet access"),
    h3("3.9.2 Software Requirements"),
    bull("Node.js v18+, npm v9+"),
    bull("Python 3.9+, pip"),
    bull("MetaMask browser extension v11+"),
    bull("Modern web browser (Chrome 110+, Firefox 110+, Brave)"),
    bull("Git for version control"),
  ];
}

module.exports = { getChapter1, getChapter2, getChapter3 };
