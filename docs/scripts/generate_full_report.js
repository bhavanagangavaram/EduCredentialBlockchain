const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, PageBreak, LevelFormat,
  TabStopType, TabStopPosition, ImageRun
} = require('docx');
const fs = require('fs');
const path = require('path');

// ============================================================
// CONSTANTS
// ============================================================
const TNR = "Times New Roman";
const MONO = "Courier New";
const BODY_SIZE = 24; // 12pt
const HEAD_SIZE = 28; // 14pt
const CHAP_SIZE = 36; // 18pt
const TITLE_SIZE = 32; // 16pt
const CODE_SIZE = 18; // 9pt

// ============================================================
// HELPER FUNCTIONS
// ============================================================

// Body paragraph
function bodyPara(text, extra = {}) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 120, after: 120, line: 276 },
    children: [new TextRun({ text, font: TNR, size: BODY_SIZE })],
    ...extra
  });
}

// Bold body paragraph
function boldPara(text, extra = {}) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 120, after: 120, line: 276 },
    children: [new TextRun({ text, font: TNR, size: BODY_SIZE, bold: true })],
    ...extra
  });
}

// Heading 1
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.LEFT,
    spacing: { before: 360, after: 180 },
    children: [new TextRun({ text, font: TNR, size: HEAD_SIZE, bold: true })]
  });
}

// Heading 2
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    alignment: AlignmentType.LEFT,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, font: TNR, size: HEAD_SIZE, bold: true })]
  });
}

// Heading 3
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    alignment: AlignmentType.LEFT,
    spacing: { before: 180, after: 60 },
    children: [new TextRun({ text, font: TNR, size: BODY_SIZE, bold: true })]
  });
}

// Chapter divider page
function chapterDivider(chapterNum, title) {
  return [
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 2880, after: 240 },
      children: [new TextRun({ text: `CHAPTER ${chapterNum}`, font: TNR, size: 48, bold: true })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 240 },
      children: [new TextRun({ text: title.toUpperCase(), font: TNR, size: 36, bold: true })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 240 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" } },
      children: [new TextRun({ text: "", font: TNR, size: BODY_SIZE })]
    }),
  ];
}

// Image placeholder
function imagePlaceholder(figNum, caption) {
  const border = { style: BorderStyle.SINGLE, size: 4, color: "555555" };
  return [
    new Paragraph({ spacing: { before: 180, after: 60 }, children: [] }),
    new Table({
      width: { size: 8500, type: WidthType.DXA },
      columnWidths: [8500],
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: { top: border, bottom: border, left: border, right: border },
              shading: { fill: "F5F5F5", type: ShadingType.CLEAR },
              margins: { top: 200, bottom: 200, left: 200, right: 200 },
              width: { size: 8500, type: WidthType.DXA },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 360, after: 60 },
                  children: [new TextRun({ text: "[ IMAGE PLACEHOLDER ]", font: TNR, size: BODY_SIZE, color: "888888", bold: true })]
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 60, after: 360 },
                  children: [new TextRun({ text: "Paste actual screenshot/diagram here", font: TNR, size: 20, color: "AAAAAA", italics: true })]
                }),
              ]
            })
          ]
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 60, after: 180 },
      children: [new TextRun({ text: `${figNum}: ${caption}`, font: TNR, size: BODY_SIZE, bold: true })]
    }),
  ];
}

// Page break
function pgBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

// Center para
function centerPara(text, size = BODY_SIZE, bold = false, extra = {}) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 120 },
    children: [new TextRun({ text, font: TNR, size, bold })],
    ...extra
  });
}

// Bullet para
function bulletPara(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 60, after: 60, line: 276 },
    numbering: { reference: "bullets", level: 0 },
    children: [new TextRun({ text, font: TNR, size: BODY_SIZE })]
  });
}

// Mixed run paragraph (bold label + normal text)
function mixedPara(boldText, normalText, extra = {}) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 120, after: 120, line: 276 },
    children: [
      new TextRun({ text: boldText, font: TNR, size: BODY_SIZE, bold: true }),
      new TextRun({ text: normalText, font: TNR, size: BODY_SIZE })
    ],
    ...extra
  });
}

// Numbered paragraph
function numberedPara(num, text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 120, after: 120, line: 276 },
    children: [new TextRun({ text: `${num}. ${text}`, font: TNR, size: BODY_SIZE })]
  });
}

// Table helper
function makeTable(headers, rows, colWidths) {
  const border = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
  const borders = { top: border, bottom: border, left: border, right: border };
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((h, i) => new TableCell({
          borders,
          width: { size: colWidths[i], type: WidthType.DXA },
          shading: { fill: "CCCCCC", type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: h, font: TNR, size: BODY_SIZE, bold: true })]
          })]
        }))
      }),
      ...rows.map(row => new TableRow({
        children: row.map((cell, i) => new TableCell({
          borders,
          width: { size: colWidths[i], type: WidthType.DXA },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: cell, font: TNR, size: BODY_SIZE })]
          })]
        }))
      }))
    ]
  });
}

// Code block helper
function codeBlock(lines) {
  const border = { style: BorderStyle.SINGLE, size: 2, color: "AAAAAA" };
  return [
    new Paragraph({ spacing: { before: 120, after: 60 }, children: [] }),
    new Table({
      width: { size: 8500, type: WidthType.DXA },
      columnWidths: [8500],
      rows: [new TableRow({
        children: [new TableCell({
          borders: { top: border, bottom: border, left: border, right: border },
          shading: { fill: "F0F0F0", type: ShadingType.CLEAR },
          margins: { top: 100, bottom: 100, left: 180, right: 180 },
          width: { size: 8500, type: WidthType.DXA },
          children: lines.map(line => new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { before: 0, after: 0, line: 240 },
            children: [new TextRun({ text: line, font: MONO, size: CODE_SIZE })]
          }))
        })]
      })]
    }),
    new Paragraph({ spacing: { before: 60, after: 120 }, children: [] }),
  ];
}

// ============================================================
// BUILD ALL CONTENT
// ============================================================
const children = [

  // ************************************************************
  // PART 1: TITLE PAGE, CERTIFICATE, ACKNOWLEDGMENT, ABSTRACT,
  //         TABLE OF CONTENTS, CHAPTER 1
  // ************************************************************

  // ============================================================
  // TITLE PAGE
  // ============================================================
  centerPara("AI-Integrated Decentralized E-Voting System Using Ethereum Blockchain", 24, true, { spacing: { before: 0, after: 60 } }),
  centerPara("AI-Integrated Decentralized E-Voting System Using Ethereum Blockchain", 24, true, { spacing: { before: 60, after: 360 } }),
  centerPara("K.S.R.M COLLEGE OF ENGINEERING", TITLE_SIZE, true),
  centerPara("(Autonomous)", BODY_SIZE, false, { spacing: { before: 60, after: 60 } }),
  centerPara("Kadapa, Andhra Pradesh, India", BODY_SIZE),
  centerPara("Department of Computer Science and Engineering", BODY_SIZE),
  new Paragraph({ spacing: { before: 240, after: 240 }, children: [] }),
  centerPara("A Project Report on", BODY_SIZE, false, { spacing: { before: 120, after: 60 } }),
  centerPara("AI-INTEGRATED DECENTRALIZED E-VOTING SYSTEM", TITLE_SIZE, true),
  centerPara("USING ETHEREUM BLOCKCHAIN", TITLE_SIZE, true),
  new Paragraph({ spacing: { before: 240, after: 60 }, children: [] }),
  centerPara("Submitted in partial fulfillment of the requirements", BODY_SIZE),
  centerPara("for the award of the degree of", BODY_SIZE),
  centerPara("BACHELOR OF TECHNOLOGY", BODY_SIZE, true),
  centerPara("in", BODY_SIZE),
  centerPara("COMPUTER SCIENCE AND ENGINEERING", BODY_SIZE, true),
  new Paragraph({ spacing: { before: 240, after: 120 }, children: [] }),
  centerPara("Submitted by", BODY_SIZE, false, { spacing: { before: 60, after: 120 } }),
  centerPara("C. Chowdeswar", BODY_SIZE, true),
  centerPara("N. Nandini", BODY_SIZE, true),
  centerPara("G. Bhavana", BODY_SIZE, true),
  centerPara("A. Guru Sravani", BODY_SIZE, true),
  new Paragraph({ spacing: { before: 240, after: 120 }, children: [] }),
  centerPara("Under the guidance of", BODY_SIZE, false, { spacing: { before: 60, after: 120 } }),
  centerPara("Ms. S. Kalyani Bai", BODY_SIZE, true),
  centerPara("Assistant Professor, Dept. of CSE", BODY_SIZE),
  new Paragraph({ spacing: { before: 360, after: 120 }, children: [] }),
  centerPara("Academic Year: 2025 – 2026", BODY_SIZE, true),

  // ============================================================
  // CERTIFICATE PAGE
  // ============================================================
  pgBreak(),
  centerPara("CERTIFICATE", TITLE_SIZE, true, { spacing: { before: 0, after: 480 } }),
  bodyPara('This is to certify that the project report entitled "AI-Integrated Decentralized E-Voting System Using Ethereum Blockchain" is a bonafide record of the work carried out by C. Chowdeswar, N. Nandini, G. Bhavana, and A. Guru Sravani, students of B.Tech (CSE), K.S.R.M College of Engineering (Autonomous), Kadapa, during the academic year 2025-2026, submitted in partial fulfillment of the requirements for the award of the degree of Bachelor of Technology in Computer Science and Engineering.'),
  new Paragraph({ spacing: { before: 480, after: 120 }, children: [] }),
  new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 120, after: 60 },
    children: [new TextRun({ text: "Ms. S. Kalyani Bai", font: TNR, size: BODY_SIZE, bold: true })]
  }),
  new Paragraph({ alignment: AlignmentType.LEFT, spacing: { before: 0, after: 60 }, children: [new TextRun({ text: "Project Guide", font: TNR, size: BODY_SIZE })] }),
  new Paragraph({ alignment: AlignmentType.LEFT, spacing: { before: 0, after: 480 }, children: [new TextRun({ text: "Dept. of CSE, KSRM College of Engineering", font: TNR, size: BODY_SIZE })] }),
  new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 120, after: 60 },
    children: [new TextRun({ text: "Head of the Department", font: TNR, size: BODY_SIZE, bold: true })]
  }),
  new Paragraph({ alignment: AlignmentType.LEFT, spacing: { before: 0, after: 60 }, children: [new TextRun({ text: "Dept. of CSE, KSRM College of Engineering", font: TNR, size: BODY_SIZE })] }),

  // ============================================================
  // ACKNOWLEDGMENT
  // ============================================================
  pgBreak(),
  centerPara("ACKNOWLEDGMENT", TITLE_SIZE, true, { spacing: { before: 0, after: 360 } }),
  bodyPara("We express our sincere gratitude to our project guide Ms. S. Kalyani Bai, Assistant Professor, Department of Computer Science and Engineering, for her valuable guidance, encouragement, and constant support throughout the project work."),
  bodyPara("We are thankful to the Head of the Department, Department of Computer Science and Engineering, K.S.R.M College of Engineering (Autonomous), Kadapa, for providing the necessary facilities and support throughout the project."),
  bodyPara("We extend our heartfelt thanks to the Principal and the Management of K.S.R.M College of Engineering for providing us excellent infrastructure and a conducive academic environment."),
  bodyPara("We are also grateful to all the teaching and non-teaching staff members of the Department of Computer Science and Engineering for their cooperation and help during the project work."),
  bodyPara("Finally, we thank our parents and friends for their constant encouragement and support."),
  new Paragraph({ spacing: { before: 360, after: 120 }, children: [] }),
  new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: "C. Chowdeswar", font: TNR, size: BODY_SIZE, bold: true })] }),
  new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: "N. Nandini", font: TNR, size: BODY_SIZE, bold: true })] }),
  new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: "G. Bhavana", font: TNR, size: BODY_SIZE, bold: true })] }),
  new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: "A. Guru Sravani", font: TNR, size: BODY_SIZE, bold: true })] }),

  // ============================================================
  // ABSTRACT
  // ============================================================
  pgBreak(),
  centerPara("ABSTRACT", TITLE_SIZE, true, { spacing: { before: 0, after: 360 } }),
  bodyPara("Modern electronic voting systems remain vulnerable to centralized database manipulation, identity spoofing, and voter coercion due to monolithic server design and absence of cryptographic auditability. This project proposes a decentralized e-voting system based on the Ethereum blockchain that integrates three security layers: client-side RSA-2048 ballot encryption with decentralized key management via Shamir's Secret Sharing scheme; a three-factor authentication protocol combining blockchain wallet ownership, one-time password verification, and convolutional neural network-based biometric face recognition; and computer vision-based real-time anti-coercion monitoring based on artificial intelligence."),
  bodyPara("The system was implemented as a multi-service decentralized application (DApp) comprising a React.js/Next.js frontend with client-side AI processing, a Node.js/Express backend for voter management, a Python/FastAPI server for face verification, an OTP service for dual-channel verification, and Ethereum smart contracts written in Solidity for on-chain logic. MetaMask browser extension was used for wallet connectivity and transaction signing."),
  bodyPara("The system achieved 92.1% precision in face recognition, 96.0% precision in anti-spoofing, and 95.7% precision with 98.0% accuracy in coercion detection when tested using the Labeled Faces in the Wild benchmark, the CelebA-Spoof dataset, and 130 controlled video recordings. Using 45,000 gas units per transaction, the average transaction confirmation latency during peak load was 4.8 seconds. Resistance to replay, Sybil, man-in-the-middle, and coercion attacks is confirmed by formal security analysis."),
  new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 180, after: 120 },
    children: [
      new TextRun({ text: "Keywords: ", font: TNR, size: BODY_SIZE, bold: true }),
      new TextRun({ text: "Anti-coercion, blockchain, CNN, e-voting, Ethereum, face recognition, RSA encryption, Shamir's secret sharing, smart contracts, three-factor authentication", font: TNR, size: BODY_SIZE, italics: true })
    ]
  }),

  // ============================================================
  // TABLE OF CONTENTS
  // ============================================================
  pgBreak(),
  centerPara("TABLE OF CONTENTS", TITLE_SIZE, true, { spacing: { before: 0, after: 360 } }),

  ...[
    ["Certificate", "i"],
    ["Acknowledgment", "ii"],
    ["Abstract", "iii"],
    ["Table of Contents", "iv"],
    ["", ""],
    ["Chapter 1: Introduction", "1"],
    ["    1.1 Introduction", "1"],
    ["    1.2 Domain Description about the Area of Project", "3"],
    ["    1.3 Problem Definition", "5"],
    ["    1.4 Proposed Solution", "6"],
    ["    1.5 Objectives", "8"],
    ["    1.6 Organization of the Project Report", "9"],
    ["", ""],
    ["Chapter 2: Literature Survey", "11"],
    ["    2.1 Introduction", "11"],
    ["    2.2 Related Work", "12"],
    ["    2.3 Overview", "19"],
    ["", ""],
    ["Chapter 3: System Analysis", "21"],
    ["    3.1 Introduction", "21"],
    ["    3.2 Existing System & Disadvantages", "22"],
    ["    3.3 Proposed System & Advantages", "24"],
    ["    3.4 Software Requirements", "26"],
    ["    3.5 Hardware Requirements", "27"],
    ["    3.6 Modules Description", "27"],
    ["        3.6.1 Module 1: Voter Registration", "27"],
    ["        3.6.2 Module 2: Three-Factor Authentication", "28"],
    ["        3.6.3 Module 3: Encrypted Voting", "28"],
    ["        3.6.4 Module 4: AI Anti-Coercion Monitoring", "29"],
    ["        3.6.5 Module 5: Booth Mode with VVPAT", "29"],
    ["        3.6.6 Module 6: Result Tallying", "30"],
    ["    3.7 System Architecture", "30"],
    ["    3.8 Feasibility Study", "31"],
    ["        3.8.1 Economic Feasibility", "31"],
    ["        3.8.2 Technical Feasibility", "32"],
    ["        3.8.3 Procedural Feasibility", "32"],
    ["    3.9 System Requirements", "33"],
    ["        3.9.1 Hardware Requirements", "33"],
    ["        3.9.2 Software Requirements", "33"],
    ["", ""],
    ["Chapter 4: System Design", "35"],
    ["    4.1 Introduction", "35"],
    ["    4.2 DFD Diagrams", "36"],
    ["    4.3 UML Diagrams", "39"],
    ["        4.3.1 Use Case Diagram", "39"],
    ["        4.3.2 Sequence Diagram", "40"],
    ["        4.3.3 Class Diagram", "41"],
    ["        4.3.4 Collaboration Diagram", "43"],
    ["        4.3.5 Activity Diagram", "44"],
    ["", ""],
    ["Chapter 5: System Coding & Testing", "46"],
    ["    5.1 Introduction", "46"],
    ["    5.2 Implementation", "47"],
    ["    5.3 About Python", "49"],
    ["    5.4 Sample Code", "52"],
    ["    5.5 Software Testing Techniques", "62"],
    ["    5.6 Software Testing Strategies", "65"],
    ["", ""],
    ["Chapter 6: Results", "69"],
    ["    6.1 Introduction", "69"],
    ["    6.2 Output Screens", "70"],
    ["", ""],
    ["Chapter 7: Conclusion & Future Enhancements", "73"],
    ["    7.1 Conclusion", "73"],
    ["    7.2 Future Enhancements", "74"],
    ["", ""],
    ["References", "76"],
    ["Index", "78"],
    ["Publication Details", "80"],
  ].map(([label, page]) => {
    if (!label) return new Paragraph({ spacing: { before: 60, after: 60 }, children: [] });
    const isBold = !label.startsWith("    ");
    return new Paragraph({
      spacing: { before: 60, after: 60 },
      tabStops: [{ type: TabStopType.RIGHT, position: 8500, leader: "dot" }],
      children: [
        new TextRun({ text: label, font: TNR, size: BODY_SIZE, bold: isBold }),
        new TextRun({ text: `\t${page}`, font: TNR, size: BODY_SIZE, bold: isBold })
      ]
    });
  }),

  // ============================================================
  // CHAPTER 1 DIVIDER
  // ============================================================
  ...chapterDivider("1", "INTRODUCTION"),

  // ============================================================
  // CHAPTER 1 CONTENT
  // ============================================================
  pgBreak(),
  h1("Chapter 1"),
  h1("Introduction"),

  h2("1.1 Introduction"),
  bodyPara("The democratic process is based on the integrity, accessibility, and total secrecy of the voting process. Elections serve as the cornerstone of democratic governance, enabling citizens to exercise their fundamental right to choose their representatives. As the scale of the election process increases globally, paper-based voting has incurred considerable logistical costs, contributing to delays in the tabulation of results and raising concerns about the accuracy and reliability of the electoral process."),
  bodyPara("Electronic Voting Machines (EVMs) and electronic remote voting systems were introduced to alleviate the logistical challenges associated with paper-based voting. These systems promised faster tabulation, reduced human error, and improved accessibility for voters across geographically dispersed regions. However, while EVMs addressed some of the issues inherent in paper-based voting, they introduced a new set of critical vulnerabilities that have raised serious concerns about the integrity and security of the electoral process."),
  bodyPara("The primary vulnerabilities of existing electronic voting systems include centralized database manipulation, where vote data stored in a single server can be tampered with by malicious insiders or external attackers; identity spoofing through proxy votes, where an unauthorized person casts a vote on behalf of a registered voter; and voter coercion, where a third party forces or influences a voter to cast their ballot in a particular manner. These vulnerabilities undermine the very foundation of democratic elections and necessitate a fundamentally new approach to electronic voting system design."),
  bodyPara("In the traditional approach to identity verification in physical voting stations, identity documents are verified manually by election officials. This approach is inherently prone to human errors, as officials may fail to detect forged or altered identity documents, and can be exploited through various forms of election fraud including impersonation and proxy voting. The absence of biometric verification means that anyone possessing valid identity documents can potentially cast a fraudulent vote."),
  bodyPara("The need for a secure, transparent, and verifiable voting system that preserves ballot secrecy while providing cryptographic auditability has motivated this research. Blockchain technology has emerged as a promising solution due to its inherent properties of decentralization, immutability, and transparency. A blockchain-based voting system can create an immutable record of every vote cast, eliminating the possibility of post-election tampering and providing a publicly verifiable audit trail."),
  bodyPara("However, the storage of votes in plaintext on the blockchain creates a fundamental conflict between the transparency requirement and the principle of ballot secrecy. While blockchain provides an immutable and transparent ledger, this transparency means that anyone with access to the blockchain can potentially view individual votes, violating the secrecy principle that is essential for preventing voter coercion and ensuring freedom of choice. This core issue of public verifiability versus vote secrecy has been the primary research gap addressed by this project."),
  bodyPara("This project presents a novel AI-integrated decentralized e-voting system that leverages Ethereum blockchain technology, three-factor authentication, RSA-2048 ballot encryption, Shamir's Secret Sharing for decentralized key management, and real-time AI-based anti-coercion monitoring. The system addresses all known vulnerabilities in electronic voting systems by simultaneously achieving transparency through blockchain immutability, vote secrecy through client-side RSA encryption, voter identity assurance through biometric face recognition, and coercion resistance through real-time AI monitoring."),

  h2("1.2 Domain Description about the Area of Project"),
  bodyPara("This project falls under the intersection of multiple technology domains including Blockchain Technology, Artificial Intelligence, Cryptography, and Web Application Development. Each of these domains contributes critical capabilities that together enable a comprehensive secure voting solution."),

  h3("1.2.1 Blockchain Technology"),
  bodyPara("Blockchain is a distributed, immutable ledger technology that records transactions across a peer-to-peer network of computational nodes. Each block in the chain contains a cryptographic hash of the previous block, a timestamp, and a set of transaction records. This chaining mechanism ensures that once a block is added to the chain, its contents cannot be altered without invalidating all subsequent blocks — a property known as immutability. In the context of electronic voting, blockchain provides three critical guarantees: transparency (all transactions are publicly visible and verifiable), immutability (recorded votes cannot be altered or deleted), and decentralization (no single entity controls the voting records)."),
  bodyPara("The Ethereum blockchain, used in this project, extends the basic blockchain concept by supporting smart contracts — self-executing programs that are deployed on the blockchain and execute automatically when predefined conditions are met. Smart contracts written in the Solidity programming language handle all on-chain voting logic including voter registration, encrypted ballot storage, candidate management, and election state management."),
  bodyPara("Ethereum operates on a proof-of-stake consensus mechanism that validates and confirms transactions through a network of validators. Each transaction on the Ethereum network requires a certain amount of computational resources, measured in units called gas. For the proposed voting system, each vote transaction consumes approximately 45,000 gas units, making it economically feasible for organizational elections while maintaining the security guarantees of the Ethereum network."),

  h3("1.2.2 Artificial Intelligence and Computer Vision"),
  bodyPara("Artificial Intelligence (AI) plays a critical role in this system through two key capabilities: biometric face recognition for voter identity verification and real-time anti-coercion monitoring during the voting process. Both capabilities leverage Convolutional Neural Networks (CNNs), which are a class of deep learning models specifically designed for processing visual data such as images and video frames."),
  bodyPara("The face recognition module uses the Face-api.js library, which is built on top of TensorFlow.js. Face-api.js implements the SSD MobileNet v1 architecture for face detection, extracting 68 facial landmark points for geometric alignment and generating a 128-dimensional facial descriptor vector using a deep residual network."),
  bodyPara("The anti-coercion monitoring module extends the face recognition capability to provide continuous real-time surveillance during the voting process. By analyzing webcam frames at one-second intervals, the module detects three categories of threats: multiple faces in the frame, an unrecognized face, and face absence."),

  h3("1.2.3 Cryptography"),
  bodyPara("The project employs two major cryptographic techniques to ensure ballot secrecy and decentralized key management. RSA-2048 asymmetric encryption is used for ballot encryption. Votes are encrypted using the election public key on the client side before being transmitted to the blockchain."),
  bodyPara("Shamir's Secret Sharing (SSS) scheme is employed for decentralized management of the election private key. The SSS scheme splits the election private key into 5 shares with a threshold of 3 for reconstruction. This means that at least 3 out of 5 independent election committee members must come together to reconstruct the private key and decrypt the election results."),
  bodyPara("Additionally, SHA-256 hashing is used for biometric data privacy. The 128-dimensional facial descriptor vector is hashed using SHA-256 before being stored on the blockchain, ensuring that original biometric data cannot be reconstructed from the hash."),

  h3("1.2.4 Web Application Development"),
  bodyPara("The system is built as a decentralized application (DApp) using a modern multi-service web architecture. The frontend is developed using React.js with the Next.js framework. The backend comprises a Node.js/Express server and a Python/FastAPI server. A separate OTP service handles dual-channel one-time password generation and verification using Nodemailer for Email OTP delivery and Twilio SDK for SMS OTP delivery."),

  h2("1.3 Problem Definition"),
  bodyPara("Existing electronic voting systems face several critical problems that collectively undermine the integrity, security, and trustworthiness of the electoral process. The following is a detailed description of each problem:"),
  mixedPara("Centralized Database Vulnerability: ", "Traditional Electronic Voting Machines (EVMs) and internet-based voting systems store vote data in centralized databases controlled by a single election authority. This centralized architecture creates a single point of failure that is vulnerable to database tampering, unauthorized modification, denial-of-service attacks, and physical theft or destruction of the central server."),
  mixedPara("Identity Fraud and Proxy Voting: ", "Manual identity verification at physical polling stations relies on election officials visually comparing the voter's face with their identity document photograph. This process is inherently prone to human error and can be exploited through impersonation using forged documents and proxy voting where one person casts votes on behalf of others."),
  mixedPara("Absence of Ballot Secrecy on Blockchain: ", "While blockchain technology provides immutability and transparency, existing blockchain-based voting implementations store votes in plaintext on the blockchain. This means that any node operator or member of the public with access to a blockchain explorer can view individual votes, violating the fundamental principle of ballot secrecy."),
  mixedPara("No Real-Time Coercion Detection: ", "Current electronic voting systems lack any mechanism to detect voter coercion in real-time during the voting process. A coercer can physically stand behind the voter or be present in the same room during remote voting, directly observing and influencing the voter's choice."),
  mixedPara("Single-Authority Key Management: ", "In voting systems that employ encryption, the decryption key is typically controlled by a single election authority. This creates a trust bottleneck where one individual has the sole power to decrypt and view all votes."),
  mixedPara("Weak Authentication: ", "Most existing electronic voting systems rely on single-factor authentication, typically a password, PIN, or physical identity card. Single-factor authentication is easily compromised through credential theft, sharing, or phishing attacks."),

  h2("1.4 Proposed Solution"),
  bodyPara("The proposed system addresses all identified problems through a comprehensive multi-layered security architecture that integrates six independent security dimensions into a single cohesive system."),
  mixedPara("Decentralized Storage on Ethereum Blockchain: ", "All vote records are stored on the Ethereum blockchain, a globally distributed network of thousands of independent nodes. Once a vote is recorded and confirmed, it becomes part of the permanent, immutable historical record. The Voting.sol smart contract enforces all voting rules automatically and transparently."),
  mixedPara("Three-Factor Authentication (3FA): ", "The system implements a comprehensive three-factor authentication protocol. Factor 1 (Something You Have) verifies wallet possession. Factor 2 (Something You Know) sends OTPs via Email and SMS. Factor 3 (Something You Are) captures a live facial image and compares it against the stored facial descriptor using Euclidean distance with a threshold of 0.65."),
  mixedPara("Client-Side RSA-2048 Encryption: ", "Votes are encrypted in the voter's browser using RSA-2048 asymmetric encryption before transmission to the blockchain. The plaintext vote never leaves the voter's browser; only the encrypted ciphertext is stored on-chain."),
  mixedPara("Shamir's Secret Sharing (SSS): ", "The election private key is split into 5 shares using Shamir's Secret Sharing scheme with a threshold of 3. At least 3 of the 5 independent election committee members must cooperate to reconstruct the private key."),
  mixedPara("AI Anti-Coercion Monitoring: ", "During ballot casting, the system continuously monitors the voter's webcam using Face-api.js. The monitoring module detects multiple faces, identity switches, and face absence, triggering tiered lockouts with 5-second grace periods."),
  mixedPara("Booth Mode with VVPAT: ", "For supervised voting environments, the system provides a dedicated booth mode with digital Voter-Verified Paper Audit Trail (VVPAT) support, privacy shield overlays, voice guidance, and auto-generated wallet credentials for walk-in voters."),

  h2("1.5 Objectives"),
  bodyPara("The primary objectives of this project are:"),
  mixedPara("1. ", "To develop a decentralized e-voting system on the Ethereum blockchain that ensures transparency, immutability, and tamper-resistance of all voting records through smart contract-enforced rules and distributed ledger technology."),
  mixedPara("2. ", "To implement end-to-end ballot encryption using the RSA-2048 asymmetric encryption algorithm to preserve vote secrecy on a public blockchain, with votes encrypted client-side before transmission."),
  mixedPara("3. ", "To deploy Shamir's Secret Sharing scheme with a 3-of-5 threshold for decentralized key management of the election private key, distributing decryption authority among 5 independent election committee members."),
  mixedPara("4. ", "To implement three-factor authentication combining blockchain wallet ownership verification, dual-channel OTP verification via Email and SMS, and CNN-based biometric face recognition using 128-dimensional facial descriptors."),
  mixedPara("5. ", "To integrate real-time AI-based anti-coercion monitoring using computer vision for detecting multiple faces, identity switches, and coercion attempts during the voting process."),
  mixedPara("6. ", "To develop a supervised booth mode with digital VVPAT support for secure and accessible voting in physical polling stations, including provisions for walk-in voters, privacy shield overlays, and voice guidance."),
  mixedPara("7. ", "To evaluate the system's performance using real-world benchmark datasets including the Labeled Faces in the Wild (LFW) dataset, the CelebA-Spoof dataset, and 130 controlled video recordings."),
  mixedPara("8. ", "To conduct formal security analysis against six categories of known electronic voting attacks: replay, Sybil, man-in-the-middle, coercion, spoofing, and key compromise attacks."),

  h2("1.6 Organization of the Project Report"),
  bodyPara("This project report is organized into seven chapters:"),
  mixedPara("Chapter 1 — Introduction: ", "Provides an overview of the project including motivation, domain description, problem definition, proposed multi-layered security solution, project objectives, and organizational overview."),
  mixedPara("Chapter 2 — Literature Survey: ", "Reviews existing research on blockchain-based voting systems, biometric authentication mechanisms, cryptographic key management techniques, and anti-coercion strategies."),
  mixedPara("Chapter 3 — System Analysis: ", "Presents detailed analysis of existing system limitations, proposed system advantages, software and hardware requirements, six system module descriptions, multi-tier system architecture, and feasibility study."),
  mixedPara("Chapter 4 — System Design: ", "Presents the system design through Data Flow Diagrams (DFDs) at context, Level 1, and Level 2 granularity, followed by five UML diagrams."),
  mixedPara("Chapter 5 — System Coding & Testing: ", "Describes implementation details, technologies used, sample code from six key modules, and software testing techniques and strategies."),
  mixedPara("Chapter 6 — Results: ", "Presents experimental results including biometric performance metrics, blockchain performance metrics, and ten annotated output screens."),
  mixedPara("Chapter 7 — Conclusion & Future Enhancements: ", "Summarizes project findings and contributions, and presents eight potential future enhancements."),

  // ************************************************************
  // PART 2: CHAPTER 2 (LITERATURE SURVEY) & CHAPTER 3 (SYSTEM ANALYSIS)
  // ************************************************************

  // ============================================================
  // CHAPTER 2 DIVIDER
  // ============================================================
  ...chapterDivider("2", "LITERATURE SURVEY"),
  pgBreak(),

  h1("Chapter 2"),
  h1("Literature Survey"),

  h2("2.1 Introduction"),
  bodyPara("This chapter presents a comprehensive review of the existing literature on blockchain-based voting systems, biometric authentication mechanisms, cryptographic key management techniques, and anti-coercion strategies. The literature survey covers eight significant research works published between 2024 and 2025, representing the most recent advancements in the field of electronic voting security."),
  bodyPara("The survey is organized thematically into four subsections: blockchain-based voting systems; cryptographic key management techniques; biometric authentication systems; and a comprehensive comparative analysis that identifies the specific research gaps addressed by the proposed system."),
  bodyPara("The primary purpose of this literature survey is to establish the intellectual foundation for the proposed AI-integrated decentralized e-voting system by demonstrating that while existing systems have made significant progress in individual aspects of electronic voting security, no single system simultaneously addresses all six critical security dimensions: blockchain immutability, biometric verification, ballot encryption, coercion detection, decentralized key management, and multi-channel OTP authentication."),

  h2("2.2 Related Work"),

  h3("2.2.1 Blockchain-Based Voting Systems"),
  bodyPara("Sah et al. [1] conducted a comprehensive review titled \"Leveraging Blockchain Technology for Secure Online Voting Systems\" published in the Journal of Mobile Multimedia in July 2025. Their work demonstrated that Ethereum smart contracts can significantly improve vote transparency by providing an immutable public record of all voting transactions. The authors analyzed multiple blockchain-based voting prototypes and concluded that the Ethereum platform, with its Turing-complete smart contract functionality, offers the most suitable infrastructure for implementing decentralized voting rules."),
  bodyPara("However, their implementation recorded votes in plaintext on the blockchain without any form of encryption or privacy-preserving mechanism, directly linking voter addresses to their ballot choices. Furthermore, their review did not address the critical issue of biometric authentication, relying instead on traditional password-based or token-based authentication mechanisms susceptible to credential theft and impersonation attacks."),
  bodyPara("Alown et al. [3] conducted a survey titled \"Enhancing Democratic Processes: A Survey of DRE, Internet, and Blockchain Voting Systems\" published in IEEE Access in 2025. Their comprehensive analysis covered three categories of electronic voting systems: Direct Recording Electronic (DRE) systems, Internet-based voting systems, and blockchain-based voting systems. The authors developed a multi-dimensional comparison framework evaluating each system across auditability, scalability, accessibility, and resistance to tampering."),
  bodyPara("Their analysis concluded that decentralized blockchain-based systems are significantly more efficient than centralized DRE and Internet-based systems in terms of auditability. However, the survey identified that no surveyed system implemented end-to-end ballot encryption, directly supporting the research gap addressed by the proposed system."),
  bodyPara("Barelli et al. [2] published a systematic survey titled \"Toward Secure Electronic Voting: A Survey on E-Voting Systems and Attacks\" in IEEE Access in 2025. Their work cataloged and classified the attack surfaces in electronic voting systems into six categories: network attacks, authentication attacks, software attacks, hardware attacks, insider attacks, and social engineering attacks. While their work provided an invaluable framework for understanding the threat landscape, it did not propose any specific AI-based solution for addressing the identified threats."),

  h3("2.2.2 Cryptographic Key Management"),
  bodyPara("Reyes-Macedo et al. [4] introduced a threshold-blind signature scheme published in IEEE Access in 2024. Their scheme combines threshold cryptography with blind signatures, allowing a group of authorities to collectively authorize a transaction without any individual authority having full knowledge of the transaction contents or full signing authority."),
  bodyPara("Their approach to splitting cryptographic authority among multiple parties is conceptually related to the Shamir's Secret Sharing method utilized in the proposed system. However, their scheme requires all participating authorities to be online simultaneously for the signing process, while Shamir's Secret Sharing allows for asynchronous share collection. Additionally, their work did not explore the application of threshold cryptography to electronic voting ballot decryption."),

  h3("2.2.3 Biometric Authentication Systems"),
  bodyPara("Maheshwari et al. [5] proposed a multimodal biometric system titled \"Blockchain Integration with Multimodal Biometric Authentication System for Secure Smart Verifiable Electronic Voting System\" published in IEEE Xplore in 2025. Their system combined fingerprint recognition and iris scanning to achieve a 100% true acceptance rate (TAR) on ARM-specific hardware."),
  bodyPara("Despite the impressive biometric performance, the system had significant limitations: it did not integrate blockchain storage for tamper-proof vote recording, lacked any form of ballot encryption, included no anti-coercion analysis or detection mechanism, and the reliance on specialized ARM hardware limits its applicability to dedicated polling station deployments."),
  bodyPara("Kumar et al. [6] developed a system titled \"Secure E-Voting System Using Blockchain Technology and Authentication via Face Recognition and Mobile OTP\" published in IEEE Xplore in 2025. Their system combined face recognition with mobile OTPs and blockchain for vote storage. However, the system did not implement any form of ballot encryption, storing votes in plaintext on the blockchain, and completely ignored the issue of voter coercion."),
  bodyPara("The ViT-LoRA system [7], proposed by Zhang, Chen, and Liu in 2025, achieved an impressive 97.36% accuracy in facial authentication using a Vision Transformer (ViT) architecture with Low-Rank Adaptation (LoRA). Despite the superior accuracy, the system focused exclusively on improving authentication accuracy without addressing anti-coercion analysis, decentralized key management, or multi-factor authentication."),
  bodyPara("Faruk et al. [8] developed a system titled \"Transforming Online Voting: A Novel System Utilizing Blockchain and Biometric Verification\" published in Cluster Computing in April 2024. Their system combined Hyperledger Fabric blockchain with biometric authentication. However, the system did not include anti-coercion detection, operated on a permissioned rather than public blockchain, and did not implement any form of asymmetric encryption for ballot secrecy."),

  h3("2.2.4 Comparative Analysis"),
  bodyPara("Table 2.1 presents a comprehensive comparative analysis of the surveyed systems against six critical security dimensions. The comparison clearly demonstrates that while each existing system addresses between one and three of these dimensions, no single system addresses all six simultaneously."),
  new Paragraph({ spacing: { before: 180, after: 60 }, children: [] }),
  makeTable(
    ["Feature", "[1]", "[3]", "[5]", "[6]", "[7]", "[8]", "Proposed"],
    [
      ["Blockchain Storage", "YES", "YES", "NO", "YES", "YES", "YES", "YES"],
      ["Biometric Auth", "NO", "NO", "YES", "YES", "YES", "YES", "YES"],
      ["Encrypted Ballots", "NO", "NO", "NO", "NO", "NO", "NO", "YES"],
      ["Coercion Detection", "NO", "NO", "NO", "NO", "NO", "NO", "YES"],
      ["Decentralized Keys", "NO", "NO", "NO", "NO", "NO", "NO", "YES"],
      ["OTP Authentication", "NO", "NO", "NO", "YES", "NO", "NO", "YES"],
    ],
    [2200, 800, 800, 800, 800, 800, 800, 1200]
  ),
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { before: 60, after: 240 },
    children: [new TextRun({ text: "Table 2.1: Comparative Analysis of Related E-Voting Systems", font: TNR, size: BODY_SIZE, bold: true })]
  }),

  h2("2.3 Overview"),
  bodyPara("The literature survey reveals several important findings about the current state of research in electronic voting security. The key research gaps identified through this survey are:"),
  mixedPara("Gap 1 — Transparency versus Secrecy Paradox: ", "No existing blockchain-based voting system resolves the fundamental tension between blockchain transparency and ballot secrecy. The proposed system resolves this paradox through client-side RSA-2048 encryption, ensuring only encrypted ciphertext is stored on the transparent blockchain."),
  mixedPara("Gap 2 — Absence of Real-Time Coercion Detection: ", "None of the eight surveyed systems implements any form of automated real-time coercion detection during the voting process. The proposed system addresses this gap through continuous AI-based monitoring using Face-api.js."),
  mixedPara("Gap 3 — Centralized Key Management: ", "No existing e-voting implementation applies decentralized key management to ballot decryption. The proposed system applies Shamir's Secret Sharing with a 3-of-5 threshold, distributing decryption authority among multiple independent committee members."),
  mixedPara("Gap 4 — Incomplete Multi-Factor Authentication: ", "Multi-factor authentication in surveyed systems is limited to at most two factors. The proposed system is the first to implement true three-factor authentication combining wallet possession, dual-channel OTP, and biometric face recognition."),
  mixedPara("Gap 5 — Lack of Anti-Spoofing Integration: ", "None of the surveyed voting systems integrated anti-spoofing detection to prevent presentation attacks. The proposed system integrates anti-spoofing capabilities through the Face-api.js detection pipeline."),

  // ============================================================
  // CHAPTER 3 DIVIDER
  // ============================================================
  ...chapterDivider("3", "SYSTEM ANALYSIS"),
  pgBreak(),

  h1("Chapter 3"),
  h1("System Analysis"),

  h2("3.1 Introduction"),
  bodyPara("This chapter presents a detailed and systematic analysis of the AI-integrated decentralized e-voting system. The analysis begins with a comprehensive examination of the existing electronic voting system, identifying its structural limitations and security vulnerabilities. This is followed by a detailed description of the proposed system, highlighting the specific advantages that the multi-layered security architecture provides over existing solutions."),
  bodyPara("The chapter also covers the complete software and hardware requirements for system development and deployment, provides detailed descriptions of all six functional modules, presents the multi-tier system architecture, and includes a thorough feasibility study evaluating the project from economic, technical, and procedural perspectives."),

  h2("3.2 Existing System & Disadvantages"),
  bodyPara("The existing electronic voting systems, particularly Electronic Voting Machines (EVMs), rely on centralized architectures where vote data is stored in a single database controlled by an election authority. These systems were designed primarily to address the logistical challenges of paper-based voting but introduced new categories of security vulnerabilities."),
  bodyPara("The typical architecture consists of a dedicated voting terminal at each polling station connected to a central server through a secure network. Voters authenticate using physical identity documents, and their votes are recorded in a centralized database. While this centralized model simplifies system management, it creates multiple vulnerabilities:"),
  mixedPara("1. Centralized Single Point of Failure: ", "The centralized database architecture is vulnerable to hacking, malware injection, physical tampering, and denial-of-service attacks. The concentration of all vote data in a single location makes it an attractive target for sophisticated adversaries."),
  mixedPara("2. Manual Identity Verification Weaknesses: ", "Identity verification at polling stations relies on election officials visually comparing the voter's face with their identity document photograph. This manual process is unreliable due to official fatigue, outdated photographs, poor lighting, and is susceptible to proxy voting."),
  mixedPara("3. No End-to-End Encryption: ", "In most existing EVM systems, votes are stored in plaintext or with weak encryption. The encryption keys are typically held by the same authority that manages the database, providing no meaningful separation of authority."),
  mixedPara("4. No Automated Coercion Detection: ", "Existing electronic voting systems lack any automated mechanism for detecting voter coercion. In remote voting scenarios, the voter is completely unprotected, as a coercer can sit next to the voter and directly observe and influence their vote."),
  mixedPara("5. Limited and Mutable Audit Trail: ", "While existing EVMs generate internal logs, these logs are maintained by the election authority on the same centralized system that manages the votes. Unlike blockchain-based systems, centralized audit logs can potentially be altered without detection."),
  mixedPara("6. Single Authority Key Management: ", "In systems that implement encryption, the decryption key is controlled by a single election authority. This creates risks of premature vote disclosure, selective revelation of vote choices, and vulnerability to coercion of the key holder."),

  h2("3.3 Proposed System & Advantages"),
  bodyPara("The proposed AI-integrated decentralized e-voting system leverages Ethereum blockchain technology, artificial intelligence, and advanced cryptography to overcome all limitations of the existing system. The system represents a fundamental architectural shift from centralized control to distributed trust."),
  mixedPara("1. Decentralized Immutable Storage: ", "All vote records are stored on the Ethereum blockchain, a globally distributed network of thousands of independently operated nodes. Each transaction is validated by network consensus, cryptographically linked to previous transactions, and replicated across all nodes, eliminating the single point of failure."),
  mixedPara("2. Three-Factor Biometric Authentication: ", "The system implements a comprehensive three-factor authentication protocol combining wallet possession, dual-channel OTP via Email and SMS, and biometric face recognition with 128-dimensional facial descriptors."),
  mixedPara("3. Client-Side RSA-2048 Ballot Encryption: ", "Votes are encrypted using RSA-2048 directly in the voter's browser before any network transmission. The RSA-2048 key size provides 112 bits of security against classical computing attacks."),
  mixedPara("4. AI-Powered Real-Time Anti-Coercion Monitoring: ", "The system integrates continuous webcam-based monitoring using Face-api.js, detecting three categories of coercion threats with a tiered lockout system featuring configurable grace periods."),
  mixedPara("5. Shamir's Secret Sharing for Distributed Key Management: ", "The election private key is split into 5 shares using Shamir's Secret Sharing over GF(2^8) with a reconstruction threshold of 3, providing information-theoretic security."),
  mixedPara("6. Comprehensive Immutable Audit Trail: ", "Every operation — voter registration, vote casting, election state changes — generates a blockchain transaction with an associated event log permanently recorded on the blockchain."),

  h2("3.4 Software Requirements"),
  bodyPara("The following software components are required for the development, deployment, and operation of the proposed system:"),
  mixedPara("Operating System: ", "Windows 10/11, macOS 12+ (Monterey or later), or Ubuntu 20.04 LTS or later. The system is platform-independent."),
  mixedPara("Runtime Environment: ", "Node.js v18.0 or later (LTS recommended) with npm v9.0 or later. Python 3.9 or later with pip package manager for the AI processing backend."),
  mixedPara("Blockchain Framework: ", "Hardhat v2.19 or later for local Ethereum development. For production deployment, Ethereum Sepolia testnet accessed through Alchemy RPC endpoint."),
  mixedPara("Smart Contract Language: ", "Solidity ^0.8.28 — the latest stable version of the Ethereum smart contract programming language."),
  mixedPara("Frontend Framework: ", "React.js 18 or later with Next.js 14 or later. Ethers.js 6.0 or later for blockchain interaction through MetaMask provider."),
  mixedPara("Backend Frameworks: ", "Express.js 4.18 or later for the Node.js REST API server. FastAPI 0.100 or later for the Python AI processing server."),
  mixedPara("Database: ", "SQLite 3 via the better-sqlite3 npm package for off-chain voter data storage."),
  mixedPara("AI/ML Libraries: ", "Face-api.js 0.22 or later (built on TensorFlow.js) for browser-based face detection. OpenCV (cv2) 4.8 or later for server-side image processing."),
  mixedPara("Cryptography Libraries: ", "JSEncrypt for client-side RSA-2048 encryption. Secrets.js-grempe for Shamir's Secret Sharing. Node.js built-in crypto module for SHA-256 hashing."),
  mixedPara("Communication Services: ", "Nodemailer for Email OTP delivery via Gmail SMTP. Twilio SDK for SMS OTP delivery."),

  h2("3.5 Hardware Requirements"),
  bodyPara("The following hardware specifications are required for the development, testing, and deployment of the proposed system:"),
  mixedPara("Processor: ", "Intel Core i5 (8th Generation) or AMD Ryzen 5 — minimum requirement. Intel Core i7 or AMD Ryzen 7 recommended."),
  mixedPara("RAM: ", "8 GB minimum for running all services. 16 GB recommended for concurrent development and testing."),
  mixedPara("Storage: ", "10 GB minimum free disk space. SSD recommended for faster compilation and server startup times."),
  mixedPara("HD Webcam: ", "720p (1280×720 pixels) minimum resolution with autofocus capability and 30 FPS minimum frame rate."),
  mixedPara("Network: ", "Stable broadband internet connection with minimum 2 Mbps download speed."),
  mixedPara("Display: ", "Minimum 1366×768 pixel resolution. 1920×1080 (Full HD) recommended."),

  h2("3.6 Modules Description"),
  bodyPara("The proposed system is organized into six functionally independent modules, each responsible for a specific aspect of the voting process."),

  h3("3.6.1 Module 1: Voter Registration Module"),
  bodyPara("The Voter Registration Module is responsible for enrolling new voters into the system through the admin dashboard. This module is exclusively accessible to the election administrator and performs the following operations:"),
  mixedPara("Step 1 — Data Collection: ", "The administrator enters the voter's personal information including full name, Ethereum wallet address, mobile phone number, email address, and date of birth."),
  mixedPara("Step 2 — Face Capture: ", "The module activates the webcam and displays a live video preview. Face-api.js processes the captured frame to detect the face, extract 68 facial landmark points, and generate a 128-dimensional facial descriptor vector stored in SQLite database."),
  mixedPara("Step 3 — Blockchain Registration: ", "A SHA-256 hash of the facial descriptor vector is computed (the faceHash). The module calls the registerVoter(address, bytes32) function on the Voting.sol smart contract, passing the voter's wallet address and faceHash."),
  mixedPara("Step 4 — Confirmation: ", "Upon successful blockchain transaction confirmation, the module displays a success message with the transaction hash, voter details, and registration status."),

  h3("3.6.2 Module 2: Three-Factor Authentication Module"),
  bodyPara("The Three-Factor Authentication Module implements a sequential verification pipeline that every voter must complete before casting their ballot."),
  mixedPara("Factor 1 — Wallet Possession (Something You Have): ", "When the voter clicks 'Connect Wallet,' the module requests MetaMask to provide the active wallet address. This address is sent to the backend server via GET /voter/{address} API call to verify that the wallet is registered in the system."),
  mixedPara("Factor 2 — Dual-Channel OTP (Something You Know): ", "The module simultaneously sends requests to the OTP Service: POST /send-otp for Email OTP via Nodemailer/Gmail SMTP, and POST /send-sms for SMS OTP via Twilio API. OTP codes expire after 300 seconds to prevent replay attacks."),
  mixedPara("Factor 3 — Face Recognition (Something You Are): ", "The module activates the webcam, captures a live facial image, computes the 128-dimensional descriptor, and computes the Euclidean distance between the live descriptor and the stored descriptor. A distance below 0.65 confirms identity match."),

  h3("3.6.3 Module 3: Encrypted Voting Module"),
  bodyPara("Once three-factor authentication is complete, the Encrypted Voting Module enables the voter to cast their ballot securely:"),
  mixedPara("Step 1 — Candidate Display: ", "The module reads the candidate list from the smart contract's getCandidates() function and displays them as interactive cards."),
  mixedPara("Step 2 — Vote Encryption: ", "When the voter selects a candidate, the module retrieves the election public key from the smart contract and uses JSEncrypt to encrypt the candidate's ID with RSA-2048 directly in the browser."),
  mixedPara("Step 3 — Blockchain Submission: ", "The encrypted ballot is submitted to the blockchain through the vote(string memory encryptedVote) smart contract function via MetaMask. The smart contract enforces four checks: voter must be registered, must not have already voted, election must be open, and encrypted vote must be non-empty."),
  mixedPara("Step 4 — Confirmation: ", "Upon transaction confirmation (average 4.8 seconds), the module displays a success message with the transaction hash and block number."),

  h3("3.6.4 Module 4: AI Anti-Coercion Monitoring Module"),
  bodyPara("The AI Anti-Coercion Monitoring Module provides continuous real-time surveillance during the ballot casting process. The monitoring logic runs a detection loop every 1000 milliseconds performing three detection rules:"),
  mixedPara("Rule 1: ", "If more than one face is detected in the frame, a 'multiple faces' violation is flagged, indicating a potential coercer is present."),
  mixedPara("Rule 2: ", "If exactly one face is detected but its Euclidean distance from the verified voter exceeds 0.45, an 'unrecognized face' violation is flagged."),
  mixedPara("Rule 3: ", "If no faces are detected, a 'face absent' violation is flagged."),
  bodyPara("A 5-second grace period is implemented for all violations to prevent false positives. The tiered lockout system provides: 1-minute lockout for identity verification failures, and 3-minute lockout for multiple face detections with a full-screen privacy shield overlay."),

  h3("3.6.5 Module 5: Booth Mode with VVPAT Module"),
  bodyPara("The Booth Mode module provides a supervised voting environment designed for physical polling stations. The administrator activates booth mode from the admin dashboard. For each walk-in voter: identification via face recognition against the registered database, selection of the matching voter record, generation of auto-assigned wallet credentials if the voter does not have their own wallet, face-based identity verification, and facilitated ballot casting through the boothVote() smart contract function."),
  bodyPara("After successful vote casting, the module generates a digital Voter-Verified Paper Audit Trail (VVPAT) receipt displaying vote confirmation details. Additional features include a privacy shield overlay and voice guidance using the Web Speech API for visually impaired voters."),

  h3("3.6.6 Module 6: Result Tallying Module"),
  bodyPara("The Result Tallying Module is responsible for the post-election vote counting process, accessible only to the election administrator after the election is closed."),
  bodyPara("The tallying process begins with key reconstruction: the administrator collects at least 3 of the 5 Shamir's Secret Sharing key shares from independent election committee members. The module uses the Secrets.js-grempe library to reconstruct the election private key through polynomial interpolation."),
  bodyPara("Once the private key is reconstructed, the module iterates through all registered voter addresses, decrypts each encrypted vote using RSA-2048, tallies the results, and displays detailed statistics including total registered voters, total votes cast, voter turnout percentage, and decryption success/failure counts."),

  h2("3.7 System Architecture"),
  bodyPara("The system follows a multi-tier decentralized architecture organized into four distinct layers:"),
  mixedPara("Presentation Layer (Frontend — Port 3000): ", "The React.js/Next.js frontend application runs in the user's web browser, integrating Face-api.js for client-side AI processing, JSEncrypt for RSA-2048 ballot encryption, and ethers.js for blockchain interactions through MetaMask."),
  mixedPara("Application Layer (Backend Services): ", "Three independent microservices: the Node.js/Express Backend Server (Port 5000) for voter CRUD operations; the OTP Service (Port 4000) for dual-channel password management; and the Python/FastAPI AI Server (Port 8000) for server-side face verification using OpenCV."),
  mixedPara("Blockchain Layer (Ethereum Network): ", "The Ethereum network (Hardhat local node at Port 8545 for development, or Sepolia testnet for production) and the Voting.sol smart contract managing all on-chain state."),
  mixedPara("Data Layer (Persistent Storage): ", "Off-Chain Storage using SQLite database (voters.db) for voter personal information and facial descriptors. On-Chain Storage using Ethereum blockchain for voter registration status, face hash, encrypted ballots, and election public key."),

  ...imagePlaceholder("Fig. 3.7.1", "Multi-tier System Architecture Diagram"),

  h2("3.8 Feasibility Study"),

  h3("3.8.1 Economic Feasibility"),
  bodyPara("The project is economically feasible as it is built entirely on free and open-source technologies, requiring zero licensing costs for development, testing, or deployment. All core development tools — Node.js, Python, Hardhat, React.js, Next.js, Face-api.js, MetaMask — are released under permissive open-source licenses."),
  bodyPara("For production deployment, each vote transaction consumes approximately 45,000 gas units. At typical Ethereum gas prices (10-30 gwei), this translates to approximately $0.10-$0.50 per vote depending on network congestion. The dual-channel OTP service incurs marginal costs for SMS delivery ($0.01 per SMS via Twilio), while email OTP delivery via Gmail SMTP is free for moderate volumes."),

  h3("3.8.2 Technical Feasibility"),
  bodyPara("All technologies used in the proposed system are mature, well-documented, and actively maintained by large developer communities. The Ethereum blockchain has been operational since 2015 and provides battle-tested infrastructure. Face-api.js provides reliable CNN-based face recognition capabilities directly in the browser without requiring server-side GPU resources, achieving detection rates of 10-15 frames per second on mid-range consumer hardware."),

  h3("3.8.3 Procedural Feasibility"),
  bodyPara("The system is operationally feasible with minimal training requirements for both administrators and voters. The voter interface provides a clear, step-by-step guided process organized into four sequential stages: Wallet → Face → OTP → Vote. Each stage includes visual progress indicators, clear instructions, and real-time feedback."),
  bodyPara("The operational workflow aligns with existing election procedures: pre-election setup (key generation, candidate registration, voter enrollment), election day operations (voter authentication, ballot casting, monitoring), and post-election processing (key share collection, vote decryption, result announcement)."),

  h2("3.9 System Requirements"),

  h3("3.9.1 Hardware Requirements"),
  new Paragraph({ spacing: { before: 180, after: 60 }, children: [] }),
  makeTable(
    ["Component", "Minimum Requirement", "Recommended"],
    [
      ["Processor", "Intel i5 (8th Gen) / AMD Ryzen 5", "Intel i7 / AMD Ryzen 7"],
      ["RAM", "8 GB DDR4", "16 GB DDR4"],
      ["Storage", "10 GB HDD", "20 GB SSD"],
      ["Webcam", "720p HD (30 FPS)", "1080p Full HD (60 FPS)"],
      ["Network", "2 Mbps Broadband", "10 Mbps Broadband"],
      ["Display", "1366×768", "1920×1080"],
    ],
    [2500, 3000, 3000]
  ),
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { before: 60, after: 240 },
    children: [new TextRun({ text: "Table 3.1: Hardware Requirements", font: TNR, size: BODY_SIZE, bold: true })]
  }),

  h3("3.9.2 Software Requirements"),
  new Paragraph({ spacing: { before: 180, after: 60 }, children: [] }),
  makeTable(
    ["Software", "Version", "Purpose"],
    [
      ["Node.js", "v18.0+", "Server-side JavaScript runtime"],
      ["Python", "3.9+", "AI processing backend"],
      ["Hardhat", "v2.19+", "Ethereum development framework"],
      ["Solidity", "^0.8.28", "Smart contract language"],
      ["React.js + Next.js", "18+ / 14+", "Frontend framework"],
      ["MetaMask", "v11+", "Wallet & transaction signing"],
      ["Chrome / Firefox", "110+", "Web browser"],
      ["SQLite", "3", "Off-chain database"],
      ["Face-api.js", "0.22+", "Face detection & recognition"],
      ["Git", "2.30+", "Version control"],
    ],
    [2500, 1800, 4200]
  ),
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { before: 60, after: 240 },
    children: [new TextRun({ text: "Table 3.2: Software Requirements", font: TNR, size: BODY_SIZE, bold: true })]
  }),

  // ************************************************************
  // PART 3: CHAPTER 4 (SYSTEM DESIGN)
  // ************************************************************

  // ============================================================
  // CHAPTER 4 DIVIDER
  // ============================================================
  ...chapterDivider("4", "SYSTEM DESIGN"),
  pgBreak(),

  h1("Chapter 4"),
  h1("System Design"),

  h2("4.1 Introduction"),
  bodyPara("Once the analysis stage is completed, the next stage is to determine in broad outline form how the problem might be solved. During system design, we begin to move from the logical to physical level. System design involves architectural and detailed design of the system. Architectural design involves identifying software components, decomposing them into processing modules and conceptual data structures, and specifying the interconnections among components."),
  bodyPara("Detailed design is concerned with how to package processing modules and how to implement the processing algorithms, data structures, and interconnections of standard algorithms, invention of new algorithms, and design of data representations and packaging of software products."),
  bodyPara("This chapter presents the system design of the AI-integrated decentralized e-voting system through various design diagrams. Data Flow Diagrams (DFDs) illustrate the flow of data through the system at multiple levels of abstraction, while UML diagrams model the system's structure and behavior from different perspectives."),

  h2("4.2 DFD Diagrams"),
  bodyPara("A Data Flow Diagram (DFD) is also called a bubble chart. It is a simple graphical formalism that can be used to represent a system in terms of input data to the system, various processing carried out on this data, and the output data generated by the system. The data flow diagram is one of the most important modeling tools used to model the system components. These components are the system process, the data used by the process, an external entity that interacts with the system, and the information flows in the system."),
  bodyPara("DFD shows how the information moves through the system and how it is modified by a series of transformations. It is a graphical technique that depicts information flow and the transformations that are applied as data moves from input to output. DFD may be partitioned into levels that represent increasing information flow and functional detail."),

  h3("4.2.1 Context Level DFD (Level 0)"),
  bodyPara("The context-level DFD shows the system as a single process interacting with three external entities: Voter, Admin, and Ethereum Blockchain. The Voter provides authentication credentials (wallet address, face image, OTP codes) and receives voting confirmation and VVPAT receipt. The Admin provides election configuration (candidates, election keys, voter registration data) and receives election results and system status. The Ethereum Blockchain stores and retrieves voter records, encrypted ballots, candidate data, and election public key."),

  ...imagePlaceholder("Fig. 4.2.1", "Context Level DFD (Level 0) — AI-Integrated E-Voting System"),

  h3("4.2.2 Level 1 DFD"),
  bodyPara("The Level 1 DFD decomposes the system into six major processes, each corresponding to a functional module:"),
  mixedPara("P1 — Voter Registration Process: ", "Receives voter details and face image from Admin, stores face descriptor in SQLite database, and registers faceHash on the blockchain via the registerVoter() smart contract function."),
  mixedPara("P2 — Authentication Process: ", "Handles three-factor verification — wallet check against blockchain registry, OTP generation and verification via Email/SMS, and face recognition comparison using Euclidean distance."),
  mixedPara("P3 — Vote Encryption Process: ", "Retrieves election public key from blockchain, performs client-side RSA-2048 encryption of the candidate ID using JSEncrypt, and submits the encrypted ballot via MetaMask transaction signing."),
  mixedPara("P4 — Anti-Coercion Monitoring Process: ", "Continuously analyzes webcam frames for multiple face detection, identity verification against the stored descriptor, and triggers tiered lockout on violations. Runs in parallel with the vote encryption process."),
  mixedPara("P5 — Booth Mode Process: ", "Manages supervised voting with voter verification via face scan, booth vote submission via the boothVote() function, auto-generated wallet credentials, and VVPAT receipt generation."),
  mixedPara("P6 — Result Tallying Process: ", "Collects SSS shares from committee members, reconstructs the private key via polynomial interpolation, reads encrypted ballots from blockchain, decrypts votes using RSA-2048, and computes candidate-wise results."),

  ...imagePlaceholder("Fig. 4.2.2", "Level 1 DFD — Six Major Processes of the E-Voting System"),

  h3("4.2.3 Level 2 DFD — Authentication Sub-process"),
  bodyPara("The authentication process is further decomposed into three sub-processes:"),
  mixedPara("P2.1 — Wallet Verification: ", "Receives the MetaMask-connected wallet address from the frontend. Queries the Node.js backend API (GET /voter/{address}) to check if the wallet address exists in the SQLite database. Queries the smart contract's voters mapping to verify the isRegistered flag is true and hasVoted flag is false."),
  mixedPara("P2.2 — Dual-Channel OTP Verification: ", "Receives the voter's email and mobile number from the backend database. Sends POST /send-otp request for email OTP generation via Nodemailer/Gmail SMTP and POST /send-sms request for SMS OTP generation via Twilio API. OTP expiry is enforced at 300 seconds."),
  mixedPara("P2.3 — Face Recognition Verification: ", "Activates the webcam and captures a live facial image. Processes the image through Face-api.js SSD MobileNet v1 model for face detection. Extracts 68 facial landmark points for geometric alignment. Computes the 128-dimensional facial descriptor vector. Applies threshold of 0.65 for authentication decision."),

  ...imagePlaceholder("Fig. 4.2.3", "Level 2 DFD — Authentication Sub-process (P2.1, P2.2, P2.3)"),

  h2("4.3 UML Diagrams"),
  bodyPara("UML stands for Unified Modeling Language. UML is a standardized general-purpose modeling language in the field of object-oriented software engineering. The standard is managed and was created by the Object Management Group. The goal is for UML to become a common language for creating models of object-oriented computer software."),
  bodyPara("The Unified Modeling Language is a standard language for specifying, visualization, constructing and documenting the artifacts of software systems, as well as for business modeling and other non-software systems. The UML represents a collection of best engineering practices that have proven successful in the modeling of large and complex systems."),
  bodyPara("The primary goals in the design of the UML are to provide users a ready-to-use, expressive visual modeling language so that they can develop and exchange meaningful models, to provide extendibility and specialization mechanisms to extend the core concepts, to be independent of particular programming languages and development process, and to support higher-level development concepts such as collaborations, frameworks, patterns and components."),

  h3("4.3.1 Use Case Diagram"),
  bodyPara("A use case diagram is a type of behavioral diagram created from a use-case analysis. The purpose of use case is to present an overview of the functionality provided by the system in terms of actors, their goals and any dependencies between those use cases. In the proposed system, two primary actors are identified — Voter and Admin — along with their interactions with the system."),
  mixedPara("Voter Use Cases: ", "Connect Wallet, Verify Face, Submit OTP, Cast Encrypted Vote, View Vote Confirmation, Request Gas Funds, and Update Contact Information."),
  mixedPara("Admin Use Cases: ", "Generate Election Keys, Register Voter, Add Candidate, Set Election Dates, View/Reset Candidates, Reset Voters, Distribute Key Shares, Enter Tally Shares, View Election Results, Operate Booth Mode, Transfer Contract Ownership, and Fund Voter Wallets."),

  ...imagePlaceholder("Fig. 4.3.1", "Use Case Diagram — Voter and Admin Interactions"),

  h3("4.3.2 Sequence Diagram"),
  bodyPara("The Sequence diagram illustrates the temporal flow of the complete voting process, showing the order of message exchanges between the Voter, Frontend, MetaMask, Backend, OTP Service, Face-api.js, JSEncrypt, and Smart Contract objects:"),
  numberedPara(1, "Voter → MetaMask: Request wallet connection (ethereum.request({method: 'eth_requestAccounts'}))"),
  numberedPara(2, "MetaMask → Frontend: Return connected wallet address (0x...)"),
  numberedPara(3, "Frontend → Backend: GET /voter/{address} — check registration status"),
  numberedPara(4, "Backend → Frontend: Return voter data (name, email, mobile, face descriptor)"),
  numberedPara(5, "Frontend → Face-api.js: detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()"),
  numberedPara(6, "Face-api.js → Frontend: Return 128-dimensional descriptor with confidence score"),
  numberedPara(7, "Frontend → Frontend: Compute Euclidean distance between live and stored descriptors"),
  numberedPara(8, "Frontend → OTP Service: POST /send-otp (email) and POST /send-sms (mobile)"),
  numberedPara(9, "OTP Service → Voter: Deliver 6-digit OTPs via Email and SMS channels"),
  numberedPara(10, "Voter → Frontend: Enter received OTP codes"),
  numberedPara(11, "Frontend → OTP Service: POST /verify-dual-otp — validate both codes"),
  numberedPara(12, "Frontend → Smart Contract: Read electionPublicKey state variable"),
  numberedPara(13, "Frontend → JSEncrypt: encrypt(candidateId.toString(), publicKey) — RSA-2048"),
  numberedPara(14, "Frontend → Smart Contract: vote(encryptedBallot) via MetaMask transaction"),
  numberedPara(15, "Smart Contract → Blockchain: Store encrypted vote, emit VoteCast event, set hasVoted = true"),
  numberedPara(16, "Blockchain → Frontend: Return transaction receipt with hash and block number"),

  ...imagePlaceholder("Fig. 4.3.2", "Sequence Diagram — Complete Voting Process Flow"),

  h3("4.3.3 Class Diagram"),
  bodyPara("The Class diagram models the key entities in the system, their attributes, and the relationships between them. Private visibility hides information from anything outside the class partition. Public visibility allows all other classes to view the marked information."),
  mixedPara("Voter (Struct): ", "Attributes — isRegistered: bool, hasVoted: bool, encryptedVote: string, faceHash: bytes32. Associated with one Wallet Address (address type), submits one EncryptedBallot."),
  mixedPara("Candidate (Struct): ", "Attributes — id: uint256, name: string, voteCount: uint256. Receives multiple EncryptedBallots after decryption during tallying."),
  mixedPara("VotingContract: ", "Attributes — owner: address, electionPublicKey: string, isElectionOpen: bool, voters: mapping(address => Voter), candidates: Candidate[]. Methods — registerVoter(), vote(), boothVote(), addCandidate(), getCandidates(), setElectionPublicKey(), closeElection(), transferOwnership(). Modifier — onlyOwner."),
  mixedPara("OTPService: ", "Attributes — otpStorage: Map<string, {otp, expiry}>. Methods — generateOTP(), sendEmail(), sendSMS(), verifyDualOTP()."),
  mixedPara("BackendServer: ", "Attributes — database: SQLite3. Methods — registerVoter(), getVoter(), addCandidate(), getCandidates(), updateVoter(), faucet()."),

  ...imagePlaceholder("Fig. 4.3.3", "Class Diagram — System Entities and Relationships"),

  h3("4.3.4 Collaboration Diagram"),
  bodyPara("The Collaboration diagram shows the structural organization of objects that interact during the vote casting process. In a collaboration diagram, the method call sequence is indicated by numbering technique, showing how methods are called one after another. The difference from a sequence diagram is that the collaboration diagram shows the object organization."),
  bodyPara("The Frontend component (central node) collaborates with: MetaMask (1: requestAccounts, 2: signTransaction) for wallet interaction; Face-api.js (3: detectFace, 4: getDescriptor) for biometric processing; Backend Server (5: getVoter, 6: returnData) for voter data retrieval; OTP Service (7: sendOTP, 8: verifyOTP) for dual-channel verification; JSEncrypt (9: setPublicKey, 10: encrypt) for ballot encryption; and Smart Contract (11: vote, 12: confirmTx) for blockchain transaction submission. The Backend Server additionally collaborates with SQLite Database (5a: query, 5b: result) for data persistence."),

  ...imagePlaceholder("Fig. 4.3.4", "Collaboration Diagram — Object Interactions During Vote Casting"),

  h3("4.3.5 Activity Diagram"),
  bodyPara("The Activity diagram models the complete voting workflow with decision points and parallel activities:"),
  bodyPara("Start → Connect MetaMask Wallet → [Decision: Wallet Connected?] → No: Show MetaMask Install Prompt / Yes: Proceed → Send Wallet Address to Backend → [Decision: Registered?] → No: Show 'Not Registered' Error → End / Yes: Proceed → Activate Webcam → Capture Face Image → Extract 128-D Descriptor → Compare with Stored Descriptor → [Decision: Distance < 0.65?] → No: Show 'Face Mismatch' Error / Yes: Face Verified → Send Dual OTP (Email + SMS) → Enter Both OTP Codes → [Decision: Both OTPs Valid?] → No: Show 'Invalid OTP' Error / Yes: Fully Authenticated → Display Candidate List → Select Candidate → Encrypt Vote (RSA-2048) → Submit to Blockchain via MetaMask → [Decision: Transaction Confirmed?] → No: Show 'Transaction Failed' Error / Yes: Show Success Receipt → End."),
  bodyPara("Parallel Activity: Anti-Coercion Monitor Fork — starts after Face Verification and runs continuously during OTP entry and vote casting. The monitor checks webcam every 1 second for multiple faces, unrecognized faces, or face absence. If a violation persists for more than 5 seconds, the booth lockout is triggered (1-minute or 3-minute depending on violation type). The parallel activity joins back at the End node when voting is complete."),

  ...imagePlaceholder("Fig. 4.3.5", "Activity Diagram — Complete Voting Workflow with Parallel Anti-Coercion Monitoring"),

  // ************************************************************
  // PART 4: CHAPTER 5 (SYSTEM CODING & TESTING)
  // ************************************************************

  // ============================================================
  // CHAPTER 5 DIVIDER
  // ============================================================
  ...chapterDivider("5", "SYSTEM CODING & TESTING"),
  pgBreak(),

  h1("Chapter 5"),
  h1("System Coding & Testing"),

  h2("5.1 Introduction"),
  bodyPara("System coding refers to the process of developing software that interacts closely with the underlying hardware and operating system. This type of programming is concerned with creating applications, utilities, drivers, or components that directly interface with system resources such as memory, CPU, storage devices, network interfaces, and other hardware components. System coding is crucial for building low-level software components, operating systems, device drivers, embedded systems, and other software that requires intimate knowledge of hardware and system-level functionalities."),
  bodyPara("This chapter describes the implementation details of the AI-integrated decentralized e-voting system. It covers the technologies and frameworks used, provides sample code from key modules of the system, and discusses the software testing techniques and strategies employed to ensure system reliability, security, and correctness. The system was implemented as a multi-service architecture with five concurrent components communicating through well-defined API endpoints and blockchain interactions."),

  h2("5.2 Implementation"),
  bodyPara("The system was implemented as a multi-service architecture with the following components running concurrently:"),
  mixedPara("1. Hardhat Ethereum Node: ", "Local blockchain environment running on port 8545, providing 20 pre-funded test accounts with 10,000 ETH each for development and testing. For production deployment, the system connects to the Ethereum Sepolia testnet via Alchemy RPC endpoint. The Voting.sol smart contract is compiled using Solidity compiler version 0.8.28 and deployed using a Hardhat deployment script."),
  mixedPara("2. Backend Node.js Server (Port 5000): ", "Express.js server managing voter CRUD operations through RESTful API endpoints. The server uses SQLite3 database for persistent storage of voter records including name, wallet address, mobile number, email, date of birth, face descriptor (128-dimensional Float32Array), and faceHash."),
  mixedPara("3. OTP Service (Port 4000): ", "Dedicated Express.js microservice handling dual-channel One-Time Password generation and verification. Email OTP delivery uses Nodemailer with Gmail SMTP transport. SMS OTP delivery uses the Twilio SDK. OTP codes are 6-digit random numbers with 300-second expiry."),
  mixedPara("4. Python FastAPI Server (Port 8000): ", "Handles server-side face verification using OpenCV (cv2) Haar cascade classifiers and histogram comparison. Provides /verify-face endpoint for comparing uploaded face images against stored reference images."),
  mixedPara("5. Next.js Frontend (Port 3000): ", "React-based decentralized application (DApp) with client-side AI processing using Face-api.js (SSD MobileNet v1, face landmark 68-point model, face recognition net), client-side RSA-2048 encryption using JSEncrypt, and blockchain interactions via ethers.js through the MetaMask browser extension provider."),

  h2("5.3 About Python"),
  bodyPara("Python is currently the most widely used multi-purpose, high-level programming language. Python allows programming in Object-Oriented and Procedural paradigms. Python programs generally are smaller than other programming languages like Java. Programmers have to type relatively less and the indentation requirement of the language makes programs readable all the time. Python language is being used by almost all tech-giant companies like Google, Amazon, Facebook, Instagram, Dropbox, Uber and many more."),
  bodyPara("In this project, Python is used for the AI processing backend server built with FastAPI framework. The server handles face verification using OpenCV computer vision library and provides RESTful API endpoints for the frontend to perform server-side image processing when needed."),
  mixedPara("1. Extensive Libraries: ", "Python downloads with an extensive library containing code for various purposes like regular expressions, documentation-generation, unit-testing, web browsers, threading, databases, CGI, email, image manipulation, and more."),
  mixedPara("2. Extensible: ", "Python can be extended to other languages. You can write some of your code in languages like C++ or C, which comes in handy in projects that require high-performance computing."),
  mixedPara("3. Embeddable: ", "Python is embeddable as well. You can put your Python code in your source code of a different language, like C++, to add scripting capabilities to your code."),
  mixedPara("4. Improved Productivity: ", "The language's simplicity and extensive libraries render programmers more productive than languages like Java and C++."),
  mixedPara("5. Simple and Easy: ", "Python is easy to learn, understand, and code. A simple print statement will do what other languages need a full class definition for."),
  mixedPara("6. Readable: ", "Reading Python is much like reading English. It does not need curly braces to define blocks, and indentation is mandatory, further aiding readability."),
  mixedPara("7. Object-Oriented: ", "Python supports both procedural and object-oriented programming paradigms. Classes and objects let us model the real world."),
  mixedPara("8. Free and Open-Source: ", "Python is freely available. You can download Python for free, download its source code, make changes to it, and even distribute it."),
  mixedPara("9. Portable: ", "Python follows Write Once Run Anywhere (WORA) philosophy. You need to code only once, and you can run it anywhere."),
  mixedPara("10. Interpreted: ", "Python is an interpreted language. Since statements are executed one by one, debugging is easier than in compiled languages."),
  bodyPara("Python was conceptualized in the late 1980s by Guido van Rossum at the CWI (Centrum Wiskunde & Informatica). Python 2.0 was released on October 16, 2000, with major new features including a full garbage collector and support for Unicode. Python 3.0 was released on December 3, 2008 as a major revision of the language. The latest stable version as of 2024 is Python 3.12, which includes performance improvements, better error messages, and enhanced type annotation support."),

  h2("5.4 Sample Code"),

  h3("5.4.1 Smart Contract — Voting.sol"),
  bodyPara("The following Solidity smart contract implements the core on-chain voting logic including voter registration, encrypted ballot storage, candidate management, and election state management:"),

  ...codeBlock([
    "// SPDX-License-Identifier: MIT",
    "pragma solidity ^0.8.28;",
    "",
    "contract Voting {",
    "    struct Candidate {",
    "        uint256 id;",
    "        string name;",
    "        uint256 voteCount;",
    "    }",
    "    struct Voter {",
    "        bool isRegistered;",
    "        bool hasVoted;",
    "        string encryptedVote;",
    "        bytes32 faceHash;",
    "    }",
    "    address public owner;",
    "    string public electionPublicKey;",
    "    bool public isElectionOpen = true;",
    "    mapping(address => Voter) public voters;",
    "    Candidate[] public candidates;",
    "",
    "    event VoterRegistered(address voter);",
    "    event VoteCast(address voter);",
    "    event CandidateAdded(uint256 id, string name);",
    "",
    "    modifier onlyOwner() {",
    "        require(msg.sender == owner, \"Only owner\");",
    "        _;",
    "    }",
    "    constructor() { owner = msg.sender; }",
    "",
    "    function registerVoter(address _v, bytes32 _fh)",
    "        external onlyOwner {",
    "        require(!voters[_v].isRegistered,",
    "            \"Already registered\");",
    "        voters[_v].isRegistered = true;",
    "        voters[_v].faceHash = _fh;",
    "        emit VoterRegistered(_v);",
    "    }",
    "    function vote(string memory _enc) external {",
    "        require(voters[msg.sender].isRegistered,",
    "            \"Not registered\");",
    "        require(!voters[msg.sender].hasVoted,",
    "            \"Already voted\");",
    "        require(isElectionOpen, \"Election closed\");",
    "        voters[msg.sender].hasVoted = true;",
    "        voters[msg.sender].encryptedVote = _enc;",
    "        emit VoteCast(msg.sender);",
    "    }",
    "    function addCandidate(string memory _name)",
    "        external onlyOwner {",
    "        candidates.push(Candidate(",
    "            candidates.length, _name, 0));",
    "        emit CandidateAdded(",
    "            candidates.length - 1, _name);",
    "    }",
    "    function getCandidates() external view",
    "        returns (Candidate[] memory) {",
    "        return candidates;",
    "    }",
    "    function setElectionPublicKey(",
    "        string memory _key) external onlyOwner {",
    "        electionPublicKey = _key;",
    "    }",
    "    function closeElection() external onlyOwner {",
    "        isElectionOpen = false;",
    "    }",
    "}",
  ]),

  h3("5.4.2 Backend Server — server.js (Node.js/Express)"),
  bodyPara("The following Node.js/Express backend server manages voter data storage in SQLite and provides RESTful API endpoints for the frontend:"),

  ...codeBlock([
    "const express = require('express');",
    "const cors = require('cors');",
    "const sqlite3 = require('sqlite3');",
    "const { ethers } = require('ethers');",
    "const app = express();",
    "app.use(cors());",
    "app.use(express.json({limit: '50mb'}));",
    "const db = new sqlite3.Database('./voting_app.db');",
    "",
    "// Create voters table",
    "db.run(`CREATE TABLE IF NOT EXISTS voters (",
    "    id INTEGER PRIMARY KEY AUTOINCREMENT,",
    "    name TEXT, address TEXT UNIQUE,",
    "    mobile TEXT, email TEXT, dob TEXT,",
    "    face_descriptor TEXT, faceHash TEXT",
    ")`);",
    "",
    "// GET voter by wallet address",
    "app.get('/voter/:address', (req, res) => {",
    "    db.get('SELECT * FROM voters WHERE address = ?',",
    "        [req.params.address], (err, row) => {",
    "        if (err) return res.status(500)",
    "            .json({error: err.message});",
    "        if (!row) return res.status(404)",
    "            .json({error: 'Voter not found'});",
    "        res.json(row);",
    "    });",
    "});",
    "",
    "// POST register new voter",
    "app.post('/register', (req, res) => {",
    "    const { name, address, mobile, email,",
    "        dob, face_descriptor, faceHash } = req.body;",
    "    db.run(`INSERT INTO voters",
    "        (name, address, mobile, email, dob,",
    "         face_descriptor, faceHash)",
    "        VALUES (?,?,?,?,?,?,?)`,",
    "        [name, address, mobile, email, dob,",
    "         JSON.stringify(face_descriptor), faceHash],",
    "        function(err) {",
    "            if (err) return res.status(500)",
    "                .json({error: err.message});",
    "            res.json({ id: this.lastID,",
    "                message: 'Voter registered' });",
    "    });",
    "});",
    "",
    "app.listen(5000, () =>",
    "    console.log('Backend running on port 5000'));",
  ]),

  h3("5.4.3 Frontend — Vote Casting with RSA Encryption"),
  bodyPara("The following React component implements client-side RSA-2048 vote encryption and blockchain submission:"),

  ...codeBlock([
    "import { useState, useEffect } from 'react';",
    "import { ethers } from 'ethers';",
    "import JSEncrypt from 'jsencrypt';",
    "",
    "const VotingPage = ({ contract, account }) => {",
    "    const [candidates, setCandidates] = useState([]);",
    "    const [voting, setVoting] = useState(false);",
    "",
    "    useEffect(() => { loadCandidates(); }, []);",
    "",
    "    const loadCandidates = async () => {",
    "        const list = await contract.getCandidates();",
    "        setCandidates(list.map((c, i) => ({",
    "            id: i, name: c.name,",
    "            voteCount: c.voteCount.toString()",
    "        })));",
    "    };",
    "",
    "    const castVote = async (candidateId) => {",
    "        setVoting(true);",
    "        try {",
    "            const publicKey = await contract",
    "                .electionPublicKey();",
    "            // RSA-2048 client-side encryption",
    "            const encryptor = new JSEncrypt();",
    "            encryptor.setPublicKey(publicKey);",
    "            const encryptedVote = encryptor",
    "                .encrypt(candidateId.toString());",
    "            if (!encryptedVote) throw new Error(",
    "                'Encryption failed');",
    "            // Submit to blockchain via MetaMask",
    "            const tx = await contract",
    "                .vote(encryptedVote);",
    "            const receipt = await tx.wait();",
    "            alert('Vote cast! TX: ' + receipt.hash);",
    "        } catch (err) {",
    "            alert('Error: ' + err.message);",
    "        }",
    "        setVoting(false);",
    "    };",
    "    return ( <div className=\"voting-container\">",
    "        <h2>Cast Your Vote</h2>",
    "        {candidates.map(c => (",
    "            <div key={c.id} className=\"candidate-card\">",
    "                <h3>{c.name}</h3>",
    "                <button onClick={() => castVote(c.id)}",
    "                    disabled={voting}>",
    "                    {voting ? 'Voting...' : 'Vote'}",
    "                </button>",
    "            </div>",
    "        ))}",
    "    </div> );",
    "};",
    "export default VotingPage;",
  ]),

  h3("5.4.4 Shamir's Secret Sharing — Key Distribution"),
  bodyPara("The following JavaScript module implements RSA-2048 key pair generation and Shamir's Secret Sharing for election key management:"),

  ...codeBlock([
    "const secrets = require('secrets.js-grempe');",
    "",
    "// Generate RSA-2048 Key Pair",
    "const generateElectionKeys = () => {",
    "    const JSEncrypt = require('node-jsencrypt');",
    "    const crypt = new JSEncrypt({ default_key_size: 2048 });",
    "    crypt.getKey();",
    "    const publicKey = crypt.getPublicKey();",
    "    const privateKey = crypt.getPrivateKey();",
    "",
    "    // Split private key into 5 shares",
    "    // with threshold of 3",
    "    const hexKey = secrets.str2hex(privateKey);",
    "    const shares = secrets.share(hexKey, 5, 3);",
    "",
    "    console.log('Public Key:', publicKey);",
    "    shares.forEach((s, i) =>",
    "        console.log('Share ' + (i+1) + ': '",
    "            + s.substring(0, 20) + '...'));",
    "    return { publicKey, shares };",
    "};",
    "",
    "// Reconstruction during tally",
    "// (need at least 3 of 5 shares)",
    "const reconstructKey = (shares) => {",
    "    if (shares.length < 3) {",
    "        throw new Error('Need at least 3 shares');",
    "    }",
    "    const combined = secrets.combine(",
    "        shares.slice(0, 3));",
    "    const recovered = secrets.hex2str(combined);",
    "    return recovered;",
    "};",
  ]),

  h3("5.4.5 Face Recognition — Euclidean Distance Verification"),
  bodyPara("The following JavaScript module implements face detection and Euclidean distance-based identity verification using Face-api.js:"),

  ...codeBlock([
    "import * as faceapi from 'face-api.js';",
    "",
    "// Load Face-api.js models",
    "const loadModels = async () => {",
    "    const MODEL_URL = '/models';",
    "    await faceapi.nets.ssdMobilenetv1",
    "        .loadFromUri(MODEL_URL);",
    "    await faceapi.nets.faceLandmark68Net",
    "        .loadFromUri(MODEL_URL);",
    "    await faceapi.nets.faceRecognitionNet",
    "        .loadFromUri(MODEL_URL);",
    "};",
    "",
    "// Extract 128-D descriptor from image element",
    "const getDescriptor = async (imgElement) => {",
    "    const detection = await faceapi",
    "        .detectSingleFace(imgElement)",
    "        .withFaceLandmarks()",
    "        .withFaceDescriptor();",
    "    if (!detection) {",
    "        throw new Error('No face detected');",
    "    }",
    "    return detection.descriptor;",
    "    // Returns Float32Array of 128 values",
    "};",
    "",
    "// Compare two face descriptors",
    "const verifyFace = (liveDesc, storedDesc) => {",
    "    const stored = new Float32Array(",
    "        JSON.parse(storedDesc));",
    "    const distance = faceapi",
    "        .euclideanDistance(liveDesc, stored);",
    "    // 0.65 for authentication; 0.45 anti-coercion",
    "    if (distance < 0.65) {",
    "        return { match: true, distance };",
    "    }",
    "    return { match: false, distance };",
    "};",
  ]),

  h3("5.4.6 OTP Service — Dual Channel Verification"),
  bodyPara("The following Express.js microservice implements dual-channel OTP generation, delivery via Email (Nodemailer) and SMS (Twilio), and verification:"),

  ...codeBlock([
    "const express = require('express');",
    "const nodemailer = require('nodemailer');",
    "const twilio = require('twilio');",
    "const app = express();",
    "app.use(express.json());",
    "const otpStore = {};",
    "",
    "// Generate 6-digit OTP",
    "const generateOTP = () =>",
    "    Math.floor(100000 + Math.random() * 900000)",
    "        .toString();",
    "",
    "// Send Email OTP via Nodemailer",
    "app.post('/send-otp', async (req, res) => {",
    "    const { email } = req.body;",
    "    const otp = generateOTP();",
    "    otpStore[email] = {",
    "        otp, expiry: Date.now() + 300000",
    "    };",
    "    const transporter = nodemailer.createTransport({",
    "        service: 'gmail',",
    "        auth: { user: process.env.EMAIL_USER,",
    "                pass: process.env.EMAIL_PASS }",
    "    });",
    "    await transporter.sendMail({",
    "        from: '\"E-Voting System\"',",
    "        to: email,",
    "        subject: 'Voting Verification Code',",
    "        html: '<h2>Your OTP: ' + otp + '</h2>'",
    "            + '<p>Expires in 5 minutes</p>'",
    "    });",
    "    res.json({ message: 'OTP sent to email' });",
    "});",
    "",
    "// Verify both OTP channels",
    "app.post('/verify-dual-otp', (req, res) => {",
    "    const { email, emailOtp, smsOtp, mobile }",
    "        = req.body;",
    "    const emailRec = otpStore[email];",
    "    const smsRec = otpStore['sms_' + mobile];",
    "    if (!emailRec || !smsRec)",
    "        return res.status(400)",
    "            .json({ error: 'OTP not found' });",
    "    if (Date.now() > emailRec.expiry)",
    "        return res.status(400)",
    "            .json({ error: 'OTP expired' });",
    "    if (emailRec.otp !== emailOtp",
    "        || smsRec.otp !== smsOtp)",
    "        return res.status(400)",
    "            .json({ error: 'Invalid OTP' });",
    "    delete otpStore[email];",
    "    delete otpStore['sms_' + mobile];",
    "    res.json({ verified: true });",
    "});",
    "app.listen(4000, () =>",
    "    console.log('OTP Service on port 4000'));",
  ]),

  h3("5.4.7 Anti-Coercion Monitoring"),
  bodyPara("The following JavaScript module implements continuous real-time anti-coercion monitoring with tiered lockout system:"),

  ...codeBlock([
    "// Continuous monitoring every 1 second",
    "const startAntiCoercionMonitor = (",
    "    videoElement, verifiedDescriptor",
    ") => {",
    "    const monitorInterval = setInterval(",
    "        async () => {",
    "        const detections = await faceapi",
    "            .detectAllFaces(videoElement)",
    "            .withFaceLandmarks()",
    "            .withFaceDescriptors();",
    "",
    "        // Rule 1: Multiple faces = Coercion",
    "        if (detections.length > 1) {",
    "            handleViolation('multiple_faces');",
    "            return;",
    "        }",
    "        // Rule 2: Wrong person = Identity shift",
    "        if (detections.length === 1) {",
    "            const dist = faceapi.euclideanDistance(",
    "                detections[0].descriptor,",
    "                verifiedDescriptor);",
    "            if (dist > 0.45) {",
    "                handleViolation('unrecognized');",
    "                return;",
    "            }",
    "        }",
    "        // Rule 3: No face = Voter absent",
    "        if (detections.length === 0) {",
    "            handleViolation('face_absent');",
    "            return;",
    "        }",
    "        clearViolation();",
    "    }, 1000);",
    "    return monitorInterval;",
    "};",
    "",
    "// 5-second grace period, then lockout",
    "let violationStart = null;",
    "const GRACE_PERIOD = 5000;",
    "",
    "const handleViolation = (type) => {",
    "    if (!violationStart) {",
    "        violationStart = Date.now();",
    "        return;",
    "    }",
    "    if (Date.now() - violationStart > GRACE_PERIOD) {",
    "        triggerLockout(type);",
    "    }",
    "};",
    "const triggerLockout = (type) => {",
    "    const duration = type === 'multiple_faces'",
    "        ? 180000  // 3 minutes",
    "        : 60000;  // 1 minute",
    "    showPrivacyShield(type, duration);",
    "    disableVotingInterface();",
    "    setTimeout(() => {",
    "        hidePrivacyShield();",
    "        enableVotingInterface();",
    "    }, duration);",
    "};",
  ]),

  h2("5.5 Software Testing Techniques"),

  h3("5.5.1 Unit Testing"),
  bodyPara("In software testing, unit testing mainly focuses on verification effort on the smallest unit of program or software design — the module. In unit testing, the procedural or functional design provides a detailed description as a guide, focal the control paths are tested to uncover errors occurred in the designed software within the boundaries of the module."),
  bodyPara("Individual modules of the proposed system were tested in isolation. Smart contract functions (registerVoter, vote, boothVote, addCandidate, setElectionPublicKey, closeElection) were tested using Hardhat's testing framework with Mocha and Chai assertion libraries. Backend API endpoints were tested using HTTP client tools (Postman and automated test scripts). Face recognition accuracy was validated against the LFW benchmark dataset with 400 verification pairs."),

  h3("5.5.2 Integration Testing"),
  bodyPara("Integration testing is a systematic product module integration technique which constructs the program structure and examines data flow between modules. While conducting integration testing it requires to uncover errors associated with various interfaces. The main objective is to take unit tested methods and activities to build a program structure that has been dictated by design."),
  bodyPara("Integration testing of the proposed system verified the interaction between all modules. End-to-end flows were tested including: wallet connection → face verification → OTP verification → vote casting → blockchain confirmation. Cross-service communication between the Next.js frontend (port 3000), Node.js backend (port 5000), OTP service (port 4000), Python AI server (port 8000), and Ethereum smart contract was verified for correct data flow and error propagation."),

  h3("5.5.3 Validation Testing"),
  bodyPara("Validation Testing is integration testing for software which is completely assembled as a package. The validation testing can be defined as successful testing process where the software functions in the manner reasonably expected by the customer. It is mainly performed at the end approach of the user needs."),
  bodyPara("Each feature was validated against the specified requirements: voter registration with face capture and blockchain recording, three-factor authentication pipeline with all three factors verified independently, encrypted vote casting with RSA-2048 and blockchain storage, anti-coercion detection with simulated coercion scenarios, booth mode voting with VVPAT receipt generation, and result tallying with SSS key reconstruction from 3 of 5 shares."),

  h2("5.6 Software Testing Strategies"),

  h3("5.6.1 Black Box Testing"),
  bodyPara("A strategy for software testing integrates software test cases into a series of well-planned steps that result in the successful construction of software. Verification refers to the set of activities that ensure that the software correctly implements a specific function. Validation refers to the set of activities that ensure that the software that has been built is traceable to customer requirements."),
  bodyPara("The system was tested from an external perspective without knowledge of internal implementation. Test cases included: valid voter registration with complete data, duplicate voter detection, invalid OTP rejection with wrong codes, face mismatch rejection with different person's face, double voting prevention, and unauthorized admin access prevention."),

  h3("5.6.2 White Box Testing"),
  bodyPara("Internal code paths were tested thoroughly with knowledge of the implementation. Smart contract edge cases including gas estimation for vote transactions, revert conditions when require statements fail, event emissions for VoterRegistered and VoteCast events, and state variable updates were verified. Frontend state management flows, error handling paths, and edge cases in face recognition (no face detected, multiple faces, low confidence detection) were tested."),

  h3("5.6.3 Security Testing"),
  bodyPara("The system was tested against six attack categories identified during the threat analysis phase:"),
  mixedPara("Replay Attacks: ", "OTP codes expire after 300 seconds and are deleted from storage after successful verification, preventing reuse of intercepted OTP codes."),
  mixedPara("Sybil Attacks: ", "The smart contract enforces one-vote-per-wallet through the hasVoted boolean flag. Voter registration requires admin authorization through the onlyOwner modifier."),
  mixedPara("Man-in-the-Middle Attacks: ", "Client-side RSA-2048 encryption ensures that plaintext votes never traverse the network. Even if network traffic is intercepted, only encrypted ciphertext is visible."),
  mixedPara("Coercion Attacks: ", "AI-based anti-coercion monitoring with Face-api.js detects multiple faces and triggers booth lockout within 5 seconds."),
  mixedPara("Spoofing Attacks: ", "Euclidean distance threshold of 0.45 (strict mode) prevents impersonation even with similar-looking individuals."),
  mixedPara("Key Compromise Attacks: ", "SSS 3-of-5 threshold requirement means that compromising 1 or 2 key share holders is insufficient for key reconstruction."),

  h3("5.6.4 Test Cases"),
  new Paragraph({ spacing: { before: 180, after: 60 }, children: [] }),
  makeTable(
    ["S.No.", "Test Case", "Input", "Expected Result", "Status"],
    [
      ["1", "Voter Registration", "Name, address, face image, mobile, email", "Voter registered on blockchain", "Pass"],
      ["2", "Duplicate Registration", "Same wallet address", "Error: Already registered", "Pass"],
      ["3", "Wallet Verification", "Valid MetaMask address", "Wallet verified in registry", "Pass"],
      ["4", "Face Recognition", "Live face image", "Match with stored descriptor", "Pass"],
      ["5", "Face Mismatch", "Different person's face", "Error: Face not matched", "Pass"],
      ["6", "Email OTP", "Valid email address", "6-digit OTP sent to email", "Pass"],
      ["7", "SMS OTP", "Valid mobile number", "6-digit OTP sent via SMS", "Pass"],
      ["8", "Invalid OTP", "Wrong OTP codes", "Error: Invalid OTP", "Pass"],
      ["9", "Expired OTP", "OTP after 5 minutes", "Error: OTP expired", "Pass"],
      ["10", "Vote Casting", "Select candidate", "Encrypted vote on blockchain", "Pass"],
      ["11", "Double Voting", "Vote again after voting", "Error: Already voted", "Pass"],
      ["12", "Anti-Coercion", "Multiple faces in frame", "Booth lockout triggered", "Pass"],
      ["13", "Booth Mode Vote", "Admin verifies walk-in voter", "VVPAT receipt displayed", "Pass"],
      ["14", "Result Tallying", "3 of 5 SSS key shares", "Decrypted vote counts", "Pass"],
      ["15", "Unauthorized Admin", "Non-owner calls admin function", "Transaction reverted", "Pass"],
    ],
    [500, 1400, 2000, 2200, 700]
  ),
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { before: 60, after: 240 },
    children: [new TextRun({ text: "Table 5.1: Test Case Results", font: TNR, size: BODY_SIZE, bold: true })]
  }),

  // ************************************************************
  // PART 5: CHAPTER 6 (RESULTS), CHAPTER 7, REFERENCES, INDEX, PUBLICATION
  // ************************************************************

  // ============================================================
  // CHAPTER 6 DIVIDER
  // ============================================================
  ...chapterDivider("6", "RESULTS"),
  pgBreak(),

  h1("Chapter 6"),
  h1("Results"),

  h2("6.1 Introduction"),
  bodyPara("Software results refer to the outcomes or outputs generated by software applications or systems. These results can vary widely depending on the purpose and functionality of the software, and they play a crucial role in determining the effectiveness and success of the software in meeting its intended objectives. Software results encompass the outcomes, outputs, and overall performance of software applications or systems. They are evaluated based on factors such as functionality, accuracy, performance, user experience, scalability, interoperability, security, and maintainability."),
  bodyPara("This chapter presents the experimental results and output screens of the AI-integrated decentralized e-voting system. The system was evaluated using real-world benchmark datasets including the Labeled Faces in the Wild (LFW) dataset for face recognition, the CelebA-Spoof dataset for anti-spoofing, and 130 controlled video recordings for coercion detection. Performance metrics including precision, recall, F1-score, and accuracy are reported for each biometric module."),

  h3("6.1.1 Biometric Performance Results"),
  new Paragraph({ spacing: { before: 180, after: 60 }, children: [] }),
  makeTable(
    ["Module", "Precision", "Recall", "F1-Score", "Accuracy"],
    [
      ["Face Recognition", "92.1%", "89.0%", "90.4%", "91.0%"],
      ["Anti-Spoofing", "96.0%", "98.0%", "97.0%", "97.0%"],
      ["Coercion Detection", "95.7%", "94.6%", "94.5%", "98.0%"],
    ],
    [2800, 1400, 1400, 1400, 1500]
  ),
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { before: 60, after: 240 },
    children: [new TextRun({ text: "Table 6.1: Performance Metrics of Biometric Modules", font: TNR, size: BODY_SIZE, bold: true })]
  }),

  h3("6.1.2 Blockchain Performance"),
  bodyPara("Transaction latency was measured for 100 concurrent vote submissions on the Ethereum network. The average transaction confirmation time was 4.8 seconds during peak load. Client-side RSA-2048 encryption time averaged 42 milliseconds. Gas consumption was approximately 45,000 gas units per vote transaction, making the system cost-effective for organizational elections."),

  h2("6.2 Output Screens"),
  bodyPara("The following output screens demonstrate the key interfaces and functionalities of the implemented system:"),

  ...imagePlaceholder("Fig. 6.2.1", "Welcome / Home Page — System title with Connect MetaMask button and feature badges"),
  ...imagePlaceholder("Fig. 6.2.2", "Admin Dashboard — Tabbed interface with Setup, Candidates, Register, Results, Faucet, and Booth tabs"),
  ...imagePlaceholder("Fig. 6.2.3", "Voter Registration — Form with webcam preview for face capture and blockchain registration"),
  ...imagePlaceholder("Fig. 6.2.4", "Add Candidate — Candidate management interface with MetaMask transaction confirmation"),
  ...imagePlaceholder("Fig. 6.2.5", "Election Key Setup — RSA-2048 key generation with Shamir's Secret Sharing output showing 5 key shares"),
  ...imagePlaceholder("Fig. 6.2.6", "Voter Authentication — 4-step progress bar: Wallet → Face → OTP → Vote with live face scan"),
  ...imagePlaceholder("Fig. 6.2.7", "Vote Casting — Candidate list with live webcam monitor PIP and MetaMask transaction popup"),
  ...imagePlaceholder("Fig. 6.2.8", "Anti-Coercion Alert — Full-screen privacy shield with MULTIPLE FACES DETECTED warning and lockout timer"),
  ...imagePlaceholder("Fig. 6.2.9", "Election Results — SSS key share input fields, decrypted vote tallies with percentage bars and statistics"),
  ...imagePlaceholder("Fig. 6.2.10", "OTP Email Verification — Professional HTML email template with 6-digit verification code and expiry timer"),

  // ============================================================
  // CHAPTER 7 DIVIDER
  // ============================================================
  ...chapterDivider("7", "CONCLUSION & FUTURE ENHANCEMENTS"),
  pgBreak(),

  h1("Chapter 7"),
  h1("Conclusion & Future Enhancements"),

  h2("7.1 Conclusion"),
  bodyPara("This project successfully designed, developed, and tested an AI-integrated decentralized e-voting system that addresses the critical limitations of existing electronic voting systems. The system integrates Ethereum blockchain technology, three-factor authentication, RSA-2048 ballot encryption, Shamir's Secret Sharing for decentralized key management, and real-time AI-based anti-coercion monitoring into a comprehensive and cohesive architecture."),
  bodyPara("Blockchain and smart contracts ensure that once a vote is cast, it is permanent and tamper-proof, eliminating the possibility of manual manipulation or lost ballots. By replacing a single central authority with a distributed network, the framework significantly reduces the risk of systemic fraud and enhances public confidence through end-to-end verifiability. Automated execution through smart contracts streamlines the registration, voting, and tallying processes, providing real-time results while reducing administrative costs."),
  bodyPara("The experimental evaluation using real-world benchmark datasets demonstrates the system's effectiveness and reliability:"),
  mixedPara("Face Recognition: ", "Achieved 92.1% precision and 91.0% accuracy on the LFW benchmark, confirming reliable biometric identity verification."),
  mixedPara("Anti-Spoofing: ", "Achieved 96.0% precision and 97.0% accuracy on CelebA-Spoof, effectively distinguishing live faces from presentation attacks."),
  mixedPara("Coercion Detection: ", "Achieved 95.7% precision and 98.0% accuracy on 130 controlled video recordings, demonstrating robust real-time threat detection."),
  mixedPara("Blockchain Performance: ", "Showed an average of 45,000 gas units per transaction and 4.8-second confirmation latency, confirming feasibility for organizational elections."),
  bodyPara("The three-factor authentication protocol, combining wallet possession, dual-channel OTP, and biometric face recognition, creates a robust identity verification pipeline that makes voter impersonation virtually impossible. The Shamir's Secret Sharing scheme with a 3-of-5 threshold ensures that no single authority can decrypt election results independently. The client-side RSA-2048 encryption ensures complete ballot secrecy even on the transparent Ethereum blockchain."),
  bodyPara("In summary, this project demonstrates that a blockchain-based e-voting system with integrated AI security measures is technically feasible, performant, and secure for deployment in organizational election scenarios."),

  h2("7.2 Future Enhancements"),
  bodyPara("While the current system provides a comprehensive solution for secure electronic voting, several enhancements can be explored in future work to improve scalability, privacy, and accessibility:"),
  mixedPara("1. Layer 2 Scaling Solutions: ", "Integration of Layer 2 scaling technologies such as Polygon, Arbitrum, or Optimism to reduce gas costs and increase transaction throughput for national-level elections with millions of voters."),
  mixedPara("2. Zero-Knowledge Proofs (zk-SNARKs): ", "Implementation of zero-knowledge proofs to enable voters to prove their vote was counted correctly without revealing their choice, further strengthening ballot secrecy and public verifiability."),
  mixedPara("3. Homomorphic Encryption: ", "Exploration of homomorphic encryption schemes that allow vote tallying directly on encrypted data without decryption, eliminating the need for key reconstruction entirely."),
  mixedPara("4. Mobile Application: ", "Development of native Android and iOS applications with integrated face recognition and NFC-based wallet authentication for improved accessibility."),
  mixedPara("5. IPFS Integration: ", "Storage of face images and large data on the InterPlanetary File System (IPFS) to reduce on-chain storage costs while maintaining decentralized data availability."),
  mixedPara("6. Multi-Language Support: ", "Addition of support for multiple Indian languages (Telugu, Hindi, Tamil, etc.) to improve accessibility for diverse voter populations."),
  mixedPara("7. Advanced Anti-Coercion: ", "Integration of emotion detection and stress analysis using deep learning models to identify subtle forms of coercion that may not involve visible third-party presence."),
  mixedPara("8. Formal Verification: ", "Mathematical formal verification of the smart contract using tools like Certora or Solidity formal verification to prove correctness of voting logic."),
  bodyPara("The results of this study support the appropriateness of implementing a scalable, secure and privacy-appropriate e-Voting system that can successfully operate under practical conditions. The proposed framework creates a paradigm of technical effectiveness of applying advanced cryptography and decentralized identity technologies in democratic processes to contribute to the larger discussion around credible digital governance."),

  // ============================================================
  // REFERENCES
  // ============================================================
  pgBreak(),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 480 }, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" } }, children: [new TextRun({ text: "REFERENCES", font: TNR, size: 32, bold: true })] }),

  ...[
    '[1] S. Sah, R. S. Verma, D. Singh, and P. K. Sharma, "Leveraging blockchain technology for secure online voting systems – a comprehensive review," J. Mobile Multimedia, Jul. 2025. DOI: 10.13052/jmm1550-4646.213412.',
    '[2] R. Barelli, M. Bernhard, A. Bracciali, and S. Werner, "Toward secure electronic voting: a survey on e-voting systems and attacks," IEEE Access, vol. 13, 2025. DOI: 10.1109/ACCESS.2025.3569334.',
    '[3] M. Alown, K. M. Ball, and A. Rusu, "Enhancing democratic processes: a survey of DRE, internet, and blockchain voting systems," IEEE Access, 2025. DOI: 10.1109/ACCESS.2025.3531349.',
    '[4] V. Reyes-Macedo, P. S. L. M. Barreto, and J. L. C. Rodrigues, "A threshold-blind signature scheme and its application in blockchain-based systems," IEEE Access, vol. 12, 2024. DOI: 10.1109/ACCESS.2024.3445298.',
    '[5] S. Maheshwari, V. K. Sharma, and P. Shukla, "Blockchain integration with multimodal biometric authentication system for secure smart verifiable electronic voting system," IEEE Xplore, 2025. DOI: 10.1109/11195074.',
    '[6] A. Kumar, R. Singh, and M. Gupta, "Secure e-voting system using blockchain technology and authentication via face recognition and mobile OTP," IEEE Xplore, 2025. DOI: 10.1109/9580147.',
    '[7] L. Zhang, Y. Chen, and W. Liu, "ViT-LoRA based facial authentication for blockchain e-voting," IEEE Xplore, 2025.',
    '[8] M. J. Hossain Faruk et al., "Transforming online voting: a novel system utilizing blockchain and biometric verification," Cluster Comput., vol. 27, pp. 4015–4034, Apr. 2024.',
  ].map(ref => new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 120, after: 120, line: 276 },
    indent: { left: 360, hanging: 360 },
    children: [new TextRun({ text: ref, font: TNR, size: BODY_SIZE })]
  })),

  // ============================================================
  // INDEX
  // ============================================================
  pgBreak(),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 480 }, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" } }, children: [new TextRun({ text: "INDEX", font: TNR, size: 32, bold: true })] }),

  ...[
    ["Anti-Coercion Monitoring", "29, 44, 57"],
    ["Blockchain Technology", "3, 21, 30"],
    ["Booth Mode", "29, 45"],
    ["CelebA-Spoof Dataset", "69"],
    ["Collaboration Diagram", "43"],
    ["Convolutional Neural Networks (CNN)", "4, 28"],
    ["Cryptography", "5"],
    ["DFD Diagrams", "36"],
    ["Ethereum Blockchain", "3, 30"],
    ["Euclidean Distance", "28, 44, 57"],
    ["Face-api.js", "4, 27, 57"],
    ["Face Recognition", "27, 57"],
    ["Hardhat", "26, 47"],
    ["Identity Verification", "5, 28"],
    ["JSEncrypt", "6, 48, 53"],
    ["LFW Dataset", "69"],
    ["MetaMask", "6, 28, 48"],
    ["Node.js/Express", "6, 26, 47"],
    ["OTP Service", "6, 28, 48"],
    ["Python/FastAPI", "6, 26, 48"],
    ["React.js / Next.js", "6, 26, 48"],
    ["RSA-2048 Encryption", "5, 28, 53"],
    ["SHA-256 Hash", "5, 27"],
    ["Shamir's Secret Sharing", "5, 28, 54"],
    ["Smart Contract", "3, 26, 51"],
    ["Solidity", "26, 51"],
    ["SQLite Database", "27, 31, 47"],
    ["Three-Factor Authentication", "6, 28"],
    ["Twilio SDK", "26, 48"],
    ["UML Diagrams", "39"],
    ["Use Case Diagram", "39"],
    ["VVPAT", "29, 45"],
    ["Voter Registration", "27, 47"],
  ].map(([term, pages]) => new Paragraph({
    spacing: { before: 60, after: 60 },
    tabStops: [{ type: TabStopType.RIGHT, position: 8500 }],
    children: [
      new TextRun({ text: term, font: TNR, size: BODY_SIZE }),
      new TextRun({ text: `\t${pages}`, font: TNR, size: BODY_SIZE })
    ]
  })),

  // ============================================================
  // PUBLICATION DETAILS
  // ============================================================
  pgBreak(),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 360 }, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" } }, children: [new TextRun({ text: "PUBLICATION DETAILS", font: TNR, size: 32, bold: true })] }),

  centerPara("APPENDIX - 1", BODY_SIZE, true),
  new Paragraph({ spacing: { before: 180, after: 120 }, children: [] }),

  mixedPara("Paper Title: ", '"AI-Integrated Decentralized E-Voting System Using Ethereum Blockchain"'),
  mixedPara("Authors: ", "Ms. S. Kalyani Bai, C. Chowdeswar, N. Nandini, G. Bhavana, A. Guru Sravani"),
  mixedPara("Affiliation: ", "Department of Computer Science and Engineering, K.S.R.M College of Engineering (Autonomous), Kadapa, Andhra Pradesh, India"),
  mixedPara("Conference / Journal: ", "International Conference on Emerging Innovations in Science and Development (ICEISD 2026)"),

  new Paragraph({ spacing: { before: 240, after: 120 }, children: [new TextRun({ text: "Abstract", font: TNR, size: BODY_SIZE, bold: true })] }),
  bodyPara("Modern electronic voting systems remain vulnerable to centralized database manipulation, identity spoofing, and voter coercion due to monolithic server design and absence of cryptographic auditability. This paper proposes a decentralized e-voting system based on the Ethereum blockchain that integrates three security layers: client-side RSA-2048 ballot encryption with decentralized key management via Shamir's Secret Sharing scheme; a three-factor authentication protocol combining blockchain wallet ownership, one-time password verification, and CNN-based biometric face recognition; and computer vision-based real-time anti-coercion monitoring."),
  bodyPara("The system was implemented as a multi-service decentralized application (DApp) comprising a React.js/Next.js frontend with client-side AI processing, a Node.js/Express backend for voter management, a Python/FastAPI server for face verification, an OTP service for dual-channel verification, and Ethereum smart contracts written in Solidity for on-chain logic."),
  bodyPara("The system achieved 92.1% precision in face recognition, 96.0% precision in anti-spoofing, and 95.7% precision with 98.0% accuracy in coercion detection when tested using the Labeled Faces in the Wild benchmark, the CelebA-Spoof dataset, and 130 controlled video recordings."),

  new Paragraph({ spacing: { before: 240, after: 120 }, children: [new TextRun({ text: "Keywords", font: TNR, size: BODY_SIZE, bold: true })] }),
  new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { before: 120, after: 120 }, children: [new TextRun({ text: "Anti-coercion, blockchain, CNN, e-voting, Ethereum, face recognition, RSA encryption, Shamir's secret sharing, smart contracts, three-factor authentication", font: TNR, size: BODY_SIZE, italics: true })] }),

  // CO-PO & PSO Mapping
  pgBreak(),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 360 }, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" } }, children: [new TextRun({ text: "CO – PO & PSO MAPPING", font: TNR, size: 32, bold: true })] }),

  bodyPara("On successful completion of this Project, the students will be able to:"),
  mixedPara("CO 1: ", "Demonstrate a sound technical knowledge of their selected project topic"),
  mixedPara("CO 2: ", "Understand problem identification, formulation and solution"),
  mixedPara("CO 3: ", "Design engineering solutions to complex problems utilizing a systems approach"),
  mixedPara("CO 4: ", "Communicate with engineers and the community at large in written and oral form"),
  mixedPara("CO 5: ", "Demonstrate the knowledge, skills and attitudes of a professional engineer"),

  new Paragraph({ spacing: { before: 240, after: 120 }, children: [new TextRun({ text: "Project Title: AI-Integrated Decentralized E-Voting System Using Ethereum Blockchain", font: TNR, size: BODY_SIZE, bold: true })] }),

  new Paragraph({ spacing: { before: 180, after: 60 }, children: [] }),
  makeTable(
    ["CO", "PO1", "PO2", "PO3", "PO4", "PO5", "PO6", "PO7", "PO8", "PO9", "PO10", "PO11", "PO12", "PSO1", "PSO2", "PSO3"],
    [
      ["CO1", "3", "3", "3", "2", "3", "1", "1", "1", "2", "2", "1", "2", "3", "3", "2"],
      ["CO2", "3", "3", "2", "2", "2", "1", "1", "1", "2", "2", "1", "2", "3", "2", "2"],
      ["CO3", "3", "3", "3", "2", "3", "1", "2", "1", "2", "2", "2", "3", "3", "3", "2"],
      ["CO4", "1", "1", "1", "3", "1", "1", "1", "1", "3", "3", "1", "2", "1", "1", "1"],
      ["CO5", "2", "2", "2", "2", "2", "2", "2", "2", "2", "2", "2", "3", "2", "2", "2"],
    ],
    [540, 500, 500, 500, 500, 500, 500, 500, 500, 500, 560, 560, 560, 560, 560, 560]
  ),
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { before: 60, after: 120 },
    children: [new TextRun({ text: "Mapping of PO and CO (1 – Low, 2 – Medium, 3 – High)", font: TNR, size: BODY_SIZE, italics: true })]
  }),
];

// ============================================================
// BUILD DOCUMENT
// ============================================================
const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{
          level: 0,
          format: LevelFormat.BULLET,
          text: "\u2022",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      },
      {
        reference: "numbers",
        levels: [{
          level: 0,
          format: LevelFormat.DECIMAL,
          text: "%1.",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      }
    ]
  },
  styles: {
    default: {
      document: {
        run: { font: TNR, size: BODY_SIZE }
      }
    },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: HEAD_SIZE, bold: true, font: TNR },
        paragraph: { spacing: { before: 360, after: 180 }, outlineLevel: 0 }
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: HEAD_SIZE, bold: true, font: TNR },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 }
      },
      {
        id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: BODY_SIZE, bold: true, font: TNR },
        paragraph: { spacing: { before: 180, after: 60 }, outlineLevel: 2 }
      },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },   // Letter size
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1800 }
      }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" } },
          children: [new TextRun({
            text: "AI-Integrated Decentralized E-Voting System Using Ethereum Blockchain",
            font: TNR, size: 18, italics: true
          })]
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: "000000" } },
          children: [
            new TextRun({ text: "K.S.R.M College of Engineering — Dept. of CSE     ", font: TNR, size: 18 }),
            new TextRun({ children: [PageNumber.CURRENT], font: TNR, size: 18 })
          ]
        })]
      })
    },
    children
  }]
});

// ============================================================
// GENERATE FILE
// ============================================================
const outputPath = path.join(__dirname, 'AI_Integrated_E_Voting_Full_Report.docx');

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(outputPath, buf);
  console.log(`\n✅ Full report generated successfully!`);
  console.log(`📄 Output: ${outputPath}`);
  console.log(`📊 Size: ${(buf.length / 1024).toFixed(1)} KB`);
  console.log(`📑 Includes: Title Page, Certificate, Acknowledgment, Abstract, TOC, Chapters 1-7, References, Index, Publication Details, CO-PO Mapping`);
}).catch(err => {
  console.error('❌ Error generating document:', err);
});
