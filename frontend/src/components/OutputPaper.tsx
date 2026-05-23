'use client';

import { useState, useRef } from 'react';
import { Assessment, GeneratedQuestion, PaperSection, QUESTION_TYPE_LABELS, DIFFICULTY_LABELS } from '@/types';
import { exportToPDF } from '@/lib/pdf';

interface Props {
  assessment: Assessment;
  onRegenerate: () => void;
}

function SectionBlock({
  section,
  sectionIndex,
  startingNumber,
}: {
  section: PaperSection;
  sectionIndex: number;
  startingNumber: number;
}) {
  return (
    <div style={{ marginBottom: '2.5rem' }}>
      {/* Section Divider / Title */}
      <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
        <h3
          style={{
            fontSize: '1.2rem',
            fontWeight: 800,
            color: '#111827',
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Section {String.fromCharCode(65 + sectionIndex)}
        </h3>
      </div>

      {/* Section Header Instructions */}
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#111827' }}>
          {QUESTION_TYPE_LABELS[section.questionType] || 'Questions'}
        </p>
        <p style={{ margin: '2px 0 0 0', fontSize: '0.875rem', fontStyle: 'italic', color: '#4B5563' }}>
          Attempt all questions. Each question carries {section.questions[0]?.marks || 2} marks
        </p>
      </div>

      {/* Questions list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {section.questions.map((q, qi) => {
          const globalNum = startingNumber + qi;
          const diffText = q.difficulty === 'easy' ? 'Easy' : q.difficulty === 'medium' ? 'Moderate' : 'Challenging';
          
          return (
            <div key={q.id} className="font-serif-exam" style={{ fontSize: '1.05rem', color: '#111827', lineHeight: 1.5 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                <span style={{ fontWeight: 500 }}>{globalNum}.</span>
                <div style={{ flex: 1 }}>
                  <span>
                    [{diffText}] {q.question} [{q.marks} Mark{q.marks > 1 ? 's' : ''}]
                  </span>
                  
                  {/* Options rendering for MCQs / True-False */}
                  {q.options && q.options.length > 0 && (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '0.5rem',
                        marginTop: '0.5rem',
                        paddingLeft: '1.5rem',
                        fontFamily: 'sans-serif',
                        fontSize: '0.9rem',
                      }}
                    >
                      {q.options.map((opt, oi) => (
                        <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              border: '1.5px solid #d1d5db',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.7rem',
                              fontWeight: 'bold',
                              color: '#6B7280',
                            }}
                          >
                            {String.fromCharCode(65 + oi)}
                          </span>
                          <span>{opt}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Lines for short/long answer types */}
                  {(!q.options || q.options.length === 0) && (
                    <div style={{ marginTop: '0.75rem', paddingLeft: '1.5rem' }}>
                      {Array.from({
                        length: q.type === 'long_answer' ? 3 : q.type === 'short_answer' ? 1 : 0,
                      }).map((_, i) => (
                        <div
                          key={i}
                          style={{
                            height: 1,
                            borderBottom: '1px dashed #d1d5db',
                            marginBottom: '1rem',
                            width: '95%',
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function OutputPaper({ assessment, onRegenerate }: Props) {
  const paper = assessment.generatedPaper!;
  const [isExporting, setIsExporting] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const totalQuestions = paper.sections.reduce((sum, s) => sum + s.questions.length, 0);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await exportToPDF(paper, assessment.title);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Compute starting question numbers per section
  const sectionStartNumbers: number[] = [];
  let cumulative = 1;
  paper.sections.forEach((s) => {
    sectionStartNumbers.push(cumulative);
    cumulative += s.questions.length;
  });

  // Extract school name if present in instructions
  const schoolLabel = assessment.additionalInstructions?.match(/\[School Name:\s*(.*?)\]/)?.[1] 
    || 'Delhi Public School, Sector-4, Bokaro';

  return (
    <div ref={printRef} className="fade-in">
      
      {/* ── Dark AI Response Bar (Screenshot 4) ── */}
      <div
        className="no-print"
        style={{
          backgroundColor: '#111827',
          color: '#ffffff',
          borderRadius: '20px',
          padding: '1.5rem 2rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
          flexWrap: 'wrap',
        }}
      >
        <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500, flex: 1, lineHeight: 1.5 }}>
          Certainly, Lakshya! Here are customized Question Paper for your {paper.gradeLevel} {paper.subject} classes on the NCERT chapters:
        </p>
        
        {/* PDF Download and Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="btn"
            style={{
              backgroundColor: '#ffffff',
              color: '#111827',
              borderRadius: '99px',
              padding: '0.55rem 1.25rem',
              fontWeight: 600,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            {isExporting ? (
              <div className="spinner" style={{ width: 14, height: 14, borderTopColor: '#111827' }} />
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            )}
            Download as PDF
          </button>

          {/* Solution key toggle */}
          <button
            onClick={() => setShowAnswers(!showAnswers)}
            className="btn btn-secondary"
            style={{
              borderRadius: '99px',
              padding: '0.55rem 1.25rem',
              fontWeight: 600,
              fontSize: '0.85rem',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
            }}
          >
            {showAnswers ? 'Hide Answers' : 'Answer Key'}
          </button>

          {/* Print */}
          <button
            onClick={handlePrint}
            className="btn btn-secondary"
            style={{
              borderRadius: '99px',
              padding: '0.55rem 1.25rem',
              fontWeight: 600,
              fontSize: '0.85rem',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
            }}
          >
            🖨 Print
          </button>

          {/* Regenerate */}
          <button
            onClick={onRegenerate}
            className="btn btn-ghost"
            style={{
              borderRadius: '99px',
              padding: '0.55rem 1rem',
              fontWeight: 600,
              fontSize: '0.85rem',
              color: '#e5e7eb',
            }}
          >
            🔄 Regenerate
          </button>
        </div>
      </div>

      {/* ── White Exam Paper Layout (Screenshot 4) ── */}
      <div
        className="card"
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '24px',
          padding: '3.5rem 3rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
          marginBottom: '3rem',
        }}
      >
        {/* Paper Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#111827', margin: '0 0 6px 0' }}>
            {schoolLabel}
          </h2>
          <p style={{ margin: '4px 0', fontSize: '1.05rem', fontWeight: 600, color: '#374151' }}>
            Subject: {paper.subject}
          </p>
          <p style={{ margin: '4px 0', fontSize: '1.05rem', fontWeight: 600, color: '#374151' }}>
            Class: {paper.gradeLevel}
          </p>
          
          {/* Metadata Grid */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '1.5rem',
              fontSize: '0.95rem',
              fontWeight: 700,
              color: '#111827',
              borderBottom: '1px solid #e5e7eb',
              paddingBottom: '0.5rem',
            }}
          >
            <span>Time Allowed: {paper.duration} minutes</span>
            <span>Maximum Marks: {paper.totalMarks}</span>
          </div>
          
          <p style={{ margin: '8px 0 0 0', fontSize: '0.875rem', fontWeight: 600, color: '#4B5563', fontStyle: 'italic', textAlign: 'left' }}>
            All questions are compulsory unless stated otherwise.
          </p>
        </div>

        {/* Student Info Blanks (Screenshot 4) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.5fr 1fr 1fr',
            gap: '1.5rem',
            marginBottom: '3rem',
            fontSize: '0.95rem',
            fontWeight: 700,
            color: '#111827',
          }}
        >
          <div style={{ display: 'flex', gap: '4px' }}>
            <span>Name:</span>
            <div style={{ flex: 1, borderBottom: '1px solid #111827' }} />
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <span>Roll Number:</span>
            <div style={{ flex: 1, borderBottom: '1px solid #111827' }} />
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <span>Class: {paper.gradeLevel} Section:</span>
            <div style={{ flex: 1, borderBottom: '1px solid #111827' }} />
          </div>
        </div>

        {/* Sections list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {paper.sections.map((section, sIdx) => (
            <SectionBlock
              key={sIdx}
              section={section}
              sectionIndex={sIdx}
              startingNumber={sectionStartNumbers[sIdx]}
            />
          ))}
        </div>

        {/* End of paper footer */}
        <div style={{ textAlign: 'center', marginTop: '3.5rem', marginBottom: '2rem' }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: '#111827', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            End of Question Paper
          </p>
        </div>

        {/* Collapsible Answer Key (Screenshot 4 style) */}
        {showAnswers && (
          <div
            style={{
              marginTop: '4rem',
              borderTop: '2px solid #e5e7eb',
              paddingTop: '2.5rem',
            }}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', marginBottom: '1.5rem' }}>
              Answer Key:
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {paper.sections.map((section, sIdx) => (
                <div key={sIdx}>
                  <p style={{ margin: '0 0 1rem 0', fontWeight: 700, color: '#4B5563', fontSize: '0.9rem', textTransform: 'uppercase' }}>
                    Section {String.fromCharCode(65 + sIdx)} Solutions
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingLeft: '0.5rem' }}>
                    {section.questions.map((q, qi) => {
                      const globalNum = sectionStartNumbers[sIdx] + qi;
                      return (
                        <div key={q.id} style={{ fontSize: '0.95rem', color: '#111827', lineHeight: 1.5 }}>
                          <span style={{ fontWeight: 700 }}>{globalNum}. </span>
                          <span style={{ fontWeight: 600 }}>[Correct Answer: {q.correctAnswer}]</span>
                          {q.explanation && (
                            <p style={{ margin: '4px 0 0 0', color: '#4B5563', fontSize: '0.9rem', fontStyle: 'italic' }}>
                              Explanation: {q.explanation}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
