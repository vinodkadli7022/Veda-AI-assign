'use client';

import { useEffect, useCallback, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import VedaLayout from '@/components/VedaLayout';
import OutputPaper from '@/components/OutputPaper';
import { useAssessmentStore } from '@/store/assessmentStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { WebSocketMessage } from '@/types';
import { assessmentApi } from '@/lib/api';

function ProgressRing({ progress }: { progress: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (progress / 100) * circ;

  return (
    <svg width={128} height={128} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={64} cy={64} r={r} fill="none" stroke="#f3f4f6" strokeWidth={8} />
      <circle
        cx={64}
        cy={64}
        r={r}
        fill="none"
        stroke="#ff4d00" /* Orange loader circle matching brand */
        strokeWidth={8}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.5s cubic-bezier(0.4,0,0.2,1)' }}
      />
    </svg>
  );
}

function GeneratingView({ progress, message }: { progress: number; message: string }) {
  const steps = [
    'Preparing AI prompt…',
    'Connecting to AI service…',
    'Generating questions…',
    'Processing AI response…',
    'Validating and finalizing…',
    'Almost done…',
  ];

  const currentStep = Math.floor((progress / 100) * steps.length);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        gap: '2rem',
        padding: '2rem',
      }}
    >
      <div style={{ position: 'relative' }}>
        <ProgressRing progress={progress} />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827' }}>
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      <div>
        <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#111827', marginBottom: '0.5rem' }}>
          Generating Assessment…
        </h2>
        <p style={{ color: '#4b5563', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
          {message || steps[Math.min(currentStep, steps.length - 1)]}
        </p>

        {/* Steps List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left', maxWidth: 340, margin: '0 auto' }}>
          {steps.map((s, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.5rem 0.75rem',
                borderRadius: 10,
                background: i === currentStep ? '#f3f4f6' : 'transparent',
                transition: 'background 300ms ease',
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  background: i < currentStep ? '#10b981' : i === currentStep ? '#111827' : '#e5e7eb',
                  color: i <= currentStep ? '#ffffff' : '#64748b',
                  fontWeight: 600,
                }}
              >
                {i < currentStep ? '✓' : i + 1}
              </div>
              <span
                style={{
                  fontSize: '0.875rem',
                  color: i < currentStep ? '#059669' : i === currentStep ? '#111827' : '#9ca3af',
                  fontWeight: i === currentStep ? 600 : 500,
                }}
              >
                {s}
              </span>
              {i === currentStep && (
                <span
                  className="spinner"
                  style={{ width: 14, height: 14, borderWidth: 1.5, marginLeft: 'auto' }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const {
    currentAssessment,
    isGenerating,
    generationProgress,
    generationMessage,
    error,
    fetchAssessment,
    setGenerationProgress,
    setGenerationComplete,
    setGenerationFailed,
    setIsGenerating,
    regenerateAssessment,
    clearError,
  } = useAssessmentStore();

  const [pollingActive, setPollingActive] = useState(false);

  // Load assessment on mount
  useEffect(() => {
    if (!id) return;
    fetchAssessment(id).then((assessment) => {
      if (assessment.status === 'processing' || assessment.status === 'pending') {
        setIsGenerating(true);
        setPollingActive(true);
      } else if (assessment.status === 'completed' && assessment.generatedPaper) {
        setGenerationComplete(assessment.generatedPaper);
      }
    });
  }, [id]);

  // WebSocket for real-time updates
  const handleWsMessage = useCallback(
    (msg: WebSocketMessage) => {
      if (msg.assessmentId !== id) return;

      switch (msg.type) {
        case 'progress':
          setGenerationProgress(msg.progress ?? 0, msg.message ?? '');
          break;
        case 'completed':
          setPollingActive(false);
          if (msg.data) {
            setGenerationComplete(msg.data);
          } else {
            fetchAssessment(id).then((a) => {
              if (a.generatedPaper) setGenerationComplete(a.generatedPaper);
            });
          }
          break;
        case 'failed':
          setPollingActive(false);
          setGenerationFailed(msg.message || 'Generation failed');
          break;
      }
    },
    [id, setGenerationProgress, setGenerationComplete, setGenerationFailed, fetchAssessment]
  );

  useWebSocket({
    assessmentId: id,
    onMessage: handleWsMessage,
    enabled: isGenerating,
  });

  // Polling fallback (if WebSocket unavailable)
  useEffect(() => {
    if (!pollingActive) return;

    let attempts = 0;
    const poll = async () => {
      try {
        const { status, errorMessage } = await assessmentApi.getStatus(id);
        attempts++;

        if (status === 'completed') {
          setPollingActive(false);
          const assessment = await fetchAssessment(id);
          if (assessment.generatedPaper) {
            setGenerationComplete(assessment.generatedPaper);
          }
        } else if (status === 'failed') {
          setPollingActive(false);
          setGenerationFailed(errorMessage || 'Generation failed');
        } else {
          // Estimate progress from attempts
          const estimated = Math.min(10 + attempts * 8, 90);
          setGenerationProgress(estimated, 'Processing your assessment…');
        }
      } catch {
        // ignore polling errors
      }
    };

    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [pollingActive, id]);

  const handleRegenerate = async () => {
    clearError();
    setIsGenerating(true);
    setGenerationProgress(0, 'Starting regeneration…');
    setPollingActive(true);
    try {
      await regenerateAssessment(id);
    } catch (e: any) {
      setGenerationFailed(e.message);
    }
  };

  const handleBack = () => router.push('/create');

  return (
    <VedaLayout title="Assignment Details" showBackButton={true}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1.5rem' }}>
        
        {/* Error State */}
        {error && !isGenerating && (
          <div className="card fade-in" style={{ padding: '2.5rem', textAlign: 'center', backgroundColor: '#ffffff' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.5rem', color: '#dc2626' }}>
              Generation Failed
            </h2>
            <p style={{ color: '#4b5563', marginBottom: '2rem', maxWidth: 400, margin: '0 auto 2rem' }}>
              {error}
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={handleBack} className="btn btn-secondary">
                &larr; Back
              </button>
              <button onClick={handleRegenerate} className="btn btn-primary" style={{ backgroundColor: '#111827', color: '#ffffff' }}>
                🔄 Regenerate
              </button>
            </div>
          </div>
        )}

        {/* Generating State */}
        {isGenerating && !error && (
          <div className="card fade-in" style={{ padding: '2rem', backgroundColor: '#ffffff' }}>
            <GeneratingView progress={generationProgress} message={generationMessage} />
          </div>
        )}

        {/* Completed State */}
        {!isGenerating && !error && currentAssessment?.generatedPaper && (
          <OutputPaper
            assessment={currentAssessment}
            onRegenerate={handleRegenerate}
          />
        )}

        {/* Loading State */}
        {!isGenerating && !error && !currentAssessment && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
            <div className="spinner" style={{ width: 40, height: 40 }} />
          </div>
        )}
      </div>
    </VedaLayout>
  );
}
