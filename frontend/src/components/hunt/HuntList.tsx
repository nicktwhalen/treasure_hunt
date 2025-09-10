"use client";

import React, { useEffect, useState } from "react";
import { Hunt, api } from "../../lib/api";
import { HuntCard } from "./HuntCard";
import Button from "../ui/Button";
import Link from "next/link";
import LoadingState from "../layout/LoadingState";
import ErrorState from "../layout/ErrorState";
import Card from "../ui/Card";
import styles from "../../styles/components/HuntList.module.css";

export const HuntList: React.FC = () => {
  const [hunts, setHunts] = useState<Hunt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHunts();
  }, []);

  const loadHunts = async () => {
    try {
      setLoading(true);
      const data = await api.getHunts();
      setHunts(data);
      setError(null);
    } catch (err) {
      setError("Failed to load hunts. Make sure the API is running!");
      console.error("Error loading hunts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHunt = async (id: number) => {
    try {
      await api.deleteHunt(id);
      setHunts(hunts.filter((hunt) => hunt.id !== id));
    } catch (err) {
      setError("Failed to delete hunt");
      console.error("Error deleting hunt:", err);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <LoadingState message="🏴‍☠️ Loading treasures..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <ErrorState message={`⚠️ ${error}`} onRetry={loadHunts} />
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Title Section */}
      <div className="title-section">
        <h1>⚓ Treasure Hunts ⚓</h1>
      </div>

      {/* Info Section */}
      <div className="content-section">
        <Card>
          <div style={{ padding: "0.25rem 0.25rem", textAlign: "center" }}>
            <h3 style={{ margin: "0 0 1rem 0", color: "var(--color-primary)" }}>
              🏴‍☠️ Chart yer course! 🏴‍☠️
            </h3>
            <p style={{ margin: "0", lineHeight: "1.6" }}>
              <strong>Pirates</strong> create treasure hunts with clues to find
              buried treasures, then print QR codes and hide them for brave
              treasure hunters to discover.
              <br />
              <br />
              <strong>Treasure hunters</strong> follow clues to find hidden
              treasures and scan QR codes to claim their bounty!
            </p>
          </div>
        </Card>
      </div>

      {/* Hunts Section */}
      <div className="content-section">
        <div className="section-header">
          <h2>🏴‍☠️ Your Hunts ({hunts.length})</h2>
          <Link href="/hunts/new" passHref>
            <Button variant="primary">+ Create Hunt</Button>
          </Link>
        </div>

        {hunts.length === 0 ? (
          <div className="empty-state">
            <p>No hunts yet. Create your first treasure hunt to get started!</p>
          </div>
        ) : (
          <div className={styles.huntsList}>
            {hunts.map((hunt) => (
              <HuntCard key={hunt.id} hunt={hunt} onDelete={handleDeleteHunt} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
