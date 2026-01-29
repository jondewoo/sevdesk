const createCode = (code: string) => `@peerigon/sevdesk/${code}` as const;

export type UnknownApiErrorContext = {
  response: any;
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  body?: unknown;
};

export class UnknownApiError extends Error {
  code = createCode("UNKNOWN_API_ERROR");

  response: any;

  status?: number;

  statusText?: string;

  headers?: Record<string, string>;

  responseBody?: unknown;

  constructor(
    message = "Unknown API error",
    { response, status, statusText, headers, body }: UnknownApiErrorContext
  ) {
    super(message);
    this.response = response;
    this.status = status;
    this.statusText = statusText;
    this.headers = headers;
    this.responseBody = body;
  }
}

/**
 * Shape of the JSON body returned by SevDesk when rate limited (HTTP 429).
 * @see https://my.sevdesk.de (security / rate limit response)
 */
export type RateLimitResponseBody = {
  code: string;
  contact: string;
  reason: string;
  recommendation: string;
};

export type RateLimitErrorContext = UnknownApiErrorContext & {
  retryAfter: number;
  rateLimitBody: RateLimitResponseBody;
};

/**
 * Thrown when the API returns HTTP 429 Too Many Requests (rate limit).
 * Consumers can use `retryAfter` (seconds) to wait before retrying and
 * `rateLimitBody` for the API’s message (reason, recommendation, contact).
 */
export class RateLimitError extends UnknownApiError {
  code = createCode("RATE_LIMIT_ERROR");

  /** Seconds to wait before retrying (from `Retry-After` header). */
  retryAfter: number;

  /** Parsed rate limit response body (code, contact, reason, recommendation). */
  rateLimitBody: RateLimitResponseBody;

  constructor(
    message: string,
    {
      response,
      status,
      statusText,
      headers,
      body,
      retryAfter,
      rateLimitBody,
    }: RateLimitErrorContext
  ) {
    super(message, { response, status, statusText, headers, body });
    this.retryAfter = retryAfter;
    this.rateLimitBody = rateLimitBody;
  }
}
