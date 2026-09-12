import { z } from "zod";
import type { FormAccurateHttpClient } from "../client.js";

export const getReceiptSchema = {
  submissionId: z.string().describe("The unique submission ID of the receipt."),
};

export const GET_RECEIPT_DESCRIPTION =
  "Retrieves a previously issued verifiable submission receipt by its submission ID.";

export async function handleGetReceipt(
  client: FormAccurateHttpClient,
  args: { submissionId: string },
): Promise<unknown> {
  return client.request(`/receipts/${encodeURIComponent(args.submissionId)}`, {
    method: "GET",
  });
}
