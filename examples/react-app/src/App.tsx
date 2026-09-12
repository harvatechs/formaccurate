import React, { useState } from "react";
import { FormAccurateProvider, useFormAccurate } from "@formaccurate/react";
import type { SubmissionReceipt } from "@formaccurate/core";
import { businessPermitSchema } from "./schema.js";

function BusinessPermitForm() {
  const { formId, values, errors, isSubmitting, setValues, validate, submit } =
    useFormAccurate();

  const [receipt, setReceipt] = useState<SubmissionReceipt | null>(null);

  const getFieldError = (fieldId: string) => {
    return errors.find((e) => e.fieldId === fieldId)?.message;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await submit({ consent: { confirmed: true } });
      setReceipt(result);
    } catch (err) {
      console.error("Submission failed:", err);
    }
  };

  return (
    <div style={{ background: "white", padding: 32, borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0" }}>
      <div style={{ marginBottom: 24, borderBottom: "1px solid #f1f5f9", paddingBottom: 16 }}>
        <h2 style={{ margin: "0 0 8px 0", color: "#0f172a", fontSize: "1.4rem" }}>
          {businessPermitSchema.title}
        </h2>
        <p style={{ margin: 0, color: "#64748b", fontSize: "0.95rem" }}>
          {businessPermitSchema.description}
        </p>
      </div>

      {receipt ? (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: 24, color: "#166534" }}>
          <h3 style={{ margin: "0 0 12px 0", fontSize: "1.2rem" }}>✓ Application Submitted Successfully!</h3>
          <p style={{ margin: "0 0 8px 0" }}><strong>Submission ID:</strong> <code>{receipt.submissionId}</code></p>
          <p style={{ margin: "0 0 8px 0" }}><strong>Timestamp:</strong> <code>{receipt.receivedAt}</code></p>
          <p style={{ margin: "0 0 16px 0", wordBreak: "break-all" }}><strong>SHA-256 Checksum:</strong> <code>{receipt.checksum}</code></p>
          <button
            type="button"
            onClick={() => { setReceipt(null); }}
            style={{ background: "#16a34a", color: "white", border: "none", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}
          >
            Submit Another Application
          </button>
        </div>
      ) : (
        <form data-fa-form={formId} onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: "0.9rem", color: "#334155" }}>
              Legal Business Name *
            </label>
            <input
              data-fa-field="businessName"
              type="text"
              value={(values.businessName as string) ?? ""}
              onChange={(e) => setValues({ businessName: e.target.value })}
              placeholder="e.g. Acme Enterprises LLC"
              style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.95rem" }}
            />
            {getFieldError("businessName") && (
              <span style={{ color: "#ef4444", fontSize: "0.85rem", marginTop: 4, display: "block" }}>
                {getFieldError("businessName")}
              </span>
            )}
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: "0.9rem", color: "#334155" }}>
              Entity Structure *
            </label>
            <select
              data-fa-field="entityType"
              value={(values.entityType as string) ?? ""}
              onChange={(e) => setValues({ entityType: e.target.value })}
              style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.95rem", background: "white" }}
            >
              <option value="">-- Select entity type --</option>
              <option value="llc">Limited Liability Company (LLC)</option>
              <option value="corp">Corporation (C-Corp or S-Corp)</option>
              <option value="soleProp">Sole Proprietorship</option>
              <option value="nonProfit">501(c)(3) Non-Profit</option>
            </select>
            {getFieldError("entityType") && (
              <span style={{ color: "#ef4444", fontSize: "0.85rem", marginTop: 4, display: "block" }}>
                {getFieldError("entityType")}
              </span>
            )}
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: "0.9rem", color: "#334155" }}>
              Federal Employer ID (EIN) *
            </label>
            <input
              data-fa-field="taxId"
              type="text"
              value={(values.taxId as string) ?? ""}
              onChange={(e) => setValues({ taxId: e.target.value })}
              placeholder="12-3456789"
              style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.95rem" }}
            />
            {getFieldError("taxId") && (
              <span style={{ color: "#ef4444", fontSize: "0.85rem", marginTop: 4, display: "block" }}>
                {getFieldError("taxId")}
              </span>
            )}
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: "0.9rem", color: "#334155" }}>
              Primary Contact Email *
            </label>
            <input
              data-fa-field="primaryContactEmail"
              type="email"
              value={(values.primaryContactEmail as string) ?? ""}
              onChange={(e) => setValues({ primaryContactEmail: e.target.value })}
              placeholder="authorized@company.com"
              style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.95rem" }}
            />
            {getFieldError("primaryContactEmail") && (
              <span style={{ color: "#ef4444", fontSize: "0.85rem", marginTop: 4, display: "block" }}>
                {getFieldError("primaryContactEmail")}
              </span>
            )}
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: "0.9rem", color: "#334155" }}>
              Estimated Full-Time Employees *
            </label>
            <input
              data-fa-field="estimatedEmployees"
              type="number"
              value={(values.estimatedEmployees as number) ?? ""}
              onChange={(e) => setValues({ estimatedEmployees: Number(e.target.value) })}
              style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.95rem" }}
            />
            {getFieldError("estimatedEmployees") && (
              <span style={{ color: "#ef4444", fontSize: "0.85rem", marginTop: 4, display: "block" }}>
                {getFieldError("estimatedEmployees")}
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input
              data-fa-field="hasPhysicalStorefront"
              type="checkbox"
              id="hasPhysicalStorefront"
              checked={Boolean(values.hasPhysicalStorefront)}
              onChange={(e) => setValues({ hasPhysicalStorefront: e.target.checked })}
              style={{ width: 18, height: 18 }}
            />
            <label htmlFor="hasPhysicalStorefront" style={{ fontWeight: 500, fontSize: "0.9rem", color: "#334155" }}>
              Physical retail location or customer-facing office
            </label>
          </div>

          {values.hasPhysicalStorefront === true && (
            <div style={{ background: "#f8fafc", padding: 16, borderRadius: 8, border: "1px solid #e2e8f0" }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: "0.9rem", color: "#334155" }}>
                Operating Facility Square Footage *
              </label>
              <input
                data-fa-field="squareFootage"
                type="number"
                value={(values.squareFootage as number) ?? ""}
                onChange={(e) => setValues({ squareFootage: Number(e.target.value) })}
                style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.95rem" }}
              />
              {getFieldError("squareFootage") && (
                <span style={{ color: "#ef4444", fontSize: "0.85rem", marginTop: 4, display: "block" }}>
                  {getFieldError("squareFootage")}
                </span>
              )}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 8 }}>
            <input
              data-fa-field="confirmTruthful"
              type="checkbox"
              id="confirmTruthful"
              checked={Boolean(values.confirmTruthful)}
              onChange={(e) => setValues({ confirmTruthful: e.target.checked })}
              style={{ width: 18, height: 18, marginTop: 2 }}
            />
            <label htmlFor="confirmTruthful" style={{ fontSize: "0.88rem", color: "#475569", lineHeight: 1.4 }}>
              I declare under penalty of perjury that the statements made herein are true and correct.
            </label>
          </div>
          {getFieldError("confirmTruthful") && (
            <span style={{ color: "#ef4444", fontSize: "0.85rem" }}>
              {getFieldError("confirmTruthful")}
            </span>
          )}

          <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
            <button
              type="button"
              onClick={() => validate()}
              style={{ flex: 1, padding: "12px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#f8fafc", color: "#334155", fontWeight: 600, cursor: "pointer" }}
            >
              Validate
            </button>
            <button
              type="submit"
              data-fa-action="submit"
              disabled={isSubmitting}
              style={{ flex: 2, padding: "12px", borderRadius: 8, border: "none", background: "#4f46e5", color: "white", fontWeight: 600, cursor: "pointer" }}
            >
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function AgentSimulator() {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleInspect = () => {
    if (!window.FormAccurate) return;
    const forms = window.FormAccurate.listForms();
    addLog(`Discovered ${forms.length} form(s): ${forms.map((f) => f.formId).join(", ")}`);
    const schema = window.FormAccurate.getSchema("business-permit-application");
    addLog(`Read schema: "${schema.title}" (${schema.fields.length} fields)`);
  };

  const handleFill = () => {
    if (!window.FormAccurate) return;
    addLog("Agent writing values via window.FormAccurate.setValues()...");
    window.FormAccurate.setValues("business-permit-application", {
      businessName: "Nexus Robotics Corp",
      entityType: "corp",
      taxId: "88-1234567",
      primaryContactEmail: "compliance@nexus.tech",
      estimatedEmployees: 120,
      hasPhysicalStorefront: true,
      squareFootage: 15000,
      confirmTruthful: true,
    });
    addLog("Values written. Human React form synced in real time!");
  };

  const handleValidate = () => {
    if (!window.FormAccurate) return;
    addLog("Agent validating form state via bridge...");
    const state = window.FormAccurate.validate("business-permit-application");
    addLog(`Validation complete: status=${state.status}, errors=${state.errors.length}`);
  };

  const handleSubmit = async () => {
    if (!window.FormAccurate) return;
    addLog("Agent submitting form with consent confirmation...");
    try {
      const receipt = await window.FormAccurate.submit("business-permit-application", {
        consent: { confirmed: true },
      });
      addLog(`>>> SUCCESS! Submission ID: ${receipt.submissionId}`);
      addLog(`SHA256 Checksum: ${receipt.checksum}`);
    } catch (err: unknown) {
      addLog(`Submission failed: ${(err as Error).message}`);
    }
  };

  return (
    <div style={{ background: "#0f172a", color: "#f8fafc", padding: 24, borderRadius: 16, display: "flex", flexDirection: "column", height: "100%", boxSizing: "border-box" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, borderBottom: "1px solid #334155", paddingBottom: 12 }}>
        <h3 style={{ margin: 0, color: "#38bdf8", fontSize: "1.1rem" }}>🤖 Simulated Browser Agent</h3>
        <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>window.FormAccurate</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        <button
          type="button"
          onClick={handleInspect}
          style={{ background: "#1e293b", border: "1px solid #475569", color: "#e2e8f0", padding: "10px", borderRadius: 8, cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}
        >
          1. Inspect Schema
        </button>
        <button
          type="button"
          onClick={handleFill}
          style={{ background: "#1e293b", border: "1px solid #475569", color: "#e2e8f0", padding: "10px", borderRadius: 8, cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}
        >
          2. Agent Auto-Fill
        </button>
        <button
          type="button"
          onClick={handleValidate}
          style={{ background: "#1e293b", border: "1px solid #475569", color: "#e2e8f0", padding: "10px", borderRadius: 8, cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}
        >
          3. Validate State
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          style={{ background: "#38bdf8", border: "none", color: "#0f172a", padding: "10px", borderRadius: 8, cursor: "pointer", fontSize: "0.85rem", fontWeight: 700 }}
        >
          4. Submit & Receipt
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 220, background: "#020617", border: "1px solid #1e293b", borderRadius: 8, padding: 12, fontFamily: "monospace", fontSize: "0.82rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
        {logs.length === 0 ? (
          <span style={{ color: "#64748b" }}>Console logs will appear here when agent actions run...</span>
        ) : (
          logs.map((log, i) => (
            <div key={i} style={{ color: log.includes("SUCCESS") ? "#4ade80" : log.includes("Error") ? "#f87171" : "#93c5fd" }}>
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function App() {
  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", maxWidth: 1200, margin: "40px auto", padding: "0 20px" }}>
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ color: "#0f172a", fontSize: "2rem", margin: "0 0 8px 0" }}>
          FormAccurate React Integration
        </h1>
        <p style={{ color: "#64748b", margin: 0, fontSize: "1.05rem" }}>
          Same schema, same state machine. Side-by-side human form and autonomous browser agent bridge.
        </p>
      </header>

      <FormAccurateProvider formId="business-permit-application" schema={businessPermitSchema} debug={true}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "start" }}>
          <BusinessPermitForm />
          <AgentSimulator />
        </div>
      </FormAccurateProvider>
    </div>
  );
}
