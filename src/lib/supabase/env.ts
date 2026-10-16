export function getSupabaseUrl(): string {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!value) {
    throw new Error("Falta configurar NEXT_PUBLIC_SUPABASE_URL.");
  }

  return value;
}

export function getSupabasePublicKey(): string {
  const value =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!value) {
    throw new Error(
      "Falta configurar NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (o la clave anon heredada).",
    );
  }

  return value;
}

export function getSupabaseServiceRoleKey(): string {
  const value = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!value) {
    throw new Error("Falta configurar SUPABASE_SERVICE_ROLE_KEY en el servidor.");
  }

  return value;
}
