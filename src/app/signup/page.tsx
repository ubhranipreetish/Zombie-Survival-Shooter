"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Signup failed");
      } else {
        localStorage.setItem("user", JSON.stringify(data));
        router.push("/");
      }
    } catch {
      setError("Cannot reach server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    window.location.href = `${API}/google`;
  };

  return (
    <div className="auth-page">
      {/* Animated background */}
      <div className="auth-bg">
        <div className="auth-bg-orb auth-bg-orb-1" />
        <div className="auth-bg-orb auth-bg-orb-2" />
        <div className="auth-bg-orb auth-bg-orb-3" />
      </div>

      <div className="auth-container">
        {/* Logo / Branding */}
        <div className="auth-branding">
          <div className="auth-skull">🧟</div>
          <h1 className="auth-game-title">
            JOIN THE<span className="auth-title-accent">RESISTANCE</span>
          </h1>
          <p className="auth-tagline">Create your survivor profile</p>
        </div>

        {/* Card */}
        <div className="auth-card">
          <div className="auth-card-header">
            <h2 className="auth-card-title">Sign Up</h2>
            <p className="auth-card-subtitle">Register and survive</p>
          </div>

          {error && (
            <div className="auth-error-banner">
              <span className="auth-error-icon">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSignup} className="auth-form">
            <div className="auth-field">
              <label htmlFor="signup-name" className="auth-label">
                Survivor Name
              </label>
              <input
                id="signup-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="auth-input"
                placeholder="John Doe"
                autoComplete="name"
              />
            </div>

            <div className="auth-field">
              <label htmlFor="signup-email" className="auth-label">
                Email Address
              </label>
              <input
                id="signup-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                placeholder="survivor@example.com"
                autoComplete="email"
              />
            </div>

            <div className="auth-field">
              <label htmlFor="signup-password" className="auth-label">
                Password <span className="auth-label-hint">(min 6 chars)</span>
              </label>
              <input
                id="signup-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>

            <button
              id="signup-submit-btn"
              type="submit"
              disabled={loading}
              className="auth-btn auth-btn-primary"
            >
              {loading ? (
                <span className="auth-btn-loading">
                  <span className="auth-spinner-sm" />
                  Creating Account...
                </span>
              ) : (
                "CREATE SURVIVOR PROFILE"
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span className="auth-divider-line" />
            <span className="auth-divider-text">or register with</span>
            <span className="auth-divider-line" />
          </div>

          <button
            id="google-signup-btn"
            onClick={handleGoogleSignup}
            className="auth-btn auth-btn-google"
          >
            <svg className="auth-google-icon" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign up with Google
          </button>

          <p className="auth-footer-text">
            Already a survivor?{" "}
            <Link href="/login" className="auth-link">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
