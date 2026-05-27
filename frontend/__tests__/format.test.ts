import {
  formatCurrency,
  formatDate,
  UNIT_LABELS,
  STATUS_LABELS,
} from '@/lib/utils/format';

describe('formatCurrency', () => {
  it('formats a number to Vietnamese đồng', () => {
    expect(formatCurrency(1000)).toMatch(/1\.000.*₫/);
  });

  it('handles string input', () => {
    expect(formatCurrency('12500')).toMatch(/12\.500.*₫/);
  });

  it('returns 0 ₫ for invalid input', () => {
    expect(formatCurrency('not-a-number')).toMatch(/0.*₫/);
  });
});

describe('formatDate', () => {
  it('formats an ISO date', () => {
    expect(formatDate('2024-03-15')).toBe('15/03/2024');
  });

  it('returns - for null', () => {
    expect(formatDate(null)).toBe('-');
  });

  it('returns - for undefined', () => {
    expect(formatDate(undefined)).toBe('-');
  });
});

describe('UNIT_LABELS', () => {
  it('has Vietnamese label for each medicine unit', () => {
    expect(UNIT_LABELS.tablet).toBe('Viên');
    expect(UNIT_LABELS.bottle).toBe('Chai');
    expect(UNIT_LABELS.box).toBe('Hộp');
  });
});

describe('STATUS_LABELS', () => {
  it('translates import statuses', () => {
    expect(STATUS_LABELS.pending).toBe('Đang chờ');
    expect(STATUS_LABELS.completed).toBe('Hoàn tất');
    expect(STATUS_LABELS.cancelled).toBe('Đã hủy');
  });
});
