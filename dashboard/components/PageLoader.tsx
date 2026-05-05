"use client";

/**
 * Full-page loading spinner with animated dots
 * Shows while API calls are pending
 */
export default function PageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/20 backdrop-blur-[2px]">
      {/* Animated dots */}
      <div className="flex items-center gap-2">
        <span 
          className="w-4 h-4 rounded-sm bg-primary-600 animate-[bounce_1s_ease-in-out_infinite]" 
          style={{ animationDelay: "0ms" }}
        />
        <span 
          className="w-4 h-4 rounded-sm bg-primary-600 animate-[bounce_1s_ease-in-out_infinite]" 
          style={{ animationDelay: "150ms" }}
        />
        <span 
          className="w-4 h-4 rounded-sm bg-primary-600 animate-[bounce_1s_ease-in-out_infinite]" 
          style={{ animationDelay: "300ms" }}
        />
      </div>
    </div>
  );
}
