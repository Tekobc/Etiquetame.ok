import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export async function getAuthenticatedUser(
  supabase: SupabaseClient<Database>,
): Promise<User | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error && error.name !== "AuthSessionMissingError") {
    throw new Error("No se pudo validar la identidad de la cuenta.", {
      cause: error,
    });
  }

  return user;
}

export async function isAdmin(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error("No se pudo verificar el permiso de administración.", {
      cause: error,
    });
  }

  return data !== null;
}
