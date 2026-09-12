import type { Context } from "hono";
import type { StorageAdapter } from "../storage/adapter.js";

export async function handleGetReceipt(
  c: Context,
  storage: StorageAdapter,
): Promise<Response> {
  const submissionId = c.req.param("submissionId");
  if (!submissionId) {
    return c.json(
      { error: { code: "receipt_not_found", message: "Submission ID is required" } },
      404,
    );
  }
  const receipt = await storage.getSubmission(submissionId);

  if (!receipt) {
    return c.json(
      {
        error: {
          code: "receipt_not_found",
          message: `Submission receipt '${submissionId}' was not found`,
        },
      },
      404,
    );
  }

  return c.json(receipt, 200);
}
