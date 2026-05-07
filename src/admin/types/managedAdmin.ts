/** Roles for the Admin Management table — extend when backend adds more roles */
export type ManagedAdminRole = "main_admin" | "admin";

/** Administrator row — swap state hook for API DTO mapping later */
export type ManagedAdmin = {
  id: string;
  name: string;
  email: string;
  role: ManagedAdminRole;
  /** ISO date string (YYYY-MM-DD) */
  createdAt: string;
};

export type CreateManagedAdminInput = {
  name: string;
  email: string;
  password: string;
  role: ManagedAdminRole;
};
