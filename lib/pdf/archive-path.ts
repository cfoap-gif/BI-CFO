import { buildBulletinPdfFilename } from "./filename";

type BulletinArchivePathInput = {
  number: number;
  year: number;
  startDate: string;
  endDate: string;
  version: number;
};

export function buildBulletinArchivePath(input: BulletinArchivePathInput): string {
  const filename = buildBulletinPdfFilename(input).replace(
    /\.pdf$/,
    `_v${input.version}.pdf`,
  );

  return `${input.year}/${filename}`;
}
