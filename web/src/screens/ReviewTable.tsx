import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  AlertTriangle,
  Edit2,
  ArrowRight,
  ShieldCheck,
  ArrowUpDown,
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { Modal } from '../components/Modal';
import { useAppState } from '../context/AppContext';
import { LineItem } from '../types';

export const ReviewTable: React.FC = () => {
  const { state, patchLineField, confirmBOQ, evaluateCurrentBOQ } = useAppState();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterFlag, setFilterFlag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'itemNo' | 'qty' | 'confidence'>('itemNo');
  const [sortAsc, setSortAsc] = useState(true);

  // Editing state for modal
  const [editingLine, setEditingLine] = useState<LineItem | null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [editUnit, setEditUnit] = useState('m3');
  const [editQty, setEditQty] = useState('');
  const [editGrade, setEditGrade] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  const lowConfidenceCount = useMemo(() => {
    return state.lines.filter((l) => l.flags.includes('LOW_CONFIDENCE') || l.confidence < 0.85).length;
  }, [state.lines]);

  const filteredLines = useMemo(() => {
    return state.lines
      .filter((line) => {
        const matchesQuery =
          line.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          line.itemNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (line.category && line.category.toLowerCase().includes(searchQuery.toLowerCase()));

        if (!matchesQuery) return false;

        if (filterFlag === 'low_confidence') {
          return line.flags.includes('LOW_CONFIDENCE') || line.confidence < 0.85;
        }
        if (filterFlag === 'structural') {
          return line.flags.includes('STRUCTURAL_RCC') || line.flags.includes('PRESTRESSED');
        }
        if (filterFlag === 'outliers') {
          return line.flags.includes('OUTLIER_QTY');
        }
        if (filterFlag === 'excluded') {
          return line.excludedFromDenominator;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'itemNo') {
          return sortAsc
            ? a.itemNo.localeCompare(b.itemNo, undefined, { numeric: true })
            : b.itemNo.localeCompare(a.itemNo, undefined, { numeric: true });
        }
        if (sortBy === 'qty') {
          return sortAsc ? a.qty - b.qty : b.qty - a.qty;
        }
        if (sortBy === 'confidence') {
          return sortAsc ? a.confidence - b.confidence : b.confidence - a.confidence;
        }
        return 0;
      });
  }, [state.lines, searchQuery, filterFlag, sortBy, sortAsc]);

  const handleOpenEdit = (line: LineItem) => {
    setEditingLine(line);
    setEditDesc(line.description);
    setEditUnit(line.unit);
    setEditQty(line.qty.toString());
    setEditGrade(line.gradeParsed || '');
  };

  const handleSaveEdit = async () => {
    if (!editingLine) return;
    const qtyNum = parseFloat(editQty) || editingLine.qty;

    await patchLineField(editingLine.lineId, 'description', editDesc);
    await patchLineField(editingLine.lineId, 'unit', editUnit);
    await patchLineField(editingLine.lineId, 'qty', qtyNum);
    if (editGrade) {
      await patchLineField(editingLine.lineId, 'gradeParsed', editGrade);
    }
    // Boost confidence once engineer manually confirms edit
    await patchLineField(editingLine.lineId, 'confidence', 1.0);

    setEditingLine(null);
  };

  const handleConfirmAndProceed = async () => {
    setIsConfirming(true);
    try {
      await confirmBOQ();
      await evaluateCurrentBOQ();
      // Navigate to Next Workflow Page: Recommendations
      navigate('/recommendations');
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div id="section-review" className="respec-section animate-fade-in">
      <PageHeader
        stepNumber={3}
        title="BOQ Tabular Review & Cell Validation"
        subtitle="Review extracted quantities, parsed concrete grades, and confidence scores. Edits persist automatically. Safety protocol mandates engineering confirmation before statutory rule evaluation."
        action={
          <button
            onClick={handleConfirmAndProceed}
            disabled={isConfirming || state.lines.length === 0}
            className="btn btn-primary"
            style={{ padding: '11px 24px', fontSize: '0.92rem' }}
          >
            <ShieldCheck size={18} />
            <span>Confirm Table & Evaluate Rules</span>
            <ArrowRight size={16} />
          </button>
        }
      />

      {/* Alert banner if low confidence cells exist */}
      {lowConfidenceCount > 0 && (
        <div style={{
          padding: '16px 20px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: '#FEF3C7',
          border: '1px solid #FCD34D',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={22} style={{ color: '#B45309', flexShrink: 0 }} />
            <div>
              <strong style={{ color: '#78350F', fontSize: '0.9rem' }}>
                {lowConfidenceCount} cell(s) flagged with low OCR extraction confidence (&lt;85%)
              </strong>
              <div style={{ fontSize: '0.8rem', color: '#92400E', marginTop: '2px' }}>
                Review highlighted cells and click &quot;Edit&quot; to verify quantities or descriptions before evaluation.
              </div>
            </div>
          </div>
          <button
            onClick={() => setFilterFlag('low_confidence')}
            className="btn btn-secondary"
            style={{ padding: '6px 14px', fontSize: '0.8rem' }}
          >
            Filter Flagged Cells
          </button>
        </div>
      )}

      {/* Filters and Controls Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        marginBottom: '16px',
        flexWrap: 'wrap',
      }}>
        {/* Search */}
        <div style={{ position: 'relative', minWidth: '280px', flex: '1 1 300px' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '13px', color: 'var(--color-ink-muted)' }} />
          <input
            type="text"
            className="respec-input"
            placeholder="Search items, descriptions, or grades..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '40px' }}
          />
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: `All Items (${state.lines.length})` },
            { id: 'low_confidence', label: `Low Confidence (${lowConfidenceCount})` },
            { id: 'structural', label: 'Structural Concrete' },
            { id: 'excluded', label: 'Excluded Metal/Wood' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setFilterFlag(pill.id)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.8rem',
                fontWeight: 650,
                cursor: 'pointer',
                border: filterFlag === pill.id ? '1px solid var(--color-navy)' : '1px solid var(--color-hairline)',
                backgroundColor: filterFlag === pill.id ? 'var(--color-navy)' : 'var(--color-white)',
                color: filterFlag === pill.id ? 'var(--color-white)' : 'var(--color-navy)',
                transition: 'all 0.15s ease',
              }}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container in Pure White Card */}
      <div className="respec-table-wrapper" style={{ boxShadow: 'var(--shadow-card)' }}>
        <table className="respec-table">
          <thead>
            <tr>
              <th
                style={{ width: '90px', cursor: 'pointer' }}
                onClick={() => {
                  if (sortBy === 'itemNo') setSortAsc(!sortAsc);
                  else { setSortBy('itemNo'); setSortAsc(true); }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Item #</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th>Description & Classified Category</th>
              <th style={{ width: '80px' }}>Unit</th>
              <th
                style={{ width: '110px', textAlign: 'right', cursor: 'pointer' }}
                onClick={() => {
                  if (sortBy === 'qty') setSortAsc(!sortAsc);
                  else { setSortBy('qty'); setSortAsc(false); }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                  <span>Quantity</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th style={{ width: '110px' }}>Parsed Grade</th>
              <th style={{ width: '130px', textAlign: 'right' }}>Modelled Mass</th>
              <th
                style={{ width: '120px', cursor: 'pointer' }}
                onClick={() => {
                  if (sortBy === 'confidence') setSortAsc(!sortAsc);
                  else { setSortBy('confidence'); setSortAsc(true); }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Confidence</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th style={{ width: '100px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLines.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-ink-muted)' }}>
                  No items match the current search query or filter.
                </td>
              </tr>
            ) : (
              filteredLines.map((line) => {
                const isLowConf = line.confidence < 0.85 || line.flags.includes('LOW_CONFIDENCE');
                const hasStructuralLimit = line.flags.includes('STRUCTURAL_LIMIT');
                const isPrestressedFlag = line.flags.includes('PRESTRESSED');

                return (
                  <tr
                    key={line.lineId}
                    className={isLowConf ? 'row-low-confidence' : ''}
                  >
                    <td className="text-mono" style={{ fontWeight: 650 }}>
                      {line.itemNo}
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-navy)', marginBottom: '4px' }}>
                        {line.description}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span className="badge" style={{ backgroundColor: 'var(--color-beige)', color: 'var(--color-teal)', fontSize: '0.7rem' }}>
                          Category: {line.category || 'ineligible/manual review'}
                        </span>
                        {isPrestressedFlag && (
                          <span className="badge badge-notallowed" style={{ fontSize: '0.68rem' }}>
                            Prestressed Concrete (Prohibited)
                          </span>
                        )}
                        {hasStructuralLimit && (
                          <span className="badge badge-notallowed" style={{ fontSize: '0.68rem' }}>
                            Grade &gt; M25 (IS 383 Limit)
                          </span>
                        )}
                        {line.excludedFromDenominator && (
                          <span className="badge" style={{ backgroundColor: 'var(--color-sky-light)', color: 'var(--color-navy)', fontSize: '0.68rem' }}>
                            Excluded from Denominator [A]
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="text-mono">{line.unit}</td>

                    <td className="text-mono" style={{ textAlign: 'right', fontWeight: 700 }}>
                      {line.qty.toLocaleString()}
                    </td>

                    <td>
                      {line.gradeParsed ? (
                        <span className="badge badge-review" style={{ fontFamily: 'var(--font-mono)' }}>
                          {line.gradeParsed}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-ink-muted)', fontSize: '0.78rem' }}>—</span>
                      )}
                    </td>

                    <td className="text-mono" style={{ textAlign: 'right' }}>
                      {line.massT !== undefined ? (
                        <span style={{ fontWeight: 700, color: 'var(--color-navy)' }}>
                          {line.massT.toLocaleString()} t
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-ink-muted)', fontSize: '0.78rem' }}>Excluded</span>
                      )}
                    </td>

                    <td className={isLowConf ? 'cell-low-confidence' : ''}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{
                          width: '40px',
                          height: '5px',
                          borderRadius: '3px',
                          backgroundColor: 'var(--color-beige)',
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            width: `${Math.round(line.confidence * 100)}%`,
                            height: '100%',
                            backgroundColor: isLowConf ? '#B45309' : 'var(--color-teal)',
                          }} />
                        </div>
                        <span className="text-mono" style={{ fontSize: '0.76rem', color: isLowConf ? '#B45309' : 'var(--color-ink-secondary)', fontWeight: 650 }}>
                          {Math.round(line.confidence * 100)}%
                        </span>
                      </div>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => handleOpenEdit(line)}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.76rem', gap: '4px' }}
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Line Modal in Clean White Dialog */}
      <Modal
        isOpen={!!editingLine}
        onClose={() => setEditingLine(null)}
        title={`Edit BOQ Item ${editingLine?.itemNo}`}
        subtitle="Update cell content to resolve OCR ambiguities or engineer overrides. Edits persist to application state."
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="respec-label">Item Description</label>
            <textarea
              className="respec-textarea"
              rows={3}
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label className="respec-label">Canonical Unit</label>
              <select
                className="respec-select"
                value={editUnit}
                onChange={(e) => setEditUnit(e.target.value)}
              >
                <option value="m3">m³ (Cubic Meter)</option>
                <option value="m2">m² (Square Meter)</option>
                <option value="m">m (Running Meter)</option>
                <option value="nos">nos (Numbers)</option>
                <option value="t">t (Metric Tonne)</option>
                <option value="kg">kg (Kilogram)</option>
              </select>
            </div>

            <div>
              <label className="respec-label">Quantity</label>
              <input
                type="number"
                className="respec-input text-mono"
                value={editQty}
                onChange={(e) => setEditQty(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="respec-label">Concrete Strength Grade (e.g. M15, M20, M25, M35)</label>
            <input
              type="text"
              className="respec-input text-mono"
              placeholder="e.g. M20"
              value={editGrade}
              onChange={(e) => setEditGrade(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '14px' }}>
            <button
              onClick={() => setEditingLine(null)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="btn btn-primary"
            >
              Save Line & Verify
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
