# Feature - Update Intelligence Data Seeding

## Description

1. In **`src/initialize_db.ts`**, there is a database seeding script that reads the 12 chapter Excel (`.xlsx`) files from the project's root folder and seeds the database.

2. Add a new pop-up dialog to **`Continent.tsx`** that appears after **`handleInitializeDb`** is triggered. The dialog should display the available data update packages found in **`chapter_data/*`** and allow the administrator to select which dataset should be imported.

3. Create a new **`src/initialize_db.ts`** update script that scans the Excel files located in **`chapter_data/13-07-2026/*.xlsx`**, detects the newly added columns, and updates the existing database records accordingly without reseeding the entire database.




## Part 2 

in the economic insight **`EconomicInsights.tsx`** this line **`const res = await axiosInstance.get<Product[]>(`/products/by-parent/${category._id}`);`** fetch the product no each product has a new meta data object



```js
{
    "conclusion": {
        "gicStarRatings": {
            "gicStarRating": "★★★☆☆",
            "investorConfidenceIndicator": "🟡 Moderate Confidence",
            "rationaleIndustrialInvestability": "Angola's substantial oil wealth funding a genuine diversification agenda, major hydropower buildout (Caculo Cabaça, Laúca), and Lobito Corridor positioning as a regional minerals/logistics hub present real opportunity, offset by heavy continued oil-revenue dependence and infrastructure gaps outside the Luanda/coastal corridor. The Lobito Corridor's battery/copper value-chain integration with Zambia/DRC is a credible medium-term growth vector, though currency and fiscal volatility tied to oil prices require careful financial structuring."
        }
    }
}
```

2. use the new object key value pair and update the cards and the card style


