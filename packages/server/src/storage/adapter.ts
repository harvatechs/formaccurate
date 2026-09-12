import type { FormState, SubmissionReceipt } from "@formaccurate/core";

export interface StoredFileRecord {
  fileToken: string;
  formId: string;
  fieldId: string;
  filename: string;
  sizeBytes: number;
  mimeType: string;
  expiresAt: string;
}

export interface IdempotencyRecord {
  receipt: SubmissionReceipt;
  requestBodyHash: string;
  createdAt: string;
}

/**
 * Pluggable storage abstraction for FormAccurate server.
 * Allows persisting form states, submissions, idempotency records, and file uploads.
 */
export interface StorageAdapter {
  getState(formId: string, sessionId: string): Promise<FormState | null>;
  saveState(formId: string, sessionId: string, state: FormState): Promise<void>;
  createSubmission(
    formId: string,
    sessionId: string,
    values: Record<string, unknown>,
  ): Promise<SubmissionReceipt>;
  getSubmission(submissionId: string): Promise<SubmissionReceipt | null>;
  checkIdempotency(key: string): Promise<IdempotencyRecord | null>;
  recordIdempotency(
    key: string,
    receipt: SubmissionReceipt,
    requestBodyHash: string,
  ): Promise<void>;
  saveFile(
    formId: string,
    fieldId: string,
    file: { filename: string; sizeBytes: number; mimeType: string },
    ttlMs?: number,
  ): Promise<StoredFileRecord>;
  getFile(fileToken: string): Promise<StoredFileRecord | null>;
}
