import {getCollection} from './db';


export async function initializeDatabase() {
  
  const continentCollection = getCollection("continents");
  const productCollection = getCollection("products");
  
  // OPTIONAL: clean existing data (uncomment if needed)
  continentCollection.deleteMany({});
  productCollection.deleteMany({});
  
  // =========================
  // SUB REGIONS
  // =========================
  const subRegions = [
    { name: "North Africa", code: "NA" },
    { name: "East Africa", code: "EA" },
    { name: "West Africa", code: "WA" },
    { name: "Central Africa", code: "CA" },
    { name: "Southern Africa", code: "SAF" },
    { name: "Middle East (Western Asia)", code: "MEWA" }
  ];
  
  const continentMap = {};
  
  subRegions.forEach((region, index) => {
    const doc = {
      name: region.name,
      slug: region.name.toLowerCase().replace(/\s+/g, "-").replace(/[()]/g, ""),
      code: region.code,
      isActive: true,
      order: index + 1,
      parent: null,
      children: [],
      products: [],
      productCodes: [],
      sourceLabel: region.name,
      summary: {
        countryCount: 0,
        chapterCoverage: [],
        notes: null
      }
    };
  
    const res = continentCollection.insertOne(doc);
    //@ts-ignore
    continentMap[region.name] = res.insertedId;
  });
  
  // =========================
  // COUNTRIES (REAL STRUCTURE)
  // =========================
  const countries = [
    // Middle East
    { name: "United Arab Emirates", code: "AE", subRegion: "Middle East (Western Asia)" },
    { name: "Saudi Arabia", code: "SA", subRegion: "Middle East (Western Asia)" },
    { name: "Qatar", code: "QA", subRegion: "Middle East (Western Asia)" },
    { name: "Kuwait", code: "KW", subRegion: "Middle East (Western Asia)" },
    { name: "Oman", code: "OM", subRegion: "Middle East (Western Asia)" },
    { name: "Bahrain", code: "BH", subRegion: "Middle East (Western Asia)" },
    { name: "Jordan", code: "JO", subRegion: "Middle East (Western Asia)" },
  
    // North Africa
    { name: "Egypt", code: "EG", subRegion: "North Africa" },
    { name: "Morocco", code: "MA", subRegion: "North Africa" },
    { name: "Algeria", code: "DZ", subRegion: "North Africa" },
    { name: "Tunisia", code: "TN", subRegion: "North Africa" },
  
    // West Africa
    { name: "Nigeria", code: "NG", subRegion: "West Africa" },
    { name: "Ghana", code: "GH", subRegion: "West Africa" },
    { name: "Senegal", code: "SN", subRegion: "West Africa" },
  
    // East Africa
    { name: "Kenya", code: "KE", subRegion: "East Africa" },
    { name: "Ethiopia", code: "ET", subRegion: "East Africa" },
    { name: "Tanzania", code: "TZ", subRegion: "East Africa" },
  
    // Central Africa
    { name: "Cameroon", code: "CM", subRegion: "Central Africa" },
    { name: "Gabon", code: "GA", subRegion: "Central Africa" },
  
    // Southern Africa
    { name: "South Africa", code: "ZA", subRegion: "Southern Africa" },
    { name: "Namibia", code: "NA", subRegion: "Southern Africa" }
  ];
  
  // =========================
  // INSERT COUNTRIES
  // =========================
  countries.forEach((c, index) => {
    const continentId = continentMap[c.subRegion];
  
    const product = {
      fileId: `country_${c.code.toLowerCase()}`,
      name: c.name,
      slug: c.name.toLowerCase().replace(/\s+/g, "-"),
      code: c.code,
      subRegion: c.subRegion,
      parent: continentId,
      children: [],
      recommended: [],
      tags: ["country"],
      importance: "A",
      downloadCount: 0,
      isActive: true,
      order: index + 1,
      metadata: {
        economicFundamentals: null,
        demographicsWorkforce: null,
        infrastructureLogistics: null,
        businessTradeEnvironment: null,
        swot: null,
        conclusion: null
      },
      sourceFiles: [],
      sourceSheets: []
    };
  
    const res = productCollection.insertOne(product);
  
    // link to continent
    
    continentCollection.updateOne(
      { _id: continentId },
      {
        $push: {
          //@ts-ignore
          products: res.insertedId,productCodes: c.code
        },
        $inc: { "summary.countryCount": 1 }
      }
    );
  });

  console.log("DB initialized");
}