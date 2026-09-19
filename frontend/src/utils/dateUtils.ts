/**
 * Date and time formatting utilities for FOMO event displays.
 */
export function formatEventDateTime(scheduledAt?: string, expiresAt?: string): string {
  if (!scheduledAt && !expiresAt) return 'Upcoming';
  const target = scheduledAt ? new Date(scheduledAt) : new Date(expiresAt!);
  if (isNaN(target.getTime())) return 'Upcoming';

  const now = new Date();
  const isToday =
    target.getDate() === now.getDate() &&
    target.getMonth() === now.getMonth() &&
    target.getFullYear() === now.getFullYear();

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow =
    target.getDate() === tomorrow.getDate() &&
    target.getMonth() === tomorrow.getMonth() &&
    target.getFullYear() === tomorrow.getFullYear();

  const timeStr = target.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

  if (isToday) {
    return `Today, ${timeStr}`;
  } else if (isTomorrow) {
    return `Tomorrow, ${timeStr}`;
  } else {
    const dayStr = target.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    return `${dayStr} • ${timeStr}`;
  }
}
