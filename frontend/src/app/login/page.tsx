"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { api, ApiError, extractFieldErrors, NetworkError } from "@/lib/api";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isReady, login, user } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isReady && user) {
      router.replace(user.role === "ADMIN" ? "/admin" : "/user");
    }
  }, [isReady, router, user]);

  function validateLocally(): Record<string, string> {
    const errors: Record<string, string> = {};
    if (!username.trim()) errors.username = "Username is required";
    if (!password) errors.password = "Password is required";
    return errors;
  }

  return (
    <main className="auth-screen">
      <section className="auth-card">
        <h1 className="auth-title">Sign in</h1>
        <p className="auth-copy">
          Use one of the seeded demo accounts or a freshly registered user to enter the dashboard.
        </p>
        <form
          className="auth-form"
          onSubmit={async (event) => {
            event.preventDefault();

            const localErrors = validateLocally();
            if (Object.keys(localErrors).length > 0) {
              setFieldErrors(localErrors);
              return;
            }

            setIsSubmitting(true);
            setFieldErrors({});

            try {
              const response = await api.login(username.trim(), password);
              login(response);
              const nextPath = searchParams.get("next");
              router.push(nextPath ?? (response.user.role === "ADMIN" ? "/admin" : "/user"));
            } catch (error) {
              if (error instanceof ApiError) {
                setFieldErrors(extractFieldErrors(error));
              } else if (error instanceof NetworkError) {
                setFieldErrors({ general: error.message });
              } else {
                setFieldErrors({ general: "Something went wrong. Please try again." });
              }
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          <label className="form-field">
            <span className="field-label">Username</span>
            <input
              className={`field-input${fieldErrors.username ? " is-invalid" : ""}`}
              placeholder="Please input username"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
                if (fieldErrors.username) setFieldErrors((prev) => { const { username: _, ...rest } = prev; return rest; });
              }}
            />
            {fieldErrors.username ? <span className="field-error">{fieldErrors.username}</span> : null}
          </label>
          <label className="form-field">
            <span className="field-label">Password</span>
            <input
              className={`field-input${fieldErrors.password ? " is-invalid" : ""}`}
              placeholder="Please input password"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (fieldErrors.password) setFieldErrors((prev) => { const { password: _, ...rest } = prev; return rest; });
              }}
            />
            {fieldErrors.password ? <span className="field-error">{fieldErrors.password}</span> : null}
          </label>
          {fieldErrors.general ? <p className="form-error">{fieldErrors.general}</p> : null}
          <button className="base-button button-primary w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Signing in…" : "Login"}
          </button>
        </form>
        <div className="auth-meta">
          <p>Admin demo: admin / admin123</p>
          <p>User demo: sarajohn / user1234</p>
          <p>
            Need a user account? <Link href="/register" className="text-[var(--primary-blue)]">Register here</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="auth-screen"><section className="auth-card">Loading…</section></main>}>
      <LoginContent />
    </Suspense>
  );
}