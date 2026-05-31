type BulletinFilenameInput = {
  number: number;
  year: number;
  startDate: string;
  endDate: string;
};

function formatDateForFilename(date: string): string {
  const [year, month, day] = date.split("-");
  return `${day}-${month}-${year}`;
}

export function buildBulletinPdfFilename(input: BulletinFilenameInput): string {
  const number = String(input.number).padStart(3, "0");
  const start = formatDateForFilename(input.startDate);
  const end = formatDateForFilename(input.endDate);

  if (input.startDate === input.endDate) {
    return `BI_CFO_${input.year}_N${number}_${start}.pdf`;
  }

  return `BI_CFO_${input.year}_N${number}_${start}_a_${end}.pdf`;
}
