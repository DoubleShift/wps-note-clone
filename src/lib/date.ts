export function format(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const isToday = d.toDateString() === now.toDateString();
  const isThisYear = d.getFullYear() === now.getFullYear();

  if (isToday) return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  if (isThisYear) return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatDateShort(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}