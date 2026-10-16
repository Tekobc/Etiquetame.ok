import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "./login-form";
import {
  getAuthenticatedUser,
  isAdmin,
} from "@/lib/supabase/admin-access";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ingresar | Etiquétame",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
  let unauthorized = (await searchParams).error === "unauthorized";

  if (user) {
    if (await isAdmin(supabase, user.id)) {
      redirect("/admin");
    }

    unauthorized = true;
  }

  return (
    <main className="admin-login-page">
      <section aria-labelledby="admin-login-title" className="admin-login-card">
        <Link aria-label="Etiquétame, inicio" className="login-brand" href="/">
          <Image
            alt=""
            height={88}
            priority
            src="/brand/logo.png"
            width={88}
          />
          <span>Tienda de stickers by Luana</span>
        </Link>
        <p className="eyebrow">Solo para Luana y su equipo</p>
        <h1 id="admin-login-title">Ingresá a tu espacio.</h1>
        <p className="login-intro">
          Usá el email y la contraseña de tu cuenta autorizada.
        </p>
        <LoginForm unauthorized={unauthorized} />
        <Link className="login-back-link" href="/">
          Volver a la tienda
        </Link>
      </section>
    </main>
  );
}
