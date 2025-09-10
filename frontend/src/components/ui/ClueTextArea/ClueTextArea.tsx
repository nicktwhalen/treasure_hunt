import React, { useEffect, useState } from "react";
import Button from "../Button";
import styles from "./ClueTextArea.module.css";

export interface ClueTextAreaProps {
  value: string;
  onChange: (value: string) => void;
  onSave?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  maxLength?: number;
  hasUnsavedChanges?: boolean;
  showSaveButton?: boolean;
  disabled?: boolean;
  rows?: number;
  isValid?: boolean;
  showError?: boolean;
  fieldTouched?: boolean;
  autoFocus?: boolean;
  blinkTrigger?: number;
}

const ClueTextArea: React.FC<ClueTextAreaProps> = ({
  value,
  onChange,
  onSave,
  onBlur,
  placeholder = "",
  maxLength = 200,
  hasUnsavedChanges = false,
  showSaveButton = false,
  disabled = false,
  rows = 3,
  isValid = true,
  showError = false,
  fieldTouched = false,
  autoFocus = false,
  blinkTrigger = 0,
}) => {
  const [shouldBlink, setShouldBlink] = useState(false);

  const hasError = showError || fieldTouched;

  useEffect(() => {
    if (blinkTrigger > 0 && hasError) {
      setShouldBlink(true);
      const timer = setTimeout(() => setShouldBlink(false), 800);
      return () => clearTimeout(timer);
    }
  }, [blinkTrigger, hasError]);

  const textareaClasses = [
    styles.textarea,
    hasError ? styles.invalid : "",
    shouldBlink ? styles.blinking : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles.container}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        className={textareaClasses}
        onBlur={onBlur}
        autoFocus={autoFocus}
        rows={rows}
      />

      <div className={styles.footer}>
        <div className={styles.charCount}>
          {value.length}/{maxLength} characters
        </div>

        {showSaveButton && onSave && (
          <Button
            variant="primary"
            size="small"
            onClick={onSave}
            disabled={!hasUnsavedChanges}
            style={{
              fontSize: "0.8rem",
              padding: "0.25rem 0.5rem",
              minWidth: "auto",
            }}
          >
            Save
          </Button>
        )}
      </div>
    </div>
  );
};

export default ClueTextArea;
