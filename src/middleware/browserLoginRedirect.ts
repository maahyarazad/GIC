import { Response, NextFunction } from "express";
import { authMiddleware, AuthRequest } from "./auth.middleware";

/** True for page navigations (typed/clicked links), false for fetch/XHR callers. */
const isBrowserNavigation = (req: AuthRequest): boolean => {
  const mode = req.headers["sec-fetch-mode"];
  if (mode) return mode === "navigate";
  return String(req.headers.accept ?? "").includes("text/html");
};

/**
 * authMiddleware for routes opened directly in the browser: an unauthenticated
 * navigation is redirected to the login page (which returns the user here afterwards),
 * while API/XHR callers keep receiving the JSON 401.
 */
export const browserLoginRedirect = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!isBrowserNavigation(req)) return authMiddleware(req, res, next);

  const loginUrl = `/login?redirect=${encodeURIComponent(req.originalUrl)}`;
  const originalStatus = res.status.bind(res);
  res.status = ((code: number) => {
    if (code === 401) {
      res.status = originalStatus;
      res.redirect(302, loginUrl);
      // Swallow the JSON body authMiddleware is about to send.
      return { json: () => res } as unknown as Response;
    }
    return originalStatus(code);
  }) as Response["status"];

  return authMiddleware(req, res, next);
};
