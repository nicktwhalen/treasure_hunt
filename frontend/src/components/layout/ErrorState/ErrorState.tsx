import React from "react";
import Button from "../../ui/Button";
import styles from "./ErrorState.module.css";

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onBack?: () => void;
  retryLabel?: string;
  backLabel?: string;
  className?: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Error",
  message,
  onRetry,
  onBack,
  retryLabel = "Try Again",
  backLabel = "Go Back",
  className = "",
}) => {
  return (
    <div className={`${styles.errorState} ${className}`}>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.message}>{message}</p>
      <div className={styles.actions}>
        {onRetry && (
          <Button variant="secondary" onClick={onRetry}>
            {retryLabel}
          </Button>
        )}
        {onBack && (
          <Button variant="primary" onClick={onBack}>
            {backLabel}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ErrorState;
