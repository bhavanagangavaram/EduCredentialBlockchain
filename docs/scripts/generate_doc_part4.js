// Part 4: Chapters 6-7 + References + Index + Publication — Clean academic formatting
const P1 = require('./generate_doc_part1');
const { chapterTitle, sectionTitle, h2, h3, p, bp, bull, nItem, tc, TNR,
  Table, TableRow, TableCell, WidthType, ShadingType, Paragraph, TextRun, AlignmentType, PageBreak } = P1;

function getChapter6() {
  return [
    ...chapterTitle("6", "Results"),

    h2("6.1 Introduction"),
    p("This chapter presents the experimental results and output screens of the AI-integrated decentralized e-voting system. The system was evaluated using real-world benchmark datasets including the Labeled Faces in the Wild (LFW) dataset for face recognition, the CelebA-Spoof dataset for anti-spoofing, and 130 controlled video recordings for coercion detection. Performance metrics including precision, recall, F1-score, and accuracy are reported for each biometric module. Additionally, blockchain performance metrics including transaction latency and gas consumption are presented."),

    h2("6.2 Biometric Performance Results"),
    h3("6.2.1 Face Recognition Module"),
    p("The face recognition module was evaluated using 400 verification pairs from the LFW benchmark dataset. Using the FaceNet and VGG-Face ensemble classifier with 10-fold cross-validation, the module achieved:"),
    bull("Precision: 92.1%"),
    bull("Recall: 89.0%"),
    bull("F1-Score: 90.4%"),
    bull("Accuracy: 91.0%"),
    p("The Euclidean distance threshold of 0.45 (strict mode for anti-coercion) and 0.65 (standard mode for authentication) were calibrated using ROC analysis on the LFW dataset."),

    h3("6.2.2 Anti-Spoofing Module"),
    p("The anti-spoofing module was evaluated using the CelebA-Spoof dataset for distinguishing live faces from presentation attacks (photographs, masks, screen replays). Results achieved:"),
    bull("Precision: 96.0%"),
    bull("Recall: 98.0%"),
    bull("F1-Score: 97.0%"),
    bull("Accuracy: 97.0%"),

    h3("6.2.3 Coercion Detection Module"),
    p("The coercion detection module was evaluated using 130 controlled video recordings comprising 50 normal voting sessions, 50 coerced sessions (with a second person visible), and 30 empty sessions. Using a Random Forest and SVM ensemble classifier with SMOTE oversampling and 10-fold cross-validation:"),
    bull("Precision: 95.7%"),
    bull("Recall: 94.6%"),
    bull("F1-Score: 94.5%"),
    bull("Accuracy: 98.0%"),

    h3("6.2.4 Performance Comparison Table"),
    new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
      new TableRow({ children: [tc("Module", {header:true}), tc("Precision", {header:true}), tc("Recall", {header:true}), tc("F1-Score", {header:true}), tc("Accuracy", {header:true})] }),
      new TableRow({ children: [tc("Face Recognition",{bold:true}), tc("92.1%"), tc("89.0%"), tc("90.4%"), tc("91.0%")] }),
      new TableRow({ children: [tc("Anti-Spoofing",{bold:true}), tc("96.0%"), tc("98.0%"), tc("97.0%"), tc("97.0%")] }),
      new TableRow({ children: [tc("Coercion Detection",{bold:true}), tc("95.7%"), tc("94.6%"), tc("94.5%"), tc("98.0%")] }),
    ]}),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 200 },
      children: [new TextRun({ text: "Table 6.1: Performance Metrics of Biometric Modules", font: TNR, size: 22, italics: true })] }),

    h2("6.3 Blockchain Performance"),
    h3("6.3.1 Transaction Latency"),
    p("Transaction latency was measured for 100 concurrent vote submissions on the Ethereum network. The average transaction confirmation time was 4.8 seconds during peak load. Client-side RSA-2048 encryption time averaged 42 milliseconds, which is imperceptible to the user."),
    h3("6.3.2 Gas Cost Optimization"),
    p("On-chain storage costs were minimized by storing only essential data: the Keccak-256 hash of the 128-dimensional facial descriptor vector (32 bytes) and the RSA-encrypted candidate ID string. The average gas consumption per vote transaction was approximately 45,000 gas units."),

    h2("6.4 Comparison with Traditional Systems"),
    new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
      new TableRow({ children: [tc("Feature", {header:true}), tc("Traditional EVM", {header:true}), tc("Proposed System", {header:true})] }),
      new TableRow({ children: [tc("Data Storage",{bold:true}), tc("Centralized Server"), tc("Decentralized Ledger")] }),
      new TableRow({ children: [tc("Voter Verification",{bold:true}), tc("Manual / Physical ID"), tc("3-Factor AI Biometrics")] }),
      new TableRow({ children: [tc("Audit Trail",{bold:true}), tc("Internal / Private"), tc("Public / Immutable")] }),
      new TableRow({ children: [tc("Security Protocol",{bold:true}), tc("Perimeter Defense"), tc("Cryptographic Encryption")] }),
      new TableRow({ children: [tc("Coercion Protection",{bold:true}), tc("Manual Oversight"), tc("Real-time AI Monitoring")] }),
      new TableRow({ children: [tc("Ballot Secrecy",{bold:true}), tc("Physical Separation"), tc("RSA-2048 Encryption")] }),
      new TableRow({ children: [tc("Key Management",{bold:true}), tc("Single Authority"), tc("Shamir's 3-of-5 SSS")] }),
    ]}),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 200 },
      children: [new TextRun({ text: "Table 6.2: Comparison of Traditional and Proposed Systems", font: TNR, size: 22, italics: true })] }),

    h2("6.5 Output Screens"),
    p("The following output screens demonstrate the key interfaces and functionalities of the implemented system:"),
    bp("Screen 1 — Welcome Page: ", "Displays the system title with Connect MetaMask button, feature badges (End-to-End Encrypted, Face Verified, Immutable Record), and Admin/Voter mode toggle."),
    bp("Screen 2 — Admin Dashboard: ", "Shows the tabbed admin interface with Setup, Candidates, Register, Results, Faucet, and Booth tabs. Includes the owner verification banner."),
    bp("Screen 3 — Voter Registration: ", "Displays the registration form with name, wallet address, mobile, email, DOB fields, webcam preview for face capture, and registration status."),
    bp("Screen 4 — Election Key Setup: ", "Shows the election key generation interface with Shamir's Secret Sharing output displaying 5 key shares with copy-to-clipboard functionality."),
    bp("Screen 5 — Voter Authentication: ", "Displays the 4-step progress bar (Wallet → Face → OTP → Vote), wallet verification panel, webcam face scan interface, and dual OTP input fields."),
    bp("Screen 6 — Vote Casting: ", "Shows the candidate list with vote buttons, live webcam monitor PIP with LIVE indicator, and MetaMask transaction confirmation popup."),
    bp("Screen 7 — Anti-Coercion Alert: ", "Displays the full-screen privacy shield overlay with MULTIPLE FACES DETECTED warning, booth lockout countdown, and violation status."),
    bp("Screen 8 — Booth Mode VVPAT: ", "Shows the Voter-Verified Paper Audit Trail receipt with candidate name (SECRET BALLOT), timestamp, device ID, and verification checkmark."),
    bp("Screen 9 — Election Results: ", "Displays the tally interface with 3 share input fields, Tally Votes button, and results table showing candidate names and vote counts."),
    bp("Screen 10 — OTP Email: ", "Shows the professional HTML email template with E-Voting System branding, 6-digit verification code, expiry timer, and security warning."),
  ];
}

function getChapter7() {
  return [
    ...chapterTitle("7", "Conclusion & Future Enhancements"),

    h2("7.1 Conclusion"),
    p("This project successfully designed, developed, and tested an AI-integrated decentralized e-voting system that addresses the critical limitations of existing electronic voting systems. The system integrates Ethereum blockchain technology, three-factor authentication, RSA-2048 ballot encryption, Shamir's Secret Sharing for decentralized key management, and real-time AI-based anti-coercion monitoring into a comprehensive and cohesive architecture."),
    p("The experimental evaluation using real-world benchmark datasets demonstrates the system's effectiveness and reliability:"),
    bull("Face Recognition achieved 92.1% precision and 91.0% accuracy on the LFW benchmark, confirming reliable biometric identity verification."),
    bull("Anti-Spoofing achieved 96.0% precision and 97.0% accuracy on CelebA-Spoof, effectively distinguishing live faces from presentation attacks."),
    bull("Coercion Detection achieved 95.7% precision and 98.0% accuracy on 130 controlled video recordings, demonstrating robust real-time threat detection."),
    bull("Blockchain Performance showed an average of 45,000 gas units per transaction and 4.8-second confirmation latency, confirming feasibility for organizational elections."),
    p("The formal security analysis confirmed resistance to six categories of attacks: replay, Sybil, man-in-the-middle, coercion, spoofing, and key compromise attacks. The three-factor authentication protocol, combining wallet possession, dual-channel OTP, and biometric face recognition, creates a robust identity verification pipeline that makes voter impersonation virtually impossible."),
    p("The Shamir's Secret Sharing scheme with a 3-of-5 threshold ensures that no single authority can decrypt election results independently, preserving democratic trust through distributed key management. The client-side RSA-2048 encryption ensures complete ballot secrecy even on the transparent Ethereum blockchain."),
    p("In summary, this project demonstrates that a blockchain-based e-voting system with integrated AI security measures is technically feasible, performant, and secure for deployment in organizational election scenarios."),

    h2("7.2 Future Enhancements"),
    p("While the current system provides a comprehensive solution for secure electronic voting, several enhancements can be explored in future work:"),
    nItem(1, "Layer 2 Scaling Solutions: Integration of Layer 2 scaling technologies such as Polygon, Arbitrum, or Optimism to reduce gas costs and increase transaction throughput for national-level elections with millions of voters."),
    nItem(2, "Zero-Knowledge Proofs (zk-SNARKs): Implementation of zero-knowledge proofs to enable voters to prove their vote was counted correctly without revealing their choice, further strengthening ballot secrecy and public verifiability."),
    nItem(3, "Homomorphic Encryption: Exploration of homomorphic encryption schemes that allow vote tallying directly on encrypted data without decryption, eliminating the need for key reconstruction entirely."),
    nItem(4, "Mobile Application: Development of native Android and iOS applications with integrated face recognition and NFC-based wallet authentication for improved accessibility."),
    nItem(5, "IPFS Integration: Storage of face images and large data on the InterPlanetary File System (IPFS) to reduce on-chain storage costs while maintaining decentralized data availability."),
    nItem(6, "Multi-Language Support: Addition of support for multiple Indian languages (Telugu, Hindi, Tamil, etc.) to improve accessibility for diverse voter populations."),
    nItem(7, "Advanced Anti-Coercion: Integration of emotion detection and stress analysis using deep learning models to identify subtle forms of coercion that may not involve visible third-party presence."),
    nItem(8, "Formal Verification: Mathematical formal verification of the smart contract using tools like Certora or Solidity formal verification to prove correctness of voting logic."),
  ];
}

function getReferences() {
  return [
    ...sectionTitle("References"),
    p("[1] S. Sah, R. S. Verma, D. Singh, and P. K. Sharma, \"Leveraging blockchain technology for secure online voting systems – a comprehensive review,\" J. Mobile Multimedia, Jul. 2025. DOI: 10.13052/jmm1550-4646.213412."),
    p("[2] R. Barelli, M. Bernhard, A. Bracciali, and S. Werner, \"Toward secure electronic voting: a survey on e-voting systems and attacks,\" IEEE Access, vol. 13, 2025. DOI: 10.1109/ACCESS.2025.3569334."),
    p("[3] M. Alown, K. M. Ball, and A. Rusu, \"Enhancing democratic processes: a survey of DRE, internet, and blockchain voting systems,\" IEEE Access, 2025. DOI: 10.1109/ACCESS.2025.3531349."),
    p("[4] V. Reyes-Macedo, P. S. L. M. Barreto, and J. L. C. Rodrigues, \"A threshold-blind signature scheme and its application in blockchain-based systems,\" IEEE Access, vol. 12, 2024. DOI: 10.1109/ACCESS.2024.3445298."),
    p("[5] S. Maheshwari, V. K. Sharma, and P. Shukla, \"Blockchain integration with multimodal biometric authentication system for secure smart verifiable electronic voting system,\" IEEE Xplore, 2025. DOI: 10.1109/11195074."),
    p("[6] A. Kumar, R. Singh, and M. Gupta, \"Secure e-voting system using blockchain technology and authentication via face recognition and mobile OTP,\" IEEE Xplore, 2025. DOI: 10.1109/9580147."),
    p("[7] L. Zhang, Y. Chen, and W. Liu, \"ViT-LoRA based facial authentication for blockchain e-voting,\" IEEE Xplore, 2025."),
    p("[8] M. J. Hossain Faruk et al., \"Transforming online voting: a novel system utilizing blockchain and biometric verification,\" Cluster Comput., vol. 27, pp. 4015–4034, Apr. 2024."),
  ];
}

function getIndex() {
  return [
    ...sectionTitle("Index"),
    new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
      new TableRow({ children: [tc("Term", {header:true, width:30}), tc("Full Form", {header:true, width:70})] }),
      new TableRow({ children: [tc("3FA"), tc("Three-Factor Authentication")] }),
      new TableRow({ children: [tc("ABI"), tc("Application Binary Interface")] }),
      new TableRow({ children: [tc("AI"), tc("Artificial Intelligence")] }),
      new TableRow({ children: [tc("CNN"), tc("Convolutional Neural Network")] }),
      new TableRow({ children: [tc("DApp"), tc("Decentralized Application")] }),
      new TableRow({ children: [tc("DFD"), tc("Data Flow Diagram")] }),
      new TableRow({ children: [tc("DRE"), tc("Direct Recording Electronic")] }),
      new TableRow({ children: [tc("ETH"), tc("Ethereum (Cryptocurrency)")] }),
      new TableRow({ children: [tc("EVM"), tc("Electronic Voting Machine / Ethereum Virtual Machine")] }),
      new TableRow({ children: [tc("IPFS"), tc("InterPlanetary File System")] }),
      new TableRow({ children: [tc("LFW"), tc("Labeled Faces in the Wild")] }),
      new TableRow({ children: [tc("OTP"), tc("One-Time Password")] }),
      new TableRow({ children: [tc("RSA"), tc("Rivest-Shamir-Adleman (Encryption Algorithm)")] }),
      new TableRow({ children: [tc("SHA-256"), tc("Secure Hash Algorithm 256-bit")] }),
      new TableRow({ children: [tc("SMS"), tc("Short Message Service")] }),
      new TableRow({ children: [tc("SMTP"), tc("Simple Mail Transfer Protocol")] }),
      new TableRow({ children: [tc("SSS"), tc("Shamir's Secret Sharing")] }),
      new TableRow({ children: [tc("SVM"), tc("Support Vector Machine")] }),
      new TableRow({ children: [tc("UML"), tc("Unified Modeling Language")] }),
      new TableRow({ children: [tc("VVPAT"), tc("Voter-Verified Paper Audit Trail")] }),
      new TableRow({ children: [tc("zk-SNARK"), tc("Zero-Knowledge Succinct Non-Interactive Argument of Knowledge")] }),
    ]}),
  ];
}

function getPublication() {
  return [
    ...sectionTitle("Publication Details"),

    h2("Paper Title"),
    p("\"AI-Integrated Decentralized E-Voting System Using Ethereum Blockchain\""),

    h2("Authors"),
    p("Ms. S. Kalyani Bai, C. Chowdeswar, N. Nandini, G. Bhavana, A. Guru Sravani"),

    h2("Affiliation"),
    p("Department of Computer Science and Engineering, K.S.R.M College of Engineering (Autonomous), Kadapa, Andhra Pradesh, India"),

    h2("Conference / Journal"),
    p("International Conference on Emerging Innovations in Science and Development (ICEISD 2026)"),

    h2("Abstract"),
    p("Modern electronic voting systems remain vulnerable to centralized database manipulation, identity spoofing, and voter coercion due to monolithic server design and absence of cryptographic auditability. This paper proposes a decentralized e-voting system based on the Ethereum blockchain that integrates three security layers: client-side RSA-2048 ballot encryption with decentralized key management via Shamir's Secret Sharing scheme; a three-factor authentication protocol combining blockchain wallet ownership, one-time password verification, and CNN-based biometric face recognition; and computer vision-based real-time anti-coercion monitoring. The system achieved 92.1% precision in face recognition, 96.0% precision in anti-spoofing, and 95.7% precision with 98.0% accuracy in coercion detection."),

    h2("Keywords"),
    p("Anti-coercion, blockchain, CNN, e-voting, Ethereum, face recognition, RSA encryption, Shamir's secret sharing, smart contracts, three-factor authentication"),
  ];
}

module.exports = { getChapter6, getChapter7, getReferences, getIndex, getPublication };
