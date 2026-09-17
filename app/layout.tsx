import type { Metadata, Viewport } from "next";
import { APP_NAME, APP_TAGLINE } from "@/constants";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — AI Market Intelligence`,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_TAGLINE,
  openGraph: {
    title: `${APP_NAME} — AI Market Intelligence`,
    description: APP_TAGLINE,
    type: "website",
    siteName: APP_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — AI Market Intelligence`,
    description: APP_TAGLINE,
  },
  icons: "/icon.svg",
};

export const viewport: Viewport = {
  themeColor: "#050505",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
