/** Human-friendly date/time formatting without external dependencies. */

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < MIN) return 'Just now';
  if (diff < HOUR) {
    const m = Math.floor(diff / MIN);
    return `${m}m ago`;
  }
  if (diff < DAY) {
    const h = Math.floor(diff / HOUR);
    return `${h}h ago`;
  }
  if (diff < 2 * DAY) return 'Yesterday';
  if (diff < 7 * DAY) {
    const d = Math.floor(diff / DAY);
    return `${d}d ago`;
  }
  return shortDate(ts);
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function shortDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  if (d.getFullYear() !== now.getFullYear()) {
    return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function longDate(ts: number): string {
  const d = new Date(ts);
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function timeOfDay(ts: number): string {
  const d = new Date(ts);
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function dateTime(ts: number): string {
  return `${shortDate(ts)} · ${timeOfDay(ts)}`;
}

export function dayLabel(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today.getTime() - DAY);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (sameDay(d, today)) return 'Today';
  if (sameDay(d, yesterday)) return 'Yesterday';
  const diff = Date.now() - ts;
  if (diff < 7 * DAY) return WEEKDAYS[d.getDay()];
  return shortDate(ts);
}

export function isToday(ts: number): boolean {
  const d = new Date(ts);
  const now = new Date();
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

export function reminderLabel(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const time = timeOfDay(ts);
  if (isToday(ts)) return `Today ${time}`;
  const tomorrow = new Date(now.getTime() + DAY);
  if (d.getDate() === tomorrow.getDate() && d.getMonth() === tomorrow.getMonth()) {
    return `Tomorrow ${time}`;
  }
  return `${shortDate(ts)} ${time}`;
}

/** Quick reminder presets offered in the editor. */
export function reminderPresets(): { label: string; value: number }[] {
  const now = new Date();
  const at = (days: number, hour: number, minute = 0) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    d.setHours(hour, minute, 0, 0);
    return d.getTime();
  };
  const inHours = (h: number) => Date.now() + h * HOUR;
  const todayEvening = at(0, 20);
  return [
    { label: 'In 1 hour', value: inHours(1) },
    { label: 'In 3 hours', value: inHours(3) },
    { label: 'This evening', value: todayEvening > Date.now() ? todayEvening : at(1, 9) },
    { label: 'Tomorrow 9 AM', value: at(1, 9) },
    { label: 'Next week', value: at(7, 9) },
  ];
}
