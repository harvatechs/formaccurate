import type { Context } from "hono";
import type { AgentFormSchema, FileField } from "@formaccurate/core";
import type { StorageAdapter } from "../storage/adapter.js";

export async function handleFileUpload(
  c: Context,
  formMap: Map<string, AgentFormSchema>,
  storage: StorageAdapter,
): Promise<Response> {
  const formId = c.req.param("formId");
  if (!formId) {
    return c.json(
      { error: { code: "form_not_found", message: "Form ID is required" } },
      404,
    );
  }
  const schema = formMap.get(formId);

  if (!schema) {
    return c.json(
      { error: { code: "form_not_found", message: `Form '${formId}' was not found` } },
      404,
    );
  }

  let fieldId: string | undefined;
  let filename = "upload.bin";
  let sizeBytes = 0;
  let mimeType = "application/octet-stream";

  const contentType = c.req.header("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      const json = await c.req.json();
      fieldId = json.fieldId;
      filename = json.filename || filename;
      sizeBytes = Number(json.sizeBytes || 0);
      mimeType = json.mimeType || mimeType;
    } catch {
      return c.json(
        { error: { code: "invalid_request", message: "Malformed JSON body" } },
        400,
      );
    }
  } else if (contentType.includes("multipart/form-data")) {
    try {
      const formData = await c.req.formData();
      fieldId = (formData.get("fieldId") as string) || undefined;
      const fileEntry = formData.get("file");
      if (fileEntry instanceof File) {
        filename = fileEntry.name;
        sizeBytes = fileEntry.size;
        mimeType = fileEntry.type || mimeType;
      }
    } catch {
      return c.json(
        { error: { code: "invalid_request", message: "Failed to parse multipart form data" } },
        400,
      );
    }
  } else {
    return c.json(
      {
        error: {
          code: "invalid_content_type",
          message: "Content-Type must be application/json or multipart/form-data",
        },
      },
      400,
    );
  }

  if (!fieldId) {
    return c.json(
      { error: { code: "missing_field_id", message: "fieldId is required" } },
      400,
    );
  }

  const targetField = schema.fields.find((f) => f.id === fieldId);
  if (!targetField || (targetField.type !== "file" && targetField.type !== "signature")) {
    return c.json(
      {
        error: {
          code: "invalid_field",
          message: `Field '${fieldId}' is not a valid file or signature field`,
        },
      },
      400,
    );
  }

  if (targetField.type === "file") {
    const fileField = targetField as FileField;
    const maxSizeBytes = fileField.maxSizeMb * 1024 * 1024;
    if (sizeBytes > maxSizeBytes) {
      return c.json(
        {
          error: {
            code: "file_too_large",
            message: `File size (${sizeBytes} bytes) exceeds limit of ${fileField.maxSizeMb} MB`,
          },
        },
        400,
      );
    }

    if (
      fileField.accept &&
      fileField.accept.length > 0 &&
      !fileField.accept.includes(mimeType) &&
      !fileField.accept.includes("*/*")
    ) {
      return c.json(
        {
          error: {
            code: "invalid_mime_type",
            message: `MIME type '${mimeType}' is not allowed for field '${fieldId}'. Allowed: ${fileField.accept.join(", ")}`,
          },
        },
        400,
      );
    }
  }

  const record = await storage.saveFile(formId, fieldId, {
    filename,
    sizeBytes,
    mimeType,
  });

  return c.json(
    {
      fileToken: record.fileToken,
      fieldId: record.fieldId,
      filename: record.filename,
      sizeBytes: record.sizeBytes,
      expiresAt: record.expiresAt,
    },
    200,
  );
}
