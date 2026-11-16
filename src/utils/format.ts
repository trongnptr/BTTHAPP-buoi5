const pad = (n: number) => n.toString().padStart(2, '0');

/** Giờ dạng HH:mm, dùng trong bong bóng chat. */
export function formatClock(ts: number): string {
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Hôm nay hiện HH:mm, các ngày khác hiện dd/MM. */
export function formatListTime(ts: number): string {
  if (!ts) return '';
  const d = new Date(ts);
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay ? formatClock(ts) : `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}

const AVATAR_COLORS = ['#0066cc', '#e67e22', '#27ae60', '#8e44ad', '#c0392b', '#16a085', '#2c3e50'];

/** Màu avatar ổn định theo tên. */
export function avatarColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export const initialOf = (name: string) => (name.trim().charAt(0) || '?').toUpperCase();
