import { getCollection } from "./db";
import path from "path";
import fs from "fs";
import * as XLSX from "xlsx";
export async function initializeDatabase() {
    try{

        const continentCollection = getCollection("continents");
        const productCollection = getCollection("products");
      
        // =========================
        // SOURCE CHAPTER FILES
        // =========================
        const chapterFiles = [
          "Chapter 01 - Economic Fundamentals.xlsx",
          "Chapter 02 - Demographics and Workforce.xlsx",
          "Chapter 03 - Natural and Industrial Resources.xlsx",
          "Chapter 04 - Currency and Financial Climate.xlsx",
          "Chapter 05 - Infrastructure and Logistics.xlsx",
          "Chapter 06 - Governance and Stability.xlsx",
          "Chapter 07 - Business and Trade Environment.xlsx",
          "Chapter 08 - Education, Research and Human Capital.xlsx",
          "Chapter 09 -  Industrial-Manufacturing Strengths.xlsx",
          "Chapter 10 - Sustainability and Environment.xlsx",
          "Chapter 11 - SWOT Matrix.xlsx",
          "Chapter 12 - Conclusion.xlsx",
        ];
      
        const chapterCoverage = [
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
      
        // =========================
        // OPTIONAL: CLEAN EXISTING DATA
        // =========================
        await continentCollection.deleteMany({});
        await productCollection.deleteMany({});
      
        // =========================
        // SUB REGIONS = CONTINENTS COLLECTION
        // =========================
      const subRegions = [
        { name: "North Africa", code: "NA" },
        { name: "East Africa", code: "EA" },
        { name: "West Africa", code: "WA" },
        { name: "Central Africa", code: "CA" },
        { name: "Southern Africa", code: "SAF" },
        { name: "Middle East (Western Asia)", code: "MEWA" },
      ];
        const continentMap: Record<string, any> = {};
      
        for (const [index, region] of subRegions.entries()) {
          const continentDoc = {
            name: region.name,
            slug: region.name
              .toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/[()]/g, "")
              .replace(/-+/g, "-"),
            code: region.code,
            description: null,
      
            products: [],
            productCodes: [],
      
            parent: null,
            children: [],
            isActive: true,
            order: index + 1,
      
            image: null,
            imageAlt: null,
      
            seoTitle: region.name,
            seoDescription: null,
            seoKeywords: [region.name, region.code],
      
            sourceLabel: region.name,
            summary: {
              countryCount: 0,
              chapterCoverage,
              notes: null,
            },
          };
      
          const result = await continentCollection.insertOne(continentDoc);
          continentMap[region.name] = result.insertedId;
        }
      
        // =========================
        // COUNTRIES = PRODUCTS COLLECTION
        // =========================
const countries = [
  // =========================
  // MIDDLE EAST (Western Asia) - 15
  // =========================
  { name: "Bahrain", code: "BH", subRegion: "Middle East (Western Asia)" },
  { name: "Iran", code: "IR", subRegion: "Middle East (Western Asia)" },
  { name: "Iraq", code: "IQ", subRegion: "Middle East (Western Asia)" },
  { name: "Israel", code: "IL", subRegion: "Middle East (Western Asia)" },
  { name: "Jordan", code: "JO", subRegion: "Middle East (Western Asia)" },
  { name: "Kuwait", code: "KW", subRegion: "Middle East (Western Asia)" },
  { name: "Lebanon", code: "LB", subRegion: "Middle East (Western Asia)" },
  { name: "Oman", code: "OM", subRegion: "Middle East (Western Asia)" },
  { name: "Palestine", code: "PS", subRegion: "Middle East (Western Asia)" },
  { name: "Qatar", code: "QA", subRegion: "Middle East (Western Asia)" },
  { name: "Saudi Arabia", code: "SA", subRegion: "Middle East (Western Asia)" },
  { name: "Syria", code: "SY", subRegion: "Middle East (Western Asia)" },
  { name: "United Arab Emirates (UAE)", code: "AE", subRegion: "Middle East (Western Asia)" },
  { name: "Yemen", code: "YE", subRegion: "Middle East (Western Asia)" },
  { name: "Türkiye", code: "TR", subRegion: "Middle East (Western Asia)" },

  // =========================
  // NORTH AFRICA - 6
  // =========================
  { name: "Algeria", code: "DZ", subRegion: "North Africa" },
  { name: "Egypt", code: "EG", subRegion: "North Africa" },
  { name: "Libya", code: "LY", subRegion: "North Africa" },
  { name: "Morocco", code: "MA", subRegion: "North Africa" },
  { name: "Sudan", code: "SD", subRegion: "North Africa" },
  { name: "Tunisia", code: "TN", subRegion: "North Africa" },

  // =========================
  // WEST AFRICA - 16
  // =========================
  { name: "Benin", code: "BJ", subRegion: "West Africa" },
  { name: "Burkina Faso", code: "BF", subRegion: "West Africa" },
  { name: "Cape Verde", code: "CV", subRegion: "West Africa" },
  { name: "Côte d'Ivoire", code: "CI", subRegion: "West Africa" },
  { name: "Gambia", code: "GM", subRegion: "West Africa" },
  { name: "Ghana", code: "GH", subRegion: "West Africa" },
  { name: "Guinea", code: "GN", subRegion: "West Africa" },
  { name: "Guinea-Bissau", code: "GW", subRegion: "West Africa" },
  { name: "Liberia", code: "LR", subRegion: "West Africa" },
  { name: "Mali", code: "ML", subRegion: "West Africa" },
  { name: "Mauritania", code: "MR", subRegion: "West Africa" },
  { name: "Niger", code: "NE", subRegion: "West Africa" },
  { name: "Nigeria", code: "NG", subRegion: "West Africa" },
  { name: "Senegal", code: "SN", subRegion: "West Africa" },
  { name: "Sierra Leone", code: "SL", subRegion: "West Africa" },
  { name: "Togo", code: "TG", subRegion: "West Africa" },

  // =========================
  // CENTRAL AFRICA - 9
  // =========================
  { name: "Angola", code: "AO", subRegion: "Central Africa" },
  { name: "Cameroon", code: "CM", subRegion: "Central Africa" },
  { name: "Central African Republic", code: "CF", subRegion: "Central Africa" },
  { name: "Chad", code: "TD", subRegion: "Central Africa" },
  { name: "Republic of the Congo", code: "CG", subRegion: "Central Africa" },
  { name: "Democratic Republic of the Congo", code: "CD", subRegion: "Central Africa" },
  { name: "Equatorial Guinea", code: "GQ", subRegion: "Central Africa" },
  { name: "Gabon", code: "GA", subRegion: "Central Africa" },
  { name: "São Tomé and Príncipe", code: "ST", subRegion: "Central Africa" },

  // =========================
  // EAST AFRICA - 14
  // =========================
  { name: "Burundi", code: "BI", subRegion: "East Africa" },
  { name: "Comoros", code: "KM", subRegion: "East Africa" },
  { name: "Djibouti", code: "DJ", subRegion: "East Africa" },
  { name: "Eritrea", code: "ER", subRegion: "East Africa" },
  { name: "Ethiopia", code: "ET", subRegion: "East Africa" },
  { name: "Kenya", code: "KE", subRegion: "East Africa" },
  { name: "Madagascar", code: "MG", subRegion: "East Africa" },
  { name: "Malawi", code: "MW", subRegion: "East Africa" },
  { name: "Mauritius", code: "MU", subRegion: "East Africa" },
  { name: "Mozambique", code: "MZ", subRegion: "East Africa" },
  { name: "Rwanda", code: "RW", subRegion: "East Africa" },
  { name: "Somalia", code: "SO", subRegion: "East Africa" },
  { name: "Tanzania", code: "TZ", subRegion: "East Africa" },
  { name: "Uganda", code: "UG", subRegion: "East Africa" },

  // =========================
  // SOUTHERN AFRICA - 9
  // =========================
  { name: "Botswana", code: "BW", subRegion: "Southern Africa" },
  { name: "Eswatini", code: "SZ", subRegion: "Southern Africa" },
  { name: "Lesotho", code: "LS", subRegion: "Southern Africa" },
  { name: "Namibia", code: "NA", subRegion: "Southern Africa" },
  { name: "South Africa", code: "ZA", subRegion: "Southern Africa" },
  { name: "Zambia", code: "ZM", subRegion: "Southern Africa" },
  { name: "Zimbabwe", code: "ZW", subRegion: "Southern Africa" },
  { name: "Seychelles", code: "SC", subRegion: "Southern Africa" },
  { name: "South Sudan", code: "SS", subRegion: "Southern Africa" },
];
      
        // =========================
        // INSERT PRODUCTS + LINK TO SUB-REGION
        // =========================
        for (const [index, country] of countries.entries()) {
          const continentId = continentMap[country.subRegion];
      
          const productDoc = {
            fileId: `country_${country.code.toLowerCase()}`,
            name: country.name,
            slug: country.name.toLowerCase().replace(/\s+/g, "-"),
            code: country.code,
      
            subRegion: country.subRegion,
            parent: continentId,
      
            content: {
              description: null,
              shortDescription: null,
              highlights: [],
              features: [],
            },
      
            variant: {
              variantName: null,
              variantValue: null,
            },
      
            media: {
              images: [],
              imageAlt: null,
              video: null,
              seoTitle: country.name,
              seoDescription: null,
              seoKeywords: [country.name, country.code, country.subRegion],
            },
      
            tags: ["country"],
            downloadCount: 0,
            importance: "A",
      
            children: [],
            recommended: [],
      
            metadata: {
              economicFundamentals: null,
              demographicsWorkforce: null,
              naturalIndustrialResources: null,
              currencyFinancialClimate: null,
              infrastructureLogistics: null,
              governanceStability: null,
              businessTradeEnvironment: null,
              educationResearchHumanCapital: null,
              industrialManufacturingStrengths: null,
              sustainabilityEnvironment: null,
              swot: null,
              conclusion: null,
            },
      
            sourceFiles: [...chapterFiles],
            sourceSheets: [],
      
            isActive: true,
            order: index + 1,
          };
      
          const result = await productCollection.insertOne(productDoc);
      
          await continentCollection.updateOne(
            { _id: continentId },
            {
              $push: {
                products: result.insertedId,
                productCodes: country.code,
              },
              $inc: {
                "summary.countryCount": 1,
              },
            }
          );
        }
        console.log("DB initialized successfully");
    }catch(er){
        console.error(er);
    }

}







type AnyObj = Record<string, any>;

type CountrySeed = {
  name: string;
  code: string;
  subRegion: string;
};

function toNumberIfPossible(value: any): number | string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "number") return value;

  const str = String(value).trim();
  if (!str) return null;

  // keep ranges / mixed text as string
  if (
    str.includes("–") ||
    str.includes("-") ||
    str.includes("%") ||
    /[A-Za-z]/.test(str)
  ) {
    return str;
  }

  const parsed = Number(str.replace(/,/g, ""));
  return Number.isNaN(parsed) ? str : parsed;
}

function toText(value: any): string | null {
  if (value === undefined || value === null || value === "") return null;
  const str = String(value).trim();
  return str || null;
}

function normalizeCountryName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCountryCode(code: string): string {
  return code.trim().toUpperCase();
}

function readSheetRows(filePath: string, sheetName: string): AnyObj[] {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json(sheet, { defval: null });
}

function readAllSheets(filePath: string): Record<string, AnyObj[]> {
  const workbook = XLSX.readFile(filePath);
  const output: Record<string, AnyObj[]> = {};

  for (const sheetName of workbook.SheetNames) {
    output[sheetName] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      defval: null,
    });
  }

  return output;
}

function ensureCountryEntry(
  map: Record<string, any>,
  countryName: string,
  subRegion: string
) {
  const key = normalizeCountryName(countryName);

  if (!map[key]) {
    map[key] = {
      name: countryName,
      subRegion,
      metadata: {
        economicFundamentals: null,
        demographicsWorkforce: null,
        naturalIndustrialResources: null,
        currencyFinancialClimate: null,
        infrastructureLogistics: null,
        governanceStability: null,
        businessTradeEnvironment: null,
        educationResearchHumanCapital: null,
        industrialManufacturingStrengths: null,
        sustainabilityEnvironment: null,
        swot: null,
        conclusion: null,
      },
      sourceFiles: new Set<string>(),
      sourceSheets: new Set<string>(),
    };
  }

  return map[key];
}

function addSource(entry: any, fileName: string, sheetName: string) {
  entry.sourceFiles.add(fileName);
  entry.sourceSheets.add(sheetName);
}

function buildMetadataFromFiles(baseDir: string) {
  const countryMap: Record<string, any> = {};

  const chapterFiles = [
    "Chapter 01 - Economic Fundamentals.xlsx",
    "Chapter 02 - Demographics and Workforce.xlsx",
    "Chapter 03 - Natural and Industrial Resources.xlsx",
    "Chapter 04 - Currency and Financial Climate.xlsx",
    "Chapter 05 - Infrastructure and Logistics.xlsx",
    "Chapter 06 - Governance and Stability.xlsx",
    "Chapter 07 - Business and Trade Environment.xlsx",
    "Chapter 08 - Education, Research and Human Capital.xlsx",
    "Chapter 09 -  Industrial-Manufacturing Strengths.xlsx",
    "Chapter 10 - Sustainability and Environment.xlsx",
    "Chapter 11 - SWOT Matrix.xlsx",
    "Chapter 12 - Conclusion.xlsx",
  ];

  for (const fileName of chapterFiles) {
    const filePath = path.join(baseDir, fileName);
    if (!fs.existsSync(filePath)) continue;

    const sheets = readAllSheets(filePath);

    for (const [sheetName, rows] of Object.entries(sheets)) {
      for (const row of rows) {
        const country = toText(row["Country"]);
        const subRegion = toText(row["Sub-region"]);

        if (!country || !subRegion) continue;

        const entry = ensureCountryEntry(countryMap, country, subRegion);
        addSource(entry, fileName, sheetName);

        // =========================
        // CHAPTER 01 - Economic Fundamentals
        // =========================
        if (fileName.includes("Chapter 01")) {
          entry.metadata.economicFundamentals ??= {};

          if (sheetName === "GDP (Size and Growth Trends)") {
            entry.metadata.economicFundamentals.nominalGdpUsdBn = toNumberIfPossible(
              row["Nominal GDP (2024, US$ bn)"]
            );
            entry.metadata.economicFundamentals.avgAnnualGrowth2019To2024 =
              toText(row["Avg. Annual Growth (2019–2024)"]);
          }

          if (sheetName === "Gini Coefficient and HDI") {
            entry.metadata.economicFundamentals.latestGiniIndex = toNumberIfPossible(
              row["Latest Gini Index"]
            );
            entry.metadata.economicFundamentals.averageHdi2023To2024 =
              toNumberIfPossible(row["Average HDI (2023–2024)"]);
          }

          if (sheetName === "Employment and Unemployment") {
            entry.metadata.economicFundamentals.avgUnemploymentRate2024 =
              toNumberIfPossible(row["Avg. Unemployment Rate 2024 (%)"]);
            entry.metadata.economicFundamentals.youthUnemploymentRate2024 =
              toNumberIfPossible(row["Youth Unemployment Rate 2024 (%)"]);
          }

          if (sheetName === "Education Levels") {
            entry.metadata.economicFundamentals.literacyRate2024 =
              toNumberIfPossible(row["Literacy Rate (2024)"]);
            entry.metadata.economicFundamentals.avgSchooling2024 = toText(
              row["Avg. Schooling (2024)"]
            );
          }

          if (sheetName === "Average Age of Population") {
            entry.metadata.economicFundamentals.averageAge2024 =
              toNumberIfPossible(row["Average Age of Population (2024)"]);
          }

          if (sheetName === "Land Size") {
            entry.metadata.economicFundamentals.landSizeSqKm2024 =
              toNumberIfPossible(row["Land Size (sq km, 2024)"]);
          }

          if (sheetName === "Capital and Debt") {
            entry.metadata.economicFundamentals.publicDebtPctGdp2024 =
              toNumberIfPossible(row["Public Debt (% of GDP, 2024)"]);
          }

          if (sheetName === "Taxes (Income, Import, VAT)") {
            entry.metadata.economicFundamentals.incomeTaxRate = toText(
              row["Income Tax Rate (%)"]
            );
            entry.metadata.economicFundamentals.importDutyPct = toText(
              row["Import Duty (%)"]
            );
            entry.metadata.economicFundamentals.vatOrSalesTaxPct = toText(
              row["VAT/Sales Tax (%)"]
            );
          }

          if (sheetName === "Market Growth Over Years") {
            entry.metadata.economicFundamentals.gdpGrowthRate2024 =
              toNumberIfPossible(row["GDP Growth Rate 2024 (%)"]);
          }
        }

        // =========================
        // CHAPTER 02 - Demographics and Workforce
        // =========================
        if (fileName.includes("Chapter 02")) {
          entry.metadata.demographicsWorkforce ??= {};

          if (sheetName === "Population") {
            entry.metadata.demographicsWorkforce.populationGrowthRatePct =
              toNumberIfPossible(row["Pop. Growth Rate (%)"]);
            entry.metadata.demographicsWorkforce.primaryReligion =
              toText(row["Primary Religion"]);
            entry.metadata.demographicsWorkforce.birthRatePer1000 =
              toNumberIfPossible(row["Birth Rate (/1000)"]);
            entry.metadata.demographicsWorkforce.deathRatePer1000 =
              toNumberIfPossible(row["Death Rate (/1000)"]);
          }

          if (sheetName === "Skilled Workforce Availability") {
            entry.metadata.demographicsWorkforce.skillStatus =
              toText(row["Skill Status"]);
            entry.metadata.demographicsWorkforce.tertiaryEducation =
              toText(row["Tertiary Education"]);
            entry.metadata.demographicsWorkforce.laborMarketFeatures =
              toText(row["Labor Market Features"]);
          }

          if (sheetName === "Geographic Disparity") {
            entry.metadata.demographicsWorkforce.urbanPopulationPct =
              toNumberIfPossible(row["Urban Population (%)"]);
            entry.metadata.demographicsWorkforce.ruralPopulationPct =
              toNumberIfPossible(row["Rural Population (%)"]);
            entry.metadata.demographicsWorkforce.geographicDistributionNotes =
              toText(row["Notes on Geographic Distribution"]);
          }
        }

        // =========================
        // CHAPTER 03 - Natural and Industrial Resources
        // =========================
        if (fileName.includes("Chapter 03")) {
          entry.metadata.naturalIndustrialResources ??= {};

          if (sheetName === "Main Resources") {
            entry.metadata.naturalIndustrialResources.mainResources =
              toText(row["Main Resources"]);
          }

          if (sheetName === "Industrial Base Strength") {
            entry.metadata.naturalIndustrialResources.industrialBaseStrength2024 =
              toText(row["Industrial Base Strength (2024)"]);
          }
        }

        // =========================
        // CHAPTER 04 - Currency and Financial Climate
        // =========================
        if (fileName.includes("Chapter 04")) {
          entry.metadata.currencyFinancialClimate ??= {};

          if (sheetName === "Currency") {
            entry.metadata.currencyFinancialClimate.currencyCode =
              toText(row["Currency (Code)"]);
            entry.metadata.currencyFinancialClimate.currencyStrengthAcceptance =
              toText(row["Strength/Acceptance"]);
            entry.metadata.currencyFinancialClimate.currencyStability2024 =
              toText(row["Stability (2024)"]);
          }

          if (sheetName === "Average Price of Standard Goods") {
            entry.metadata.currencyFinancialClimate.averagePriceStandardGoods ??= {};
            entry.metadata.currencyFinancialClimate.averagePriceStandardGoods.milk1L =
              toText(row["1L Milk"]);
            entry.metadata.currencyFinancialClimate.averagePriceStandardGoods.breadLoafUsd =
              toText(row["Bread (Loaf US$)"]);
            entry.metadata.currencyFinancialClimate.averagePriceStandardGoods.eggs12 =
              toText(row["12 Eggs"]);
            entry.metadata.currencyFinancialClimate.averagePriceStandardGoods.rice1Kg =
              toText(row["1kg Rice"]);
            entry.metadata.currencyFinancialClimate.averagePriceStandardGoods.chicken1Kg =
              toText(row["1kg Chicken"]);
          }

          if (sheetName === "Banking and Payment Systems") {
            entry.metadata.currencyFinancialClimate.bankingSystem2024 =
              toText(row["Banking System (2024)"]);
            entry.metadata.currencyFinancialClimate.paymentSystem2024 =
              toText(row["Payment System (2024)"]);
          }

          if (sheetName === "Inflation and Interest Rates") {
            entry.metadata.currencyFinancialClimate.inflationRatePct =
              toNumberIfPossible(row["Inflation Rate (%)"]);
            entry.metadata.currencyFinancialClimate.interestRatePct =
              toNumberIfPossible(row["Interest Rate (%)"]);
          }
        }

        // =========================
        // CHAPTER 05 - Infrastructure and Logistics
        // =========================
        if (fileName.includes("Chapter 05")) {
          entry.metadata.infrastructureLogistics ??= {};

          if (sheetName === "Infrastructure Readiness Index") {
            entry.metadata.infrastructureLogistics.infrastructureReadinessIndexScore =
              toNumberIfPossible(row["Index Score"]);
            entry.metadata.infrastructureLogistics.infrastructureReadinessGlobalRank =
              toNumberIfPossible(row["Global Rank"]);
          }

          if (sheetName === "Communications") {
            entry.metadata.infrastructureLogistics.nri2024Score =
              toNumberIfPossible(row["NRI 2024 Score"]);
          }

          if (sheetName === "Ports and Airports Capacity") {
            entry.metadata.infrastructureLogistics.portsAirportsCapacity ??= {};
            entry.metadata.infrastructureLogistics.portsAirportsCapacity.majorPorts =
              toText(row["Major Port(s)"]);
            entry.metadata.infrastructureLogistics.portsAirportsCapacity.portCapacity =
              toText(row["Port Capacity (TEU/ton)"]);
            entry.metadata.infrastructureLogistics.portsAirportsCapacity.majorAirports =
              toText(row["Major Airport(s)"]);
            entry.metadata.infrastructureLogistics.portsAirportsCapacity.airportPassengerCapacity =
              toText(row["Airport Passenger Capacity"]);
            entry.metadata.infrastructureLogistics.portsAirportsCapacity.cargoCapacityTonnes =
              toText(row["Cargo Capacity (tonnes)"]);
          }

          if (sheetName === "Typical Delivery Times") {
            entry.metadata.infrastructureLogistics.deliveryTimes ??= {};
            entry.metadata.infrastructureLogistics.deliveryTimes.mainPort =
              toText(row["Main Port"]);
            entry.metadata.infrastructureLogistics.deliveryTimes.portDeliveryTimeDays =
              toText(row["Port Delivery Time (Days)"]);
          }

          if (sheetName === "Logistics Ranking") {
            entry.metadata.infrastructureLogistics.logisticsRanking ??= {};
            entry.metadata.infrastructureLogistics.logisticsRanking.lpiTotalScore =
              toNumberIfPossible(row["LPI Total Score (1–5)"]);
          }
        }

        // =========================
        // CHAPTER 06 - Governance and Stability
        // =========================
        if (fileName.includes("Chapter 06")) {
          entry.metadata.governanceStability ??= {};

          if (sheetName === "Political Stability") {
            entry.metadata.governanceStability.politicalStability = {
              score: toNumberIfPossible(row["Score"]),
              source: toText(row["Source"]),
            };
          }

          if (sheetName === "Government in Power & Policies") {
            entry.metadata.governanceStability.governmentInPowerPolicies = {
              governmentInPower2024: toText(row["Government in Power (2024)"]),
              partyCoalition: toText(row["Party/Coalition"]),
              keyEconomicIndustrialPoliciesFdi: toText(
                row["Key Economic/Industrial Policies (FDI)"]
              ),
              sourceYear: toText(row["Source/Year"]),
            };
          }

          if (sheetName === "NGO Involvement") {
            entry.metadata.governanceStability.ngoInvolvement = {
              ngoPresenceInfluence: toText(row["NGO Presence/Influence"]),
              mainFocusAreas: toText(row["Main Focus Areas"]),
              governmentRelations: toText(row["Government Relations"]),
              sourceYear: toText(row["Source/Year"]),
            };
          }

          if (sheetName === "International Restrictions") {
            entry.metadata.governanceStability.internationalRestrictions = {
              restrictionsEmbargoes: toText(row["Restrictions/Embargoes"]),
              issuingAuthority: toText(row["Issuing Authority"]),
              targetedSectorsEntities: toText(row["Targeted Sectors/Entities"]),
              sourceYear: toText(row["Source/Year"]),
            };
          }

          if (sheetName === "Security and Safety") {
            entry.metadata.governanceStability.securitySafety = {
              crimeSafetyLevel: toText(row["Crime & Safety Level"]),
              businessSecurityRisk: toText(row["Business Security Risk"]),
              lawEnforcementReliability: toText(row["Law Enforcement Reliability"]),
              sourceYear: toText(row["Source/Year"]),
            };
          }

          if (sheetName === "War-Terrorism Risks") {
            entry.metadata.governanceStability.warTerrorismRisks = {
              conflictTerrorismThreats: toText(row["Conflict/Terrorism Threats"]),
              riskLevel: toText(row["Risk Level"]),
              keyGroupsActors: toText(row["Key Groups/Actors"]),
              sourceYear: toText(row["Source/Year"]),
            };
          }

          if (sheetName === "Significant Historic Events") {
            entry.metadata.governanceStability.significantHistoricEvents ??= [];
            entry.metadata.governanceStability.significantHistoricEvents.push({
              historicEvent: toText(row["Historic Event"]),
              year: toNumberIfPossible(row["Year"]),
              businessInvestmentImpact: toText(row["Business/Investment Impact"]),
              sourceYear: toText(row["Source/Year"]),
            });
          }
        }

        // =========================
        // CHAPTER 07 - Business and Trade Environment
        // =========================
        if (fileName.includes("Chapter 07")) {
          entry.metadata.businessTradeEnvironment ??= {};

          if (sheetName === "Ease of Doing Business Rankings") {
            entry.metadata.businessTradeEnvironment.easeOfDoingBusiness = {
              globalRankOf190: toNumberIfPossible(row["Global Rank (of 190)"]),
              overallScore: toNumberIfPossible(row["Overall Score"]),
              year: toNumberIfPossible(row["Year"]),
              statusNote: toText(row["Status Note"]),
            };
          }

          if (sheetName === "Trade Agreements") {
            entry.metadata.businessTradeEnvironment.tradeAgreements = {
              euFtaAssociationIndustrialGoods: toText(
                row["EU FTA / Association (Industrial Goods)"]
              ),
              customsUnionOrRecIndustrialFocus: toText(
                row["Customs Union / REC (Industrial Focus)"]
              ),
              otherKeyArrangementsRelevantToIndustry: toText(
                row["Other Key Arrangements Relevant to Industry"]
              ),
              status: toText(
                row["Status (In Force / Signed / Under Negotiation)"]
              ),
            };
          }

          if (sheetName === "Investment Protection Policies") {
            entry.metadata.businessTradeEnvironment.investmentProtectionPolicies = {
              bitsWithGermanyOrEu: toText(row["BITs with Germany / EU"]),
              icsidMembership: toText(row["ICSID Membership"]),
              isdsAvailability: toText(row["ISDS Availability"]),
              keyDomesticProtections: toText(
                row["Key Domestic Protections (Short Legal Note)"]
              ),
            };
          }

          if (sheetName === "Visas and Land Purchase Laws") {
            entry.metadata.businessTradeEnvironment.visasAndLandPurchaseLaws = {
              businessVisaAvailabilityTypical: toText(
                row["Business Visa Availability (Typical)"]
              ),
              residencyInvestorVisa: toText(row["Residency / Investor Visa"]),
              foreignLandOwnershipCoreRule: toText(
                row["Foreign Land Ownership (Core Rule)"]
              ),
              freeZonesIndustrialParksSpecialRules: toText(
                row["Free Zones / Industrial Parks – Special Rules"]
              ),
            };
          }

          if (sheetName === "Recruitment Landscape") {
            entry.metadata.businessTradeEnvironment.recruitmentLandscape = {
              labourAvailabilitySkills: toText(row["Labour Availability & Skills"]),
              unionisationIntensity: toText(row["Unionisation Intensity"]),
              localHiringNationalisationRules: toText(
                row["Local Hiring / Nationalisation Rules"]
              ),
              typicalChallengesForForeignIndustrialEmployers: toText(
                row["Typical Challenges for Foreign Industrial Employers"]
              ),
            };
          }

          if (sheetName === "Setting Up a New Company") {
            entry.metadata.businessTradeEnvironment.settingUpNewCompany = {
              minCapitalTypicalIndustrialLlc: toText(
                row["Min. Capital (typical industrial LLC)"]
              ),
              typicalSetupTime: toText(row["Typical Setup Time"]),
              govFeesLicensingRegistration: toText(
                row["Gov. Fees (licensing & registration, excl. land)"]
              ),
              foreignOwnershipLimitsMainland: toText(
                row["Foreign Ownership Limits (mainland)"]
              ),
              roleOfFreeZonesSezsForIndustry: toText(
                row["Role of Free Zones / SEZs for Industry"]
              ),
            };
          }

          if (sheetName === "Trading Terms") {
            entry.metadata.businessTradeEnvironment.tradingTerms = {
              publicProcurementOpenness: toText(row["Public Procurement Openness"]),
              paymentRiskDelays: toText(row["Payment Risk & Delays (Gov vs Private)"]),
              localSupplierPreferenceIcv: toText(row["Local Supplier Preference / ICV"]),
              soeDominancePracticalNotes: toText(
                row["SOE Dominance & Practical Notes for Foreign Suppliers"]
              ),
            };
          }
        }

        // =========================
        // CHAPTER 08 - Education, Research and Human Capital
        // =========================
        if (fileName.includes("Chapter 08")) {
          entry.metadata.educationResearchHumanCapital ??= {};

          if (sheetName === "Universities-Schools Quality") {
            entry.metadata.educationResearchHumanCapital.universitiesSchoolsQuality = {
              rankedUniversities2022To2025: toText(
                row["QS/THE ranked universities (2022–2025)"]
              ),
              stemEngineeringStrength: toText(row["STEM / engineering strength"]),
              researchInternationalCollaboration: toText(
                row["Research & international collaboration"]
              ),
              universityIndustryLinks: toText(
                row["University–industry links / relevance for German investors"]
              ),
            };
          }

          if (sheetName === "Training & Vocational Available") {
            entry.metadata.educationResearchHumanCapital.trainingVocationalAvailable =
              {
                tvetVocationalSystem: toText(row["TVET / vocational system"]),
                alignmentWithIndustrialSkills: toText(
                  row["Alignment with industrial skills"]
                ),
                governmentDonorTvetPrograms: toText(
                  row["Government / donor TVET programs"]
                ),
                employerInvolvementImplications: toText(
                  row["Employer involvement / implications for German manufacturers"]
                ),
              };
          }

          if (sheetName === "Workforce Development Programs") {
            entry.metadata.educationResearchHumanCapital.workforceDevelopmentPrograms =
              {
                nationalSkillsHumanCapitalStrategy2022To2025: toText(
                  row["National skills / human-capital strategy (2022–2025)"]
                ),
                publicPrivateWorkforceInitiatives: toText(
                  row["Public–private workforce initiatives"]
                ),
                multinationalsDonorsInvolved: toText(
                  row["Multinationals / donors involved"]
                ),
                effectivenessForIndustrialInvestors: toText(
                  row["Effectiveness for industrial investors (hiring, training cost, scalability)"]
                ),
              };
          }
        }

        // =========================
        // CHAPTER 09 - Industrial-Manufacturing Strengths
        // =========================
        if (fileName.includes("Chapter 09")) {
          entry.metadata.industrialManufacturingStrengths ??= {};

          if (sheetName === "Key Sectors") {
            entry.metadata.industrialManufacturingStrengths.keySectors = {
              primaryManufacturingSectors: toText(
                row["Primary Manufacturing Sectors (non-extractive)"]
              ),
              secondaryEmergingSectors: toText(row["Secondary / Emerging Sectors"]),
              maturityQualifier: toText(row["Maturity Qualifier"]),
            };
          }

          if (sheetName === "Government Incentives") {
            entry.metadata.industrialManufacturingStrengths.governmentIncentives = {
              industrialZonesSezs: toText(row["Industrial Zones / SEZs"]),
              taxCustomsIncentives: toText(row["Tax & Customs Incentives"]),
              localContentLocalisation: toText(row["Local-content / Localisation"]),
              exportOrientedIncentives: toText(row["Export-oriented Incentives"]),
            };
          }

          if (sheetName === "German Products-Companies") {
            entry.metadata.industrialManufacturingStrengths.germanProductsCompanies = {
              germanOemsIndustrialOperationsExamples: toText(
                row["German OEMs / Industrial Operations (Examples)"]
              ),
              germanProductsCommonlyImportedDirectional: toText(
                row["German Products Commonly Imported (Directional)"]
              ),
              notableGermanBackedProjectsQualifiers: toText(
                row["Notable German-backed Projects / Qualifiers"]
              ),
            };
          }

          if (sheetName === "Investment Readiness") {
            entry.metadata.industrialManufacturingStrengths.investmentReadiness = {
              readiness: toText(row["Readiness"]),
              oneSentenceJustification: toText(
                row["One-Sentence Justification"]
              ),
            };
          }
        }

        // =========================
        // CHAPTER 10 - Sustainability and Environment
        // =========================
        if (fileName.includes("Chapter 10")) {
          entry.metadata.sustainabilityEnvironment ??= {};

          if (sheetName === "Waste Management Policies") {
            entry.metadata.sustainabilityEnvironment.wasteManagementPolicies = {
              documentedNationalWasteManagementPolicyStrategy: toText(
                row["Documented National Waste-management Policy or Strategy"]
              ),
              wasteStreamsExplicitlyAddressed: toText(
                row["Waste Streams Explicitly Addressed"]
              ),
              implementationEnforcementSignal: toText(
                row["Implementation & Enforcement Signal"]
              ),
              roleOfPrivateSectorPpps: toText(
                row["Role of Private Sector & PPPs"]
              ),
              keyGapsConstraints: toText(
                row["Key Gaps / Constraints (from diagnostics)"]
              ),
              indicativeSources: toText(row["Sources (indicative)"]),
            };
          }

          if (sheetName === "Environmental Initiatives") {
            entry.metadata.sustainabilityEnvironment.environmentalInitiatives = {
              renewableCleanEnergyInitiativesRelevantToIndustry: toText(
                row["Renewable & Clean-energy Initiatives Relevant to Industry"]
              ),
              carbonClimatePolicyInstrumentsAffectingIndustry: toText(
                row["Carbon / Climate-policy Instruments Affecting Industry"]
              ),
              circularEconomyResourceEfficiencyInitiatives: toText(
                row["Circular-economy / Resource-efficiency Initiatives"]
              ),
              implementationSignal: toText(row["Implementation Signal"]),
              relevanceForIndustrialManufacturingInvestors: toText(
                row["Relevance for Industrial & Manufacturing Investors"]
              ),
              indicativeSources: toText(row["Key Sources / Notes"]),
            };
          }

          if (sheetName === "Future Development Plans") {
            entry.metadata.sustainabilityEnvironment.futureDevelopmentPlans = {
              sustainabilityLinkedIndustrialDevelopmentPlans: toText(
                row["Sustainability-linked Industrial Development Plans"]
              ),
              statusOfPlans: toText(row["Status of Plans"]),
              timeHorizonIndicated: toText(row["Time Horizon Indicated"]),
              roleEnvisionedForForeignPrivateInvestors: toText(
                row["Role Envisioned for Foreign / Private Investors"]
              ),
              strategicImplicationsForGermanIndustrialFirms: toText(
                row["Strategic Implications for German Industrial Firms"]
              ),
              indicativeSources: toText(row["Indicative Sources"]),
            };
          }
        }

        // =========================
        // CHAPTER 11 - SWOT
        // =========================
        if (fileName.includes("Chapter 11")) {
          entry.metadata.swot = {
            strengths: toText(row["Strengths"]),
            weaknesses: toText(row["Weaknesses"]),
            opportunities: toText(row["Opportunities"]),
            threats: toText(row["Threats"]),
          };
        }

        // =========================
        // CHAPTER 12 - Conclusion
        // =========================
        if (fileName.includes("Chapter 12")) {
          entry.metadata.conclusion = {
            gicStarRating: toText(row["GIC Star Rating"]),
            investmentAttractivenessSignal: toText(
              row["Investment Attractiveness Signal"]
            ),
            rationaleIndustrialInvestability: toText(
              row["Rationale (industrial investability)"]
            ),
          };
        }
      }
    }
  }

  return countryMap;
}

export async function hydrateProductMetadataFromXlsx() {
  const productCollection = getCollection("products");
  const baseDir = process.cwd(); // change this if your xlsx files are elsewhere

  const countryMap = buildMetadataFromFiles(baseDir);

  for (const [normalizedCountry, entry] of Object.entries(countryMap)) {
    await productCollection.updateOne(
      {
        $or: [
          { name: entry.name },
          { name: { $regex: new RegExp(`^${entry.name}$`, "i") } },
          { subRegion: entry.subRegion, name: { $regex: new RegExp(entry.name, "i") } },
        ],
      },
      {
        $set: {
          metadata: entry.metadata,
          sourceFiles: Array.from(entry.sourceFiles),
          sourceSheets: Array.from(entry.sourceSheets),
        },
      }
    );
  }

  
  console.log(`Metadata hydrated for ${Object.keys(countryMap).length} countries`);
}