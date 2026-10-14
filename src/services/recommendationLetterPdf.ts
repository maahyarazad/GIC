/**
 * Letter of recommendation PDF, laid out after "Draft_Template for Letter of Recommendation.docx"
 * (A4, 2.5 cm side margins): letterhead, recipient and sender blocks, date, subject, reference,
 * salutation, three numbered sections, closing and two signatories. Every page carries the
 * running header and "n / N".
 */
import fs from "fs/promises";
import path from "path";
import { PDFDocument, PDFEmbeddedPage, PDFFont, PDFImage, PDFPage, StandardFonts, rgb } from "pdf-lib";
import { toWinAnsi, wrapText } from "./pdfText";
import { buildBody } from "./recommendationLetterText";
import { RUNNING_HEADER, SENDER_LINES, SIGNATORIES, SignatureSource } from "../config/recommendationLetterConfig";
import { LetterFields } from "../types/recommendationLetter.types";

const PAGE_WIDTH = 595.28; // A4
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 71; // 2.5 cm
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
const BOTTOM = 50;
const FIRST_PAGE_TOP = PAGE_HEIGHT - 60;
const NEXT_PAGE_TOP = PAGE_HEIGHT - 70;

const BODY_SIZE = 11;
const LEADING = 15;
const PARAGRAPH_GAP = 6;
const SMALL_SIZE = 9;
const LOGO_WIDTH = 140;

const TEXT = rgb(0.13, 0.13, 0.13);
const MUTED = rgb(0.47, 0.47, 0.47);

// Resolves to src/assets under tsx and dist/assets in production (copied by `npm run copy-assets`).
const LOGO_PATH = path.join(__dirname, "..", "assets", "gic-logo.png");
let logoBytes: Promise<Buffer> | null = null;
const readLogo = (): Promise<Buffer> => {
  if (!logoBytes) {
    logoBytes = fs.readFile(LOGO_PATH).catch((error) => {
      logoBytes = null;
      throw error;
    });
  }
  return logoBytes;
};

// Signatures live in file_storage (uploads, kept out of git), resolved like client.controller.ts does.
const SIGNATURE_DIR = path.join(process.cwd(), "file_storage");

/**
 * Embeds a signature from file_storage, or returns null (logged) so the letter is still generated.
 * PDFs embed page 1 cropped to `box`; .png/.jpg/.jpeg embed the whole image as-is.
 */
async function embedSignature(
  pdf: PDFDocument,
  source: SignatureSource
): Promise<PDFEmbeddedPage | PDFImage | null> {
  try {
    const bytes = await fs.readFile(path.join(SIGNATURE_DIR, source.file));
    const ext = path.extname(source.file).toLowerCase();

    if (ext === ".png") return await pdf.embedPng(bytes);
    if (ext === ".jpg" || ext === ".jpeg") return await pdf.embedJpg(bytes);

    // PDF signature: embed page 1, cropped to the configured box.
    if (!source.box) {
      throw new Error("a PDF signature requires a `box` crop");
    }
    const signaturePdf = await PDFDocument.load(bytes);
    return await pdf.embedPage(signaturePdf.getPage(0), source.box);
  } catch (error) {
    console.error(`Recommendation letter: signature ${source.file} could not be embedded:`, error);
    return null;
  }
}

export async function buildRecommendationLetterPdf(fields: LetterFields, reference: string): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  pdf.setTitle(toWinAnsi(regular, `Letter of Recommendation – ${fields.companyName}`));
  pdf.setSubject(reference);
  pdf.setAuthor("German Industry Club");

  let page: PDFPage = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = FIRST_PAGE_TOP;

  const newPage = () => {
    page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = NEXT_PAGE_TOP;
  };
  const ensureSpace = (height: number) => {
    if (y - height < BOTTOM + 20) newPage();
  };

  const clean = (font: PDFFont, value: string) => toWinAnsi(font, value);

  /** Draws wrapped text at the cursor; returns nothing, moves `y` below it. */
  const paragraph = (value: string, font: PDFFont = regular, size = BODY_SIZE) => {
    for (const line of wrapText(clean(font, value), font, size, CONTENT_WIDTH)) {
      ensureSpace(LEADING);
      page.drawText(line, { x: MARGIN_X, y: y - size, size, font, color: TEXT });
      y -= LEADING;
    }
  };
  const gap = (height = LEADING) => {
    y -= height;
  };

  // ── Letterhead: logo top right ──
  let logo: PDFImage | null = null;
  try {
    logo = await pdf.embedPng(await readLogo());
  } catch (error) {
    // The letter is still valid without the logo; don't fail the whole PDF.
    console.error("Recommendation letter: GIC logo could not be embedded:", error);
  }
  if (logo) {
    const height = (logo.height / logo.width) * LOGO_WIDTH;
    page.drawImage(logo, { x: PAGE_WIDTH - MARGIN_X - LOGO_WIDTH, y: y - height, width: LOGO_WIDTH, height });
    y -= height + 20;
  }

  // ── Recipient (left) and sender (right) side by side ──
  // v2 addressee block: company name (bold), title, Attn, address, "City, Country".
  const recipient = [
    fields.companyName,
    fields.recipientTitle,
    fields.recipientAttn ? `Attn: ${fields.recipientAttn}` : "",
    fields.recipientAddress,
    [fields.recipientCity, fields.recipientCountry].map((p) => p.trim()).filter(Boolean).join(", "),
  ]
    .map((line) => line.trim())
    .filter(Boolean);
  const blockTop = y;
  recipient.forEach((line, index) => {
    const lines = wrapText(clean(regular, line), regular, BODY_SIZE, CONTENT_WIDTH / 2 - 10);
    for (const part of lines) {
      page.drawText(part, { x: MARGIN_X, y: y - BODY_SIZE, size: BODY_SIZE, font: index === 0 ? bold : regular, color: TEXT });
      y -= LEADING;
    }
  });
  const recipientBottom = y;

  y = blockTop;
  SENDER_LINES.forEach((line, index) => {
    const font = index === 0 ? bold : regular;
    const value = clean(font, line);
    const width = font.widthOfTextAtSize(value, SMALL_SIZE);
    page.drawText(value, { x: PAGE_WIDTH - MARGIN_X - width, y: y - SMALL_SIZE, size: SMALL_SIZE, font, color: MUTED });
    y -= SMALL_SIZE + 4;
  });
  y = Math.min(y, recipientBottom);

  // ── Date, subject, reference, salutation ──
  gap();
  paragraph(`Date: ${fields.letterDate}`);
  gap();
  paragraph(`Subject: Letter of Recommendation – ${fields.companyName}`, bold);
  if (fields.reference.trim()) paragraph(`Reference: ${fields.reference}`);
  gap();
  paragraph(fields.salutation);
  gap(LEADING / 2);

  // ── Body (v2: flowing paragraphs, no headings) ──
  buildBody(fields).forEach((text, index) => {
    gap(LEADING / 2);
    // Keep a paragraph from starting on the last line of a page.
    ensureSpace(LEADING * 2);
    // The opening recommendation line is emphasised.
    paragraph(text, index === 0 ? bold : regular);
    gap(PARAGRAPH_GAP);
  });

  // ── Closing ──
  gap(LEADING / 2);
  paragraph(fields.closing);
  gap();
  paragraph("Yours sincerely,");
  gap(LEADING / 2);
  paragraph("German Industry Club", bold);

  // ── Signatures: two columns, never split across pages ──
  const SIGNATURE_SPACE = 50;
  const SIGNATURE_LINE_WIDTH = 150;
  const signatureHeight = 20 + SIGNATURE_SPACE + 4 + LEADING * 2;
  ensureSpace(signatureHeight);
  y -= 20;
  const lineTop = y - SIGNATURE_SPACE;
  const signatures = await Promise.all(
    SIGNATORIES.map((signatory) => (signatory.signature ? embedSignature(pdf, signatory.signature) : null))
  );
  SIGNATORIES.forEach((signatory, index) => {
    const x = MARGIN_X + index * (CONTENT_WIDTH / 2);
    const signature = signatures[index];
    if (signature) {
      // Fit inside the signature space above the line, keeping the aspect ratio.
      const scale = Math.min(SIGNATURE_LINE_WIDTH / signature.width, (SIGNATURE_SPACE - 4) / signature.height);
      const placement = {
        x,
        y: lineTop + 2,
        width: signature.width * scale,
        height: signature.height * scale,
      };
      if (signature instanceof PDFImage) {
        page.drawImage(signature, placement);
      } else {
        page.drawPage(signature, placement);
      }
    }
    page.drawLine({ start: { x, y: lineTop }, end: { x: x + SIGNATURE_LINE_WIDTH, y: lineTop }, thickness: 0.5, color: MUTED });
    page.drawText(clean(bold, signatory.name), { x, y: lineTop - 4 - BODY_SIZE, size: BODY_SIZE, font: bold, color: TEXT });
    page.drawText(clean(regular, signatory.title), { x, y: lineTop - 4 - BODY_SIZE - LEADING, size: BODY_SIZE, font: regular, color: TEXT });
  });

  // ── Running header and page numbers on every page ──
  const pages = pdf.getPages();
  const header = clean(regular, RUNNING_HEADER);
  const headerWidth = regular.widthOfTextAtSize(header, 8);
  pages.forEach((p, index) => {
    // Page 1 has the letterhead; the running header sits above it, as in the template.
    p.drawText(header, { x: (PAGE_WIDTH - headerWidth) / 2, y: PAGE_HEIGHT - 30, size: 8, font: regular, color: MUTED });
    const number = `${index + 1} / ${pages.length}`;
    const numberWidth = regular.widthOfTextAtSize(number, 8);
    p.drawText(number, { x: (PAGE_WIDTH - numberWidth) / 2, y: 25, size: 8, font: regular, color: MUTED });
  });

  return pdf.save();
}
