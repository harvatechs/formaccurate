import type { SubmissionReceipt } from "../schema/types.js";
import { sha256Hex } from "./sha256.js";
import { generateUlid } from "./ulid.js";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Generates a sortable, unique form session identifier.
 * Format: `sess_<ulid>` (e.g. `sess_01JXYZ...`)
 */
export function generateSessionId(): string {
  return `sess_${generateUlid()}`;
}

/**
 * Generates a sortable, unique submission identifier.
 * Format: `sub_<ulid>` (e.g. `sub_01JXYZ...`)
 */
export function generateSubmissionId(): string {
  return `sub_${generateUlid()}`;
}

/**
 * Generates a secure upload token for a file field.
 * Format: `filetok_<ulid>` (e.g. `filetok_01JXYZ...`)
 */
export function generateFileToken(): string {
  return `filetok_${generateUlid()}`;
}

/**
 * Generates a secure token for a signature field.
 * Format: `sigtok_<ulid>` (e.g. `sigtok_01JXYZ...`)
 */
export function generateSignatureToken(): string {
  return `sigtok_${generateUlid()}`;
}

/**
 * Validates whether an idempotency key is a valid UUID string (per RFC 4122).
 *
 * @param key - The candidate idempotency key to test.
 * @returns true if valid UUID v1-v5, false otherwise.
 */
export function isValidIdempotencyKey(key: string): boolean {
  if (typeof key !== "string" || key.trim() === "") {
    return false;
  }
  return UUID_REGEX.test(key.trim());
}

/**
 * Serializes an object to canonical JSON (sorted keys) for deterministic checksum calculation.
 */
function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }
  const obj = value as Record<string, unknown>;
  const sortedKeys = Object.keys(obj).sort();
  const pairs = sortedKeys.map((k) => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`);
  return `{${pairs.join(",")}}`;
}

/**
 * Computes a deterministic SHA-256 checksum for a submitted form payload.
 *
 * @param values - Form submission values.
 * @returns String in the format `sha256:<hex-digest>`.
 */
export function computeSubmissionChecksum(values: Record<string, unknown>): string {
  const canonical = canonicalJson(values);
  const hash = sha256Hex(canonical);
  return `sha256:${hash}`;
}

/**
 * Creates a verifiable submission receipt for an accepted submission.
 *
 * @param options - Receipt creation options.
 * @returns A complete SubmissionReceipt object with deterministic checksum.
 */
export function createSubmissionReceipt(options: {
  submissionId?: string;
  values: Record<string, unknown>;
  receivedAt?: string;
  receiptUrlPrefix?: string;
}): SubmissionReceipt {
  const submissionId = options.submissionId ?? generateSubmissionId();
  const receivedAt = options.receivedAt ?? new Date().toISOString();
  const receiptUrlPrefix = options.receiptUrlPrefix ?? "/receipts";
  const checksum = computeSubmissionChecksum(options.values);

  return {
    submissionId,
    status: "submitted",
    receivedAt,
    receiptUrl: `${receiptUrlPrefix.replace(/\/$/, "")}/${submissionId}`,
    checksum,
  };
}
