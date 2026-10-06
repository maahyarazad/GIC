import axiosInstance from './axiosInstance';
import type {
  CreateBusinessLetterRequest,
  BusinessLetterRequestDto,
  BusinessLetterRequestList,
} from '../../../src/types/businessLetter.types';

export async function createBusinessLetterRequest(body: CreateBusinessLetterRequest) {
  const res = await axiosInstance.post('/business-letters', body);
  return res.data as { success: boolean; message: string; data: BusinessLetterRequestDto };
}

export const EMPTY_BUSINESS_LETTER_LIST: BusinessLetterRequestList = { items: [], total: 0, page: 1, pages: 0 };

export async function listBusinessLetterRequests({ limit = 20, skip = 0 } = {}): Promise<BusinessLetterRequestList> {
  const res = await axiosInstance.get('/business-letters', { params: { limit, skip } });
  const data = res.data?.data;
  // Anything other than the expected shape (e.g. an HTML page) is treated as "no requests".
  if (!data || !Array.isArray(data.items)) return EMPTY_BUSINESS_LETTER_LIST;
  return { ...data, total: Number(data.total) || data.items.length };
}

export async function downloadBusinessLetterPdf(id: string, reference: string) {
  const res = await axiosInstance.get(`/business-letters/${id}/pdf`, { responseType: 'blob' });
  const blob = new Blob([res.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${reference}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
