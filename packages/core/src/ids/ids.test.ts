import { describe, expect, it } from "vitest";
import {
  computeSubmissionChecksum,
  createSubmissionReceipt,
  generateFileToken,
  generateSessionId,
  generateSignatureToken,
  generateSubmissionId,
  isValidIdempotencyKey,
} from "./ids.js";
import { sha256Hex } from "./sha256.js";
import { generateUlid } from "./ulid.js";

describe("ids & receipts", () => {
  describe("generateUlid", () => {
    it("generates 26-character Crockford Base32 strings", () => {
      const id = generateUlid();
      expect(id).toHaveLength(26);
      expect(id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
    });

    it("generates monotonic/sortable IDs over time", async () => {
      const id1 = generateUlid(100000);
      const id2 = generateUlid(200000);
      expect(id1 < id2).toBe(true);
    });
  });

  describe("prefixed ID generators", () => {
    it("generates session IDs with 'sess_' prefix", () => {
      const id = generateSessionId();
      expect(id).toMatch(/^sess_[0-9A-HJKMNP-TV-Z]{26}$/);
    });

    it("generates submission IDs with 'sub_' prefix", () => {
      const id = generateSubmissionId();
      expect(id).toMatch(/^sub_[0-9A-HJKMNP-TV-Z]{26}$/);
    });

    it("generates file tokens with 'filetok_' prefix", () => {
      const id = generateFileToken();
      expect(id).toMatch(/^filetok_[0-9A-HJKMNP-TV-Z]{26}$/);
    });

    it("generates signature tokens with 'sigtok_' prefix", () => {
      const id = generateSignatureToken();
      expect(id).toMatch(/^sigtok_[0-9A-HJKMNP-TV-Z]{26}$/);
    });
  });

  describe("isValidIdempotencyKey", () => {
    it("accepts valid UUIDs", () => {
      expect(isValidIdempotencyKey("123e4567-e89b-12d3-a456-426614174000")).toBe(true);
      expect(isValidIdempotencyKey("c9a646d3-9c61-4cd7-bf50-13f562725e24")).toBe(true);
      expect(isValidIdempotencyKey("C9A646D3-9C61-4CD7-BF50-13F562725E24")).toBe(true);
    });

    it("rejects non-UUID strings and malformed keys", () => {
      expect(isValidIdempotencyKey("")).toBe(false);
      expect(isValidIdempotencyKey("not-a-uuid")).toBe(false);
      expect(isValidIdempotencyKey("123e4567-e89b-12d3-a456")).toBe(false);
      expect(isValidIdempotencyKey("123e4567-e89b-12d3-a456-426614174000-extra")).toBe(false);
    });
  });

  describe("sha256Hex", () => {
    it("computes known NIST test vectors correctly", () => {
      // Empty string
      expect(sha256Hex("")).toBe(
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      );
      // "abc"
      expect(sha256Hex("abc")).toBe(
        "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
      );
    });
  });

  describe("computeSubmissionChecksum & createSubmissionReceipt", () => {
    it("computes deterministic checksum regardless of object key order", () => {
      const val1 = { b: 2, a: 1, c: { y: 20, x: 10 } };
      const val2 = { a: 1, c: { x: 10, y: 20 }, b: 2 };

      const cs1 = computeSubmissionChecksum(val1);
      const cs2 = computeSubmissionChecksum(val2);

      expect(cs1).toMatch(/^sha256:[0-9a-f]{64}$/);
      expect(cs1).toBe(cs2);
    });

    it("creates verifiable submission receipt", () => {
      const receipt = createSubmissionReceipt({
        submissionId: "sub_01JTESTRECEIPT",
        values: { legal_name: "Acme LLC", email: "test@acme.com" },
        receivedAt: "2026-01-01T12:00:00Z",
      });

      expect(receipt.submissionId).toBe("sub_01JTESTRECEIPT");
      expect(receipt.status).toBe("submitted");
      expect(receipt.receivedAt).toBe("2026-01-01T12:00:00Z");
      expect(receipt.receiptUrl).toBe("/receipts/sub_01JTESTRECEIPT");
      expect(receipt.checksum).toMatch(/^sha256:[0-9a-f]{64}$/);
    });
  });
});
