export interface EconomicFundamentalsMeta {
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
}

export interface DemographicsWorkforceMeta {
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
}

export interface NaturalIndustrialResourcesMeta {
  mainResources?: string | null;
  industrialBaseStrength2024?: string | null;
}

export interface CurrencyFinancialClimateMeta {
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
}

export interface InfrastructureLogisticsMeta {
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
}

export interface GovernanceStabilityMeta {
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
}

export interface BusinessTradeEnvironmentMeta {
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
}

export interface EducationResearchHumanCapitalMeta {
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
}

export interface IndustrialManufacturingStrengthsMeta {
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
}

export interface SustainabilityEnvironmentMeta {
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
}

export interface SwotMatrixMeta {
  strengths?: string | null;
  weaknesses?: string | null;
  opportunities?: string | null;
  threats?: string | null;
}

export interface ConclusionMeta {
  gicStarRating?: string | number | null;
  investmentAttractivenessSignal?: string | null;
  rationaleIndustrialInvestability?: string | null;
}




export interface CountryMetadata {
  economicFundamentals?: EconomicFundamentalsMeta | null;
  demographicsWorkforce?: DemographicsWorkforceMeta | null;
  naturalIndustrialResources?: NaturalIndustrialResourcesMeta | null;
  currencyFinancialClimate?: CurrencyFinancialClimateMeta | null;
  infrastructureLogistics?: InfrastructureLogisticsMeta | null;
  governanceStability?: GovernanceStabilityMeta | null;
  businessTradeEnvironment?: BusinessTradeEnvironmentMeta | null;
  educationResearchHumanCapital?: EducationResearchHumanCapitalMeta | null;
  industrialManufacturingStrengths?: IndustrialManufacturingStrengthsMeta | null;
  sustainabilityEnvironment?: SustainabilityEnvironmentMeta | null;
  swot?: SwotMatrixMeta | null;
  conclusion?: ConclusionMeta | null;
}