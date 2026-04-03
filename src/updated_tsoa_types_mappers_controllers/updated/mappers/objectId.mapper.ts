import { ObjectId } from "mongodb";

export const toObjectId = (value?: string | null): ObjectId | null => {
  if (!value || !ObjectId.isValid(value)) return null;
  return new ObjectId(value);
};

export const toObjectIdArray = (values?: Array<string | null> | null): ObjectId[] =>
  (values ?? [])
    .filter((value): value is string => !!value && ObjectId.isValid(value))
    .map((value) => new ObjectId(value));

export const mapId = (value: unknown): string | undefined => {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (value instanceof ObjectId) return value.toHexString();
  if (typeof (value as any)?.toHexString === "function") return (value as any).toHexString();
  return String(value);
};
