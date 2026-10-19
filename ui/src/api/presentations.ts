import axiosInstance, { ApiError } from "./axiosInstance";
import type {
  PresentationDto,
} from "../../../src/types/presentation.types";

// Rejected requests arrive as the ApiError produced by axiosInstance's interceptor.
export const apiErrorCode = (error: unknown): string | undefined =>
  (error as ApiError)?.error?.code;

export const apiErrorMessage = (error: unknown, fallback: string): string =>
  (error as ApiError)?.message || fallback;

/** Protected view route for a presentation; opens in a new tab. */
export const presentationViewUrl = (id: string): string =>
  `/api/v1/presentations/${encodeURIComponent(id)}/view`;

/** Upload a presentation and attach it to an event, reporting upload progress (0–100). */
export const uploadPresentation = async (
  input: { eventId: string; title: string; file: File },
  onProgress?: (percent: number) => void,
  signal?: AbortSignal
): Promise<PresentationDto> => {
  const form = new FormData();
  form.append("file", input.file);
  form.append("eventId", input.eventId);
  form.append("title", input.title);

  const response = await axiosInstance.post("/presentations", form, {
    signal,
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (event) => {
      if (!onProgress) return;
      const total = event.total ?? input.file.size;
      if (total > 0) onProgress(Math.round((event.loaded / total) * 100));
    },
  });

  const presentation = response.data?.data?.presentation;
  if (!presentation) throw new Error("Unexpected response from the presentations API");
  return presentation;
};

/** All presentations attached to an event (any signed-in member may read). */
export const getPresentationsByEvent = async (
  eventId: string,
  signal?: AbortSignal
): Promise<PresentationDto[]> => {
  const response = await axiosInstance.get("/presentations", {
    params: { eventId },
    signal,
  });
  const presentations = response.data?.data?.presentations;
  if (!Array.isArray(presentations)) {
    throw new Error("Unexpected response from the presentations API");
  }
  return presentations;
};

/** Delete a presentation (uploader or admin only). */
export const deletePresentation = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/presentations/${encodeURIComponent(id)}`);
};
