"use client";
 
import { useAuth } from "@clerk/nextjs";
import Shortener from "@/components/Shortener";
import Link from "next/link";
 
export default function HomePage() {
  const { isSignedIn } = useAuth();
 
  return (
    <div className="min-h-[calc(100vh-120px)] bg-linear-to-br from-slate-50 via-blue-50 to-slate-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-slate-900">
            Scissor
          </h1>
          <p className="text-xl text-slate-700">Fast, minimal URL shortening</p>
          <p className="text-slate-600 mt-2">
            With custom slugs, QR codes, and real-time analytics
          </p>
        </div>
 
        {/* Shortener */}
        <Shortener />
 
        {/* CTA */}
        {!isSignedIn && (
          <div className="mt-12 text-center">
            <p className="text-slate-600 mb-4">
              Sign in or create an account to save and track your links
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/sign-in"
                className="bg-white border border-slate-300 hover:border-blue-600 text-slate-800 font-semibold py-2 px-4 rounded-lg transition-all duration-200"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
              >
                Sign Up
              </Link>
            </div>
          </div>
        )}
 
        {/* Features */}
        <section className="mt-20">
          <h2 className="text-3xl font-bold text-center mb-12">Why Scissor?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: "⚡",
                title: "Lightning Fast",
                desc: "Shorten in <1s. Redirects in <100ms.",
              },
              {
                icon: "🎨",
                title: "Custom Branded",
                desc: "Create branded short links with custom slugs.",
              },
              {
                icon: "📊",
                title: "Real-time Analytics",
                desc: "Track clicks, devices, referrers instantly.",
              },
            ].map((f, i) => (
              <div key={i} className="card p-6 text-center">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-xl font-bold mb-2">{f.title}</h3>
                <p className="text-slate-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
