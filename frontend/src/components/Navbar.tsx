'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/create', label: 'Create Assessment' },
  { href: '/assessments', label: 'My Assessments' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav
      className="glass no-print"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: '1px solid rgba(99,102,241,0.2)',
        padding: '0 2rem',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 64,
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #4338ca, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              boxShadow: '0 0 15px rgba(99,102,241,0.4)',
            }}
          >
            ✦
          </div>
          <span style={{ fontWeight: 700, fontSize: '1.125rem', letterSpacing: '-0.02em' }}>
            Veda<span className="gradient-text">AI</span>
          </span>
        </Link>

        {/* Nav Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {navLinks.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: 8,
                  fontSize: '0.9rem',
                  fontWeight: active ? 600 : 400,
                  color: active ? '#a5b4fc' : '#94a3b8',
                  background: active ? 'rgba(99,102,241,0.12)' : 'transparent',
                  border: active ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent',
                  textDecoration: 'none',
                  transition: 'all 200ms ease',
                }}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/create"
            className="btn btn-primary btn-sm"
            style={{ marginLeft: '0.5rem' }}
          >
            + New
          </Link>
        </div>
      </div>
    </nav>
  );
}
