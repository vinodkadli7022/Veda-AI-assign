'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useState } from 'react';
import { useAssessmentStore } from '@/store/assessmentStore';

interface Props {
  children: ReactNode;
  title?: string;
  showBackButton?: boolean;
}

export default function VedaLayout({ children, title = 'Assignment', showBackButton = false }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { assessments } = useAssessmentStore();
  const [toast, setToast] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [schoolName, setSchoolName] = useState('Delhi Public School');
  const [schoolLocation, setSchoolLocation] = useState('Bokaro Steel City');
  const [tempSchoolName, setTempSchoolName] = useState('Delhi Public School');
  const [tempSchoolLocation, setTempSchoolLocation] = useState('Bokaro Steel City');

  const activeCount = assessments.length;

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const openSettings = () => {
    setTempSchoolName(schoolName);
    setTempSchoolLocation(schoolLocation);
    setIsSettingsOpen(true);
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/assessments');
    }
  };

  return (
    <div className="app-container">
      {/* ── Desktop Sidebar (Web view) ── */}
      <aside className="sidebar no-print">
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #f97316, #ea580c)', // Brand orange-red gradient
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(249, 115, 22, 0.25)',
            }}
          >
            {/* Stylized white V logo */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 6L12 18L20 6" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.35rem', letterSpacing: '-0.03em', color: '#111827' }}>
            VedaAI
          </span>
        </div>

        {/* Create Assignment Button */}
        <Link
          href="/create"
          className="btn btn-create-assignment"
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            fontWeight: 600,
            textDecoration: 'none',
            marginBottom: '1.75rem',
          }}
        >
          <span>+</span> Create Assignment
        </Link>

        {/* Sidebar Navigation Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', flex: 1 }}>
          {[
            {
              label: 'Home',
              href: '/assessments', // Points to home/list
              isActive: pathname === '/' || pathname === '/home',
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              ),
            },
            {
              label: 'My Groups',
              href: '#',
              isActive: pathname === '/groups',
              onClick: (e: any) => {
                e.preventDefault();
                showToast("My Groups is coming soon!");
              },
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              ),
            },
            {
              label: 'Assignments',
              href: '/assessments',
              isActive: pathname === '/assessments' || pathname.startsWith('/assessment/'),
              badge: activeCount > 0 ? activeCount : undefined,
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <line x1="10" y1="9" x2="8" y2="9" />
                </svg>
              ),
            },
            {
              label: "AI Teacher's Toolkit",
              href: '#',
              isActive: pathname === '/toolkit',
              onClick: (e: any) => {
                e.preventDefault();
                showToast("AI Teacher's Toolkit is coming soon!");
              },
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                  <circle cx="12" cy="12" r="4" />
                </svg>
              ),
            },
            {
              label: 'My Library',
              href: '#',
              isActive: pathname === '/library',
              badge: 32, // Static badge for design exact matches
              onClick: (e: any) => {
                e.preventDefault();
                showToast("My Library is coming soon!");
              },
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m16 6 4 14H4L8 6Z" />
                  <path d="M12 6V2" />
                </svg>
              ),
            },
          ].map((item, index) => {
            return (
              <Link
                key={index}
                href={item.href}
                onClick={item.onClick}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.625rem 0.875rem',
                  borderRadius: 10,
                  textDecoration: 'none',
                  color: item.isActive ? '#111827' : '#4B5563',
                  backgroundColor: item.isActive ? '#f3f4f6' : 'transparent',
                  fontWeight: item.isActive ? 600 : 500,
                  fontSize: '0.9375rem',
                  transition: 'all 200ms ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="orange-count-badge">{item.badge}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer (Settings + School Badge) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid #f3f4f6', paddingTop: '1.25rem' }}>
          <Link
            href="#"
            onClick={(e) => {
              e.preventDefault();
              openSettings();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.5rem 0.875rem',
              color: '#4B5563',
              textDecoration: 'none',
              fontWeight: 500,
              fontSize: '0.9375rem',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span>Settings</span>
          </Link>

          {/* School Badge Card */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.875rem 1rem',
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: 14,
            }}
          >
            {/* School emblem placeholder */}
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                backgroundColor: '#e0f2fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0369a1',
                fontWeight: 700,
                fontSize: '0.875rem',
                border: '1px solid #bae6fd',
                flexShrink: 0,
              }}
            >
              🏫
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.875rem', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {schoolName}
              </p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#6B7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {schoolLocation}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Work Area ── */}
      <div className="main-content">
        {/* ── Desktop Header ── */}
        <header className="header no-print">
          {/* Breadcrumb / Back button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {showBackButton && (
              <button
                onClick={handleBack}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#4B5563',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" strokeWidth="2.5" />
                  <polyline points="12 19 5 12 12 5" strokeWidth="2.5" />
                </svg>
              </button>
            )}
            <span style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', textTransform: 'capitalize' }}>
              {title}
            </span>
          </div>

          {/* User profile / notification bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {/* Bell notification */}
            <div style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
              {/* Red dot alert indicator */}
              <div
                style={{
                  position: 'absolute',
                  top: 1,
                  right: 1,
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  backgroundColor: '#f97316', // Orange-red dot
                  border: '1.5px solid #ffffff',
                }}
              />
            </div>

            {/* Profile Dropdown Container */}
            <div style={{ position: 'relative' }}>
              <div
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  padding: '0.375rem 0.75rem',
                  border: '1px dashed #e5e7eb',
                  borderRadius: 99,
                  cursor: 'pointer',
                  backgroundColor: '#f9fafb',
                  userSelect: 'none',
                }}
              >
                {/* User avatar */}
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    backgroundColor: '#ea580c',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    overflow: 'hidden',
                  }}
                >
                  JD
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>John Doe</span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#6B7280"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    transform: isProfileOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>

              {/* Profile Dropdown Menu */}
              {isProfileOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '0.5rem',
                    width: '200px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    padding: '0.5rem',
                    zIndex: 100,
                  }}
                >
                  <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid #f3f4f6', marginBottom: '0.375rem' }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.875rem', color: '#111827' }}>John Doe</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis' }}>john.doe@dpsbokaro.edu</p>
                  </div>
                  
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      openSettings();
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      fontSize: '0.875rem',
                      color: '#374151',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    👤 My Profile
                  </button>
                  
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      openSettings();
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      fontSize: '0.875rem',
                      color: '#374151',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    ⚙️ Account Settings
                  </button>
                  
                  <div style={{ borderTop: '1px solid #f3f4f6', marginTop: '0.375rem', paddingTop: '0.375rem' }}>
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        showToast("Successfully logged out!");
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        fontSize: '0.875rem',
                        color: '#ef4444',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      🚪 Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Mobile Header ── */}
        <header className="mobile-header no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {showBackButton ? (
              <button
                onClick={handleBack}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  color: '#111827',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
              </button>
            ) : (
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: 'linear-gradient(135deg, #f97316, #ea580c)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 6L12 18L20 6" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
            <span style={{ fontWeight: 800, fontSize: '1.15rem', color: '#111827' }}>VedaAI</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}>
            {/* Bell icon */}
            <div style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
              <div style={{ position: 'absolute', top: 1, right: 1, width: 6, height: 6, borderRadius: '50%', backgroundColor: '#f97316' }} />
            </div>

            {/* User avatar */}
            <div
              onClick={() => {
                setIsProfileOpen(!isProfileOpen);
                setIsMobileMenuOpen(false);
              }}
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                backgroundColor: '#ea580c',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.7rem',
                fontWeight: 700,
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              JD
            </div>

            {/* Hamburger menu button */}
            <button
              onClick={() => {
                setIsMobileMenuOpen(!isMobileMenuOpen);
                setIsProfileOpen(false);
              }}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2.5" strokeLinecap="round">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            </button>

            {/* Mobile Profile Dropdown Menu */}
            {isProfileOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: '30px',
                  marginTop: '0.5rem',
                  width: '180px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  padding: '0.5rem',
                  zIndex: 100,
                }}
              >
                <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid #f3f4f6', marginBottom: '0.375rem' }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem', color: '#111827' }}>John Doe</p>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis' }}>john.doe@dpsbokaro.edu</p>
                </div>
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    openSettings();
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    fontSize: '0.85rem',
                    color: '#374151',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  👤 My Profile
                </button>
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    showToast("Successfully logged out!");
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    fontSize: '0.85rem',
                    color: '#ef4444',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    borderTop: '1px solid #f3f4f6',
                    marginTop: '0.25rem',
                    paddingTop: '0.5rem',
                  }}
                >
                  🚪 Log Out
                </button>
              </div>
            )}

            {/* Mobile Hamburger menu dropdown */}
            {isMobileMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '0.5rem',
                  width: '180px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  padding: '0.5rem',
                  zIndex: 100,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.125rem',
                }}
              >
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    openSettings();
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    fontSize: '0.85rem',
                    color: '#374151',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  ⚙️ Settings
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    showToast("My Groups is coming soon!");
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    fontSize: '0.85rem',
                    color: '#374151',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  👥 My Groups
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    showToast("My Library is coming soon!");
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    fontSize: '0.85rem',
                    color: '#374151',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  📚 My Library
                </button>
              </div>
            )}
          </div>
        </header>

        {/* ── Page Content ── */}
        <main className="main-content-inner" style={{ flex: 1 }}>
          {children}
        </main>

        {/* ── Mobile Floating Action Button (FAB) ── */}
        {pathname !== '/create' && (
          <Link href="/create" className="mobile-fab no-print">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff4d00" strokeWidth="3" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </Link>
        )}

        {/* ── Mobile Bottom Navigation Bar ── */}
        <nav className="mobile-bottom-nav no-print">
          {[
            {
              label: 'Home',
              href: '/assessments',
              isActive: pathname === '/' || pathname === '/home',
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                </svg>
              ),
            },
            {
              label: 'Assignments',
              href: '/assessments',
              isActive: pathname === '/assessments' || pathname.startsWith('/assessment'),
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                </svg>
              ),
            },
            {
              label: 'Library',
              href: '#',
              isActive: pathname === '/library',
              onClick: (e: any) => {
                e.preventDefault();
                showToast("Library is coming soon!");
              },
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m16 6 4 14H4L8 6Z" />
                </svg>
              ),
            },
            {
              label: 'AI Toolkit',
              href: '#',
              isActive: pathname === '/toolkit',
              onClick: (e: any) => {
                e.preventDefault();
                showToast("AI Teacher's Toolkit is coming soon!");
              },
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4" />
                </svg>
              ),
            },
          ].map((item, index) => {
            return (
              <Link
                key={index}
                href={item.href}
                onClick={item.onClick}
                className={`mobile-bottom-nav-item ${item.isActive ? 'active' : ''}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Dynamic UX Toast Alert */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '80px',
            right: '24px',
            backgroundColor: '#111827',
            color: '#ffffff',
            padding: '0.75rem 1.5rem',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            fontSize: '0.875rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeIn 0.2s',
          }}
        >
          <span>ℹ️</span> {toast}
        </div>
      )}

      {/* Dynamic Settings Modal */}
      {isSettingsOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(17, 24, 39, 0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => setIsSettingsOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              width: '90%',
              maxWidth: '500px',
              borderRadius: '20px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              padding: '2rem',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#111827' }}>Settings</h3>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>Configure your VedaAI classroom settings</p>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                style={{
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  color: '#4B5563',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Section 1: Institution Details */}
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.25rem', backgroundColor: '#f9fafb' }}>
                <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <span>🏫</span> Institution Profile
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#4B5563', marginBottom: '0.375rem' }}>School Name</label>
                    <input
                      type="text"
                      value={tempSchoolName}
                      onChange={(e) => setTempSchoolName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.625rem 0.875rem',
                        borderRadius: '10px',
                        border: '1px solid #d1d5db',
                        outline: 'none',
                        fontSize: '0.875rem',
                        color: '#111827',
                        backgroundColor: '#ffffff',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#4B5563', marginBottom: '0.375rem' }}>Branch / Location</label>
                    <input
                      type="text"
                      value={tempSchoolLocation}
                      onChange={(e) => setTempSchoolLocation(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.625rem 0.875rem',
                        borderRadius: '10px',
                        border: '1px solid #d1d5db',
                        outline: 'none',
                        fontSize: '0.875rem',
                        color: '#111827',
                        backgroundColor: '#ffffff',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: AI Settings */}
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.25rem', backgroundColor: '#f9fafb' }}>
                <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <span>🤖</span> AI Configuration
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span style={{ color: '#4B5563' }}>AI Provider</span>
                    <span style={{ fontWeight: 600, color: '#111827' }}>Google Gemini</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span style={{ color: '#4B5563' }}>Model Name</span>
                    <span style={{ fontWeight: 600, color: '#ea580c' }}>gemini-2.5-flash</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', alignItems: 'center' }}>
                    <span style={{ color: '#4B5563' }}>API Status</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', fontWeight: 600, color: '#16a34a', backgroundColor: '#dcfce7', padding: '0.25rem 0.625rem', borderRadius: '99px' }}>
                      <span style={{ width: '6px', height: '6px', backgroundColor: '#16a34a', borderRadius: '50%' }}></span> Connected
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #f3f4f6', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
              <button
                onClick={() => setIsSettingsOpen(false)}
                style={{
                  padding: '0.625rem 1.25rem',
                  borderRadius: '10px',
                  border: '1px solid #d1d5db',
                  background: '#ffffff',
                  color: '#374151',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setSchoolName(tempSchoolName);
                  setSchoolLocation(tempSchoolLocation);
                  setIsSettingsOpen(false);
                  showToast("Settings saved successfully!");
                }}
                style={{
                  padding: '0.625rem 1.25rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #f97316, #ea580c)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  boxShadow: '0 4px 10px rgba(249, 115, 22, 0.2)',
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
