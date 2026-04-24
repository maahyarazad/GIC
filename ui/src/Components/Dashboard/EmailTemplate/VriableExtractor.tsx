type VariableType = "G" | "NG";

interface TemplateVariable {
  name: string;
  type: VariableType;
}

const GLOBAL_VARS = new Set(["CURRENT_YEAR", "EVENT_NAME"]);

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
      type: GLOBAL_VARS.has(name) ? "G" : "NG",
    });
  }

  return result;
}