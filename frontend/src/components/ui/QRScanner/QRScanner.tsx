import React, { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";
import Button from "../Button";
import styles from "./QRScanner.module.css";

export interface QRScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose, isOpen }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasCamera, setHasCamera] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen || !videoRef.current) return;

    const startScanner = async () => {
      try {
        setError(null);

        // First, request camera permission explicitly
        try {
          await navigator.mediaDevices.getUserMedia({ video: true });
        } catch (permissionError) {
          console.error("Camera permission error:", permissionError);
          setError(
            "Camera permission denied. Please allow camera access and try again.",
          );
          return;
        }

        // Check if camera is available
        const hasCamera = await QrScanner.hasCamera();
        if (!hasCamera) {
          setHasCamera(false);
          setError("No camera found on this device");
          return;
        }

        // Create scanner instance
        if (!videoRef.current) {
          setError("Video element not available");
          return;
        }

        qrScannerRef.current = new QrScanner(
          videoRef.current,
          (result) => {
            onScan(result.data);
          },
          {
            returnDetailedScanResult: true,
            highlightScanRegion: true,
            highlightCodeOutline: true,
          },
        );

        // Start scanning
        await qrScannerRef.current.start();
      } catch (err) {
        console.error("Error starting QR scanner:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";

        if (errorMessage.includes("Permission")) {
          setError(
            "Camera permission denied. Please allow camera access in your browser settings and refresh the page.",
          );
        } else if (errorMessage.includes("HTTPS")) {
          setError(
            "Camera access requires HTTPS. Please use a secure connection.",
          );
        } else if (errorMessage.includes("NotFoundError")) {
          setError("No camera found on this device.");
        } else {
          setError(`Failed to access camera: ${errorMessage}`);
        }
      }
    };

    startScanner();

    // Cleanup function
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
        qrScannerRef.current = null;
      }
    };
  }, [isOpen, onScan]);

  useEffect(() => {
    // Stop scanner when component unmounts or closes
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Scan QR Code</h2>
          <Button variant="secondary" onClick={onClose}>
            ✕
          </Button>
        </div>

        <div className={styles.content}>
          {error ? (
            <div className={styles.error}>
              <p>{error}</p>
              {error.includes("permission") || error.includes("Permission") ? (
                <div className={styles.instructions}>
                  <p>
                    <strong>To enable camera access:</strong>
                  </p>
                  <p>1. Look for a camera icon in your browser's address bar</p>
                  <p>2. Click it and select "Allow"</p>
                  <p>3. Refresh this page and try again</p>
                </div>
              ) : null}
              <Button variant="primary" onClick={onClose}>
                Close
              </Button>
            </div>
          ) : (
            <>
              <div className={styles.videoContainer}>
                <video
                  ref={videoRef}
                  className={styles.video}
                  playsInline
                  muted
                />
                <div className={styles.scanRegion} />
              </div>

              <div className={styles.instructions}>
                <p>Point your camera at a QR code to scan it</p>
              </div>
            </>
          )}
        </div>

        <div className={styles.actions}>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
