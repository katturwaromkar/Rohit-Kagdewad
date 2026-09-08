import { getSessionUser, SessionUser } from "./session";
import { Permission, hasPermission } from "./permissions";
import { redirect } from "next/navigation";

export async function requireAuth(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const user = await requireAuth();
  if (!hasPermission(user.role, user.permissions, permission)) {
    throw new Error(`Forbidden: Missing required permission [${permission}]`);
  }
  return user;
}

export async function checkPermission(permission: Permission): Promise<{ authorized: boolean; user: SessionUser | null }> {
  const user = await getSessionUser();
  if (!user) {
    return { authorized: false, user: null };
  }
  const authorized = hasPermission(user.role, user.permissions, permission);
  return { authorized, user };
}
