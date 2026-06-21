"use client";

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-[calc(100vh-120px)] items-center justify-center bg-linear-to-br from-slate-50 via-blue-50 to-slate-100 px-4 py-12">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/dashboard"
      />
    </div>
  );
}
