import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { logoutAction } from "./actions";
import {
  getAuthenticatedUser,
  isAdmin,
} from "@/lib/supabase/admin-access";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminPanelLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);

  if (!user) {
    redirect("/admin/login");
  }

  if (!(await isAdmin(supabase, user.id))) {
    redirect("/admin/login?error=unauthorized");
  }

  return (
    <div className="admin-panel">
      <header className="admin-header">
        <Link aria-label="Volver al sitio de Etiquétame" href="/">
          <Image
            alt="Etiquétame"
            height={58}
            src="/brand/logo.png"
            width={58}
          />
        </Link>
        <div className="admin-header-account">
          <span>Panel de administración</span>
          <form action={logoutAction}>
            <button className="admin-logout" type="submit">
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>
      {children}
    </div>
  );
}
