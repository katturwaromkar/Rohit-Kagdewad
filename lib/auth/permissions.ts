export type Permission =
  | "borrowers.view"
  | "borrowers.create"
  | "borrowers.edit"
  | "borrowers.delete"
  | "loans.view"
  | "loans.create"
  | "loans.edit"
  | "loans.close"
  | "payments.view"
  | "payments.create"
  | "payments.reverse"
  | "reports.view"
  | "reports.export"
  | "whatsapp.send"
  | "settings.manage"
  | "users.manage"
  | "audit_logs.view"
  | "dues.view";

export const ROLE_DEFAULT_PERMISSIONS: Record<string, Permission[]> = {
  OWNER: [
    "borrowers.view",
    "borrowers.create",
    "borrowers.edit",
    "borrowers.delete",
    "loans.view",
    "loans.create",
    "loans.edit",
    "loans.close",
    "payments.view",
    "payments.create",
    "payments.reverse",
    "reports.view",
    "reports.export",
    "whatsapp.send",
    "settings.manage",
    "users.manage",
    "audit_logs.view",
    "dues.view",
  ],
  STAFF: [
    "borrowers.view",
    "borrowers.create",
    "borrowers.edit",
    "loans.view",
    "loans.create",
    "payments.view",
    "payments.create",
    "reports.view",
    "reports.export",
    "whatsapp.send",
    "dues.view",
  ],
  COLLECTION_AGENT: [
    "borrowers.view",
    "loans.view",
    "payments.view",
    "payments.create",
    "whatsapp.send",
    "dues.view",
  ],
};

export function hasPermission(
  role: string,
  userCustomPermissions: string[] = [],
  requiredPermission: Permission
): boolean {
  if (role === "OWNER") {
    return true; // Owner has all permissions
  }

  // Check if role has default permission
  const rolePerms = ROLE_DEFAULT_PERMISSIONS[role] || [];
  if (rolePerms.includes(requiredPermission)) {
    return true;
  }

  // Check custom override permissions
  return userCustomPermissions.includes(requiredPermission);
}
