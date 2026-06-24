import { motion } from 'framer-motion';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function MonthlyDocumentTally() {
  const currentMonth = new Date().getMonth();

  return (
    <motion.div
      className="elevate-panel elevate-monthly-tally"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="elevate-panel-header">
        <h3>Monthly Document Tally</h3>
        <span className="elevate-panel-meta">{currentMonth + 1} of 12 active</span>
      </div>

      <div className="monthly-tally-grid">
        {MONTHS.map((month, index) => {
          const isChecked = index <= currentMonth;
          const isCurrent = index === currentMonth;

          return (
            <label
              key={month}
              className={`monthly-tally-item${isCurrent ? ' current' : ''}${isChecked ? ' checked' : ''}`}
            >
              <input type="checkbox" checked={isChecked} readOnly tabIndex={-1} />
              <span>{month.slice(0, 3)}</span>
            </label>
          );
        })}
      </div>
    </motion.div>
  );
}
