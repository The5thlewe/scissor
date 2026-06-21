import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import Navbar from "@/components/Navbar";
import "@/app/globals.css";
export const metadata: Metadata = {
  title: "Scissor - Fast URL Shortener",
  description:
    "Shorten URLs instantly with custom slugs, QR codes, and real-time analytics.",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
      afterSignOutUrl="/"
    >
      <html lang="en" suppressHydrationWarning>
        <head>
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
            rel="stylesheet"
          />
        </head>
        <body className="bg-white">
          <ConvexClientProvider>
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1">{children}</main>
              <footer className="border-t border-slate-200 bg-slate-50 py-8 px-4">
                <div className="max-w-7xl mx-auto text-center text-sm text-slate-600">
                  <p>
                    © 2024 Scissor. Built with{" "}
                    <a
                      href="https://nextjs.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Next.js
                    </a>{" "}
                    and{" "}
                    <a
                      href="https://convex.dev"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Convex
                    </a>
                  </p>
                </div>
              </footer>
            </div>
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
