import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";
import fs from "fs/promises";


export async function addWatermark(
  inputPath: string,
  outputPath: string,
  text: string,
  productVersion: null | string
): Promise<void> {
  const existingPdfBytes = await fs.readFile(inputPath);
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const pages = pdfDoc.getPages();
  pages.forEach((page) => {
    const { width, height } = page.getSize();

    //The hypotenuse of A4 (210×297mm) in portrait is 364mm, and the angle is arctan(297/210) ≈ 54.7°.
    const angle = Math.atan2(height, width) * (180 / Math.PI); // ~54.7°

    page.drawText(text, {
      x: Math.floor(width * 0.05),
      y: Math.floor(height * 0.05),
      size: 32,
      color: rgb(0.5, 0.5, 0.5),
      rotate: degrees(angle),
      opacity: 0.3,
    });

    const margin = 14;
    const estimatedWidth = 20;

    page.drawText(productVersion, {
        x: width - estimatedWidth - margin,
        y: margin,
        font,
        size: 14,
        color: rgb(0, 0, 0),
        opacity: 0.7,
    }); 

  });

  const pdfBytes = await pdfDoc.save();
  await fs.writeFile(outputPath, pdfBytes);
}
