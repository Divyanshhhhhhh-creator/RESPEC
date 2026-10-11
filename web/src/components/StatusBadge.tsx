import React from 'react';
import { CheckCircle2, AlertTriangle, HelpCircle, XCircle } from 'lucide-react';
import { RecStatus, LedgerState } from '../types';

interface StatusBadgeProps {
  status: RecStatus | LedgerState;
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, showIcon = true }) => {
  switch (status) {
    case 'ELIGIBLE':
      return (
        <span className="badge badge-eligible">
          {showIcon && <CheckCircle2 size={13} strokeWidth={2.5} />}
          <span>ELIGIBLE</span>
        </span>
      );
    case 'CONDITIONAL':
      return (
        <span className="badge badge-conditional">
          {showIcon && <AlertTriangle size={13} strokeWidth={2.5} />}
          <span>CONDITIONAL</span>
        </span>
      );
    case 'MANUAL_REVIEW':
      return (
        <span className="badge badge-review">
          {showIcon && <HelpCircle size={13} strokeWidth={2.5} />}
          <span>MANUAL REVIEW</span>
        </span>
      );
    case 'NOT_ALLOWED':
      return (
        <span className="badge badge-notallowed">
          {showIcon && <XCircle size={13} strokeWidth={2.5} />}
          <span>NOT ALLOWED</span>
        </span>
      );
    case 'PLANNED':
      return (
        <span className="badge" style={{ backgroundColor: 'var(--color-sand-light)', color: 'var(--color-forest)', border: '1px solid var(--color-sand-dark)' }}>
          <span>PLANNED</span>
        </span>
      );
    case 'ORDERED':
      return (
        <span className="badge" style={{ backgroundColor: 'var(--color-terracotta-light)', color: 'var(--color-terracotta)', border: '1px solid var(--color-terracotta-border)' }}>
          <span>ORDERED</span>
        </span>
      );
    case 'VERIFIED':
      return (
        <span className="badge badge-eligible" style={{ fontWeight: 700 }}>
          {showIcon && <CheckCircle2 size={13} strokeWidth={2.5} />}
          <span>VERIFIED</span>
        </span>
      );
    default:
      return (
        <span className="badge" style={{ backgroundColor: 'rgba(47, 65, 86, 0.08)', color: 'var(--color-navy)' }}>
          <span>{status}</span>
        </span>
      );
  }
};
