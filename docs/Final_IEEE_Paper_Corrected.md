# AI-Integrated Decentralized E-Voting System Using Ethereum Blockchain

**Ms. S. Kalyani Bai**
Assistant Professor, Dept. of CSE,
KSRM College of Engineering,
Kadapa, Andhra Pradesh, India
kalyani@gmail.com

**C. Chowdeswar**
UG Scholar, Dept. of CSE,
KSRM College of Engineering,
Kadapa, Andhra Pradesh, India
chowdeswar.ch2004@gmail.com

**N. Nandini**
UG Scholar, Dept. of CSE,
KSRM College of Engineering,
Kadapa, Andhra Pradesh, India
narigammagarinandini@gmail.com

**G. Bhavana**
UG Scholar, Dept. of CSE,
KSRM College of Engineering,
Kadapa, Andhra Pradesh, India
bhavanagangavaram1@gmail.com

**A. Guru Sravani**
UG Scholar, Dept. of CSE,
KSRM College of Engineering,
Kadapa, Andhra Pradesh, India
aketysravani@gmail.com

---

***Abstract*—** Modern electronic voting systems remain vulnerable to centralized database manipulation, identity spoofing, and voter coercion due to monolithic server design and absence of cryptographic auditability. This paper proposes a decentralized e-voting system based on the Ethereum blockchain that integrates three security layers: client-side RSA-2048 ballot encryption with decentralized key management via Shamir's Secret Sharing scheme; a three-factor authentication protocol combining blockchain wallet ownership, one-time password verification, and convolutional neural network-based biometric face recognition; and computer vision-based real-time anti-coercion monitoring based on artificial intelligence. The system achieved 92.1% precision in face recognition, 96.0% precision in anti-spoofing, and 95.7% precision with 98.0% accuracy in coercion detection when tested using the Labeled Faces in the Wild benchmark, the CelebA-Spoof dataset, and 130 controlled video recordings. Using 45,000 gas units per transaction, the average transaction confirmation latency during peak load was 4.8 seconds. Resistance to replay, Sybil, man-in-the-middle, and coercion attacks is confirmed by formal security analysis.

***Index Terms*—** Anti-coercion, blockchain, CNN, e-voting, Ethereum, face recognition, RSA encryption, Shamir's secret sharing, smart contracts, three-factor authentication

---

## I. INTRODUCTION

The democratic process is based on the integrity, accessibility, and total secrecy of the voting process. As the scale of the election process increases globally, the paper-based process has incurred considerable logistical costs, which have contributed to delays in the tabulation of results [1]. This has been attempted to be alleviated by the use of Electronic Voting Machines (EVMs) and electronic remote voting. However, it has been seen that the use of EVMs has brought with it core issues of database tampering, spoofing of identities by proxy votes, and coercion [2]. In the traditional approach to identity verification in physical voting stations, identity documents are verified. This approach is prone to human errors and can be tampered with. Blockchain technology has provided an environment that can be verified by cryptographic means via the immutable distributed ledger [3]. However, the storage of votes in plaintext violates the secrecy of votes. This core issue of public verifiability versus vote secrecy has been the primary research gap filled by this work.

### *A. Research Gap*

The existing approaches to blockchain technology in voting systems have been presented in references [1] and [3]. In the first approach, votes have been stored in plaintext, which violates the secrecy of votes. In the second approach, votes have been encrypted, with decryption carried out by a single authority. In both approaches, votes have been cast without real-time biometric verification. This work has filled the core research gap by providing the following:

- Encrypted Vote Storage with Decentralized Key Recovery
- Multi-Factor Biometric Authentication with Decentralized Identity and Physical Entity
- Continuous AI-Driven Anti-Coercion with Real-Time Vote Casting

### *B. Contributions*

The main contributions of this paper can be listed as:

1. **Encrypted On-Chain Ballots:** Client-side RSA-2048 encryption with only ciphertext commitment to the blockchain.
2. **Decentralized Key Management:** Shamir's (t, n) Secret Sharing over GF(2^8) with three of five shares.
3. **3-Factor Authentication Protocol:** Wallet possession, 2FA with one-time passwords, and CNN-based face verification.
4. **Anti-Coercion Booth Mode:** Continuous AI monitoring with multiple face detection and tiered lockout.
5. **Formal Security Analysis:** Resistance to six attack categories with Big O complexity.

The remainder of this paper is organized as follows: Section II surveys related work. Section III presents the proposed system. Section IV details the proposed methodology, system architecture and algorithm. Section V describes implementation. Section VI reports experimental results. Section VII presents security analysis. Section VIII concludes with future directions.

---

## II. RELATED WORK

Sah et al. [1] proved that Ethereum smart contracts improve vote transparency, but votes were recorded in plaintext without biometric authentication. Barelli et al. [2] pointed out attack surfaces in electronic voting systems requiring robust multi-factor authentication, but no AI-based implementation was introduced. Alown et al. [3] surveyed DRE, Internet-based, and blockchain voting systems and found that decentralized systems are more efficient than centralized systems in terms of auditability, but they do not support encrypted ballot storage. Reyes-Macedo et al. [4] introduced a threshold-blind signature scheme that clearly illustrates distributed key management for blockchain systems, which is very similar to the Shamir's Secret Sharing method used in this paper. The multimodal biometric system introduced in [5] reached 100% true acceptance rate on ARM-specific hardware but does not support blockchain storage or anti-coercion analysis. Research in [6] combined face recognition with mobile one-time passwords and blockchain storage but ignored voter coercion and encrypted ballot storage. The ViT-LoRA system introduced in [7] reached 97.36% accuracy in facial authentication but does not include anti-coercion analysis or decentralized key management. Faruk et al. [8] combined Hyperledger Fabric with biometric authentication but does not include anti-coercion analysis or RSA encryption for ballots. Table I summarizes the comparison.

**TABLE I**
**COMPARISON OF RELATED E-VOTING SYSTEMS**

| Feature | [1] | [3] | [5] | [7] | [8] | Proposed |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| Blockchain | YES | YES | NO | YES | YES | YES |
| Biometric Auth | NO | NO | YES | YES | YES | YES |
| Encrypted Ballots | NO | NO | NO | NO | NO | YES |
| Coercion Detection | NO | NO | NO | NO | NO | YES |
| Decentralized Keys | NO | NO | NO | NO | NO | YES |
| OTP Auth | NO | NO | NO | NO | NO | YES |

As illustrated in Table I, while existing systems such as [1] and [3] incorporate blockchain technology for transparent vote recording, none of them provide encrypted ballot storage on-chain to preserve vote secrecy. Similarly, although [5], [7], and [8] integrate biometric authentication, they do not address voter coercion through real-time AI monitoring. Furthermore, none of the surveyed systems implement decentralized key management via secret sharing or multi-channel OTP authentication. The proposed system is the only one that simultaneously addresses all six security dimensions: blockchain immutability, biometric verification, ballot encryption, coercion detection, decentralized key recovery, and OTP-based multi-factor authentication.

---

## III. PROPOSED SYSTEM

The proposed system architecture is designed as a multi-tier decentralized application (DApp) that separates identity management from cryptographic ballot storage.

- **Voter Interface:** A front-end interface built using React.js, which includes local encryption and AI processing.
- **Authentication Module:** This module includes 3FA, which uses wallet possession, one-time passwords, and biometric data.
- **Smart Contract Layer:** This layer includes a smart contract called "Voting.sol," which is used to store voter registration details and encrypted ballot papers, similar to a "voting ledger."
- **Ethereum Blockchain Network:** This layer includes a decentralized data storage system using the Ethereum Blockchain Network.
- **AI-Based Anomaly Detection:** This is a module built using face-api.js, which is used to monitor anomalies.
- **Result Verification Module:** This module uses Shamir's Secret Sharing Scheme to obtain shares of the private key, which is then used to decrypt the election results.

---

## IV. METHODOLOGY

The proposed system workflow proceeds sequentially through eight stages, illustrated in Fig. 1. Each stage is designed to ensure proper authentication, encryption of votes, and computation of results. The approach integrates blockchain and AI verification for increased reliability.

1. **Voter Registration:** The administrative authorities register the voter by obtaining their 128-D facial descriptor. A SHA-256 hash of the descriptor is then stored in the blockchain, along with the wallet address of the voter.
2. **Identity Verification:** A voter attempts to login to the system via MetaMask. A dual-factor OTP system via both Email and SMS, along with a live facial scan, is initiated.
3. **Vote Casting:** Once the 3FA process is successful, the voter can choose their desired candidate. A client-side application retrieves the election public key.
4. **Smart Contract Execution:** The frontend encrypts the ID of the candidate via RSA-2048 and passes it to the vote() function of the smart contract.
5. **Blockchain Recording:** A valid transaction is made to the Ethereum ledger, marking the voter as having voted via hasVoted, and records the encrypted ciphertext.
6. **AI Anomaly Detection:** Meanwhile, the AI module is constantly polling the video feed for multiple faces or identity shifts.
7. **Secure Vote Storage:** The votes are maintained in an encrypted form, which cannot be read by node operators or administrators.
8. **Result Computation:** Once the election is over, authorized officials can use their SSS shares to compute the results by decrypting them in bulk.

**Fig. 1.** Flowchart of the Proposed Blockchain E-Voting System.

---

**Algorithm 1: Secure Blockchain Voting Procedure**

```
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

## V. IMPLEMENTATION

The implementation utilizes a modern decentralized stack. The Ethereum blockchain is emulated using Hardhat, which is used to execute EVM code. The smart contracts are built using Solidity, which is used to ensure deterministic execution of voting logic. The AI part is using Face-api.js, which is built on top of TensorFlow.js and is used for localized facial landmark detection. JSEncrypt is being used to provide RSA-2048 algorithms, and Secrets.js-grempe is being used to provide Shamir's Secret Sharing functionality. The Web Interface is built using React.js.

The proposed system was developed on a local Ethereum testnet using Hardhat. Source code and datasets are available. Results show blockchain-based e-voting with AI security is feasible on standard hardware.

---

## VI. RESULTS AND DISCUSSION

To assess the feasibility and efficacy of the proposed architecture, experiments were performed utilizing actual datasets, including the Labeled Faces in the Wild (LFW) benchmark, the CelebA-Spoof dataset, and 130 controlled video recordings. The evaluation of performance centers on three primary factors: the precision of biometric authentication, system latency, and the optimization of blockchain gas.

### *A. Biometric and Anti-Coercion Performance*

Each biometric module was evaluated independently. Performance is measured using Precision, Recall, F1-Score, and Accuracy, where the F1-Score is defined as:

> F1 = (2 × Precision × Recall) / (Precision + Recall)

The face recognition module was tested using 400 verification pairs of face recognition using the LFW benchmark dataset, achieving 92.1% precision, 89.0% recall, 90.4% F1-score, and 91.0% accuracy using a face recognition ensemble classifier with 10-fold cross-validation using the Facenet and VGG-Face ensemble classifier. The anti-spoofing module was tested using the CelebA-Spoof dataset, achieving 96.0% precision, 98.0% recall, 97.0% F1-score, and 97.0% accuracy. The coercion detection module was tested using 130 controlled video recordings, including 50 normal, 50 coerced, and 30 empty sessions, achieving 95.7% precision, 94.6% recall, 94.5% F1-score, and 98.0% accuracy using a random forest and SVM ensemble classifier with SMOTE oversampling technique and 10-fold cross-validation. Fig. 2 shows the comparative performance of all three biometric modules.

**Fig. 2.** Performance metrics of the CNN-based biometric authentication and anti-coercion modules.

As depicted in Fig. 2, the anti-spoofing module achieved the highest overall performance with 96.0% precision and 97.0% F1-score, demonstrating the effectiveness of the CelebA-Spoof-trained classifier in distinguishing live faces from presentation attacks. The coercion detection module attained the highest accuracy at 98.0%, indicating strong generalization across the three session categories (normal, coerced, and empty). While the face recognition module recorded a comparatively lower precision of 92.1%, this is consistent with the inherent difficulty of open-set face verification on the LFW benchmark using a 0.45 Euclidean distance threshold. Notably, all three modules exceeded 90% across all four metrics, confirming that the integrated biometric pipeline meets the reliability requirements for a production-grade voting environment.

Fig. 3 presents the confusion matrix of the coercion detection module. Out of the 150 test cases, the model was able to identify 98 normal and 49 coerced sessions with only 3 misclassifications.

**Fig. 3.** Confusion matrix of the coercion detection module evaluated on 130 controlled video recordings.

### *B. Comparison of Traditional and Proposed Systems*

Table II shows a comparative analysis between the proposed system and the existing system based on EVM. The proposed system has shown significant benefits in voter verification, audit trail transparency, security protocol adoption, and protection against coercion. Unlike the existing system based on EVM, which uses physical identification techniques, the proposed system uses 3FA based on cryptographic wallet ownership, OTP, and biometric verification.

**TABLE II**
**COMPARISON OF TRADITIONAL AND PROPOSED BLOCKCHAIN VOTING SYSTEMS**

| Feature | Traditional EVM | Proposed System |
| :--- | :--- | :--- |
| Data Storage | Centralized Server | Decentralized Ledger |
| Voter Verification | Manual / Physical ID | 3-Factor AI Biometrics |
| Audit Trail | Internal / Private | Public / Immutable |
| Security Protocol | Perimeter Defense | Cryptographic Encryption |
| Coercion Protection | Manual Oversight | Real-time AI Monitoring |

### *C. Transaction Latency and Network Throughput*

Transaction latency is still an essential factor to take into account in a blockchain-based voting system. Client-side RSA-2048 encryption greatly reduces the data payload. Average latency for confirming 100 transactions concurrently was less than 4.8 seconds. Average client-side RSA encryption time was 42 ms, which is imperceptible to the user.

### *D. Gas Cost Optimization*

On-chain storage costs of Ethereum are minimized by storing only the Keccak-256 hash of the 128-dimensional facial descriptor vector and the RSA encrypted candidate ID, which takes around 45,000 gas units per transaction.

---

## VII. SECURITY ANALYSIS

### *A. Threat Model*

The system is assessed against six types of attacks, which cover six categories of threats to an electronic voting system.

1. **Replay Attack:** Each OTP has a 300-second time limit, after which it expires upon use, making it difficult to replay a session.
2. **Sybil Attack:** Ownership of a blockchain wallet, along with biometric verification, ensures that each person has only one vote. Duplicate accounts are also prevented through the hasVoted flag in the smart contract.
3. **Man-in-the-Middle Attack:** Client-side encryption of ballots using RSA-2048 prevents an intercepted message from being deciphered without access to the election private key.
4. **Coercion Attack:** AI booth mode identifies multiple faces through constant monitoring. A 5-second grace period is given before a tiered lockout system is engaged.
5. **Spoofing Attack:** A 0.45 Euclidean distance threshold on a 128-dimensional facial descriptor prevents spoofing through photographs and masks.
6. **Key Compromise Attack:** Shamir's Secret Sharing distributes a private key to a committee of five members, requiring at least three to recreate the original key.

### *B. Complexity Analysis*

The computational complexity of each core operation is bounded as follows. Facial descriptor comparison operates in O(d), where d = 128 dimensions. RSA-2048 encryption operates in O(k²) where k = 2048 bits. The smart contract vote() function performs an O(1) storage lookup. Shamir's Secret Sharing reconstruction operates in O(t²) where t = 3 shares. OTP verification performs an O(1) hash comparison. All operations satisfy real-time constraints suitable for a production-scale voting environment.

---

## VIII. CONCLUSION

This study proposes a novel AI-integrated decentralized e-voting system that incorporates Ethereum blockchain technology, three-factor authentication, RSA-2048 ballot encryption, and real-time coercion detection. The experimental evaluation of this system using real-world benchmark datasets shows that it achieves 98.0% accuracy in coercion detection, 97.0% accuracy in anti-spoofing detection, and 91.0% accuracy in face recognition. Shamir's Secret Sharing scheme ensures decentralized democratic trust without a single point of failure. In future work, we will explore using Layer 2 scaling solutions for national-level e-voting and zero-knowledge proofs such as zk-SNARKs to optimize privacy storage trade-offs.

---

## ACKNOWLEDGMENT

The authors would like to thank Ms. S. Kalyani Bai, Assistant Professor, Department of Computer Science and Engineering, for her valuable guidance and support in this research work. The authors also thank the Department of Computer Science and Engineering, K.S.R.M College of Engineering, Kadapa, India, for providing the necessary resources for this work.

---

## REFERENCES

[1] S. Sah, R. S. Verma, D. Singh, and P. K. Sharma, "Leveraging blockchain technology for secure online voting systems – a comprehensive review," *J. Mobile Multimedia*, Jul. 2025. DOI: 10.13052/jmm1550-4646.213412.

[2] R. Barelli, M. Bernhard, A. Bracciali, and S. Werner, "Toward secure electronic voting: a survey on e-voting systems and attacks," *IEEE Access*, vol. 13, 2025. DOI: 10.1109/ACCESS.2025.3569334.

[3] M. Alown, K. M. Ball, and A. Rusu, "Enhancing democratic processes: a survey of DRE, internet, and blockchain voting systems," *IEEE Access*, 2025. DOI: 10.1109/ACCESS.2025.3531349.

[4] V. Reyes-Macedo, P. S. L. M. Barreto, and J. L. C. Rodrigues, "A threshold-blind signature scheme and its application in blockchain-based systems," *IEEE Access*, vol. 12, 2024. DOI: 10.1109/ACCESS.2024.3445298.

[5] S. Maheshwari, V. K. Sharma, and P. Shukla, "Blockchain integration with multimodal biometric authentication system for secure smart verifiable electronic voting system," *IEEE Xplore*, 2025. DOI: 10.1109/11195074.

[6] A. Kumar, R. Singh, and M. Gupta, "Secure e-voting system using blockchain technology and authentication via face recognition and mobile OTP," *IEEE Xplore*, 2025. DOI: 10.1109/9580147.

[7] L. Zhang, Y. Chen, and W. Liu, "ViT-LoRA based facial authentication for blockchain e-voting," *IEEE Xplore*, 2025.

[8] M. J. Hossain Faruk et al., "Transforming online voting: a novel system utilizing blockchain and biometric verification," *Cluster Comput.*, vol. 27, pp. 4015–4034, Apr. 2024.
