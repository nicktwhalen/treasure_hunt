"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, Hunt, Treasure } from "../../../lib/api";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import TitleInput from "../../../components/ui/TitleInput";
import ClueTextArea from "../../../components/ui/ClueTextArea";
import LoadingState from "../../../components/layout/LoadingState";
import ErrorState from "../../../components/layout/ErrorState";
import QrImage from "../../../components/QrImage/QrImage";
import styles from "./HuntDetail.module.css";

interface LocalTreasure {
  id: number | string; // Use string for new treasures (temp IDs)
  ordinal: number;
  clueText: string;
  isNew?: boolean;
  isDeleted?: boolean;
  originalId?: number; // For tracking server ID when editing
}

// Memoized TreasureCard component to prevent unnecessary re-renders
const TreasureCard = React.memo<{
  treasure: LocalTreasure;
  index: number;
  originalHunt: Hunt | null;
  originalTreasures: Treasure[];
  isCreating: boolean;
  showValidationErrors: boolean;
  fieldTouched: Record<string, boolean>;
  focusNewTreasureId: string | null;
  blinkTrigger: number;
  onClueChange: (treasureId: number | string, value: string) => void;
  onClueBlur: (treasureId: number | string) => void;
  onDelete: (treasureId: number | string) => void;
}>(
  ({
    treasure,
    index,
    originalHunt,
    originalTreasures,
    isCreating,
    showValidationErrors,
    fieldTouched,
    focusNewTreasureId,
    blinkTrigger,
    onClueChange,
    onClueBlur,
    onDelete,
  }) => (
    <Card
      key={treasure.id}
      className={styles.treasureCard}
      data-treasure-id={treasure.id}
    >
      <div className={styles.treasureHeader}>
        <h3>Treasure #{index + 1}</h3>
        <Button
          variant="danger"
          size="small"
          onClick={() => onDelete(treasure.id)}
        >
          Delete
        </Button>
      </div>
      <div className={styles.treasureContent}>
        <div className={styles.clueSection}>
          <label>Clue:</label>
          <ClueTextArea
            value={treasure.clueText}
            onChange={(value) => onClueChange(treasure.id, value)}
            placeholder="Enter clue text..."
            maxLength={200}
            rows={3}
            isValid={treasure.clueText.trim().length > 0}
            showError={
              showValidationErrors && treasure.clueText.trim().length === 0
            }
            onBlur={() => onClueBlur(treasure.id)}
            fieldTouched={
              fieldTouched[`treasure-${treasure.id}`] &&
              treasure.clueText.trim().length === 0
            }
            autoFocus={focusNewTreasureId === treasure.id}
            blinkTrigger={blinkTrigger}
          />
        </div>
        <div className={styles.qrSection}>
          <label>QR Code:</label>
          {treasure.isNew ? (
            <div className={styles.qrPlaceholder}>
              <p>QR code will be generated after saving</p>
            </div>
          ) : (
            <QrImage
              qrCodeData={
                originalTreasures?.find((t) => t.id === treasure.originalId)
                  ?.qrCodeData || ""
              }
              alt={`QR Code for treasure ${index + 1}`}
              className={styles.qrImage}
            />
          )}
        </div>
      </div>
    </Card>
  ),
);

TreasureCard.displayName = "TreasureCard";

export default function HuntDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const isCreating = id === "new";

  // Server state
  const [originalHunt, setOriginalHunt] = useState<Hunt | null>(null);
  const [originalTreasures, setOriginalTreasures] = useState<Treasure[]>([]);

  // Local state (what user is editing)
  const [localTitle, setLocalTitle] = useState("");
  const [localTreasures, setLocalTreasures] = useState<LocalTreasure[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [fieldTouched, setFieldTouched] = useState<Record<string, boolean>>({});
  const [nextTempId, setNextTempId] = useState(1);

  // Focus tracking
  const [focusNewTreasureId, setFocusNewTreasureId] = useState<string | null>(
    null,
  );

  // Blink animation trigger
  const [blinkTrigger, setBlinkTrigger] = useState(0);

  // Load hunt data on mount (skip for new hunts)
  useEffect(() => {
    if (!id || isCreating) {
      setLoading(false);
      return;
    }

    const loadHuntData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [huntData, treasuresData] = await Promise.all([
          api.getHunt(parseInt(id)),
          api.getTreasures(parseInt(id)),
        ]);

        setOriginalHunt(huntData);
        setOriginalTreasures(treasuresData);

        // Initialize local state
        setLocalTitle(huntData.title);
        setLocalTreasures(
          treasuresData
            .sort((a, b) => a.ordinal - b.ordinal)
            .map((treasure) => ({
              id: treasure.id,
              ordinal: treasure.ordinal,
              clueText: treasure.clue?.text || "",
              originalId: treasure.id,
            })),
        );
      } catch (err) {
        console.error("Failed to load hunt data:", err);
        setError("Failed to load hunt data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadHuntData();
  }, [id, isCreating]);

  // Clear focus tracking when a new treasure is added
  useEffect(() => {
    if (focusNewTreasureId) {
      const timer = setTimeout(() => {
        setFocusNewTreasureId(null);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [focusNewTreasureId]);

  // Memoized calculations - must be at top level
  const activeTreasures = useMemo(
    () => localTreasures.filter((t) => !t.isDeleted),
    [localTreasures],
  );

  const formValid = useMemo(() => {
    if (localTitle.trim().length === 0) return false;
    return activeTreasures.every((t) => t.clueText.trim().length > 0);
  }, [localTitle, activeTreasures]);

  const unsavedChanges = useMemo(() => {
    // For creating new hunts, save button is always enabled
    if (isCreating) {
      return true;
    }

    // For editing existing hunts, check for actual changes
    if (localTitle !== originalHunt?.title) return true;

    const originalTreasuresMap = new Map(
      originalTreasures.map((t) => [t.id, t]),
    );

    // Check for new treasures
    if (activeTreasures.some((t) => t.isNew)) return true;

    // Check for deleted treasures
    if (
      originalTreasures.length !==
      activeTreasures.filter((t) => !t.isNew).length
    )
      return true;

    // Check for modified treasures
    return activeTreasures.some((local) => {
      if (local.isNew) return false;
      const original = originalTreasuresMap.get(local.originalId!);
      if (!original) return true;
      return (
        local.clueText !== (original.clue?.text || "") ||
        local.ordinal !== original.ordinal
      );
    });
  }, [
    isCreating,
    localTitle,
    originalHunt,
    localTreasures,
    originalTreasures,
    activeTreasures,
  ]);

  // Warn user before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (unsavedChanges) {
        event.preventDefault();
        event.returnValue =
          "You have unsaved changes. Are you sure you want to leave?";
        return "You have unsaved changes. Are you sure you want to leave?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [unsavedChanges]);

  const handleTitleChange = useCallback((value: string) => {
    setLocalTitle(value);
  }, []);

  const handleTitleBlur = useCallback(() => {
    setFieldTouched((prev) => ({ ...prev, title: true }));
  }, []);

  const handleTreasureClueChange = useCallback(
    (treasureId: number | string, value: string) => {
      setLocalTreasures((prev) =>
        prev.map((t) => (t.id === treasureId ? { ...t, clueText: value } : t)),
      );
    },
    [],
  );

  const handleTreasureClueBlur = useCallback((treasureId: number | string) => {
    setFieldTouched((prev) => ({ ...prev, [`treasure-${treasureId}`]: true }));
  }, []);

  const handleAddTreasure = useCallback(() => {
    const newTreasureId = `temp-${nextTempId}`;
    const newTreasure: LocalTreasure = {
      id: newTreasureId,
      ordinal: Math.max(...localTreasures.map((t) => t.ordinal), 0) + 1,
      clueText: "",
      isNew: true,
    };

    setLocalTreasures((prev) => [...prev, newTreasure]);
    setNextTempId((prev) => prev + 1);
    setFocusNewTreasureId(newTreasureId);
  }, [nextTempId, localTreasures]);

  const handleDeleteTreasure = useCallback((treasureId: number | string) => {
    setLocalTreasures((prev) =>
      prev.map((t) => (t.id === treasureId ? { ...t, isDeleted: true } : t)),
    );
  }, []);

  const handleBack = useCallback(() => {
    if (unsavedChanges) {
      const confirmed = window.confirm(
        "You have unsaved changes. Are you sure you want to leave? Your changes will be lost.",
      );
      if (!confirmed) {
        return;
      }
    }
    router.push("/hunts");
  }, [unsavedChanges, router]);

  const handleSave = async () => {
    if (saving) return;
    if (!isCreating && !originalHunt) return;

    // Rule #2: Validate all fields before saving
    const hasValidationErrors = !formValid;

    // If there are validation errors, highlight them and don't save
    if (hasValidationErrors) {
      setShowValidationErrors(true);
      setBlinkTrigger((prev) => prev + 1); // Trigger blink animation
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Prepare treasures data for API - all active treasures should have valid clues at this point
      const treasuresData = activeTreasures
        .sort((a, b) => a.ordinal - b.ordinal)
        .map((treasure, index) => ({
          ordinal: index + 1, // Renumber ordinals sequentially
          clueText: treasure.clueText,
        }));

      // Create or update hunt with treasures
      const updatedHunt = isCreating
        ? await api.createHunt(localTitle, treasuresData)
        : await api.updateHunt(originalHunt!.id, localTitle, treasuresData);

      // Update original state with new data
      setOriginalHunt(updatedHunt);
      const newOriginalTreasures = updatedHunt.treasures || [];
      setOriginalTreasures(newOriginalTreasures);

      // Update local state more efficiently to preserve object references where possible
      setLocalTreasures((prev) => {
        const serverTreasures = newOriginalTreasures.sort(
          (a, b) => a.ordinal - b.ordinal,
        );

        return serverTreasures.map((treasure) => {
          // Try to find existing local treasure to preserve object reference
          const existing = prev.find(
            (local) =>
              local.originalId === treasure.id ||
              (local.isNew && local.clueText === (treasure.clue?.text || "")),
          );

          if (existing && !existing.isDeleted) {
            // Preserve existing object but update necessary fields
            return {
              ...existing,
              id: treasure.id,
              ordinal: treasure.ordinal,
              clueText: treasure.clue?.text || "",
              originalId: treasure.id,
              isNew: false, // No longer new after save
            };
          }

          // Create new object only if necessary
          return {
            id: treasure.id,
            ordinal: treasure.ordinal,
            clueText: treasure.clue?.text || "",
            originalId: treasure.id,
          };
        });
      });

      setShowValidationErrors(false);

      // For new hunts, redirect to the edit page
      if (isCreating) {
        router.push(`/hunts/${updatedHunt.id}`);
      }
    } catch (err) {
      console.error("Failed to save:", err);
      setError("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <LoadingState message="Loading hunt..." />
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

  if (!isCreating && !originalHunt) {
    return (
      <div className="page-container">
        <ErrorState
          title="Hunt Not Found"
          message="The hunt you're looking for doesn't exist."
          onBack={() => router.push("/hunts")}
          backLabel="Back to Hunts"
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <Button variant="secondary" onClick={handleBack}>
          ← Back
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={!unsavedChanges || saving}
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>

      {/* Title Section */}
      <div className="title-section">
        <TitleInput
          value={localTitle}
          onChange={handleTitleChange}
          placeholder="Enter hunt title..."
          maxLength={20}
          isValid={localTitle.trim().length > 0}
          showError={showValidationErrors && localTitle.trim().length === 0}
          onBlur={handleTitleBlur}
          fieldTouched={fieldTouched.title && localTitle.trim().length === 0}
          autoFocus={isCreating}
          blinkTrigger={blinkTrigger}
        />
      </div>

      {/* Treasures Section */}
      <div className="content-section">
        <div className="section-header">
          <h2>📦 Treasures ({activeTreasures.length})</h2>
          <Button variant="primary" onClick={handleAddTreasure}>
            + Add Treasure
          </Button>
        </div>

        {activeTreasures.length === 0 ? (
          <div className="empty-state">
            <p>No treasures yet. Add your first treasure to get started!</p>
          </div>
        ) : (
          <div className={styles.treasuresList}>
            {activeTreasures.map((treasure, index) => (
              <TreasureCard
                key={treasure.id}
                treasure={treasure}
                index={index}
                originalHunt={originalHunt}
                originalTreasures={originalTreasures}
                isCreating={isCreating}
                showValidationErrors={showValidationErrors}
                fieldTouched={fieldTouched}
                focusNewTreasureId={focusNewTreasureId}
                blinkTrigger={blinkTrigger}
                onClueChange={handleTreasureClueChange}
                onClueBlur={handleTreasureClueBlur}
                onDelete={handleDeleteTreasure}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
