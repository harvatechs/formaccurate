/**
 * Crockford's Base32 alphabet (excludes I, L, O, U to prevent confusion).
 */
const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const ENCODING_LEN = ENCODING.length;

/**
 * Encodes a numeric timestamp into a 10-character Crockford Base32 string.
 */
function encodeTime(now: number, len: number = 10): string {
  let str = "";
  let current = now;
  for (let i = len - 1; i >= 0; i--) {
    const mod = current % ENCODING_LEN;
    str = ENCODING.charAt(mod) + str;
    current = Math.floor(current / ENCODING_LEN);
  }
  return str;
}

/**
 * Generates a 16-character pseudo-random Crockford Base32 string.
 */
function encodeRandom(len: number = 16): string {
  let str = "";
  for (let i = 0; i < len; i++) {
    const rand = Math.floor(Math.random() * ENCODING_LEN);
    str += ENCODING.charAt(rand);
  }
  return str;
}

/**
 * Generates a standard ULID (Universally Unique Lexicographically Sortable Identifier).
 *
 * Consists of a 48-bit timestamp (10 characters) and 80 bits of randomness (16 characters),
 * encoded in Crockford's Base32. Pure TypeScript, zero dependencies, zero DOM/Node imports.
 *
 * @param timestamp - Optional epoch timestamp in milliseconds (defaults to Date.now()).
 * @returns 26-character ULID string.
 */
export function generateUlid(timestamp: number = Date.now()): string {
  return encodeTime(timestamp, 10) + encodeRandom(16);
}
