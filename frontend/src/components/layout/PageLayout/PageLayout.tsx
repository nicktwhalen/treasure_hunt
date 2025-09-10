import React from "react";
import Button from "../../ui/Button";

export interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  backHref?: string;
  onBack?: () => void;
  actions?: React.ReactNode;
  className?: string;
}

const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  title,
  backHref,
  onBack,
  actions,
  className = "",
}) => {
  return (
    <div className={`page-container ${className}`}>
      {(onBack || actions) && (
        <div className="page-header">
          {onBack && (
            <Button variant="secondary" onClick={onBack}>
              ← Back
            </Button>
          )}
          {actions && <div>{actions}</div>}
        </div>
      )}

      {title && (
        <div className="title-section">
          <h1>{title}</h1>
        </div>
      )}

      {children}
    </div>
  );
};

export default PageLayout;
