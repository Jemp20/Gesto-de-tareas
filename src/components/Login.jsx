// src/components/Login.jsx
import { useState } from "react";
import { useAuth } from "../AuthContext";

export default function Login() {
  const { login, error, loading } = useAuth();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(email, password);
    // AuthContext actualiza `user`, App.jsx detecta el cambio y muestra el panel admin
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
    }}>
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(232,255,71,0.06) 0%, transparent 70%)",
      }} />

      <div style={{ width: "100%", maxWidth: 380, position: "relative" }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{
            fontFamily: "var(--font-head)", fontSize: "2.5rem", fontWeight: 800,
            letterSpacing: "-2px", color: "var(--accent)", lineHeight: 1,
          }}>
            TASK<span style={{ color: "var(--text)" }}>LOG</span>
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--muted)", marginTop: "0.5rem", letterSpacing: "4px" }}>
            PANEL DE ADMINISTRACIÓN
          </div>
        </div>

        <div className="card" style={{ padding: "2rem" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>

            <div className="form-group">
              <label className="form-label">Correo</label>
              <input
                className="form-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@correo.com"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <div style={{ position: "relative" }}>
                <input
                  className="form-input"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{ paddingRight: "3rem" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: "absolute", right: "0.8rem", top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: "1rem"
                  }}
                >
                  {showPass ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                background: "rgba(255,69,96,0.1)", border: "1px solid var(--danger)",
                borderRadius: "var(--radius)", padding: "0.7rem 1rem",
                fontSize: "0.8rem", color: "var(--danger)"
              }}>
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: "100%", justifyContent: "center", padding: "0.8rem", fontSize: "0.9rem", marginTop: "0.3rem" }}
            >
              {loading ? "Entrando..." : "Entrar →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
