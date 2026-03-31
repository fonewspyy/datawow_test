"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { api, ApiError, extractFieldErrors, NetworkError } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validateLocally(): Record<string, string> {
    const errors: Record<string, string> = {};
    if (!username.trim()) errors.username = "Username is required";
    else if (username.trim().length < 3) errors.username = "Username must be at least 3 characters";
    else if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) errors.username = "Username can only include letters, numbers, and underscores";
    if (!password) errors.password = "Password is required";
    else if (password.length < 6) errors.password = "Password must be at least 6 characters";
    return errors;
  }

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

            const localErrors = validateLocally();
            if (Object.keys(localErrors).length > 0) {
              setFieldErrors(localErrors);
              return;
            }

            setIsSubmitting(true);
            setFieldErrors({});

            try {
              const response = await api.register(username.trim(), password);
              login(response);
              router.push("/user");
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
              type="password"
              placeholder="Please input password"
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
            {isSubmitting ? "Creating account…" : "Register"}
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