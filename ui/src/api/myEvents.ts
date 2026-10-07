import axiosInstance from "./axiosInstance";
import { MyEventRegistration } from "../../../src/types/event.types";

export const getMyEvents = async (): Promise<MyEventRegistration[]> => {
  const response = await axiosInstance.get("/my-events");
  return response.data?.data?.items ?? [];
};

// Resolves to null when the registration has no QR code yet (404).
export const getMyEventQr = async (reference: string): Promise<Blob | null> => {
  const response = await axiosInstance.get(
    `/my-events/${encodeURIComponent(reference)}/qr`,
    {
      responseType: "blob",
      // The error interceptor drops the status code; handle 404 here instead.
      validateStatus: (status) => (status >= 200 && status < 300) || status === 404,
    }
  );
  return response.status === 404 ? null : response.data;
};
