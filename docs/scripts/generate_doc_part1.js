// Part 1: Helpers ONLY — Professional Academic Formatting
// No prelim pages. Document starts from Chapter 1.
const { Document, Packer, Paragraph, TextRun, AlignmentType, PageBreak,
  Header, Footer, PageNumber, NumberFormat, Table, TableRow, TableCell,
  WidthType, BorderStyle, ShadingType, Tab, TabStopType } = require('docx');

const TNR = "Times New Roman";
const BLUE = "000000"; // Black for professional academic style

// 1.5 line spacing = 360 twips
const LINE_SPACING = 360;
// First-line indent = 720 twips (0.5 inch)
const FIRST_LINE_INDENT = 720;

// Chapter title — single heading, no duplicate banner page
// 16pt, bold, CENTER, ALL CAPS, starts on new page
function chapterTitle(num, title) {
  return [
    new Paragraph({
      pageBreakBefore: true,
      alignment: AlignmentType.CENTER,
      spacing: { before: 600, after: 400 },
      children: [new TextRun({ text: `CHAPTER ${num}`, font: TNR, size: 32, bold: true })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
      children: [new TextRun({ text: title.toUpperCase(), font: TNR, size: 32, bold: true })]
    }),
  ];
}

// Section heading (1.1, 2.1) — 14pt, bold, LEFT
function h2(text) {
  return new Paragraph({
    spacing: { before: 360, after: 200 },
    children: [new TextRun({ text, font: TNR, size: 28, bold: true })]
  });
}

// Sub-section heading (1.1.1, 3.6.1) — 12pt, bold, LEFT
function h3(text) {
  return new Paragraph({
    spacing: { before: 280, after: 160 },
    children: [new TextRun({ text, font: TNR, size: 24, bold: true })]
  });
}

// Body paragraph — 12pt, justified, 1.5 spacing, first-line indent
function p(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 120, line: LINE_SPACING },
    indent: { firstLine: FIRST_LINE_INDENT },
    children: [new TextRun({ text, font: TNR, size: 24 })]
  });
}

// Bold-label paragraph (e.g., "Key Term: description")
function bp(label, text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 120, line: LINE_SPACING },
    indent: { firstLine: FIRST_LINE_INDENT },
    children: [
      new TextRun({ text: label, font: TNR, size: 24, bold: true }),
      new TextRun({ text, font: TNR, size: 24 })
    ]
  });
}

// Bullet point — 12pt, justified
function bull(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 100, line: LINE_SPACING },
    bullet: { level: 0 },
    children: [new TextRun({ text, font: TNR, size: 24 })]
  });
}

// Numbered item — 12pt, justified, with indent
function nItem(n, text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 100, line: LINE_SPACING },
    indent: { left: 720 },
    children: [
      new TextRun({ text: `${n}. `, font: TNR, size: 24, bold: true }),
      new TextRun({ text, font: TNR, size: 24 })
    ]
  });
}

// Table cell helper
function tc(text, opts = {}) {
  return new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    shading: opts.header ? { type: ShadingType.SOLID, color: "2E4057" } : undefined,
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 60, after: 60 },
      children: [new TextRun({
        text, font: TNR, size: 22,
        bold: opts.header || opts.bold || false,
        color: opts.header ? "FFFFFF" : "000000"
      })]
    })]
  });
}

// Code block paragraph — Courier New, 10pt
function code(text) {
  return new Paragraph({
    spacing: { after: 200, line: 276 },
    indent: { left: 360 },
    children: [new TextRun({ text, font: "Courier New", size: 18 })]
  });
}

// Section-end page title (for References, Index, etc.) — no separate banner
function sectionTitle(title) {
  return [
    new Paragraph({
      pageBreakBefore: true,
      alignment: AlignmentType.CENTER,
      spacing: { before: 600, after: 600 },
      children: [new TextRun({ text: title.toUpperCase(), font: TNR, size: 32, bold: true })]
    }),
  ];
}

module.exports = {
  TNR, BLUE, LINE_SPACING, FIRST_LINE_INDENT,
  chapterTitle, h2, h3, p, bp, bull, nItem, tc, code, sectionTitle,
  Document, Packer, Paragraph, TextRun, AlignmentType, PageBreak,
  Header, Footer, PageNumber, NumberFormat,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType
};
