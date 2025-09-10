import React, { useEffect, useState } from "react";
import styles from "./TitleInput.module.css";

export interface TitleInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  isValid?: boolean;
  showError?: boolean;
  fieldTouched?: boolean;
  autoFocus?: boolean;
  blinkTrigger?: number;
}

const TitleInput: React.FC<TitleInputProps> = ({
  value,
  onChange,
  onBlur,
  placeholder = "",
  maxLength = 200,
  disabled = false,
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

  const inputClasses = [
    styles.titleInput,
    hasError ? styles.invalid : "",
    shouldBlink ? styles.blinking : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles.titleContainer}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        className={inputClasses}
        onBlur={onBlur}
        autoFocus={autoFocus}
      />
    </div>
  );
};

export default TitleInput;
