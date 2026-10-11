import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Info,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { PageHeader } from '../components/PageHeader';
import { useAppState } from '../context/AppContext';

export const ComplianceGap: React.FC = () => {
  const { state } = useAppState();
  const navigate = useNavigate();
  const gap = state.gap;

  const handleProceedToLedger = () => {
    navigate('/ledger');
  };

  const handleGoToUpload = () => {
    navigate('/upload');
  };

  if (!gap) {
    return (
      <div id="section-compliance" className="respec-section" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div className="respec-card" style={{ maxWidth: '600px', margin: '0 auto', padding: '40px' }}>
          <h2 style={{ fontSize: '1.3rem', color: 'var(--color-forest)', marginBottom: '12px', fontWeight: 700 }}>
            No Compliance Evaluation Active
          </h2>
          <p style={{ color: 'var(--color-ink-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>
            Please upload and confirm a Bill of Quantities to evaluate statutory compliance.
          </p>
          <button onClick={handleGoToUpload} className="btn btn-primary">
            Go to Upload BOQ →
          </button>
        </div>
      </div>
    );
  }

  // Chart data for Target vs Modelled share with Forest and Ochre bars
  const chartData = [
    {
      name: 'Mandatory Target',
      percentage: gap.targetPct,
      tonnes: Math.round(gap.denominatorT * (gap.targetPct / 100) * 10) / 10,
      fill: '#D6B85A', // Muted Ochre
    },
    {
      name: 'Modelled Share',
      percentage: gap.modelledPct,
      tonnes: gap.numeratorT,
      fill: '#233D35', // Deep Forest
    },
  ];

  return (
    <div id="section-compliance" className="respec-section animate-fade-in">
      <PageHeader
        stepNumber={5}
        title="Statutory Compliance Gap Calculator"
        subtitle="Transparent arithmetic comparing standard-permitted recycled material mass against C&D Waste Rules 2025 mandates. Excludes metal/wood from denominator; never invents regulatory results."
        action={
          <button
            onClick={handleProceedToLedger}
            className="btn btn-primary"
            style={{ padding: '11px 24px', fontSize: '0.92rem' }}
          >
            <span>Proceed to Plan & Ledger</span>
            <ArrowRight size={16} />
          </button>
        }
      />

      {/* Target Status Banner */}
      <div style={{
        padding: '24px 28px',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: gap.isTargetMet ? 'var(--color-sky-light)' : '#FEF3C7',
        border: `1px solid ${gap.isTargetMet ? 'var(--color-sky)' : '#FCD34D'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '28px',
        flexWrap: 'wrap',
        gap: '20px',
        boxShadow: 'var(--shadow-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: gap.isTargetMet ? 'var(--color-white)' : 'rgba(180, 83, 9, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: gap.isTargetMet ? 'var(--color-teal)' : '#B45309',
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
          }}>
            {gap.isTargetMet ? <CheckCircle2 size={28} /> : <AlertTriangle size={28} />}
          </div>
          <div>
            <div style={{
              fontSize: '1.2rem',
              fontWeight: 800,
              color: gap.isTargetMet ? 'var(--color-navy)' : '#78350F',
            }}>
              {gap.isTargetMet
                ? `COMPLIANCE TARGET ACHIEVED: ${gap.modelledPct}% MODELLED SHARE`
                : `COMPLIANCE GAP IDENTIFIED: ${gap.gapPct}% SHORTFALL`}
            </div>
            <p style={{ fontSize: '0.86rem', color: gap.isTargetMet ? 'var(--color-navy)' : '#92400E', marginTop: '2px', lineHeight: 1.45 }}>
              {gap.applicabilityReason}
            </p>
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '28px',
          borderLeft: '1px solid var(--color-hairline-strong)',
          paddingLeft: '28px',
        }}>
          <div>
            <div className="text-label" style={{ fontSize: '0.72rem' }}>Statutory Target</div>
            <div className="text-mono" style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--color-navy)' }}>
              {gap.targetPct}%
            </div>
          </div>
          <div>
            <div className="text-label" style={{ fontSize: '0.72rem' }}>Modelled Achieved</div>
            <div className="text-mono" style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--color-navy)' }}>
              {gap.modelledPct}%
            </div>
          </div>
        </div>
      </div>

      {/* Arithmetic Breakdown Grid in Pure White Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div className="respec-card" style={{ padding: '22px' }}>
          <div className="text-label" style={{ fontSize: '0.72rem', color: 'var(--color-teal)' }}>
            Denominator (Total Base Mass) [A]
          </div>
          <div className="text-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-navy)', margin: '6px 0 2px' }}>
            {gap.denominatorT.toLocaleString()} t
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--color-ink-muted)' }}>
            Excludes metal/wood ({gap.excludedLinesCount} lines)
          </div>
        </div>

        <div className="respec-card" style={{ padding: '22px' }}>
          <div className="text-label" style={{ fontSize: '0.72rem', color: 'var(--color-teal)' }}>
            Numerator (Recycled Material)
          </div>
          <div className="text-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-navy)', margin: '6px 0 2px' }}>
            {gap.numeratorT.toLocaleString()} t
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--color-ink-muted)' }}>
            Sum of permitted substituted mass
          </div>
        </div>

        <div className="respec-card" style={{ padding: '22px' }}>
          <div className="text-label" style={{ fontSize: '0.72rem', color: 'var(--color-teal)' }}>
            Statutory Target Mass Required
          </div>
          <div className="text-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-navy)', margin: '6px 0 2px' }}>
            {Math.round(gap.denominatorT * (gap.targetPct / 100) * 10) / 10} t
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--color-ink-muted)' }}>
            5.0% of {gap.denominatorT.toLocaleString()} t base
          </div>
        </div>

        <div className="respec-card" style={{ padding: '22px' }}>
          <div className="text-label" style={{ fontSize: '0.72rem', color: 'var(--color-teal)' }}>
            Net Variance / Cushion
          </div>
          <div className="text-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-navy)', margin: '6px 0 2px' }}>
            {gap.isTargetMet ? `+${Math.abs(gap.gapPct)}%` : `-${Math.abs(gap.gapPct)}%`}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--color-ink-muted)' }}>
            {gap.isTargetMet ? 'Meets FY 2026-27 mandate' : 'Requires non-structural lines'}
          </div>
        </div>
      </div>

      {/* Main Analysis: Visual Progress & Contributing Lines */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1.8fr)', gap: '24px', marginBottom: '28px' }}>
        {/* Recharts Bar Chart in White Card */}
        <div className="respec-card" style={{ padding: '26px' }}>
          <h3 style={{ fontSize: '1.02rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '4px' }}>
            Target vs Modelled Share (% of Total Material)
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-ink-secondary)', marginBottom: '20px' }}>
            C&D Waste Rules 2025 Second Schedule compliance visualization
          </p>

          <div style={{ width: '100%', height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                <XAxis type="number" domain={[0, Math.max(10, gap.modelledPct + 2)]} unit="%" stroke="var(--color-ink-muted)" />
                <YAxis dataKey="name" type="category" stroke="var(--color-navy)" width={120} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: 'rgba(47, 65, 86, 0.2)', borderRadius: '8px', color: '#2F4156' }}
                  formatter={(val: any, _name: any, item: any) => [`${val}% (${item.payload.tonnes} tonnes)`, 'Share']}
                />
                <Bar dataKey="percentage" radius={[0, 6, 6, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{
            fontSize: '0.78rem',
            color: 'var(--color-ink-muted)',
            textAlign: 'center',
            marginTop: '10px',
            borderTop: '1px solid var(--color-hairline)',
            paddingTop: '10px',
          }}>
            Threshold: 5% (FY 2026-27) → 10% (FY 2027-28) → 25% (FY 2030-31)
          </div>
        </div>

        {/* Contributing Lines Driving the Result in White Card */}
        <div className="respec-card" style={{ padding: '26px' }}>
          <h3 style={{ fontSize: '1.02rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '4px' }}>
            Contributing Material Lines Driving Substitution
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-ink-secondary)', marginBottom: '18px' }}>
            Ranked by total modelled tonnes diverted toward compliance
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {gap.topLines.map((line) => (
              <div
                key={line.lineId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#FAF7F5',
                  border: '1px solid var(--color-hairline)',
                }}
              >
                <div style={{ maxWidth: '65%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                    <span className="text-mono" style={{ fontSize: '0.74rem', color: 'var(--color-ink-muted)' }}>
                      #{line.itemNo}
                    </span>
                    <span className="badge" style={{ backgroundColor: 'var(--color-sky-light)', color: 'var(--color-navy)', fontSize: '0.68rem' }}>
                      {line.category}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.86rem', color: 'var(--color-navy)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {line.description}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div className="text-mono" style={{ fontSize: '1rem', fontWeight: 750, color: 'var(--color-navy)' }}>
                    +{line.contributionT.toLocaleString()} t
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--color-ink-secondary)' }}>
                    {line.shareOfTargetPct}% of diversion
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Assumptions Box — Visible on screen without scrolling (Acceptance Criterion A6) */}
      <div className="respec-card" style={{
        padding: '24px 28px',
        backgroundColor: 'var(--color-white)',
        border: '1px solid var(--color-hairline)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Info size={17} style={{ color: 'var(--color-teal)' }} />
          <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-navy)' }}>
            Visible Regulatory & Engineering Assumptions [V / A / E]
          </h4>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          {gap.assumptions.map((assump, i) => (
            <div
              key={i}
              style={{
                fontSize: '0.78rem',
                color: 'var(--color-navy)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--color-sky-light)',
                border: '1px solid var(--color-sky)',
                lineHeight: 1.45,
              }}
            >
              • {assump}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
