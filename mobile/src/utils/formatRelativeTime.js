/**
 * Short relative time for message list and chat (e.g. "18 dk", "1 sa", "2 gün").
 */
export function formatRelativeTimeShort(createdAt) {
  if (!createdAt) return '';
  const date = new Date(createdAt);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'şimdi';
  if (diffMins < 60) return `${diffMins} dk`;
  if (diffHours < 24) return `${diffHours} sa`;
  if (diffDays < 7) return `${diffDays} gün`;
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

/** Date divider label for chat: "Bugün", "Dün", or "15 Oca". */
export function formatDateDivider(createdAt) {
  if (!createdAt) return '';
  const date = new Date(createdAt);
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const d = date.toDateString();
  if (d === today) return 'Bugün';
  if (d === yesterday.toDateString()) return 'Dün';
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

/** Time for bubble (e.g. "12:30"). */
export function formatTime(createdAt) {
  if (!createdAt) return '';
  return new Date(createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}
