import React from 'react';

interface PageHeaderProps {
  stepNumber: number;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  stepNumber,
  title,
  subtitle,
  action,
}) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: '24px',
      marginBottom: '28px',
      flexWrap: 'wrap',
    }}>
      <div>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '3px 12px',
          borderRadius: 'var(--radius-pill)',
          backgroundColor: 'var(--color-sand-light)',
          border: '1px solid var(--color-sand-border)',
          color: 'var(--color-forest)',
          fontSize: '0.74rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: '10px',
        }}>
          <span style={{ color: 'var(--color-terracotta)' }}>●</span>
          <span>WORKFLOW STEP {stepNumber} OF 6</span>
        </div>
        <h2 className="text-display" style={{ marginBottom: '8px' }}>
          {title}
        </h2>
        <p className="text-subtitle" style={{
          maxWidth: '780px',
        }}>
          {subtitle}
        </p>
      </div>

      {action && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
          {action}
        </div>
      )}
    </div>
  );
};
