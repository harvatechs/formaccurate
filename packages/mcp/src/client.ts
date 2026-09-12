/**
 * HTTP client for FormAccurate MCP tools.
 */

export interface FormAccurateClientOptions {
  /** Base URL for the FormAccurate server (e.g. "http://localhost:3000"). */
  baseUrl: string;
  /** Optional Bearer authorization token. */
  token?: string | undefined;
  /** Custom fetch implementation (defaults to globalThis.fetch). */
  fetch?: typeof fetch | undefined;
}

export class FormAccurateHttpClient {
  private baseUrl: string;
  private token?: string | undefined;
  private customFetch: typeof fetch;

  constructor(options: FormAccurateClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.token = options.token;
    this.customFetch = options.fetch ?? globalThis.fetch;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public async request<T>(
    path: string,
    options: RequestInit = {},
    overrideBaseUrl?: string,
  ): Promise<T> {
    const base = overrideBaseUrl ? overrideBaseUrl.replace(/\/$/, "") : this.baseUrl;
    const url = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? "" : "/"}${path}`;

    const headers = new Headers(options.headers || {});
    if (!headers.has("Accept")) {
      headers.set("Accept", "application/json");
    }
    if (this.token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${this.token}`);
    }

    const response = await this.customFetch(url, {
      ...options,
      headers,
    });

    const text = await response.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = text;
    }

    if (!response.ok) {
      const err = data as { error?: { code?: string; message?: string } };
      const code = err?.error?.code ?? `HTTP_${response.status}`;
      const message = err?.error?.message ?? `Request failed with status ${response.status}`;
      throw new Error(`[${code}] ${message}`);
    }

    return data as T;
  }
}
