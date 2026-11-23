import { useCallback, useEffect, useState } from 'react';
import type { SimulationMode, ViewMode } from '../tipos';
import {
  captureCanvasScreenshot,
  generateLabEvidenceReport,
  type ExportResult
} from '../utilidades/generadorReportes';

const NOTICE_DURATION_MS = 7000;

/**
 * Screenshot and lab-evidence export actions for the active room, plus a visible,
 * auto-dismissed notice when an export fails.
 */
export function useExportActions(
  mode: SimulationMode,
  viewMode: ViewMode
): {
  notice: string | null;
  dismissNotice: () => void;
  takeScreenshot: () => void;
  generateReport: () => Promise<void>;
} {
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), NOTICE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  const reportResult = useCallback((result: ExportResult) => {
    if (!result.ok) setNotice(result.message);
  }, []);

  const takeScreenshot = useCallback(() => {
    reportResult(captureCanvasScreenshot(mode));
  }, [mode, reportResult]);

  const generateReport = useCallback(async () => {
    reportResult(await generateLabEvidenceReport(mode, viewMode));
  }, [mode, viewMode, reportResult]);

  const dismissNotice = useCallback(() => setNotice(null), []);

  return { notice, dismissNotice, takeScreenshot, generateReport };
}
