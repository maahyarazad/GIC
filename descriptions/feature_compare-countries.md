# Feature: Compare Countries

## Description

Add a new **Compare Countries** section to the dashboard, allowing users to compare selected data points across multiple countries.

## Requirements

### Dashboard

- Add a new **Compare Countries** section to the dashboard.
- This section should be accessible to all user roles.

### Country Selection

At the top of the page, provide two selection panels:

1. **Add Countries**
2. **Remove Countries**

- Display countries grouped by **Region**.
- Use a dropdown (or expandable list) for each region, where:
  - The **region name** is the dropdown header.
  - The **country names** are displayed as checkbox items within the dropdown.
- Users should be able to add or remove multiple countries from the comparison.

### Metadata Structure

The `ProductMetadata.properties` object defines the comparison structure.

#### Top-Level Categories

- Each top-level key inside `ProductMetadata.properties` represents a comparison category.
- Create one **Accordion** (Expansion Panel) for each category.
- The accordion title should be the category name.

Example:

- `economicFundamentals`
- `labourMarket`
- `businessEnvironment`

#### Category Fields

- Each property within a category represents a comparison field.
- Display every field as a checkbox inside its corresponding accordion.
- Use the property key as the field name.
- Add a parent checkbox to each accordion that allows users to **Select All** or **Deselect All** fields within that category.

### Comparison View

After the user selects:

- one or more countries, and
- one or more comparison fields,

display the comparison results below the selection area.

The comparison should be grouped by category.

For example, if the user selects:

- **Countries**
  - Germany
  - United Arab Emirates

- **Fields**
  - `economicFundamentals.gdpGrowthRate2024`
  - `economicFundamentals.vatOrSalesTaxPct`

The comparison should be displayed as:

```text
Economic Fundamentals

GDP Growth Rate 2024

Germany                     1.8%
United Arab Emirates        4.2%

VAT / Sales Tax (%)

Germany                     19%
United Arab Emirates         5%
```

### Data Source

Use the `ProductMetadata.properties` schema to dynamically generate the comparison UI.

Rules:

- Top-level keys represent comparison categories.
- Second-level keys represent selectable comparison fields.
- Do not hardcode categories or fields.
- The UI should automatically adapt if new categories or fields are added to the metadata schema.

## Example Metadata Structure

```json
"ProductMetadata": {
				"properties": {
					"economicFundamentals": {
						"properties": {
							"gdpGrowthRate2024": {
								"anyOf": [
									{
										"type": "number",
										"format": "double"
									},
									{
										"type": "string"
									}
								],
								"nullable": true
							},
							"vatOrSalesTaxPct": {
								"anyOf": [
									{
										"type": "number",
										"format": "double"
									},
									{
										"type": "string"
									}
								],
								"nullable": true
							},
							"importDutyPct": {
								"anyOf": [
									{
										"type": "number",
										"format": "double"
									},
									{
										"type": "string"
									}
								],
								"nullable": true
							},
							"incomeTaxRate": {
								"anyOf": [
									{
										"type": "number",
										"format": "double"
									},
									{
										"type": "string"
									}
								],
								"nullable": true
							},
							"publicDebtPctGdp2024": {
								"anyOf": [
									{
										"type": "number",
										"format": "double"
									},
									{
										"type": "string"
									}
								],
								"nullable": true
							},
							"landSizeSqKm2024": {
								"anyOf": [
									{
										"type": "number",
										"format": "double"
									},
									{
										"type": "string"
									}
								],
								"nullable": true
							},
							"averageAge2024": {
								"anyOf": [
									{
										"type": "number",
										"format": "double"
									},
									{
										"type": "string"
									}
								],
								"nullable": true
							},
							"avgSchooling2024": {
								"anyOf": [
									{
										"type": "number",
										"format": "double"
									},
									{
										"type": "string"
									}
								],
								"nullable": true
							},
							"literacyRate2024": {
								"anyOf": [
									{
										"type": "number",
										"format": "double"
									},
									{
										"type": "string"
									}
								],
								"nullable": true
							},
							"youthUnemploymentRate2024": {
								"anyOf": [
									{
										"type": "number",
										"format": "double"
									},
									{
										"type": "string"
									}
								],
								"nullable": true
							},
							"avgUnemploymentRate2024": {
								"anyOf": [
									{
										"type": "number",
										"format": "double"
									},
									{
										"type": "string"
									}
								],
								"nullable": true
							},
							"averageHdi2023To2024": {
								"anyOf": [
									{
										"type": "number",
										"format": "double"
									},
									{
										"type": "string"
									}
								],
								"nullable": true
							},
							"latestGiniIndex": {
								"anyOf": [
									{
										"type": "number",
										"format": "double"
									},
									{
										"type": "string"
									}
								],
								"nullable": true
							},
							"avgAnnualGrowth2019To2024": {
								"anyOf": [
									{
										"type": "number",
										"format": "double"
									},
									{
										"type": "string"
									}
								],
								"nullable": true
							},
							"nominalGdpUsdBn": {
								"anyOf": [
									{
										"type": "number",
										"format": "double"
									},
									{
										"type": "string"
									}
								],
								"nullable": true
							}
						},
						"type": "object",
						"nullable": true
					},
					"demographicsWorkforce": {
						"properties": {
							"geographicDistributionNotes": {
								"type": "string",
								"nullable": true
							},
							"ruralPopulationPct": {
								"anyOf": [
									{
										"type": "number",
										"format": "double"
									},
									{
										"type": "string"
									}
								],
								"nullable": true
							},
							"urbanPopulationPct": {
								"anyOf": [
									{
										"type": "number",
										"format": "double"
									},
									{
										"type": "string"
									}
								],
								"nullable": true
							},
							"laborMarketFeatures": {
								"type": "string",
								"nullable": true
							},
							"tertiaryEducation": {
								"type": "string",
								"nullable": true
							},
							"skillStatus": {
								"type": "string",
								"nullable": true
							},
							"deathRatePer1000": {
								"anyOf": [
									{
										"type": "number",
										"format": "double"
									},
									{
										"type": "string"
									}
								],
								"nullable": true
							},
							"birthRatePer1000": {
								"anyOf": [
									{
										"type": "number",
										"format": "double"
									},
									{
										"type": "string"
									}
								],
								"nullable": true
							},
							"primaryReligion": {
								"type": "string",
								"nullable": true
							},
							"populationGrowthRatePct": {
								"anyOf": [
									{
										"type": "number",
										"format": "double"
									},
									{
										"type": "string"
									}
								],
								"nullable": true
							}
						},
						"type": "object",
						"nullable": true
					},
					"naturalIndustrialResources": {
						"properties": {
							"industrialBaseStrength2024": {
								"type": "string",
								"nullable": true
							},
							"mainResources": {
								"type": "string",
								"nullable": true
							}
						},
						"type": "object",
						"nullable": true
					},
					"currencyFinancialClimate": {
						"properties": {
							"interestRatePct": {
								"anyOf": [
									{
										"type": "number",
										"format": "double"
									},
									{
										"type": "string"
									}
								],
								"nullable": true
							},
							"inflationRatePct": {
								"anyOf": [
									{
										"type": "number",
										"format": "double"
									},
									{
										"type": "string"
									}
								],
								"nullable": true
							},
							"paymentSystem2024": {
								"type": "string",
								"nullable": true
							},
							"bankingSystem2024": {
								"type": "string",
								"nullable": true
							},
							"averagePriceStandardGoods": {
								"properties": {
									"chicken1Kg": {
										"anyOf": [
											{
												"type": "number",
												"format": "double"
											},
											{
												"type": "string"
											}
										],
										"nullable": true
									},
									"rice1Kg": {
										"anyOf": [
											{
												"type": "number",
												"format": "double"
											},
											{
												"type": "string"
											}
										],
										"nullable": true
									},
									"eggs12": {
										"anyOf": [
											{
												"type": "number",
												"format": "double"
											},
											{
												"type": "string"
											}
										],
										"nullable": true
									},
									"breadLoafUsd": {
										"anyOf": [
											{
												"type": "number",
												"format": "double"
											},
											{
												"type": "string"
											}
										],
										"nullable": true
									},
									"milk1L": {
										"anyOf": [
											{
												"type": "number",
												"format": "double"
											},
											{
												"type": "string"
											}
										],
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							},
							"currencyStability2024": {
								"type": "string",
								"nullable": true
							},
							"currencyStrengthAcceptance": {
								"type": "string",
								"nullable": true
							},
							"currencyCode": {
								"type": "string",
								"nullable": true
							}
						},
						"type": "object",
						"nullable": true
					},
					"infrastructureLogistics": {
						"properties": {
							"logisticsRanking": {
								"properties": {
									"lpiTotalScore": {
										"anyOf": [
											{
												"type": "number",
												"format": "double"
											},
											{
												"type": "string"
											}
										],
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							},
							"deliveryTimes": {
								"properties": {
									"portDeliveryTimeDays": {
										"anyOf": [
											{
												"type": "number",
												"format": "double"
											},
											{
												"type": "string"
											}
										],
										"nullable": true
									},
									"mainPort": {
										"type": "string",
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							},
							"portsAirportsCapacity": {
								"properties": {
									"cargoCapacityTonnes": {
										"type": "string",
										"nullable": true
									},
									"airportPassengerCapacity": {
										"type": "string",
										"nullable": true
									},
									"majorAirports": {
										"type": "string",
										"nullable": true
									},
									"portCapacity": {
										"type": "string",
										"nullable": true
									},
									"majorPorts": {
										"type": "string",
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							},
							"nri2024Score": {
								"anyOf": [
									{
										"type": "number",
										"format": "double"
									},
									{
										"type": "string"
									}
								],
								"nullable": true
							},
							"infrastructureReadinessGlobalRank": {
								"anyOf": [
									{
										"type": "number",
										"format": "double"
									},
									{
										"type": "string"
									}
								],
								"nullable": true
							},
							"infrastructureReadinessIndexScore": {
								"anyOf": [
									{
										"type": "number",
										"format": "double"
									},
									{
										"type": "string"
									}
								],
								"nullable": true
							}
						},
						"type": "object",
						"nullable": true
					},
					"governanceStability": {
						"properties": {
							"significantHistoricEvents": {
								"items": {
									"properties": {
										"sourceYear": {
											"type": "string",
											"nullable": true
										},
										"businessInvestmentImpact": {
											"type": "string",
											"nullable": true
										},
										"year": {
											"anyOf": [
												{
													"type": "number",
													"format": "double"
												},
												{
													"type": "string"
												}
											],
											"nullable": true
										},
										"historicEvent": {
											"type": "string",
											"nullable": true
										}
									},
									"type": "object"
								},
								"type": "array",
								"nullable": true
							},
							"warTerrorismRisks": {
								"properties": {
									"sourceYear": {
										"type": "string",
										"nullable": true
									},
									"keyGroupsActors": {
										"type": "string",
										"nullable": true
									},
									"riskLevel": {
										"type": "string",
										"nullable": true
									},
									"conflictTerrorismThreats": {
										"type": "string",
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							},
							"securitySafety": {
								"properties": {
									"sourceYear": {
										"type": "string",
										"nullable": true
									},
									"lawEnforcementReliability": {
										"type": "string",
										"nullable": true
									},
									"businessSecurityRisk": {
										"type": "string",
										"nullable": true
									},
									"crimeSafetyLevel": {
										"type": "string",
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							},
							"internationalRestrictions": {
								"properties": {
									"sourceYear": {
										"type": "string",
										"nullable": true
									},
									"targetedSectorsEntities": {
										"type": "string",
										"nullable": true
									},
									"issuingAuthority": {
										"type": "string",
										"nullable": true
									},
									"restrictionsEmbargoes": {
										"type": "string",
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							},
							"ngoInvolvement": {
								"properties": {
									"sourceYear": {
										"type": "string",
										"nullable": true
									},
									"governmentRelations": {
										"type": "string",
										"nullable": true
									},
									"mainFocusAreas": {
										"type": "string",
										"nullable": true
									},
									"ngoPresenceInfluence": {
										"type": "string",
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							},
							"governmentInPowerPolicies": {
								"properties": {
									"sourceYear": {
										"type": "string",
										"nullable": true
									},
									"keyEconomicIndustrialPoliciesFdi": {
										"type": "string",
										"nullable": true
									},
									"partyCoalition": {
										"type": "string",
										"nullable": true
									},
									"governmentInPower2024": {
										"type": "string",
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							},
							"politicalStability": {
								"properties": {
									"source": {
										"type": "string",
										"nullable": true
									},
									"score": {
										"anyOf": [
											{
												"type": "number",
												"format": "double"
											},
											{
												"type": "string"
											}
										],
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							}
						},
						"type": "object",
						"nullable": true
					},
					"businessTradeEnvironment": {
						"properties": {
							"tradingTerms": {
								"properties": {
									"soeDominancePracticalNotes": {
										"type": "string",
										"nullable": true
									},
									"localSupplierPreferenceIcv": {
										"type": "string",
										"nullable": true
									},
									"paymentRiskDelays": {
										"type": "string",
										"nullable": true
									},
									"publicProcurementOpenness": {
										"type": "string",
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							},
							"settingUpNewCompany": {
								"properties": {
									"roleOfFreeZonesSezsForIndustry": {
										"type": "string",
										"nullable": true
									},
									"foreignOwnershipLimitsMainland": {
										"type": "string",
										"nullable": true
									},
									"govFeesLicensingRegistration": {
										"anyOf": [
											{
												"type": "string"
											},
											{
												"type": "number",
												"format": "double"
											}
										],
										"nullable": true
									},
									"typicalSetupTime": {
										"type": "string",
										"nullable": true
									},
									"minCapitalTypicalIndustrialLlc": {
										"anyOf": [
											{
												"type": "string"
											},
											{
												"type": "number",
												"format": "double"
											}
										],
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							},
							"recruitmentLandscape": {
								"properties": {
									"typicalChallengesForForeignIndustrialEmployers": {
										"type": "string",
										"nullable": true
									},
									"localHiringNationalisationRules": {
										"type": "string",
										"nullable": true
									},
									"unionisationIntensity": {
										"type": "string",
										"nullable": true
									},
									"labourAvailabilitySkills": {
										"type": "string",
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							},
							"visasAndLandPurchaseLaws": {
								"properties": {
									"freeZonesIndustrialParksSpecialRules": {
										"type": "string",
										"nullable": true
									},
									"foreignLandOwnershipCoreRule": {
										"type": "string",
										"nullable": true
									},
									"residencyInvestorVisa": {
										"type": "string",
										"nullable": true
									},
									"businessVisaAvailabilityTypical": {
										"type": "string",
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							},
							"investmentProtectionPolicies": {
								"properties": {
									"keyDomesticProtections": {
										"type": "string",
										"nullable": true
									},
									"isdsAvailability": {
										"type": "string",
										"nullable": true
									},
									"icsidMembership": {
										"type": "string",
										"nullable": true
									},
									"bitsWithGermanyOrEu": {
										"type": "string",
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							},
							"tradeAgreements": {
								"properties": {
									"status": {
										"type": "string",
										"nullable": true
									},
									"otherKeyArrangementsRelevantToIndustry": {
										"type": "string",
										"nullable": true
									},
									"customsUnionOrRecIndustrialFocus": {
										"type": "string",
										"nullable": true
									},
									"euFtaAssociationIndustrialGoods": {
										"type": "string",
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							},
							"easeOfDoingBusiness": {
								"properties": {
									"statusNote": {
										"type": "string",
										"nullable": true
									},
									"year": {
										"anyOf": [
											{
												"type": "number",
												"format": "double"
											},
											{
												"type": "string"
											}
										],
										"nullable": true
									},
									"overallScore": {
										"anyOf": [
											{
												"type": "number",
												"format": "double"
											},
											{
												"type": "string"
											}
										],
										"nullable": true
									},
									"globalRankOf190": {
										"anyOf": [
											{
												"type": "number",
												"format": "double"
											},
											{
												"type": "string"
											}
										],
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							}
						},
						"type": "object",
						"nullable": true
					},
					"educationResearchHumanCapital": {
						"properties": {
							"workforceDevelopmentPrograms": {
								"properties": {
									"effectivenessForIndustrialInvestors": {
										"type": "string",
										"nullable": true
									},
									"multinationalsDonorsInvolved": {
										"type": "string",
										"nullable": true
									},
									"publicPrivateWorkforceInitiatives": {
										"type": "string",
										"nullable": true
									},
									"nationalSkillsHumanCapitalStrategy2022To2025": {
										"type": "string",
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							},
							"trainingVocationalAvailable": {
								"properties": {
									"employerInvolvementImplications": {
										"type": "string",
										"nullable": true
									},
									"governmentDonorTvetPrograms": {
										"type": "string",
										"nullable": true
									},
									"alignmentWithIndustrialSkills": {
										"type": "string",
										"nullable": true
									},
									"tvetVocationalSystem": {
										"type": "string",
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							},
							"universitiesSchoolsQuality": {
								"properties": {
									"universityIndustryLinks": {
										"type": "string",
										"nullable": true
									},
									"researchInternationalCollaboration": {
										"type": "string",
										"nullable": true
									},
									"stemEngineeringStrength": {
										"type": "string",
										"nullable": true
									},
									"rankedUniversities2022To2025": {
										"type": "string",
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							}
						},
						"type": "object",
						"nullable": true
					},
					"industrialManufacturingStrengths": {
						"properties": {
							"investmentReadiness": {
								"properties": {
									"oneSentenceJustification": {
										"type": "string",
										"nullable": true
									},
									"readiness": {
										"type": "string",
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							},
							"germanProductsCompanies": {
								"properties": {
									"notableGermanBackedProjectsQualifiers": {
										"type": "string",
										"nullable": true
									},
									"germanProductsCommonlyImportedDirectional": {
										"type": "string",
										"nullable": true
									},
									"germanOemsIndustrialOperationsExamples": {
										"type": "string",
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							},
							"governmentIncentives": {
								"properties": {
									"exportOrientedIncentives": {
										"type": "string",
										"nullable": true
									},
									"localContentLocalisation": {
										"type": "string",
										"nullable": true
									},
									"taxCustomsIncentives": {
										"type": "string",
										"nullable": true
									},
									"industrialZonesSezs": {
										"type": "string",
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							},
							"keySectors": {
								"properties": {
									"maturityQualifier": {
										"type": "string",
										"nullable": true
									},
									"secondaryEmergingSectors": {
										"type": "string",
										"nullable": true
									},
									"primaryManufacturingSectors": {
										"type": "string",
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							}
						},
						"type": "object",
						"nullable": true
					},
					"sustainabilityEnvironment": {
						"properties": {
							"futureDevelopmentPlans": {
								"properties": {
									"indicativeSources": {
										"type": "string",
										"nullable": true
									},
									"strategicImplicationsForGermanIndustrialFirms": {
										"type": "string",
										"nullable": true
									},
									"roleEnvisionedForForeignPrivateInvestors": {
										"type": "string",
										"nullable": true
									},
									"timeHorizonIndicated": {
										"type": "string",
										"nullable": true
									},
									"statusOfPlans": {
										"type": "string",
										"nullable": true
									},
									"sustainabilityLinkedIndustrialDevelopmentPlans": {
										"type": "string",
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							},
							"environmentalInitiatives": {
								"properties": {
									"indicativeSources": {
										"type": "string",
										"nullable": true
									},
									"relevanceForIndustrialManufacturingInvestors": {
										"type": "string",
										"nullable": true
									},
									"implementationSignal": {
										"type": "string",
										"nullable": true
									},
									"circularEconomyResourceEfficiencyInitiatives": {
										"type": "string",
										"nullable": true
									},
									"carbonClimatePolicyInstrumentsAffectingIndustry": {
										"type": "string",
										"nullable": true
									},
									"renewableCleanEnergyInitiativesRelevantToIndustry": {
										"type": "string",
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							},
							"wasteManagementPolicies": {
								"properties": {
									"indicativeSources": {
										"type": "string",
										"nullable": true
									},
									"keyGapsConstraints": {
										"type": "string",
										"nullable": true
									},
									"roleOfPrivateSectorPpps": {
										"type": "string",
										"nullable": true
									},
									"implementationEnforcementSignal": {
										"type": "string",
										"nullable": true
									},
									"wasteStreamsExplicitlyAddressed": {
										"type": "string",
										"nullable": true
									},
									"documentedNationalWasteManagementPolicyStrategy": {
										"type": "string",
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							}
						},
						"type": "object",
						"nullable": true
					},
					"swot": {
						"properties": {
							"threats": {
								"type": "string",
								"nullable": true
							},
							"opportunities": {
								"type": "string",
								"nullable": true
							},
							"weaknesses": {
								"type": "string",
								"nullable": true
							},
							"strengths": {
								"type": "string",
								"nullable": true
							}
						},
						"type": "object",
						"nullable": true
					},
					"conclusion": {
						"properties": {
							"gicStarRatings": {
								"properties": {
									"rationaleIndustrialInvestability": {
										"type": "string",
										"nullable": true
									},
									"investorConfidenceIndicator": {
										"type": "string",
										"nullable": true
									},
									"gicStarRating": {
										"anyOf": [
											{
												"type": "string"
											},
											{
												"type": "number",
												"format": "double"
											}
										],
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							}
						},
						"type": "object",
						"nullable": true
					}
				},
				"type": "object",
				"additionalProperties": true
			},
```



# Part 2

## 1. Layout Changes

In the **`CompareCountries.tsx`** component:

- Move **`Add Countries`** and **`Comparison Fields`** so they are stacked vertically (one below the other).
- Limit the width of both sections to **200px**.
- Place **`Remove Countries`** above these two sections, following the same layout and styling as the **Categories** row in **`EconomicInsights.tsx`**.
- Reuse the existing style from **`EconomicInsights.tsx`**, with one small change: add a **Remove** button that allows the user to remove the selected country.

## 2. Selected Countries UI

Update the **Selected Countries** section as follows:

- Remove the current rounded border styling.
- Limit the maximum width of each selected country card to **400px**.
- Display country cards horizontally, with each newly selected country appearing to the right of the previous one, similar to the comparison layout on GSMArena.
- Display the country's flag at the top of each card, using a width of **300px**, similar to the GSMArena comparison layout.

### Data Rendering

Currently, the UI only displays the parent key.

Instead, it should display the value of the deepest child node.

For example, instead of rendering only the parent structure, it should render:

```text
Sustainability Environment
  Future Development Plans
    Environmental Initiatives
      Burundi — <value>

    Waste Management Policies
      Burundi — <value>

SWOT
  Threats
    Burundi — <value>

  Opportunities
    Burundi — <value>

  Weaknesses
    Burundi — <value>
```

In other words, the component should display the value stored in the leaf nodes (e.g., under `Object["Future Development Plans"]`) rather than only rendering the parent keys.


# Part 3

1. The Product object is incomplete in this route `/products/by-parent/` please add all the metadata 
2. check the **`initialize_db.ts`** and see if these properties are missing in use below meta data if needed 

```json
[
    {
        "_id": "6a55fdd16db0edc353e10be0",
        "fileId": "Southern Africa - Botswana",
        "name": "Botswana",
        "code": "BW",
        "parent": "6a55fdd16db0edc353e10ba2",
        "content": {
            "description": null,
            "shortDescription": null,
            "highlights": [],
            "features": []
        },
        "variant": {
            "variantName": null,
            "variantValue": null
        },
        "media": {
            "images": [],
            "imageAlt": null,
            "video": null,
            "seoTitle": "Botswana",
            "seoDescription": null,
            "seoKeywords": [
                "Botswana",
                "BW",
                "Southern Africa"
            ]
        },
        "tags": [
            "country"
        ],
        "downloadCount": 0,
        "importance": "A",
        "children": [],
        "recommended": [],
        "metadata": {
            "conclusion": {
                "gicStarRatings": {
                    "gicStarRating": "★★★★☆",
                    "investorConfidenceIndicator": "🟢 High Confidence",
                    "rationaleIndustrialInvestability": "Botswana's exceptional governance and low-corruption credentials — among Africa's strongest — combined with a diamond-linked cutting/polishing industrial niche and a stable, peaceful 2024 democratic transition, make it one of the sub-region's most predictable environments. The small domestic market and heavy diamond-revenue dependence are structural constraints on scale rather than risk factors. The Ghanzi Solar Cluster and growing pharmaceutical/niche manufacturing capability support continued, if measured, diversification."
                }
            }
        }
    }
]
```

```json
"ProductMetadata": {
				"properties": {
					"economicFundamentals": {
						"properties": {
							"gdpGrowthRate2024": {
								"anyOf": [
									{
										"type": "number",
										"format": "double"
									},
									{
										"type": "string"
									}
								],
								"nullable": true
							},
							"vatOrSalesTaxPct": {
								"anyOf": [
									{
										"type": "number",
										"format": "double"
									},
									{
										"type": "string"
									}
								],
								"nullable": true
							},
							"importDutyPct": {
								"anyOf": [
									{
										"type": "number",
										"format": "double"
									},
									{
										"type": "string"
									}
								],
								"nullable": true
							},
							"incomeTaxRate": {
								"anyOf": [
									{
										"type": "number",
										"format": "double"
									},
									{
										"type": "string"
									}
								],
								"nullable": true
							},
							"publicDebtPctGdp2024": {
								"anyOf": [
									{
										"type": "number",
										"format": "double"
									},
									{
										"type": "string"
									}
								],
								"nullable": true
							},
							"landSizeSqKm2024": {
								"anyOf": [
									{
										"type": "number",
										"format": "double"
									},
									{
										"type": "string"
									}
								],
								"nullable": true
							},
							"averageAge2024": {
								"anyOf": [
									{
										"type": "number",
										"format": "double"
									},
									{
										"type": "string"
									}
								],
								"nullable": true
							},
							"avgSchooling2024": {
								"anyOf": [
									{
										"type": "number",
										"format": "double"
									},
									{
										"type": "string"
									}
								],
								"nullable": true
							},
							"literacyRate2024": {
								"anyOf": [
									{
										"type": "number",
										"format": "double"
									},
									{
										"type": "string"
									}
								],
								"nullable": true
							},
							"youthUnemploymentRate2024": {
								"anyOf": [
									{
										"type": "number",
										"format": "double"
									},
									{
										"type": "string"
									}
								],
								"nullable": true
							},
							"avgUnemploymentRate2024": {
								"anyOf": [
									{
										"type": "number",
										"format": "double"
									},
									{
										"type": "string"
									}
								],
								"nullable": true
							},
							"averageHdi2023To2024": {
								"anyOf": [
									{
										"type": "number",
										"format": "double"
									},
									{
										"type": "string"
									}
								],
								"nullable": true
							},
							"latestGiniIndex": {
								"anyOf": [
									{
										"type": "number",
										"format": "double"
									},
									{
										"type": "string"
									}
								],
								"nullable": true
							},
							"avgAnnualGrowth2019To2024": {
								"anyOf": [
									{
										"type": "number",
										"format": "double"
									},
									{
										"type": "string"
									}
								],
								"nullable": true
							},
							"nominalGdpUsdBn": {
								"anyOf": [
									{
										"type": "number",
										"format": "double"
									},
									{
										"type": "string"
									}
								],
								"nullable": true
							}
						},
						"type": "object",
						"nullable": true
					},
					"demographicsWorkforce": {
						"properties": {
							"geographicDistributionNotes": {
								"type": "string",
								"nullable": true
							},
							"ruralPopulationPct": {
								"anyOf": [
									{
										"type": "number",
										"format": "double"
									},
									{
										"type": "string"
									}
								],
								"nullable": true
							},
							"urbanPopulationPct": {
								"anyOf": [
									{
										"type": "number",
										"format": "double"
									},
									{
										"type": "string"
									}
								],
								"nullable": true
							},
							"laborMarketFeatures": {
								"type": "string",
								"nullable": true
							},
							"tertiaryEducation": {
								"type": "string",
								"nullable": true
							},
							"skillStatus": {
								"type": "string",
								"nullable": true
							},
							"deathRatePer1000": {
								"anyOf": [
									{
										"type": "number",
										"format": "double"
									},
									{
										"type": "string"
									}
								],
								"nullable": true
							},
							"birthRatePer1000": {
								"anyOf": [
									{
										"type": "number",
										"format": "double"
									},
									{
										"type": "string"
									}
								],
								"nullable": true
							},
							"primaryReligion": {
								"type": "string",
								"nullable": true
							},
							"populationGrowthRatePct": {
								"anyOf": [
									{
										"type": "number",
										"format": "double"
									},
									{
										"type": "string"
									}
								],
								"nullable": true
							}
						},
						"type": "object",
						"nullable": true
					},
					"naturalIndustrialResources": {
						"properties": {
							"industrialBaseStrength2024": {
								"type": "string",
								"nullable": true
							},
							"mainResources": {
								"type": "string",
								"nullable": true
							}
						},
						"type": "object",
						"nullable": true
					},
					"currencyFinancialClimate": {
						"properties": {
							"interestRatePct": {
								"anyOf": [
									{
										"type": "number",
										"format": "double"
									},
									{
										"type": "string"
									}
								],
								"nullable": true
							},
							"inflationRatePct": {
								"anyOf": [
									{
										"type": "number",
										"format": "double"
									},
									{
										"type": "string"
									}
								],
								"nullable": true
							},
							"paymentSystem2024": {
								"type": "string",
								"nullable": true
							},
							"bankingSystem2024": {
								"type": "string",
								"nullable": true
							},
							"averagePriceStandardGoods": {
								"properties": {
									"chicken1Kg": {
										"anyOf": [
											{
												"type": "number",
												"format": "double"
											},
											{
												"type": "string"
											}
										],
										"nullable": true
									},
									"rice1Kg": {
										"anyOf": [
											{
												"type": "number",
												"format": "double"
											},
											{
												"type": "string"
											}
										],
										"nullable": true
									},
									"eggs12": {
										"anyOf": [
											{
												"type": "number",
												"format": "double"
											},
											{
												"type": "string"
											}
										],
										"nullable": true
									},
									"breadLoafUsd": {
										"anyOf": [
											{
												"type": "number",
												"format": "double"
											},
											{
												"type": "string"
											}
										],
										"nullable": true
									},
									"milk1L": {
										"anyOf": [
											{
												"type": "number",
												"format": "double"
											},
											{
												"type": "string"
											}
										],
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							},
							"currencyStability2024": {
								"type": "string",
								"nullable": true
							},
							"currencyStrengthAcceptance": {
								"type": "string",
								"nullable": true
							},
							"currencyCode": {
								"type": "string",
								"nullable": true
							}
						},
						"type": "object",
						"nullable": true
					},
					"infrastructureLogistics": {
						"properties": {
							"logisticsRanking": {
								"properties": {
									"lpiTotalScore": {
										"anyOf": [
											{
												"type": "number",
												"format": "double"
											},
											{
												"type": "string"
											}
										],
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							},
							"deliveryTimes": {
								"properties": {
									"portDeliveryTimeDays": {
										"anyOf": [
											{
												"type": "number",
												"format": "double"
											},
											{
												"type": "string"
											}
										],
										"nullable": true
									},
									"mainPort": {
										"type": "string",
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							},
							"portsAirportsCapacity": {
								"properties": {
									"cargoCapacityTonnes": {
										"type": "string",
										"nullable": true
									},
									"airportPassengerCapacity": {
										"type": "string",
										"nullable": true
									},
									"majorAirports": {
										"type": "string",
										"nullable": true
									},
									"portCapacity": {
										"type": "string",
										"nullable": true
									},
									"majorPorts": {
										"type": "string",
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							},
							"nri2024Score": {
								"anyOf": [
									{
										"type": "number",
										"format": "double"
									},
									{
										"type": "string"
									}
								],
								"nullable": true
							},
							"infrastructureReadinessGlobalRank": {
								"anyOf": [
									{
										"type": "number",
										"format": "double"
									},
									{
										"type": "string"
									}
								],
								"nullable": true
							},
							"infrastructureReadinessIndexScore": {
								"anyOf": [
									{
										"type": "number",
										"format": "double"
									},
									{
										"type": "string"
									}
								],
								"nullable": true
							}
						},
						"type": "object",
						"nullable": true
					},
					"governanceStability": {
						"properties": {
							"significantHistoricEvents": {
								"items": {
									"properties": {
										"sourceYear": {
											"type": "string",
											"nullable": true
										},
										"businessInvestmentImpact": {
											"type": "string",
											"nullable": true
										},
										"year": {
											"anyOf": [
												{
													"type": "number",
													"format": "double"
												},
												{
													"type": "string"
												}
											],
											"nullable": true
										},
										"historicEvent": {
											"type": "string",
											"nullable": true
										}
									},
									"type": "object"
								},
								"type": "array",
								"nullable": true
							},
							"warTerrorismRisks": {
								"properties": {
									"sourceYear": {
										"type": "string",
										"nullable": true
									},
									"keyGroupsActors": {
										"type": "string",
										"nullable": true
									},
									"riskLevel": {
										"type": "string",
										"nullable": true
									},
									"conflictTerrorismThreats": {
										"type": "string",
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							},
							"securitySafety": {
								"properties": {
									"sourceYear": {
										"type": "string",
										"nullable": true
									},
									"lawEnforcementReliability": {
										"type": "string",
										"nullable": true
									},
									"businessSecurityRisk": {
										"type": "string",
										"nullable": true
									},
									"crimeSafetyLevel": {
										"type": "string",
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							},
							"internationalRestrictions": {
								"properties": {
									"sourceYear": {
										"type": "string",
										"nullable": true
									},
									"targetedSectorsEntities": {
										"type": "string",
										"nullable": true
									},
									"issuingAuthority": {
										"type": "string",
										"nullable": true
									},
									"restrictionsEmbargoes": {
										"type": "string",
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							},
							"ngoInvolvement": {
								"properties": {
									"sourceYear": {
										"type": "string",
										"nullable": true
									},
									"governmentRelations": {
										"type": "string",
										"nullable": true
									},
									"mainFocusAreas": {
										"type": "string",
										"nullable": true
									},
									"ngoPresenceInfluence": {
										"type": "string",
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							},
							"governmentInPowerPolicies": {
								"properties": {
									"sourceYear": {
										"type": "string",
										"nullable": true
									},
									"keyEconomicIndustrialPoliciesFdi": {
										"type": "string",
										"nullable": true
									},
									"partyCoalition": {
										"type": "string",
										"nullable": true
									},
									"governmentInPower2024": {
										"type": "string",
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							},
							"politicalStability": {
								"properties": {
									"source": {
										"type": "string",
										"nullable": true
									},
									"score": {
										"anyOf": [
											{
												"type": "number",
												"format": "double"
											},
											{
												"type": "string"
											}
										],
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							}
						},
						"type": "object",
						"nullable": true
					},
					"businessTradeEnvironment": {
						"properties": {
							"tradingTerms": {
								"properties": {
									"soeDominancePracticalNotes": {
										"type": "string",
										"nullable": true
									},
									"localSupplierPreferenceIcv": {
										"type": "string",
										"nullable": true
									},
									"paymentRiskDelays": {
										"type": "string",
										"nullable": true
									},
									"publicProcurementOpenness": {
										"type": "string",
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							},
							"settingUpNewCompany": {
								"properties": {
									"roleOfFreeZonesSezsForIndustry": {
										"type": "string",
										"nullable": true
									},
									"foreignOwnershipLimitsMainland": {
										"type": "string",
										"nullable": true
									},
									"govFeesLicensingRegistration": {
										"anyOf": [
											{
												"type": "string"
											},
											{
												"type": "number",
												"format": "double"
											}
										],
										"nullable": true
									},
									"typicalSetupTime": {
										"type": "string",
										"nullable": true
									},
									"minCapitalTypicalIndustrialLlc": {
										"anyOf": [
											{
												"type": "string"
											},
											{
												"type": "number",
												"format": "double"
											}
										],
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							},
							"recruitmentLandscape": {
								"properties": {
									"typicalChallengesForForeignIndustrialEmployers": {
										"type": "string",
										"nullable": true
									},
									"localHiringNationalisationRules": {
										"type": "string",
										"nullable": true
									},
									"unionisationIntensity": {
										"type": "string",
										"nullable": true
									},
									"labourAvailabilitySkills": {
										"type": "string",
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							},
							"visasAndLandPurchaseLaws": {
								"properties": {
									"freeZonesIndustrialParksSpecialRules": {
										"type": "string",
										"nullable": true
									},
									"foreignLandOwnershipCoreRule": {
										"type": "string",
										"nullable": true
									},
									"residencyInvestorVisa": {
										"type": "string",
										"nullable": true
									},
									"businessVisaAvailabilityTypical": {
										"type": "string",
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							},
							"investmentProtectionPolicies": {
								"properties": {
									"keyDomesticProtections": {
										"type": "string",
										"nullable": true
									},
									"isdsAvailability": {
										"type": "string",
										"nullable": true
									},
									"icsidMembership": {
										"type": "string",
										"nullable": true
									},
									"bitsWithGermanyOrEu": {
										"type": "string",
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							},
							"tradeAgreements": {
								"properties": {
									"status": {
										"type": "string",
										"nullable": true
									},
									"otherKeyArrangementsRelevantToIndustry": {
										"type": "string",
										"nullable": true
									},
									"customsUnionOrRecIndustrialFocus": {
										"type": "string",
										"nullable": true
									},
									"euFtaAssociationIndustrialGoods": {
										"type": "string",
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							},
							"easeOfDoingBusiness": {
								"properties": {
									"statusNote": {
										"type": "string",
										"nullable": true
									},
									"year": {
										"anyOf": [
											{
												"type": "number",
												"format": "double"
											},
											{
												"type": "string"
											}
										],
										"nullable": true
									},
									"overallScore": {
										"anyOf": [
											{
												"type": "number",
												"format": "double"
											},
											{
												"type": "string"
											}
										],
										"nullable": true
									},
									"globalRankOf190": {
										"anyOf": [
											{
												"type": "number",
												"format": "double"
											},
											{
												"type": "string"
											}
										],
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							}
						},
						"type": "object",
						"nullable": true
					},
					"educationResearchHumanCapital": {
						"properties": {
							"workforceDevelopmentPrograms": {
								"properties": {
									"effectivenessForIndustrialInvestors": {
										"type": "string",
										"nullable": true
									},
									"multinationalsDonorsInvolved": {
										"type": "string",
										"nullable": true
									},
									"publicPrivateWorkforceInitiatives": {
										"type": "string",
										"nullable": true
									},
									"nationalSkillsHumanCapitalStrategy2022To2025": {
										"type": "string",
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							},
							"trainingVocationalAvailable": {
								"properties": {
									"employerInvolvementImplications": {
										"type": "string",
										"nullable": true
									},
									"governmentDonorTvetPrograms": {
										"type": "string",
										"nullable": true
									},
									"alignmentWithIndustrialSkills": {
										"type": "string",
										"nullable": true
									},
									"tvetVocationalSystem": {
										"type": "string",
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							},
							"universitiesSchoolsQuality": {
								"properties": {
									"universityIndustryLinks": {
										"type": "string",
										"nullable": true
									},
									"researchInternationalCollaboration": {
										"type": "string",
										"nullable": true
									},
									"stemEngineeringStrength": {
										"type": "string",
										"nullable": true
									},
									"rankedUniversities2022To2025": {
										"type": "string",
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							}
						},
						"type": "object",
						"nullable": true
					},
					"industrialManufacturingStrengths": {
						"properties": {
							"investmentReadiness": {
								"properties": {
									"oneSentenceJustification": {
										"type": "string",
										"nullable": true
									},
									"readiness": {
										"type": "string",
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							},
							"germanProductsCompanies": {
								"properties": {
									"notableGermanBackedProjectsQualifiers": {
										"type": "string",
										"nullable": true
									},
									"germanProductsCommonlyImportedDirectional": {
										"type": "string",
										"nullable": true
									},
									"germanOemsIndustrialOperationsExamples": {
										"type": "string",
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							},
							"governmentIncentives": {
								"properties": {
									"exportOrientedIncentives": {
										"type": "string",
										"nullable": true
									},
									"localContentLocalisation": {
										"type": "string",
										"nullable": true
									},
									"taxCustomsIncentives": {
										"type": "string",
										"nullable": true
									},
									"industrialZonesSezs": {
										"type": "string",
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							},
							"keySectors": {
								"properties": {
									"maturityQualifier": {
										"type": "string",
										"nullable": true
									},
									"secondaryEmergingSectors": {
										"type": "string",
										"nullable": true
									},
									"primaryManufacturingSectors": {
										"type": "string",
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							}
						},
						"type": "object",
						"nullable": true
					},
					"sustainabilityEnvironment": {
						"properties": {
							"futureDevelopmentPlans": {
								"properties": {
									"indicativeSources": {
										"type": "string",
										"nullable": true
									},
									"strategicImplicationsForGermanIndustrialFirms": {
										"type": "string",
										"nullable": true
									},
									"roleEnvisionedForForeignPrivateInvestors": {
										"type": "string",
										"nullable": true
									},
									"timeHorizonIndicated": {
										"type": "string",
										"nullable": true
									},
									"statusOfPlans": {
										"type": "string",
										"nullable": true
									},
									"sustainabilityLinkedIndustrialDevelopmentPlans": {
										"type": "string",
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							},
							"environmentalInitiatives": {
								"properties": {
									"indicativeSources": {
										"type": "string",
										"nullable": true
									},
									"relevanceForIndustrialManufacturingInvestors": {
										"type": "string",
										"nullable": true
									},
									"implementationSignal": {
										"type": "string",
										"nullable": true
									},
									"circularEconomyResourceEfficiencyInitiatives": {
										"type": "string",
										"nullable": true
									},
									"carbonClimatePolicyInstrumentsAffectingIndustry": {
										"type": "string",
										"nullable": true
									},
									"renewableCleanEnergyInitiativesRelevantToIndustry": {
										"type": "string",
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							},
							"wasteManagementPolicies": {
								"properties": {
									"indicativeSources": {
										"type": "string",
										"nullable": true
									},
									"keyGapsConstraints": {
										"type": "string",
										"nullable": true
									},
									"roleOfPrivateSectorPpps": {
										"type": "string",
										"nullable": true
									},
									"implementationEnforcementSignal": {
										"type": "string",
										"nullable": true
									},
									"wasteStreamsExplicitlyAddressed": {
										"type": "string",
										"nullable": true
									},
									"documentedNationalWasteManagementPolicyStrategy": {
										"type": "string",
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							}
						},
						"type": "object",
						"nullable": true
					},
					"swot": {
						"properties": {
							"threats": {
								"type": "string",
								"nullable": true
							},
							"opportunities": {
								"type": "string",
								"nullable": true
							},
							"weaknesses": {
								"type": "string",
								"nullable": true
							},
							"strengths": {
								"type": "string",
								"nullable": true
							}
						},
						"type": "object",
						"nullable": true
					},
					"conclusion": {
						"properties": {
							"gicStarRatings": {
								"properties": {
									"rationaleIndustrialInvestability": {
										"type": "string",
										"nullable": true
									},
									"investorConfidenceIndicator": {
										"type": "string",
										"nullable": true
									},
									"gicStarRating": {
										"anyOf": [
											{
												"type": "string"
											},
											{
												"type": "number",
												"format": "double"
											}
										],
										"nullable": true
									}
								},
								"type": "object",
								"nullable": true
							}
						},
						"type": "object",
						"nullable": true
					}
				},
				"type": "object",
				"additionalProperties": true
			},
```

