import { PDFDocument, rgb, degrees } from 'pdf-lib';
import fs from 'fs/promises';

export async function addWatermark(inputPath: string, outputPath: string, text: string): Promise<void> {
  const existingPdfBytes = await fs.readFile(inputPath);
  const pdfDoc = await PDFDocument.load(existingPdfBytes);

  const pages = pdfDoc.getPages();
  pages.forEach(page => {
    const { width, height } = page.getSize();
    page.drawText(text, {
      x: width/20,
      y: height/20,
      size: 20,
      color: rgb(0.5, 0.5, 0.5),
      rotate: degrees(0),
      opacity: 0.5,
    });
  });

  const pdfBytes = await pdfDoc.save();
  await fs.writeFile(outputPath, pdfBytes);
}
