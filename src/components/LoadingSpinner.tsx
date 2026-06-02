"use client";

export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-100">
      <div className="space-y-4 text-center">
        <div className="animate-spin">
          <div className="h-12 w-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto" />
        </div>
        <p className="text-slate-600">Loading...</p>
      </div>
    </div>
  );
}
