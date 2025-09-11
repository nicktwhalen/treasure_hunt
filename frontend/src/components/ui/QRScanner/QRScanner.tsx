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
  const isInitializingRef = useRef<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasCamera, setHasCamera] = useState<boolean>(true);
  const [cameras, setCameras] = useState<QrScanner.Camera[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string | undefined>(
    () => {
      // Initialize with stored camera preference
      if (typeof window !== "undefined") {
        return localStorage.getItem("qr-scanner-preferred-camera") || undefined;
      }
      return undefined;
    },
  );

  useEffect(() => {
    if (!isOpen || !videoRef.current) return;

    const startScanner = async () => {
      // Prevent multiple simultaneous initialization attempts
      if (isInitializingRef.current) {
        return;
      }

      isInitializingRef.current = true;

      try {
        setError(null);

        // Clean up any existing scanner first
        if (qrScannerRef.current) {
          try {
            qrScannerRef.current.stop();
            qrScannerRef.current.destroy();
          } catch (err) {
            console.warn("Error cleaning up existing scanner:", err);
          }
          qrScannerRef.current = null;
        }

        // Ensure video element is ready and properly reset
        if (videoRef.current) {
          try {
            // Stop any existing media stream
            if (videoRef.current.srcObject) {
              const stream = videoRef.current.srcObject as MediaStream;
              stream.getTracks().forEach((track) => track.stop());
            }

            videoRef.current.srcObject = null;
            videoRef.current.src = "";

            // Wait for any pending play promises to resolve
            await new Promise((resolve) => {
              videoRef.current!.addEventListener("loadstart", resolve, {
                once: true,
              });
              videoRef.current!.load();
            });
          } catch (err) {
            console.warn("Error resetting video element:", err);
          }
        }

        // Longer delay to ensure all cleanup is complete
        await new Promise((resolve) => setTimeout(resolve, 300));

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

        // Get available cameras
        const availableCameras = await QrScanner.listCameras();
        setCameras(availableCameras);

        // Set default camera (prefer stored preference, then back-facing if available)
        if (availableCameras.length > 0) {
          let cameraToUse: string | undefined;

          // First, check if stored preference exists and is still available
          if (selectedCamera) {
            const storedCameraExists = availableCameras.find(
              (cam) => cam.id === selectedCamera,
            );
            if (storedCameraExists) {
              cameraToUse = selectedCamera;
            }
          }

          // If no stored preference or stored camera not available, find back camera
          if (!cameraToUse) {
            // First try to find camera with environment facing mode
            let backCamera = availableCameras.find((cam) => {
              // Check device info for facing mode
              return (
                cam.label.toLowerCase().includes("back") ||
                cam.label.toLowerCase().includes("rear") ||
                cam.label.toLowerCase().includes("environment") ||
                cam.label.toLowerCase().includes("world")
              );
            });

            // If not found by label, try to use device constraints to identify back camera
            if (!backCamera && availableCameras.length > 1) {
              // Usually the back camera is the first one on mobile devices
              // or the one that's NOT the front camera
              const frontCamera = availableCameras.find(
                (cam) =>
                  cam.label.toLowerCase().includes("front") ||
                  cam.label.toLowerCase().includes("user") ||
                  cam.label.toLowerCase().includes("face"),
              );

              if (frontCamera) {
                backCamera = availableCameras.find(
                  (cam) => cam.id !== frontCamera.id,
                );
              }
            }

            // Fallback: if we have multiple cameras, prefer the second one (often back camera on mobile)
            if (!backCamera && availableCameras.length > 1) {
              backCamera = availableCameras[1];
            }

            cameraToUse = backCamera?.id || availableCameras[0].id;
          }

          // Update state if different from current selection
          if (cameraToUse !== selectedCamera) {
            setSelectedCamera(cameraToUse);
          }
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
            preferredCamera: selectedCamera,
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
      } finally {
        isInitializingRef.current = false;
      }
    };

    startScanner();

    // Cleanup function
    return () => {
      isInitializingRef.current = false;

      if (qrScannerRef.current) {
        try {
          qrScannerRef.current.stop();
          qrScannerRef.current.destroy();
        } catch (err) {
          console.warn("Error cleaning up QR scanner:", err);
        }
        qrScannerRef.current = null;
      }

      // Also clean up video element and media streams
      if (videoRef.current) {
        try {
          // Stop any active media streams
          if (videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach((track) => track.stop());
          }

          videoRef.current.srcObject = null;
          videoRef.current.src = "";
          videoRef.current.load();
        } catch (err) {
          console.warn("Error cleaning up video element:", err);
        }
      }
    };
  }, [isOpen, onScan, selectedCamera]);

  useEffect(() => {
    // Stop scanner when component unmounts or closes
    return () => {
      if (qrScannerRef.current) {
        try {
          qrScannerRef.current.stop();
          qrScannerRef.current.destroy();
        } catch (err) {
          console.warn("Error during unmount cleanup:", err);
        }
      }
    };
  }, []);

  const handleCameraChange = (cameraId: string) => {
    setSelectedCamera(cameraId);
    // Save camera preference to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("qr-scanner-preferred-camera", cameraId);
    }
  };

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
              {cameras.length > 1 && (
                <div className={styles.cameraSelector}>
                  <label htmlFor="camera-select">Camera:</label>
                  <select
                    id="camera-select"
                    value={selectedCamera || ""}
                    onChange={(e) => handleCameraChange(e.target.value)}
                    className={styles.select}
                  >
                    {cameras.map((camera) => (
                      <option key={camera.id} value={camera.id}>
                        {camera.label || `Camera ${camera.id}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
