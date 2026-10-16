"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getAuthenticatedUser,
  isAdmin,
} from "@/lib/supabase/admin-access";

export async function logoutAction() {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);

  if (user && !(await isAdmin(supabase, user.id))) {
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) {
      throw new Error("No se pudo cerrar la sesión.", { cause: error });
    }

    redirect("/admin/login?error=unauthorized");
  }

  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) {
    throw new Error("No se pudo cerrar la sesión.", { cause: error });
  }

  redirect("/admin/login");
}
