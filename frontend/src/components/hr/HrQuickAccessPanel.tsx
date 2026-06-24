import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function buildCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<number | null> = [];

  for (let i = 0; i < firstDay; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);

  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function HrQuickAccessPanel() {
  const now = useMemo(() => new Date(), []);
  const [time, setTime] = useState(now);

  useEffect(() => {
    const timer = window.setInterval(() => setTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const monthLabel = time.toLocaleString('default', { month: 'long', year: 'numeric' });
  const days = buildCalendarDays(time.getFullYear(), time.getMonth());
  const today = time.getDate();

  return (
    <motion.div
      className="elevate-panel elevate-quick-access"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
    >
      <h3>Quick Access</h3>

      <div className="quick-access-clock">
        <div className="quick-access-clock-icon">
          <span className="material-symbols-outlined">schedule</span>
        </div>
        <div>
          <strong>
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </strong>
          <span>{time.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}</span>
        </div>
      </div>

      <div className="quick-access-calendar">
        <div className="quick-access-calendar-header">
          <span>{monthLabel}</span>
        </div>
        <div className="quick-access-calendar-grid weekdays">
          {WEEKDAYS.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="quick-access-calendar-grid days">
          {days.map((day, index) => (
            <span
              key={`${day ?? 'empty'}-${index}`}
              className={day === today ? 'today' : day ? 'day' : 'empty'}
            >
              {day ?? ''}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
