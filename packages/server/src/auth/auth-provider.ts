export interface AuthContext {
  subject: string;
  scopes: string[];
}

/**
 * Authentication and token verification provider interface.
 * Implemented by host applications to integrate OAuth, OIDC, JWTs, or static API keys.
 */
export interface AuthProvider {
  verifyToken(token: string): Promise<AuthContext | null> | AuthContext | null;
}

export const ALL_STANDARD_SCOPES = [
  "form:read",
  "form:write",
  "form:submit",
  "form:upload",
  "form:read_receipt",
];

/**
 * Creates a static API key AuthProvider reference implementation.
 *
 * @param keys - Either an array of valid API key strings (each granted all standard scopes),
 *               or a dictionary mapping API key to an explicit AuthContext.
 * @returns An AuthProvider implementation.
 */
export function staticApiKeyAuthProvider(
  keys: string[] | Record<string, AuthContext>,
): AuthProvider {
  if (Array.isArray(keys)) {
    const keySet = new Set(keys);
    return {
      verifyToken(token: string): AuthContext | null {
        if (keySet.has(token)) {
          return {
            subject: `agent:apikey:${token.slice(0, 8)}`,
            scopes: [...ALL_STANDARD_SCOPES],
          };
        }
        return null;
      },
    };
  }

  return {
    verifyToken(token: string): AuthContext | null {
      const auth = keys[token];
      return auth ? { ...auth } : null;
    },
  };
}
