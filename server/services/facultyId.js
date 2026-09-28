/**
 * Canonical form of a faculty ID.
 *
 * Saving and scanning MUST agree, so both call this. A printed or scanned ID
 * often carries separators ("24 SCSE 1010531", "24-SCSE-1010531") or lowercase
 * characters; those are formatting, not identity, so they are stripped rather
 * than rejected — otherwise a card that reads correctly to a human fails to
 * match the stored record.
 */
export function normalizeFacultyId(value) {
  return String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/[\s._/-]+/g, '')
}
