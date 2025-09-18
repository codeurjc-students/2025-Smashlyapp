// Utility functions for handling racket characteristics

// Fields that should not be displayed in technical characteristics
export const HIDDEN_CHARACTERISTIC_FIELDS = [
  "formato",
  "color_2",
  "color",
  "producto",
  "marca",
];

/**
 * Filters out unwanted characteristic fields
 * @param characteristics - The characteristics object
 * @returns Filtered characteristics object
 */
export const filterCharacteristics = (characteristics: Record<string, any>) => {
  return Object.fromEntries(
    Object.entries(characteristics).filter(
      ([key, value]) =>
        !HIDDEN_CHARACTERISTIC_FIELDS.includes(key) &&
        value &&
        value !== "Unknown" &&
        value !== "Unknow"
    )
  );
};

/**
 * Checks if a characteristic field should be displayed
 * @param key - The characteristic key
 * @param value - The characteristic value
 * @returns boolean indicating if the field should be displayed
 */
export const shouldDisplayCharacteristic = (
  key: string,
  value: any
): boolean => {
  return (
    !HIDDEN_CHARACTERISTIC_FIELDS.includes(key) &&
    value &&
    value !== "Unknown" &&
    value !== "Unknow"
  );
};
