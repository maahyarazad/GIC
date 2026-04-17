/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import type { TsoaRoute } from '@tsoa/runtime';
import {  fetchMiddlewares, ExpressTemplateService } from '@tsoa/runtime';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { UserController } from './../controllers/user.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { SSOController } from './../controllers/sso.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { SitemapController } from './../controllers/sitemap.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ProductController } from './../controllers/product.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { OtpController } from './../controllers/otp.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { NewsletterController } from './../controllers/newsletter.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { LogController } from './../controllers/log.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { FileController } from './../controllers/file.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { EventController } from './../controllers/event.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { EmailTemplateController } from './../controllers/email.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ContinentController } from './../controllers/continent.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ContactUsController } from './../controllers/contactus.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ClientController } from './../controllers/client.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { AuthController } from './../controllers/auth.controller';
import type { Request as ExRequest, Response as ExResponse, RequestHandler, Router } from 'express';
const multer = require('multer');




// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

const models: TsoaRoute.Models = {
    "UserSortKey": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["name"]},{"dataType":"enum","enums":["email"]},{"dataType":"enum","enums":["createdAt"]},{"dataType":"enum","enums":["role"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UserRole": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["user"]},{"dataType":"enum","enums":["admin"]},{"dataType":"enum","enums":["superadmin"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SocialLink": {
        "dataType": "refObject",
        "properties": {
            "platform": {"dataType":"string","required":true},
            "url": {"dataType":"string","required":true},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UserProfile": {
        "dataType": "refObject",
        "properties": {
            "photo": {"dataType":"string"},
            "title": {"dataType":"string"},
            "description": {"dataType":"string"},
            "socialLinks": {"dataType":"array","array":{"dataType":"refObject","ref":"SocialLink"}},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Pick_User.Exclude_keyofUser.password__": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"name":{"dataType":"string","required":true},"email":{"dataType":"string","required":true},"createdAt":{"dataType":"datetime"},"role":{"ref":"UserRole"},"phone":{"dataType":"string"},"orders":{"dataType":"array","array":{"dataType":"string"}},"addresses":{"dataType":"array","array":{"dataType":"string"}},"authorize":{"dataType":"boolean","required":true},"googleId":{"dataType":"string"},"facebookId":{"dataType":"string"},"avatar":{"dataType":"string"},"profile":{"ref":"UserProfile"},"remarks":{"dataType":"string"},"requirePasswordChange":{"dataType":"boolean","required":true},"_id":{"dataType":"string"},"updatedAt":{"dataType":"datetime"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Omit_User.password_": {
        "dataType": "refAlias",
        "type": {"ref":"Pick_User.Exclude_keyofUser.password__","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateUserRequest": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "email": {"dataType":"string","required":true},
            "password": {"dataType":"string","required":true},
            "phone": {"dataType":"string","required":true},
            "role": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["user"]},{"dataType":"enum","enums":["admin"]}]},
            "authorize": {"dataType":"boolean"},
            "remarks": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateUserRequest": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string"},
            "email": {"dataType":"string"},
            "password": {"dataType":"string"},
            "phone": {"dataType":"string"},
            "role": {"ref":"UserRole"},
            "authorize": {"dataType":"boolean"},
            "profile": {"ref":"UserProfile"},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ProductContent": {
        "dataType": "refObject",
        "properties": {
            "description": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "shortDescription": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "highlights": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"string"}},{"dataType":"enum","enums":[null]}]},
            "features": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"string"}},{"dataType":"enum","enums":[null]}]},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ProductVariant": {
        "dataType": "refObject",
        "properties": {
            "variantName": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "variantValue": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ProductMedia": {
        "dataType": "refObject",
        "properties": {
            "images": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"string"}},{"dataType":"enum","enums":[null]}]},
            "imageAlt": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "video": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "seoTitle": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "seoDescription": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "seoKeywords": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"string"}},{"dataType":"enum","enums":[null]}]},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ProductImportance": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["A"]},{"dataType":"enum","enums":["B"]},{"dataType":"enum","enums":["C"]},{"dataType":"enum","enums":["D"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ProductMetadata": {
        "dataType": "refObject",
        "properties": {
            "economicFundamentals": {"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"gdpGrowthRate2024":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"vatOrSalesTaxPct":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"importDutyPct":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"incomeTaxRate":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"publicDebtPctGdp2024":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"landSizeSqKm2024":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"averageAge2024":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"avgSchooling2024":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"literacyRate2024":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"youthUnemploymentRate2024":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"avgUnemploymentRate2024":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"averageHdi2023To2024":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"latestGiniIndex":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"avgAnnualGrowth2019To2024":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"nominalGdpUsdBn":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"string"},{"dataType":"enum","enums":[null]}]}}},{"dataType":"enum","enums":[null]}]},
            "demographicsWorkforce": {"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"geographicDistributionNotes":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"ruralPopulationPct":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"urbanPopulationPct":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"laborMarketFeatures":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"tertiaryEducation":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"skillStatus":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"deathRatePer1000":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"birthRatePer1000":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"primaryReligion":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"populationGrowthRatePct":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"string"},{"dataType":"enum","enums":[null]}]}}},{"dataType":"enum","enums":[null]}]},
            "naturalIndustrialResources": {"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"industrialBaseStrength2024":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"mainResources":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]}}},{"dataType":"enum","enums":[null]}]},
            "currencyFinancialClimate": {"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"interestRatePct":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"inflationRatePct":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"paymentSystem2024":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"bankingSystem2024":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"averagePriceStandardGoods":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"chicken1Kg":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"rice1Kg":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"eggs12":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"breadLoafUsd":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"milk1L":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"string"},{"dataType":"enum","enums":[null]}]}}},{"dataType":"enum","enums":[null]}]},"currencyStability2024":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"currencyStrengthAcceptance":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"currencyCode":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]}}},{"dataType":"enum","enums":[null]}]},
            "infrastructureLogistics": {"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"logisticsRanking":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"lpiTotalScore":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"string"},{"dataType":"enum","enums":[null]}]}}},{"dataType":"enum","enums":[null]}]},"deliveryTimes":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"portDeliveryTimeDays":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"mainPort":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]}}},{"dataType":"enum","enums":[null]}]},"portsAirportsCapacity":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"cargoCapacityTonnes":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"airportPassengerCapacity":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"majorAirports":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"portCapacity":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"majorPorts":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]}}},{"dataType":"enum","enums":[null]}]},"nri2024Score":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"infrastructureReadinessGlobalRank":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"infrastructureReadinessIndexScore":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"string"},{"dataType":"enum","enums":[null]}]}}},{"dataType":"enum","enums":[null]}]},
            "governanceStability": {"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"significantHistoricEvents":{"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"sourceYear":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"businessInvestmentImpact":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"year":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"historicEvent":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]}}}},{"dataType":"enum","enums":[null]}]},"warTerrorismRisks":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"sourceYear":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"keyGroupsActors":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"riskLevel":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"conflictTerrorismThreats":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]}}},{"dataType":"enum","enums":[null]}]},"securitySafety":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"sourceYear":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"lawEnforcementReliability":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"businessSecurityRisk":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"crimeSafetyLevel":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]}}},{"dataType":"enum","enums":[null]}]},"internationalRestrictions":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"sourceYear":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"targetedSectorsEntities":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"issuingAuthority":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"restrictionsEmbargoes":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]}}},{"dataType":"enum","enums":[null]}]},"ngoInvolvement":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"sourceYear":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"governmentRelations":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"mainFocusAreas":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"ngoPresenceInfluence":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]}}},{"dataType":"enum","enums":[null]}]},"governmentInPowerPolicies":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"sourceYear":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"keyEconomicIndustrialPoliciesFdi":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"partyCoalition":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"governmentInPower2024":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]}}},{"dataType":"enum","enums":[null]}]},"politicalStability":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"source":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"score":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"string"},{"dataType":"enum","enums":[null]}]}}},{"dataType":"enum","enums":[null]}]}}},{"dataType":"enum","enums":[null]}]},
            "businessTradeEnvironment": {"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"tradingTerms":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"soeDominancePracticalNotes":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"localSupplierPreferenceIcv":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"paymentRiskDelays":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"publicProcurementOpenness":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]}}},{"dataType":"enum","enums":[null]}]},"settingUpNewCompany":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"roleOfFreeZonesSezsForIndustry":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"foreignOwnershipLimitsMainland":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"govFeesLicensingRegistration":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"double"},{"dataType":"enum","enums":[null]}]},"typicalSetupTime":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"minCapitalTypicalIndustrialLlc":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"double"},{"dataType":"enum","enums":[null]}]}}},{"dataType":"enum","enums":[null]}]},"recruitmentLandscape":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"typicalChallengesForForeignIndustrialEmployers":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"localHiringNationalisationRules":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"unionisationIntensity":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"labourAvailabilitySkills":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]}}},{"dataType":"enum","enums":[null]}]},"visasAndLandPurchaseLaws":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"freeZonesIndustrialParksSpecialRules":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"foreignLandOwnershipCoreRule":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"residencyInvestorVisa":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"businessVisaAvailabilityTypical":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]}}},{"dataType":"enum","enums":[null]}]},"investmentProtectionPolicies":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"keyDomesticProtections":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"isdsAvailability":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"icsidMembership":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"bitsWithGermanyOrEu":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]}}},{"dataType":"enum","enums":[null]}]},"tradeAgreements":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"status":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"otherKeyArrangementsRelevantToIndustry":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"customsUnionOrRecIndustrialFocus":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"euFtaAssociationIndustrialGoods":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]}}},{"dataType":"enum","enums":[null]}]},"easeOfDoingBusiness":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"statusNote":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"year":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"overallScore":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"globalRankOf190":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"string"},{"dataType":"enum","enums":[null]}]}}},{"dataType":"enum","enums":[null]}]}}},{"dataType":"enum","enums":[null]}]},
            "educationResearchHumanCapital": {"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"workforceDevelopmentPrograms":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"effectivenessForIndustrialInvestors":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"multinationalsDonorsInvolved":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"publicPrivateWorkforceInitiatives":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"nationalSkillsHumanCapitalStrategy2022To2025":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]}}},{"dataType":"enum","enums":[null]}]},"trainingVocationalAvailable":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"employerInvolvementImplications":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"governmentDonorTvetPrograms":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"alignmentWithIndustrialSkills":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"tvetVocationalSystem":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]}}},{"dataType":"enum","enums":[null]}]},"universitiesSchoolsQuality":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"universityIndustryLinks":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"researchInternationalCollaboration":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"stemEngineeringStrength":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"rankedUniversities2022To2025":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]}}},{"dataType":"enum","enums":[null]}]}}},{"dataType":"enum","enums":[null]}]},
            "industrialManufacturingStrengths": {"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"investmentReadiness":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"oneSentenceJustification":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"readiness":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]}}},{"dataType":"enum","enums":[null]}]},"germanProductsCompanies":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"notableGermanBackedProjectsQualifiers":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"germanProductsCommonlyImportedDirectional":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"germanOemsIndustrialOperationsExamples":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]}}},{"dataType":"enum","enums":[null]}]},"governmentIncentives":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"exportOrientedIncentives":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"localContentLocalisation":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"taxCustomsIncentives":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"industrialZonesSezs":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]}}},{"dataType":"enum","enums":[null]}]},"keySectors":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"maturityQualifier":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"secondaryEmergingSectors":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"primaryManufacturingSectors":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]}}},{"dataType":"enum","enums":[null]}]}}},{"dataType":"enum","enums":[null]}]},
            "sustainabilityEnvironment": {"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"futureDevelopmentPlans":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"indicativeSources":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"strategicImplicationsForGermanIndustrialFirms":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"roleEnvisionedForForeignPrivateInvestors":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"timeHorizonIndicated":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"statusOfPlans":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"sustainabilityLinkedIndustrialDevelopmentPlans":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]}}},{"dataType":"enum","enums":[null]}]},"environmentalInitiatives":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"indicativeSources":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"relevanceForIndustrialManufacturingInvestors":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"implementationSignal":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"circularEconomyResourceEfficiencyInitiatives":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"carbonClimatePolicyInstrumentsAffectingIndustry":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"renewableCleanEnergyInitiativesRelevantToIndustry":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]}}},{"dataType":"enum","enums":[null]}]},"wasteManagementPolicies":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"indicativeSources":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"keyGapsConstraints":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"roleOfPrivateSectorPpps":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"implementationEnforcementSignal":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"wasteStreamsExplicitlyAddressed":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"documentedNationalWasteManagementPolicyStrategy":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]}}},{"dataType":"enum","enums":[null]}]}}},{"dataType":"enum","enums":[null]}]},
            "swot": {"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"threats":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"opportunities":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"weaknesses":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"strengths":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]}}},{"dataType":"enum","enums":[null]}]},
            "conclusion": {"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"rationaleIndustrialInvestability":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"investmentAttractivenessSignal":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"gicStarRating":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"double"},{"dataType":"enum","enums":[null]}]}}},{"dataType":"enum","enums":[null]}]},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateProductRequest": {
        "dataType": "refObject",
        "properties": {
            "fileId": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "slug": {"dataType":"string","required":true},
            "code": {"dataType":"string","required":true},
            "subRegion": {"dataType":"string","required":true},
            "content": {"dataType":"union","subSchemas":[{"ref":"ProductContent"},{"dataType":"enum","enums":[null]}]},
            "variant": {"dataType":"union","subSchemas":[{"ref":"ProductVariant"},{"dataType":"enum","enums":[null]}]},
            "media": {"dataType":"union","subSchemas":[{"ref":"ProductMedia"},{"dataType":"enum","enums":[null]}]},
            "tags": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"string"}},{"dataType":"enum","enums":[null]}]},
            "downloadCount": {"dataType":"double"},
            "importance": {"ref":"ProductImportance","required":true},
            "parent": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "children": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"string"}},{"dataType":"enum","enums":[null]}]},
            "recommended": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"string"}},{"dataType":"enum","enums":[null]}]},
            "metadata": {"dataType":"union","subSchemas":[{"ref":"ProductMetadata"},{"dataType":"enum","enums":[null]}]},
            "sourceFiles": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"string"}},{"dataType":"enum","enums":[null]}]},
            "sourceSheets": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"string"}},{"dataType":"enum","enums":[null]}]},
            "isActive": {"dataType":"boolean"},
            "order": {"dataType":"double"},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Product": {
        "dataType": "refObject",
        "properties": {
            "_id": {"dataType":"string"},
            "createdAt": {"dataType":"datetime"},
            "updatedAt": {"dataType":"datetime"},
            "fileId": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "slug": {"dataType":"string","required":true},
            "code": {"dataType":"string","required":true},
            "subRegion": {"dataType":"string","required":true},
            "parent": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "content": {"dataType":"union","subSchemas":[{"ref":"ProductContent"},{"dataType":"enum","enums":[null]}],"required":true},
            "variant": {"dataType":"union","subSchemas":[{"ref":"ProductVariant"},{"dataType":"enum","enums":[null]}],"required":true},
            "media": {"dataType":"union","subSchemas":[{"ref":"ProductMedia"},{"dataType":"enum","enums":[null]}],"required":true},
            "tags": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"string"}},{"dataType":"enum","enums":[null]}],"required":true},
            "downloadCount": {"dataType":"double","required":true},
            "importance": {"ref":"ProductImportance","required":true},
            "children": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"string"}},{"dataType":"enum","enums":[null]}],"required":true},
            "recommended": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"string"}},{"dataType":"enum","enums":[null]}],"required":true},
            "metadata": {"dataType":"union","subSchemas":[{"ref":"ProductMetadata"},{"dataType":"enum","enums":[null]}]},
            "sourceFiles": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"string"}},{"dataType":"enum","enums":[null]}]},
            "sourceSheets": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"string"}},{"dataType":"enum","enums":[null]}]},
            "isActive": {"dataType":"boolean"},
            "order": {"dataType":"double"},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ProductSortKey": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["fileId"]},{"dataType":"enum","enums":["name"]},{"dataType":"enum","enums":["code"]},{"dataType":"enum","enums":["downloadCount"]},{"dataType":"enum","enums":["importance"]},{"dataType":"enum","enums":["createdAt"]},{"dataType":"enum","enums":["updatedAt"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SortOrder": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["asc"]},{"dataType":"enum","enums":["desc"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateProductRequest": {
        "dataType": "refObject",
        "properties": {
            "fileId": {"dataType":"string"},
            "name": {"dataType":"string"},
            "slug": {"dataType":"string"},
            "code": {"dataType":"string"},
            "subRegion": {"dataType":"string"},
            "content": {"ref":"ProductContent"},
            "variant": {"ref":"ProductVariant"},
            "media": {"ref":"ProductMedia"},
            "tags": {"dataType":"array","array":{"dataType":"string"}},
            "downloadCount": {"dataType":"double"},
            "importance": {"ref":"ProductImportance"},
            "parent": {"dataType":"string"},
            "children": {"dataType":"array","array":{"dataType":"string"}},
            "recommended": {"dataType":"array","array":{"dataType":"string"}},
            "metadata": {"ref":"ProductMetadata"},
            "sourceFiles": {"dataType":"array","array":{"dataType":"string"}},
            "sourceSheets": {"dataType":"array","array":{"dataType":"string"}},
            "isActive": {"dataType":"boolean"},
            "order": {"dataType":"double"},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ErrorResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"timestamp":{"dataType":"string","required":true},"error":{"dataType":"nestedObjectLiteral","nestedProperties":{"details":{"dataType":"any"},"code":{"dataType":"string"},"message":{"dataType":"string","required":true}},"required":true},"message":{"dataType":"string","required":true},"success":{"dataType":"enum","enums":[false],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SuccessResponse__otpSent-boolean__": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"pagination":{"dataType":"nestedObjectLiteral","nestedProperties":{"pages":{"dataType":"double","required":true},"total":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},"timestamp":{"dataType":"string","required":true},"data":{"dataType":"nestedObjectLiteral","nestedProperties":{"otpSent":{"dataType":"boolean","required":true}}},"message":{"dataType":"string"},"success":{"dataType":"enum","enums":[true],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SendOtpBody": {
        "dataType": "refObject",
        "properties": {
            "email": {"dataType":"string"},
            "mobile_number": {"dataType":"string"},
            "origin": {"dataType":"string"},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SuccessResponse_any_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"pagination":{"dataType":"nestedObjectLiteral","nestedProperties":{"pages":{"dataType":"double","required":true},"total":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},"timestamp":{"dataType":"string","required":true},"data":{"dataType":"any"},"message":{"dataType":"string"},"success":{"dataType":"enum","enums":[true],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SuccessResponse____": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"pagination":{"dataType":"nestedObjectLiteral","nestedProperties":{"pages":{"dataType":"double","required":true},"total":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},"timestamp":{"dataType":"string","required":true},"data":{"dataType":"nestedObjectLiteral","nestedProperties":{}},"message":{"dataType":"string"},"success":{"dataType":"enum","enums":[true],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "OtpCheckBody": {
        "dataType": "refObject",
        "properties": {
            "otp": {"dataType":"string","required":true},
            "registration_code": {"dataType":"string"},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SuccessResponse_unknown_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"pagination":{"dataType":"nestedObjectLiteral","nestedProperties":{"pages":{"dataType":"double","required":true},"total":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},"timestamp":{"dataType":"string","required":true},"data":{"dataType":"any"},"message":{"dataType":"string"},"success":{"dataType":"enum","enums":[true],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "OtpCheckMobileBody": {
        "dataType": "refObject",
        "properties": {
            "otp": {"dataType":"string","required":true},
            "requestId": {"dataType":"any"},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "NewsletterSubscriber": {
        "dataType": "refObject",
        "properties": {
            "_id": {"dataType":"string"},
            "createdAt": {"dataType":"datetime"},
            "updatedAt": {"dataType":"datetime"},
            "email": {"dataType":"string","required":true},
            "active": {"dataType":"boolean","required":true},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SuccessResponse_NewsletterSubscriber_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"pagination":{"dataType":"nestedObjectLiteral","nestedProperties":{"pages":{"dataType":"double","required":true},"total":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},"timestamp":{"dataType":"string","required":true},"data":{"ref":"NewsletterSubscriber"},"message":{"dataType":"string"},"success":{"dataType":"enum","enums":[true],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_NewsletterSubscriber_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"SuccessResponse_NewsletterSubscriber_"},{"ref":"ErrorResponse"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateNewsletterSubscriberRequest": {
        "dataType": "refObject",
        "properties": {
            "email": {"dataType":"string","required":true},
            "active": {"dataType":"boolean"},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_any_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"SuccessResponse_any_"},{"ref":"ErrorResponse"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SuccessResponse_null_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"pagination":{"dataType":"nestedObjectLiteral","nestedProperties":{"pages":{"dataType":"double","required":true},"total":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},"timestamp":{"dataType":"string","required":true},"data":{"dataType":"enum","enums":[null]},"message":{"dataType":"string"},"success":{"dataType":"enum","enums":[true],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_null_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"SuccessResponse_null_"},{"ref":"ErrorResponse"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UploadedFileDoc": {
        "dataType": "refObject",
        "properties": {
            "filename": {"dataType":"string","required":true},
            "mimetype": {"dataType":"string","required":true},
            "extension": {"dataType":"string","required":true},
            "path": {"dataType":"string","required":true},
            "size": {"dataType":"double","required":true},
            "createdAt": {"dataType":"datetime","required":true},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SuccessResponse__files-UploadedFileDoc-Array--total-number__": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"pagination":{"dataType":"nestedObjectLiteral","nestedProperties":{"pages":{"dataType":"double","required":true},"total":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},"timestamp":{"dataType":"string","required":true},"data":{"dataType":"nestedObjectLiteral","nestedProperties":{"total":{"dataType":"double","required":true},"files":{"dataType":"array","array":{"dataType":"refObject","ref":"UploadedFileDoc"},"required":true}}},"message":{"dataType":"string"},"success":{"dataType":"enum","enums":[true],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse__files-UploadedFileDoc-Array--total-number__": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"SuccessResponse__files-UploadedFileDoc-Array--total-number__"},{"ref":"ErrorResponse"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "EmailTemplate": {
        "dataType": "refObject",
        "properties": {
            "_id": {"dataType":"string"},
            "createdAt": {"dataType":"datetime"},
            "updatedAt": {"dataType":"datetime"},
            "name": {"dataType":"string","required":true},
            "subject": {"dataType":"string","required":true},
            "html": {"dataType":"string","required":true},
            "text": {"dataType":"string"},
            "variables": {"dataType":"array","array":{"dataType":"string"}},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SuccessResponse_EmailTemplate_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"pagination":{"dataType":"nestedObjectLiteral","nestedProperties":{"pages":{"dataType":"double","required":true},"total":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},"timestamp":{"dataType":"string","required":true},"data":{"ref":"EmailTemplate"},"message":{"dataType":"string"},"success":{"dataType":"enum","enums":[true],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_EmailTemplate_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"SuccessResponse_EmailTemplate_"},{"ref":"ErrorResponse"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateEmailTemplateRequest": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "subject": {"dataType":"string","required":true},
            "html": {"dataType":"string","required":true},
            "text": {"dataType":"string"},
            "variables": {"dataType":"array","array":{"dataType":"string"}},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SuccessResponse_EmailTemplate-Array_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"pagination":{"dataType":"nestedObjectLiteral","nestedProperties":{"pages":{"dataType":"double","required":true},"total":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},"timestamp":{"dataType":"string","required":true},"data":{"dataType":"array","array":{"dataType":"refObject","ref":"EmailTemplate"}},"message":{"dataType":"string"},"success":{"dataType":"enum","enums":[true],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_EmailTemplate-Array_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"SuccessResponse_EmailTemplate-Array_"},{"ref":"ErrorResponse"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateEmailTemplateRequest": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string"},
            "subject": {"dataType":"string"},
            "html": {"dataType":"string"},
            "text": {"dataType":"string"},
            "variables": {"dataType":"array","array":{"dataType":"string"}},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Record_string.unknown_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"dataType":"any"},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateContinentRequest": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "slug": {"dataType":"string","required":true},
            "code": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "description": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "products": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"string"}},{"dataType":"enum","enums":[null]}]},
            "productCodes": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"string"}},{"dataType":"enum","enums":[null]}]},
            "productObjects": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"refObject","ref":"Product"}},{"dataType":"enum","enums":[null]}]},
            "parent": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "children": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"string"}},{"dataType":"enum","enums":[null]}]},
            "isActive": {"dataType":"boolean"},
            "order": {"dataType":"double"},
            "image": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "imageAlt": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "seoTitle": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "seoDescription": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "seoKeywords": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"string"}},{"dataType":"enum","enums":[null]}]},
            "sourceLabel": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "summary": {"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"notes":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"chapterCoverage":{"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"string"}},{"dataType":"enum","enums":[null]}]},"countryCount":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}]}}},{"dataType":"enum","enums":[null]}]},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateContinentRequest": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string"},
            "slug": {"dataType":"string"},
            "code": {"dataType":"string"},
            "description": {"dataType":"string"},
            "products": {"dataType":"array","array":{"dataType":"string"}},
            "productCodes": {"dataType":"array","array":{"dataType":"string"}},
            "productObjects": {"dataType":"array","array":{"dataType":"refObject","ref":"Product"}},
            "parent": {"dataType":"string"},
            "children": {"dataType":"array","array":{"dataType":"string"}},
            "isActive": {"dataType":"boolean"},
            "order": {"dataType":"double"},
            "image": {"dataType":"string"},
            "imageAlt": {"dataType":"string"},
            "seoTitle": {"dataType":"string"},
            "seoDescription": {"dataType":"string"},
            "seoKeywords": {"dataType":"array","array":{"dataType":"string"}},
            "sourceLabel": {"dataType":"string"},
            "summary": {"dataType":"nestedObjectLiteral","nestedProperties":{"notes":{"dataType":"string"},"chapterCoverage":{"dataType":"array","array":{"dataType":"string"}},"countryCount":{"dataType":"double"}}},
            "_id": {"dataType":"string"},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ContinentSortKey": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["name"]},{"dataType":"enum","enums":["slug"]},{"dataType":"enum","enums":["createdAt"]},{"dataType":"enum","enums":["order"]},{"dataType":"enum","enums":["isActive"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ContactUsSortKey": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["fullName"]},{"dataType":"enum","enums":["company"]},{"dataType":"enum","enums":["email"]},{"dataType":"enum","enums":["industry"]},{"dataType":"enum","enums":["countryOfInterest"]},{"dataType":"enum","enums":["meaObjective"]},{"dataType":"enum","enums":["referredBy"]},{"dataType":"enum","enums":["createdAt"]},{"dataType":"enum","enums":["updatedAt"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SuccessResponse__token-string__": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"pagination":{"dataType":"nestedObjectLiteral","nestedProperties":{"pages":{"dataType":"double","required":true},"total":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},"timestamp":{"dataType":"string","required":true},"data":{"dataType":"nestedObjectLiteral","nestedProperties":{"token":{"dataType":"string","required":true}}},"message":{"dataType":"string"},"success":{"dataType":"enum","enums":[true],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse__token-string__": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"SuccessResponse__token-string__"},{"ref":"ErrorResponse"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SuccessResponse_Omit_User.password__": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"pagination":{"dataType":"nestedObjectLiteral","nestedProperties":{"pages":{"dataType":"double","required":true},"total":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},"timestamp":{"dataType":"string","required":true},"data":{"ref":"Omit_User.password_"},"message":{"dataType":"string"},"success":{"dataType":"enum","enums":[true],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_Omit_User.password__": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"SuccessResponse_Omit_User.password__"},{"ref":"ErrorResponse"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LoginModel": {
        "dataType": "refObject",
        "properties": {
            "userName": {"dataType":"string","required":true},
            "userEmail": {"dataType":"string","required":true},
            "password": {"dataType":"string","required":true},
            "rememberMe": {"dataType":"boolean","required":true},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
};
const templateService = new ExpressTemplateService(models, {"noImplicitAdditionalProperties":"ignore","bodyCoercion":true});

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa




export function RegisterRoutes(app: Router,opts?:{multer?:ReturnType<typeof multer>}) {

    // ###########################################################################################################
    //  NOTE: If you do not see routes for all of your controllers in this file, then you might not have informed tsoa of where to look
    //      Please look into the "controllerPathGlobs" config option described in the readme: https://github.com/lukeautry/tsoa
    // ###########################################################################################################

    const upload = opts?.multer ||  multer({"limits":{"fileSize":8388608}});

    
        const argsUserController_getAllUsers: Record<string, TsoaRoute.ParameterSchema> = {
                filtersJson: {"in":"query","name":"filters","dataType":"string"},
                limit: {"default":20,"in":"query","name":"limit","dataType":"double"},
                skip: {"default":0,"in":"query","name":"skip","dataType":"double"},
                sortBy: {"default":"name","in":"query","name":"sortBy","ref":"UserSortKey"},
                sortOrder: {"default":"asc","in":"query","name":"sortOrder","dataType":"union","subSchemas":[{"dataType":"enum","enums":["asc"]},{"dataType":"enum","enums":["desc"]}]},
        };
        app.get('/api/v1/users',
            ...(fetchMiddlewares<RequestHandler>(UserController)),
            ...(fetchMiddlewares<RequestHandler>(UserController.prototype.getAllUsers)),

            async function UserController_getAllUsers(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUserController_getAllUsers, request, response });

                const controller = new UserController();

              await templateService.apiHandler({
                methodName: 'getAllUsers',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsUserController_createUser: Record<string, TsoaRoute.ParameterSchema> = {
                userData: {"in":"body","name":"userData","required":true,"ref":"CreateUserRequest"},
        };
        app.post('/api/v1/users',
            ...(fetchMiddlewares<RequestHandler>(UserController)),
            ...(fetchMiddlewares<RequestHandler>(UserController.prototype.createUser)),

            async function UserController_createUser(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUserController_createUser, request, response });

                const controller = new UserController();

              await templateService.apiHandler({
                methodName: 'createUser',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsUserController_getUserById: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/v1/users/:id',
            ...(fetchMiddlewares<RequestHandler>(UserController)),
            ...(fetchMiddlewares<RequestHandler>(UserController.prototype.getUserById)),

            async function UserController_getUserById(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUserController_getUserById, request, response });

                const controller = new UserController();

              await templateService.apiHandler({
                methodName: 'getUserById',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsUserController_updateUser: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"UpdateUserRequest"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.put('/api/v1/users/:id',
            ...(fetchMiddlewares<RequestHandler>(UserController)),
            ...(fetchMiddlewares<RequestHandler>(UserController.prototype.updateUser)),

            async function UserController_updateUser(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUserController_updateUser, request, response });

                const controller = new UserController();

              await templateService.apiHandler({
                methodName: 'updateUser',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsUserController_authorizeUser: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.put('/api/v1/users/:id/authorize',
            ...(fetchMiddlewares<RequestHandler>(UserController)),
            ...(fetchMiddlewares<RequestHandler>(UserController.prototype.authorizeUser)),

            async function UserController_authorizeUser(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUserController_authorizeUser, request, response });

                const controller = new UserController();

              await templateService.apiHandler({
                methodName: 'authorizeUser',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSSOController_getSSOToken: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.get('/api/v1/sso',
            ...(fetchMiddlewares<RequestHandler>(SSOController)),
            ...(fetchMiddlewares<RequestHandler>(SSOController.prototype.getSSOToken)),

            async function SSOController_getSSOToken(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSSOController_getSSOToken, request, response });

                const controller = new SSOController();

              await templateService.apiHandler({
                methodName: 'getSSOToken',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSitemapController_getSitemap: Record<string, TsoaRoute.ParameterSchema> = {
                res: {"in":"res","name":"200","required":true,"dataType":"string"},
                resError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
        };
        app.get('/sitemap.xml',
            ...(fetchMiddlewares<RequestHandler>(SitemapController)),
            ...(fetchMiddlewares<RequestHandler>(SitemapController.prototype.getSitemap)),

            async function SitemapController_getSitemap(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSitemapController_getSitemap, request, response });

                const controller = new SitemapController();

              await templateService.apiHandler({
                methodName: 'getSitemap',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsProductController_createProduct: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"CreateProductRequest"},
        };
        app.post('/api/v1/products',
            ...(fetchMiddlewares<RequestHandler>(ProductController)),
            ...(fetchMiddlewares<RequestHandler>(ProductController.prototype.createProduct)),

            async function ProductController_createProduct(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProductController_createProduct, request, response });

                const controller = new ProductController();

              await templateService.apiHandler({
                methodName: 'createProduct',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsProductController_getAllProducts: Record<string, TsoaRoute.ParameterSchema> = {
                limit: {"default":20,"in":"query","name":"limit","dataType":"double"},
                skip: {"default":0,"in":"query","name":"skip","dataType":"double"},
                sortBy: {"default":"createdAt","in":"query","name":"sortBy","ref":"ProductSortKey"},
                sortOrder: {"default":"desc","in":"query","name":"sortOrder","ref":"SortOrder"},
                name: {"in":"query","name":"name","dataType":"string"},
                importance: {"in":"query","name":"importance","dataType":"union","subSchemas":[{"dataType":"enum","enums":["A"]},{"dataType":"enum","enums":["B"]},{"dataType":"enum","enums":["C"]},{"dataType":"enum","enums":["D"]}]},
                tags: {"in":"query","name":"tags","dataType":"string"},
        };
        app.get('/api/v1/products',
            ...(fetchMiddlewares<RequestHandler>(ProductController)),
            ...(fetchMiddlewares<RequestHandler>(ProductController.prototype.getAllProducts)),

            async function ProductController_getAllProducts(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProductController_getAllProducts, request, response });

                const controller = new ProductController();

              await templateService.apiHandler({
                methodName: 'getAllProducts',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsProductController_getProductById: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/v1/products/:id',
            ...(fetchMiddlewares<RequestHandler>(ProductController)),
            ...(fetchMiddlewares<RequestHandler>(ProductController.prototype.getProductById)),

            async function ProductController_getProductById(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProductController_getProductById, request, response });

                const controller = new ProductController();

              await templateService.apiHandler({
                methodName: 'getProductById',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsProductController_getProductsByParent: Record<string, TsoaRoute.ParameterSchema> = {
                parentId: {"in":"path","name":"parentId","required":true,"dataType":"string"},
        };
        app.get('/api/v1/products/by-parent/:parentId',
            ...(fetchMiddlewares<RequestHandler>(ProductController)),
            ...(fetchMiddlewares<RequestHandler>(ProductController.prototype.getProductsByParent)),

            async function ProductController_getProductsByParent(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProductController_getProductsByParent, request, response });

                const controller = new ProductController();

              await templateService.apiHandler({
                methodName: 'getProductsByParent',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsProductController_updateProduct: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"UpdateProductRequest"},
        };
        app.put('/api/v1/products/:id',
            ...(fetchMiddlewares<RequestHandler>(ProductController)),
            ...(fetchMiddlewares<RequestHandler>(ProductController.prototype.updateProduct)),

            async function ProductController_updateProduct(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProductController_updateProduct, request, response });

                const controller = new ProductController();

              await templateService.apiHandler({
                methodName: 'updateProduct',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsProductController_deleteProduct: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.delete('/api/v1/products/:id',
            ...(fetchMiddlewares<RequestHandler>(ProductController)),
            ...(fetchMiddlewares<RequestHandler>(ProductController.prototype.deleteProduct)),

            async function ProductController_deleteProduct(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProductController_deleteProduct, request, response });

                const controller = new ProductController();

              await templateService.apiHandler({
                methodName: 'deleteProduct',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsOtpController_sendOtpEmail: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"SendOtpBody"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.post('/api/v1/otp/send-email',
            ...(fetchMiddlewares<RequestHandler>(OtpController)),
            ...(fetchMiddlewares<RequestHandler>(OtpController.prototype.sendOtpEmail)),

            async function OtpController_sendOtpEmail(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsOtpController_sendOtpEmail, request, response });

                const controller = new OtpController();

              await templateService.apiHandler({
                methodName: 'sendOtpEmail',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsOtpController_sendOtpMobile: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"SendOtpBody"},
        };
        app.post('/api/v1/otp/send-mobile',
            ...(fetchMiddlewares<RequestHandler>(OtpController)),
            ...(fetchMiddlewares<RequestHandler>(OtpController.prototype.sendOtpMobile)),

            async function OtpController_sendOtpMobile(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsOtpController_sendOtpMobile, request, response });

                const controller = new OtpController();

              await templateService.apiHandler({
                methodName: 'sendOtpMobile',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsOtpController_checkOtpEmail: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"OtpCheckBody"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.post('/api/v1/otp/check-email',
            ...(fetchMiddlewares<RequestHandler>(OtpController)),
            ...(fetchMiddlewares<RequestHandler>(OtpController.prototype.checkOtpEmail)),

            async function OtpController_checkOtpEmail(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsOtpController_checkOtpEmail, request, response });

                const controller = new OtpController();

              await templateService.apiHandler({
                methodName: 'checkOtpEmail',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsOtpController_checkOtpMobile: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"OtpCheckMobileBody"},
        };
        app.post('/api/v1/otp/check-mobile',
            ...(fetchMiddlewares<RequestHandler>(OtpController)),
            ...(fetchMiddlewares<RequestHandler>(OtpController.prototype.checkOtpMobile)),

            async function OtpController_checkOtpMobile(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsOtpController_checkOtpMobile, request, response });

                const controller = new OtpController();

              await templateService.apiHandler({
                methodName: 'checkOtpMobile',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsNewsletterController_createSubscriber: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"CreateNewsletterSubscriberRequest"},
        };
        app.post('/api/v1/newsletter',
            ...(fetchMiddlewares<RequestHandler>(NewsletterController)),
            ...(fetchMiddlewares<RequestHandler>(NewsletterController.prototype.createSubscriber)),

            async function NewsletterController_createSubscriber(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsNewsletterController_createSubscriber, request, response });

                const controller = new NewsletterController();

              await templateService.apiHandler({
                methodName: 'createSubscriber',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsNewsletterController_getSubscribers: Record<string, TsoaRoute.ParameterSchema> = {
                limit: {"default":10,"in":"query","name":"limit","dataType":"double"},
                skip: {"default":0,"in":"query","name":"skip","dataType":"double"},
                sortBy: {"in":"query","name":"sortBy","dataType":"enum","enums":["email","createdAt","_id","updatedAt","active"]},
                sortOrder: {"in":"query","name":"sortOrder","dataType":"union","subSchemas":[{"dataType":"enum","enums":["asc"]},{"dataType":"enum","enums":["desc"]}]},
                filters: {"in":"query","name":"filters","dataType":"string"},
        };
        app.get('/api/v1/newsletter',
            ...(fetchMiddlewares<RequestHandler>(NewsletterController)),
            ...(fetchMiddlewares<RequestHandler>(NewsletterController.prototype.getSubscribers)),

            async function NewsletterController_getSubscribers(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsNewsletterController_getSubscribers, request, response });

                const controller = new NewsletterController();

              await templateService.apiHandler({
                methodName: 'getSubscribers',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsNewsletterController_updateSubscriber: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"active":{"dataType":"boolean"}}},
        };
        app.put('/api/v1/newsletter/:id',
            ...(fetchMiddlewares<RequestHandler>(NewsletterController)),
            ...(fetchMiddlewares<RequestHandler>(NewsletterController.prototype.updateSubscriber)),

            async function NewsletterController_updateSubscriber(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsNewsletterController_updateSubscriber, request, response });

                const controller = new NewsletterController();

              await templateService.apiHandler({
                methodName: 'updateSubscriber',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsNewsletterController_deleteSubscriber: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.delete('/api/v1/newsletter/:id',
            ...(fetchMiddlewares<RequestHandler>(NewsletterController)),
            ...(fetchMiddlewares<RequestHandler>(NewsletterController.prototype.deleteSubscriber)),

            async function NewsletterController_deleteSubscriber(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsNewsletterController_deleteSubscriber, request, response });

                const controller = new NewsletterController();

              await templateService.apiHandler({
                methodName: 'deleteSubscriber',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsLogController_getLogsByTargetId: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/v1/logs/:id',
            ...(fetchMiddlewares<RequestHandler>(LogController)),
            ...(fetchMiddlewares<RequestHandler>(LogController.prototype.getLogsByTargetId)),

            async function LogController_getLogsByTargetId(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsLogController_getLogsByTargetId, request, response });

                const controller = new LogController();

              await templateService.apiHandler({
                methodName: 'getLogsByTargetId',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsFileController_uploadFile: Record<string, TsoaRoute.ParameterSchema> = {
                file: {"in":"formData","name":"file","required":true,"dataType":"file"},
        };
        app.post('/api/v1/files',
            upload.fields([
                {
                    name: "file",
                    maxCount: 1
                }
            ]),
            ...(fetchMiddlewares<RequestHandler>(FileController)),
            ...(fetchMiddlewares<RequestHandler>(FileController.prototype.uploadFile)),

            async function FileController_uploadFile(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsFileController_uploadFile, request, response });

                const controller = new FileController();

              await templateService.apiHandler({
                methodName: 'uploadFile',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsFileController_getFiles: Record<string, TsoaRoute.ParameterSchema> = {
                limit: {"default":10,"in":"query","name":"limit","dataType":"double"},
                skip: {"default":0,"in":"query","name":"skip","dataType":"double"},
                sortBy: {"in":"query","name":"sortBy","dataType":"enum","enums":["createdAt","filename","mimetype","extension","path","size"]},
                sortOrder: {"in":"query","name":"sortOrder","dataType":"union","subSchemas":[{"dataType":"enum","enums":["asc"]},{"dataType":"enum","enums":["desc"]}]},
                filters: {"in":"query","name":"filters","dataType":"string"},
        };
        app.get('/api/v1/files',
            ...(fetchMiddlewares<RequestHandler>(FileController)),
            ...(fetchMiddlewares<RequestHandler>(FileController.prototype.getFiles)),

            async function FileController_getFiles(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsFileController_getFiles, request, response });

                const controller = new FileController();

              await templateService.apiHandler({
                methodName: 'getFiles',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsFileController_deleteFile: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.delete('/api/v1/files/:id',
            ...(fetchMiddlewares<RequestHandler>(FileController)),
            ...(fetchMiddlewares<RequestHandler>(FileController.prototype.deleteFile)),

            async function FileController_deleteFile(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsFileController_deleteFile, request, response });

                const controller = new FileController();

              await templateService.apiHandler({
                methodName: 'deleteFile',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsEventController_getEvents: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.get('/api/v1/events',
            ...(fetchMiddlewares<RequestHandler>(EventController)),
            ...(fetchMiddlewares<RequestHandler>(EventController.prototype.getEvents)),

            async function EventController_getEvents(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsEventController_getEvents, request, response });

                const controller = new EventController();

              await templateService.apiHandler({
                methodName: 'getEvents',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsEventController_getMyEvents: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.get('/api/v1/my-events',
            ...(fetchMiddlewares<RequestHandler>(EventController)),
            ...(fetchMiddlewares<RequestHandler>(EventController.prototype.getMyEvents)),

            async function EventController_getMyEvents(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsEventController_getMyEvents, request, response });

                const controller = new EventController();

              await templateService.apiHandler({
                methodName: 'getMyEvents',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsEventController_getMyEventQR: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.get('/api/v1/my-events/qr',
            ...(fetchMiddlewares<RequestHandler>(EventController)),
            ...(fetchMiddlewares<RequestHandler>(EventController.prototype.getMyEventQR)),

            async function EventController_getMyEventQR(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsEventController_getMyEventQR, request, response });

                const controller = new EventController();

              await templateService.apiHandler({
                methodName: 'getMyEventQR',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsEmailTemplateController_createTemplate: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"CreateEmailTemplateRequest"},
        };
        app.post('/api/v1/email-templates',
            ...(fetchMiddlewares<RequestHandler>(EmailTemplateController)),
            ...(fetchMiddlewares<RequestHandler>(EmailTemplateController.prototype.createTemplate)),

            async function EmailTemplateController_createTemplate(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsEmailTemplateController_createTemplate, request, response });

                const controller = new EmailTemplateController();

              await templateService.apiHandler({
                methodName: 'createTemplate',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsEmailTemplateController_getTemplates: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/api/v1/email-templates',
            ...(fetchMiddlewares<RequestHandler>(EmailTemplateController)),
            ...(fetchMiddlewares<RequestHandler>(EmailTemplateController.prototype.getTemplates)),

            async function EmailTemplateController_getTemplates(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsEmailTemplateController_getTemplates, request, response });

                const controller = new EmailTemplateController();

              await templateService.apiHandler({
                methodName: 'getTemplates',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsEmailTemplateController_getTemplate: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/v1/email-templates/:id',
            ...(fetchMiddlewares<RequestHandler>(EmailTemplateController)),
            ...(fetchMiddlewares<RequestHandler>(EmailTemplateController.prototype.getTemplate)),

            async function EmailTemplateController_getTemplate(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsEmailTemplateController_getTemplate, request, response });

                const controller = new EmailTemplateController();

              await templateService.apiHandler({
                methodName: 'getTemplate',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsEmailTemplateController_updateTemplate: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"UpdateEmailTemplateRequest"},
        };
        app.put('/api/v1/email-templates/:id',
            ...(fetchMiddlewares<RequestHandler>(EmailTemplateController)),
            ...(fetchMiddlewares<RequestHandler>(EmailTemplateController.prototype.updateTemplate)),

            async function EmailTemplateController_updateTemplate(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsEmailTemplateController_updateTemplate, request, response });

                const controller = new EmailTemplateController();

              await templateService.apiHandler({
                methodName: 'updateTemplate',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsEmailTemplateController_deleteTemplate: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.delete('/api/v1/email-templates/:id',
            ...(fetchMiddlewares<RequestHandler>(EmailTemplateController)),
            ...(fetchMiddlewares<RequestHandler>(EmailTemplateController.prototype.deleteTemplate)),

            async function EmailTemplateController_deleteTemplate(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsEmailTemplateController_deleteTemplate, request, response });

                const controller = new EmailTemplateController();

              await templateService.apiHandler({
                methodName: 'deleteTemplate',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsEmailTemplateController_sendEmail: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                params: {"in":"body","name":"params","required":true,"ref":"Record_string.unknown_"},
        };
        app.post('/api/v1/email-templates/send-email-template/:id',
            ...(fetchMiddlewares<RequestHandler>(EmailTemplateController)),
            ...(fetchMiddlewares<RequestHandler>(EmailTemplateController.prototype.sendEmail)),

            async function EmailTemplateController_sendEmail(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsEmailTemplateController_sendEmail, request, response });

                const controller = new EmailTemplateController();

              await templateService.apiHandler({
                methodName: 'sendEmail',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsContinentController_initializeDB: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/api/v1/continents/initialize_db',
            ...(fetchMiddlewares<RequestHandler>(ContinentController)),
            ...(fetchMiddlewares<RequestHandler>(ContinentController.prototype.initializeDB)),

            async function ContinentController_initializeDB(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsContinentController_initializeDB, request, response });

                const controller = new ContinentController();

              await templateService.apiHandler({
                methodName: 'initializeDB',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsContinentController_createContinent: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"CreateContinentRequest"},
        };
        app.post('/api/v1/continents',
            ...(fetchMiddlewares<RequestHandler>(ContinentController)),
            ...(fetchMiddlewares<RequestHandler>(ContinentController.prototype.createContinent)),

            async function ContinentController_createContinent(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsContinentController_createContinent, request, response });

                const controller = new ContinentController();

              await templateService.apiHandler({
                methodName: 'createContinent',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsContinentController_updateContinent: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"UpdateContinentRequest"},
        };
        app.put('/api/v1/continents/:id',
            ...(fetchMiddlewares<RequestHandler>(ContinentController)),
            ...(fetchMiddlewares<RequestHandler>(ContinentController.prototype.updateContinent)),

            async function ContinentController_updateContinent(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsContinentController_updateContinent, request, response });

                const controller = new ContinentController();

              await templateService.apiHandler({
                methodName: 'updateContinent',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsContinentController_getAllContinents: Record<string, TsoaRoute.ParameterSchema> = {
                filtersJson: {"in":"query","name":"filters","dataType":"string"},
                limit: {"default":20,"in":"query","name":"limit","dataType":"double"},
                skip: {"default":0,"in":"query","name":"skip","dataType":"double"},
                sortBy: {"default":"name","in":"query","name":"sortBy","ref":"ContinentSortKey"},
                sortOrder: {"default":"asc","in":"query","name":"sortOrder","dataType":"union","subSchemas":[{"dataType":"enum","enums":["asc"]},{"dataType":"enum","enums":["desc"]}]},
        };
        app.get('/api/v1/continents',
            ...(fetchMiddlewares<RequestHandler>(ContinentController)),
            ...(fetchMiddlewares<RequestHandler>(ContinentController.prototype.getAllContinents)),

            async function ContinentController_getAllContinents(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsContinentController_getAllContinents, request, response });

                const controller = new ContinentController();

              await templateService.apiHandler({
                methodName: 'getAllContinents',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsContinentController_getContinentById: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/v1/continents/:id',
            ...(fetchMiddlewares<RequestHandler>(ContinentController)),
            ...(fetchMiddlewares<RequestHandler>(ContinentController.prototype.getContinentById)),

            async function ContinentController_getContinentById(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsContinentController_getContinentById, request, response });

                const controller = new ContinentController();

              await templateService.apiHandler({
                methodName: 'getContinentById',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsContinentController_deleteContinent: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.delete('/api/v1/continents/:id',
            ...(fetchMiddlewares<RequestHandler>(ContinentController)),
            ...(fetchMiddlewares<RequestHandler>(ContinentController.prototype.deleteContinent)),

            async function ContinentController_deleteContinent(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsContinentController_deleteContinent, request, response });

                const controller = new ContinentController();

              await templateService.apiHandler({
                methodName: 'deleteContinent',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsContactUsController_getAllContactUsSubmissions: Record<string, TsoaRoute.ParameterSchema> = {
                filtersJson: {"in":"query","name":"filters","dataType":"string"},
                limit: {"default":20,"in":"query","name":"limit","dataType":"double"},
                skip: {"default":0,"in":"query","name":"skip","dataType":"double"},
                sortBy: {"default":"createdAt","in":"query","name":"sortBy","ref":"ContactUsSortKey"},
                sortOrder: {"default":"desc","in":"query","name":"sortOrder","dataType":"union","subSchemas":[{"dataType":"enum","enums":["asc"]},{"dataType":"enum","enums":["desc"]}]},
        };
        app.get('/api/v1/contact-us',
            ...(fetchMiddlewares<RequestHandler>(ContactUsController)),
            ...(fetchMiddlewares<RequestHandler>(ContactUsController.prototype.getAllContactUsSubmissions)),

            async function ContactUsController_getAllContactUsSubmissions(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsContactUsController_getAllContactUsSubmissions, request, response });

                const controller = new ContactUsController();

              await templateService.apiHandler({
                methodName: 'getAllContactUsSubmissions',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsContactUsController_createUser: Record<string, TsoaRoute.ParameterSchema> = {
                userData: {"in":"body","name":"userData","required":true,"ref":"CreateUserRequest"},
        };
        app.post('/api/v1/contact-us/authorize-user',
            ...(fetchMiddlewares<RequestHandler>(ContactUsController)),
            ...(fetchMiddlewares<RequestHandler>(ContactUsController.prototype.createUser)),

            async function ContactUsController_createUser(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsContactUsController_createUser, request, response });

                const controller = new ContactUsController();

              await templateService.apiHandler({
                methodName: 'createUser',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsClientController_getLargeJson: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/api/v1/client',
            ...(fetchMiddlewares<RequestHandler>(ClientController)),
            ...(fetchMiddlewares<RequestHandler>(ClientController.prototype.getLargeJson)),

            async function ClientController_getLargeJson(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsClientController_getLargeJson, request, response });

                const controller = new ClientController();

              await templateService.apiHandler({
                methodName: 'getLargeJson',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsClientController_updateJson: Record<string, TsoaRoute.ParameterSchema> = {
                updatedJson: {"in":"body","name":"updatedJson","required":true,"dataType":"any"},
        };
        app.put('/api/v1/client/:id',
            ...(fetchMiddlewares<RequestHandler>(ClientController)),
            ...(fetchMiddlewares<RequestHandler>(ClientController.prototype.updateJson)),

            async function ClientController_updateJson(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsClientController_updateJson, request, response });

                const controller = new ClientController();

              await templateService.apiHandler({
                methodName: 'updateJson',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_getGoogleAuthUrl: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/api/v1/auth/google/url',
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.getGoogleAuthUrl)),

            async function AuthController_getGoogleAuthUrl(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_getGoogleAuthUrl, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'getGoogleAuthUrl',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_googleCallback: Record<string, TsoaRoute.ParameterSchema> = {
                code: {"in":"query","name":"code","required":true,"dataType":"string"},
        };
        app.get('/api/v1/auth/google/callback',
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.googleCallback)),

            async function AuthController_googleCallback(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_googleCallback, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'googleCallback',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 302,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_getFacebookAuthUrl: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/api/v1/auth/facebook/url',
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.getFacebookAuthUrl)),

            async function AuthController_getFacebookAuthUrl(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_getFacebookAuthUrl, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'getFacebookAuthUrl',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_facebookCallback: Record<string, TsoaRoute.ParameterSchema> = {
                code: {"in":"query","name":"code","required":true,"dataType":"string"},
        };
        app.get('/api/v1/auth/facebook/callback',
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.facebookCallback)),

            async function AuthController_facebookCallback(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_facebookCallback, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'facebookCallback',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 302,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_getProfile: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.get('/api/v1/auth/profile',
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.getProfile)),

            async function AuthController_getProfile(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_getProfile, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'getProfile',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_verifyToken: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.get('/api/v1/auth/verify-token',
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.verifyToken)),

            async function AuthController_verifyToken(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_verifyToken, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'verifyToken',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_refreshToken: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.post('/api/v1/auth/refresh-token',
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.refreshToken)),

            async function AuthController_refreshToken(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_refreshToken, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'refreshToken',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_loginUser: Record<string, TsoaRoute.ParameterSchema> = {
                userData: {"in":"body","name":"userData","required":true,"ref":"LoginModel"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.post('/api/v1/auth/login',
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.loginUser)),

            async function AuthController_loginUser(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_loginUser, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'loginUser',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_logoutUser: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.post('/api/v1/auth/logout',
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.logoutUser)),

            async function AuthController_logoutUser(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_logoutUser, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'logoutUser',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_resetPassword: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"email":{"dataType":"string","required":true}}},
        };
        app.post('/api/v1/auth/forgot-password',
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.resetPassword)),

            async function AuthController_resetPassword(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_resetPassword, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'resetPassword',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_verifyResetToken: Record<string, TsoaRoute.ParameterSchema> = {
                token: {"in":"query","name":"token","required":true,"dataType":"string"},
        };
        app.get('/api/v1/auth/verify-reset-token',
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.verifyResetToken)),

            async function AuthController_verifyResetToken(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_verifyResetToken, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'verifyResetToken',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_setNewPassword: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"newPassword":{"dataType":"string","required":true},"token":{"dataType":"string","required":true}}},
        };
        app.post('/api/v1/auth/reset-password',
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.setNewPassword)),

            async function AuthController_setNewPassword(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_setNewPassword, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'setNewPassword',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_verifyUnsubscribeResetToken: Record<string, TsoaRoute.ParameterSchema> = {
                token: {"in":"query","name":"token","required":true,"dataType":"string"},
        };
        app.get('/api/v1/auth/verify-unsubscribe-token',
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.verifyUnsubscribeResetToken)),

            async function AuthController_verifyUnsubscribeResetToken(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_verifyUnsubscribeResetToken, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'verifyUnsubscribeResetToken',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa


    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
