"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const name = searchParams.get("name");
    const email = searchParams.get("email");
    const id = searchParams.get("id");
    const error = searchParams.get("error");

    if (error) {
      router.replace(`/login?error=${error}`);
      return;
    }

    if (token && name && email) {
      localStorage.setItem(
        "user",
        JSON.stringify({ token, name, email, _id: id })
      );
      router.replace("/");
    } else {
      router.replace("/login?error=oauth_failed");
    }
  }, [searchParams, router]);

  return (
    <div className="auth-callback-screen">
      <div className="auth-callback-card">
        <div className="auth-spinner" />
        <p className="auth-callback-text">Authenticating with Google...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-callback-screen">
          <div className="auth-callback-card">
            <div className="auth-spinner" />
            <p className="auth-callback-text">Loading...</p>
          </div>
        </div>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}
