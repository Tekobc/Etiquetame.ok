import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";
import { isAdmin } from "./admin-access";
import { getSupabasePublicKey, getSupabaseUrl } from "./env";

function copyAuthCookies(source: NextResponse, destination: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    destination.cookies.set(cookie);
  });
}

function forbiddenResponse(authResponse: NextResponse) {
  const response = new NextResponse(
    `<!doctype html><html lang="es-AR"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Acceso denegado | Etiquétame</title><body style="margin:0;background:#fffdf7;color:#17333a;font:16px/1.6 system-ui,sans-serif"><main style="box-sizing:border-box;max-width:36rem;margin:12vh auto;padding:2rem"><p style="color:#08766e;font-weight:700">Error 403</p><h1 style="font-size:2rem">No tenés permiso para entrar</h1><p>Esta cuenta no está autorizada para usar el panel de Etiquétame.</p><a style="color:#08766e;font-weight:700" href="/admin/login">Volver al ingreso</a></main></body></html>`,
    {
      status: 403,
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Type": "text/html; charset=utf-8",
      },
    },
  );

  copyAuthCookies(authResponse, response);
  return response;
}

function loginRedirect(request: NextRequest, authResponse: NextResponse) {
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/admin/login";
  loginUrl.search = "";

  const response = NextResponse.redirect(loginUrl);
  copyAuthCookies(authResponse, response);
  ["cache-control", "expires", "pragma"].forEach((name) => {
    const value = authResponse.headers.get(name);
    if (value) {
      response.headers.set(name, value);
    }
  });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient<Database>(
    getSupabaseUrl(),
    getSupabasePublicKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });

          Object.entries(headers).forEach(([name, value]) => {
            response.headers.set(name, value);
          });
        },
      },
    },
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error && error.name !== "AuthSessionMissingError") {
    throw new Error("No se pudo validar la sesión de Supabase.", {
      cause: error,
    });
  }

  if (user && !(await isAdmin(supabase, user.id))) {
    const { error: signOutError } = await supabase.auth.signOut({
      scope: "local",
    });
    if (signOutError) {
      throw new Error("No se pudo cerrar la sesión sin permiso de admin.", {
        cause: signOutError,
      });
    }

    return forbiddenResponse(response);
  }

  const isLoginPage = request.nextUrl.pathname === "/admin/login";
  if (!user && !isLoginPage) {
    return loginRedirect(request, response);
  }

  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
