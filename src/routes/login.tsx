import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { PageShell } from "@/components/page-shell";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";

const searchSchema = z.object({
  mode: z.enum(["create", "signin"]).optional(),
});

export const Route = createFileRoute("/login")({
  validateSearch: searchSchema,
  component: LoginPage,
});

const field =
  "h-12 w-full rounded-md bg-surface-2 px-4 text-fg shadow-[var(--shadow-border)] outline-none placeholder:text-subtle";

function LoginPage() {
  const { mode } = Route.useSearch();
  const creating = mode !== "signin";
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      const result = creating
        ? await authClient.signUp.email({
            name: name.trim(),
            email: email.trim(),
            password,
            callbackURL: "/vehicles",
          })
        : await authClient.signIn.email({
            email: email.trim(),
            password,
            callbackURL: "/vehicles",
          });
      if (result.error) {
        setError(result.error.message ?? "That email and password did not work.");
        return;
      }
      await navigate({ to: "/vehicles" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach the account service.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell>
      <main className="mx-auto w-full max-w-md px-4 py-12">
        <h1 className="font-display text-4xl font-semibold tracking-tight">
          {creating ? "Create an account" : "Sign in"}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {creating ? "Email and a password. Google and X work too." : "Use the email and password on your account."}
        </p>
        {!authEnabled ? (
          <p className="mt-6 text-sm text-subtle">Sign-in is disabled.</p>
        ) : (
          <>
            <form className="mt-8 space-y-3" onSubmit={(event) => void submit(event)}>
              {creating ? (
                <label className="block text-sm">
                  <span className="text-subtle">Name</span>
                  <input
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                    className={`${field} mt-1`}
                  />
                </label>
              ) : null}
              <label className="block text-sm">
                <span className="text-subtle">Email</span>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  className={`${field} mt-1`}
                />
              </label>
              <label className="block text-sm">
                <span className="text-subtle">Password</span>
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={creating ? "new-password" : "current-password"}
                  minLength={8}
                  className={`${field} mt-1`}
                />
              </label>
              {error ? (
                <p role="alert" className="text-sm text-danger">
                  {error}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={busy}
                className="h-12 w-full rounded-md bg-paper font-medium text-ink hover:bg-accent disabled:opacity-60"
              >
                {busy ? "Working" : creating ? "Create account" : "Sign in"}
              </button>
            </form>
            <p className="mt-4 text-sm text-muted">
              {creating ? "Already have an account?" : "Need an account?"}{" "}
              <button
                type="button"
                className="text-fg underline-offset-4 hover:underline"
                onClick={() =>
                  void navigate({
                    to: "/login",
                    search: creating ? { mode: "signin" } : {},
                  })
                }
              >
                {creating ? "Sign in" : "Create one"}
              </button>
            </p>
            <div className="mt-8 space-y-2">
              <p className="text-xs uppercase tracking-widest text-subtle">Or continue with</p>
              {GROK_PROVIDERS.map((provider) => (
                <button
                  key={provider.providerId}
                  type="button"
                  onClick={() => void signIn(provider.providerId, { callbackURL: "/vehicles" })}
                  className="h-12 w-full rounded-md bg-surface-2 font-medium text-fg shadow-[var(--shadow-border)] hover:bg-surface"
                >
                  Continue with {provider.label}
                </button>
              ))}
            </div>
          </>
        )}
      </main>
    </PageShell>
  );
}
