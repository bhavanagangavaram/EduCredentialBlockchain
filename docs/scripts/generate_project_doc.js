// Main DOCX Generator — Professional Academic Report
// Starts directly from Chapter 1. No prelim pages.
const fs = require('fs');
const P1 = require('./generate_doc_part1');
const P2 = require('./generate_doc_part2');
const P3 = require('./generate_doc_part3');
const P4 = require('./generate_doc_part4');

const { Document, Packer, Paragraph, TextRun, Header, Footer, PageNumber, AlignmentType } = P1;
const TNR = "Times New Roman";

async function generateDocument() {
  console.log("═══════════════════════════════════════════════");
  console.log("  Building Professional Academic Project Report");
  console.log("═══════════════════════════════════════════════");

  const ch1 = P2.getChapter1();
  const ch2 = P2.getChapter2();
  const ch3 = P2.getChapter3();
  const ch4 = P3.getChapter4();
  const ch5 = P3.getChapter5();
  const ch6 = P4.getChapter6();
  const ch7 = P4.getChapter7();
  const refs = P4.getReferences();
  const index = P4.getIndex();
  const pub = P4.getPublication();
  console.log("  ✓ All chapter content loaded");

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: TNR, size: 24 },
          paragraph: { spacing: { line: 360 } }
        }
      },
      paragraphStyles: [{
        id: "Normal",
        name: "Normal",
        run: { font: TNR, size: 24 },
        paragraph: { spacing: { line: 360 } }
      }]
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1800, right: 1440 },
            pageNumbers: { start: 1 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({
                  text: "AI-Integrated Decentralized E-Voting System Using Ethereum Blockchain",
                  font: TNR, size: 18, italics: true, color: "888888"
                })]
              })
            ]
          })
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "Page ", font: TNR, size: 20 }),
                  new TextRun({ children: [PageNumber.CURRENT], font: TNR, size: 20 }),
                ]
              })
            ]
          })
        },
        children: [
          ...ch1,
          ...ch2,
          ...ch3,
          ...ch4,
          ...ch5,
          ...ch6,
          ...ch7,
          ...refs,
          ...index,
          ...pub,
        ],
      },
    ],
  });

  console.log("  ✓ Document structure built");

  const buffer = await Packer.toBuffer(doc);
  const outputPath = 'd:\\FinalProj\\AI_Integrated_E_Voting_Project_Report.docx';
  fs.writeFileSync(outputPath, buffer);

  console.log("  ✓ File written successfully!");
  console.log("");
  console.log("═══════════════════════════════════════════════");
  console.log(`  OUTPUT: ${outputPath}`);
  console.log("═══════════════════════════════════════════════");
  console.log("");
  console.log("  Formatting Applied:");
  console.log("  ─ Font: Times New Roman throughout");
  console.log("  ─ Chapter Titles: 16pt, Bold, CENTER, ALL CAPS");
  console.log("  ─ Section Headings (1.1): 14pt, Bold, LEFT");
  console.log("  ─ Sub-headings (1.1.1): 12pt, Bold, LEFT");
  console.log("  ─ Body Text: 12pt, Justified, first-line indent");
  console.log("  ─ Line Spacing: 1.5");
  console.log("  ─ Page Numbers: Arabic (Page 1, 2, 3...)");
  console.log("  ─ Margins: 1.25in left, 1in top/bottom/right");
  console.log("  ─ No prelim pages (starts from Chapter 1)");
  console.log("  ─ Single chapter heading per chapter (no duplicates)");
  console.log("  ─ Template reference statement at end of Chapter 1");
  console.log(`  ─ File Size: ${(buffer.length / 1024).toFixed(1)} KB`);
  console.log("");
  console.log("  Structure:");
  console.log("  ─ Chapter 1: Introduction");
  console.log("  ─ Chapter 2: Literature Survey");
  console.log("  ─ Chapter 3: System Analysis");
  console.log("  ─ Chapter 4: System Design");
  console.log("  ─ Chapter 5: System Coding & Testing");
  console.log("  ─ Chapter 6: Results");
  console.log("  ─ Chapter 7: Conclusion & Future Enhancements");
  console.log("  ─ References");
  console.log("  ─ Index");
  console.log("  ─ Publication Details");
}

generateDocument().catch(err => {
  console.error("ERROR:", err.message);
  console.error(err.stack);
  process.exit(1);
});
