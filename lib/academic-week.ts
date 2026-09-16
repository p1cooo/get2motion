export function getAcademicWeek(
  semesterStartDateStr?: string,
  targetDateInput?: Date | string
): number {
  const startDateStr = semesterStartDateStr || '2026-09-01';
  const startDate = new Date(startDateStr + 'T00:00:00');
  
  const targetDate = targetDateInput
    ? typeof targetDateInput === 'string'
      ? new Date(targetDateInput + 'T00:00:00')
      : targetDateInput
    : new Date();

  // Reset to midnight UTC/local for clean day difference
  const startMs = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate()
  ).getTime();
  const targetMs = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    targetDate.getDate()
  ).getTime();

  const diffDays = Math.floor((targetMs - startMs) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return 1;
  }
  
  return Math.floor(diffDays / 7) + 1;
}

export function formatDueDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function getRelativeBadge(dateStr?: string | null): { label: string; isPast: boolean } {
  if (!dateStr) return { label: 'Upcoming', isPast: false };
  const d = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: 'Overdue', isPast: true };
  }
  if (diffDays === 0) {
    return { label: 'Today', isPast: false };
  }
  if (diffDays === 1) {
    return { label: 'Tomorrow', isPast: false };
  }
  if (diffDays <= 7) {
    return { label: `${diffDays} days`, isPast: false };
  }
  if (diffDays <= 14) {
    return { label: '2 weeks', isPast: false };
  }
  if (diffDays <= 21) {
    return { label: '3 weeks', isPast: false };
  }
  if (diffDays <= 35) {
    return { label: '1 month', isPast: false };
  }
  const weeks = Math.round(diffDays / 7);
  return { label: `${weeks} weeks`, isPast: false };
}
