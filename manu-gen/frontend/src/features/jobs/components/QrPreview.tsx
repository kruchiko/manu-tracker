import { useCallback, useEffect, useRef } from "react";
import { useQrCode } from "../hooks/useQrCode";
import type { Job } from "../jobs.types";
import styles from "./QrPreview.module.css";

interface QrPreviewProps {
  job: Job;
  /** Horizontal layout for job detail sidebar (prototype QR card). */
  variant?: "default" | "inline";
  /** Fires once when the preview is ready to print (QR image decoded, or error / empty settled). */
  onReady?: () => void;
}

export function QrPreview({ job, variant = "default", onReady }: QrPreviewProps) {
  const { data: qrData, isLoading, error } = useQrCode(job.id);
  const readySent = useRef(false);
  const onReadyRef = useRef(onReady);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  const fireReady = useCallback(() => {
    if (readySent.current) return;
    readySent.current = true;
    onReadyRef.current?.();
  }, []);

  useEffect(() => {
    readySent.current = false;
  }, [job.id]);

  useEffect(() => {
    if (isLoading) return;
    if (error || !qrData) {
      fireReady();
    }
  }, [isLoading, error, qrData, fireReady]);

  if (isLoading) {
    return (
      <div className={styles.center}>Loading QR code…</div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        Failed to load QR code: {error.message}
      </div>
    );
  }

  if (!qrData) {
    return null;
  }

  const isInline = variant === "inline";
  const rootClass = isInline ? styles.inlineRoot : styles.root;
  const qrClass = isInline ? styles.inlineQr : styles.qr;
  const trayClass = isInline ? styles.inlineTrayCode : styles.trayCode;
  const jobNoClass = isInline ? styles.inlineJobNumber : styles.jobNumber;
  const printExtra = isInline ? styles.inlinePrintBtn : "";

  const labels = (
    <>
      <p className={trayClass}>{job.trayCode}</p>
      <p className={jobNoClass}>{job.jobNumber}</p>
    </>
  );

  return (
    <div className={rootClass}>
      <img
        src={qrData.qr}
        alt="QR code"
        className={qrClass}
        onLoad={fireReady}
        onError={fireReady}
      />

      {isInline ? (
        <div className={styles.textBlock}>{labels}</div>
      ) : (
        <div className={styles.labelBlock}>{labels}</div>
      )}

      <button
        type="button"
        onClick={() => window.print()}
        className={`${styles.printBtn} ${styles.printHidden} ${printExtra}`.trim()}
      >
        Print
      </button>
    </div>
  );
}
