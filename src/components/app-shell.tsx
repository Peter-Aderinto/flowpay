'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeftRight, LayoutDashboard, ReceiptText, Menu, X, Wallet } from 'lucide-react';
const links = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/invoices', label: 'Invoices', icon: ReceiptText },
];
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const title = links.find(l => l.href === pathname)?.label ?? 'FlowPay';
  return <div className="app-shell">
    <a className="skip-link" href="#main">Skip to content</a>
    <aside className="sidebar">
      <Link href="/dashboard" className="wordmark"><span className="brand-icon"><Wallet size={21} aria-hidden="true" /></span>FlowPay</Link>
      <p className="sidebar-label">MERCHANT WORKSPACE</p>
      <nav aria-label="Main navigation" className="desktop-nav">{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined} className="nav-link"><Icon size={19} aria-hidden="true" />{label}</Link>)}</nav>
      <div className="merchant"><span className="avatar">OS</span><div><strong>Olive & Stitch</strong><small>Demo merchant · Lagos</small></div></div>
    </aside>
    <div className="workspace">
      <header className="app-header">
        <div className="header-left"><button className="mobile-toggle icon-button" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(!open)}>{open ? <X size={22} /> : <Menu size={22} />}</button><span className="header-title">{title}</span></div>
        <span className="demo-badge"><span aria-hidden="true" />Demo environment</span>
      </header>
      <nav id="mobile-navigation" aria-label="Mobile navigation" className="mobile-nav" hidden={!open}>{links.map(({ href, label }) => <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined} onClick={() => setOpen(false)}>{label}</Link>)}</nav>
      <main id="main" className="main-content">{children}</main>
      <footer className="app-footer">Sample data · No real money movement.</footer>
    </div>
  </div>;
}
