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

export async function listBusinessLetterRequests({ limit = 20, skip = 0 } = {}) {
  const res = await axiosInstance.get('/business-letters', { params: { limit, skip } });
  return res.data.data as BusinessLetterRequestList;
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
