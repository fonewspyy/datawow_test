"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { api, ApiError, extractFieldErrors } from "@/lib/api";

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
            setIsSubmitting(true);
            setFieldErrors({});

            try {
              const response = await api.login(username, password);
              login(response);
              const nextPath = searchParams.get("next");
              router.push(nextPath ?? (response.user.role === "ADMIN" ? "/admin" : "/user"));
            } catch (error) {
              if (error instanceof ApiError) {
                setFieldErrors(extractFieldErrors(error));
              }
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          <label className="form-field">
            <span className="field-label">Username</span>
            <input
              className="field-input"
              placeholder="Please input username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
            {fieldErrors.username ? <span className="field-error">{fieldErrors.username}</span> : null}
          </label>
          <label className="form-field">
            <span className="field-label">Password</span>
            <input
              className="field-input"
              placeholder="Please input password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            {fieldErrors.password ? <span className="field-error">{fieldErrors.password}</span> : null}
          </label>
          {fieldErrors.general ? <p className="form-error">{fieldErrors.general}</p> : null}
          <button className="base-button button-primary w-full" disabled={isSubmitting} type="submit">
            Login
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