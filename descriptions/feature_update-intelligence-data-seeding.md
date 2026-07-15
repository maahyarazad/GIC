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


## Feature - Use refreshToken to renew the token

## Description

1. Update the **`adminauth.middleware.ts`** and **`adminauth.middleware.ts`** files and enable using the refresh token if that is available to reissue new token
2. Update the logic where the token is expired the UI should navigate to login  

```js
      
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../types/user.types";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

export interface AuthRequest extends Request {
  user?: User;
}

export const adminAuthMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role: string;
    };

    if (!["admin", "procurement"].includes(decoded.role)) {
      return res.status(403).json({ message: "Forbidden: Admins only" });
    }

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
        //Check if there is a refresh token then issue another token here and assign it to http secure token
      // token was valid but has expired
      return res.status(401).json({ message: "Token expired", code: "TOKEN_EXPIRED" });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      // malformed, bad signature, etc.
      return res.status(401).json({ message: "Invalid token" });
    }

    console.error("Admin auth error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};



```