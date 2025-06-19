import express from 'express';
import ical from 'ical-generator';
import { getVtimezoneComponent } from '@touch4it/ical-timezones';
import { DateTime } from 'luxon';

const app = express();
const port = 4000;

const ZONE = 'Europe/Madrid';
const REFERENCE_REBUIG_DATE = DateTime.fromISO('2025-05-07T07:00:00', { zone: ZONE }); // Rebuig Wednesday

// Define weekday rules
const WEEKDAY_RULES = {
  1: 'Envasos',               // Monday
  2: 'Paper i orgànica',      // Tuesday
  4: 'Orgànica',              // Thursday
  5: 'Envasos',               // Friday
  7: 'Orgànica',              // Sunday
};

app.get('/verges.ics', (req, res) => {
  const cal = ical({ name: 'Calendari de Residus — Verges' });

  cal.timezone({
    name: 'FOO',
    generator: getVtimezoneComponent,
  });

  const today = DateTime.now().setZone(ZONE).startOf('day');
  const end = today.plus({ weeks: 2 });

  for (let date = today; date < end; date = date.plus({ days: 1 })) {
    const weekday = date.weekday;

    if (weekday === 3) {
      // Wednesday: alternate Rebuig/Vidre
      const weeksSinceReference = Math.floor(REFERENCE_REBUIG_DATE.diff(date.startOf('week'), 'weeks').weeks * -1);
      const summary = weeksSinceReference % 2 === 0 ? 'Rebuig' : 'Vidre';
      cal.createEvent({
        start: date.set({ hour: 7 }),
        summary,
        allDay: true, // 👈 make it an all-day event
        timezone: ZONE,
      });
    } else if (WEEKDAY_RULES[weekday]) {
      cal.createEvent({
        start: date.set({ hour: 7 }),
        summary: WEEKDAY_RULES[weekday],
        allDay: true, // 👈 make it an all-day event
        timezone: ZONE,
      });
    }
  }

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="verges.ics"');
  res.send(cal.toString()); // ✅ use toString instead of cal.serve
});

app.listen(port, '0.0.0.0', () => {
  console.log(`ICS calendar available at http://localhost:${port}/verges.ics`);
});
