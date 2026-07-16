import { BaseModel } from "./base.types";

export type ProductSortKey =
  | "fileId"
  | "name"
  | "code"
  | "downloadCount"
  | "importance"
  | "createdAt"
  | "updatedAt";

export type SortOrder = "asc" | "desc";
export type ProductImportance = "A" | "B" | "C" | "D";

export interface ProductSort {
  key: ProductSortKey;
  order: SortOrder;
}

export type ProductFilter = {
  name?: { $regex: RegExp };
  code?: { $regex: RegExp };
  tags?: string[];
  importance?: ProductImportance;
  subRegion?: string;
};

export interface ProductContent {
  description?: string | null;
  shortDescription?: string | null;
  highlights?: string[] | null;
  features?: string[] | null;
}

export interface ProductVariant {
  variantName?: string | null;
  variantValue?: string | null;
}

export interface ProductMedia {
  images?: string[] | null;
  imageAlt?: string | null;
  video?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string[] | null;
}

export interface ProductMetadata {
  economicFundamentals?: {
    nominalGdpUsdBn?: number | string | null;
    avgAnnualGrowth2019To2024?: number | string | null;
    latestGiniIndex?: number | string | null;
    averageHdi2023To2024?: number | string | null;
    avgUnemploymentRate2024?: number | string | null;
    youthUnemploymentRate2024?: number | string | null;
    literacyRate2024?: number | string | null;
    avgSchooling2024?: number | string | null;
    averageAge2024?: number | string | null;
    landSizeSqKm2024?: number | string | null;
    publicDebtPctGdp2024?: number | string | null;
    incomeTaxRate?: number | string | null;
    importDutyPct?: number | string | null;
    vatOrSalesTaxPct?: number | string | null;
    gdpGrowthRate2024?: number | string | null;
  } | null;

  demographicsWorkforce?: {
    populationGrowthRatePct?: number | string | null;
    primaryReligion?: string | null;
    birthRatePer1000?: number | string | null;
    deathRatePer1000?: number | string | null;
    skillStatus?: string | null;
    tertiaryEducation?: string | null;
    laborMarketFeatures?: string | null;
    urbanPopulationPct?: number | string | null;
    ruralPopulationPct?: number | string | null;
    geographicDistributionNotes?: string | null;
  } | null;

  naturalIndustrialResources?: {
    mainResources?: string | null;
    industrialBaseStrength2024?: string | null;
  } | null;

  currencyFinancialClimate?: {
    currencyCode?: string | null;
    currencyStrengthAcceptance?: string | null;
    currencyStability2024?: string | null;
    averagePriceStandardGoods?: {
      milk1L?: number | string | null;
      breadLoafUsd?: number | string | null;
      eggs12?: number | string | null;
      rice1Kg?: number | string | null;
      chicken1Kg?: number | string | null;
    } | null;
    bankingSystem2024?: string | null;
    paymentSystem2024?: string | null;
    inflationRatePct?: number | string | null;
    interestRatePct?: number | string | null;
  } | null;

  infrastructureLogistics?: {
    infrastructureReadinessIndexScore?: number | string | null;
    infrastructureReadinessGlobalRank?: number | string | null;
    nri2024Score?: number | string | null;
    portsAirportsCapacity?: {
      majorPorts?: string | null;
      portCapacity?: string | null;
      majorAirports?: string | null;
      airportPassengerCapacity?: string | null;
      cargoCapacityTonnes?: string | null;
    } | null;
    deliveryTimes?: {
      mainPort?: string | null;
      portDeliveryTimeDays?: number | string | null;
    } | null;
    logisticsRanking?: {
      lpiTotalScore?: number | string | null;
    } | null;
  } | null;

  governanceStability?: {
    politicalStability?: {
      score?: number | string | null;
      source?: string | null;
    } | null;
    governmentInPowerPolicies?: {
      governmentInPower2024?: string | null;
      partyCoalition?: string | null;
      keyEconomicIndustrialPoliciesFdi?: string | null;
      sourceYear?: string | null;
    } | null;
    ngoInvolvement?: {
      ngoPresenceInfluence?: string | null;
      mainFocusAreas?: string | null;
      governmentRelations?: string | null;
      sourceYear?: string | null;
    } | null;
    internationalRestrictions?: {
      restrictionsEmbargoes?: string | null;
      issuingAuthority?: string | null;
      targetedSectorsEntities?: string | null;
      sourceYear?: string | null;
    } | null;
    securitySafety?: {
      crimeSafetyLevel?: string | null;
      businessSecurityRisk?: string | null;
      lawEnforcementReliability?: string | null;
      sourceYear?: string | null;
    } | null;
    warTerrorismRisks?: {
      conflictTerrorismThreats?: string | null;
      riskLevel?: string | null;
      keyGroupsActors?: string | null;
      sourceYear?: string | null;
    } | null;
    significantHistoricEvents?: {
      historicEvent?: string | null;
      year?: number | string | null;
      businessInvestmentImpact?: string | null;
      sourceYear?: string | null;
    }[] | null;
  } | null;

  businessTradeEnvironment?: {
    easeOfDoingBusiness?: {
      globalRankOf190?: number | string | null;
      overallScore?: number | string | null;
      year?: number | string | null;
      statusNote?: string | null;
    } | null;
    tradeAgreements?: {
      euFtaAssociationIndustrialGoods?: string | null;
      customsUnionOrRecIndustrialFocus?: string | null;
      otherKeyArrangementsRelevantToIndustry?: string | null;
      status?: string | null;
    } | null;
    investmentProtectionPolicies?: {
      bitsWithGermanyOrEu?: string | null;
      icsidMembership?: string | null;
      isdsAvailability?: string | null;
      keyDomesticProtections?: string | null;
    } | null;
    visasAndLandPurchaseLaws?: {
      businessVisaAvailabilityTypical?: string | null;
      residencyInvestorVisa?: string | null;
      foreignLandOwnershipCoreRule?: string | null;
      freeZonesIndustrialParksSpecialRules?: string | null;
    } | null;
    recruitmentLandscape?: {
      labourAvailabilitySkills?: string | null;
      unionisationIntensity?: string | null;
      localHiringNationalisationRules?: string | null;
      typicalChallengesForForeignIndustrialEmployers?: string | null;
    } | null;
    settingUpNewCompany?: {
      minCapitalTypicalIndustrialLlc?: string | number | null;
      typicalSetupTime?: string | null;
      govFeesLicensingRegistration?: string | number | null;
      foreignOwnershipLimitsMainland?: string | null;
      roleOfFreeZonesSezsForIndustry?: string | null;
    } | null;
    tradingTerms?: {
      publicProcurementOpenness?: string | null;
      paymentRiskDelays?: string | null;
      localSupplierPreferenceIcv?: string | null;
      soeDominancePracticalNotes?: string | null;
    } | null;
  } | null;

  educationResearchHumanCapital?: {
    universitiesSchoolsQuality?: {
      rankedUniversities2022To2025?: string | null;
      stemEngineeringStrength?: string | null;
      researchInternationalCollaboration?: string | null;
      universityIndustryLinks?: string | null;
    } | null;
    trainingVocationalAvailable?: {
      tvetVocationalSystem?: string | null;
      alignmentWithIndustrialSkills?: string | null;
      governmentDonorTvetPrograms?: string | null;
      employerInvolvementImplications?: string | null;
    } | null;
    workforceDevelopmentPrograms?: {
      nationalSkillsHumanCapitalStrategy2022To2025?: string | null;
      publicPrivateWorkforceInitiatives?: string | null;
      multinationalsDonorsInvolved?: string | null;
      effectivenessForIndustrialInvestors?: string | null;
    } | null;
  } | null;

  industrialManufacturingStrengths?: {
    keySectors?: {
      primaryManufacturingSectors?: string | null;
      secondaryEmergingSectors?: string | null;
      maturityQualifier?: string | null;
    } | null;
    governmentIncentives?: {
      industrialZonesSezs?: string | null;
      taxCustomsIncentives?: string | null;
      localContentLocalisation?: string | null;
      exportOrientedIncentives?: string | null;
    } | null;
    germanProductsCompanies?: {
      germanOemsIndustrialOperationsExamples?: string | null;
      germanProductsCommonlyImportedDirectional?: string | null;
      notableGermanBackedProjectsQualifiers?: string | null;
    } | null;
    investmentReadiness?: {
      readiness?: string | null;
      oneSentenceJustification?: string | null;
    } | null;
  } | null;

  sustainabilityEnvironment?: {
    wasteManagementPolicies?: {
      documentedNationalWasteManagementPolicyStrategy?: string | null;
      wasteStreamsExplicitlyAddressed?: string | null;
      implementationEnforcementSignal?: string | null;
      roleOfPrivateSectorPpps?: string | null;
      keyGapsConstraints?: string | null;
      indicativeSources?: string | null;
    } | null;
    environmentalInitiatives?: {
      renewableCleanEnergyInitiativesRelevantToIndustry?: string | null;
      carbonClimatePolicyInstrumentsAffectingIndustry?: string | null;
      circularEconomyResourceEfficiencyInitiatives?: string | null;
      implementationSignal?: string | null;
      relevanceForIndustrialManufacturingInvestors?: string | null;
      indicativeSources?: string | null;
    } | null;
    futureDevelopmentPlans?: {
      sustainabilityLinkedIndustrialDevelopmentPlans?: string | null;
      statusOfPlans?: string | null;
      timeHorizonIndicated?: string | null;
      roleEnvisionedForForeignPrivateInvestors?: string | null;
      strategicImplicationsForGermanIndustrialFirms?: string | null;
      indicativeSources?: string | null;
    } | null;
  } | null;

  swot?: {
    strengths?: string | null;
    weaknesses?: string | null;
    opportunities?: string | null;
    threats?: string | null;
  } | null;

  conclusion?: {
    gicStarRatings?: {
      gicStarRating?: string | number | null;
      investorConfidenceIndicator?: string | null;
      rationaleIndustrialInvestability?: string | null;
    } | null;
  } | null;
}

export interface Product extends BaseModel {
  fileId: string;
  name: string;
  slug: string;
  code: string;

  /** Product data version label, e.g. "V1", "V2". */
  productVersion?: string | null;

  /** Epoch ms (Date.now()) of the last PDF upload/assignment. */
  fileUpload_timeStamp?: number | null;

  /**
   * sub-region label
   */
  subRegion: string;

  /**
   * sub-region id
   */
  parent?: string | null;

  content: ProductContent | null;
  variant: ProductVariant | null;
  media: ProductMedia | null;
  tags: string[] | null;
  downloadCount: number;
  importance: ProductImportance;
  children: string[] | null;
  recommended: string[] | null;

  metadata?: ProductMetadata | null;

  sourceFiles?: string[] | null;
  sourceSheets?: string[] | null;

  isActive?: boolean;
  order?: number;
}

export interface CreateProductRequest {
  fileId: string;
  name: string;
  slug: string;
  code: string;
  subRegion: string;
  productVersion?: string | null;
  fileUpload_timeStamp?: number | null;
  content?: ProductContent | null;
  variant?: ProductVariant | null;
  media?: ProductMedia | null;
  tags?: string[] | null;
  downloadCount?: number;
  importance: ProductImportance;
  parent?: string | null;
  children?: string[] | null;
  recommended?: string[] | null;
  metadata?: ProductMetadata | null;
  sourceFiles?: string[] | null;
  sourceSheets?: string[] | null;
  isActive?: boolean;
  order?: number;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {}