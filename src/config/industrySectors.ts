/**
 * The fixed set of industry sectors members permanently choose from.
 *
 * Shared, single source of truth: imported by the server (user/tender validation)
 * and the UI (registration step, wizard, tender form) so the list is never
 * duplicated or allowed to drift between the two.
 */

export const INDUSTRY_SECTORS = [
  "Energy, Oil & Gas, and Sustainability",
  "Aerospace, Aviation, Industrial Manufacturing, and Automation",
  "Construction and Infrastructure",
  "Digital Technology and AI, Information Technology (IT), and Telecommunications",
  "Chemicals and Petrochemicals",
  "Pharmaceuticals and Life Sciences, Medical Technology, and Healthcare",
  "Logistics and Supply Chain, and Transportation",
  "Food and Beverage",
  "Tourism and Hospitality",
  "Retail and E-Commerce",
] as const;

export type IndustrySector = (typeof INDUSTRY_SECTORS)[number];

export function isIndustrySector(value: unknown): value is IndustrySector {
  return typeof value === "string" && (INDUSTRY_SECTORS as readonly string[]).includes(value);
}

export const SECTOR_PERMANENCE_NOTICE =
  "Your sector selection is permanent and cannot be changed later. Please choose carefully.";
