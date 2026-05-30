export type BulletinPdfItem = {
  id: string;
  partNumber: number;
  referenceDate: string | null;
  title: string;
  content: string;
  displayOrder: number;
};

export type BulletinPdfData = {
  id: string;
  number: number;
  year: number;
  publicationDate: string | null;
  startDate: string;
  endDate: string;
  type: string;
  status: string;
  version: number;
  approvedAt: string | null;
  items: BulletinPdfItem[];
};

export class BulletinPdfError extends Error {
  constructor(
    public readonly code: "not_found" | "not_approved" | "load_failed",
    message: string,
  ) {
    super(message);
    this.name = "BulletinPdfError";
  }
}
