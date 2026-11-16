import { getCurrentUserProfile } from "@/lib/profile";
import { redirect } from "next/navigation";

/**
 * Verifies if the currently authenticated user has admin privileges.
 * Admin roles are stored in public.user_roles where users cannot elevate themselves.
 */
export async function verifyAdminStatus(): Promise<{
  isAdmin: boolean;
  userId?: string;
  email?: string;
}> {
  const { user, supabase } = await getCurrentUserProfile();

  if (!user) {
    return { isAdmin: false };
  }

  // Check user_roles table for 'admin' role
  const { data: roleData, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (error || !roleData) {
    return { isAdmin: false, userId: user.id, email: user.email };
  }

  return { isAdmin: true, userId: user.id, email: user.email };
}

/**
 * Enforces admin authorization. Redirects non-admins or unauthenticated users.
 */
export async function requireAdmin() {
  const { user, profile, supabase } = await getCurrentUserProfile();

  if (!user) {
    redirect("/login?redirect=/admin");
  }

  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!roleData) {
    redirect("/");
  }

  return { user, profile, supabase };
}
