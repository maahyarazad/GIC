import axiosInstance from "./axiosInstance";
import type { CreateTenderRequest, TenderListItem } from "../../../src/types/tender.types";

export { apiErrorCode, apiErrorMessage } from "./events";

const BASE = "/tenders";

export const listTenders = async (sector?: string): Promise<TenderListItem[]> => {
  const response = await axiosInstance.get(BASE, { params: sector ? { sector } : undefined });
  return response.data?.data ?? [];
};

export const createTender = async (
  fields: CreateTenderRequest,
  file?: File | null
): Promise<TenderListItem> => {
  const formData = new FormData();
  formData.append("sector", fields.sector);
  formData.append("publisher", fields.publisher);
  formData.append("announcement", fields.announcement);
  formData.append("publishedAt", fields.publishedAt);
  formData.append("deadline", fields.deadline);
  if (file) formData.append("file", file);

  const response = await axiosInstance.post(BASE, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.data;
};

export const closeTender = async (id: string): Promise<TenderListItem> => {
  const response = await axiosInstance.patch(`${BASE}/${encodeURIComponent(id)}/close`);
  return response.data.data;
};
