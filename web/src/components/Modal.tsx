import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = '640px',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-content animate-fade-in"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '20px',
          borderBottom: '1px solid var(--color-hairline)',
          paddingBottom: '16px',
        }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-forest)' }}>{title}</h2>
            {subtitle && (
              <p style={{ fontSize: '0.82rem', color: 'var(--color-ink-secondary)', marginTop: '4px' }}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              background: 'var(--color-sand-light)',
              border: '1px solid var(--color-sand-border)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-forest)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div>{children}</div>
      </div>
    </div>
  );
};
