import React from "react";
import styles from "./Card.module.css";

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "elevated";
}

const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = "default",
}) => {
  const cardClasses = [styles.card, styles[variant], className]
    .filter(Boolean)
    .join(" ");

  return <div className={cardClasses}>{children}</div>;
};

export default Card;
