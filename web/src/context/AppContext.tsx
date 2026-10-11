import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  AppState,
  loadSavedState,
  saveState,
  resetDemoState,
} from '../services/mockStorage';
import {
  LineItem,
  NewProjectFormValues,
} from '../types';
import { api } from '../services/apiClient';

interface AppContextType {
  state: AppState;
  refreshState: () => void;
  resetToDemo: () => void;
  updateJob: (jobData: NewProjectFormValues) => Promise<void>;
  updateLines: (newLines: LineItem[]) => void;
  patchLineField: (lineId: string, field: keyof LineItem, value: any) => Promise<void>;
  confirmBOQ: () => Promise<void>;
  evaluateCurrentBOQ: () => Promise<void>;
  makeDecision: (
    recId: string,
    decision: 'APPROVE' | 'REJECT',
    approver: string,
    note?: string,
    acknowledgedConditions?: string[]
  ) => Promise<void>;
  generatePlanRows: () => Promise<void>;
  placeOrder: (recId: string, poRef: string) => Promise<void>;
  submitDelivery: (deliveryData: {
    recId: string;
    facilityId: string;
    quantityT: number;
    slipNo: string;
    date: string;
    evidenceKey?: string;
    evidenceFilename?: string;
  }) => Promise<{ state: 'VERIFIED' | 'FLAGGED'; flags: string[] }>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => loadSavedState());

  const refreshState = () => {
    setState(loadSavedState());
  };

  const resetToDemo = () => {
    const fresh = resetDemoState();
    setState(fresh);
  };

  const updateJob = async (jobData: NewProjectFormValues) => {
    await api.createJob(jobData);
    refreshState();
  };

  const updateLines = (newLines: LineItem[]) => {
    const current = loadSavedState();
    current.lines = newLines;
    current.currentJob.linesCount = newLines.length;
    current.currentJob.status = 'NEEDS_REVIEW';
    current.currentJob.stage = 'BOQ Loaded — Table Ready for Review';
    saveState(current);
    setState(current);
  };

  const patchLineField = async (lineId: string, field: keyof LineItem, value: any) => {
    await api.patchLines(state.currentJob.jobId, [{ lineId, field, value }]);
    refreshState();
  };

  const confirmBOQ = async () => {
    await api.confirmJob(state.currentJob.jobId);
    refreshState();
  };

  const evaluateCurrentBOQ = async () => {
    await api.evaluateJob(state.currentJob.jobId);
    refreshState();
  };

  const makeDecision = async (
    recId: string,
    decision: 'APPROVE' | 'REJECT',
    approver: string,
    note?: string,
    acknowledgedConditions?: string[]
  ) => {
    await api.recordDecision(state.currentJob.jobId, {
      recId,
      decision,
      approver,
      note,
      acknowledgedConditions,
    });
    refreshState();
  };

  const generatePlanRows = async () => {
    await api.generatePlan(state.currentJob.jobId);
    refreshState();
  };

  const placeOrder = async (recId: string, poRef: string) => {
    await api.setOrder(state.currentJob.jobId, { recId, poRef });
    refreshState();
  };

  const submitDelivery = async (deliveryData: {
    recId: string;
    facilityId: string;
    quantityT: number;
    slipNo: string;
    date: string;
    evidenceKey?: string;
    evidenceFilename?: string;
  }) => {
    const result = await api.recordDelivery(state.currentJob.jobId, deliveryData);
    refreshState();
    return result;
  };

  return (
    <AppContext.Provider
      value={{
        state,
        refreshState,
        resetToDemo,
        updateJob,
        updateLines,
        patchLineField,
        confirmBOQ,
        evaluateCurrentBOQ,
        makeDecision,
        generatePlanRows,
        placeOrder,
        submitDelivery,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppState = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppProvider');
  }
  return context;
};
