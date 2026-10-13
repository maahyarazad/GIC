export type TenderStatus = "open" | "closed";

export interface TenderAttachment {
  filename: string; // stored name on disk
  originalName: string; // as uploaded
  mimetype: string;
  size: number; // bytes
}

export interface TenderListItem {
  id: string;
  sector: string; // one of the 10 fixed sectors (src/config/industrySectors.ts)
  publisher: string;
  announcement: string;
  publishedAt: string; // ISO date
  deadline: string; // ISO date
  status: TenderStatus; // derived — see research.md R4
  attachment: TenderAttachment | null;
  creator: { name: string; email: string };
  createdAt: string;
}

export interface CreateTenderRequest {
  sector: string;
  publisher: string;
  announcement: string;
  publishedAt: string; // ISO date
  deadline: string; // ISO date
  // `file` is a multipart field, not part of the JSON body (see POST /tenders).
}
