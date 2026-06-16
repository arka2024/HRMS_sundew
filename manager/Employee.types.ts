// ============================================================
// Employee — TypeScript model types
// ============================================================

export interface Employee {
  id: number;
  emp_number: string;        // e.g. "SDS250"
  full_name: string;
  email: string;
  date_joined: string;       // ISO-8601 string: "YYYY-MM-DD"
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Payload for INSERT — id, timestamps, and is_active are DB-managed */
export interface NewEmployee {
  emp_number: string;
  full_name: string;
  email: string;
  date_joined: string;       // "YYYY-MM-DD"
}

/** All fields optional for PATCH-style updates */
export type UpdateEmployee = Partial<
  Pick<NewEmployee, "full_name" | "email" | "date_joined"> & { is_active: boolean }
>;