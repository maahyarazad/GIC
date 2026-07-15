import path from "path";
import fs from "fs";
import { getCollection } from "./db";
import {
  readAllSheets,
  toNumberIfPossible,
  normalizeCountryName,
  CHAPTER_DATA_DIR,
  SEED_PACKAGE,
} from "./initialize_db";

/**
 * Applies a dated chapter-data package (chapter_data/<package>/*.xlsx) on top of the
 * products already in the database.
 *
 * Unlike initialize_db.ts this drops nothing and reseeds nothing: it merges each
 * package into the stored product metadata, leaving fields the package does not
 * mention untouched.
 *
 * Field names are derived from the spreadsheet headers rather than hard-coded, because
 * each release rewrites its column set. Keeping a hand-written column->field map would
 * mean rewriting it for every future package.
 */

/** Chapter number (1-based) -> metadata key. Mirrors `chapterCoverage` in initialize_db.ts. */
const CHAPTER_KEYS = [
  "economicFundamentals",
  "demographicsWorkforce",
  "naturalIndustrialResources",
  "currencyFinancialClimate",
  "infrastructureLogistics",
  "governanceStability",
  "businessTradeEnvironment",
  "educationResearchHumanCapital",
  "industrialManufacturingStrengths",
  "sustainabilityEnvironment",
  "swot",
  "conclusion",
];

/**
 * Columns that identify the row rather than carry data. "Count" is a 1..n row index the
 * spreadsheets carry in every sheet — storing it would put a meaningless `count` on every record.
 */
const IDENTITY_COLUMNS = new Set(["count", "country", "subregion", "sub-region"]);

export interface DataPackageSummary {
  name: string;
  fileCount: number;
  files: string[];
}

export interface NewColumnGroup {
  chapter: string;
  sheet: string;
  columns: string[];
}

export interface DataPackageUpdateReport {
  package: string;
  filesProcessed: string[];
  countriesUpdated: number;
  countriesNotMatched: string[];
  newColumns: NewColumnGroup[];
  totalNewColumns: number;
}

/**
 * Turns a spreadsheet header into a stable object key.
 * e.g. "Current Nominal GDP (Current US$ bn)" -> "currentNominalGdpCurrentUsdBn"
 *      "Latest GDP Growth (%)"                -> "latestGdpGrowthPct"
 */
export function toFieldKey(header: string): string {
  const tokens = header
    .normalize("NFKC")
    .replace(/[‐-―−]/g, "-") // unicode dashes -> hyphen
    .replace(/ /g, " ") // non-breaking space
    .replace(/US\$/gi, " USD ")
    .replace(/[$€£]/g, " USD ")
    .replace(/%/g, " Pct ")
    .replace(/&/g, " And ")
    .replace(/²/g, "2")
    .replace(/³/g, "3")
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean);

  return tokens
    .map((token, index) => {
      const lower = token.toLowerCase();
      if (index === 0) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join("");
}

/** xlsx names unlabelled columns "__EMPTY", "__EMPTY_1", ... — those carry no data. */
function isUsableColumn(header: string): boolean {
  if (!header) return false;
  if (header.startsWith("__EMPTY")) return false;
  return !IDENTITY_COLUMNS.has(header.trim().toLowerCase());
}

function chapterKeyForFile(fileName: string): string | null {
  const match = fileName.match(/Chapter\s+(\d+)/i);
  if (!match) return null;

  return CHAPTER_KEYS[Number(match[1]) - 1] ?? null;
}

/** Rejects anything that could escape chapter_data/ (the package name reaches us from the client). */
function isSafePackageName(name: string): boolean {
  return /^[A-Za-z0-9._-]+$/.test(name) && name !== "." && name !== "..";
}

export function listDataPackages(baseDir: string = process.cwd()): DataPackageSummary[] {
  const root = path.join(baseDir, CHAPTER_DATA_DIR);
  if (!fs.existsSync(root)) return [];

  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() &&
        isSafePackageName(entry.name) &&
        // The seed folder is the baseline initialize_db.ts reseeds from, not an update to apply on top.
        entry.name !== SEED_PACKAGE
    )
    .map((entry) => {
      const files = fs
        .readdirSync(path.join(root, entry.name))
        .filter((file) => file.endsWith(".xlsx") && !file.startsWith("~$"))
        .sort();

      return { name: entry.name, fileCount: files.length, files };
    })
    .filter((pkg) => pkg.fileCount > 0)
    .sort((a, b) => b.name.localeCompare(a.name));
}

/**
 * Reads one package into { country -> { chapterKey -> { sheetKey -> row(s) } } }.
 * A sheet holding several rows for the same country (historic events, for example)
 * is kept as an array; a single row collapses to an object.
 *
 * Exported so a package can be inspected without touching the database.
 */
export function buildPackageData(packageDir: string, files: string[]) {
  const countries: Record<
    string,
    {
      name: string;
      chapters: Record<string, Record<string, any[]>>;
      sourceFiles: Set<string>;
      sourceSheets: Set<string>;
    }
  > = {};
  for (const fileName of files) {
    const chapterKey = chapterKeyForFile(fileName);
    if (!chapterKey) continue;

    const sheets = readAllSheets(path.join(packageDir, fileName));

    for (const [sheetName, rows] of Object.entries(sheets)) {
      const sheetKey = toFieldKey(sheetName);

      for (const row of rows) {
        const countryName = row["Country"];
        if (!countryName || typeof countryName !== "string" || !countryName.trim()) {
          continue;
        }

        const parsed: Record<string, any> = {};
        for (const [header, value] of Object.entries(row)) {
          if (!isUsableColumn(header)) continue;

          const key = toFieldKey(header);
          if (!key) continue;

          parsed[key] = toNumberIfPossible(value);
        }

        // A row of nothing but the country name adds no data.
        if (Object.values(parsed).every((value) => value === null)) continue;

        const countryKey = normalizeCountryName(countryName);
        countries[countryKey] ??= {
          name: countryName.trim(),
          chapters: {},
          sourceFiles: new Set(),
          sourceSheets: new Set(),
        };

        const entry = countries[countryKey];
        entry.sourceFiles.add(fileName);
        entry.sourceSheets.add(sheetName);
        entry.chapters[chapterKey] ??= {};
        entry.chapters[chapterKey][sheetKey] ??= [];
        entry.chapters[chapterKey][sheetKey].push(parsed);
      }
    }
  }

  return countries;
}

/** Keys already stored under metadata.<chapter>.<sheet>, whatever shape it was written in. */
function storedColumns(existingChapter: any, sheetKey: string): Set<string> {
  const stored = existingChapter?.[sheetKey];
  if (!stored) return new Set();

  const rows = Array.isArray(stored) ? stored : [stored];
  const keys = new Set<string>();

  for (const row of rows) {
    if (row && typeof row === "object") {
      Object.keys(row).forEach((key) => keys.add(key));
    }
  }

  return keys;
}

export async function updateProductsFromDataPackage(
  packageName: string,
  baseDir: string = process.cwd()
): Promise<DataPackageUpdateReport> {
  if (!isSafePackageName(packageName)) {
    throw new Error(`Invalid data package name: "${packageName}"`);
  }

  const available = listDataPackages(baseDir);
  const pkg = available.find((entry) => entry.name === packageName);
  if (!pkg) {
    throw new Error(`Data package "${packageName}" was not found in ${CHAPTER_DATA_DIR}/`);
  }

  const packageDir = path.join(baseDir, CHAPTER_DATA_DIR, packageName);
  const filesProcessed = pkg.files.filter((file) => chapterKeyForFile(file));
  const countries = buildPackageData(packageDir, filesProcessed);

  const productCollection = getCollection("products");
  const newColumnsByGroup = new Map<string, NewColumnGroup>();
  const countriesNotMatched: string[] = [];
  let countriesUpdated = 0;

  for (const entry of Object.values(countries)) {
    const existing: any = await productCollection.findOne({
      $or: [
        { name: entry.name },
        { name: { $regex: new RegExp(`^${entry.name}$`, "i") } },
      ],
    } as any);

    if (!existing) {
      countriesNotMatched.push(entry.name);
      continue;
    }

    const metadataUpdate: Record<string, any> = {};

    for (const [chapterKey, sheets] of Object.entries(entry.chapters)) {
      // The initial seed leaves untouched chapters as null, so never spread it blindly.
      const existingChapter =
        existing.metadata?.[chapterKey] && typeof existing.metadata[chapterKey] === "object"
          ? existing.metadata[chapterKey]
          : {};

      const mergedChapter: Record<string, any> = { ...existingChapter };

      for (const [sheetKey, rows] of Object.entries(sheets)) {
        const known = storedColumns(existingChapter, sheetKey);
        const added = [...new Set(rows.flatMap((row) => Object.keys(row)))].filter(
          (column) => !known.has(column)
        );

        if (added.length > 0) {
          const groupId = `${chapterKey}.${sheetKey}`;
          const group =
            newColumnsByGroup.get(groupId) ??
            { chapter: chapterKey, sheet: sheetKey, columns: [] };

          for (const column of added) {
            if (!group.columns.includes(column)) group.columns.push(column);
          }
          newColumnsByGroup.set(groupId, group);
        }

        mergedChapter[sheetKey] = rows.length === 1 ? rows[0] : rows;
      }

      metadataUpdate[`metadata.${chapterKey}`] = mergedChapter;
    }

    if (Object.keys(metadataUpdate).length === 0) continue;

    const mergedSourceFiles = new Set<string>([
      ...(Array.isArray(existing.sourceFiles) ? existing.sourceFiles : []),
      ...entry.sourceFiles,
    ]);
    const mergedSourceSheets = new Set<string>([
      ...(Array.isArray(existing.sourceSheets) ? existing.sourceSheets : []),
      ...entry.sourceSheets,
    ]);

    await productCollection.updateOne({ _id: existing._id }, {
      $set: {
        ...metadataUpdate,
        sourceFiles: [...mergedSourceFiles],
        sourceSheets: [...mergedSourceSheets],
        lastDataPackage: packageName,
        lastDataPackageAt: new Date(),
      },
    } as any);

    countriesUpdated += 1;
  }

  const newColumns = [...newColumnsByGroup.values()];

  console.log(
    `[update_db] package "${packageName}": ${countriesUpdated} countries updated, ` +
      `${newColumns.reduce((sum, group) => sum + group.columns.length, 0)} new columns, ` +
      `${countriesNotMatched.length} unmatched`
  );

  return {
    package: packageName,
    filesProcessed,
    countriesUpdated,
    countriesNotMatched,
    newColumns,
    totalNewColumns: newColumns.reduce((sum, group) => sum + group.columns.length, 0),
  };
}
