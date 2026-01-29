/**
 * Experiment script to provoke API rate limits and log the improved error
 * diagnostics (status, headers, responseBody) from UnknownApiError.
 *
 * Run with: npm run env -- node scripts/provoke-rate-limit.ts
 * (Requires TEST_SEVDESK_API_TOKEN or SEVDESK_API_KEY in env or .env)
 */

import { SevDeskClient } from "../src/node.js";
import { RateLimitError, UnknownApiError } from "../src/errors.js";

const MAX_REQUESTS = 5000;
const PARALLEL_REQUESTS = 5;
const LOG_EVERY_N = 50;
const TAG_NAME = "invoice_id:lBQx508dHSzkt-mCCDI-7";

const apiKey =
  process.env.SEVDESK_API_KEY ?? process.env.TEST_SEVDESK_API_TOKEN ?? "";

if (!apiKey) {
  console.error(
    "Missing API key. Set SEVDESK_API_KEY or TEST_SEVDESK_API_TOKEN in env or .env"
  );
  process.exit(1);
}

const client = new SevDeskClient({ apiKey });

const main = async () => {
  console.log(
    `Sending up to ${MAX_REQUESTS} requests (${PARALLEL_REQUESTS} in parallel, getTagWithName("${TAG_NAME}"))...`
  );
  console.log("Press Ctrl+C to stop early.\n");

  let completed = 0;

  for (let offset = 0; offset < MAX_REQUESTS; offset += PARALLEL_REQUESTS) {
    const batchSize = Math.min(PARALLEL_REQUESTS, MAX_REQUESTS - offset);
    const batch = Array.from({ length: batchSize }, async () =>
      client.getTagWithName(TAG_NAME)
    );

    // Process batches of PARALLEL_REQUESTS to provoke rate limit
    // eslint-disable-next-line no-await-in-loop
    const results = await Promise.allSettled(batch);

    for (const result of results) {
      if (result.status === "rejected") {
        const err = result.reason;

        if (err instanceof RateLimitError) {
          console.error("\n--- RateLimitError (typed rate limit) ---");
          console.error("message:", err.message);
          console.error("retryAfter (seconds):", err.retryAfter);
          console.error("rateLimitBody.code:", err.rateLimitBody.code);
          console.error("rateLimitBody.reason:", err.rateLimitBody.reason);
          console.error(
            "rateLimitBody.recommendation:",
            err.rateLimitBody.recommendation
          );
          console.error("rateLimitBody.contact:", err.rateLimitBody.contact);
          console.error("---");
          console.error(`Failed after ${completed + 1} request(s).`);
          process.exit(1);
        }

        if (err instanceof UnknownApiError) {
          console.error("\n--- UnknownApiError (improved diagnostics) ---");
          console.error("message:", err.message);
          console.error("status:", err.status);
          console.error("statusText:", err.statusText);
          console.error("headers:", JSON.stringify(err.headers, null, 2));
          if (err.headers?.["retry-after"]) {
            console.error("retry-after:", err.headers["retry-after"]);
          }
          console.error(
            "responseBody:",
            JSON.stringify(err.responseBody, null, 2)
          );
          console.error("---");
          console.error(`Failed after ${completed + 1} request(s).`);
          process.exit(1);
        }
        throw err;
      }

      completed += 1;
    }

    if (
      (completed % LOG_EVERY_N === 0 && completed > 0) ||
      completed === MAX_REQUESTS
    ) {
      console.log(`  ${completed} requests completed`);
    }
  }

  console.log(`\nCompleted ${MAX_REQUESTS} requests without hitting a limit.`);
};

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
