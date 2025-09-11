"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { api, Hunt, Treasure } from "../../../../lib/api";
import Card from "../../../../components/ui/Card";
import Button from "../../../../components/ui/Button";
import QRScanner from "../../../../components/ui/QRScanner";
import LoadingState from "../../../../components/layout/LoadingState";
import ErrorState from "../../../../components/layout/ErrorState";
import styles from "./Play.module.css";

export default function PlayHuntPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [hunt, setHunt] = useState<Hunt | null>(null);
  const [treasures, setTreasures] = useState<Treasure[]>([]);
  const [currentTreasureIndex, setCurrentTreasureIndex] = useState(0);
  const [foundTreasures, setFoundTreasures] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [wrongTreasure, setWrongTreasure] = useState(false);
  const [continuousConfetti, setContinuousConfetti] = useState(false);

  useEffect(() => {
    if (!id) return;

    const loadHuntData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [huntData, treasuresData] = await Promise.all([
          api.getHunt(parseInt(id)),
          api.getTreasures(parseInt(id)),
        ]);

        setHunt(huntData);
        setTreasures(treasuresData.sort((a, b) => a.ordinal - b.ordinal));
      } catch (err) {
        console.error("Failed to load hunt data:", err);
        setError("Failed to load hunt data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadHuntData();
  }, [id]);

  // Continuous confetti effect for final treasure
  useEffect(() => {
    if (!continuousConfetti) return;

    const interval = setInterval(() => {
      const randomX = Math.random();
      const randomParticles = Math.floor(Math.random() * 40) + 30; // 30-70 particles

      confetti({
        particleCount: randomParticles,
        spread: Math.floor(Math.random() * 60) + 50, // 50-110 spread
        origin: { x: randomX, y: 0.1 + Math.random() * 0.3 }, // Random position
        colors: ["#FFD700", "#FF6B35", "#F7931E", "#C5E063", "#06FFA5"],
      });
    }, 600); // Every 600ms

    return () => clearInterval(interval);
  }, [continuousConfetti]);

  if (loading) {
    return (
      <div className="page-container">
        <LoadingState message="Loading treasure hunt..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <ErrorState
          message={error}
          onBack={() => router.push("/hunts")}
          backLabel="Back to Hunts"
        />
      </div>
    );
  }

  if (!hunt) {
    return (
      <div className="page-container">
        <ErrorState
          title="Hunt Not Found"
          message="The treasure hunt you're looking for doesn't exist."
          onBack={() => router.push("/hunts")}
          backLabel="Back to Hunts"
        />
      </div>
    );
  }

  if (treasures.length === 0) {
    return (
      <div className="page-container">
        <ErrorState
          title="No Treasures Yet"
          message="This hunt doesn't have any treasures yet. Ask the hunt creator to add some treasures first!"
          onBack={() => router.push("/hunts")}
          backLabel="Back to Hunts"
        />
      </div>
    );
  }

  const currentTreasure = treasures[currentTreasureIndex];

  const handleScanQR = () => {
    setShowScanner(true);
  };

  const handleQRScanned = (qrData: string) => {
    setShowScanner(false);

    // Validate the scanned QR code
    const currentTreasure = treasures[currentTreasureIndex];
    if (!currentTreasure) {
      console.error(
        "No current treasure found at index:",
        currentTreasureIndex,
      );
      return;
    }

    // Check if the scanned QR matches the current treasure's QR code data
    if (qrData === currentTreasure.qrCodeData) {
      // Treasure found successfully!
      setFoundTreasures((prev) => prev + 1);

      // Show celebration animation
      setCelebrating(true);

      // Check if this is the last treasure
      if (currentTreasureIndex + 1 === treasures.length) {
        // Last treasure - start continuous confetti
        setContinuousConfetti(true);
      } else {
        // Regular treasure - single large confetti burst
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.5 },
        });
      }

      // Celebration will stay up until user clicks button
    } else {
      // Show wrong treasure modal
      setWrongTreasure(true);
    }
  };

  const handleCloseScan = () => {
    setShowScanner(false);
  };

  const handleBackToHunts = () => {
    router.push("/hunts");
  };

  const handleContinueFromCelebration = () => {
    // Move to next treasure or complete hunt
    if (currentTreasureIndex + 1 < treasures.length) {
      setCelebrating(false);
      setCurrentTreasureIndex((prev) => prev + 1);
    } else {
      // Hunt completed! Stop continuous confetti and navigate back
      setContinuousConfetti(false);
      setCelebrating(false);
      router.push("/hunts");
    }
  };

  const handleTryAgain = () => {
    setWrongTreasure(false);
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <Button variant="secondary" onClick={handleBackToHunts}>
          ← Back
        </Button>
      </div>

      {/* Title Section */}
      <div className="title-section">
        <h1 className={styles.huntTitle}>🏴‍☠️ {hunt.title}</h1>
      </div>

      {/* Treasure Section */}
      <div className="content-section">
        <div className="section-header">
          <h2>📦 Treasure #{currentTreasureIndex + 1}</h2>
        </div>
        <Card className={styles.clueCard}>
          <div className={styles.clueContent}>
            <div className={styles.clueText}>
              {currentTreasure?.clue?.text ||
                "No clue available for this treasure."}
            </div>
            <div className={styles.clueActions}>
              <Button variant="primary" onClick={handleScanQR}>
                📱 Scan QR Code
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Progress Section */}
      <div className="content-section">
        <div className="section-header">
          <h2>🗺️ Progress</h2>
        </div>
        <Card className={styles.progressCard}>
          <div className={styles.progressContent}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressBarFill}
                style={{
                  width: `${(foundTreasures / treasures.length) * 100}%`,
                }}
              ></div>
            </div>
            <div className={styles.progressText}>
              {foundTreasures} of {treasures.length} treasures found (
              {Math.round((foundTreasures / treasures.length) * 100)}%)
            </div>
          </div>
        </Card>
      </div>

      <QRScanner
        isOpen={showScanner}
        onScan={handleQRScanned}
        onClose={handleCloseScan}
      />

      {/* Result Modals */}
      {(celebrating || wrongTreasure) && (
        <div className={styles.celebrationOverlay}>
          <div className={styles.celebrationContent}>
            <div className={styles.celebrationEmoji}>
              {celebrating ? "🎉" : "🏴‍☠️"}
            </div>
            <div className={styles.celebrationText}>
              {celebrating ? (
                <>
                  <h2>Treasure Found!</h2>
                  <p>Awesome job, treasure hunter!</p>
                  {currentTreasureIndex + 1 < treasures.length ? (
                    <p>Get ready for the next clue...</p>
                  ) : (
                    <p>Hunt completed! Well done! 🏆</p>
                  )}
                </>
              ) : (
                <>
                  <h2>Arrr, Wrong Treasure!</h2>
                  <p>This be not the treasure ye seek, matey!</p>
                  <p>
                    Keep searching the seven seas... the real treasure awaits!
                    ⚓
                  </p>
                </>
              )}
            </div>
            <div className={styles.celebrationActions}>
              <Button
                variant="primary"
                onClick={
                  celebrating ? handleContinueFromCelebration : handleTryAgain
                }
              >
                {celebrating
                  ? currentTreasureIndex + 1 < treasures.length
                    ? "Let's Go!"
                    : "Go Back"
                  : "Try Again"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
