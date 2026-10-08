// Immutable edits on a JSON document addressed by path (keys of objects, indexes of arrays).
// Every function returns a modified deep copy and leaves `source` untouched.

export type JsonPath = (string | number)[];

export type ValueType = "string" | "number" | "boolean" | "null" | "json";

/** The document id identifies the record being saved: it can't be edited, renamed or deleted. */
export const isDocumentIdPath = (path: JsonPath) => path.length === 1 && path[0] === "_id";

export const getAtPath = (source: any, path: JsonPath): any =>
    path.reduce((node, key) => node?.[key], source);

export const isContainer = (value: unknown): value is object =>
    value !== null && typeof value === "object";

export const formatPath = (path: JsonPath) =>
    path.length === 0
        ? "(root)"
        : path.map((key) => (typeof key === "number" ? `[${key}]` : `.${key}`)).join("").replace(/^\./, "");

const parentAndKey = (copy: any, path: JsonPath) => ({
    parent: getAtPath(copy, path.slice(0, -1)),
    key: path[path.length - 1],
});

/** Removes the node at `path`; array items are spliced out. */
export const removeAtPath = (source: any, path: JsonPath): any => {
    const copy = structuredClone(source);
    const { parent, key } = parentAndKey(copy, path);
    if (Array.isArray(parent)) parent.splice(Number(key), 1);
    else if (isContainer(parent)) delete (parent as any)[key];
    return copy;
};

/**
 * Replaces the value at `path` and, for object properties, optionally renames the key
 * (keeping its position among the other keys).
 */
export const updateAtPath = (source: any, path: JsonPath, value: unknown, newKey?: string): any => {
    const copy = structuredClone(source);
    const { parent, key } = parentAndKey(copy, path);

    if (Array.isArray(parent) || newKey === undefined || newKey === key) {
        parent[key] = value;
        return copy;
    }

    // Rebuild the object so the renamed key stays where it was.
    const entries = Object.entries(parent).map(([k, v]) => (k === key ? [newKey, value] : [k, v]));
    for (const k of Object.keys(parent)) delete parent[k];
    for (const [k, v] of entries) parent[k as string] = v;
    return copy;
};

/** Adds `value` to the container at `path`: appended to an array, or under `key` in an object. */
export const addAtPath = (source: any, path: JsonPath, value: unknown, key?: string): any => {
    const copy = structuredClone(source);
    const container = getAtPath(copy, path);
    if (Array.isArray(container)) container.push(value);
    else if (isContainer(container) && key !== undefined) (container as any)[key] = value;
    return copy;
};

export const typeOf = (value: unknown): ValueType => {
    if (value === null) return "null";
    if (typeof value === "number") return "number";
    if (typeof value === "boolean") return "boolean";
    if (typeof value === "string") return "string";
    return "json";
};

/** Text shown in the value field for a given value. */
export const toEditableText = (value: unknown): string => {
    const type = typeOf(value);
    if (type === "json") return JSON.stringify(value, null, 2);
    if (type === "null") return "";
    return String(value);
};

/** Parses the value field; returns an error message instead of a value when invalid. */
export const parseValue = (type: ValueType, text: string): { value: unknown } | { error: string } => {
    switch (type) {
        case "string":
            return { value: text };
        case "number": {
            const trimmed = text.trim();
            const number = Number(trimmed);
            return trimmed !== "" && Number.isFinite(number) ? { value: number } : { error: "Enter a valid number" };
        }
        case "boolean":
            return { value: text === "true" };
        case "null":
            return { value: null };
        case "json":
            try {
                return { value: JSON.parse(text) };
            } catch (error: any) {
                return { error: `Invalid JSON: ${error?.message ?? "parse error"}` };
            }
    }
};

/**
 * An empty value of the same shape: objects keep their keys (recursively), arrays become empty,
 * strings "", numbers 0, booleans false. Used to prefill a new array item from an existing one.
 */
export const blankOf = (value: unknown): unknown => {
    if (Array.isArray(value)) return [];
    if (isContainer(value)) {
        return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, blankOf(v)]));
    }
    if (typeof value === "number") return 0;
    if (typeof value === "boolean") return false;
    if (value === null) return null;
    return "";
};
