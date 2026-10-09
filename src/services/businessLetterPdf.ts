import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";
import { toWinAnsi, wrapText } from "./pdfText";
import {
  BusinessLetterRequestDto,
  LANGUAGE_LABELS,
} from "../types/businessLetter.types";

const PAGE_WIDTH = 595.28; // A4
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const LABEL_WIDTH = 150;
const FOOTER_SPACE = 60;

const BRAND = rgb(200 / 255, 84 / 255, 26 / 255); // #C8541A
const ACCENT = rgb(217 / 255, 177 / 255, 68 / 255); // #D9B144
const TEXT = rgb(0.2, 0.2, 0.2);
const MUTED = rgb(0.47, 0.47, 0.47);
const RULE = rgb(0.87, 0.87, 0.87);
const WHITE = rgb(1, 1, 1);

const EMPTY = "—";

const formatDate = (value: string, withTime = false): string =>
  new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dubai" } : { timeZone: "UTC" }),
  });

export async function buildBusinessLetterPdf(dto: BusinessLetterRequestDto): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Business Letter Request ${dto.reference}`);
  pdf.setAuthor("German Industry Club");

  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const clean = (value?: string | null) => toWinAnsi(regular, value?.trim() || EMPTY);

  let page: PDFPage = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT;

  const newPage = () => {
    page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN;
  };
  const ensureSpace = (height: number) => {
    if (y - height < FOOTER_SPACE) newPage();
  };

  // Header bar
  const headerHeight = 80;
  page.drawRectangle({ x: 0, y: PAGE_HEIGHT - headerHeight, width: PAGE_WIDTH, height: headerHeight, color: BRAND });
  page.drawText("German Industry Club", { x: MARGIN, y: PAGE_HEIGHT - 38, size: 20, font: bold, color: WHITE });
  page.drawText("Business Letter Request", { x: MARGIN, y: PAGE_HEIGHT - 60, size: 12, font: regular, color: WHITE });
  y = PAGE_HEIGHT - headerHeight - 40;

  // Reference block
  page.drawText("REFERENCE", { x: MARGIN, y, size: 9, font: bold, color: MUTED });
  y -= 24;
  page.drawText(clean(dto.reference), { x: MARGIN, y, size: 22, font: bold, color: ACCENT });
  y -= 18;
  page.drawText(`Submitted ${formatDate(dto.createdAt, true)}`, { x: MARGIN, y, size: 10, font: regular, color: MUTED });
  y -= 30;

  const drawSectionTitle = (title: string) => {
    ensureSpace(40);
    page.drawText(title.toUpperCase(), { x: MARGIN, y, size: 10, font: bold, color: BRAND });
    y -= 8;
    page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 1, color: BRAND });
    y -= 18;
  };

  const drawField = (label: string, value?: string | null) => {
    const lines = wrapText(clean(value), regular, 11, CONTENT_WIDTH - LABEL_WIDTH);
    ensureSpace(lines.length * 15 + 8);
    page.drawText(label, { x: MARGIN, y, size: 11, font: regular, color: MUTED });
    lines.forEach((line, index) => {
      page.drawText(line, { x: MARGIN + LABEL_WIDTH, y: y - index * 15, size: 11, font: regular, color: TEXT });
    });
    y -= lines.length * 15 + 4;
    page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 0.5, color: RULE });
    y -= 14;
  };

  drawSectionTitle("Requester");
  drawField("Name", dto.requester.name);
  drawField("Email", dto.requester.email);
  drawField("Phone", dto.requester.phone);
  drawField("Company", dto.requester.company);
  y -= 10;

  drawSectionTitle("Letter details");
  drawField("Letter type", dto.letterTypeLabel);
  drawField("Address", dto.addressee?.address);
  drawField("Language", LANGUAGE_LABELS[dto.language] ?? dto.language);
  drawField("Needed by", formatDate(dto.neededBy));
  y -= 10;

  drawSectionTitle("Purpose");
  for (const line of wrapText(clean(dto.purpose), regular, 11, CONTENT_WIDTH)) {
    ensureSpace(16);
    page.drawText(line, { x: MARGIN, y, size: 11, font: regular, color: TEXT });
    y -= 16;
  }

  // Footer on every page
  const year = new Date().getFullYear();
  const pages = pdf.getPages();
  pages.forEach((p, index) => {
    p.drawLine({ start: { x: MARGIN, y: 40 }, end: { x: PAGE_WIDTH - MARGIN, y: 40 }, thickness: 0.5, color: RULE });
    p.drawText(`© ${year} German Industry Club. All rights reserved.`, { x: MARGIN, y: 26, size: 8, font: regular, color: MUTED });
    const right = `${dto.reference} · Page ${index + 1} of ${pages.length}`;
    p.drawText(toWinAnsi(regular, right), {
      x: PAGE_WIDTH - MARGIN - regular.widthOfTextAtSize(toWinAnsi(regular, right), 8),
      y: 26,
      size: 8,
      font: regular,
      color: MUTED,
    });
  });

  return pdf.save();
}
