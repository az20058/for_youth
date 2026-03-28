export function calculateDDay(deadline: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);

  const diffMs = deadlineDate.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function formatDDay(days: number): string {
  if (days >= 0) return `D-${days}`;
  return `D+${Math.abs(days)}`;
}
