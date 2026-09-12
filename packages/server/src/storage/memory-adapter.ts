import {
  createSubmissionReceipt,
  generateFileToken,
  type FormState,
  type SubmissionReceipt,
} from "@formaccurate/core";
import type {
  IdempotencyRecord,
  StorageAdapter,
  StoredFileRecord,
} from "./adapter.js";

const DEFAULT_IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const DEFAULT_FILE_TTL_MS = 60 * 60 * 1000; // 1 hour

export interface MemoryStorageAdapterOptions {
  /** TTL for idempotency records in milliseconds (defaults to 24h). */
  idempotencyTtlMs?: number | undefined;
  /** TTL for uploaded file tokens in milliseconds (defaults to 1h). */
  fileTtlMs?: number | undefined;
}

interface TimedEntry<T> {
  data: T;
  expiresAt: number;
}

/**
 * In-memory reference implementation of StorageAdapter for dev and testing.
 * Includes TTL tracking for idempotency keys and uploaded file tokens.
 */
export class MemoryStorageAdapter implements StorageAdapter {
  private states = new Map<string, FormState>();
  private submissions = new Map<string, SubmissionReceipt>();
  private idempotency = new Map<string, TimedEntry<IdempotencyRecord>>();
  private files = new Map<string, StoredFileRecord>();
  private idempotencyTtlMs: number;
  private fileTtlMs: number;

  constructor(options?: MemoryStorageAdapterOptions | undefined) {
    this.idempotencyTtlMs = options?.idempotencyTtlMs ?? DEFAULT_IDEMPOTENCY_TTL_MS;
    this.fileTtlMs = options?.fileTtlMs ?? DEFAULT_FILE_TTL_MS;
  }

  private makeStateKey(formId: string, sessionId: string): string {
    return `${formId}:${sessionId}`;
  }

  public async getState(
    formId: string,
    sessionId: string,
  ): Promise<FormState | null> {
    const key = this.makeStateKey(formId, sessionId);
    const state = this.states.get(key);
    return state ? JSON.parse(JSON.stringify(state)) : null;
  }

  public async saveState(
    formId: string,
    sessionId: string,
    state: FormState,
  ): Promise<void> {
    const key = this.makeStateKey(formId, sessionId);
    this.states.set(key, JSON.parse(JSON.stringify(state)));
  }

  public async createSubmission(
    _formId: string,
    _sessionId: string,
    values: Record<string, unknown>,
  ): Promise<SubmissionReceipt> {
    const receipt = createSubmissionReceipt({
      values,
    });
    this.submissions.set(receipt.submissionId, receipt);
    return receipt;
  }

  public async getSubmission(
    submissionId: string,
  ): Promise<SubmissionReceipt | null> {
    const receipt = this.submissions.get(submissionId);
    return receipt ? { ...receipt } : null;
  }

  public async checkIdempotency(
    key: string,
  ): Promise<IdempotencyRecord | null> {
    const entry = this.idempotency.get(key);
    if (!entry) {
      return null;
    }
    if (Date.now() > entry.expiresAt) {
      this.idempotency.delete(key);
      return null;
    }
    return { ...entry.data };
  }

  public async recordIdempotency(
    key: string,
    receipt: SubmissionReceipt,
    requestBodyHash: string,
  ): Promise<void> {
    const record: IdempotencyRecord = {
      receipt: { ...receipt },
      requestBodyHash,
      createdAt: new Date().toISOString(),
    };
    this.idempotency.set(key, {
      data: record,
      expiresAt: Date.now() + this.idempotencyTtlMs,
    });
  }

  public async saveFile(
    formId: string,
    fieldId: string,
    file: { filename: string; sizeBytes: number; mimeType: string },
    ttlMs?: number | undefined,
  ): Promise<StoredFileRecord> {
    const fileToken = generateFileToken();
    const effectiveTtl = ttlMs ?? this.fileTtlMs;
    const expiresAt = new Date(Date.now() + effectiveTtl).toISOString();

    const record: StoredFileRecord = {
      fileToken,
      formId,
      fieldId,
      filename: file.filename,
      sizeBytes: file.sizeBytes,
      mimeType: file.mimeType,
      expiresAt,
    };

    this.files.set(fileToken, record);
    return record;
  }

  public async getFile(fileToken: string): Promise<StoredFileRecord | null> {
    const record = this.files.get(fileToken);
    if (!record) {
      return null;
    }
    if (new Date(record.expiresAt).getTime() < Date.now()) {
      this.files.delete(fileToken);
      return null;
    }
    return { ...record };
  }

  public clear(): void {
    this.states.clear();
    this.submissions.clear();
    this.idempotency.clear();
    this.files.clear();
  }
}
