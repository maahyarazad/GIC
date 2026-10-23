// Placeholders every email template can use without the sender supplying them.
// Shared with the UI (template variable extraction), so keep this file free of Node-only imports.

interface GlobalEmailVariable {
  /** Evaluated at send time, so values like the year never go stale. */
  resolve: () => string;
  /** When true the global is only a default and caller data wins (e.g. a specific event's name). */
  overridable: boolean;
}

export const GLOBAL_EMAIL_VARIABLES: Record<string, GlobalEmailVariable> = {
  CURRENT_YEAR: { resolve: () => String(new Date().getFullYear()), overridable: false },
  EVENT_NAME: { resolve: () => "GIC", overridable: true },
};

export const GLOBAL_EMAIL_VARIABLE_NAMES: ReadonlySet<string> = new Set(
  Object.keys(GLOBAL_EMAIL_VARIABLES)
);

/** Merges the globals into `data`: overridable ones as defaults, the rest always on top. */
export function withGlobalEmailVariables<T extends Record<string, any>>(
  data: T = {} as T
): T & Record<string, string> {
  const defaults: Record<string, string> = {};
  const fixed: Record<string, string> = {};
  for (const [name, variable] of Object.entries(GLOBAL_EMAIL_VARIABLES)) {
    (variable.overridable ? defaults : fixed)[name] = variable.resolve();
  }
  return { ...defaults, ...data, ...fixed };
}
