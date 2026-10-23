import { GLOBAL_EMAIL_VARIABLE_NAMES } from "../../../../../src/config/emailGlobalVariables";

type VariableType = "G" | "NG";

interface TemplateVariable {
  name: string;
  type: VariableType;
}


export function extractTemplateVariables(html: string): TemplateVariable[] {
  const regex = /{{\s*([^}]+)\s*}}/g;

  const result: TemplateVariable[] = [];
  const seen = new Set<string>();

  let match;

  while ((match = regex.exec(html)) !== null) {
    const name = match[1].trim();

    if (seen.has(name)) continue;
    seen.add(name);

    result.push({
      name,
      type: GLOBAL_EMAIL_VARIABLE_NAMES.has(name) ? "G" : "NG",
    });
  }

  return result;
}