import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlowPay | Merchant payments dashboard",
  description: "FlowPay demo merchant payments dashboard. Your workspace is ready.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
