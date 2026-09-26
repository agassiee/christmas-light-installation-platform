export function getServiceSeasonLabel(date: Date): string {
  const month = date.getMonth(); // 0 = Jan, 7 = Aug
  const year = date.getFullYear();

  // If August through December (7 to 11)
  if (month >= 7) {
    return `${year}-${year + 1}`;
  }

  // If January through July (0 to 6)
  return `${year - 1}-${year}`;
}
