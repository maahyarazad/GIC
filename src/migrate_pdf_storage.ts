/**
 * One-off migration: move country-intelligence PDFs out of the publicly served `file_storage`
 * directory into the private `pdf_storage` directory, so they are reachable only through the
 * authenticated, watermarking route /api/v1/watermark/:fileId.
 *
 * Only PDFs referenced by a product's `fileId` are moved. Dry run by default; idempotent.
 *
 *   npx tsx src/migrate_pdf_storage.ts          # dry run
 *   npx tsx src/migrate_pdf_storage.ts --apply  # move the files
 */
import path from "path";
import fs from "fs/promises";
import { connectToDatabase, closeDatabaseConnection, getCollection } from "./db";

const APPLY = process.argv.includes("--apply");
const FROM = path.join(process.cwd(), "file_storage");
const TO = path.join(process.cwd(), "pdf_storage");

async function main() {
  await connectToDatabase();
  const products = await getCollection<any>("products").find({ fileId: { $nin: [null, ""] } }).toArray();
  const fileIds = [...new Set(products.map((p) => String(p.fileId)))];

  if (APPLY) await fs.mkdir(TO, { recursive: true });
  let moved = 0, already = 0, missing = 0;
  for (const id of fileIds) {
    const name = `${path.basename(id)}.pdf`;
    const src = path.join(FROM, name);
    const dest = path.join(TO, name);
    const inPrivate = await fs.access(dest).then(() => true, () => false);
    const inPublic = await fs.access(src).then(() => true, () => false);
    if (inPrivate) { already++; if (inPublic) console.log(`WARN  ${name} exists in both dirs — public copy left in place`); continue; }
    if (!inPublic) { missing++; console.log(`MISSING  ${name}`); continue; }
    console.log(`${APPLY ? "MOVE" : "WOULD MOVE"}  ${name}`);
    if (APPLY) await fs.rename(src, dest);
    moved++;
  }
  console.log(`\n${APPLY ? "Moved" : "Would move"} ${moved}, already private ${already}, missing ${missing} (of ${fileIds.length} referenced PDFs).${APPLY ? "" : "  Re-run with --apply."}`);
  await closeDatabaseConnection();
}
main().catch((e) => { console.error(e); process.exit(1); });
