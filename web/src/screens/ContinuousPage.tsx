import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { NewProject } from './NewProject';
import { UploadBOQ } from './UploadBOQ';
import { ReviewTable } from './ReviewTable';
import { Recommendations } from './Recommendations';
import { ComplianceGap } from './ComplianceGap';
import { PlanLedger } from './PlanLedger';
import { SECTION_IDS } from '../components/Navigation';

export const ContinuousPage: React.FC = () => {
  const location = useLocation();

  // If a user navigates to a legacy route like /upload or /ledger, smoothly scroll to that section
  useEffect(() => {
    const pathToSectionMap: Record<string, string> = {
      '/': SECTION_IDS.project,
      '/upload': SECTION_IDS.upload,
      '/review': SECTION_IDS.review,
      '/recommendations': SECTION_IDS.recommendations,
      '/compliance-gap': SECTION_IDS.compliance,
      '/ledger': SECTION_IDS.ledger,
    };

    const targetSection = pathToSectionMap[location.pathname];
    if (targetSection && location.pathname !== '/') {
      const el = document.getElementById(targetSection);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [location.pathname]);

  return (
    <div className="respec-container">
      {/* 1. New Project */}
      <NewProject />
      <div className="section-divider" />

      {/* 2. Upload BOQ */}
      <UploadBOQ />
      <div className="section-divider" />

      {/* 3. Review BOQ */}
      <ReviewTable />
      <div className="section-divider" />

      {/* 4. Recommendations */}
      <Recommendations />
      <div className="section-divider" />

      {/* 5. Compliance Gap */}
      <ComplianceGap />
      <div className="section-divider" />

      {/* 6. Plan & Ledger */}
      <PlanLedger />
    </div>
  );
};
