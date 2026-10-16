"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = { error: null };

export function LoginForm({
  unauthorized = false,
}: {
  unauthorized?: boolean;
}) {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState,
  );

  return (
    <form action={formAction} className="admin-login-form">
      {unauthorized ? (
        <p className="form-message" role="alert">
          Tu cuenta no tiene permiso para entrar al panel de administración.
        </p>
      ) : null}

      <label className="admin-field" htmlFor="email">
        Email
        <input
          autoComplete="username"
          autoFocus
          id="email"
          maxLength={254}
          name="email"
          placeholder="luana@ejemplo.com"
          required
          type="email"
        />
      </label>

      <label className="admin-field" htmlFor="password">
        Contraseña
        <input
          autoComplete="current-password"
          id="password"
          maxLength={128}
          minLength={8}
          name="password"
          required
          type="password"
        />
      </label>

      {state.error ? (
        <p className="form-message" role="alert">
          {state.error}
        </p>
      ) : null}

      <button className="button button-primary login-submit" disabled={isPending}>
        {isPending ? "Ingresando..." : "Ingresar al panel"}
      </button>
    </form>
  );
}
