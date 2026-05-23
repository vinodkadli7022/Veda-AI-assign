'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import VedaLayout from '@/components/VedaLayout';
import { useAssessmentStore } from '@/store/assessmentStore';
import { QuestionType, DifficultyLevel } from '@/types';

// Map select labels to backend types
const DISPLAY_TYPES = [
  { value: 'multiple_choice', label: 'Multiple Choice Questions' },
  { value: 'short_answer', label: 'Short Questions' },
  { value: 'long_answer', label: 'Diagram/Graph-Based Questions' },
  { value: 'fill_in_blank', label: 'Numerical Problems' },
  { value: 'true_false', label: 'True / False Questions' },
];

const GRADE_LEVELS = [
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5',
  'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10',
  'Grade 11', 'Grade 12', 'Undergraduate', 'Postgraduate',
];

interface QuestionConfigRow {
  type: QuestionType;
  count: number;
  marks: number;
}

export default function CreateAssignmentPage() {
  const router = useRouter();
  const { createAssessment, isCreating, error, clearError } = useAssessmentStore();

  // Step state: 1 (Setup), 2 (Upload & Config)
  const [step, setStep] = useState(1);

  // Form State - Step 1 (Setup)
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [gradeLevel, setGradeLevel] = useState('Grade 8');
  const [duration, setDuration] = useState(45);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [schoolName, setSchoolName] = useState('Delhi Public School, Sector-4, Bokaro');

  // Form State - Step 2 (Upload & Config)
  const [fileName, setFileName] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [questionConfigs, setQuestionConfigs] = useState<QuestionConfigRow[]>([
    { type: 'multiple_choice', count: 4, marks: 1 },
    { type: 'short_answer', count: 3, marks: 2 },
    { type: 'long_answer', count: 5, marks: 5 },
    { type: 'fill_in_blank', count: 5, marks: 5 },
  ]);
  const [additionalInstructions, setAdditionalInstructions] = useState('');

  // UI state
  const [validationError, setValidationError] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Live totals
  const totalQuestions = questionConfigs.reduce((sum, cfg) => sum + cfg.count, 0);
  const totalMarks = questionConfigs.reduce((sum, cfg) => sum + cfg.count * cfg.marks, 0);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = 'en-US';

        rec.onstart = () => setIsListening(true);
        rec.onend = () => setIsListening(false);
        rec.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setAdditionalInstructions((prev) => (prev ? prev + ' ' + transcript : transcript));
        };
        recognitionRef.current = rec;
      }
    }
  }, []);

  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Try Chrome/Safari.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit.');
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setFileContent(text.slice(0, 8000)); // pass hint to Gemini
    };
    if (file.type === 'text/plain' || file.type === 'text/html' || file.type === 'application/json') {
      reader.readAsText(file);
    } else {
      setFileContent(`[Attached file: ${file.name}] - Generate questions strictly aligning with the topics of ${file.name}`);
    }
  };

  const addQuestionConfig = () => {
    if (questionConfigs.length >= DISPLAY_TYPES.length) return;
    // find first unused type
    const usedTypes = questionConfigs.map((c) => c.type);
    const unusedType = DISPLAY_TYPES.find((t) => !usedTypes.includes(t.value as QuestionType));
    if (unusedType) {
      setQuestionConfigs([
        ...questionConfigs,
        { type: unusedType.value as QuestionType, count: 5, marks: 2 },
      ]);
    } else {
      setQuestionConfigs([
        ...questionConfigs,
        { type: 'multiple_choice', count: 5, marks: 2 },
      ]);
    }
  };

  const removeQuestionConfig = (index: number) => {
    if (questionConfigs.length === 1) return;
    setQuestionConfigs(questionConfigs.filter((_, i) => i !== index));
  };

  const updateQuestionConfig = (index: number, key: keyof QuestionConfigRow, val: any) => {
    const next = [...questionConfigs];
    next[index] = { ...next[index], [key]: val };
    setQuestionConfigs(next);
  };

  const handleNextStep = () => {
    setValidationError('');
    clearError();

    if (step === 1) {
      if (!title.trim() || title.length < 3) {
        setValidationError('Please enter an assessment title (min 3 chars).');
        return;
      }
      if (!subject.trim() || subject.length < 2) {
        setValidationError('Please enter a subject name.');
        return;
      }
      if (duration < 5 || duration > 480) {
        setValidationError('Duration must be between 5 and 480 minutes.');
        return;
      }
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    clearError();

    if (!dueDate) {
      setValidationError('Please choose a due date.');
      return;
    }

    const selectedDate = new Date(dueDate);
    if (isNaN(selectedDate.getTime()) || selectedDate <= new Date()) {
      setValidationError('Due date must be in the future.');
      return;
    }

    try {
      const payload = {
        title,
        subject,
        gradeLevel,
        dueDate,
        totalMarks,
        duration,
        difficulty,
        questionConfigs,
        additionalInstructions: additionalInstructions + (schoolName ? `\n[School Name: ${schoolName}]` : ''),
        fileContent,
        fileName,
      };

      const id = await createAssessment(payload);
      router.push(`/assessment/${id}`);
    } catch (err: any) {
      setValidationError(err.message || 'Failed to submit assignment.');
    }
  };

  return (
    <VedaLayout title="Assignment" showBackButton={step > 1}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        
        {/* Progress indicator */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#111827', margin: '0 0 6px 0' }}>
            Create Assignment
          </h2>
          <p style={{ color: '#6B7280', fontSize: '0.9rem', margin: '0 0 1.25rem 0' }}>
            Set up a new assignment for your students.
          </p>
          
          {/* Progress bar line */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '6px' }}>
            <div style={{ flex: 1, height: '4px', backgroundColor: '#111827', borderRadius: '2px' }} />
            <div style={{ flex: 1, height: '4px', backgroundColor: step === 2 ? '#111827' : '#e5e7eb', borderRadius: '2px', transition: 'background-color 0.3s' }} />
          </div>
        </div>

        {/* Error notification */}
        {(validationError || error) && (
          <div
            style={{
              padding: '0.875rem 1.25rem',
              backgroundColor: '#fee2e2',
              border: '1px solid #fca5a5',
              borderRadius: '12px',
              color: '#b91c1c',
              fontSize: '0.875rem',
              fontWeight: 500,
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>⚠️</span> {validationError || error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* ── STEP 1: SETUP DETAILS ── */}
          {step === 1 && (
            <div className="card fade-in" style={{ padding: '2.25rem', backgroundColor: '#ffffff' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#111827', margin: '0 0 1.5rem 0' }}>
                Assignment Setup
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Title */}
                <div>
                  <label className="label label-required">Assignment Title</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Mid-Term Science Examination"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                {/* School Name */}
                <div>
                  <label className="label">School / Institution Name</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Delhi Public School, Bokaro"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                  />
                </div>

                {/* Subject & Grade */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label className="label label-required">Subject</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. English"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="label label-required">Grade Level</label>
                    <select
                      className="input"
                      value={gradeLevel}
                      onChange={(e) => setGradeLevel(e.target.value)}
                    >
                      {GRADE_LEVELS.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Duration & Difficulty */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label className="label label-required">Duration (minutes)</label>
                    <input
                      type="number"
                      className="input"
                      min={5}
                      max={480}
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      required
                    />
                  </div>
                  <div>
                    <label className="label label-required">Difficulty Level</label>
                    <div style={{ display: 'flex', border: '1px solid #d1d5db', borderRadius: '12px', overflow: 'hidden' }}>
                      {(['easy', 'medium', 'hard'] as DifficultyLevel[]).map((level) => {
                        const active = difficulty === level;
                        return (
                          <button
                            key={level}
                            type="button"
                            onClick={() => setDifficulty(level)}
                            style={{
                              flex: 1,
                              padding: '0.625rem 0.5rem',
                              border: 'none',
                              backgroundColor: active ? '#111827' : '#ffffff',
                              color: active ? '#ffffff' : '#4b5563',
                              fontWeight: 600,
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                          >
                            {level === 'easy' ? 'Easy' : level === 'medium' ? 'Medium' : 'Hard'}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Next Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="btn btn-primary"
                  style={{ padding: '0.75rem 2rem', fontWeight: 600 }}
                >
                  Next &rarr;
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: UPLOAD & CONFIGURATION (Screenshot 3) ── */}
          {step === 2 && (
            <div className="card fade-in" style={{ padding: '2.25rem', backgroundColor: '#ffffff' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: '0 0 1.5rem 0' }}>
                Assignment Details
              </h3>
              <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: '-1rem 0 1.5rem 0' }}>
                Basic information about your assignment
              </p>

              {/* Drag and Drop Zone */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: dragActive ? '2.5px dashed #f97316' : '1.5px dashed #d1d5db',
                    borderRadius: '16px',
                    padding: '2.5rem 1.5rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: dragActive ? '#fff7ed' : '#f9fafb',
                    transition: 'all 0.2s',
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                    accept=".pdf,.txt,.doc,.docx,.png,.jpg,.jpeg"
                  />
                  
                  {/* Upload Cloud Icon */}
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      backgroundColor: '#f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1rem',
                      color: '#4b5563',
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>

                  {fileName ? (
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, color: '#111827', fontSize: '0.95rem' }}>{fileName}</p>
                      <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '0.8rem' }}>File uploaded successfully. Click to replace.</p>
                    </div>
                  ) : (
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, color: '#111827', fontSize: '0.95rem' }}>
                        Choose a file or drag & drop it here
                      </p>
                      <p style={{ margin: '4px 0 12px 0', color: '#6b7280', fontSize: '0.8rem', fontWeight: 500 }}>
                        JPEG, PNG, upto 10MB
                      </p>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{
                          padding: '0.45rem 1.25rem',
                          borderRadius: '20px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          backgroundColor: '#ffffff',
                          border: '1px solid #d1d5db',
                        }}
                      >
                        Browse Files
                      </button>
                    </div>
                  )}
                </div>
                <p style={{ margin: '8px 0 0 0', fontSize: '0.8rem', color: '#6B7280', textAlign: 'center' }}>
                  Upload images of your preferred document/image
                </p>
              </div>

              {/* Due Date picker */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="label label-required">Due Date</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="date"
                    className="input"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6B7280', display: 'flex', alignItems: 'center' }}>
                    {/* Calendar Icon */}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Question configuration grid */}
              <div style={{ marginBottom: '1.5rem' }}>
                {/* Headers */}
                <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1.2fr 1.2fr 40px', gap: '0.75rem', marginBottom: '0.5rem', paddingLeft: '4px' }}>
                  <label className="label" style={{ margin: 0 }}>Question Type</label>
                  <label className="label" style={{ margin: 0, textAlign: 'center' }}>No. of Questions</label>
                  <label className="label" style={{ margin: 0, textAlign: 'center' }}>Marks</label>
                  <div></div>
                </div>

                {/* Config Rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {questionConfigs.map((row, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2.5fr 1.2fr 1.2fr 40px',
                        gap: '0.75rem',
                        alignItems: 'center',
                      }}
                    >
                      {/* Select Type */}
                      <div>
                        <select
                          className="input"
                          value={row.type}
                          onChange={(e) => updateQuestionConfig(index, 'type', e.target.value as QuestionType)}
                        >
                          {DISPLAY_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* No. of Questions stepper */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: '1px solid #d1d5db', borderRadius: '12px', padding: '5px 8px', backgroundColor: '#ffffff' }}>
                        <button
                          type="button"
                          className="stepper-btn"
                          onClick={() => updateQuestionConfig(index, 'count', Math.max(1, row.count - 1))}
                          disabled={row.count <= 1}
                        >
                          -
                        </button>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, minWidth: '18px', textAlign: 'center', color: '#111827' }}>
                          {row.count}
                        </span>
                        <button
                          type="button"
                          className="stepper-btn"
                          onClick={() => updateQuestionConfig(index, 'count', Math.min(50, row.count + 1))}
                        >
                          +
                        </button>
                      </div>

                      {/* Marks stepper */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: '1px solid #d1d5db', borderRadius: '12px', padding: '5px 8px', backgroundColor: '#ffffff' }}>
                        <button
                          type="button"
                          className="stepper-btn"
                          onClick={() => updateQuestionConfig(index, 'marks', Math.max(1, row.marks - 1))}
                          disabled={row.marks <= 1}
                        >
                          -
                        </button>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, minWidth: '18px', textAlign: 'center', color: '#111827' }}>
                          {row.marks}
                        </span>
                        <button
                          type="button"
                          className="stepper-btn"
                          onClick={() => updateQuestionConfig(index, 'marks', Math.min(100, row.marks + 1))}
                        >
                          +
                        </button>
                      </div>

                      {/* Delete button */}
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <button
                          type="button"
                          onClick={() => removeQuestionConfig(index)}
                          disabled={questionConfigs.length <= 1}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: questionConfigs.length <= 1 ? 'not-allowed' : 'pointer',
                            color: '#ef4444',
                            fontWeight: 'bold',
                            fontSize: '1.1rem',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Row Button & Totals aligned */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.25rem' }}>
                  {questionConfigs.length < DISPLAY_TYPES.length ? (
                    <button
                      type="button"
                      onClick={addQuestionConfig}
                      className="btn btn-secondary"
                      style={{
                        padding: '0.5rem 1rem',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        backgroundColor: '#111827',
                        color: '#ffffff',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                      }}
                    >
                      <span style={{ fontSize: '1.1rem' }}>+</span> Add Question Type
                    </button>
                  ) : (
                    <div />
                  )}

                  {/* Right Aligned Totals */}
                  <div style={{ textAlign: 'right', fontSize: '0.875rem', color: '#4B5563', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div>
                      Total Questions : <span style={{ fontWeight: 700, color: '#111827' }}>{totalQuestions}</span>
                    </div>
                    <div>
                      Total Marks : <span style={{ fontWeight: 700, color: '#111827' }}>{totalMarks}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information textarea */}
              <div style={{ marginBottom: '2rem', position: 'relative' }}>
                <label className="label">Additional Information (For better output)</label>
                <div style={{ position: 'relative' }}>
                  <textarea
                    className="input"
                    rows={4}
                    placeholder="e.g. Generate a question paper for 3-hour exam duration..."
                    value={additionalInstructions}
                    onChange={(e) => setAdditionalInstructions(e.target.value)}
                    style={{ paddingRight: '2.5rem', resize: 'vertical', minHeight: '100px' }}
                  />
                  {/* Microphone Icon Button */}
                  <button
                    type="button"
                    onClick={handleVoiceInput}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      bottom: '12px',
                      background: isListening ? '#fee2e2' : 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: isListening ? '#ef4444' : '#6B7280',
                      padding: '6px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title={isListening ? 'Stop listening' : 'Start voice input'}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={isListening ? '#ef4444' : 'none'} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="22" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Bottom buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f3f4f6', paddingTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn btn-secondary"
                  style={{ padding: '0.625rem 1.75rem', fontWeight: 600 }}
                >
                  &larr; Previous
                </button>

                <button
                  type="submit"
                  disabled={isCreating}
                  className="btn btn-primary"
                  style={{
                    padding: '0.625rem 2rem',
                    fontWeight: 600,
                    backgroundColor: '#111827',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  {isCreating ? (
                    <>
                      <div className="spinner" style={{ width: 16, height: 16, borderTopColor: '#ffffff' }} />
                      Generating…
                    </>
                  ) : (
                    <>
                      Next &rarr;
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </VedaLayout>
  );
}
