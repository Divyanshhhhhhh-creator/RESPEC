import React, { useState } from 'react';
import {
  BookOpenCheck,
  Download,
  Printer,
  FileCheck2,
  AlertCircle,
  CheckCircle2,
  Truck,
  FileText,
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { useAppState } from '../context/AppContext';
import { Recommendation } from '../types';

export const PlanLedger: React.FC = () => {
  const {
    state,
    generatePlanRows,
    placeOrder,
    submitDelivery,
  } = useAppState();

  const [activeTab, setActiveTab] = useState<'plan' | 'deliveries'>('plan');
  const [selectedRecForOrder, setSelectedRecForOrder] = useState<Recommendation | null>(null);
  const [poRefInput, setPoRefInput] = useState('');

  // Delivery Form State
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [deliveryRecId, setDeliveryRecId] = useState<string>('');
  const [deliveryFacilityId, setDeliveryFacilityId] = useState<string>('FAC-BURARI');
  const [deliveryQty, setDeliveryQty] = useState<string>('');
  const [slipNo, setSlipNo] = useState<string>('');
  const [deliveryDate, setDeliveryDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [evidenceFileName, setEvidenceFileName] = useState<string>('');
  const [evidenceKey, setEvidenceKey] = useState<string>('');
  const [deliveryFeedback, setDeliveryFeedback] = useState<{ state: string; flags: string[] } | null>(null);

  const impact = state.impact;
  const approvedRecs = state.recommendations.filter((r) => r.decision === 'APPROVE');

  // Generate plan
  const handleGeneratePlan = async () => {
    await generatePlanRows();
  };

  // Submit PO
  const handleSaveOrder = async () => {
    if (!selectedRecForOrder || !poRefInput.trim()) return;
    await placeOrder(selectedRecForOrder.recId, poRefInput.trim());
    setSelectedRecForOrder(null);
    setPoRefInput('');
  };

  // Submit Delivery Event
  const handleSubmitDeliveryForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryRecId) {
      alert('Please select an approved BOQ material line.');
      return;
    }

    const qty = parseFloat(deliveryQty) || 0;
    if (qty <= 0) {
      alert('Please enter a valid delivered quantity in tonnes.');
      return;
    }

    if (!slipNo.trim()) {
      alert('Please enter the weighbridge slip or gate pass number.');
      return;
    }

    const result = await submitDelivery({
      recId: deliveryRecId,
      facilityId: deliveryFacilityId,
      quantityT: qty,
      slipNo: slipNo.trim(),
      date: deliveryDate,
      evidenceKey: evidenceKey || undefined,
      evidenceFilename: evidenceFileName || undefined,
    });

    setDeliveryFeedback(result);
    // Reset form fields
    setDeliveryQty('');
    setSlipNo('');
    setEvidenceFileName('');
    setEvidenceKey('');
    setTimeout(() => {
      setIsDeliveryModalOpen(false);
      setDeliveryFeedback(null);
    }, 1500);
  };

  // Attach mock synthetic weighbridge evidence
  const handleAttachSyntheticEvidence = () => {
    const mockSlip = `WB-DELHI-${Math.floor(1000 + Math.random() * 9000)}`;
    setSlipNo(mockSlip);
    setEvidenceFileName(`Weighbridge_Slip_${mockSlip}.pdf`);
    setEvidenceKey(`evidence/${mockSlip.toLowerCase()}.pdf`);
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'Item No',
      'Original Description',
      'Unit',
      'Allowed Recycled Product',
      'Max Share %',
      'Planned Mass (t)',
      'Recommended Facility',
      'Distance (km)',
      'Statutory Clause',
      'Approval Status',
      'Approver',
      'PO Reference',
      'Ledger State',
    ];

    const rows = state.planRows.map((p) => [
      `"${p.itemNo}"`,
      `"${p.description.replace(/"/g, '""')}"`,
      `"${p.unit}"`,
      `"${p.allowedProduct}"`,
      p.maxSharePct,
      p.plannedRecycledT,
      `"${p.recommendedFacility}"`,
      p.distanceKm,
      `"${p.sourceClause}"`,
      p.decision,
      `"${p.approver}"`,
      `"${p.poRef || ''}"`,
      p.ledgerState,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      '# DRAFT WASTE UTILISATION PLAN — C&D WASTE RULES 2025\n' +
      `# Project: ${state.currentJob.projectName}\n` +
      `# Date: ${new Date().toISOString().split('T')[0]}\n\n` +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ReSpec_Draft_Plan_${state.currentJob.jobId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Printable PDF trigger
  const handlePrintPlan = () => {
    window.print();
  };

  return (
    <div id="section-ledger" className="respec-section animate-fade-in">
      {/* Printable Watermark and Header for Window.print() */}
      <div className="print-draft-watermark">DRAFT</div>
      <div className="print-header">
        <h1>DRAFT WASTE UTILISATION PLAN — C&D WASTE RULES 2025</h1>
        <p>
          Project: <strong>{state.currentJob.projectName}</strong> | Built-Up Area:{' '}
          {state.currentJob.builtUpAreaM2?.toLocaleString()} m² | FY: {state.currentJob.fy}
        </p>
        <p>Prepared by ReSpec Platform | Internal Draft for Regulatory Review — Not a statutory CPCB filing</p>
      </div>

      <PageHeader
        stepNumber={6}
        title="Draft Procurement Plan & Delivery Ledger"
        subtitle="Manage approved recycled substitutions, record purchase orders, and verify weighbridge delivery evidence. The 4-state ledger guarantees planned quantities are never counted as verified diversion."
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} className="no-print">
            <button
              onClick={handleExportCSV}
              disabled={state.planRows.length === 0}
              className="btn btn-secondary"
              title="Download Plan as CSV spreadsheet"
            >
              <Download size={15} />
              <span>Export Plan (CSV)</span>
            </button>
            <button
              onClick={handlePrintPlan}
              disabled={state.planRows.length === 0}
              className="btn btn-primary"
              title="Printable Waste Utilisation Plan with DRAFT watermark"
            >
              <Printer size={15} />
              <span>Print Plan (PDF)</span>
            </button>
          </div>
        }
      />

      {/* Four-State Ledger Totals Grid in White Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div className="respec-card" style={{ padding: '22px', borderTop: '4px solid var(--color-forest)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-label" style={{ fontSize: '0.72rem' }}>State 1: Eligible</span>
            <span className="badge badge-eligible" style={{ fontSize: '0.66rem' }}>Standards Allowed</span>
          </div>
          <div className="text-mono" style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--color-forest)', margin: '8px 0 2px' }}>
            {impact.eligibleT.toLocaleString()} t
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--color-ink-muted)' }}>
            Permitted by IS 383:2016
          </div>
        </div>

        <div className="respec-card" style={{ padding: '22px', borderTop: '4px solid var(--color-sand-dark)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-label" style={{ fontSize: '0.72rem' }}>State 2: Planned</span>
            <span className="badge badge-review" style={{ fontSize: '0.66rem' }}>
              Plan Generated
            </span>
          </div>
          <div className="text-mono" style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--color-forest)', margin: '8px 0 2px' }}>
            {impact.plannedT.toLocaleString()} t
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--color-ink-muted)' }}>
            Approved by Engineer in Plan
          </div>
        </div>

        <div className="respec-card" style={{ padding: '22px', borderTop: '4px solid var(--color-terracotta)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-label" style={{ fontSize: '0.72rem' }}>State 3: Ordered</span>
            <span className="badge" style={{ backgroundColor: 'var(--color-terracotta-light)', color: 'var(--color-terracotta)', border: '1px solid var(--color-terracotta-border)', fontSize: '0.66rem' }}>
              PO Released
            </span>
          </div>
          <div className="text-mono" style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--color-forest)', margin: '8px 0 2px' }}>
            {impact.orderedT.toLocaleString()} t
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--color-ink-muted)' }}>
            Committed in Purchase Orders
          </div>
        </div>

        <div className="respec-card" style={{ padding: '22px', borderTop: '4px solid var(--color-forest-dark)', backgroundColor: 'var(--color-sand-light)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-label" style={{ fontSize: '0.72rem', color: 'var(--color-forest)' }}>
              State 4: Verified
            </span>
            <span className="badge badge-eligible" style={{ fontSize: '0.66rem' }}>Evidence Gated</span>
          </div>
          <div className="text-mono" style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--color-forest)', margin: '8px 0 2px' }}>
            {impact.verifiedT.toLocaleString()} t
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--color-forest)' }}>
            Backed by Weighbridge Slips
          </div>
        </div>
      </div>

      {/* Tabs / Sub-Sections */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }} className="no-print">
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('plan')}
            style={{
              padding: '10px 20px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '0.84rem',
              fontWeight: 650,
              cursor: 'pointer',
              border: activeTab === 'plan' ? '1px solid var(--color-forest)' : '1px solid var(--color-sand-border)',
              backgroundColor: activeTab === 'plan' ? 'var(--color-forest)' : 'var(--color-white)',
              color: activeTab === 'plan' ? 'var(--color-white)' : 'var(--color-forest)',
              boxShadow: activeTab === 'plan' ? 'var(--shadow-subtle)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Draft Procurement Plan ({state.planRows.length} lines)
          </button>

          <button
            onClick={() => setActiveTab('deliveries')}
            style={{
              padding: '10px 20px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '0.84rem',
              fontWeight: 650,
              cursor: 'pointer',
              border: activeTab === 'deliveries' ? '1px solid var(--color-forest)' : '1px solid var(--color-sand-border)',
              backgroundColor: activeTab === 'deliveries' ? 'var(--color-forest)' : 'var(--color-white)',
              color: activeTab === 'deliveries' ? 'var(--color-white)' : 'var(--color-forest)',
              boxShadow: activeTab === 'deliveries' ? 'var(--shadow-subtle)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Delivery Evidence Trail ({state.deliveries.length} entries)
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {state.planRows.length === 0 && (
            <button onClick={handleGeneratePlan} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>
              <BookOpenCheck size={14} /> Generate Draft Plan from Approved Lines
            </button>
          )}

          <button
            onClick={() => {
              setIsDeliveryModalOpen(true);
              if (approvedRecs.length > 0) {
                setDeliveryRecId(approvedRecs[0].recId);
              }
            }}
            className="btn btn-primary"
            style={{ padding: '8px 18px', fontSize: '0.82rem' }}
          >
            <Truck size={14} /> Record Delivery & Upload Evidence
          </button>
        </div>
      </div>

      {/* Plan Tab View in Pure White Card */}
      {activeTab === 'plan' && (
        <div className="respec-card" style={{ padding: '26px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '1.08rem', fontWeight: 700, color: 'var(--color-navy)' }}>
                Draft Waste Utilisation Procurement Plan
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--color-ink-secondary)' }}>
                Certified specification schedule for precast and ready-mix supplier purchase orders
              </p>
            </div>
            <span className="badge badge-synthetic">
              [S] Internal Engineering Draft
            </span>
          </div>

          {state.planRows.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-ink-muted)' }}>
              <p style={{ marginBottom: '16px', fontSize: '0.92rem' }}>
                No plan has been generated yet. Approve eligible items on Section 4, then click &quot;Generate Draft Plan&quot;.
              </p>
              <button onClick={handleGeneratePlan} className="btn btn-primary">
                Generate Draft Plan from Approved Lines
              </button>
            </div>
          ) : (
            <div className="respec-table-wrapper">
              <table className="respec-table">
                <thead>
                  <tr>
                    <th style={{ width: '70px' }}>Item #</th>
                    <th>Specification & Proposed Product</th>
                    <th style={{ width: '90px' }}>Max Share</th>
                    <th style={{ width: '110px', textAlign: 'right' }}>Planned (t)</th>
                    <th>Recommended Plant</th>
                    <th>Source Standard Clause</th>
                    <th>PO Reference</th>
                    <th style={{ width: '90px' }}>Ledger State</th>
                    <th className="no-print" style={{ width: '100px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {state.planRows.map((row) => (
                    <tr key={row.recId}>
                      <td className="text-mono" style={{ fontWeight: 650 }}>
                        {row.itemNo}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--color-navy)', marginBottom: '2px' }}>
                          {row.allowedProduct}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--color-ink-secondary)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {row.description}
                        </div>
                      </td>
                      <td className="text-mono">{row.maxSharePct}%</td>
                      <td className="text-mono" style={{ textAlign: 'right', fontWeight: 750, color: 'var(--color-navy)' }}>
                        {row.plannedRecycledT.toLocaleString()} t
                      </td>
                      <td>
                        <div style={{ fontSize: '0.84rem', color: 'var(--color-navy)', fontWeight: 600 }}>{row.recommendedFacility}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-ink-muted)' }}>
                          {row.distanceKm} km straight-line [E]
                        </div>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--color-teal)' }}>
                        {row.sourceClause}
                      </td>
                      <td>
                        {row.poRef ? (
                          <span className="badge" style={{ backgroundColor: 'rgba(86, 124, 141, 0.15)', color: 'var(--color-teal)', fontFamily: 'var(--font-mono)' }}>
                            {row.poRef}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.74rem', color: 'var(--color-ink-muted)' }}>Pending PO</span>
                        )}
                      </td>
                      <td>
                        <StatusBadge status={row.ledgerState} showIcon={false} />
                      </td>
                      <td className="no-print" style={{ textAlign: 'center' }}>
                        {!row.poRef && (
                          <button
                            onClick={() => {
                              const rec = state.recommendations.find((r) => r.recId === row.recId);
                              if (rec) setSelectedRecForOrder(rec);
                            }}
                            className="btn btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '0.74rem' }}
                          >
                            Enter PO #
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Deliveries Tab View in Pure White Card */}
      {activeTab === 'deliveries' && (
        <div className="respec-card" style={{ padding: '26px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '1.08rem', fontWeight: 700, color: 'var(--color-navy)' }}>
                Delivery Verification & Weighbridge Slip Audit Trail
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--color-ink-secondary)' }}>
                Immutable delivery ledger. Only entries with attached evidence and verified quantities count toward verified diversion.
              </p>
            </div>
            <button
              onClick={() => {
                setIsDeliveryModalOpen(true);
                if (approvedRecs.length > 0) setDeliveryRecId(approvedRecs[0].recId);
              }}
              className="btn btn-primary"
              style={{ padding: '8px 16px', fontSize: '0.82rem' }}
            >
              <Truck size={14} /> Record New Delivery
            </button>
          </div>

          <div className="respec-table-wrapper">
            <table className="respec-table">
              <thead>
                <tr>
                  <th style={{ width: '90px' }}>Delivery ID</th>
                  <th>Material / Item No</th>
                  <th>Dispatch Plant</th>
                  <th style={{ width: '100px', textAlign: 'right' }}>Quantity (t)</th>
                  <th>Slip / Gate Pass #</th>
                  <th>Date</th>
                  <th>Attached Evidence</th>
                  <th style={{ width: '110px' }}>Ledger Status</th>
                </tr>
              </thead>
              <tbody>
                {state.deliveries.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-ink-muted)' }}>
                      No material deliveries recorded yet.
                    </td>
                  </tr>
                ) : (
                  state.deliveries.map((deliv) => {
                    const isFlagged = deliv.state === 'FLAGGED';
                    return (
                      <tr key={deliv.deliveryId}>
                        <td className="text-mono" style={{ fontSize: '0.78rem' }}>
                          {deliv.deliveryId}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--color-navy)' }}>{deliv.description}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--color-ink-muted)' }}>
                            Item #{deliv.itemNo}
                          </div>
                        </td>
                        <td>{deliv.facilityName}</td>
                        <td className="text-mono" style={{ textAlign: 'right', fontWeight: 750, color: isFlagged ? 'var(--color-status-notallowed)' : 'var(--color-navy)' }}>
                          {deliv.quantityT.toLocaleString()} t
                        </td>
                        <td className="text-mono">{deliv.slipNo}</td>
                        <td className="text-mono" style={{ fontSize: '0.78rem' }}>{deliv.date}</td>
                        <td>
                          {deliv.evidenceFilename ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-teal)', fontSize: '0.8rem', fontWeight: 600 }}>
                              <FileText size={13} /> {deliv.evidenceFilename}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--color-status-notallowed)', fontSize: '0.76rem' }}>
                              Missing Evidence
                            </span>
                          )}
                        </td>
                        <td>
                          {isFlagged ? (
                            <span className="badge badge-notallowed">
                              <AlertCircle size={12} /> FLAGGED
                            </span>
                          ) : (
                            <span className="badge badge-eligible">
                              <CheckCircle2 size={12} /> VERIFIED
                            </span>
                          )}
                          {deliv.flags.length > 0 && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--color-status-notallowed)', marginTop: '2px' }}>
                              {deliv.flags.join(', ')}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PO Reference Modal */}
      <Modal
        isOpen={!!selectedRecForOrder}
        onClose={() => setSelectedRecForOrder(null)}
        title="Enter Purchase Order (PO) Reference"
        subtitle={`Commit recommendation ${selectedRecForOrder?.recId} to ordered ledger state.`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="respec-label">Purchase Order Number *</label>
            <input
              type="text"
              className="respec-input text-mono"
              placeholder="e.g. PO/2026/IITD/082"
              value={poRefInput}
              onChange={(e) => setPoRefInput(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button onClick={() => setSelectedRecForOrder(null)} className="btn btn-secondary">
              Cancel
            </button>
            <button onClick={handleSaveOrder} disabled={!poRefInput.trim()} className="btn btn-primary">
              Commit to ORDERED State
            </button>
          </div>
        </div>
      </Modal>

      {/* Record Delivery & Evidence Modal */}
      <Modal
        isOpen={isDeliveryModalOpen}
        onClose={() => setIsDeliveryModalOpen(false)}
        title="Record Material Delivery & Attach Weighbridge Evidence"
        subtitle="Verification Gate: Only evidenced deliveries with valid weighbridge slips move to VERIFIED status."
      >
        <form onSubmit={handleSubmitDeliveryForm} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {deliveryFeedback && (
            <div style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: deliveryFeedback.state === 'VERIFIED' ? 'var(--color-status-eligible-bg)' : 'var(--color-status-notallowed-bg)',
              color: deliveryFeedback.state === 'VERIFIED' ? 'var(--color-status-eligible)' : 'var(--color-status-notallowed)',
              fontSize: '0.86rem',
            }}>
              Delivery recorded as <strong>{deliveryFeedback.state}</strong>. {deliveryFeedback.flags.join(', ')}
            </div>
          )}

          <div>
            <label className="respec-label">Approved Material Line *</label>
            <select
              className="respec-select"
              value={deliveryRecId}
              onChange={(e) => setDeliveryRecId(e.target.value)}
              required
            >
              {approvedRecs.length === 0 ? (
                <option value="">No approved recommendations found</option>
              ) : (
                approvedRecs.map((r) => {
                  const line = state.lines.find((l) => l.lineId === r.lineId);
                  return (
                    <option key={r.recId} value={r.recId}>
                      Item {line?.itemNo}: {r.product} (Planned: {r.modelledMassT} t)
                    </option>
                  );
                })
              )}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label className="respec-label">Delivered Quantity (Tonnes) *</label>
              <input
                type="number"
                step="0.1"
                className="respec-input text-mono"
                placeholder="e.g. 45.0"
                value={deliveryQty}
                onChange={(e) => setDeliveryQty(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="respec-label">Delivery Date *</label>
              <input
                type="date"
                className="respec-input"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="respec-label">Dispatching Facility *</label>
            <select
              className="respec-select"
              value={deliveryFacilityId}
              onChange={(e) => setDeliveryFacilityId(e.target.value)}
            >
              <option value="FAC-BURARI">Burari C&D Processing Facility (MCD / IEISL)</option>
              <option value="FAC-SHASTRI-PARK">Shastri Park C&D Facility (MCD / IL&FS)</option>
              <option value="FAC-RANIKHERA">Ranikhera (Mundka) C&D Facility</option>
              <option value="FAC-BAKKARWALA">Bakkarwala C&D Plant (DMRC / MCD)</option>
            </select>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="respec-label" style={{ marginBottom: 0 }}>
                Weighbridge Slip / Invoice # *
              </label>
              <button
                type="button"
                onClick={handleAttachSyntheticEvidence}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-teal)',
                  fontWeight: 650,
                  fontSize: '0.74rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Auto-generate Sample Weighbridge Evidence [S]
              </button>
            </div>
            <input
              type="text"
              className="respec-input text-mono"
              placeholder="e.g. WB-BUR-2026-9912"
              value={slipNo}
              onChange={(e) => setSlipNo(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="respec-label">Weighbridge Evidence File (PDF / Image) *</label>
            <div style={{
              padding: '16px',
              borderRadius: 'var(--radius-sm)',
              border: '1px dashed var(--color-hairline-strong)',
              backgroundColor: '#FAF7F5',
              textAlign: 'center',
            }}>
              {evidenceFileName ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--color-navy)', fontSize: '0.86rem', fontWeight: 600 }}>
                  <FileCheck2 size={16} style={{ color: 'var(--color-teal)' }} />
                  <span>{evidenceFileName} attached</span>
                </div>
              ) : (
                <div style={{ fontSize: '0.82rem', color: 'var(--color-ink-secondary)' }}>
                  Drag & drop weighbridge slip PDF or click &quot;Auto-generate Sample Evidence&quot; above
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '14px' }}>
            <button
              type="button"
              onClick={() => setIsDeliveryModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Verify & Record Delivery
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
