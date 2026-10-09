import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "FlowPay | Merchant payments dashboard", template: "%s | FlowPay" },
  description: "Explore a fictional Nigerian merchant dashboard with payment insights, searchable transactions, browser-saved invoices, and downloadable PDFs.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
