import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  RotateCcw,
  ChevronDown,
  ArrowLeft,
  Building2,
  FileSpreadsheet,
  Table,
  Layers,
  BarChart3,
  ClipboardCheck,
} from 'lucide-react';
import { useAppState } from '../context/AppContext';

export const SECTION_IDS = {
  project: 'section-project',
  upload: 'section-upload',
  review: 'section-review',
  recommendations: 'section-recommendations',
  compliance: 'section-compliance',
  ledger: 'section-ledger',
};

export const APP_ROUTES = [
  { path: '/project', label: '1. Project', icon: Building2 },
  {
    path: '/upload',
    label: '2. Upload BOQ',
    icon: FileSpreadsheet,
    getBadge: (state: any) => (state.lines.length ? `${state.lines.length} rows` : undefined),
  },
  {
    path: '/review',
    label: '3. Review',
    icon: Table,
    getBadge: (state: any) => {
      const alerts = state.lines.filter((l: any) => l.flags.includes('LOW_CONFIDENCE')).length;
      return alerts ? `${alerts} alerts` : undefined;
    },
  },
  {
    path: '/recommendations',
    label: '4. Recommendations',
    icon: Layers,
    getBadge: (state: any) => {
      const eligible = state.recommendations.filter(
        (r: any) => r.status === 'ELIGIBLE' || r.status === 'CONDITIONAL'
      ).length;
      return state.recommendations.length ? `${eligible} eligible` : undefined;
    },
  },
  {
    path: '/compliance-gap',
    label: '5. Compliance',
    icon: BarChart3,
    getBadge: (state: any) => (state.gap ? `${state.gap.modelledPct}%` : undefined),
  },
  {
    path: '/ledger',
    label: '6. Plan & Ledger',
    icon: ClipboardCheck,
    getBadge: (state: any) => (state.impact ? `${state.impact.verifiedT}t verified` : undefined),
  },
];

export const Navigation: React.FC = () => {
  const { state, resetToDemo } = useAppState();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If on public landing page, let LandingPage handle its own public navigation
  if (location.pathname === '/') {
    return null;
  }

  return (
    <>
      {/* Top Banner: Concise statutory context & state reset */}
      <div className="demo-banner no-print" style={{
        backgroundColor: 'var(--color-forest-dark)',
        color: 'var(--color-sand)',
        fontSize: '0.76rem',
        padding: '6px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(232, 220, 203, 0.15)',
        fontWeight: 500,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            background: 'rgba(232, 220, 203, 0.15)',
            padding: '2px 8px',
            borderRadius: 'var(--radius-pill)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            color: 'var(--color-sand)',
            border: '1px solid rgba(232, 220, 203, 0.25)'
          }}>
            [S] DEMO MODE
          </span>
          <span style={{ color: 'var(--color-sand-light)' }}>
            C&D Waste Rules 2025 & IS 383:2016 Engineering Engine
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ color: 'var(--color-sand)', fontSize: '0.74rem' }}>
            Active Project: <strong style={{ color: '#FFFFFF' }}>{state.currentJob.projectName}</strong>
          </span>
          <button
            onClick={() => {
              if (window.confirm('Reset all demo data back to baseline IIT Delhi project state?')) {
                resetToDemo();
              }
            }}
            title="Reset synthetic demo data to default campus project"
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: 'var(--color-sand)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-pill)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.72rem',
              transition: 'background 0.15s ease',
            }}
          >
            <RotateCcw size={11} /> Reset State
          </button>
        </div>
      </div>

      {/* Application Top Navigation Bar (Deep Forest #233D35) */}
      <header className="respec-topbar-wrapper no-print">
        <div className="respec-topbar" style={{
          backgroundColor: 'var(--color-forest)',
          border: '1px solid rgba(232, 220, 203, 0.22)',
          boxShadow: 'var(--shadow-nav)',
        }}>
          {/* Left: Brand Name (30-34px) + Back to Overview Link */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Link
              to="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                textDecoration: 'none',
                cursor: 'pointer',
              }}
              title="Return to Public Overview"
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-terracotta)',
                border: '2px solid var(--color-sand)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
                flexShrink: 0,
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                </svg>
              </div>

              <div>
                <div className="text-brand" style={{ fontSize: 'clamp(28px, 1.8rem, 32px)' }}>
                  Re<span style={{ color: 'var(--color-sand)' }}>Spec</span>
                </div>
                <div style={{
                  fontSize: '0.66rem',
                  fontWeight: 600,
                  color: 'var(--color-sand)',
                  letterSpacing: '0.04em',
                  opacity: 0.9,
                }}>
                  Circular materials, verified.
                </div>
              </div>
            </Link>

            {/* Quick back to overview chip */}
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.74rem',
                color: 'var(--color-sand)',
                textDecoration: 'none',
                padding: '4px 10px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'rgba(232, 220, 203, 0.12)',
                border: '1px solid rgba(232, 220, 203, 0.2)',
                transition: 'background 0.15s ease',
              }}
              title="View Public Introduction"
            >
              <ArrowLeft size={12} />
              <span>Overview</span>
            </Link>
          </div>

          {/* Center/Right: Six Distinct Application Workflow Tabs */}
          <nav style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }} className="desktop-nav">
            {APP_ROUTES.map((item) => {
              const isActive = location.pathname === item.path;
              const badge = item.getBadge ? item.getBadge(state) : undefined;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`respec-nav-link ${isActive ? 'active' : ''}`}
                  style={{
                    backgroundColor: isActive ? 'var(--color-terracotta)' : 'transparent',
                    color: '#FFFFFF',
                  }}
                >
                  <span>{item.label}</span>
                  {badge && (
                    <span style={{
                      fontSize: '0.67rem',
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-pill)',
                      backgroundColor: isActive ? 'rgba(0, 0, 0, 0.2)' : 'rgba(232, 220, 203, 0.2)',
                      color: isActive ? '#FFFFFF' : 'var(--color-sand)',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                    }}>
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Mobile Menu Toggle Button */}
          <div className="mobile-nav-toggle" style={{ display: 'none' }}>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                background: 'rgba(232, 220, 203, 0.15)',
                border: '1px solid rgba(232, 220, 203, 0.3)',
                color: 'var(--color-ivory)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>Workflow</span>
              <ChevronDown size={14} />
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Panel */}
        {mobileMenuOpen && (
          <div style={{
            pointerEvents: 'auto',
            maxWidth: '1240px',
            margin: '8px auto 0',
            backgroundColor: 'var(--color-forest)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(232, 220, 203, 0.25)',
            boxShadow: 'var(--shadow-nav)',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}>
            {APP_ROUTES.map((item) => {
              const isActive = location.pathname === item.path;
              const badge = item.getBadge ? item.getBadge(state) : undefined;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    textDecoration: 'none',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    backgroundColor: isActive ? 'var(--color-terracotta)' : 'transparent',
                    color: '#FFFFFF',
                  }}
                >
                  <span>{item.label}</span>
                  {badge && (
                    <span style={{
                      fontSize: '0.72rem',
                      fontFamily: 'var(--font-mono)',
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-pill)',
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    }}>
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                marginTop: '6px',
                paddingTop: '8px',
                borderTop: '1px solid rgba(232, 220, 203, 0.2)',
                color: 'var(--color-sand)',
                textDecoration: 'none',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                justifyContent: 'center',
              }}
            >
              <ArrowLeft size={13} /> Return to Public Overview
            </Link>
          </div>
        )}
      </header>
    </>
  );
};
