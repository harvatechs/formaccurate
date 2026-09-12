<script setup lang="ts">
import { ref, computed } from "vue";
import { withBase } from "vitepress";

// Copy snippet helper
const copiedText = ref("");
function copyCode(text: string, id: string) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text);
    copiedText.value = id;
    setTimeout(() => {
      copiedText.value = "";
    }, 2000);
  }
}

// Comparison toggle state
const comparisonMode = ref<"formaccurate" | "vision">("formaccurate");

// Live Agent Simulation Playground State
const simState = ref({
  step: 0,
  isRunning: false,
  legalName: "",
  jurisdiction: "",
  documentUploaded: false,
  confirmedConsent: false,
  submissionId: "",
  receiptHash: "",
  log: [] as string[],
});

function resetSim() {
  simState.value = {
    step: 0,
    isRunning: false,
    legalName: "",
    jurisdiction: "",
    documentUploaded: false,
    confirmedConsent: false,
    submissionId: "",
    receiptHash: "",
    log: ["Ready for autonomous agent session."],
  };
}

// Initial state
resetSim();

async function runAgentSimulation() {
  if (simState.value.isRunning) return;
  resetSim();
  simState.value.isRunning = true;

  // Step 1: Discover
  simState.value.step = 1;
  simState.value.log.push(
    "GET /.well-known/formaccurate.json -> 200 OK (Found 'operating-permit')",
  );
  await new Promise((r) => setTimeout(r, 700));

  // Step 2: Init session
  simState.value.step = 2;
  simState.value.log.push(
    "POST /agent/forms/operating-permit/sessions -> Created session 'sess_01M2A99'",
  );
  await new Promise((r) => setTimeout(r, 700));

  // Step 3: Fill fields
  simState.value.step = 3;
  simState.value.legalName = "Acme Autonomous Robotics Inc.";
  simState.value.jurisdiction = "California (US-CA)";
  simState.value.documentUploaded = true;
  simState.value.log.push(
    "PATCH /agent/forms/operating-permit/sessions/sess_01M2A99 -> Applied 3 values",
  );
  await new Promise((r) => setTimeout(r, 800));

  // Step 4: Validate and legal attestation
  simState.value.step = 4;
  simState.value.confirmedConsent = true;
  simState.value.log.push("POST /validate -> Valid (Attestation signature confirmed)");
  await new Promise((r) => setTimeout(r, 700));

  // Step 5: Submit & Generate Receipt
  simState.value.step = 5;
  simState.value.submissionId = "sub_01M2A78FTEK02A";
  simState.value.receiptHash =
    "sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069";
  simState.value.log.push("POST /submit -> 201 Created. Cryptographic receipt issued.");
  simState.value.isRunning = false;
}

// Architecture packages tabs
const activePackage = ref("core");
const packages = [
  {
    id: "core",
    name: "@formaccurate/core",
    badge: "Pure TypeScript",
    runtime: "Zero I/O • Universal",
    size: "31 kB",
    desc: "The source of truth. Canonical Zod schemas, validation engine, state machine, JSON Schema export, and SHA-256 verifiable receipt generation.",
    install: "pnpm add @formaccurate/core",
    code: `import { validateForm, FormSchema } from "@formaccurate/core";

const schema: FormSchema = {
  $schema: "https://formaccurate.dev/schema/v1.json",
  formId: "vendor-onboarding",
  version: "1.0.0",
  title: "Vendor Onboarding",
  fields: [
    { id: "taxId", type: "string", label: "Tax ID", required: true }
  ],
  actions: { submit: { label: "Submit" } }
};

const result = validateForm(schema, { taxId: "12-3456789" });
console.log(result.isValid); // true`,
  },
  {
    id: "web",
    name: "@formaccurate/web",
    badge: "Browser Bridge",
    runtime: "HTML5 • DOM",
    size: "97 kB",
    desc: "Lightweight browser SDK that progressively enhances existing forms via data-fa-* attributes and exposes window.FormAccurate to browser agents.",
    install: "pnpm add @formaccurate/web",
    code: `import { initFormAccurate } from "@formaccurate/web";

// Binds all forms with data-fa-form attributes
const bridge = initFormAccurate();

// In-page agent execution:
const schema = window.FormAccurate.getSchema("vendor-onboarding");
window.FormAccurate.setValues("vendor-onboarding", { taxId: "12-3456789" });
const { receipt } = await window.FormAccurate.submit("vendor-onboarding");`,
  },
  {
    id: "server",
    name: "@formaccurate/server",
    badge: "HTTP Layer",
    runtime: "Hono • Node / Edge",
    size: "20 kB",
    desc: "Standards-based HTTP server mounting discovery endpoints (/.well-known/formaccurate.json), schema routes, session states, and pluggable storage.",
    install: "pnpm add @formaccurate/server",
    code: `import { Hono } from "hono";
import { createFormAccurateServer, MemoryStorageAdapter } from "@formaccurate/server";
import { vendorSchema } from "./schema";

const app = new Hono();

app.route("/", createFormAccurateServer({
  forms: [vendorSchema],
  storage: new MemoryStorageAdapter(),
}));

export default app;`,
  },
  {
    id: "react",
    name: "@formaccurate/react",
    badge: "UI Hook",
    runtime: "React 18+",
    size: "6.8 kB",
    desc: "First-class React components and hooks (<FormAccurateProvider>, useFormAccurate()) delivering instant reactive synchronization between humans and agents.",
    install: "pnpm add @formaccurate/react",
    code: `import { FormAccurateProvider, useFormAccurate } from "@formaccurate/react";

function OnboardingForm() {
  const { values, setValue, errors, isSubmitting, submit } = useFormAccurate();
  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
      <input value={values.taxId || ""} onChange={(e) => setValue("taxId", e.target.value)} />
      {errors.taxId && <span>{errors.taxId[0].message}</span>}
      <button disabled={isSubmitting}>Submit</button>
    </form>
  );
}`,
  },
  {
    id: "mcp",
    name: "@formaccurate/mcp",
    badge: "AI Agent Protocol",
    runtime: "Model Context Protocol",
    size: "9.2 kB",
    desc: "Official Model Context Protocol server exposing 7 static agent tools with prompt-injection defenses for Claude Desktop, Cursor, and custom agent runtimes.",
    install: "npx @formaccurate/mcp",
    code: `// claude_desktop_config.json / cursor mcp config:
{
  "mcpServers": {
    "formaccurate": {
      "command": "npx",
      "args": ["-y", "@formaccurate/mcp"],
      "env": {
        "FORMACCURATE_SERVER_URL": "https://api.yourdomain.com"
      }
    }
  }
}`,
  },
  {
    id: "cli",
    name: "@formaccurate/cli",
    badge: "Developer CLI",
    runtime: "Node CLI",
    size: "8.8 kB",
    desc: "High-speed command-line tooling for schema authors and CI pipelines: fa lint (with precise JSON pointers), fa validate, and fa scaffold.",
    install: "npm install -g @formaccurate/cli",
    code: `# Lint a schema in CI
fa lint schemas/vendor-onboarding.json

# Offline payload validation
fa validate schemas/vendor-onboarding.json --values payload.json

# Scaffold a production-ready starter schema
fa scaffold my-new-application`,
  },
];

const currentPkg = computed(
  () => packages.find((p) => p.id === activePackage.value) || packages[0],
);

// Quickstart code tabs
const activeQuickstart = ref("html");
</script>

<template>
  <div class="landing-body">
    <!-- Ambient Branded Glow -->
    <div class="hero-ambient-glow"></div>

    <!-- Navigation Header -->
    <nav class="landing-nav">
      <div class="landing-nav-inner">
        <a :href="withBase('/')" class="landing-brand">
          <div class="landing-brand-logo">FA</div>
          <span>FormAccurate</span>
        </a>

        <div class="landing-nav-links">
          <a :href="withBase('/guide/getting-started')" class="landing-nav-link">Guide</a>
          <a :href="withBase('/spec/schema')" class="landing-nav-link">Protocol Specs</a>
          <a :href="withBase('/packages/core')" class="landing-nav-link">Packages</a>
          <a :href="withBase('/guide/security')" class="landing-nav-link">Security</a>
          <a
            href="https://github.com/harvatechs/formaccurate"
            target="_blank"
            rel="noreferrer"
            class="landing-nav-link"
          >
            GitHub
          </a>
        </div>

        <a :href="withBase('/guide/getting-started')" class="landing-nav-btn">
          <span>Documentation</span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M5 12h14"></path>
            <path d="m12 5 7 7-7 7"></path>
          </svg>
        </a>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-content">
        <div class="pill-badge">
          <span class="pill-dot"></span>
          <span>v0.1.0 Released on NPM & GitHub • Open Standard</span>
        </div>

        <h1 class="hero-title">
          Web forms were built for eyes.<br />
          <span class="gradient-text">AI agents have code.</span>
        </h1>

        <p class="hero-subtitle">
          FormAccurate gives web applications an opt-in, deterministic protocol to expose forms
          directly to AI agents. No vision models. No screenshots. No DOM guessing.
        </p>

        <!-- CTA & Quick Install -->
        <div class="hero-actions">
          <a :href="withBase('/guide/getting-started')" class="btn-primary">
            <span>Explore Documentation</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M5 12h14"></path>
              <path d="m12 5 7 7-7 7"></path>
            </svg>
          </a>

          <a href="#demo" class="btn-secondary">
            <span>Watch Live Simulator</span>
          </a>

          <div class="install-pill" @click="copyCode('pnpm add @formaccurate/web', 'hero-install')">
            <span class="code-text">pnpm add @formaccurate/web</span>
            <span class="copy-badge">{{ copiedText === "hero-install" ? "Copied!" : "Copy" }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Value Paradigm Comparison Toggle -->
    <section class="section-zen">
      <div class="container-zen">
        <div class="section-header">
          <div class="pill-label">THE CORE DIFFERENCE</div>
          <h2 class="section-title">Visual Guessing vs. Native Protocol</h2>
          <p class="section-subtitle">
            Automating web forms with computer vision is brittle, slow, and expensive. FormAccurate
            replaces visual inference with verifiable structure.
          </p>

          <!-- Toggle Control -->
          <div class="toggle-control">
            <button
              :class="['toggle-btn', { active: comparisonMode === 'formaccurate' }]"
              @click="comparisonMode = 'formaccurate'"
            >
              The FormAccurate Way
            </button>
            <button
              :class="['toggle-btn', { active: comparisonMode === 'vision' }]"
              @click="comparisonMode = 'vision'"
            >
              The Vision Model Way
            </button>
          </div>
        </div>

        <!-- Comparison Display Card -->
        <div class="comparison-card card-zen">
          <div v-if="comparisonMode === 'formaccurate'" class="comparison-panel success-panel">
            <div class="panel-header">
              <div class="status-indicator live"></div>
              <div>
                <h3 class="panel-title">FormAccurate Native Protocol</h3>
                <span class="panel-meta"
                  >Deterministic JSON Schema & Verifiable SHA-256 Receipts</span
                >
              </div>
            </div>

            <div class="metric-grid">
              <div class="metric-box">
                <div class="metric-val">~40 ms</div>
                <div class="metric-lbl">Total Execution Time</div>
              </div>
              <div class="metric-box">
                <div class="metric-val">$0.00</div>
                <div class="metric-lbl">Inference Token Cost</div>
              </div>
              <div class="metric-box">
                <div class="metric-val">100%</div>
                <div class="metric-lbl">Type Safety & Determinism</div>
              </div>
              <div class="metric-box">
                <div class="metric-val">SHA-256</div>
                <div class="metric-lbl">Auditable Receipt Proof</div>
              </div>
            </div>

            <div class="flow-steps">
              <div class="flow-step">
                <span class="step-num">1</span>
                <div>
                  <strong>Discovery:</strong> Reads <code>/.well-known/formaccurate.json</code> to
                  discover forms.
                </div>
              </div>
              <div class="flow-step">
                <span class="step-num">2</span>
                <div>
                  <strong>Schema Validation:</strong> Evaluates typed constraints and conditional
                  field visibility via Zod.
                </div>
              </div>
              <div class="flow-step">
                <span class="step-num">3</span>
                <div>
                  <strong>Cryptographic Receipt:</strong> Produces a verifiable hash over canonical
                  keys upon submission.
                </div>
              </div>
            </div>
          </div>

          <div v-else class="comparison-panel error-panel">
            <div class="panel-header">
              <div class="status-indicator failure"></div>
              <div>
                <h3 class="panel-title">Vision Model Automation</h3>
                <span class="panel-meta">Screenshots, Vision OCR, and Coordinate Guessing</span>
              </div>
            </div>

            <div class="metric-grid">
              <div class="metric-box">
                <div class="metric-val red">~8 - 15 s</div>
                <div class="metric-lbl">Per-Page Latency</div>
              </div>
              <div class="metric-box">
                <div class="metric-val red">$0.05+</div>
                <div class="metric-lbl">Per Vision API Call</div>
              </div>
              <div class="metric-box">
                <div class="metric-val red">~62%</div>
                <div class="metric-lbl">Multi-Step Reliability</div>
              </div>
              <div class="metric-box">
                <div class="metric-val red">None</div>
                <div class="metric-lbl">No Auditable Receipt</div>
              </div>
            </div>

            <div class="flow-steps">
              <div class="flow-step error">
                <span class="step-num">!</span>
                <div>
                  <strong>Vision OCR Failure:</strong> Cannot parse disguised datepickers,
                  multi-selects, or masked inputs.
                </div>
              </div>
              <div class="flow-step error">
                <span class="step-num">!</span>
                <div>
                  <strong>Pixel Drift:</strong> A layout shift of 15px causes accidental clicks on
                  wrong submit buttons.
                </div>
              </div>
              <div class="flow-step error">
                <span class="step-num">!</span>
                <div>
                  <strong>Legal Risk:</strong> Checkboxes checked without formal consent capture or
                  audit logs.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Live Interactive Agent Playground -->
    <section id="demo" class="section-zen bg-subtle">
      <div class="container-zen">
        <div class="section-header">
          <div class="pill-label">INTERACTIVE DEMO</div>
          <h2 class="section-title">The Side-by-Side Reality</h2>
          <p class="section-subtitle">
            The exact same form operates for humans in the browser and autonomous AI agents over the
            in-page bridge.
          </p>
        </div>

        <div class="playground-layout">
          <!-- Human Form View -->
          <div class="card-zen playground-card">
            <div class="card-top-bar">
              <div class="window-dots"><span></span><span></span><span></span></div>
              <div class="window-title">Municipal Operating Permit Form</div>
              <span class="badge-human">Human Browser View</span>
            </div>

            <div class="form-preview">
              <div class="field-group">
                <label class="field-label">Legal Business Name</label>
                <input
                  type="text"
                  class="field-input"
                  placeholder="e.g. Acme Autonomous Robotics Inc."
                  :value="simState.legalName"
                  readonly
                />
              </div>

              <div class="field-group">
                <label class="field-label">Operating Jurisdiction</label>
                <input
                  type="text"
                  class="field-input"
                  placeholder="e.g. California (US-CA)"
                  :value="simState.jurisdiction"
                  readonly
                />
              </div>

              <div class="field-group">
                <label class="field-label">Articles of Incorporation (.pdf)</label>
                <div class="file-box" :class="{ uploaded: simState.documentUploaded }">
                  <span v-if="!simState.documentUploaded">Awaiting document upload...</span>
                  <span v-else class="file-success"
                    >acme-articles-of-org.pdf (Token: filetok_01M2)</span
                  >
                </div>
              </div>

              <div class="field-group checkbox-row">
                <input type="checkbox" :checked="simState.confirmedConsent" disabled />
                <label class="checkbox-label">
                  I declare under penalty of perjury that all statements are true and correct.
                </label>
              </div>

              <div class="form-footer-action">
                <button
                  class="btn-simulate"
                  :disabled="simState.isRunning"
                  @click="runAgentSimulation"
                >
                  <span v-if="!simState.isRunning">Simulate Agent Run</span>
                  <span v-else>Agent Running Steps {{ simState.step }}/5...</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Live Agent Protocol Telemetry View -->
          <div class="card-zen playground-card terminal-card">
            <div class="card-top-bar terminal-bar">
              <div class="window-dots"><span></span><span></span><span></span></div>
              <div class="window-title">window.FormAccurate • Agent Telemetry</div>
              <span class="badge-agent">Protocol Stream</span>
            </div>

            <div class="terminal-body">
              <div class="terminal-header">
                <span class="term-status" :class="{ active: simState.isRunning }">
                  {{ simState.isRunning ? "AGENT ACTIVE" : "IDLE" }}
                </span>
                <span class="term-time">Protocol: v1.0.0</span>
              </div>

              <div class="terminal-logs">
                <div v-for="(line, idx) in simState.log" :key="idx" class="log-line">
                  <span class="log-prompt">></span>
                  <span class="log-content">{{ line }}</span>
                </div>
              </div>

              <div v-if="simState.receiptHash" class="receipt-result">
                <div class="receipt-title">VERIFIED SUBMISSION RECEIPT</div>
                <div class="receipt-row">
                  <span>Submission ID:</span>
                  <code>{{ simState.submissionId }}</code>
                </div>
                <div class="receipt-row">
                  <span>SHA-256 Digest:</span>
                  <code class="hash-code">{{ simState.receiptHash }}</code>
                </div>
                <div class="receipt-verified-tag">Canonical Signature Verified</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Architecture & Package Suite -->
    <section class="section-zen">
      <div class="container-zen">
        <div class="section-header">
          <div class="pill-label">MODULAR INFRASTRUCTURE</div>
          <h2 class="section-title">Six Independent Packages. Zero Stubs.</h2>
          <p class="section-subtitle">
            Every package is tested in isolation, strictly typed with TypeScript 5, and published to
            npm under <code>@formaccurate/*</code>.
          </p>
        </div>

        <!-- Package Navigation Tabs -->
        <div class="package-tabs">
          <button
            v-for="pkg in packages"
            :key="pkg.id"
            :class="['pkg-tab', { active: activePackage === pkg.id }]"
            @click="activePackage = pkg.id"
          >
            {{ pkg.name.replace("@formaccurate/", "") }}
          </button>
        </div>

        <!-- Active Package Card -->
        <div class="card-zen pkg-detail-card">
          <div class="pkg-header">
            <div>
              <div class="pkg-meta-top">
                <span class="pkg-badge">{{ currentPkg.badge }}</span>
                <span class="pkg-runtime">{{ currentPkg.runtime }}</span>
                <span class="pkg-size">Unpacked: {{ currentPkg.size }}</span>
              </div>
              <h3 class="pkg-title">{{ currentPkg.name }}</h3>
              <p class="pkg-desc">{{ currentPkg.desc }}</p>
            </div>

            <div class="pkg-install-box" @click="copyCode(currentPkg.install, 'pkg-install')">
              <code>{{ currentPkg.install }}</code>
              <span class="copy-badge">{{
                copiedText === "pkg-install" ? "Copied!" : "Copy"
              }}</span>
            </div>
          </div>

          <div class="pkg-code-preview">
            <pre><code>{{ currentPkg.code }}</code></pre>
          </div>
        </div>
      </div>
    </section>

    <!-- Quickstart Implementation Steps -->
    <section class="section-zen bg-subtle">
      <div class="container-zen">
        <div class="section-header">
          <div class="pill-label">QUICKSTART</div>
          <h2 class="section-title">Zero-Friction Integration</h2>
          <p class="section-subtitle">
            Annotate an existing HTML form in 60 seconds, or mount full protocol endpoints into your
            server backend.
          </p>

          <div class="quickstart-tabs">
            <button
              :class="['toggle-btn', { active: activeQuickstart === 'html' }]"
              @click="activeQuickstart = 'html'"
            >
              1. HTML Form Binding
            </button>
            <button
              :class="['toggle-btn', { active: activeQuickstart === 'server' }]"
              @click="activeQuickstart = 'server'"
            >
              2. Backend Server Mount
            </button>
            <button
              :class="['toggle-btn', { active: activeQuickstart === 'mcp' }]"
              @click="activeQuickstart = 'mcp'"
            >
              3. AI Agent (MCP) Setup
            </button>
          </div>
        </div>

        <div class="card-zen quickstart-card">
          <div v-if="activeQuickstart === 'html'" class="code-panel">
            <div class="code-panel-header">
              <span>index.html</span>
              <button class="copy-btn" @click="copyCode('initFormAccurate()', 'qs-html')">
                {{ copiedText === "qs-html" ? "Copied!" : "Copy Snippet" }}
              </button>
            </div>
            <pre><code>&lt;!-- Annotate existing forms with data-fa-* attributes --&gt;
&lt;form data-fa-form="permit-application" action="/api/permits" method="POST"&gt;
  &lt;label for="company"&gt;Company Name&lt;/label&gt;
  &lt;input id="company" name="company" data-fa-field="company" required /&gt;

  &lt;label for="email"&gt;Contact Email&lt;/label&gt;
  &lt;input id="email" name="email" type="email" data-fa-field="email" required /&gt;

  &lt;button type="submit" data-fa-action="submit"&gt;Submit Application&lt;/button&gt;
&lt;/form&gt;

&lt;script type="module"&gt;
  import { initFormAccurate } from "@formaccurate/web";
  initFormAccurate(); // Registers window.FormAccurate for agents
&lt;/script&gt;</code></pre>
          </div>

          <div v-else-if="activeQuickstart === 'server'" class="code-panel">
            <div class="code-panel-header">
              <span>server.ts</span>
              <button class="copy-btn" @click="copyCode('createFormAccurateServer', 'qs-server')">
                {{ copiedText === "qs-server" ? "Copied!" : "Copy Snippet" }}
              </button>
            </div>
            <pre><code>import { Hono } from "hono";
import { createFormAccurateServer, MemoryStorageAdapter } from "@formaccurate/server";
import { permitSchema } from "./schema";

const app = new Hono();

// Mounts discovery, session state, validation, and receipts
app.route("/", createFormAccurateServer({
  forms: [permitSchema],
  storage: new MemoryStorageAdapter(),
}));

export default app;</code></pre>
          </div>

          <div v-else class="code-panel">
            <div class="code-panel-header">
              <span>claude_desktop_config.json</span>
              <button class="copy-btn" @click="copyCode('formaccurate_mcp', 'qs-mcp')">
                {{ copiedText === "qs-mcp" ? "Copied!" : "Copy Snippet" }}
              </button>
            </div>
            <pre><code>{
  "mcpServers": {
    "formaccurate": {
      "command": "npx",
      "args": ["-y", "@formaccurate/mcp"],
      "env": {
        "FORMACCURATE_SERVER_URL": "http://localhost:3000"
      }
    }
  }
}</code></pre>
          </div>
        </div>
      </div>
    </section>

    <!-- Comprehensive Documentation Gateway -->
    <section class="section-zen">
      <div class="container-zen">
        <div class="section-header">
          <div class="pill-label">DEVELOPER DOCUMENTATION</div>
          <h2 class="section-title">Deep Technical Specifications</h2>
          <p class="section-subtitle">
            Explore the complete specifications, security threat models, and architectural
            boundaries.
          </p>
        </div>

        <div class="docs-grid">
          <a :href="withBase('/guide/getting-started')" class="card-zen doc-card">
            <div class="doc-icon">🚀</div>
            <h3 class="doc-card-title">Getting Started Guide</h3>
            <p class="doc-card-desc">
              Step-by-step tutorial on annotating forms, running live servers, and integrating
              agents.
            </p>
            <span class="doc-card-link">Read Guide →</span>
          </a>

          <a :href="withBase('/spec/schema')" class="card-zen doc-card">
            <div class="doc-icon">📜</div>
            <h3 class="doc-card-title">Schema Specification</h3>
            <p class="doc-card-desc">
              Formal specification for field types, Zod constraints, conditional visibility, and
              JSON Schema export.
            </p>
            <span class="doc-card-link">View Spec →</span>
          </a>

          <a :href="withBase('/spec/protocol')" class="card-zen doc-card">
            <div class="doc-icon">⚡</div>
            <h3 class="doc-card-title">Protocol Specification</h3>
            <p class="doc-card-desc">
              Discovery format, REST endpoints, in-page JavaScript bridge, idempotency keys, and
              receipts.
            </p>
            <span class="doc-card-link">View Protocol →</span>
          </a>

          <a :href="withBase('/guide/security')" class="card-zen doc-card">
            <div class="doc-icon">🔒</div>
            <h3 class="doc-card-title">Security & Consent Model</h3>
            <p class="doc-card-desc">
              Opt-in threat model, authorization flows, rate limiting, and explicit user consent
              verification.
            </p>
            <span class="doc-card-link">Read Policy →</span>
          </a>

          <a :href="withBase('/guide/architecture')" class="card-zen doc-card">
            <div class="doc-icon">🏗️</div>
            <h3 class="doc-card-title">Monorepo Architecture</h3>
            <p class="doc-card-desc">
              Package ownership boundaries, runtime isolation rules, and build pipeline mechanics.
            </p>
            <span class="doc-card-link">Explore Architecture →</span>
          </a>

          <a
            href="https://github.com/harvatechs/formaccurate"
            target="_blank"
            rel="noreferrer"
            class="card-zen doc-card"
          >
            <div class="doc-icon">🐙</div>
            <h3 class="doc-card-title">GitHub Repository</h3>
            <p class="doc-card-desc">
              Source code, automated CI/CD workflows, releases, and issue tracker on GitHub.
            </p>
            <span class="doc-card-link">View Code →</span>
          </a>
        </div>
      </div>
    </section>

    <!-- Zen Footer -->
    <footer class="landing-footer">
      <div class="footer-inner">
        <div class="footer-top">
          <div class="footer-brand">
            <div class="landing-brand-logo">FA</div>
            <span>FormAccurate</span>
          </div>
          <div class="footer-links">
            <a :href="withBase('/guide/getting-started')">Docs</a>
            <a :href="withBase('/spec/schema')">Schema Spec</a>
            <a :href="withBase('/spec/protocol')">Protocol</a>
            <a href="https://github.com/harvatechs/formaccurate" target="_blank" rel="noreferrer"
              >GitHub</a
            >
            <a href="https://www.npmjs.com/org/formaccurate" target="_blank" rel="noreferrer"
              >npm</a
            >
          </div>
        </div>

        <div class="footer-bottom">
          <p>
            Released under the MIT License. Copyright © 2026 Harsha Vardhan and FormAccurate
            Contributors.
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* Page Layout */
.hero-section {
  position: relative;
  padding: 80px 24px 70px 24px;
  text-align: center;
  max-width: 1200px;
  margin: 0 auto;
}

.hero-content {
  position: relative;
  z-index: 2;
}

.hero-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 28px;
}

.copy-badge {
  font-size: 0.72rem;
  background: rgba(0, 0, 0, 0.06);
  padding: 2px 8px;
  border-radius: 999px;
  color: var(--fa-text-secondary);
}

/* Sections */
.section-zen {
  padding: 80px 24px;
  position: relative;
}

.bg-subtle {
  background-color: var(--fa-bg-subtle);
}

.container-zen {
  max-width: 1140px;
  margin: 0 auto;
}

.section-header {
  text-align: center;
  max-width: 760px;
  margin: 0 auto 48px auto;
}

.pill-label {
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--fa-brand-blue);
  margin-bottom: 12px;
}

.section-title {
  font-size: clamp(2rem, 3.8vw, 2.8rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.15;
  color: var(--fa-text-primary);
  margin: 0 0 16px 0;
}

.section-subtitle {
  font-size: 1.12rem;
  color: var(--fa-text-secondary);
  line-height: 1.5;
  margin: 0;
}

/* Comparison Toggle */
.toggle-control {
  display: inline-flex;
  background: var(--fa-bg-elevated);
  padding: 4px;
  border-radius: var(--fa-radius-pill);
  border: 1px solid var(--fa-border);
  margin-top: 24px;
}

.toggle-btn {
  padding: 8px 20px;
  border-radius: var(--fa-radius-pill);
  border: none;
  background: transparent;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--fa-text-secondary);
  cursor: pointer;
  transition: var(--fa-transition);
}

.toggle-btn.active {
  background: #ffffff;
  color: var(--fa-text-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* Comparison Card */
.comparison-card {
  padding: 36px;
  max-width: 860px;
  margin: 0 auto;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 28px;
}

.status-indicator {
  width: 14px;
  height: 14px;
  border-radius: 50%;
}

.status-indicator.live {
  background: #34c759;
  box-shadow: 0 0 0 4px rgba(52, 199, 89, 0.2);
}

.status-indicator.failure {
  background: #ff3b30;
  box-shadow: 0 0 0 4px rgba(255, 59, 48, 0.2);
}

.panel-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 4px 0;
}

.panel-meta {
  font-size: 0.88rem;
  color: var(--fa-text-secondary);
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}

.metric-box {
  background: var(--fa-bg-elevated);
  border: 1px solid var(--fa-border-light);
  border-radius: var(--fa-radius-md);
  padding: 16px;
  text-align: center;
}

.metric-val {
  font-size: 1.45rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #34c759;
  margin-bottom: 4px;
}

.metric-val.red {
  color: #ff3b30;
}

.metric-lbl {
  font-size: 0.76rem;
  color: var(--fa-text-secondary);
}

.flow-steps {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.flow-step {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-size: 0.94rem;
  color: var(--fa-text-primary);
}

.step-num {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #34c759;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
}

.flow-step.error .step-num {
  background: #ff3b30;
}

/* Playground Layout */
.playground-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 28px;
}

.playground-card {
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.card-top-bar {
  padding: 12px 18px;
  background: #f8f8fa;
  border-bottom: 1px solid var(--fa-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.window-dots {
  display: flex;
  gap: 6px;
}

.window-dots span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #d1d1d6;
}

.window-title {
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--fa-text-secondary);
}

.badge-human {
  font-size: 0.72rem;
  background: #e5e5ea;
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 500;
}

.badge-agent {
  font-size: 0.72rem;
  background: rgba(0, 170, 255, 0.15);
  color: #0077cc;
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 600;
}

.form-preview {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--fa-text-secondary);
}

.field-input {
  background: var(--fa-bg-elevated);
  border: 1px solid var(--fa-border);
  border-radius: var(--fa-radius-sm);
  padding: 10px 14px;
  font-size: 0.92rem;
  color: var(--fa-text-primary);
  outline: none;
}

.file-box {
  border: 1px dashed var(--fa-border);
  padding: 12px;
  border-radius: var(--fa-radius-sm);
  text-align: center;
  font-size: 0.84rem;
  color: var(--fa-text-muted);
}

.file-box.uploaded {
  background: rgba(52, 199, 89, 0.08);
  border-color: #34c759;
  color: #248a3d;
  font-weight: 500;
}

.checkbox-row {
  flex-direction: row;
  align-items: center;
  gap: 10px;
}

.checkbox-label {
  font-size: 0.78rem;
  color: var(--fa-text-secondary);
}

.form-footer-action {
  margin-top: 8px;
}

.btn-simulate {
  width: 100%;
  background: var(--fa-text-primary);
  color: #ffffff;
  padding: 12px;
  border-radius: var(--fa-radius-pill);
  font-weight: 600;
  font-size: 0.92rem;
  border: none;
  cursor: pointer;
  transition: var(--fa-transition);
}

.btn-simulate:hover:not(:disabled) {
  background: #000000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-simulate:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

/* Terminal Card */
.terminal-card {
  background: #111113;
  color: #e5e5e7;
}

.terminal-bar {
  background: #18181b;
  border-color: #27272a;
}

.terminal-bar .window-title {
  color: #a1a1aa;
}

.terminal-body {
  padding: 20px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.82rem;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.terminal-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #27272a;
  color: #71717a;
}

.term-status {
  font-weight: 600;
  color: #71717a;
}

.term-status.active {
  color: #34c759;
}

.terminal-logs {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.log-line {
  display: flex;
  gap: 8px;
}

.log-prompt {
  color: var(--fa-brand-blue);
  user-select: none;
}

.receipt-result {
  margin-top: 16px;
  padding: 14px;
  border-radius: 8px;
  background: rgba(52, 199, 89, 0.12);
  border: 1px solid rgba(52, 199, 89, 0.3);
}

.receipt-title {
  color: #34c759;
  font-weight: 700;
  font-size: 0.76rem;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

.receipt-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.78rem;
  margin-bottom: 4px;
}

.hash-code {
  color: #86efac;
  font-size: 0.72rem;
}

.receipt-verified-tag {
  margin-top: 6px;
  font-size: 0.72rem;
  color: #34c759;
  text-align: right;
  font-weight: 600;
}

/* Package Tabs */
.package-tabs {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 28px;
}

.pkg-tab {
  padding: 8px 18px;
  border-radius: var(--fa-radius-pill);
  border: 1px solid var(--fa-border);
  background: var(--fa-bg);
  font-size: 0.88rem;
  font-weight: 500;
  color: var(--fa-text-secondary);
  cursor: pointer;
  transition: var(--fa-transition);
}

.pkg-tab.active {
  background: var(--fa-text-primary);
  color: #ffffff;
  border-color: var(--fa-text-primary);
}

.pkg-detail-card {
  padding: 32px;
}

.pkg-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.pkg-meta-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.pkg-badge {
  font-size: 0.72rem;
  background: rgba(0, 170, 255, 0.12);
  color: #0077cc;
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 600;
}

.pkg-runtime,
.pkg-size {
  font-size: 0.76rem;
  color: var(--fa-text-tertiary);
}

.pkg-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 6px 0;
}

.pkg-desc {
  font-size: 0.96rem;
  color: var(--fa-text-secondary);
  max-width: 650px;
  margin: 0;
}

.pkg-install-box {
  background: var(--fa-bg-elevated);
  border: 1px solid var(--fa-border);
  border-radius: var(--fa-radius-pill);
  padding: 8px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.82rem;
}

.pkg-code-preview {
  background: #18181b;
  color: #f4f4f5;
  border-radius: var(--fa-radius-md);
  padding: 20px;
  overflow-x: auto;
}

.pkg-code-preview pre {
  margin: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.84rem;
  line-height: 1.5;
}

/* Quickstart Card */
.quickstart-tabs {
  display: inline-flex;
  background: var(--fa-bg-elevated);
  padding: 4px;
  border-radius: var(--fa-radius-pill);
  border: 1px solid var(--fa-border);
  margin-top: 20px;
}

.quickstart-card {
  padding: 0;
  overflow: hidden;
  max-width: 900px;
  margin: 0 auto;
}

.code-panel-header {
  background: #27272a;
  color: #a1a1aa;
  padding: 10px 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.82rem;
}

.copy-btn {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  border: none;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.74rem;
  cursor: pointer;
}

.code-panel pre {
  margin: 0;
  background: #18181b;
  color: #f4f4f5;
  padding: 24px;
  overflow-x: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.86rem;
  line-height: 1.55;
}

/* Documentation Grid */
.docs-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.doc-card {
  padding: 28px;
  text-decoration: none;
  color: var(--fa-text-primary);
  display: flex;
  flex-direction: column;
}

.doc-icon {
  font-size: 1.8rem;
  margin-bottom: 16px;
}

.doc-card-title {
  font-size: 1.15rem;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.doc-card-desc {
  font-size: 0.9rem;
  color: var(--fa-text-secondary);
  line-height: 1.45;
  margin: 0 0 16px 0;
  flex-grow: 1;
}

.doc-card-link {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--fa-brand-blue);
}

/* Footer */
.landing-footer {
  border-top: 1px solid var(--fa-border-light);
  padding: 48px 24px;
  background: #ffffff;
}

.footer-inner {
  max-width: 1140px;
  margin: 0 auto;
}

.footer-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--fa-border-light);
  flex-wrap: wrap;
  gap: 16px;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
}

.footer-links {
  display: flex;
  gap: 24px;
}

.footer-links a {
  text-decoration: none;
  font-size: 0.88rem;
  color: var(--fa-text-secondary);
  transition: color 0.2s ease;
}

.footer-links a:hover {
  color: var(--fa-text-primary);
}

.footer-bottom {
  padding-top: 20px;
  text-align: center;
  font-size: 0.82rem;
  color: var(--fa-text-muted);
}

/* Responsive adjustments */
@media (max-width: 900px) {
  .playground-layout {
    grid-template-columns: 1fr;
  }
  .docs-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .metric-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .docs-grid {
    grid-template-columns: 1fr;
  }
  .hero-actions {
    flex-direction: column;
    align-items: stretch;
  }
  .hero-actions a,
  .hero-actions div {
    text-align: center;
    justify-content: center;
  }
}
</style>
