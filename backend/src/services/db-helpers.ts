// ============================================================
// FILE: backend/src/services/db-helpers.ts
// DESCRIPTION: Shared database helper functions
// ============================================================

/**
 * Extract rows from different database result formats
 */
export const extractRows = (result: any): any[] => {
  if (!result) return [];
  if (Array.isArray(result)) {
    if (result.length > 0 && Array.isArray(result[0])) {
      return result[0];
    }
    return result;
  }
  if (result.rows) return result.rows;
  if (result[0]) return result[0];
  return result;
};

/**
 * Extract single row from different database result formats
 */
export const extractSingleRow = (result: any): any => {
  const rows = extractRows(result);
  return rows.length > 0 ? rows[0] : null;
};

/**
 * Get insert ID from different database result formats
 */
export const extractInsertId = (result: any): number => {
  if (!result) return 0;
  if (result.insertId) return result.insertId;
  if (result[0] && result[0].insertId) return result[0].insertId;
  if (result.rows && result.rows.insertId) return result.rows.insertId;
  return 0;
};

/**
 * Get affected rows from different database result formats
 */
export const getAffectedRows = (result: any): number => {
  if (!result) return 0;
  if (result.affectedRows !== undefined) return result.affectedRows;
  if (result[0] && result[0].affectedRows !== undefined) return result[0].affectedRows;
  if (result.rows && result.rows.affectedRows !== undefined) return result.rows.affectedRows;
  return 0;
};