// components/ui/contact-form-field.tsx
import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { ContactInput } from "./contact-input";
import { ContactValidationOptions } from "@/lib/validations/contactValidation";

interface ContactFormFieldProps {
  name: string;
  label?: string;
  validationOptions?: ContactValidationOptions;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
}

export const ContactFormField: React.FC<ContactFormFieldProps> = ({
  name,
  label,
  validationOptions = {},
  placeholder = "Enter contact number",
  className = "",
  required = false,
  disabled = false,
}) => {
  const { control, formState: { errors } } = useFormContext();
  const error = errors[name];

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <ContactInput
            {...field}
            id={name}
            placeholder={placeholder}
            className={className}
            validationOptions={{ required, ...validationOptions }}
            required={required}
            disabled={disabled}
            onValidationChange={(isValid) => {
              // Optional: You can use this to update form state
              if (!isValid && field.value) {
                // Handle invalid state
              }
            }}
          />
        )}
      />
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
          {error.message as string}
        </p>
      )}
    </div>
  );
};