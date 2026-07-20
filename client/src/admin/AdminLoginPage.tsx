import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setAdminToken } from "../auth/adminSession";
import { API_URL } from "../api/client";

/** Standalone admin login (NOT Auth0 — one credential from the server's
    env). On success the token guards every admin write via x-admin-token. */
export function AdminLoginPage() {
  const navigate = useNavigate();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? `API error ${res.status}`);
      setAdminToken(data.token);
      navigate("/admin");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPending(false);
    }
  }

  const fieldCls = "min-h-11 w-full rounded-lg border border-edge bg-surface px-3 text-sm";
  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-black tracking-tight">Admin login</h1>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="admin-login" className="mb-1 block text-sm font-semibold">Login</label>
          <input id="admin-login" value={login} onChange={(e) => setLogin(e.target.value)} className={fieldCls} />
        </div>
        <div>
          <label htmlFor="admin-password" className="mb-1 block text-sm font-semibold">Password</label>
          <input id="admin-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={fieldCls} />
        </div>
        {error && <p className="text-sm text-fire">{error}</p>}
        <button
          type="submit"
          disabled={pending || login === "" || password === ""}
          className="min-h-11 w-full rounded-lg bg-accent px-6 font-semibold text-bg hover:brightness-110 disabled:opacity-60"
        >
          {pending ? "Checking…" : "Log in"}
        </button>
      </form>
    </main>
  );
}
