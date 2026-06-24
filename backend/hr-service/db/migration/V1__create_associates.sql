CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS associates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  date_of_joining DATE NOT NULL,
  probation_duration_months INTEGER NOT NULL CHECK (probation_duration_months > 0),
  probation_end_date DATE NOT NULL,
  task_count INTEGER NOT NULL DEFAULT 0 CHECK (task_count >= 0),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_associates_employee_id ON associates(employee_id);
CREATE INDEX IF NOT EXISTS idx_associates_probation_end_date ON associates(probation_end_date);
