import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlowPay | Merchant payments dashboard",
  description: "Fictional merchant payments dashboard with transaction insights and browser-saved invoices.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
