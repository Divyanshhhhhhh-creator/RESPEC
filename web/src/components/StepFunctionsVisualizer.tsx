import React from 'react';
import { CheckCircle2, Clock, Database, Cpu, FileText } from 'lucide-react';

interface StepProps {
  currentStage: string;
  source: 'pdf' | 'rows';
  status: string;
}

export const StepFunctionsVisualizer: React.FC<StepProps> = ({
  source,
  status,
}) => {
  const steps = [
    {
      id: 'input',
      title: 'Choice(source)',
      subtitle: source === 'pdf' ? 'PDF Document Route' : 'CSV/XLSX Rows Route',
      icon: FileText,
      done: true,
      active: false,
    },
    {
      id: 'textract',
      title: source === 'pdf' ? 'Textract (TABLES)' : 'SheetJS Parse',
      subtitle: source === 'pdf' ? 'Async document analysis' : 'In-browser tabular parse',
      icon: Cpu,
      done: status === 'READY' || status === 'NEEDS_REVIEW',
      active: status === 'EXTRACTING',
    },
    {
      id: 'normalize',
      title: 'Normalize Lambda',
      subtitle: 'Units, grades & outlier audit',
      icon: Cpu,
      done: status === 'READY' || status === 'NEEDS_REVIEW',
      active: false,
    },
    {
      id: 'classify',
      title: 'Classify Lambda',
      subtitle: '10 deterministic categories',
      icon: Cpu,
      done: status === 'READY' || status === 'NEEDS_REVIEW',
      active: false,
    },
    {
      id: 'persist',
      title: 'DynamoDB Persist',
      subtitle: 'Single table JOB#id / LINE#nnn',
      icon: Database,
      done: status === 'READY' || status === 'NEEDS_REVIEW',
      active: false,
    },
  ];

  return (
    <div style={{
      backgroundColor: 'var(--color-white)',
      border: '1px solid var(--color-hairline)',
      borderRadius: 'var(--radius-md)',
      padding: '18px 22px',
      marginTop: '16px',
      boxShadow: 'var(--shadow-subtle)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '14px',
        fontSize: '0.78rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            display: 'inline-block',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: status === 'ERROR' ? 'var(--color-status-notallowed)' : status === 'EXTRACTING' ? 'var(--color-status-conditional)' : 'var(--color-forest)',
          }} />
          <strong style={{ color: 'var(--color-forest)' }}>AWS Step Functions State Machine Execution</strong>
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink-muted)' }}>
            arn:aws:states:ap-south-1:123456789012:execution:ReSpecExtractionPipeline
          </span>
        </div>
        <span style={{
          fontFamily: 'var(--font-mono)',
          color: status === 'ERROR' ? 'var(--color-status-notallowed)' : 'var(--color-forest)',
          fontWeight: 700,
        }}>
          STATUS: {status}
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px',
        alignItems: 'center',
      }}>
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: step.active
                  ? 'var(--color-status-conditional-bg)'
                  : step.done
                  ? 'var(--color-sand-light)'
                  : 'var(--color-ivory-surface)',
                border: step.active
                  ? '1px solid var(--color-status-conditional-border)'
                  : step.done
                  ? '1px solid var(--color-sand-border)'
                  : '1px solid var(--color-hairline)',
              }}
            >
              <div style={{
                color: step.active
                  ? 'var(--color-status-conditional)'
                  : step.done
                  ? 'var(--color-forest)'
                  : 'var(--color-ink-muted)',
              }}>
                {step.done ? (
                  <CheckCircle2 size={16} />
                ) : step.active ? (
                  <Clock size={16} className="animate-spin" />
                ) : (
                  <Icon size={16} />
                )}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--color-forest)',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                }}>
                  {step.title}
                </div>
                <div style={{
                  fontSize: '0.68rem',
                  color: 'var(--color-ink-muted)',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                }}>
                  {step.subtitle}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
