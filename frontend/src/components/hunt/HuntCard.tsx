import React from "react";
import Link from "next/link";
import { Hunt } from "../../lib/api";
import Card from "../ui/Card";
import Button from "../ui/Button";
import styles from "../../styles/components/HuntCard.module.css";

interface HuntCardProps {
  hunt: Hunt;
  onDelete: (id: number) => void;
}

export const HuntCard: React.FC<HuntCardProps> = ({ hunt, onDelete }) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    onDelete(hunt.id);
  };

  const treasureCount = hunt.treasures?.length || 0;
  const formattedDate = new Date(hunt.createdAt).toLocaleDateString();

  return (
    <Card className={styles.huntCard}>
      <div className={styles.huntHeader}>
        <h3 className={styles.title}>🏴‍☠️ {hunt.title}</h3>
        <div className={styles.headerActions}>
          <Link href={`/hunts/${hunt.id}`} passHref>
            <Button variant="secondary" size="small">
              Edit
            </Button>
          </Link>
          <Button variant="danger" size="small" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>
      <div className={styles.huntContent}>
        <div className={styles.detailsSection}>
          <div className={styles.meta}>
            <span className={styles.treasureCount}>
              📦 {treasureCount} treasure{treasureCount !== 1 ? "s" : ""}
            </span>
            <span className={styles.date}>Created: {formattedDate}</span>
          </div>
        </div>
        <div className={styles.actionsSection}>
          <div className={styles.actions}>
            <Link href={`/hunts/${hunt.id}/play`} passHref>
              <Button variant="primary" size="small">
                Play Hunt
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
};
