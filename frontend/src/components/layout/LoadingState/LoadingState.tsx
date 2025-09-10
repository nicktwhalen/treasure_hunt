import React from "react";
import styles from "./LoadingState.module.css";

export interface LoadingStateProps {
  message?: string;
  className?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading...",
  className = "",
}) => {
  return <div className={`${styles.loadingState} ${className}`}>{message}</div>;
};

export default LoadingState;
