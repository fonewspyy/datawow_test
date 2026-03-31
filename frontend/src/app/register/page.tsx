"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { api, ApiError, extractFieldErrors } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <main className="auth-screen">
      <section className="auth-card">
        <h1 className="auth-title">Create account</h1>
        <p className="auth-copy">
          Registration creates a user-role account that can immediately start reserving seats.
        </p>
        <form
          className="auth-form"
          onSubmit={async (event) => {
            event.preventDefault();
            setIsSubmitting(true);
            setFieldErrors({});

            try {
              const response = await api.register(username, password);
              login(response);
              router.push("/user");
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
              type="password"
              placeholder="Please input password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            {fieldErrors.password ? <span className="field-error">{fieldErrors.password}</span> : null}
          </label>
          {fieldErrors.general ? <p className="form-error">{fieldErrors.general}</p> : null}
          <button className="base-button button-primary w-full" disabled={isSubmitting} type="submit">
            Register
          </button>
        </form>
        <div className="auth-meta">
          <p>
            Already registered? <Link href="/login" className="text-[var(--primary-blue)]">Go to login</Link>
          </p>
        </div>
      </section>
    </main>
  );
}