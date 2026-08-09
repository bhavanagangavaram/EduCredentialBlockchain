# AI-Integrated Decentralized E-Voting System using Ethereum Blockchain

**Ms. S. Kalyani Bai**, **C. Chowdeswar**, **N. Nandini**, **G. Bhavana**  
Department of Computer Science and Engineering,  
KSRM College of Engineering, Kadapa, India  
{kalyani, chowdeswar, nandini}@example.com, bhavanagangavaram1@gmail.com  

---

### Abstract
The integrity of democratic processes is increasingly challenged by the limitations of traditional electronic voting systems, including centralized authority, lack of transparency, and vulnerability to administrative tampering. This paper proposes a decentralized e-voting architecture utilizing the Ethereum blockchain integrated with Artificial Intelligence (AI) for enhanced security and fraud detection.

The system employs a Three-Factor Authentication (3FA) framework—incorporating Web3 wallet signatures, dual-OTP verification, and real-time facial recognition—to ensure the inherence of voter identity. To preserve ballot secrecy on a public ledger, client-side PKCS#1 RSA encryption is implemented, while Shamir's Secret Sharing (SSS) is utilized to eliminate single points of failure during the counting phase. Furthermore, an AI monitoring module provides continuous environmental analysis to thwart coercion and proxy attempts in high-risk polling scenarios.

Our methodology demonstrates that by synthesizing blockchain immutability with localized computer vision, it is possible to achieve a transparent, tamper-resistant, and strictly anonymous electoral ecosystem. The proposed system effectively bridges the gap between public verifiability and individual privacy, providing a scalable solution for modern digital governance.

**Keywords:** Ethereum Blockchain, Smart Contracts, AI Biometrics, Decentralized E-Voting, RSA Encryption, 3-Factor Authentication.

---

### 1. Introduction
The fundamental pillar of democratic governance is the safe, transparent, and accurate collection of voter intent. However, traditional paper-based and centralized electronic voting systems (EVMs) are subject to significant logistical burdens, high costs, and systemic vulnerabilities. Centralized databases remain susceptible to internal manipulation, external hacking, and a lack of real-time public auditability. These constraints frequently lead to delays in result processing and a decrease in public trust in the electoral process.

Blockchain technology offers a paradigm shift by providing a decentralized, immutable ledger that is resistant to tampering and administrative overreach. By recording ballots across a distributed network, blockchain ensures that once a vote is cast, it becomes a permanent, verifiable part of the record. However, direct blockchain application faces a paradox: maintaining transaction transparency while ensuring absolute ballot secrecy. Moreover, the "digital divide" means that remote-only systems may unintentionally disenfranchise segments of the population without personal smart devices.

Integrating Artificial Intelligence (AI) into this framework provides an additional layer of behavioral and biometric defense. AI enables the detection of anomalies such as multi-person presence in a private booth (coercion) or attempts at identity spoofing (proxy voting). This research addresses these multifaceted challenges by proposing an AI-integrated decentralized e-voting system on Ethereum. Our contributions include a robust 3-Factor Authentication (3FA) protocol, client-side cryptographic privacy, and a continuous AI-driven security monitor, ensuring a secure and inclusive digital election environment.

---

### 2. Related Work / Literature Survey
The intersection of blockchain and biometrics for electronic voting has been a subject of intense academic inquiry in recent years.

Sah et al. (2025) proposed an architecture utilizing Ethereum smart contracts to manage the lifecycle of an election, emphasizing the transparency of on-chain tabulation [4]. While their work successfully mitigated centralized state tampering, it did not address the critical issue of ballot privacy on a public ledger, as voter choices were visible to all node operators.

Addressing cryptographic privacy, Singh (2024) explored the application of Shamir's Secret Sharing (SSS) in blockchain smart contracts to distribute the responsibility of vote decryption [5]. Their study demonstrated that SSS could effectively eliminate the "master key" vulnerability, although the implementation lacked a binding mechanism to verified biometric identities.

In the domain of biometric security, Ibrahim et al. (2025) successfully utilized convolutional neural networks to detect face presentation attacks in distributed systems [6]. Although their research advanced facial recognition accuracy, the methodology was restricted to static authentication and did not provide continuous monitoring during the ballot casting process.

Barelli et al. (2025) analyzed the threat landscape of remote e-voting, identifying voter coercion as a primary research gap [7]. They concluded that without active environmental surveillance, remote systems cannot guarantee a truly free and fair vote. This paper addresses this gap by synthesizing these independent technologies into a unified, AI-monitored decentralized protocol.

---

### 3. Proposed System
The proposed system architecture is designed as a multi-tier decentralized application (DApp) that separates identity management from cryptographic ballot storage.

*   **Voter Interface:** A React-based frontend that handles local encryption and AI processing.
*   **Authentication Module:** Implements 3FA by verifying wallet possession, temporal OTPs, and biometric facial features.
*   **Smart Contract Layer:** The `Voting.sol` contract acts as the immutable ledger, recording encrypted ballot strings and managing voter registration states.
*   **Ethereum Blockchain Network:** Provides the underlying infrastructure for transaction finality and data persistence.
*   **AI-Based Anomaly Detection:** A browser-resident module using `face-api.js` to monitor the voting environment in real-time.
*   **Result Verification Module:** A tallier tool that reconstructs the private key via SSS to decrypt the finalized election logs.

**Fig. 1. System Architecture of the Proposed Blockchain Voting System**  
*(Note: Figure 1 illustrates the interaction between the Client Layer, Relay API, and Ethereum Blockchain Layer.)*

---

### 4. Methodology
The operational workflow of the proposed system is executed through the following sequential stages:
1.  **Voter Registration:** Administrative officials capture a 128-D facial descriptor of the voter. A SHA-256 hash of this descriptor is committed to the blockchain alongside the voter’s wallet address.
2.  **Identity Verification:** The voter initiates a login via MetaMask. The system triggers a dual-channel OTP (Email and SMS) and performs a live facial scan.
3.  **Vote Casting:** Upon successful 3FA, the voter selects a candidate. The client-side application fetches the election public key.
4.  **Smart Contract Execution:** The frontend encrypts the candidate ID using RSA-2048 and submits it to the `vote()` function of the smart contract.
5.  **Blockchain Recording:** The Ethereum network validates the transaction, marks the voter as `hasVoted`, and records the encrypted ciphertext.
6.  **AI Anomaly Detection:** Throughout the session, the AI module continuously polls the video feed for multiple faces or identity shifts.
7.  **Secure Vote Storage:** The ballots remain in an encrypted state on the ledger, unreadable by node operators or administrators.
8.  **Result Computation:** After the election closes, authorized officials combine their SSS shares to reconstruct the private key and decrypt the results in bulk.

---

### 5. Algorithm
The following pseudocode outlines the secure blockchain voting procedure, integrating identity verification and cryptographic submission.

**Algorithm 1: Secure Blockchain Voting Procedure**
```text
1:  Initialize Election(PublicKey PK, Threshold T, Shares N)
2:  DistributeShares(PrivateKey SK, T, N)
3:  Procedure CastVote(Voter W, LiveFrame F, CandidateSelection C):
4:      Authorize(W) via MetaMask Digital Signature
5:      IF VerifyOTP(Email, SMS) == FALSE THEN REJECT
6:      D_live ← ExtractFaceDescriptor(F)
7:      H_stored ← Blockchain.getFaceHash(W)
8:      IF EuclideanDistance(D_live, H_stored) > 0.45 THEN REJECT
9:      WHILE Ballot_Open DO:
10:         IF DetectAllFaces(F).count > 1 THEN TRIGGER_LOCKDOWN()
11:     END WHILE
12:     EncryptedBallot ← RSA_Encrypt(C, PK)
13:     TX ← SmartContract.vote(EncryptedBallot)
14:     AWAIT TX.confirmation on Ethereum
15:  Return Success_Receipt
```

---

### 6. Implementation
The implementation leverages a modern decentralized stack. The **Ethereum** blockchain is simulated via **Hardhat** for local EVM execution. Smart contracts are developed in **Solidity**, ensuring deterministic execution of voting rules. The **AI module** utilizes **Face-api.js** (built on TensorFlow.js) for localized facial landmark detection. **JSEncrypt** provides the RSA-2048 cryptographic primitives, and **Secrets.js-grempe** handles the Shamir’s Secret Sharing logic. The **Web Interface** is built using **React.js**, providing a responsive and secure portal for both voters and administrators.

---

### 7. Results and Discussion
The proposed system addresses the critical security requirements of identity, privacy, and integrity.

*   **Transparency:** The use of the Ethereum blockchain ensures that all ballots are publicly verifiable without revealing individual choices.
*   **Tamper Resistance:** On-chain records are immutable, preventing retrospective alteration of ballots.
*   **Voter Privacy:** Encrypting votes client-side ensures that anonymity is preserved even against a fully transparent ledger.
*   **Decentralized Verification:** The SSS threshold mechanism removes the need for a single trusted authority during the tallying process.

**Table 1. Comparison between Traditional Voting and Blockchain Voting Systems**
| Feature | Traditional EVM | Proposed Blockchain System |
| :--- | :--- | :--- |
| **Data Storage** | Centralized Server | Decentralized Ledger |
| **Voter Verification** | Manual/Physical ID | 3-Factor AI Biometrics |
| **Audit Trail** | Internal/Private | Public/Immutable |
| **Security Protocol** | Perimeter Defense | Cryptographic Encryption |
| **Coercion Protection** | Manual Oversight | Real-time AI Monitoring |

---

### 8. Conclusion
This paper has presented a robust, AI-integrated decentralized e-voting system that leverages the unique strengths of the Ethereum blockchain and computer vision. By incorporating 3-Factor Authentication and RSA-driven ballot secrecy, we have mitigated the primary risks of identity spoofing and unauthorized data access. The integration of Shamir’s Secret Sharing ensures that democratic trust is distributed rather than centralized. Future work will investigate Layer-2 scaling solutions to handle national-scale transaction volumes and explore zero-knowledge proofs (zk-SNARKs) to further optimize the trade-off between privacy and on-chain storage costs.

---

### References
[1] S. Nakamoto, "Bitcoin: A Peer-to-Peer Electronic Cash System," 2008.  
[2] G. Wood, "Ethereum: A Secure Decentralised Generalised Transaction Ledger," 2014.  
[3] R. L. Rivest, A. Shamir, and L. Adleman, "A method for obtaining digital signatures and public-key cryptosystems," 1978.  
[4] S. Sah, et al., "Blockchain-Based Decentralized Voting Architecture for National Elections," IEEE Access, 2025.  
[5] P. K. Singh, "Analysis of Lightweight Cryptography for Blockchain Smart Contracts," IEEE ICCCA, 2024.  
[6] M. Ibrahim, et al., "AI Face Presentation Attack Detection in Distributed Environments," Nature Machine Intelligence, 2025.  
[7] R. Barelli, et al., "Survey on Protocol Attack Vectors in Remote Electronic Voting," IEEE Transactions, 2025.  
[8] A. Shamir, "How to share a secret," Communications of the ACM, 1979.
