-- Preserve every existing account ID as its employee ID before moving licenses.
CREATE TABLE employees (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  account_id BIGINT UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO employees (id, name, email, account_id, created_at)
  SELECT id, name, email, id, created_at FROM users;
SELECT setval(pg_get_serial_sequence('employees', 'id'),
  COALESCE((SELECT MAX(id) FROM employees), 1), EXISTS(SELECT 1 FROM employees));
ALTER TABLE licenses ADD COLUMN employee_id BIGINT;
UPDATE licenses SET employee_id = user_id;
ALTER TABLE licenses ALTER COLUMN employee_id SET NOT NULL;
ALTER TABLE licenses ADD CONSTRAINT licenses_employee_id_fkey
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE RESTRICT;
ALTER TABLE licenses ADD CONSTRAINT uq_licenses_employee_software
  UNIQUE (employee_id, software_id);
CREATE INDEX idx_licenses_employee_id ON licenses(employee_id);
ALTER TABLE licenses DROP COLUMN user_id;
