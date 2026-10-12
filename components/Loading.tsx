import { Loader2 } from "lucide-react";

interface LoadingProps {
  className?: string;
}

export default function Loading({ className = "" }: LoadingProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`min-h-screen flex items-center justify-center bg-gray-50 ${className}`}
    >
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      <span className="sr-only">Loading...</span>
    </div>
  );
}
