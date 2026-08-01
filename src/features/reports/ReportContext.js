import { createContext, useContext } from 'react';

// Shares the active period + derived analytics across all report pages.
export const ReportContext = createContext(null);

export const useReportContext = () => useContext(ReportContext);
