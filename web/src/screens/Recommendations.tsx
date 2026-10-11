import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Phone,
  Building,
  MapPin,
  Check,
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { useAppState } from '../context/AppContext';
import { Recommendation } from '../types';

export const Recommendations: React.FC = () => {
  const { state, makeDecision } = useAppState();
  const navigate = useNavigate();

  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedRecForCondition, setSelectedRecForCondition] = useState<Recommendation | null>(null);
  const [acknowledgedConditions, setAcknowledgedConditions] = useState<string[]>([]);
  const [approverName, setApproverName] = useState('Er. Aarvi Bansal (Procurement Lead)');
  const [approvalNote, setApprovalNote] = useState('');
  const [safetyAlertMsg, setSafetyAlertMsg] = useState<string | null>(null);

  const filterCounts = {
    all: state.recommendations.length,
    ELIGIBLE: state.recommendations.filter((r) => r.status === 'ELIGIBLE').length,
    CONDITIONAL: state.recommendations.filter((r) => r.status === 'CONDITIONAL').length,
    MANUAL_REVIEW: state.recommendations.filter((r) => r.status === 'MANUAL_REVIEW').length,
    NOT_ALLOWED: state.recommendations.filter((r) => r.status === 'NOT_ALLOWED').length,
  };

  const filteredRecs = state.recommendations.filter((r) => {
    if (activeFilter === 'all') return true;
    return r.status === activeFilter;
  });

  const handleApproveClick = (rec: Recommendation) => {
    setSafetyAlertMsg(null);

    // Safety Gate Check: NEVER allow approving MANUAL_REVIEW or NOT_ALLOWED
    if (rec.status === 'NOT_ALLOWED') {
      setSafetyAlertMsg('Safety Gate Restriction: NOT_ALLOWED recommendations cannot be approved.');
      return;
    }
    if (rec.status === 'MANUAL_REVIEW') {
      setSafetyAlertMsg('Safety Gate Restriction: MANUAL_REVIEW lines require verified statutory standard clauses before approval.');
      return;
    }

    if (rec.status === 'CONDITIONAL') {
      setSelectedRecForCondition(rec);
      setAcknowledgedConditions([]);
      return;
    }

    // Direct approve for ELIGIBLE
    makeDecision(rec.recId, 'APPROVE', approverName, 'Standard IS 383:2016 substitution approved.');
  };

  const handleRejectClick = (rec: Recommendation) => {
    makeDecision(rec.recId, 'REJECT', approverName, 'Procurement engineer rejected recycled substitution.');
  };

  const handleConfirmConditionalApproval = () => {
    if (!selectedRecForCondition) return;
    if (acknowledgedConditions.length < selectedRecForCondition.conditions.length) {
      alert('Please acknowledge and verify all statutory engineering conditions before signing off.');
      return;
    }

    makeDecision(
      selectedRecForCondition.recId,
      'APPROVE',
      approverName,
      approvalNote || 'Conditional approval granted after engineering checks.',
      acknowledgedConditions
    );
    setSelectedRecForCondition(null);
  };

  const handleProceedToCompliance = () => {
    navigate('/compliance-gap');
  };

  return (
    <div id="section-recommendations" className="respec-section animate-fade-in">
      <PageHeader
        stepNumber={4}
        title="Standard-Permitted Recycled Substitution Recommendations"
        subtitle="Deterministic evaluation against IS 383:2016 and Delhi-NCR C&D waste statutory guidelines. No AI hallucination: every recommendation is traceable to a published clause with strict structural safety gates."
        action={
          <button
            onClick={handleProceedToCompliance}
            className="btn btn-primary"
            style={{ padding: '11px 24px', fontSize: '0.92rem' }}
          >
            <span>Proceed to Compliance Gap</span>
            <ArrowRight size={16} />
          </button>
        }
      />

      {/* Safety Gate Warning if triggered */}
      {safetyAlertMsg && (
        <div style={{
          padding: '14px 20px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--color-status-notallowed-bg)',
          border: '1px solid var(--color-status-notallowed-border)',
          color: 'var(--color-status-notallowed)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px',
          fontSize: '0.88rem',
        }}>
          <ShieldAlert size={20} />
          <span>{safetyAlertMsg}</span>
        </div>
      )}

      {/* Phone Confirmation Banner in Sky Blue panel */}
      <div style={{
        padding: '14px 20px',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--color-sky-light)',
        border: '1px solid var(--color-sky)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        fontSize: '0.84rem',
        color: 'var(--color-navy)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Phone size={17} style={{ color: 'var(--color-teal)' }} />
          <span>
            <strong>Facility Logistics Notice:</strong> Authorized DPCC plant distances are computed straight-line via haversine [E]. Real-time plant stock is not live; always confirm product availability by phone before dispatching trucks.
          </span>
        </div>
      </div>

      {/* Filter Tabs in Light Styling */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '22px', flexWrap: 'wrap' }}>
        {[
          { id: 'all', label: `All (${filterCounts.all})` },
          { id: 'ELIGIBLE', label: `Eligible (${filterCounts.ELIGIBLE})` },
          { id: 'CONDITIONAL', label: `Conditional (${filterCounts.CONDITIONAL})` },
          { id: 'MANUAL_REVIEW', label: `Manual Review (${filterCounts.MANUAL_REVIEW})` },
          { id: 'NOT_ALLOWED', label: `Not Allowed (${filterCounts.NOT_ALLOWED})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '0.82rem',
              fontWeight: 650,
              cursor: 'pointer',
              border: activeFilter === tab.id ? '1px solid var(--color-navy)' : '1px solid var(--color-hairline)',
              backgroundColor: activeFilter === tab.id ? 'var(--color-navy)' : 'var(--color-white)',
              color: activeFilter === tab.id ? 'var(--color-white)' : 'var(--color-navy)',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Recommendation Cards in Pure White */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {filteredRecs.map((rec) => {
          const line = state.lines.find((l) => l.lineId === rec.lineId);
          const canApprove = rec.status === 'ELIGIBLE' || rec.status === 'CONDITIONAL';
          const isApproved = rec.decision === 'APPROVE';
          const isRejected = rec.decision === 'REJECT';
          const nearestFacility = rec.facilityOptions[0];

          return (
            <div
              key={rec.recId}
              className="respec-card"
              style={{
                padding: '26px',
                borderLeft: `5px solid ${
                  rec.status === 'ELIGIBLE'
                    ? 'var(--color-status-eligible)'
                    : rec.status === 'CONDITIONAL'
                    ? 'var(--color-status-conditional)'
                    : rec.status === 'NOT_ALLOWED'
                    ? 'var(--color-status-notallowed)'
                    : 'var(--color-navy)'
                }`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 500px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span className="text-mono" style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--color-teal)' }}>
                      ITEM {line?.itemNo || '—'}
                    </span>
                    <StatusBadge status={rec.status} />
                    {rec.maxShare > 0 ? (
                      <span className="badge" style={{ backgroundColor: 'var(--color-sky-light)', color: 'var(--color-navy)' }}>
                        Permitted Max Share: {rec.maxShare}%
                      </span>
                    ) : (
                      <span className="badge" style={{ backgroundColor: 'var(--color-status-notallowed-bg)', color: 'var(--color-status-notallowed)' }}>
                        Substitution: 0% Permitted
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '1.08rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '6px' }}>
                    {line?.description}
                  </h3>

                  <div style={{ fontSize: '0.88rem', color: 'var(--color-ink-secondary)', marginBottom: '14px' }}>
                    Proposed Product Substitution: <strong style={{ color: 'var(--color-navy)' }}>{rec.product}</strong>
                  </div>

                  {/* Conditions & Standard Clause in Soft Box */}
                  <div style={{
                    padding: '14px 18px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: '#FAF7F5',
                    border: '1px solid var(--color-hairline)',
                    marginBottom: '16px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span className="text-label" style={{ fontSize: '0.72rem', color: 'var(--color-teal)' }}>
                        Statutory Reference:
                      </span>
                      <a
                        href={rec.source.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: '0.82rem',
                          color: 'var(--color-navy)',
                          fontWeight: 650,
                          textDecoration: 'underline',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {rec.source.clause} <ExternalLink size={12} />
                      </a>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--color-navy)' }}>
                      <strong>Conditions & Assumptions:</strong>
                      <ul style={{ paddingLeft: '18px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px', color: 'var(--color-ink-muted)' }}>
                        {rec.conditions.map((cond, i) => (
                          <li key={i}>{cond}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Nearest Authorized Facility */}
                  {nearestFacility && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '18px', fontSize: '0.8rem', color: 'var(--color-ink-secondary)', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Building size={14} style={{ color: 'var(--color-teal)' }} />
                        Nearest Plant: <strong style={{ color: 'var(--color-navy)' }}>{nearestFacility.facilityName}</strong>
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <MapPin size={14} />
                        {nearestFacility.distanceKm} km (straight-line [E])
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Phone size={14} />
                        {nearestFacility.phone}
                      </span>
                    </div>
                  )}
                </div>

                {/* Modelled Mass & Action Area */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  minWidth: '220px',
                  gap: '16px',
                }}>
                  <div style={{ textAlign: 'right' }}>
                    <div className="text-label" style={{ fontSize: '0.72rem' }}>Modelled Recycled Mass</div>
                    <div className="text-mono" style={{ fontSize: '1.5rem', fontWeight: 800, color: rec.modelledMassT ? 'var(--color-navy)' : 'var(--color-ink-muted)' }}>
                      {rec.modelledMassT ? `${rec.modelledMassT.toLocaleString()} t` : '0 t'}
                    </div>
                    {line?.massT && (
                      <div style={{ fontSize: '0.76rem', color: 'var(--color-ink-muted)' }}>
                        of {line.massT.toLocaleString()} t total line mass
                      </div>
                    )}
                  </div>

                  {/* Approve / Reject Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isApproved ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="badge badge-eligible" style={{ padding: '6px 12px' }}>
                          <CheckCircle2 size={13} /> Approved by {rec.approver?.split(' ')[0]}
                        </span>
                        <button
                          onClick={() => handleRejectClick(rec)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '0.74rem' }}
                        >
                          Revoke
                        </button>
                      </div>
                    ) : isRejected ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="badge badge-notallowed" style={{ padding: '6px 12px' }}>
                          <XCircle size={13} /> Rejected
                        </span>
                        {canApprove && (
                          <button
                            onClick={() => handleApproveClick(rec)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 10px', fontSize: '0.74rem' }}
                          >
                            Re-approve
                          </button>
                        )}
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleRejectClick(rec)}
                          className="btn btn-secondary"
                          style={{ padding: '8px 14px', fontSize: '0.8rem' }}
                        >
                          Reject
                        </button>

                        <button
                          onClick={() => handleApproveClick(rec)}
                          disabled={!canApprove}
                          title={
                            !canApprove
                              ? 'Safety gate prohibits approving MANUAL_REVIEW or NOT_ALLOWED lines'
                              : 'Approve recycled substitution'
                          }
                          className="btn btn-primary"
                          style={{
                            padding: '8px 18px',
                            fontSize: '0.8rem',
                            opacity: !canApprove ? 0.45 : 1,
                            cursor: !canApprove ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <Check size={14} />
                          <span>Approve Substitution</span>
                        </button>
                      </>
                    )}
                  </div>

                  {!canApprove && (
                    <div style={{ fontSize: '0.74rem', color: 'var(--color-status-notallowed)', textAlign: 'right', maxWidth: '210px', lineHeight: 1.35 }}>
                      Safety rule: {rec.status} items cannot be approved into procurement plan.
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Conditional Approval Modal in White Card */}
      <Modal
        isOpen={!!selectedRecForCondition}
        onClose={() => setSelectedRecForCondition(null)}
        title="Conditional Approval Engineering Sign-Off"
        subtitle={`Item ${selectedRecForCondition?.recId} — Reinforced Concrete (IS 383:2016 Clause 4.2.2)`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '0.86rem', color: 'var(--color-navy)', lineHeight: 1.5 }}>
            To approve recycled concrete aggregate (RCA) in reinforced concrete, the approving engineer must verify and acknowledge all statutory engineering safety constraints:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {selectedRecForCondition?.conditions.map((cond, idx) => {
              const isChecked = acknowledgedConditions.includes(cond);
              return (
                <label
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: isChecked ? 'var(--color-sky-light)' : '#FAF7F5',
                    border: isChecked ? '1px solid var(--color-sky)' : '1px solid var(--color-hairline)',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setAcknowledgedConditions([...acknowledgedConditions, cond]);
                      } else {
                        setAcknowledgedConditions(acknowledgedConditions.filter((c) => c !== cond));
                      }
                    }}
                    style={{ marginTop: '3px' }}
                  />
                  <span style={{ fontSize: '0.82rem', color: isChecked ? 'var(--color-navy)' : 'var(--color-ink-secondary)', fontWeight: isChecked ? 600 : 400 }}>
                    {cond}
                  </span>
                </label>
              );
            })}
          </div>

          <div>
            <label className="respec-label">Approving Engineer Name & Title</label>
            <input
              type="text"
              className="respec-input"
              value={approverName}
              onChange={(e) => setApproverName(e.target.value)}
            />
          </div>

          <div>
            <label className="respec-label">Engineering Approval Notes</label>
            <input
              type="text"
              className="respec-input"
              placeholder="e.g. Verified structural drawing S-04; non-prestressed foundation slab only"
              value={approvalNote}
              onChange={(e) => setApprovalNote(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '14px' }}>
            <button
              onClick={() => setSelectedRecForCondition(null)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmConditionalApproval}
              disabled={acknowledgedConditions.length < (selectedRecForCondition?.conditions.length || 0)}
              className="btn btn-primary"
            >
              Confirm Sign-Off & Approve
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
