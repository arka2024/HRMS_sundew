CREATE TABLE IF NOT EXISTS managers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_number VARCHAR(50) UNIQUE NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    date_of_joining DATE NOT NULL,
    total_hours_worked INTEGER NOT NULL DEFAULT 0 CHECK (total_hours_worked >= 0),
    department VARCHAR(255) NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    manager_id UUID NOT NULL REFERENCES managers(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_employees_manager_id ON employees(manager_id);
CREATE INDEX IF NOT EXISTS idx_employees_employee_number ON employees(employee_number);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);

INSERT INTO managers (id, employee_id, name, email)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'MGR001',
    'Demo Manager',
    'demo.manager@sundew.com'
)
ON CONFLICT (employee_id) DO NOTHING;
