import Link from "next/link";
import { Button } from "@/components/ui/Button";
 
export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-slate-900 mb-4">404</h1>
        <p className="text-xl text-slate-600 mb-8">
          Page not found
        </p>
        <Link href="/">
          <button className="rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-700">
            Go Home
          </button>
        </Link>
      </div>
    </div>
  );
}