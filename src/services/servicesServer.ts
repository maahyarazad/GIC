import * as jwt from "jsonwebtoken";
import { tokenExpiry } from "../config/tokenConfig";

const REQUEST_TIMEOUT_MS = 10_000;

// Thrown when the services platform cannot be reached (network error or timeout).
export class ServicesUnavailableError extends Error {
  readonly reason: unknown;

  constructor(reason?: unknown) {
    super("Services server unavailable");
    this.name = "ServicesUnavailableError";
    this.reason = reason;
  }
}

export const getServicesOrigin = (): string | undefined =>
  process.env.NODE_ENV === "PRODUCTION"
    ? process.env.SERVICES_SERVER_ORIGIN_PROD
    : process.env.SERVICES_SERVER_ORIGIN_DEV;

// GET a services-platform endpoint with a short-lived external access token.
// Returns the raw Response; non-2xx statuses are left to the caller.
export const servicesFetch = async (
  path: string,
  query?: Record<string, string>
): Promise<Response> => {
  const search = query ? `?${new URLSearchParams(query).toString()}` : "";
  const url = `${getServicesOrigin()}${path}${search}`;

  const externalAccessToken = jwt.sign(
    {},
    process.env.EXTERNAL_ACCESS_SECRET as string,
    { expiresIn: tokenExpiry.externalAccess.value }
  );

  try {
    return await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": externalAccessToken,
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    throw new ServicesUnavailableError(error);
  }
};
