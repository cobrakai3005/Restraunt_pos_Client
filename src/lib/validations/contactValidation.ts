// lib/validations/contactValidation.ts

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export interface ContactValidationOptions {
  required?: boolean;
  allowLandline?: boolean;
  allowInternational?: boolean;
  strictIndianMobile?: boolean; // Only allow 10-digit mobile numbers starting with 6-9
}

/**
 * Validates an Indian contact number
 * Supports:
 * - 10-digit mobile numbers (starting with 6,7,8,9)
 * - Landline numbers with STD code (e.g., 011-12345678, 022-12345678)
 * - International format with +91 prefix
 * @param value - The contact number to validate
 * @param options - Validation options
 * @returns ValidationResult object with isValid flag and optional error message
 */
export const validateContactNumber = (
  value: string,
  options: ContactValidationOptions = {}
): ValidationResult => {
  const {
    required = false,
    allowLandline = true,
    allowInternational = true,
    strictIndianMobile = false,
  } = options;

  // Handle empty values
  if (!value || value.trim() === "") {
    if (required) {
      return { isValid: false, message: "Contact number is required" };
    }
    return { isValid: true };
  }

  // Remove whitespace for validation
  let trimmedValue = value.trim();
  
  // Remove common separators for validation (spaces, hyphens, parentheses)
  const cleanValue = trimmedValue.replace(/[\s\-\(\)]/g, "");
  
  // Check if it's a valid Indian mobile number (10 digits starting with 6-9)
  const indianMobilePattern = /^[6-9]\d{9}$/;
  
  // Check if it's a valid Indian mobile number with +91 prefix
  const indianMobileWithCountryCodePattern = /^\+91[6-9]\d{9}$/;
  
  // Check if it's a valid Indian mobile number with 91 prefix (without +)
  const indianMobileWith91Pattern = /^91[6-9]\d{9}$/;
  
  // Check if it's a valid landline number with STD code
  // Formats: 0XX-XXXXXXX, 0XXX-XXXXXX, 0XXXX-XXXXX
  const landlinePattern = /^0\d{2,4}\d{6,8}$/;
  
  // Check for landline with hyphens
  const landlineWithHyphenPattern = /^0\d{2,4}-\d{6,8}$/;
  
  // Check if it's an international number (not Indian)
  const internationalPattern = /^\+\d{1,3}\d{5,14}$/;
  
  // Extract digits only for digit count
  const digitsOnly = trimmedValue.replace(/\D/g, "");
  
  // Validate Indian mobile number (10 digits)
  if (digitsOnly.length === 10) {
    if (indianMobilePattern.test(digitsOnly)) {
      return { isValid: true };
    } else if (strictIndianMobile) {
      return { 
        isValid: false, 
        message: "Mobile number must start with 6, 7, 8, or 9" 
      };
    }
    return { 
      isValid: true,
      message: "Please ensure this is a valid mobile number"
    };
  }
  
  // Validate Indian mobile number with country code (12 digits starting with 91)
  if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
    const mobilePart = digitsOnly.slice(2);
    if (indianMobilePattern.test(mobilePart)) {
      return { isValid: true };
    } else if (strictIndianMobile) {
      return { 
        isValid: false, 
        message: "Mobile number must start with 6, 7, 8, or 9" 
      };
    }
  }
  
  // Validate with +91 prefix
  if (indianMobileWithCountryCodePattern.test(cleanValue)) {
    return { isValid: true };
  }
  
  // Validate with 91 prefix (without +)
  if (indianMobileWith91Pattern.test(cleanValue)) {
    return { isValid: true };
  }
  
  // Validate landline numbers
  if (allowLandline) {
    // Check if it's a landline number with hyphen
    if (landlineWithHyphenPattern.test(trimmedValue)) {
      const [stdCode, number] = trimmedValue.split("-");
      const stdDigits = stdCode.replace(/\D/g, "").length;
      const numberDigits = number.replace(/\D/g, "").length;
      
      // Valid landline: STD code 2-4 digits, number 6-8 digits
      if (stdDigits >= 2 && stdDigits <= 4 && numberDigits >= 6 && numberDigits <= 8) {
        return { isValid: true };
      }
    }
    
    // Check if it's a landline number without hyphen
    if (landlinePattern.test(cleanValue)) {
      return { isValid: true };
    }
    
    // Check for common landline patterns
    // Mumbai: 022-XXXXXXX, Delhi: 011-XXXXXXX, etc.
    if (digitsOnly.length >= 9 && digitsOnly.length <= 12 && digitsOnly.startsWith("0")) {
      const stdDigits = digitsOnly.slice(0, digitsOnly.length - 6);
      const numberDigits = digitsOnly.slice(-6);
      
      if (stdDigits.length >= 2 && stdDigits.length <= 4 && numberDigits.length >= 6) {
        return { isValid: true };
      }
    }
  }
  
  // Validate international numbers (non-Indian)
  if (allowInternational && internationalPattern.test(trimmedValue)) {
    // Ensure it's not an Indian number with different format
    if (!trimmedValue.includes("+91") && !trimmedValue.includes("91")) {
      return { isValid: true };
    }
  }
  
  // Check for valid characters (digits, +, -, space, parentheses)
  const validCharsPattern = /^[0-9+\-\s()]+$/;
  if (!validCharsPattern.test(trimmedValue)) {
    return {
      isValid: false,
      message: "Contact number contains invalid characters. Use only digits, +, -, space, or parentheses",
    };
  }
  
  // If we've reached here, the number format is invalid
  if (digitsOnly.length > 0) {
    
    if (digitsOnly.length > 15) {
      return {
        isValid: false,
        message: "Contact number must not exceed 15 digits",
      };
    }
  }
  
  return {
    isValid: false,
    message: "Please enter a valid mobile number (10 digits starting with 6-9) or landline number with STD code",
  };
};

/**
 * Formats an Indian contact number for display
 * @param value - Raw contact number
 * @returns Formatted contact number
 */
export const formatContactNumber = (value: string): string => {
  if (!value) return "";
  
  const digitsOnly = value.replace(/\D/g, "");
  
  // Format 10-digit mobile number
  if (digitsOnly.length === 10) {
    return `${digitsOnly.slice(0, 5)} ${digitsOnly.slice(5)}`;
  }
  
  // Format 12-digit number with 91 prefix
  if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
    const mobilePart = digitsOnly.slice(2);
    return `+91 ${mobilePart.slice(0, 5)} ${mobilePart.slice(5)}`;
  }
  
  // Format landline number with STD code
  if (digitsOnly.length >= 9 && digitsOnly.length <= 12 && digitsOnly.startsWith("0")) {
    const stdCode = digitsOnly.slice(0, digitsOnly.length - 6);
    const number = digitsOnly.slice(-6);
    return `${stdCode}-${number.slice(0, 3)} ${number.slice(3)}`;
  }
  
  // If number already has +, format with spaces
  if (value.startsWith("+")) {
    const withoutPlus = value.slice(1);
    const countryCode = withoutPlus.slice(0, 2);
    const rest = withoutPlus.slice(2);
    const mobilePart = rest.replace(/\D/g, "");
    if (mobilePart.length === 10) {
      return `+${countryCode} ${mobilePart.slice(0, 5)} ${mobilePart.slice(5)}`;
    }
  }
  
  return value;
};

/**
 * Sanitizes a contact number for Indian numbers
 * - Removes all non-digit characters except '+'
 * - Ensures proper format for storage
 * @param value - Raw contact number
 * @returns Sanitized contact number
 */
export const sanitizeContactNumber = (value: string): string => {
  if (!value) return "";
  
  // First, remove all non-digit and non-plus characters
  let cleaned = value.replace(/[^\d+]/g, "");
  
  // If there's a plus sign, ensure it's only at the beginning
  if (cleaned.includes("+")) {
    if (cleaned.indexOf("+") !== 0) {
      cleaned = cleaned.replace(/\+/g, "");
    } else {
      // Keep the plus at start, remove any other plus signs
      cleaned = "+" + cleaned.slice(1).replace(/\+/g, "");
    }
  }
  
  // For Indian numbers, ensure proper format
  const digitsOnly = cleaned.replace(/\D/g, "");
  
  // If it's a 10-digit number and no country code, store as is
  if (digitsOnly.length === 10 && !cleaned.startsWith("+")) {
    return digitsOnly;
  }
  
  // If it's a 10-digit number with +91, store with +91
  if (digitsOnly.length === 12 && digitsOnly.startsWith("91") && cleaned.startsWith("+")) {
    return `+${digitsOnly}`;
  }
  
  // If it's a 10-digit number with 91 but no +, add +
  if (digitsOnly.length === 12 && digitsOnly.startsWith("91") && !cleaned.startsWith("+")) {
    return `+${digitsOnly}`;
  }
  
  return cleaned;
};

/**
 * Gets the country code from a contact number
 * @param value - Contact number
 * @returns Country code or null if not found
 */
export const getCountryCode = (value: string): string | null => {
  if (!value) return null;
  
  const digitsOnly = value.replace(/\D/g, "");
  
  if (value.startsWith("+")) {
    const match = value.match(/^\+(\d{1,3})/);
    return match ? match[1] : null;
  }
  
  if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
    return "91";
  }
  
  if (digitsOnly.length === 10) {
    return "IN"; // India-specific indicator
  }
  
  return null;
};

/**
 * Extracts the mobile number without country code
 * @param value - Contact number
 * @returns Mobile number without country code
 */
export const extractMobileNumber = (value: string): string => {
  if (!value) return "";
  
  const digitsOnly = value.replace(/\D/g, "");
  
  if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
    return digitsOnly.slice(2);
  }
  
  if (digitsOnly.length === 10) {
    return digitsOnly;
  }
  
  return value;
};

/**
 * Checks if the number is a valid Indian mobile number
 * @param value - Contact number
 * @returns Boolean indicating if it's a mobile number
 */
export const isIndianMobileNumber = (value: string): boolean => {
  if (!value) return false;
  
  const digitsOnly = value.replace(/\D/g, "");
  
  if (digitsOnly.length === 10) {
    return /^[6-9]\d{9}$/.test(digitsOnly);
  }
  
  if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
    const mobilePart = digitsOnly.slice(2);
    return /^[6-9]\d{9}$/.test(mobilePart);
  }
  
  if (value.startsWith("+91")) {
    const mobilePart = value.replace(/\D/g, "").slice(2);
    return /^[6-9]\d{9}$/.test(mobilePart);
  }
  
  return false;
};

/**
 * Checks if the number is a valid Indian landline number
 * @param value - Contact number
 * @returns Boolean indicating if it's a landline number
 */
export const isIndianLandlineNumber = (value: string): boolean => {
  if (!value) return false;
  
  const digitsOnly = value.replace(/\D/g, "");
  
  // Landline should start with 0 and have 9-12 digits
  if (!digitsOnly.startsWith("0")) return false;
  if (digitsOnly.length < 9 || digitsOnly.length > 12) return false;
  
  // Extract STD code (2-4 digits) and number (6-8 digits)
  const stdCode = digitsOnly.slice(0, digitsOnly.length - 6);
  const number = digitsOnly.slice(-6);
  
  return stdCode.length >= 2 && stdCode.length <= 4 && number.length >= 6;
};