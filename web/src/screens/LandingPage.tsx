import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  FileSpreadsheet,
  Layers,
  BarChart3,
  ClipboardCheck,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Menu,
  X,
  Compass,
  FileText,
  AlertCircle
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--color-ivory)', minHeight: '100vh', color: 'var(--color-forest)' }}>
      {/* =========================================================================
          A. TOP NAVIGATION
          ========================================================================= */}
      <header className="respec-topbar-wrapper no-print">
        <div className="respec-topbar" style={{
          backgroundColor: 'var(--color-forest)',
          border: '1px solid rgba(232, 220, 203, 0.22)',
          boxShadow: 'var(--shadow-nav)',
        }}>
          {/* Brand Wordmark (30-34px desktop) */}
          <Link
            to="/"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            {/* Small restrained circular-material loop symbol */}
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-terracotta)',
              border: '2px solid var(--color-sand)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
              flexShrink: 0,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
              </svg>
            </div>

            <div>
              <div className="text-brand" style={{ fontSize: 'clamp(28px, 1.8rem, 33px)' }}>
                Re<span style={{ color: 'var(--color-sand)' }}>Spec</span>
              </div>
              <div style={{
                fontSize: '0.67rem',
                fontWeight: 600,
                color: 'var(--color-sand)',
                letterSpacing: '0.04em',
                opacity: 0.9,
                marginTop: '1px',
              }}>
                Circular materials, verified.
              </div>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => scrollToSection('hero')}
              className="respec-nav-link"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="respec-nav-link"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('guidelines')}
              className="respec-nav-link"
            >
              Guidelines
            </button>
            <button
              onClick={() => scrollToSection('our-impact')}
              className="respec-nav-link"
            >
              Our Impact
            </button>

            {/* Primary Action Button: Terracotta */}
            <Link
              to="/project"
              className="btn btn-primary"
              style={{
                marginLeft: '12px',
                padding: '8px 20px',
                fontSize: '0.86rem',
                fontWeight: 700,
              }}
            >
              Start a Project
              <ArrowRight size={15} />
            </Link>
          </nav>

          {/* Mobile Menu Toggle */}
          <div className="mobile-nav-toggle" style={{ display: 'none' }}>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                background: 'rgba(232, 220, 203, 0.15)',
                border: '1px solid rgba(232, 220, 203, 0.3)',
                color: 'var(--color-ivory)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-pill)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Menu</span>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div style={{
            pointerEvents: 'auto',
            maxWidth: '1240px',
            margin: '8px auto 0',
            backgroundColor: 'var(--color-forest)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(232, 220, 203, 0.25)',
            boxShadow: 'var(--shadow-nav)',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}>
            <button
              onClick={() => scrollToSection('hero')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-ivory)',
                textAlign: 'left',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.92rem',
                cursor: 'pointer',
              }}
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-ivory)',
                textAlign: 'left',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.92rem',
                cursor: 'pointer',
              }}
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('guidelines')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-ivory)',
                textAlign: 'left',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.92rem',
                cursor: 'pointer',
              }}
            >
              Guidelines
            </button>
            <button
              onClick={() => scrollToSection('our-impact')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-ivory)',
                textAlign: 'left',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.92rem',
                cursor: 'pointer',
              }}
            >
              Our Impact
            </button>
            <Link
              to="/project"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '6px' }}
              onClick={() => setMobileMenuOpen(false)}
            >
              Start a Project →
            </Link>
          </div>
        )}
      </header>

      {/* =========================================================================
          B. HERO SECTION
          ========================================================================= */}
      <section id="hero" style={{ paddingTop: '124px', paddingBottom: '70px' }}>
        <div className="respec-container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '48px',
            alignItems: 'center',
          }}>
            {/* Left Column: Text & CTAs */}
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'var(--color-sand-light)',
                border: '1px solid var(--color-sand-border)',
                marginBottom: '20px',
              }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-terracotta)',
                  display: 'inline-block',
                }} />
                <span className="text-eyebrow" style={{ color: 'var(--color-forest)', letterSpacing: '0.12em' }}>
                  BUILD BETTER. WASTE LESS.
                </span>
              </div>

              <h1 className="text-hero-headline" style={{ marginBottom: '22px' }}>
                Construction’s next chapter is{' '}
                <span style={{ color: 'var(--color-terracotta)', fontStyle: 'italic' }}>
                  circular.
                </span>
              </h1>

              <p style={{
                fontSize: '1.12rem',
                lineHeight: 1.65,
                color: 'var(--color-ink-secondary)',
                marginBottom: '32px',
                maxWidth: '540px',
              }}>
                ReSpec helps construction teams explore recycled material alternatives, review eligibility,
                understand compliance targets, and track materials from planning to verified delivery.
              </p>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', marginBottom: '28px' }}>
                <Link
                  to="/project"
                  className="btn btn-primary"
                  style={{
                    padding: '12px 28px',
                    fontSize: '0.98rem',
                    fontWeight: 700,
                  }}
                >
                  Start a Project →
                </Link>

                <button
                  onClick={() => scrollToSection('how-it-works')}
                  className="btn btn-secondary"
                  style={{
                    padding: '12px 24px',
                    fontSize: '0.95rem',
                  }}
                >
                  Discover How It Works
                </button>
              </div>

              {/* Supporting Trust Statement */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                paddingTop: '16px',
                borderTop: '1px solid var(--color-sand-border)',
                fontSize: '0.85rem',
                color: 'var(--color-ink-muted)',
                fontWeight: 500,
              }}>
                <ShieldCheck size={18} style={{ color: 'var(--color-forest)', flexShrink: 0 }} />
                <span>Transparent recommendations. Traceable decisions. Evidence-backed delivery.</span>
              </div>
            </div>

            {/* Right Column: Real Construction Photograph */}
            <div>
              <div style={{
                position: 'relative',
                borderRadius: 'var(--radius-xl)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-card-elevated)',
                border: '1px solid var(--color-sand-border)',
                backgroundColor: 'var(--color-sand-light)',
              }}>
                <img
                  src="/images/hero-construction.jpg"
                  alt="Modern architectural construction site in warm natural daylight with tower crane, timber and low-carbon reinforced concrete structure"
                  style={{
                    width: '100%',
                    height: 'auto',
                    minHeight: '360px',
                    maxHeight: '520px',
                    objectFit: 'cover',
                    display: 'block',
                    transition: 'transform 0.6s ease',
                  }}
                  loading="eager"
                />

                {/* Subtle Image Pill Overlay */}
                <div style={{
                  position: 'absolute',
                  bottom: '16px',
                  left: '16px',
                  right: '16px',
                  backgroundColor: 'rgba(35, 61, 53, 0.88)',
                  backdropFilter: 'blur(8px)',
                  color: 'var(--color-ivory)',
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.78rem',
                  border: '1px solid rgba(232, 220, 203, 0.25)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Building2 size={16} style={{ color: 'var(--color-ochre)' }} />
                    <span style={{ fontWeight: 600 }}>Active C&D Recovery Workflow</span>
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--color-sand)',
                    fontSize: '0.72rem',
                  }}>
                    IS 383:2016 Compliant
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          C. INTRODUCTION — "WHAT IS RESPEC?"
          ========================================================================= */}
      <section style={{
        backgroundColor: 'var(--color-sand-light)',
        borderTop: '1px solid var(--color-sand-border)',
        borderBottom: '1px solid var(--color-sand-border)',
        padding: '72px 0',
      }}>
        <div className="respec-container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '48px',
            alignItems: 'start',
          }}>
            {/* Left: Explanatory Context */}
            <div>
              <span className="text-eyebrow" style={{ display: 'block', marginBottom: '10px' }}>
                ARCHITECTURAL MATERIAL CLARITY
              </span>
              <h2 className="text-display font-serif" style={{ marginBottom: '20px' }}>
                What is ReSpec?
              </h2>
              <p style={{
                fontSize: '1.08rem',
                lineHeight: 1.7,
                color: 'var(--color-ink-primary)',
                marginBottom: '20px',
              }}>
                ReSpec helps construction teams make more informed decisions about recycled construction materials.
                It connects bill-of-quantities review, material recommendations, compliance calculations, and delivery
                verification in one structured workflow.
              </p>
              <p style={{
                fontSize: '0.92rem',
                lineHeight: 1.6,
                color: 'var(--color-ink-secondary)',
                backgroundColor: 'var(--color-white)',
                padding: '16px 20px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-sand-border)',
              }}>
                <strong>Engineering Disclaimer:</strong> ReSpec supports decision-making and provides regulatory
                traceability against standards such as IS 383:2016 and C&D Waste Rules 2025. It does not independently
                certify a project, guarantee compliance, or replace professional engineering judgement.
              </p>
            </div>

            {/* Right: Four Core Capabilities Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px' }}>
              {[
                {
                  number: '01',
                  title: 'BOQ Understanding',
                  desc: 'Extracts civil quantities, normalizes legacy unit representations, and identifies structural concrete grades.',
                },
                {
                  number: '02',
                  title: 'Sourced Material Recommendations',
                  desc: 'Applies deterministic rules with explicit clause references, maximum permitted replacement percentages, and mandatory notes.',
                },
                {
                  number: '03',
                  title: 'Transparent Compliance Calculations',
                  desc: 'Exposes exact numerator, denominator exclusions, and statutory benchmarks under C&D Waste Rules 2025.',
                },
                {
                  number: '04',
                  title: 'Evidence-Backed Delivery Tracking',
                  desc: 'Ensures only verified deliveries backed by official weighbridge slips contribute to actual statutory diversion.',
                },
              ].map((cap) => (
                <div
                  key={cap.number}
                  style={{
                    backgroundColor: 'var(--color-white)',
                    padding: '18px 22px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-sand-border)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                    boxShadow: 'var(--shadow-subtle)',
                  }}
                >
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: 'var(--color-terracotta)',
                    backgroundColor: 'var(--color-terracotta-light)',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-xs)',
                    marginTop: '2px',
                  }}>
                    {cap.number}
                  </span>
                  <div>
                    <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--color-forest)', marginBottom: '4px' }}>
                      {cap.title}
                    </h3>
                    <p style={{ fontSize: '0.86rem', color: 'var(--color-ink-secondary)', lineHeight: 1.5, margin: 0 }}>
                      {cap.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          D. "HOW WE HELP" FEATURE CARDS
          ========================================================================= */}
      <section style={{ padding: '80px 0' }}>
        <div className="respec-container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 48px' }}>
            <span className="text-eyebrow" style={{ display: 'block', marginBottom: '8px' }}>
              CAPABILITIES & WORKFLOW
            </span>
            <h2 className="text-display font-serif" style={{ marginBottom: '14px' }}>
              Better decisions at every stage.
            </h2>
            <p className="text-subtitle">
              From the initial quantity take-off to post-pour delivery audits, ReSpec keeps engineering
              safeguards front and centre.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '24px',
          }}>
            {/* Card 1 */}
            <div className="respec-card" style={{ padding: '30px 24px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-terracotta-light)',
                border: '1px solid var(--color-terracotta-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-terracotta)',
                marginBottom: '20px',
              }}>
                <FileSpreadsheet size={24} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-forest)', marginBottom: '10px' }}>
                Understand your BOQ
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-ink-secondary)', lineHeight: 1.55 }}>
                Upload construction quantities, review extracted information, and correct uncertain entries before evaluation.
              </p>
            </div>

            {/* Card 2 */}
            <div className="respec-card" style={{ padding: '30px 24px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-terracotta-light)',
                border: '1px solid var(--color-terracotta-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-terracotta)',
                marginBottom: '20px',
              }}>
                <Layers size={24} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-forest)', marginBottom: '10px' }}>
                Explore material options
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-ink-secondary)', lineHeight: 1.55 }}>
                Review eligibility classifications, source references, engineering conditions, and restrictions before making decisions.
              </p>
            </div>

            {/* Card 3 */}
            <div className="respec-card" style={{ padding: '30px 24px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-terracotta-light)',
                border: '1px solid var(--color-terracotta-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-terracotta)',
                marginBottom: '20px',
              }}>
                <BarChart3 size={24} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-forest)', marginBottom: '10px' }}>
                Understand compliance
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-ink-secondary)', lineHeight: 1.55 }}>
                See how permitted recycled materials contribute to the applicable project target, with calculations and assumptions clearly explained.
              </p>
            </div>

            {/* Card 4 */}
            <div className="respec-card" style={{ padding: '30px 24px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-terracotta-light)',
                border: '1px solid var(--color-terracotta-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-terracotta)',
                marginBottom: '20px',
              }}>
                <ClipboardCheck size={24} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-forest)', marginBottom: '10px' }}>
                Verify delivery
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-ink-secondary)', lineHeight: 1.55 }}>
                Connect planning and orders to supporting delivery evidence so verified quantities reflect documented deliveries.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          E. "HOW IT WORKS" PROCESS SECTION
          ========================================================================= */}
      <section id="how-it-works" style={{
        backgroundColor: 'var(--color-sand-light)',
        borderTop: '1px solid var(--color-sand-border)',
        borderBottom: '1px solid var(--color-sand-border)',
        padding: '80px 0',
      }}>
        <div className="respec-container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 48px' }}>
            <span className="text-eyebrow" style={{ display: 'block', marginBottom: '8px' }}>
              STRUCTURED PROCESS
            </span>
            <h2 className="text-display font-serif" style={{ marginBottom: '14px' }}>
              From quantities to verified materials.
            </h2>
            <p className="text-subtitle">
              A 5-step engineering process designed to turn complex BOQ line items into transparent, compliant execution.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '20px',
          }}>
            {[
              {
                step: '01',
                title: 'Create a project',
                desc: 'Enter project details, location, area, project type, and relevant financial-year information.',
                route: '/project',
              },
              {
                step: '02',
                title: 'Upload & review BOQ',
                desc: 'Upload a supported document or enter quantities manually. Review extracted information and confirm the BOQ before evaluation.',
                route: '/upload',
              },
              {
                step: '03',
                title: 'Explore recommendations',
                desc: 'Review eligible, conditional, manually reviewable, and prohibited material options, together with source references and applicable conditions.',
                route: '/recommendations',
              },
              {
                step: '04',
                title: 'Understand compliance gap',
                desc: 'See the applicable target, modelled recycled share, calculation details, and contributing BOQ items.',
                route: '/compliance-gap',
              },
              {
                step: '05',
                title: 'Plan and verify delivery',
                desc: 'Prepare a draft plan, record purchase orders, attach required delivery evidence, and track the workflow through verification.',
                route: '/ledger',
              },
            ].map((st) => (
              <div
                key={st.step}
                style={{
                  backgroundColor: 'var(--color-white)',
                  padding: '24px 20px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-sand-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-subtle)',
                }}
              >
                <div>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: 'var(--color-terracotta)',
                    marginBottom: '12px',
                  }}>
                    {st.step}
                  </div>
                  <h3 style={{ fontSize: '1.02rem', fontWeight: 700, color: 'var(--color-forest)', marginBottom: '8px' }}>
                    {st.title}
                  </h3>
                  <p style={{ fontSize: '0.86rem', color: 'var(--color-ink-secondary)', lineHeight: 1.5, margin: 0 }}>
                    {st.desc}
                  </p>
                </div>

                <div style={{ marginTop: '20px', paddingTop: '12px', borderTop: '1px solid var(--color-sand-light)' }}>
                  <Link
                    to={st.route}
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: 'var(--color-terracotta)',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    Go to step →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          F. "GUIDELINES" — RESPONSIBLE MATERIAL DECISIONS
          ========================================================================= */}
      <section id="guidelines" style={{ padding: '80px 0' }}>
        <div className="respec-container">
          <div style={{ maxWidth: '800px', margin: '0 auto 48px', textAlign: 'center' }}>
            <span className="text-eyebrow" style={{ display: 'block', marginBottom: '8px' }}>
              SAFETY & CODE ENFORCEMENT
            </span>
            <h2 className="text-display font-serif" style={{ marginBottom: '14px' }}>
              Built around responsible material decisions.
            </h2>
            <p className="text-subtitle" style={{ fontSize: '1.05rem' }}>
              Recycled material decisions require more than a recommendation. ReSpec keeps source references,
              restrictions, assumptions, and delivery evidence visible throughout the workflow.
            </p>
          </div>

          {/* 8 Principles Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '18px',
          }}>
            {[
              {
                title: 'BOQ Confirmation Precondition',
                desc: 'Review and confirm BOQ information before evaluation is unlocked.',
              },
              {
                title: 'Cited Engineering Sources',
                desc: 'Check cited sources, material grades, and applicable engineering conditions before making commitments.',
              },
              {
                title: 'Strict Negative Controls',
                desc: 'Route uncertain or unsupported materials directly to manual review or prohibited classification.',
              },
              {
                title: 'Restricted Approval Gate',
                desc: 'Never treat restricted materials as automatically approved. Block bypass attempts.',
              },
              {
                title: 'Transparent Compliance Accounting',
                desc: 'Keep compliance targets, calculation assumptions, numerator, and denominator completely transparent.',
              },
              {
                title: 'Four-Stage Ledger Separation',
                desc: 'Distinguish planned quantities from ordered and verified quantities at all times.',
              },
              {
                title: 'Delivery Evidence Gating',
                desc: 'Require the appropriate supporting delivery evidence (weighbridge receipts) before marking deliveries as verified.',
              },
              {
                title: 'Professional Engineering Review',
                desc: 'Retain appropriate engineering review and official approval processes for structural applications.',
              },
            ].map((p, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: 'var(--color-white)',
                  padding: '20px 22px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-sand-border)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}
              >
                <CheckCircle2 size={18} style={{ color: 'var(--color-forest)', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h4 style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--color-forest)', marginBottom: '4px' }}>
                    {p.title}
                  </h4>
                  <p style={{ fontSize: '0.84rem', color: 'var(--color-ink-secondary)', lineHeight: 1.5, margin: 0 }}>
                    {p.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          G. "OUR IMPACT" SECTION
          ========================================================================= */}
      <section id="our-impact" style={{
        backgroundColor: 'var(--color-sand-light)',
        borderTop: '1px solid var(--color-sand-border)',
        borderBottom: '1px solid var(--color-sand-border)',
        padding: '80px 0',
      }}>
        <div className="respec-container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '48px',
            alignItems: 'center',
          }}>
            {/* Left Image: Material samples (terrazzo, aggregate, clay brick) */}
            <div>
              <div style={{
                borderRadius: 'var(--radius-xl)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-card-elevated)',
                border: '1px solid var(--color-sand-border)',
                backgroundColor: 'var(--color-white)',
              }}>
                <img
                  src="/images/impact-materials.jpg"
                  alt="Architectural material blocks of circular recycled concrete aggregate, terrazzo finish, and reclaimed clay brick masonry"
                  style={{
                    width: '100%',
                    height: 'auto',
                    minHeight: '320px',
                    maxHeight: '440px',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                  loading="lazy"
                />
              </div>
            </div>

            {/* Right: Intended Benefits Text (No fabricated stats) */}
            <div>
              <span className="text-eyebrow" style={{ display: 'block', marginBottom: '8px' }}>
                INTENDED BENEFITS
              </span>
              <h2 className="text-display font-serif" style={{ marginBottom: '18px' }}>
                Make circular construction easier to understand.
              </h2>
              <p style={{
                fontSize: '1.05rem',
                lineHeight: 1.65,
                color: 'var(--color-ink-primary)',
                marginBottom: '24px',
              }}>
                ReSpec is built to bridge the gap between statutory sustainability mandates and day-to-day
                procurement on construction sites. By anchoring calculations in real engineering standards,
                project teams gain confidence to adopt circular materials.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  'Greater visibility into recycled material opportunities across concrete, masonry, and sub-base lines.',
                  'More transparent material selection guided by clause-backed replacement maximums (IS 383:2016).',
                  'Easier review of applicable targets and assumptions without manual spreadsheet calculation errors.',
                  'Improved traceability from planning to delivery verification with tamper-evident record keeping.',
                ].map((benefit, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-terracotta)',
                      marginTop: '8px',
                      flexShrink: 0,
                    }} />
                    <span style={{ fontSize: '0.92rem', color: 'var(--color-ink-secondary)', lineHeight: 1.55 }}>
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          H. FINAL CALL TO ACTION
          ========================================================================= */}
      <section style={{ padding: '80px 0' }}>
        <div className="respec-container">
          <div style={{
            backgroundColor: 'var(--color-forest)',
            color: 'var(--color-ivory)',
            borderRadius: 'var(--radius-xl)',
            padding: '56px 40px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-card-elevated)',
            border: '1px solid rgba(232, 220, 203, 0.2)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{ maxWidth: '640px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
              <span className="text-eyebrow" style={{ color: 'var(--color-ochre)', display: 'block', marginBottom: '10px' }}>
                GET STARTED TODAY
              </span>
              <h2 className="text-display font-serif" style={{ color: '#FFFFFF', marginBottom: '16px' }}>
                Ready to make your next project more circular?
              </h2>
              <p style={{
                fontSize: '1.08rem',
                color: 'var(--color-sand)',
                lineHeight: 1.6,
                marginBottom: '32px',
              }}>
                Start with your project details and explore your material options with greater clarity.
              </p>

              <Link
                to="/project"
                className="btn btn-primary"
                style={{
                  padding: '14px 36px',
                  fontSize: '1rem',
                  fontWeight: 700,
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                }}
              >
                Start Your Project →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          I. FOOTER
          ========================================================================= */}
      <footer style={{
        backgroundColor: 'var(--color-forest-dark)',
        color: 'var(--color-sand)',
        padding: '60px 0 36px',
        borderTop: '1px solid rgba(232, 220, 203, 0.15)',
      }}>
        <div className="respec-container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '36px',
            marginBottom: '48px',
          }}>
            {/* Col 1: Brand & Description */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-terracotta)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                  </svg>
                </div>
                <span className="text-brand" style={{ fontSize: '1.6rem', color: '#FFFFFF' }}>
                  Re<span style={{ color: 'var(--color-sand)' }}>Spec</span>
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--color-sand)', opacity: 0.85, lineHeight: 1.5, marginBottom: '10px' }}>
                Circular materials, verified.
              </p>
              <p style={{ fontSize: '0.84rem', color: 'var(--color-sand-dark)', lineHeight: 1.55 }}>
                An engineering compliance platform connecting BOQ quantities to verified recycled material deliveries.
              </p>
            </div>

            {/* Col 2: Landing Page Links */}
            <div>
              <h4 style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#FFFFFF', marginBottom: '14px' }}>
                Navigation
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.86rem' }}>
                <li>
                  <button
                    onClick={() => scrollToSection('hero')}
                    style={{ background: 'none', border: 'none', color: 'var(--color-sand)', cursor: 'pointer', padding: 0 }}
                  >
                    Home
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('how-it-works')}
                    style={{ background: 'none', border: 'none', color: 'var(--color-sand)', cursor: 'pointer', padding: 0 }}
                  >
                    How It Works
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('guidelines')}
                    style={{ background: 'none', border: 'none', color: 'var(--color-sand)', cursor: 'pointer', padding: 0 }}
                  >
                    Guidelines
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('our-impact')}
                    style={{ background: 'none', border: 'none', color: 'var(--color-sand)', cursor: 'pointer', padding: 0 }}
                  >
                    Our Impact
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Application Workflows */}
            <div>
              <h4 style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#FFFFFF', marginBottom: '14px' }}>
                Application Workflows
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.86rem' }}>
                <li><Link to="/project" style={{ color: 'var(--color-sand)', textDecoration: 'none' }}>1. New Project</Link></li>
                <li><Link to="/upload" style={{ color: 'var(--color-sand)', textDecoration: 'none' }}>2. Upload BOQ</Link></li>
                <li><Link to="/review" style={{ color: 'var(--color-sand)', textDecoration: 'none' }}>3. Review BOQ</Link></li>
                <li><Link to="/recommendations" style={{ color: 'var(--color-sand)', textDecoration: 'none' }}>4. Recommendations</Link></li>
                <li><Link to="/compliance-gap" style={{ color: 'var(--color-sand)', textDecoration: 'none' }}>5. Compliance Gap</Link></li>
                <li><Link to="/ledger" style={{ color: 'var(--color-sand)', textDecoration: 'none' }}>6. Plan & Ledger</Link></li>
              </ul>
            </div>

            {/* Col 4: Regulatory Citations */}
            <div>
              <h4 style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#FFFFFF', marginBottom: '14px' }}>
                Regulatory Context
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--color-sand-dark)', lineHeight: 1.55 }}>
                Evaluated against Ministry of Environment, Forest and Climate Change (MoEFCC) C&D Waste Management Rules 2025 and Bureau of Indian Standards IS 383:2016.
              </p>
            </div>
          </div>

          <div style={{
            borderTop: '1px solid rgba(232, 220, 203, 0.1)',
            paddingTop: '24px',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.78rem',
            color: 'var(--color-sand-dark)',
          }}>
            <div>
              © {new Date().getFullYear()} ReSpec Platform. All rights reserved.
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <span>Synthetic test environment</span>
              <span>•</span>
              <span>IS 383:2016 Table 2 Note 2 Safe Execution</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
