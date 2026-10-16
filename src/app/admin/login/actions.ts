"use server";

import { AuthError } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState = {
  error: string | null;
};

export async function loginAction(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const emailValue = formData.get("email");
  const passwordValue = formData.get("password");

  if (
    typeof emailValue !== "string" ||
    typeof passwordValue !== "string" ||
    emailValue.length > 254 ||
    passwordValue.length > 128 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue.trim()) ||
    passwordValue.length < 8
  ) {
    return { error: "Ingresá un email y una contraseña válidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: emailValue.trim(),
    password: passwordValue,
  });

  if (error) {
    if (!(error instanceof AuthError)) {
      throw error;
    }

    console.error("[admin-login] Supabase rechazó el inicio de sesión:", {
      name: error.name,
      status: error.status,
    });
    return { error: "Email o contraseña incorrectos." };
  }

  redirect("/admin");
}
