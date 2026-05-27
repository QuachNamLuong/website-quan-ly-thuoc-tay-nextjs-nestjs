export function formatCurrency(value: number | string): string {
  const num = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(num)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(num);
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '-';
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '-';
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export const UNIT_LABELS: Record<string, string> = {
  tablet: 'Viên',
  bottle: 'Chai',
  box: 'Hộp',
  tube: 'Tuýp',
  ampoule: 'Ống',
  vial: 'Lọ',
  pack: 'Gói',
};

export const STATUS_LABELS: Record<string, string> = {
  pending: 'Đang chờ',
  completed: 'Hoàn tất',
  cancelled: 'Đã hủy',
};
