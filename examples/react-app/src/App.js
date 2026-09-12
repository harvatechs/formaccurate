import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { FormAccurateProvider, useFormAccurate } from "@formaccurate/react";
import { businessPermitSchema } from "./schema.js";
function BusinessPermitForm() {
    const { formId, values, errors, isValid, isSubmitting, setValues, validate, submit } = useFormAccurate();
    const [receipt, setReceipt] = useState(null);
    const getFieldError = (fieldId) => {
        return errors.find((e) => e.fieldId === fieldId)?.message;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const result = await submit({ consent: { confirmed: true } });
            setReceipt(result);
        }
        catch (err) {
            console.error("Submission failed:", err);
        }
    };
    return (_jsxs("div", { style: { background: "white", padding: 32, borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0" }, children: [_jsxs("div", { style: { marginBottom: 24, borderBottom: "1px solid #f1f5f9", paddingBottom: 16 }, children: [_jsx("h2", { style: { margin: "0 0 8px 0", color: "#0f172a", fontSize: "1.4rem" }, children: businessPermitSchema.title }), _jsx("p", { style: { margin: 0, color: "#64748b", fontSize: "0.95rem" }, children: businessPermitSchema.description })] }), receipt ? (_jsxs("div", { style: { background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: 24, color: "#166534" }, children: [_jsx("h3", { style: { margin: "0 0 12px 0", fontSize: "1.2rem" }, children: "\u2713 Application Submitted Successfully!" }), _jsxs("p", { style: { margin: "0 0 8px 0" }, children: [_jsx("strong", { children: "Submission ID:" }), " ", _jsx("code", { children: receipt.submissionId })] }), _jsxs("p", { style: { margin: "0 0 8px 0" }, children: [_jsx("strong", { children: "Timestamp:" }), " ", _jsx("code", { children: receipt.receivedAt })] }), _jsxs("p", { style: { margin: "0 0 16px 0", wordBreak: "break-all" }, children: [_jsx("strong", { children: "SHA-256 Checksum:" }), " ", _jsx("code", { children: receipt.checksum })] }), _jsx("button", { type: "button", onClick: () => { setReceipt(null); }, style: { background: "#16a34a", color: "white", border: "none", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontWeight: 600 }, children: "Submit Another Application" })] })) : (_jsxs("form", { "data-fa-form": formId, onSubmit: handleSubmit, style: { display: "flex", flexDirection: "column", gap: 18 }, children: [_jsxs("div", { children: [_jsx("label", { style: { display: "block", marginBottom: 6, fontWeight: 600, fontSize: "0.9rem", color: "#334155" }, children: "Legal Business Name *" }), _jsx("input", { "data-fa-field": "businessName", type: "text", value: values.businessName ?? "", onChange: (e) => setValues({ businessName: e.target.value }), placeholder: "e.g. Acme Enterprises LLC", style: { width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.95rem" } }), getFieldError("businessName") && (_jsx("span", { style: { color: "#ef4444", fontSize: "0.85rem", marginTop: 4, display: "block" }, children: getFieldError("businessName") }))] }), _jsxs("div", { children: [_jsx("label", { style: { display: "block", marginBottom: 6, fontWeight: 600, fontSize: "0.9rem", color: "#334155" }, children: "Entity Structure *" }), _jsxs("select", { "data-fa-field": "entityType", value: values.entityType ?? "", onChange: (e) => setValues({ entityType: e.target.value }), style: { width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.95rem", background: "white" }, children: [_jsx("option", { value: "", children: "-- Select entity type --" }), _jsx("option", { value: "llc", children: "Limited Liability Company (LLC)" }), _jsx("option", { value: "corp", children: "Corporation (C-Corp or S-Corp)" }), _jsx("option", { value: "soleProp", children: "Sole Proprietorship" }), _jsx("option", { value: "nonProfit", children: "501(c)(3) Non-Profit" })] }), getFieldError("entityType") && (_jsx("span", { style: { color: "#ef4444", fontSize: "0.85rem", marginTop: 4, display: "block" }, children: getFieldError("entityType") }))] }), _jsxs("div", { children: [_jsx("label", { style: { display: "block", marginBottom: 6, fontWeight: 600, fontSize: "0.9rem", color: "#334155" }, children: "Federal Employer ID (EIN) *" }), _jsx("input", { "data-fa-field": "taxId", type: "text", value: values.taxId ?? "", onChange: (e) => setValues({ taxId: e.target.value }), placeholder: "12-3456789", style: { width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.95rem" } }), getFieldError("taxId") && (_jsx("span", { style: { color: "#ef4444", fontSize: "0.85rem", marginTop: 4, display: "block" }, children: getFieldError("taxId") }))] }), _jsxs("div", { children: [_jsx("label", { style: { display: "block", marginBottom: 6, fontWeight: 600, fontSize: "0.9rem", color: "#334155" }, children: "Primary Contact Email *" }), _jsx("input", { "data-fa-field": "primaryContactEmail", type: "email", value: values.primaryContactEmail ?? "", onChange: (e) => setValues({ primaryContactEmail: e.target.value }), placeholder: "authorized@company.com", style: { width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.95rem" } }), getFieldError("primaryContactEmail") && (_jsx("span", { style: { color: "#ef4444", fontSize: "0.85rem", marginTop: 4, display: "block" }, children: getFieldError("primaryContactEmail") }))] }), _jsxs("div", { children: [_jsx("label", { style: { display: "block", marginBottom: 6, fontWeight: 600, fontSize: "0.9rem", color: "#334155" }, children: "Estimated Full-Time Employees *" }), _jsx("input", { "data-fa-field": "estimatedEmployees", type: "number", value: values.estimatedEmployees ?? "", onChange: (e) => setValues({ estimatedEmployees: Number(e.target.value) }), style: { width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.95rem" } }), getFieldError("estimatedEmployees") && (_jsx("span", { style: { color: "#ef4444", fontSize: "0.85rem", marginTop: 4, display: "block" }, children: getFieldError("estimatedEmployees") }))] }), _jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10 }, children: [_jsx("input", { "data-fa-field": "hasPhysicalStorefront", type: "checkbox", id: "hasPhysicalStorefront", checked: Boolean(values.hasPhysicalStorefront), onChange: (e) => setValues({ hasPhysicalStorefront: e.target.checked }), style: { width: 18, height: 18 } }), _jsx("label", { htmlFor: "hasPhysicalStorefront", style: { fontWeight: 500, fontSize: "0.9rem", color: "#334155" }, children: "Physical retail location or customer-facing office" })] }), values.hasPhysicalStorefront === true && (_jsxs("div", { style: { background: "#f8fafc", padding: 16, borderRadius: 8, border: "1px solid #e2e8f0" }, children: [_jsx("label", { style: { display: "block", marginBottom: 6, fontWeight: 600, fontSize: "0.9rem", color: "#334155" }, children: "Operating Facility Square Footage *" }), _jsx("input", { "data-fa-field": "squareFootage", type: "number", value: values.squareFootage ?? "", onChange: (e) => setValues({ squareFootage: Number(e.target.value) }), style: { width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.95rem" } }), getFieldError("squareFootage") && (_jsx("span", { style: { color: "#ef4444", fontSize: "0.85rem", marginTop: 4, display: "block" }, children: getFieldError("squareFootage") }))] })), _jsxs("div", { style: { display: "flex", alignItems: "flex-start", gap: 10, marginTop: 8 }, children: [_jsx("input", { "data-fa-field": "confirmTruthful", type: "checkbox", id: "confirmTruthful", checked: Boolean(values.confirmTruthful), onChange: (e) => setValues({ confirmTruthful: e.target.checked }), style: { width: 18, height: 18, marginTop: 2 } }), _jsx("label", { htmlFor: "confirmTruthful", style: { fontSize: "0.88rem", color: "#475569", lineHeight: 1.4 }, children: "I declare under penalty of perjury that the statements made herein are true and correct." })] }), getFieldError("confirmTruthful") && (_jsx("span", { style: { color: "#ef4444", fontSize: "0.85rem" }, children: getFieldError("confirmTruthful") })), _jsxs("div", { style: { display: "flex", gap: 12, marginTop: 12 }, children: [_jsx("button", { type: "button", onClick: () => validate(), style: { flex: 1, padding: "12px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#f8fafc", color: "#334155", fontWeight: 600, cursor: "pointer" }, children: "Validate" }), _jsx("button", { type: "submit", "data-fa-action": "submit", disabled: isSubmitting, style: { flex: 2, padding: "12px", borderRadius: 8, border: "none", background: "#4f46e5", color: "white", fontWeight: 600, cursor: "pointer" }, children: isSubmitting ? "Submitting..." : "Submit Application" })] })] }))] }));
}
function AgentSimulator() {
    const [logs, setLogs] = useState([]);
    const addLog = (msg) => {
        setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };
    const handleInspect = () => {
        if (!window.FormAccurate)
            return;
        const forms = window.FormAccurate.listForms();
        addLog(`Discovered ${forms.length} form(s): ${forms.map((f) => f.formId).join(", ")}`);
        const schema = window.FormAccurate.getSchema("business-permit-application");
        addLog(`Read schema: "${schema.title}" (${schema.fields.length} fields)`);
    };
    const handleFill = () => {
        if (!window.FormAccurate)
            return;
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
        if (!window.FormAccurate)
            return;
        addLog("Agent validating form state via bridge...");
        const state = window.FormAccurate.validate("business-permit-application");
        addLog(`Validation complete: status=${state.status}, errors=${state.errors.length}`);
    };
    const handleSubmit = async () => {
        if (!window.FormAccurate)
            return;
        addLog("Agent submitting form with consent confirmation...");
        try {
            const receipt = await window.FormAccurate.submit("business-permit-application", {
                consent: { confirmed: true },
            });
            addLog(`>>> SUCCESS! Submission ID: ${receipt.submissionId}`);
            addLog(`SHA256 Checksum: ${receipt.checksum}`);
        }
        catch (err) {
            addLog(`Submission failed: ${err.message}`);
        }
    };
    return (_jsxs("div", { style: { background: "#0f172a", color: "#f8fafc", padding: 24, borderRadius: 16, display: "flex", flexDirection: "column", height: "100%", boxSizing: "border-box" }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, borderBottom: "1px solid #334155", paddingBottom: 12 }, children: [_jsx("h3", { style: { margin: 0, color: "#38bdf8", fontSize: "1.1rem" }, children: "\uD83E\uDD16 Simulated Browser Agent" }), _jsx("span", { style: { fontSize: "0.8rem", color: "#94a3b8" }, children: "window.FormAccurate" })] }), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }, children: [_jsx("button", { type: "button", onClick: handleInspect, style: { background: "#1e293b", border: "1px solid #475569", color: "#e2e8f0", padding: "10px", borderRadius: 8, cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }, children: "1. Inspect Schema" }), _jsx("button", { type: "button", onClick: handleFill, style: { background: "#1e293b", border: "1px solid #475569", color: "#e2e8f0", padding: "10px", borderRadius: 8, cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }, children: "2. Agent Auto-Fill" }), _jsx("button", { type: "button", onClick: handleValidate, style: { background: "#1e293b", border: "1px solid #475569", color: "#e2e8f0", padding: "10px", borderRadius: 8, cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }, children: "3. Validate State" }), _jsx("button", { type: "button", onClick: handleSubmit, style: { background: "#38bdf8", border: "none", color: "#0f172a", padding: "10px", borderRadius: 8, cursor: "pointer", fontSize: "0.85rem", fontWeight: 700 }, children: "4. Submit & Receipt" })] }), _jsx("div", { style: { flex: 1, minHeight: 220, background: "#020617", border: "1px solid #1e293b", borderRadius: 8, padding: 12, fontFamily: "monospace", fontSize: "0.82rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }, children: logs.length === 0 ? (_jsx("span", { style: { color: "#64748b" }, children: "Console logs will appear here when agent actions run..." })) : (logs.map((log, i) => (_jsx("div", { style: { color: log.includes("SUCCESS") ? "#4ade80" : log.includes("Error") ? "#f87171" : "#93c5fd" }, children: log }, i)))) })] }));
}
export function App() {
    return (_jsxs("div", { style: { fontFamily: "system-ui, -apple-system, sans-serif", maxWidth: 1200, margin: "40px auto", padding: "0 20px" }, children: [_jsxs("header", { style: { marginBottom: 32 }, children: [_jsx("h1", { style: { color: "#0f172a", fontSize: "2rem", margin: "0 0 8px 0" }, children: "FormAccurate React Integration" }), _jsx("p", { style: { color: "#64748b", margin: 0, fontSize: "1.05rem" }, children: "Same schema, same state machine. Side-by-side human form and autonomous browser agent bridge." })] }), _jsx(FormAccurateProvider, { formId: "business-permit-application", schema: businessPermitSchema, debug: true, children: _jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "start" }, children: [_jsx(BusinessPermitForm, {}), _jsx(AgentSimulator, {})] }) })] }));
}
