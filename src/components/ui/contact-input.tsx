// components/ui/contact-input.tsx
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  validateContactNumber,
  sanitizeContactNumber,
  formatContactNumber,
  ContactValidationOptions
} from "@/lib/validations/contactValidation";

interface ContactInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean) => void;
  validationOptions?: ContactValidationOptions;
  showValidationMessage?: boolean;
  showFormatting?: boolean;
  validateImmediately?: boolean; // New prop to control validation timing
  placeholder?: string;
  className?: string;
  required?: boolean;
  strictTenDigits?: boolean;
  prefix?: string; // e.g., "+91" (display only, uneditable)
}

export const ContactInput: React.FC<ContactInputProps> = ({
  value,
  onChange,
  onValidationChange,
  validationOptions = {},
  showValidationMessage = true,
  showFormatting = true,
  validateImmediately = true, // Default to true for immediate validation
  placeholder = "Enter contact number",
  className = "",
  required = false,
  strictTenDigits = false,
  prefix,
  ...props
}) => {
  const [error, setError] = useState<string>("");
  const [isTouched, setIsTouched] = useState(false);
  const [displayValue, setDisplayValue] = useState(value);

  // Helper function to find next focusable element in the form
  const getNextFocusableElement = (currentElement: HTMLElement): HTMLElement | null => {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'textarea:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');
    
    const form = currentElement.closest('form');
    if (!form) return null;
    
    const focusableElements = Array.from(form.querySelectorAll(focusableSelectors)) as HTMLElement[];
    const currentIndex = focusableElements.indexOf(currentElement);
    
    if (currentIndex >= 0 && currentIndex < focusableElements.length - 1) {
      return focusableElements[currentIndex + 1];
    }
    return null;
  };

  // Helper function to find previous focusable element in the form
  const getPreviousFocusableElement = (currentElement: HTMLElement): HTMLElement | null => {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'textarea:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');
    
    const form = currentElement.closest('form');
    if (!form) return null;
    
    const focusableElements = Array.from(form.querySelectorAll(focusableSelectors)) as HTMLElement[];
    const currentIndex = focusableElements.indexOf(currentElement);
    
    if (currentIndex > 0) {
      return focusableElements[currentIndex - 1];
    }
    return null;
  };


  // Update display value when prop changes
  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  // const validation = validateContactNumber(value, { required, ...validationOptions });

  const validateStrictTenDigits = (num: string): { isValid: boolean; message: string } => {
    if (!num || num.trim() === "") {
      return { isValid: !required, message: required ? "Contact number is required" : "" };
    }

    const cleanNumber = num.replace(/\D/g, '');

    if (cleanNumber.length !== 10) {
      return { isValid: false, message: `Contact number must be exactly 10 digits (currently ${cleanNumber.length})` };
    }

    if (!/^[6-9]/.test(cleanNumber)) {
      return { isValid: false, message: "Mobile number must start with 6, 7, 8, or 9" };
    }

    return { isValid: true, message: "" };
  };

  // Use either strict validation or the original validation
  const validation = strictTenDigits
    ? validateStrictTenDigits(value)
    : validateContactNumber(value, { required, ...validationOptions });

  // Immediate validation effect
  useEffect(() => {
    if (validateImmediately && value) {
      // Show error immediately if the value is invalid
      setError(validation.isValid ? "" : validation.message || "");
      onValidationChange?.(validation.isValid);
    } else if (isTouched) {
      // Show error only if touched (for blur-based validation)
      setError(validation.isValid ? "" : validation.message || "");
      onValidationChange?.(validation.isValid);
    }
  }, [value, validation, isTouched, validateImmediately, onValidationChange]);

  // Clear error when field is empty and not required
  useEffect(() => {
    if (!required && !value) {
      setError("");
    }
  }, [value, required]);

  // const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const rawValue = e.target.value;
  //   const sanitized = sanitizeContactNumber(rawValue);
  //   setDisplayValue(rawValue);
  //   onChange(sanitized);

  //   // For immediate validation, we don't need to wait for blur
  //   if (validateImmediately) {
  //     // The useEffect will handle showing error
  //   }
  // };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value;

    if (strictTenDigits) {
      // Remove any non-digit characters and leading zeros
      let digitsOnly = rawValue.replace(/\D/g, '');
      if (digitsOnly.startsWith('0')) {
        digitsOnly = digitsOnly.replace(/^0+/, '');
      }

      // Restrict to exactly 10 digits
      if (digitsOnly.length > 10) {
        digitsOnly = digitsOnly.slice(0, 10);
      }

      setDisplayValue(digitsOnly);
      onChange(digitsOnly);
    } else {
      const sanitized = sanitizeContactNumber(rawValue);
      setDisplayValue(rawValue);
      onChange(sanitized);
    }
  };
  const handleBlur = () => {
    setIsTouched(true);

    // Auto-format the number on blur if enabled
    if (showFormatting && value && validation.isValid) {
      const formatted = formatContactNumber(value);
      if (formatted !== value) {
        setDisplayValue(formatted);
        onChange(formatted);
      }
    }
  };

  const handleFocus = () => {
    // On focus, show the raw number without formatting
    if (showFormatting && value) {
      const rawNumber = value.replace(/[\s\-\(\)]/g, "");
      if (rawNumber !== displayValue) {
        setDisplayValue(rawNumber);
      }
    }
  };

  // Determine if error should be shown
  const showError = validateImmediately
    ? !!error && (value ? true : false)  // Show error immediately if there's a value
    : !!error && isTouched;               // Show error only after blur

  const inputElement = (
    <Input
      type="tel"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      onKeyDown={(e) => {
        if (e.key === "Tab") {
          e.preventDefault();
          if (e.shiftKey) {
            // Shift+Tab: go to previous focusable element
            const prevElement = getPreviousFocusableElement(e.target as HTMLElement);
            prevElement?.focus();
          } else {
            // Tab: go to next focusable element
            const nextElement = getNextFocusableElement(e.target as HTMLElement);
            nextElement?.focus();
          }
        }
      }}
      placeholder={strictTenDigits ? "Enter 10-digit mobile number" : placeholder}
      className={cn(className, showError && "border-red-500 focus-visible:ring-red-500")}
      aria-invalid={showError}
      aria-describedby={showError ? "contact-error" : undefined}
      maxLength={strictTenDigits ? 10 : undefined}
      inputMode={strictTenDigits ? "numeric" : "tel"}
      {...props}
    />
  );

  return (
    <div className="w-full">
      {prefix ? (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground select-none">{prefix}</span>
          <div className="flex-1">{inputElement}</div>
        </div>
      ) : (
        inputElement
      )}
      {showValidationMessage && showError && (
        <p id="contact-error" className="text-xs text-red-600 dark:text-red-400 mt-1">
          {error}
        </p>
      )}
      {strictTenDigits && !showError && value && value.length === 10 && (
        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
          ✓ Valid 10-digit mobile number
        </p>
      )}
    </div>
  );
};
