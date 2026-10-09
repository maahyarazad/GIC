import axiosInstance from "./axiosInstance";
import type {
  LetterFields,
  LetterRequestDetail,
  LetterRequestListItem,
} from "../../../src/types/recommendationLetter.types";

export { apiErrorCode, apiErrorMessage, apiFieldErrors } from "./events";

const BASE = "/admin/letter-requests";
const path = (id: string, suffix = "") => `${BASE}/${encodeURIComponent(id)}${suffix}`;

// An unknown API path falls through to the SSR page (HTML, 200); treat that as a failure.
export const listLetterRequests = async (): Promise<LetterRequestListItem[]> => {
  const response = await axiosInstance.get(BASE);
  const items = response.data?.data?.items;
  if (!Array.isArray(items)) throw new Error("Unexpected response from the letter requests API");
  return items;
};

export const getLetterRequest = async (id: string): Promise<LetterRequestDetail> => {
  const response = await axiosInstance.get(path(id));
  return response.data.data;
};

export const saveLetter = async (id: string, fields: LetterFields): Promise<LetterRequestDetail> => {
  const response = await axiosInstance.put(path(id, "/letter"), fields);
  return response.data.data;
};

/**
 * PDF of the given (possibly unsaved) letter values. Requested as an ArrayBuffer so a JSON error
 * body is decoded by axiosInstance's interceptor into a normal ApiError.
 */
export const fetchLetterPdf = async (
  id: string,
  fields: LetterFields,
  disposition: "inline" | "attachment"
): Promise<Blob> => {
  const response = await axiosInstance.post(path(id, "/letter/pdf"), fields, {
    params: { disposition },
    responseType: "arraybuffer",
  });
  return new Blob([response.data], { type: "application/pdf" });
};

export const sendLetter = async (id: string): Promise<{ message: string; detail: LetterRequestDetail }> => {
  const response = await axiosInstance.post(path(id, "/letter/send"));
  return { message: response.data.message, detail: response.data.data };
};
