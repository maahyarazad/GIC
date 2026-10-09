import { PDFFont } from "pdf-lib";

/**
 * Standard PDF fonts only cover WinAnsi. Keep characters the font can encode
 * (Latin-1 incl. umlauts, common punctuation) and replace the rest with "?".
 */
export const toWinAnsi = (font: PDFFont, value: string): string =>
  Array.from(value.replace(/\r\n?/g, "\n"))
    .map((char) => {
      if (char === "\n") return char;
      try {
        font.encodeText(char);
        return char;
      } catch {
        return "?";
      }
    })
    .join("");

export const wrapText = (text: string, font: PDFFont, size: number, maxWidth: number): string[] => {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        line = candidate;
        continue;
      }
      if (line) lines.push(line);
      // Hard-break words that are wider than the line on their own.
      let rest = word;
      while (font.widthOfTextAtSize(rest, size) > maxWidth) {
        let cut = rest.length - 1;
        while (cut > 1 && font.widthOfTextAtSize(rest.slice(0, cut), size) > maxWidth) cut--;
        lines.push(rest.slice(0, cut));
        rest = rest.slice(cut);
      }
      line = rest;
    }
    lines.push(line);
  }
  return lines;
};
