'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import VedaLayout from '@/components/VedaLayout';
import { useAssessmentStore } from '@/store/assessmentStore';
import { Assessment } from '@/types';

// Format Date helper to return DD-MM-YYYY
function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '20-06-2025'; // fallback
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return '20-06-2025';
  }
}

interface DropdownProps {
  assessment: Assessment;
  onDelete: () => void;
  onView: () => void;
}

function CardActionDropdown({ assessment, onDelete, onView }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0.25rem',
          display: 'flex',
          alignItems: 'center',
          color: '#6B7280',
          borderRadius: '50%',
        }}
        className="btn-ghost"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="1" />
          <circle cx="12" cy="5" r="1" />
          <circle cx="12" cy="19" r="1" />
        </svg>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            zIndex: 10,
            minWidth: '140px',
            padding: '4px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <button
            onClick={() => {
              setIsOpen(false);
              onView();
            }}
            style={{
              padding: '8px 12px',
              textAlign: 'left',
              background: 'none',
              border: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#374151',
              cursor: 'pointer',
              borderRadius: '6px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            View Assignment
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              onDelete();
            }}
            style={{
              padding: '8px 12px',
              textAlign: 'left',
              background: 'none',
              border: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#ef4444',
              cursor: 'pointer',
              borderRadius: '6px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fdf2f2')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

function AssessmentCard({ assessment }: { assessment: Assessment }) {
  const router = useRouter();
  const { deleteAssessment } = useAssessmentStore();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;
    setDeleting(true);
    try {
      await deleteAssessment(assessment._id);
    } finally {
      setDeleting(false);
    }
  };

  const handleView = () => {
    router.push(`/assessment/${assessment._id}`);
  };

  // Assigned date is either dynamic createdAt or fallback
  const assignedDate = formatDate(assessment.createdAt);
  const dueDateStr = formatDate(assessment.dueDate);

  return (
    <div
      className="card card-hover"
      style={{
        padding: '1.75rem',
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        minHeight: '160px',
        opacity: deleting ? 0.6 : 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ cursor: 'pointer', flex: 1 }} onClick={handleView}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#111827', margin: 0, lineHeight: 1.3 }}>
            {assessment.title}
          </h3>
          {/* Subtle subject indicator */}
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '4px', display: 'inline-block' }}>
            {assessment.subject} • {assessment.gradeLevel}
          </span>
        </div>
        
        {/* Dropdown Menu actions */}
        <CardActionDropdown
          assessment={assessment}
          onDelete={handleDelete}
          onView={handleView}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f3f4f6', paddingTop: '1rem', fontSize: '0.875rem' }}>
        <span style={{ color: '#6B7280', fontWeight: 500 }}>
          Assigned on : <span style={{ color: '#374151' }}>{assignedDate}</span>
        </span>
        <span style={{ color: '#111827', fontWeight: 700 }}>
          Due : {dueDateStr}
        </span>
      </div>
    </div>
  );
}

export default function AssessmentsPage() {
  const { assessments, fetchAssessments } = useAssessmentStore();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'title'

  useEffect(() => {
    fetchAssessments().finally(() => setLoading(false));
  }, []);

  // Filter and sort assessments
  const filteredAssessments = assessments
    .filter((a) => {
      const query = searchQuery.toLowerCase();
      return (
        a.title.toLowerCase().includes(query) ||
        a.subject.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      } else if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else {
        // default newest
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  return (
    <VedaLayout title="Assignment" showBackButton={false}>
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div className="spinner" style={{ width: 40, height: 40 }} />
        </div>
      ) : assessments.length === 0 ? (
        /* ── Empty State Screen (Screenshot 1) ── */
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '3rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '80vh',
            textAlign: 'center',
          }}
        >
          {/* Custom Empty State Illustration */}
          <div
            style={{
              position: 'relative',
              width: '180px',
              height: '180px',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Soft gray background circle */}
            <div
              style={{
                position: 'absolute',
                width: '180px',
                height: '180px',
                borderRadius: '50%',
                backgroundColor: '#f3f4f6',
                zIndex: 1,
              }}
            />
            {/* Document sheet representation */}
            <div
              style={{
                position: 'relative',
                width: '74px',
                height: '96px',
                backgroundColor: '#ffffff',
                border: '1.5px solid #d1d5db',
                borderRadius: '8px',
                padding: '12px 10px',
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.03)',
                zIndex: 2,
                transform: 'rotate(-4deg)',
              }}
            >
              {/* Lines in document */}
              <div style={{ width: '100%', height: '5px', backgroundColor: '#e5e7eb', borderRadius: 2, marginBottom: '6px' }} />
              <div style={{ width: '80%', height: '5px', backgroundColor: '#e5e7eb', borderRadius: 2, marginBottom: '6px' }} />
              <div style={{ width: '90%', height: '5px', backgroundColor: '#e5e7eb', borderRadius: 2, marginBottom: '6px' }} />
              <div style={{ width: '60%', height: '5px', backgroundColor: '#e5e7eb', borderRadius: 2, marginBottom: '6px' }} />
            </div>
            
            {/* Magnifying glass representation */}
            <div
              style={{
                position: 'absolute',
                bottom: '22px',
                right: '22px',
                width: '64px',
                height: '64px',
                zIndex: 4,
                transform: 'rotate(10deg)',
              }}
            >
              {/* Circle of glass */}
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  border: '3px solid #d1d5db',
                  backgroundColor: 'rgba(255, 255, 255, 0.75)',
                  backdropFilter: 'blur(2px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {/* Red Circular X */}
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    backgroundColor: '#fee2e2',
                    border: '1.5px solid #fecaca',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ef4444',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                  }}
                >
                  ✕
                </div>
              </div>
              {/* Handle of glass */}
              <div
                style={{
                  position: 'absolute',
                  top: '40px',
                  left: '38px',
                  width: '18px',
                  height: '6px',
                  backgroundColor: '#d1d5db',
                  transform: 'rotate(45deg)',
                  borderRadius: '3px',
                }}
              />
            </div>
            {/* Tiny accent stars */}
            <div style={{ position: 'absolute', top: '35px', left: '25px', zIndex: 3, fontSize: '1.2rem', color: '#cbd5e1' }}>✦</div>
            <div style={{ position: 'absolute', bottom: '45px', left: '30px', zIndex: 3, fontSize: '0.8rem', color: '#cbd5e1' }}>✦</div>
          </div>

          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#111827', margin: '0 0 0.75rem 0' }}>
            No assignments yet
          </h2>
          <p style={{ color: '#4B5563', fontSize: '1rem', maxWidth: '460px', margin: '0 0 2rem 0', lineHeight: 1.5 }}>
            Create your first assignment to start collecting and grading student submissions. You can set up rubrics, define marking criteria, and let AI assist with grading.
          </p>

          <Link href="/create" style={{ textDecoration: 'none' }}>
            <button className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontWeight: 600, fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>+</span> Create Your First Assignment
            </button>
          </Link>
        </div>
      ) : (
        /* ── Filled State Screen (Screenshot 2) ── */
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem', position: 'relative' }}>
          
          {/* Header Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: '2rem',
              borderBottom: '1px solid #e5e7eb',
              paddingBottom: '1rem',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', margin: '0 0 4px 0' }}>
                Assignments
              </h2>
              <p style={{ color: '#6B7280', fontSize: '0.9rem', margin: 0 }}>
                Manage and create assignments for your classes.
              </p>
            </div>

            {/* Filter and Search Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              {/* Filter Button */}
              <div style={{ position: 'relative' }}>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    appearance: 'none',
                    padding: '0.5rem 2.25rem 0.5rem 1rem',
                    backgroundColor: '#ffffff',
                    border: '1px solid #d1d5db',
                    borderRadius: '10px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <option value="newest">Sort: Newest</option>
                  <option value="oldest">Sort: Oldest</option>
                  <option value="title">Sort: Alphabetical</option>
                </select>
                <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6B7280', display: 'flex', alignItems: 'center' }}>
                  {/* Dropdown arrow SVG */}
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>

              {/* Search Box */}
              <div style={{ position: 'relative', minWidth: '220px' }}>
                <input
                  type="text"
                  placeholder="Search Assignment"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 1rem 0.5rem 2.25rem',
                    backgroundColor: '#ffffff',
                    border: '1px solid #d1d5db',
                    borderRadius: '10px',
                    fontSize: '0.875rem',
                    outline: 'none',
                    color: '#111827',
                  }}
                />
                <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', display: 'flex', alignItems: 'center' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          {filteredAssessments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1.5rem', color: '#6B7280' }}>
              No assignments found matching your search.
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                gap: '1.25rem',
                paddingBottom: '5rem', // padding for bottom button
              }}
            >
              {filteredAssessments.map((a) => (
                <AssessmentCard key={a._id} assessment={a} />
              ))}
            </div>
          )}

          {/* ── Desktop Floating bottom Button ── */}
          <div
            className="no-print"
            style={{
              position: 'fixed',
              bottom: '24px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 80,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <Link href="/create" style={{ textDecoration: 'none' }}>
              <button
                className="btn btn-primary"
                style={{
                  padding: '0.85rem 1.75rem',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                  backgroundColor: '#111827',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <span>+</span> Create Assignment
              </button>
            </Link>
          </div>

        </div>
      )}
    </VedaLayout>
  );
}
