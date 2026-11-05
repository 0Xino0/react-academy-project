import test from 'node:test';
import assert from 'node:assert/strict';
import { persianDate, persianTimestamp, persianTime, persianWeekday, timeForInput, withCalendarDisplay } from '../../src/services/calendar.ts';

test('Gregorian dates display the Persian year, month and day around Nowruz and a leap year', () => {
  assert.equal(persianDate('2026-03-21'), '۱۴۰۵/۰۱/۰۱');
  assert.equal(persianDate('2025-03-20'), '۱۴۰۳/۱۲/۳۰');
  assert.equal(persianDate('2025-03-21'), '۱۴۰۴/۰۱/۰۱');
  assert.equal(persianDate('2026-11-06'), '۱۴۰۵/۰۸/۱۵');
});

test('date-only values do not move a day when the machine timezone differs', () => {
  const original = process.env.TZ;
  try {
    for (const timezone of ['UTC', 'America/Los_Angeles', 'Asia/Tehran']) {
      process.env.TZ = timezone;
      assert.equal(persianDate('2026-03-21'), '۱۴۰۵/۰۱/۰۱');
    }
  } finally {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  }
});

test('timestamps use the Tehran timezone while a schedule time never shifts timezone', () => {
  assert.equal(persianTimestamp('2026-03-20T21:00:00Z'), '۱۴۰۵/۰۱/۰۱ ۰۰:۳۰');
  assert.equal(persianTimestamp('2026-03-21T00:30:00+03:30'), '۱۴۰۵/۰۱/۰۱ ۰۰:۳۰');
  assert.equal(persianTime('09:00:00'), '۰۹:۰۰');
});

test('empty and invalid calendar values show a placeholder instead of Invalid Date or rolled dates', () => {
  for (const value of [null, undefined, '', 'not-a-date', '2026-02-31', '1405/01/01']) assert.equal(persianDate(value), '—');
  for (const value of [null, '', '2026-03-21', '2026-03-21T09:00:00', '2026-02-31T09:00:00Z']) {
    assert.equal(persianTimestamp(value), '—');
  }
  assert.equal(persianDate('2024-02-29') === '—', false);
  assert.equal(persianTime('24:30'), '—');
});

test('24-hour and legacy times handle midnight, noon, afternoon and nonzero seconds', () => {
  assert.equal(timeForInput('12:00 AM'), '00:00');
  assert.equal(timeForInput('12:00 PM'), '12:00');
  assert.equal(timeForInput('2:30 PM'), '14:30');
  assert.equal(timeForInput('14:30:00'), '14:30');
  assert.equal(timeForInput('14:30:25'), '14:30:25');
  assert.equal(persianTime('14:30:25'), '۱۴:۳۰:۲۵');
  assert.equal(timeForInput('14:65'), '');
  assert.equal(persianWeekday('Monday'), 'دوشنبه');
});

test('API presentation handles nested arrays and leaves raw Gregorian fields and payloads unchanged', () => {
  const raw = { status: true, data: [{ start_date: '2026-03-21', start_time: '14:30:00',
    created_at: '2026-03-20T21:00:00Z', registration: { class: { end_date: '2026-11-06' } },
    name: 'Not a date: 2026-03-21', grade: '17.5' }] };
  const before = JSON.stringify(raw);
  const converted = withCalendarDisplay(raw) as typeof raw & { data: Array<{ display: Record<string, string>;
    registration: { class: { display: Record<string, string> } } }> };
  assert.equal(converted.data[0].display.start_date, '۱۴۰۵/۰۱/۰۱');
  assert.equal(converted.data[0].display.start_time, '۱۴:۳۰');
  assert.equal(converted.data[0].display.created_at, '۱۴۰۵/۰۱/۰۱ ۰۰:۳۰');
  assert.equal(converted.data[0].registration.class.display.end_date, '۱۴۰۵/۰۸/۱۵');
  assert.equal(converted.data[0].start_date, '2026-03-21');
  assert.equal(converted.data[0].start_time, '14:30:00');
  assert.equal(JSON.stringify(raw), before);
  assert.equal(converted.data[0].name, raw.data[0].name);
  assert.equal(converted.data[0].grade, '17.5');
  assert.deepEqual(withCalendarDisplay(converted), converted);
});
