import { getServiceSeasonLabel } from './season';

describe('getServiceSeasonLabel', () => {
  it('should return YYYY-(YYYY+1) for August through December', () => {
    expect(getServiceSeasonLabel(new Date('2026-08-15'))).toBe('2026-2027');
    expect(getServiceSeasonLabel(new Date('2026-09-01'))).toBe('2026-2027');
    expect(getServiceSeasonLabel(new Date('2026-12-31'))).toBe('2026-2027');
  });

  it('should return (YYYY-1)-YYYY for January through July', () => {
    expect(getServiceSeasonLabel(new Date('2027-01-01'))).toBe('2026-2027');
    expect(getServiceSeasonLabel(new Date('2027-07-31'))).toBe('2026-2027');
  });
});
