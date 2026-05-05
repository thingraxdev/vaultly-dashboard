import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Vaultly",
  description: "Secure resource access and session management",
};

/**
 * Root layout for the application
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <div className="min-h-screen">{children}</div>
      </body>
    </html>
  );
}
