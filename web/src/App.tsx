import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Navigation } from './components/Navigation';
import { LandingPage } from './screens/LandingPage';
import { NewProject } from './screens/NewProject';
import { UploadBOQ } from './screens/UploadBOQ';
import { ReviewTable } from './screens/ReviewTable';
import { Recommendations } from './screens/Recommendations';
import { ComplianceGap } from './screens/ComplianceGap';
import { PlanLedger } from './screens/PlanLedger';

const AppContent: React.FC = () => {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  return (
    <div className="respec-layout">
      {/* Top Application Navigation (Hidden on Landing Page) */}
      <Navigation />

      <main className={isLandingPage ? 'respec-main-landing' : 'respec-main-app'}>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Six Separate Application Workflow Pages */}
          <Route
            path="/project"
            element={
              <div className="respec-container">
                <NewProject />
              </div>
            }
          />
          <Route
            path="/upload"
            element={
              <div className="respec-container">
                <UploadBOQ />
              </div>
            }
          />
          <Route
            path="/review"
            element={
              <div className="respec-container">
                <ReviewTable />
              </div>
            }
          />
          <Route
            path="/recommendations"
            element={
              <div className="respec-container">
                <Recommendations />
              </div>
            }
          />
          <Route
            path="/compliance-gap"
            element={
              <div className="respec-container">
                <ComplianceGap />
              </div>
            }
          />
          <Route
            path="/ledger"
            element={
              <div className="respec-container">
                <PlanLedger />
              </div>
            }
          />

          {/* Legacy route fallbacks */}
          <Route path="/plan" element={<Navigate to="/ledger" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;
