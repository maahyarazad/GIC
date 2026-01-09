import { PDFDocument, rgb, degrees } from 'pdf-lib';
import fs from 'fs/promises';

export async function addWatermark(inputPath: string, outputPath: string, text: string): Promise<void> {
  const existingPdfBytes = await fs.readFile(inputPath);
  const pdfDoc = await PDFDocument.load(existingPdfBytes);

  const pages = pdfDoc.getPages();
  pages.forEach(page => {
    const { width, height } = page.getSize();
    page.drawText(text, {
      x: width/10,
      y: height/10,
      size: 20,
      color: rgb(0.5, 0.5, 0.5),
      rotate: degrees(45),
      opacity: 0.3,
    });
  });

  const pdfBytes = await pdfDoc.save();
  await fs.writeFile(outputPath, pdfBytes);
}
