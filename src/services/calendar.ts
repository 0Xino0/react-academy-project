import type { CalendarField } from '../types/calendar.ts';

const empty = '—';
const digits = '۰۱۲۳۴۵۶۷۸۹';
const persianDigits = (value: string) => value.replace(/[0-9]/g, digit => digits[Number(digit)]);
const dateFields = new Set(['start_date', 'end_date', 'startRegistration_Date', 'endRegistration_Date', 'payment_date']);
const timestampFields = new Set(['created_at', 'updated_at', 'deleted_at', 'paid_at']);
const timeFields = new Set(['start_time', 'end_time']);
const weekdays: Record<string, string> = {
  saturday: 'شنبه', sunday: 'یکشنبه', monday: 'دوشنبه', tuesday: 'سه‌شنبه',
  wednesday: 'چهارشنبه', thursday: 'پنجشنبه', friday: 'جمعه',
};

const dateFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-arabext', {
  timeZone: 'UTC', year: 'numeric', month: '2-digit', day: '2-digit',
});
const timestampFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-arabext', {
  timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

function parts(formatter: Intl.DateTimeFormat, date: Date, withTime = false): string {
  const values = Object.fromEntries(formatter.formatToParts(date).map(part => [part.type, part.value]));
  const formatted = `${values.year}/${values.month}/${values.day}`;
  return withTime ? `${formatted} ${values.hour}:${values.minute}` : formatted;
}

export function persianDate(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return empty;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(`${value}T12:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.getUTCFullYear() !== year
    || date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day) return empty;
  return parts(dateFormatter, date);
}

export function persianTimestamp(value: unknown): string {
  // A timestamp must identify an instant; a date or a timezone-less value is not one.
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/.test(value)
    || persianDate(value.slice(0, 10)) === empty) return empty;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? parts(timestampFormatter, date, true) : empty;
}

export function timeForInput(value: unknown): string {
  if (typeof value !== 'string') return '';
  const raw = value.trim();
  const standard = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/.exec(raw);
  if (standard) return `${standard[1]}:${standard[2]}${standard[3] && standard[3] !== '00' ? ':' + standard[3] : ''}`;
  const legacy = /^(0?[1-9]|1[0-2]):([0-5]\d) (AM|PM)$/i.exec(raw);
  if (!legacy) return '';
  const hour = Number(legacy[1]) % 12 + (legacy[3].toUpperCase() === 'PM' ? 12 : 0);
  return `${String(hour).padStart(2, '0')}:${legacy[2]}`;
}

export function persianTime(value: unknown): string {
  const time = timeForInput(value);
  return time ? persianDigits(time) : empty;
}

export function persianWeekday(value: unknown): string {
  return typeof value === 'string' ? weekdays[value.toLowerCase()] ?? empty : empty;
}

export function withCalendarDisplay<T>(value: T): T {
  if (Array.isArray(value)) return value.map(item => withCalendarDisplay(item)) as T;
  if (typeof value !== 'object' || value === null) return value;
  const result: Record<string, unknown> = {};
  const display: Partial<Record<CalendarField, string>> = {};
  for (const [key, item] of Object.entries(value)) {
    if (key === 'display') continue;
    result[key] = withCalendarDisplay(item);
    if (dateFields.has(key)) display[key as CalendarField] = persianDate(item);
    else if (timestampFields.has(key)) display[key as CalendarField] = persianTimestamp(item);
    else if (timeFields.has(key)) display[key as CalendarField] = persianTime(item);
    else if (key === 'day_of_week') display.day_of_week = persianWeekday(item);
  }
  if (Object.keys(display).length) result.display = display;
  // Raw Gregorian/ISO fields remain available for edits and requests.
  return result as T;
}
