import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, ArrowRight, Sparkles, Building2 } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { useAppState } from '../context/AppContext';
import { ProjectType } from '../types';

export const NewProject: React.FC = () => {
  const { state, updateJob } = useAppState();
  const navigate = useNavigate();

  const [projectName, setProjectName] = useState(state.currentJob.projectName);
  const [projectType, setProjectType] = useState<ProjectType>(state.currentJob.projectType);
  const [builtUpArea, setBuiltUpArea] = useState<string>(
    state.currentJob.builtUpAreaM2 ? state.currentJob.builtUpAreaM2.toString() : '34500'
  );
  const [fy, setFy] = useState(state.currentJob.fy || '2026-27');
  const [address, setAddress] = useState(state.currentJob.site.address);
  const [lat, setLat] = useState(state.currentJob.site.lat.toString());
  const [lng, setLng] = useState(state.currentJob.site.lng.toString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Applicability computation
  const areaNumber = parseFloat(builtUpArea) || 0;
  const isMandatory = (projectType === 'road') || (areaNumber >= 20000);

  const presets = [
    {
      name: 'IIT-Delhi NCR North Campus',
      type: 'campus' as ProjectType,
      area: 34500,
      lat: 28.5450,
      lng: 77.1926,
      address: 'IIT Campus North Ring Road, Hauz Khas / Sector 4, New Delhi',
    },
    {
      name: 'Delhi PWD Ring Road Arterial Repair',
      type: 'road' as ProjectType,
      area: 0,
      lat: 28.6219,
      lng: 77.2140,
      address: 'Inner Ring Road Stretch, ITO to Rajghat Corridor, New Delhi',
    },
    {
      name: 'Dwarka Sector 21 Transit Hub',
      type: 'building' as ProjectType,
      area: 42000,
      lat: 28.5583,
      lng: 77.0210,
      address: 'Sector 21 Inter-Modal Transit Hub, Dwarka, New Delhi',
    },
  ];

  const handleApplyPreset = (p: typeof presets[0]) => {
    setProjectName(p.name);
    setProjectType(p.type);
    setBuiltUpArea(p.area > 0 ? p.area.toString() : '');
    setLat(p.lat.toString());
    setLng(p.lng.toString());
    setAddress(p.address);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      setError('Please provide a project name.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      await updateJob({
        projectName: projectName.trim(),
        projectType,
        builtUpAreaM2: areaNumber > 0 ? areaNumber : undefined,
        fy,
        address,
        lat: parseFloat(lat) || 28.6139,
        lng: parseFloat(lng) || 77.2090,
      });

      // Navigate to Next Workflow Page: Upload BOQ
      navigate('/upload');
    } catch (err: any) {
      setError(err.message || 'Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="section-project" className="respec-section animate-fade-in">
      {/* Clean Introductory Hero */}
      <div style={{
        marginBottom: '40px',
        padding: '36px 40px',
        backgroundColor: 'var(--color-white)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--color-hairline)',
        boxShadow: 'var(--shadow-card)',
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 14px',
          borderRadius: 'var(--radius-pill)',
          backgroundColor: 'var(--color-sky-light)',
          color: 'var(--color-navy)',
          fontSize: '0.74rem',
          fontWeight: 700,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          marginBottom: '14px',
        }}>
          <span>C&D Waste Rules 2025 · Bureau of Indian Standards IS 383:2016</span>
        </div>

        <h1 className="text-display" style={{ marginBottom: '14px', maxWidth: '900px' }}>
          Deterministic Compliance for Construction BOQs & Recycled Materials
        </h1>

        <p className="text-subtitle" style={{ maxWidth: '820px', fontSize: '1.05rem', lineHeight: 1.6 }}>
          Review construction Bills of Quantities against current Indian Standards, determine statutory applicability under the 2025 Rules, calculate exact compliance gaps, and track physical delivery evidence.
        </p>
      </div>

      <PageHeader
        stepNumber={1}
        title="Project Registration & Regulatory Scope"
        subtitle="Configure project parameters, site coordinates for Delhi-NCR processing facilities, and evaluate statutory applicability under the C&D Waste Rules 2025."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)', gap: '28px', alignItems: 'start' }}>
        {/* Form Container in Pure White Card */}
        <div className="respec-card" style={{ padding: '32px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {error && (
              <div style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--color-status-notallowed-bg)',
                border: '1px solid var(--color-status-notallowed-border)',
                color: 'var(--color-status-notallowed)',
                fontSize: '0.85rem',
              }}>
                {error}
              </div>
            )}

            <div>
              <label className="respec-label">Project Name *</label>
              <input
                type="text"
                className="respec-input"
                placeholder="e.g. IIT-Delhi North Academic Complex & Ring Road"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label className="respec-label">Project Type *</label>
                <select
                  className="respec-select"
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value as ProjectType)}
                >
                  <option value="building">Commercial / Institutional Building</option>
                  <option value="road">Highway / Roadway Infrastructure</option>
                  <option value="campus">Mixed Institutional Campus</option>
                </select>
              </div>

              <div>
                <label className="respec-label">Financial Year *</label>
                <select
                  className="respec-select"
                  value={fy}
                  onChange={(e) => setFy(e.target.value)}
                >
                  <option value="2026-27">FY 2026-27 (5% Target Year 1)</option>
                  <option value="2027-28">FY 2027-28 (10% Target)</option>
                  <option value="2028-29">FY 2028-29 (15% Target)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label className="respec-label">
                  Built-Up Area (m²) {projectType !== 'road' && '*'}
                </label>
                <input
                  type="number"
                  className="respec-input text-mono"
                  placeholder="e.g. 34500"
                  value={builtUpArea}
                  onChange={(e) => setBuiltUpArea(e.target.value)}
                  disabled={projectType === 'road'}
                />
                <span style={{ fontSize: '0.74rem', color: 'var(--color-ink-secondary)', marginTop: '4px', display: 'block' }}>
                  {projectType === 'road' ? 'Roads are governed under 3rd Schedule' : 'Mandatory compliance threshold: ≥ 20,000 m²'}
                </span>
              </div>

              <div>
                <label className="respec-label">Site Latitude & Longitude *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <input
                    type="text"
                    className="respec-input text-mono"
                    placeholder="Lat (e.g. 28.545)"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                  />
                  <input
                    type="text"
                    className="respec-input text-mono"
                    placeholder="Lng (e.g. 77.192)"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                  />
                </div>
                <span style={{ fontSize: '0.74rem', color: 'var(--color-ink-secondary)', marginTop: '4px', display: 'block' }}>
                  Used for haversine plant distance ranking
                </span>
              </div>
            </div>

            <div>
              <label className="respec-label">Site Address / NCR Location</label>
              <input
                type="text"
                className="respec-input"
                placeholder="e.g. IIT Delhi Hauz Khas Campus, Ring Road"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            {/* Regulatory Applicability Box in Sky Blue & Navy */}
            <div style={{
              padding: '18px 22px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: isMandatory ? 'var(--color-sky-light)' : '#FEF3C7',
              border: `1px solid ${isMandatory ? 'var(--color-sky)' : '#FCD34D'}`,
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
            }}>
              {isMandatory ? (
                <CheckCircle2 size={24} style={{ color: 'var(--color-teal)', flexShrink: 0, marginTop: '2px' }} />
              ) : (
                <AlertTriangle size={24} style={{ color: '#B45309', flexShrink: 0, marginTop: '2px' }} />
              )}
              <div>
                <div style={{
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  color: isMandatory ? 'var(--color-navy)' : '#B45309',
                  marginBottom: '4px',
                }}>
                  {isMandatory
                    ? 'MANDATORY STATUTORY APPLICABILITY (5% MINIMUM TARGET)'
                    : 'NON-MANDATORY UNDER 2025 RULES THRESHOLD'}
                </div>
                <p style={{ fontSize: '0.84rem', color: isMandatory ? 'var(--color-navy)' : '#78350F', lineHeight: 1.5 }}>
                  {isMandatory ? (
                    projectType === 'road'
                      ? 'Road infrastructure projects are classified under the Third Schedule of the C&D Waste Rules 2025, mandating a 5% recycled-material minimum for FY 2026-28.'
                      : `The built-up area of ${areaNumber.toLocaleString()} m² exceeds the 20,000 m² statutory threshold under the Second Schedule. Occupier must submit an approved Waste Utilisation Plan with 5% minimum substitution.`
                  ) : (
                    'Built-up area is under 20,000 m². The statutory 5% target is not legally binding; however, CPWD Guidelines (10–20%) and DPCC Delhi Advisories recommend green recycled substitution.'
                  )}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ padding: '12px 28px', fontSize: '0.95rem' }}
              >
                <span>Save Project & Proceed to Upload BOQ</span>
                <ArrowRight size={17} />
              </button>
            </div>
          </form>
        </div>

        {/* Right Info Card: Demo Presets & Regulatory Rules Overview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Quick Presets in White Cards */}
          <div className="respec-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Sparkles size={17} style={{ color: 'var(--color-teal)' }} />
              <h3 style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--color-navy)' }}>
                Delhi-NCR Project Presets
              </h3>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-ink-secondary)', marginBottom: '16px' }}>
              Load tested real-world capital projects in Delhi-NCR to explore regulatory compliance thresholds:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {presets.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  style={{
                    background: 'var(--color-white)',
                    border: '1px solid var(--color-hairline)',
                    padding: '14px 16px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderRadius: 'var(--radius-md)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-navy)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-hairline)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.88rem', color: 'var(--color-navy)' }}>{p.name}</strong>
                    <span className="badge badge-review" style={{ fontSize: '0.68rem' }}>
                      {p.type}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--color-ink-secondary)', marginTop: '4px' }}>
                    {p.area > 0 ? `${p.area.toLocaleString()} m² · ` : ''}{p.address}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Statutory Standard Card */}
          <div className="respec-card" style={{ padding: '24px', backgroundColor: 'var(--color-sky-light)', borderColor: 'var(--color-sky)' }}>
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '10px' }}>
              Key Statutory Facts (Delhi-NCR)
            </h3>
            <ul style={{ fontSize: '0.82rem', color: 'var(--color-navy)', display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: '18px' }}>
              <li>
                <strong>C&D Waste Rules 2025</strong> took effect <strong>April 1, 2026</strong>. Statutory target binding starting this financial year (FY 2026-27).
              </li>
              <li>
                Delhi generates <strong>6,054 TPD</strong> of C&D waste across 4 authorised plants, yet MCD reported only <strong>14% utilisation</strong> in 2024-25.
              </li>
              <li>
                The bottleneck is demand: engineers hesitate because structural standards cap recycled aggregate.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
