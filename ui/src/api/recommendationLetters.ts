import axiosInstance from "./axiosInstance";
import type {
  LetterFields,
  LetterRequestDetail,
  LetterRequestListItem,
} from "../../../src/types/recommendationLetter.types";

export { apiErrorCode, apiErrorMessage, apiFieldErrors } from "./events";

/** The operations the shared editor/preview UI needs; member mode omits send/approve. */
export interface LetterApiClient {
  list(): Promise<LetterRequestListItem[]>;
  get(id: string): Promise<LetterRequestDetail>;
  save(id: string, fields: LetterFields): Promise<LetterRequestDetail>;
  pdf(id: string, fields: LetterFields, disposition: "inline" | "attachment"): Promise<Blob>;
  send?(id: string): Promise<{ message: string; detail: LetterRequestDetail }>;
  approve?(id: string): Promise<{ message: string; detail: LetterRequestDetail }>;
}

const makePath = (base: string) => (id: string, suffix = "") => `${base}/${encodeURIComponent(id)}${suffix}`;

// An unknown API path falls through to the SSR page (HTML, 200); treat that as a failure.
const makeList = (base: string) => async (): Promise<LetterRequestListItem[]> => {
  const response = await axiosInstance.get(base);
  const items = response.data?.data?.items;
  if (!Array.isArray(items)) throw new Error("Unexpected response from the letter requests API");
  return items;
};

const makeGet = (path: (id: string, suffix?: string) => string) => async (id: string): Promise<LetterRequestDetail> => {
  const response = await axiosInstance.get(path(id));
  return response.data.data;
};

const makeSave =
  (path: (id: string, suffix?: string) => string) =>
  async (id: string, fields: LetterFields): Promise<LetterRequestDetail> => {
    const response = await axiosInstance.put(path(id, "/letter"), fields);
    return response.data.data;
  };

/**
 * PDF of the given (possibly unsaved) letter values. Requested as an ArrayBuffer so a JSON error
 * body is decoded by axiosInstance's interceptor into a normal ApiError.
 */
const makePdf =
  (path: (id: string, suffix?: string) => string) =>
  async (id: string, fields: LetterFields, disposition: "inline" | "attachment"): Promise<Blob> => {
    const response = await axiosInstance.post(path(id, "/letter/pdf"), fields, {
      params: { disposition },
      responseType: "arraybuffer",
    });
    return new Blob([response.data], { type: "application/pdf" });
  };

// ── Admin client (api/v1/admin/letter-requests) ──
const ADMIN_BASE = "/admin/letter-requests";
const adminPath = makePath(ADMIN_BASE);

export const listLetterRequests = makeList(ADMIN_BASE);
export const getLetterRequest = makeGet(adminPath);
export const saveLetter = makeSave(adminPath);
export const fetchLetterPdf = makePdf(adminPath);

export const sendLetter = async (id: string): Promise<{ message: string; detail: LetterRequestDetail }> => {
  const response = await axiosInstance.post(adminPath(id, "/letter/send"));
  return { message: response.data.message, detail: response.data.data };
};

export const approveLetter = async (id: string): Promise<{ message: string; detail: LetterRequestDetail }> => {
  const response = await axiosInstance.post(adminPath(id, "/approve"));
  return { message: response.data.message, detail: response.data.data };
};

export const adminLetterApi: LetterApiClient = {
  list: listLetterRequests,
  get: getLetterRequest,
  save: saveLetter,
  pdf: fetchLetterPdf,
  send: sendLetter,
  approve: approveLetter,
};

// ── Member client (api/v1/letter-requests) — own requests only; no send/approve ──
const MEMBER_BASE = "/letter-requests";
const memberPath = makePath(MEMBER_BASE);

export const listMyLetters = makeList(MEMBER_BASE);
export const getMyLetter = makeGet(memberPath);
export const saveMyLetter = makeSave(memberPath);
export const fetchMyLetterPdf = makePdf(memberPath);

export const memberLetterApi: LetterApiClient = {
  list: listMyLetters,
  get: getMyLetter,
  save: saveMyLetter,
  pdf: fetchMyLetterPdf,
};
