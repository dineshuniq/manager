import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { themeInitScript } from "@/components/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Orbit — Project Manager",
  description: "Multi-tier project management: Projects, Stories, Tasks, and Subtasks.",
  appleWebApp: { capable: true, title: "Orbit", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Draw under the notch / home indicator; layouts pad with env(safe-area-inset-*).
  viewportFit: "cover",
  // Shrink the layout when the on-screen keyboard opens so focused fields stay visible.
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfbfe" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f17" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        {children}
        <Toaster
          position="bottom-right"
          richColors
          closeButton
          mobileOffset={{ bottom: "calc(var(--bottom-nav-h) + env(safe-area-inset-bottom) + 0.75rem)" }}
        />
      </body>
    </html>
  );
}
