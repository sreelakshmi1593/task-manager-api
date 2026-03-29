import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 8) return setError("Password must be at least 8 characters.");
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      const errs = err.response?.data?.errors;
      setError(errs ? errs.map((e) => e.msg).join(". ") : err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <span className="logo-icon">⬡</span>
        <span className="logo-text">TaskFlow</span>
      </div>

      <div className="auth-card fade-in">
        <div className="auth-header">
          <h1>Create account</h1>
          <p>Start managing your tasks today</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Full name</label>
            <input
              type="text" name="name" value={form.name}
              onChange={handleChange} placeholder="Jane Doe" required minLength={2}
            />
          </div>
          <div className="form-group">
            <label>Email address</label>
            <input
              type="email" name="email" value={form.email}
              onChange={handleChange} placeholder="you@example.com" required
            />
          </div>
          <div className="form-group">
            <label>Password <span className="hint">(min. 8 chars, uppercase, number)</span></label>
            <input
              type="password" name="password" value={form.password}
              onChange={handleChange} placeholder="••••••••" required
            />
          </div>
          <button type="submit" className="btn-primary auth-submit" disabled={loading}>
            {loading ? <span className="spinner" /> : "Create account"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
