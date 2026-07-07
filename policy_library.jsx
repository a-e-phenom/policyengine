import { useState, useEffect } from "react";
import {
  Shield, GitBranch, Users, RefreshCw, MapPin, Database, FileText, Plus, Trash2,
  ChevronRight, Save, X, Check, ChevronDown,
  Search, ArrowRight, Building2, ChevronLeft, Bell, Link2, Sparkle,
  Upload, Paperclip, Settings, Workflow, ExternalLink, Activity, Zap, Clock, ListChecks,
  CheckCircle, Eye, Octagon, Ban, ArrowUpCircle, Pencil, Flag, RotateCcw,
  SkipForward, ListPlus, Shuffle, Repeat, Pause, XCircle, Inbox, UserPlus, Undo2, Hand,
  Home, ChartNetwork, Bot, List, Code, PanelLeftClose, MessageSquare, UserCheck, Waypoints,
  ClipboardCheck, TowerControl,
} from "lucide-react";
import {
  cn, Button, Input, Textarea, Label, Card, CardHeader, CardTitle, CardDescription,
  CardContent, Badge, Tabs, TabsList, TabsTrigger, Switch,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Separator, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "./src/ui.jsx";

const SELECTED_CHIP_CLASSES = "border-primary/20 bg-primary/10 text-primary shadow-none hover:bg-primary/15 hover:text-primary";

/* ---------------- Registry / seed data ---------------- */

const POLICY_TYPES = [
  {
    key: "Guardrail", icon: Shield,
    description: "Halts, allows, or redirects a single automated action based on a risk or compliance check.",
    outcomes: [
      { key: "Allow", tone: "emerald", icon: CheckCircle, desc: "Proceed as planned." },
      { key: "Monitor", tone: "cyan", icon: Eye, desc: "Let it proceed, but track the decision for review." },
      { key: "Soft Stop", tone: "amber", icon: Octagon, desc: "Pause and warn — a reviewer can override to continue." },
      { key: "Hard Stop", tone: "rose", icon: Ban, desc: "Halt execution; cannot proceed without a policy exception." },
      { key: "Block", tone: "rose", icon: Ban, desc: "Halt execution." },
      { key: "Escalate", tone: "amber", icon: ArrowUpCircle, desc: "Route to a human for review." },
      { key: "Modify", tone: "indigo", icon: Pencil, desc: "Alter the step's inputs or configuration before it executes." },
      { key: "Flag", tone: "cyan", icon: Flag, desc: "Allow execution to continue but tag for audit." },
      { key: "Retry", tone: "slate", icon: RotateCcw, desc: "Force the step to retry with modified parameters." },
    ],
    actions: ["Create Case", "Notify", "Escalate to Queue"],
  },
  {
    key: "Routing", icon: GitBranch,
    description: "Determines the next step, or steps, in a multi-stage workflow sequence.",
    outcomes: [
      { key: "Advance", tone: "emerald", icon: ArrowRight, desc: "Move to the next step in the workflow." },
      { key: "Skip", tone: "indigo", icon: SkipForward, desc: "Bypass the next step and continue." },
      { key: "Insert", tone: "cyan", icon: ListPlus, desc: "Add an extra step before continuing." },
      { key: "Reroute", tone: "amber", icon: Shuffle, desc: "Send the record down a different path." },
      { key: "Repeat", tone: "slate", icon: Repeat, desc: "Run the current step again." },
      { key: "Pause", tone: "amber", icon: Pause, desc: "Hold the workflow until a condition is met." },
      { key: "Terminate", tone: "rose", icon: XCircle, desc: "End the workflow entirely." },
    ],
    actions: ["Notify", "Reroute Target Workflow", "Insert Step Config"],
  },
  {
    key: "Assignment", icon: Users,
    description: "Assigns a case, task, or candidate record to a queue, person, or team.",
    outcomes: [
      { key: "Assign to Queue", tone: "indigo", icon: Inbox, desc: "Place the record in a shared work queue." },
      { key: "Assign to Person", tone: "cyan", icon: UserPlus, desc: "Assign directly to a named person." },
      { key: "Round-Robin", tone: "slate", icon: RefreshCw, desc: "Distribute across the team in rotation." },
      { key: "Escalate Assignment", tone: "amber", icon: ArrowUpCircle, desc: "Reassign to a senior queue or owner." },
      { key: "Reassign", tone: "amber", icon: Shuffle, desc: "Move the assignment to someone else." },
    ],
    actions: ["Assign to Queue", "Assign to Person", "Notify"],
  },
  {
    key: "State Transition", icon: RefreshCw,
    description: "Moves a record from one lifecycle state to another under defined conditions.",
    outcomes: [
      { key: "Transition", tone: "emerald", icon: ArrowRight, desc: "Move the record to a new lifecycle state." },
      { key: "Hold", tone: "amber", icon: Hand, desc: "Keep the record in its current state pending review." },
      { key: "Revert", tone: "cyan", icon: Undo2, desc: "Return the record to a previous state." },
      { key: "Cancel", tone: "rose", icon: XCircle, desc: "Close or cancel the record." },
    ],
    actions: ["Transition to State", "Notify", "Create Case"],
  },
];

const TAXONOMY_SEED = {
  "Analytics": ["Reporting", "Insights"],
  "Automation Engine": ["Workflow Automation", "Triggers"],
  "Candidate Experience (CX)": ["Candidate Portal", "Communications"],
  "Compliance": ["EEOC", "Data Privacy", "Background Check"],
  "Data": ["Data Quality", "Master Data"],
  "Employee Experience (EX)": ["Employee Portal", "Self-Service"],
  "Employee Onboarding Experience": ["Onboarding Journey", "Document Collection"],
  "Hiring Automations": ["Screening Automation", "Scheduling Automation"],
  "Hiring Intelligence": ["Interview Intelligence"],
  "Integration Experience (IX)": ["API Integrations", "Connectors"],
  "Talent Acquisition": ["Sourcing", "Screening", "Offer Management"],
  "Total Rewards": ["Compensation", "Benefits"],
};

const PERSONAS = ["Candidate", "Recruiter", "Hiring Manager", "Interviewer", "HRBP", "Compliance Reviewer"];

const DATA_SOURCES = [
  "Candidate Fit Score", "Requisition Approval Status", "Employment Status", "Country / Region",
  "Job Family", "Job Grade", "Tenant / Business Unit", "Consent Status", "Tenure Since Last Working Day",
  "Days Since Last Working Day", "Sourcing Candidate Count", "Demographic Distribution Skew",
  "Model Confidence Score", "API Response Status", "Hiring Manager Availability",
  "Company (via UAN/EPFO)", "Company (via Resume/Application)", "Performance Outcome", "Rehire Flag",
  "Offer Acceptance Status",
];
const OPERATORS = ["IS IN", "IS NOT IN", "EQUALS", "NOT EQUALS", "GREATER THAN", "LESS THAN", "BETWEEN", "MATCHES", "SAME AS", "NOT SAME AS"];
// Operators that compare one data field against another field, rather than a static value.
const FIELD_COMPARISON_OPERATORS = new Set(["SAME AS", "NOT SAME AS"]);

const NOTIFY_TEMPLATES = [
  "Recording Disabled — Policy Notice", "Recruiter: Candidate Flagged", "HRBP: Compliance Escalation",
  "Candidate: Application Status Update", "Manager: Approval Required",
  "Legal: No-Poach Confirmation Required", "Recruiter: Do-Not-Hire Match", "Recruiter: UAN / Resume Mismatch",
  "TA Ops: Rehire Cooling-Off Review",
];

// When the policy is evaluated in the candidate/workflow lifecycle.
const TRIGGERS = [
  "When application is received", "At screening", "At scheduling", "At offer stage",
  "On job publish", "On candidate sourced", "On segment consumed", "Continuous / scheduled",
];

// Lifecycle stage at which an outcome is actually enforced (supports deferred enforcement).
const ENFORCEMENT_STAGES = ["Immediate", "Application", "Screening", "Interview", "Offer"];

// Approvers for human-in-the-loop escalation gates.
const APPROVERS = ["Hiring Manager", "Legal", "Compliance Reviewer", "HRBP", "Talent Leadership"];

const CONTROLLED_ACTIONS_BY_FN = {
  "Interview Intelligence": ["Interview Recording", "Interview Scheduling", "Interview Transcription", "AI Interview Analysis"],
  "Screening": ["Application Submission", "Application Progression", "Background Check Initiation", "Screening Decision"],
  "Sourcing": ["Candidate Sourcing", "Automated Outreach", "Application Progression", "No-Poach Restriction Level", "Job Publish"],
  "Offer Management": ["Offer Release", "Offer Acceptance", "Offer Progression"],
  "Data Privacy": ["Candidate Sourcing", "Data Processing", "Consent Collection"],
  "Compensation": ["Compensation Approval"],
  "Benefits": ["Benefits Enrollment"],
  "EEOC": ["Application Progression"],
  "Background Check": ["Background Check Initiation"],
};

const CONTROLLED_ACTION_LABELS = {
  "Interview Recording": "Recording",
  "AI Interview Analysis": "AI Insights",
  "Interview Scheduling": "Scheduling",
  "Interview Transcription": "Transcription",
};

function controlledActionLabel(action) {
  return CONTROLLED_ACTION_LABELS[action] || action;
}

function getBranchControlledActions(branch, policyAction = "") {
  if (branch?.controlledActions?.length) return branch.controlledActions;
  if (branch?.controlledAction) return [branch.controlledAction];
  if (policyAction) return [policyAction];
  return [];
}

function formatControlledActionsList(actions) {
  return actions.map(controlledActionLabel).join(", ");
}

function getControlledActionOptions(fn) {
  return CONTROLLED_ACTIONS_BY_FN[fn] || ["Workflow Step"];
}

function defaultContextPrompt(existing) {
  if (!existing) return "";
  if (existing.name === "Interview Feature Restriction") {
    return `Interview feature restrictions by country:

United States: For executive roles, a soft stop is implemented where interview recording must be approved by someone else before it can be enabled.

Germany: Everything related to interview recording is blocked.

Spain: Only AI generation of interview insights is blocked.`;
  }
  return `Maintain a ${existing.type.toLowerCase()} policy for ${existing.fn} that ${existing.name.toLowerCase().includes("block") ? "blocks" : "controls"} the relevant workflow step.`;
}

function defaultControlledAction(existing) {
  if (existing?.controlledAction) return existing.controlledAction;
  const options = getControlledActionOptions(existing?.fn);
  return options[0] || "";
}

const CONFIG_MODES = [
  { id: "policy", label: "V1" },
  { id: "rule", label: "V2" },
];

function defaultBranchControlledActions(fn, policyAction, outcome) {
  const options = getControlledActionOptions(fn);
  if (Array.isArray(policyAction) && policyAction.length) return policyAction.filter((a) => options.includes(a));
  if (policyAction && options.includes(policyAction)) return [policyAction];
  if (outcome === "Allow" || outcome === "Advance") return [];
  return options[0] ? [options[0]] : [];
}

function hydrateBranchesForMode(branches, { existing, fn, policyControlledAction, policyTrigger, configMode }) {
  if (configMode !== "rule") return branches;
  const settings = existing?.branchSettings || [];
  return branches.map((b, i) => {
    const saved = settings.find((s) => s.kind === b.kind && (s.index === undefined || s.index === i))
      || settings[i];
    const savedActions = saved?.controlledActions || (saved?.controlledAction ? [saved.controlledAction] : null);
    const branchActions = b.controlledActions?.length
      ? b.controlledActions
      : savedActions || defaultBranchControlledActions(fn, b.controlledAction || policyControlledAction, b.outcome);
    return {
      ...b,
      trigger: b.trigger || saved?.trigger || existing?.trigger || policyTrigger || TRIGGERS[0],
      controlledActions: branchActions,
      controlledAction: branchActions[0] || "",
    };
  });
}

function ConfiguratorModeSwitcher({ mode, onChange, insetLeft = "1.5rem" }) {
  return (
    <div className="fixed bottom-6 z-50" style={{ left: insetLeft }}>
      <div className="flex items-center gap-1 rounded-xl border bg-white/95 p-1 shadow-lg backdrop-blur-sm">
        {CONFIG_MODES.map((m) => {
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onChange(m.id)}
              className={cn(
                "rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {m.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function OutcomeWithAction({ outcome, controlledAction, controlledActions }) {
  const actions = controlledActions?.length
    ? controlledActions
    : (controlledAction ? [controlledAction] : []);
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <Badge variant={outcomeVariant(outcome)}>{outcome}</Badge>
      {actions.length > 0 && (
        <span className="text-xs text-muted-foreground">
          on <span className="font-medium text-foreground">{formatControlledActionsList(actions)}</span>
        </span>
      )}
    </span>
  );
}

// Structured applicability (tenant / location / job family / job grade) layered on top of audiences.
const APPLICABILITY = {
  tenant: { label: "Tenant / Business Unit", any: "All tenants", options: ["All tenants", "Acme India", "Acme EMEA", "Acme APAC", "Acme Global"] },
  location: { label: "Location", any: "All locations", options: ["All locations", "India", "EU / GDPR Countries", "United States", "APAC"] },
  jobFamily: { label: "Job Family", any: "All job families", options: ["All job families", "Engineering", "Sales", "Corporate", "Hourly"] },
  jobGrade: { label: "Job Grade", any: "All grades", options: ["All grades", "IC1–IC3", "IC4–IC6", "Manager", "Director+"] },
};

const defaultApplicability = {
  tenant: "All tenants", location: "All locations", jobFamily: "All job families", jobGrade: "All grades",
};

function activeApplicability(applicability) {
  if (!applicability) return [];
  return Object.keys(APPLICABILITY)
    .filter((k) => applicability[k] && applicability[k] !== APPLICABILITY[k].any)
    .map((k) => ({ dim: k, label: APPLICABILITY[k].label, value: applicability[k] }));
}

// Managed lists — the tiered / alias-aware reference data the EPFO + no-poach policies match against.
const MANAGED_LISTS = [
  { id: "ml-dnh", name: "Do Not Hire (DNH) List", kind: "Exclusion", tier: null, entries: 214, aliases: true, subsidiaries: false, coolingOff: null, source: "EPFO UAN", note: "Organizations candidates may not be hired from." },
  { id: "ml-np1", name: "No-Poach — Tier 1", kind: "No-Poach", tier: "Tier 1", entries: 12, aliases: true, subsidiaries: true, coolingOff: "12 months", source: "EPFO UAN", note: "Strategic protected clients. Soft Stop; Hard Stop at Offer on legal confirmation." },
  { id: "ml-np2", name: "No-Poach — Tier 2", kind: "No-Poach", tier: "Tier 2", entries: 34, aliases: true, subsidiaries: true, coolingOff: "6 months", source: "EPFO UAN", note: "Protected clients with cooling-off enforcement." },
  { id: "ml-np3", name: "No-Poach — Tier 3", kind: "No-Poach", tier: "Tier 3", entries: 61, aliases: true, subsidiaries: false, coolingOff: "3 months", source: "EPFO UAN", note: "Lower-tier protected clients; auto-downgrades to Monitor on MSA expiry." },
  { id: "ml-comp", name: "Competitor Exclusion List", kind: "Exclusion", tier: null, entries: 48, aliases: true, subsidiaries: true, coolingOff: null, source: "Manual + CRM", note: "Direct competitors excluded from sourcing." },
];

const AUDIENCES_SEED = [
  {
    id: "aud-1", name: "EMEA GDPR Candidates",
    summary: [{ source: "Country / Region", operator: "IS IN", value: "EU / GDPR Countries" }],
    usedBy: ["EU Recording Restriction"],
  },
  {
    id: "aud-2", name: "Current Employees",
    summary: [{ source: "Employment Status", operator: "EQUALS", value: "Current Employee" }],
    usedBy: ["EU Recording Restriction", "Current Employee Exclusion", "No-Poach Tier 1 Block", "Rehire Cooling-Off"],
  },
  {
    id: "aud-4", name: "Protected Client No-Poach Tier 1",
    summary: [{ source: "Company (via UAN/EPFO)", operator: "IS IN", value: "No-Poach — Tier 1" }],
    usedBy: ["No-Poach Tier 1 Block", "No-Poach Concealment Hard Stop", "No-Poach Alias & Subsidiary Match"],
  },
  {
    id: "aud-5", name: "India Applicants",
    summary: [{ source: "Country / Region", operator: "EQUALS", value: "India" }],
    usedBy: ["Do-Not-Hire Employer Block", "Do-Not-Hire Alias Match", "Resume vs UAN Mismatch", "Rehire Performance Screen"],
  },
  {
    id: "aud-6", name: "No-Poach Tier 2 Protected",
    summary: [{ source: "Company (via UAN/EPFO)", operator: "IS IN", value: "No-Poach — Tier 2" }],
    usedBy: ["No-Poach Tier 2 Cooling-Off"],
  },
  {
    id: "aud-7", name: "Do-Not-Hire Employers",
    summary: [{ source: "Company (via UAN/EPFO)", operator: "IS IN", value: "Do Not Hire (DNH) List" }],
    usedBy: ["Do-Not-Hire Employer Block", "Do-Not-Hire Alias Match"],
  },
  {
    id: "aud-8", name: "Rehire Candidates",
    summary: [{ source: "Rehire Flag", operator: "EQUALS", value: "Yes" }],
    usedBy: ["Rehire Performance Screen", "Rehire Protected-Client Review", "Rehire Cooling-Off"],
  },
];

const POLICY_SOURCE = {
  RECORDING: "Country-Level Recording Restriction Policy.pdf",
  SOURCING: "Sourcing Agent — Workflows & Policies.pdf",
  INDIA_APPLY: "Capgemini",
};

const POLICIES_SEED = [
  { id: "p22", name: "Interview Feature Restriction", type: "Guardrail", domain: "Hiring Intelligence", fn: "Interview Intelligence", scope: [], status: "Active", personas: ["Candidate", "Interviewer"], trigger: "At scheduling", source: POLICY_SOURCE.RECORDING, controlledAction: "Interview Recording" },
  { id: "p1", name: "EU Recording Restriction", type: "Guardrail", domain: "Hiring Intelligence", fn: "Interview Intelligence", scope: ["EMEA GDPR Candidates", "Current Employees"], scopeInline: true, status: "Active", personas: ["Candidate", "Interviewer"], trigger: "At scheduling", applicability: { location: "EU / GDPR Countries" }, source: POLICY_SOURCE.RECORDING, controlledAction: "Interview Recording" },
  { id: "p2", name: "No-Poach Tier 1 Block", type: "Guardrail", domain: "Talent Acquisition", fn: "Sourcing", scope: ["Protected Client No-Poach Tier 1"], status: "Active", personas: ["Recruiter"], trigger: "When application is received", applicability: { location: "India" }, source: POLICY_SOURCE.INDIA_APPLY, controlledAction: "Application Progression" },

  // ---- EPFO / India verification policies (spreadsheet) ----
  { id: "p8", name: "Do-Not-Hire Employer Block", type: "Guardrail", domain: "Talent Acquisition", fn: "Screening", scope: ["India Applicants", "Do-Not-Hire Employers"], status: "Active", personas: ["Recruiter", "Compliance Reviewer"], trigger: "When application is received", applicability: { location: "India" }, source: POLICY_SOURCE.INDIA_APPLY, controlledAction: "Application Submission" },
  { id: "p9", name: "Do-Not-Hire Alias Match", type: "Guardrail", domain: "Talent Acquisition", fn: "Screening", scope: ["India Applicants", "Do-Not-Hire Employers"], status: "Active", personas: ["Recruiter"], trigger: "When application is received", applicability: { location: "India" }, source: POLICY_SOURCE.INDIA_APPLY, controlledAction: "Application Submission" },
  { id: "p10", name: "Resume vs UAN Mismatch", type: "Guardrail", domain: "Talent Acquisition", fn: "Screening", scope: ["India Applicants"], status: "Active", personas: ["Recruiter", "Compliance Reviewer"], trigger: "When application is received", applicability: { location: "India" }, source: POLICY_SOURCE.INDIA_APPLY, controlledAction: "Application Submission" },
  { id: "p11", name: "Rehire Performance Screen", type: "Guardrail", domain: "Talent Acquisition", fn: "Screening", scope: ["India Applicants", "Rehire Candidates"], status: "Active", personas: ["HRBP"], trigger: "When application is received", applicability: { location: "India" }, source: POLICY_SOURCE.INDIA_APPLY, controlledAction: "Application Progression" },

  // ---- No-Poach program (spreadsheet, tiered) ----
  { id: "p12", name: "No-Poach Tier 2 Cooling-Off", type: "Guardrail", domain: "Talent Acquisition", fn: "Sourcing", scope: ["No-Poach Tier 2 Protected"], status: "Active", personas: ["Recruiter", "Compliance Reviewer"], trigger: "When application is received", applicability: { location: "India" }, source: POLICY_SOURCE.INDIA_APPLY, controlledAction: "Application Progression" },
  { id: "p13", name: "No-Poach Concealment Hard Stop", type: "Guardrail", domain: "Talent Acquisition", fn: "Sourcing", scope: ["Protected Client No-Poach Tier 1"], status: "Active", personas: ["Compliance Reviewer"], trigger: "When application is received", applicability: { location: "India" }, source: POLICY_SOURCE.INDIA_APPLY, controlledAction: "Application Progression" },
  { id: "p14", name: "No-Poach Alias & Subsidiary Match", type: "Guardrail", domain: "Talent Acquisition", fn: "Sourcing", scope: ["Protected Client No-Poach Tier 1"], status: "Active", personas: ["Recruiter"], trigger: "When application is received", applicability: { location: "India" }, source: POLICY_SOURCE.INDIA_APPLY, controlledAction: "Application Progression" },
  { id: "p15", name: "No-Poach MSA-Expiry Downgrade", type: "State Transition", domain: "Talent Acquisition", fn: "Sourcing", scope: [], status: "Active", personas: ["Compliance Reviewer"], trigger: "Continuous / scheduled", source: POLICY_SOURCE.INDIA_APPLY, controlledAction: "No-Poach Restriction Level" },
  { id: "p16", name: "Rehire Protected-Client Review", type: "Guardrail", domain: "Talent Acquisition", fn: "Sourcing", scope: ["Rehire Candidates"], status: "Active", personas: ["Recruiter"], trigger: "When application is received", applicability: { location: "India" }, source: POLICY_SOURCE.INDIA_APPLY, controlledAction: "Application Progression" },

  // ---- Sourcing Agent policies (PDF 2) ----
  { id: "p17", name: "Candidate Consent Gate", type: "Guardrail", domain: "Compliance", fn: "Data Privacy", scope: [], status: "Active", personas: ["Candidate"], trigger: "On candidate sourced", source: POLICY_SOURCE.SOURCING, controlledAction: "Candidate Sourcing" },
  { id: "p18", name: "Current Employee Exclusion", type: "Guardrail", domain: "Talent Acquisition", fn: "Sourcing", scope: ["Current Employees"], status: "Active", personas: ["Recruiter"], trigger: "On candidate sourced", mandatory: true, source: POLICY_SOURCE.SOURCING, controlledAction: "Candidate Sourcing" },
  { id: "p19", name: "Country Sourcing Restriction", type: "Guardrail", domain: "Compliance", fn: "Data Privacy", scope: [], status: "Active", personas: ["Recruiter"], trigger: "On candidate sourced", source: POLICY_SOURCE.SOURCING, controlledAction: "Candidate Sourcing" },
  { id: "p20", name: "Job Family Suppression", type: "Routing", domain: "Talent Acquisition", fn: "Sourcing", scope: [], status: "Draft", personas: [], trigger: "On job publish", source: POLICY_SOURCE.SOURCING, controlledAction: "Automated Sourcing" },
  { id: "p21", name: "Rehire Cooling-Off", type: "Guardrail", domain: "Talent Acquisition", fn: "Sourcing", scope: ["Rehire Candidates"], status: "Active", personas: ["Recruiter"], trigger: "On candidate sourced", source: POLICY_SOURCE.SOURCING, controlledAction: "Candidate Sourcing" },
];

const WORKFLOWS_SEED = [
  { id: "wf-1", name: "Interview Scheduling Flow", type: "Workflow", stage: "Pre-Interview", status: "Active", policies: ["p22", "p1"] },
  { id: "wf-2", name: "Candidate Sourcing Pipeline", type: "Pipeline", stage: "Sourcing", status: "Active", policies: ["p2", "p17", "p18", "p19", "p20", "p21"] },
  { id: "wf-4", name: "Offer Management Flow", type: "Workflow", stage: "Offer", status: "Active", policies: ["p2", "p12", "p13"] },
  { id: "wf-7", name: "India Application Compliance Screen", type: "Pipeline", stage: "Screening", status: "Active", policies: ["p8", "p9", "p10", "p11", "p16"] },
  { id: "wf-8", name: "No-Poach Enforcement Flow", type: "Workflow", stage: "Sourcing", status: "Active", policies: ["p2", "p12", "p13", "p14", "p15", "p16"] },
];

const ACTION_CONFIG = {
  "Create Case": { label: "Case type", field: "caseType", options: ["Compliance", "HR Review", "Technical", "Privacy"] },
  "Escalate to Queue": { label: "Queue", field: "queue", options: ["Compliance Queue", "HRBP Queue", "Recruiter Queue", "Interview Ops Queue"] },
  "Assign to Queue": { label: "Queue", field: "queue", options: ["Compliance Queue", "HRBP Queue", "Recruiter Queue", "High-Volume Hourly"] },
  "Assign to Person": { label: "Assignee", field: "assignee", options: PERSONAS },
  "Reroute Target Workflow": { label: "Workflow", field: "workflow", options: WORKFLOWS_SEED.map((w) => w.name) },
  "Insert Step Config": { label: "Step", field: "step", options: ["Manager Review", "Compliance Check", "Additional Interview", "Background Check"] },
  "Transition to State": { label: "Target state", field: "state", options: ["Withdrawn", "On Hold", "Closed", "Cancelled", "Active"] },
};

function createAction(type, existingId) {
  const meta = ACTION_CONFIG[type];
  const config = {};
  if (meta?.options?.length) config[meta.field] = meta.options[0];
  return { id: existingId || uid++, type, config };
}

function normalizeAction(action) {
  if (typeof action === "string") return createAction(action);
  return action;
}

function formatActionLabel(action) {
  const normalized = normalizeAction(action);
  const meta = ACTION_CONFIG[normalized.type];
  const value = meta ? normalized.config?.[meta.field] : null;
  return value ? `${normalized.type} · ${value}` : normalized.type;
}

const USAGE_METRICS_SEED = {
  p22: { evaluations30d: 18640, matchRate: "52%", lastTriggered: "45 min ago", outcomeHits: 9693 },
  p1: { evaluations30d: 12480, matchRate: "68%", lastTriggered: "2 hours ago", outcomeHits: 8486 },
  p2: { evaluations30d: 43120, matchRate: "4.2%", lastTriggered: "12 min ago", outcomeHits: 1811 },
  p8: { evaluations30d: 28400, matchRate: "3.1%", lastTriggered: "6 min ago", outcomeHits: 880 },
  p10: { evaluations30d: 28400, matchRate: "0.8%", lastTriggered: "1 hour ago", outcomeHits: 227 },
  p17: { evaluations30d: 95200, matchRate: "12%", lastTriggered: "3 min ago", outcomeHits: 11424 },
  p18: { evaluations30d: 95200, matchRate: "1.4%", lastTriggered: "5 min ago", outcomeHits: 1333 },
};

function getUsageMetrics(policyId, workflowCount) {
  const seeded = USAGE_METRICS_SEED[policyId];
  if (seeded) return { ...seeded, workflowCount };
  return {
    evaluations30d: workflowCount ? 320 : 0,
    matchRate: workflowCount ? "24%" : "—",
    lastTriggered: workflowCount ? "3 days ago" : "—",
    outcomeHits: workflowCount ? 77 : 0,
    workflowCount,
  };
}

function formatMetric(value) {
  return typeof value === "number" ? value.toLocaleString() : value;
}

// shadcn-style tag variants — outline for categories, destructive only for negative outcomes
const NEGATIVE_OUTCOMES = new Set(["Block", "Hard Stop", "Cancel", "Terminate", "Escalate"]);

function outcomeVariant(outcome) {
  return NEGATIVE_OUTCOMES.has(outcome) ? "destructive" : "outline";
}

function branchVariant(kind) {
  if (kind === "IF") return "default";
  if (kind === "ELSE IF") return "secondary";
  return "outline";
}

function seedRuleForPolicy(existing, type) {
  const name = normalizeText(existing?.name);
  const outcome = (key, fallbackIndex = 0) => type.outcomes.find((item) => item.key === key)?.key || type.outcomes[fallbackIndex]?.key || type.outcomes[0].key;
  const base = {
    row: { source: "Country / Region", operator: "IS IN", value: "EU / GDPR Countries" },
    ifOutcome: type.outcomes[0].key,
    elseOutcome: type.outcomes[1]?.key || type.outcomes[0].key,
    notify: false,
  };
  const allow = outcome("Allow");

  /* ---- EPFO / India verification ---- */
  if (name.includes("do-not-hire employer")) {
    return { branches: [
      { kind: "IF", rows: [{ source: "Company (via UAN/EPFO)", operator: "IS IN", value: "Do Not Hire (DNH) List" }],
        outcome: outcome("Hard Stop"), reason: "Current or past employer is on the Do-Not-Hire list (EPFO UAN verified).",
        actions: ["Create Case"], notifications: [{ persona: "Recruiter", template: "Recruiter: Do-Not-Hire Match" }] },
      { kind: "ELSE", outcome: allow },
    ] };
  }
  if (name.includes("do-not-hire alias")) {
    return { branches: [
      { kind: "IF", rows: [{ source: "Company (via UAN/EPFO)", operator: "IS IN", value: "DNH List — aliases" }],
        outcome: outcome("Soft Stop"), reason: "Employment history matches an alias of a Do-Not-Hire organization.",
        notifications: [{ persona: "Recruiter", template: "Recruiter: Do-Not-Hire Match" }] },
      { kind: "ELSE", outcome: allow },
    ] };
  }
  if (name.includes("resume vs uan")) {
    return { branches: [
      { kind: "IF", rows: [{ source: "Company (via Resume/Application)", operator: "NOT SAME AS", value: "Company (via UAN/EPFO)" }],
        outcome: outcome("Hard Stop"), reason: "Resume employment history does not match EPFO UAN records.",
        actions: ["Create Case"], notifications: [{ persona: "Compliance Reviewer", template: "Recruiter: UAN / Resume Mismatch" }] },
      { kind: "ELSE", outcome: allow },
    ] };
  }
  if (name.includes("rehire performance")) {
    return { branches: [
      { kind: "IF", groups: [[{ source: "Rehire Flag", operator: "EQUALS", value: "Yes" }, { source: "Performance Outcome", operator: "EQUALS", value: "5" }]],
        outcome: outcome("Hard Stop"), reason: "Rehire candidate with lowest performance rating (5)." },
      { kind: "ELSE IF", groups: [[{ source: "Days Since Last Working Day", operator: "LESS THAN", value: "180" }], [{ source: "Performance Outcome", operator: "IS IN", value: "1, 2, 3, 4" }]],
        outcome: outcome("Soft Stop"), reason: "Recent departure (<6 months) with performance 1–4." },
      { kind: "ELSE IF", groups: [[{ source: "Days Since Last Working Day", operator: "BETWEEN", value: "365 – 1095" }], [{ source: "Performance Outcome", operator: "IS IN", value: "1, 2, 3, 4" }]],
        outcome: outcome("Monitor"), reason: "Departure 1–3 years ago with performance 1–4." },
      { kind: "ELSE", outcome: allow },
    ] };
  }

  /* ---- No-Poach program ---- */
  if (name.includes("concealment")) {
    return { branches: [
      { kind: "IF", rows: [{ source: "Company (via Resume/Application)", operator: "NOT SAME AS", value: "Company (via UAN/EPFO)" }],
        outcome: outcome("Hard Stop"), reason: "Suspected concealment of current employment with a Tier 1 protected client.",
        actions: ["Create Case"], notifications: [{ persona: "Compliance Reviewer", template: "Legal: No-Poach Confirmation Required" }] },
      { kind: "ELSE", outcome: allow },
    ] };
  }
  if (name.includes("alias & subsidiary")) {
    return { branches: [
      { kind: "IF", rows: [{ source: "Company (via UAN/EPFO)", operator: "IS IN", value: "No-Poach — Tier 1 (aliases + subsidiaries)" }],
        outcome: outcome("Soft Stop"), reason: "Alias or subsidiary of a Tier 1 protected client (EPFO UAN verified).",
        requiresApproval: true, approver: "Legal", deferToStage: "Offer",
        notifications: [{ persona: "Compliance Reviewer", template: "Legal: No-Poach Confirmation Required" }] },
      { kind: "ELSE", outcome: allow },
    ] };
  }
  if (name.includes("tier 2 cooling-off")) {
    return { branches: [
      { kind: "IF", rows: [{ source: "Company (via UAN/EPFO)", operator: "IS IN", value: "No-Poach — Tier 2" }],
        outcome: outcome("Soft Stop"), reason: "Departed a Tier 2 protected client within the applicable cooling-off period.",
        requiresApproval: true, approver: "Legal", deferToStage: "Offer",
        notifications: [{ persona: "Compliance Reviewer", template: "Legal: No-Poach Confirmation Required" }] },
      { kind: "ELSE", outcome: allow },
    ] };
  }
  if (name.includes("msa-expiry")) {
    return { branches: [
      { kind: "IF", rows: [{ source: "Company (via UAN/EPFO)", operator: "IS IN", value: "No-Poach — MSA expired" }],
        outcome: outcome("Transition"), reason: "No-poach restriction downgraded to Monitor following MSA expiry." },
      { kind: "ELSE", outcome: outcome("Hold", 1) },
    ] };
  }
  if (name.includes("rehire protected-client")) {
    return { branches: [
      { kind: "IF", groups: [[{ source: "Company (via UAN/EPFO)", operator: "IS IN", value: "No-Poach — Tier 1" }], [{ source: "Rehire Flag", operator: "EQUALS", value: "Yes" }]],
        outcome: outcome("Monitor"), reason: "Historical employer match — departure predates agreement OR cooling-off well elapsed." },
      { kind: "ELSE", outcome: allow },
    ] };
  }
  if (name.includes("no-poach")) {
    return { branches: [
      { kind: "IF", rows: [{ source: "Company (via UAN/EPFO)", operator: "IS IN", value: "No-Poach — Tier 1" }],
        outcome: outcome("Soft Stop"), reason: "Currently employed by a Tier 1 protected client (EPFO UAN verified).",
        requiresApproval: true, approver: "Legal", deferToStage: "Offer",
        notifications: [{ persona: "Compliance Reviewer", template: "Legal: No-Poach Confirmation Required" }] },
      { kind: "ELSE", outcome: allow },
    ] };
  }

  /* ---- Sourcing Agent (PDF 2) ---- */
  if (name.includes("consent gate")) {
    return { branches: [
      { kind: "IF", rows: [{ source: "Consent Status", operator: "NOT EQUALS", value: "Granted" }],
        outcome: outcome("Block"), reason: "Candidate has not granted sourcing/outreach consent.",
        notifications: [{ persona: "Candidate", template: "Candidate: Application Status Update" }] },
      { kind: "ELSE", outcome: allow },
    ] };
  }
  if (name.includes("current employee exclusion")) {
    return { branches: [
      { kind: "IF", rows: [{ source: "Employment Status", operator: "EQUALS", value: "Current Employee" }],
        outcome: outcome("Block"), reason: "Current employees are excluded from external sourcing (mandatory policy)." },
      { kind: "ELSE", outcome: allow },
    ] };
  }
  if (name.includes("country sourcing")) {
    return { branches: [
      { kind: "IF", rows: [{ source: "Country / Region", operator: "IS IN", value: "Restricted Countries" }],
        outcome: outcome("Block"), reason: "Automated sourcing is restricted in this jurisdiction." },
      { kind: "ELSE", outcome: allow },
    ] };
  }
  if (name.includes("job family suppression")) {
    return { branches: [
      { kind: "IF", rows: [{ source: "Job Family", operator: "IS IN", value: "Suppressed Families" }],
        outcome: outcome("Skip", 1), reason: "Job family suppressed for automated sourcing." },
      { kind: "ELSE", outcome: outcome("Advance") },
    ] };
  }
  if (name.includes("rehire cooling-off")) {
    return { branches: [
      { kind: "IF", groups: [[{ source: "Rehire Flag", operator: "EQUALS", value: "Yes" }], [{ source: "Days Since Last Working Day", operator: "LESS THAN", value: "90" }]],
        outcome: outcome("Soft Stop"), reason: "Rehire attempted within the cooling-off window." },
      { kind: "ELSE", outcome: allow },
    ] };
  }

  /* ---- Interview feature restrictions ---- */
  if (name.includes("interview feature restriction")) {
    return { branches: [
      { kind: "IF",
        groups: [[
          { source: "Country / Region", operator: "EQUALS", value: "United States" },
          { source: "Job Grade", operator: "IS IN", value: "Director+" },
        ]],
        outcome: outcome("Soft Stop"),
        controlledActions: ["Interview Recording"],
        reason: "For executive roles, recording must be approved by someone else before it can be enabled.",
        requiresApproval: true,
        approver: "Hiring Manager",
      },
      { kind: "ELSE IF", rows: [{ source: "Country / Region", operator: "EQUALS", value: "Germany" }],
        outcome: outcome("Block"),
        controlledActions: ["Interview Recording", "Interview Transcription"],
        reason: "Everything related to interview recording is blocked in Germany.",
      },
      { kind: "ELSE IF", rows: [{ source: "Country / Region", operator: "EQUALS", value: "Spain" }],
        outcome: outcome("Block"),
        controlledActions: ["AI Interview Analysis"],
        reason: "Only AI-generated interview insights are blocked in Spain.",
      },
      { kind: "ELSE", outcome: outcome("Allow"), controlledActions: [] },
    ] };
  }

  /* ---- Original demo policies ---- */
  if (name.includes("recording restriction")) {
    return { branches: [
      { kind: "IF", rows: [{ source: "Country / Region", operator: "IS IN", value: "EU / GDPR Countries" }],
        outcome: outcome("Block"), controlledAction: "Interview Recording",
        notifications: [{ persona: "Interviewer", template: NOTIFY_TEMPLATES[0] }] },
      { kind: "ELSE", outcome: outcome("Allow"), controlledAction: "Interview Recording" },
    ] };
  }
  if (name.includes("fit-score") || name.includes("fast track")) {
    return {
      row: { source: "Candidate Fit Score", operator: "GREATER THAN", value: "90" },
      ifOutcome: outcome("Advance"),
      elseOutcome: outcome("Skip", 1),
      notify: false,
    };
  }
  if (name.includes("compensation approval")) {
    return {
      row: { source: "Requisition Approval Status", operator: "NOT EQUALS", value: "Approved" },
      ifOutcome: outcome("Escalate", 2),
      elseOutcome: outcome("Allow"),
      notify: true,
    };
  }
  if (name.includes("hourly")) {
    return {
      row: { source: "Job Family", operator: "EQUALS", value: "Hourly" },
      ifOutcome: outcome("Allow"),
      elseOutcome: outcome("Block", 1),
      notify: false,
    };
  }
  if (name.includes("queue assignment")) {
    return {
      row: { source: "Sourcing Candidate Count", operator: "GREATER THAN", value: "50" },
      ifOutcome: outcome("Assign to Queue"),
      elseOutcome: outcome("Round-Robin", 2),
      notify: false,
    };
  }
  if (name.includes("offer withdrawal")) {
    return {
      row: { source: "Offer Acceptance Status", operator: "EQUALS", value: "Declined" },
      ifOutcome: outcome("Transition"),
      elseOutcome: outcome("Hold", 1),
      notify: true,
    };
  }

  return base;
}

function initScopeBlocks(existing) {
  if (!existing) return [];
  const blocks = [];
  (existing.scope || []).forEach((name) => blocks.push({ id: uid++, type: "audience", audienceName: name }));
  if (existing.scopeInline) {
    blocks.push({
      id: uid++, type: "custom", orGate: false,
      rows: [{ id: uid++, source: "Consent Status", operator: "EQUALS", value: "Granted" }],
    });
  }
  return blocks;
}

function buildScopeLabel(applicability, scopeBlocks) {
  const appParts = activeApplicability(applicability).map((a) => a.value);
  const blockParts = (scopeBlocks || []).map((block) => {
    if (block.type === "audience") return block.audienceName;
    const rows = block.rows.filter((r) => r.value);
    return rows.length
      ? rows.map((r) => `${r.source} ${r.operator} "${r.value}"`).join(", ")
      : "Custom conditions";
  });
  const parts = [...appParts, ...blockParts];
  return parts.length ? parts.join(" · ") : "All tenants and locations";
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function ScopeSummary({ scopeBlocks, applicability, groupsOnly = false }) {
  const appChips = groupsOnly ? [] : activeApplicability(applicability);
  if (!appChips.length && !scopeBlocks.length) return <Badge variant="secondary">Global</Badge>;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {appChips.map((a) => (
        <Badge key={a.dim} variant="outline">{a.label}: {a.value}</Badge>
      ))}
      {scopeBlocks.map((block, i) => (
        <span key={block.id} className="inline-flex items-center gap-1.5">
          {(i > 0 || appChips.length > 0) && <span className="text-[10px] font-medium text-muted-foreground">AND</span>}
          {block.type === "audience" ? (
            <Badge variant="outline">{block.audienceName}</Badge>
          ) : (
            <Badge variant="secondary">
              {block.rows.filter((r) => r.value).length
                ? block.rows.filter((r) => r.value).map((r) => `${r.source} ${r.operator} "${r.value}"`).join(", ")
                : "Custom conditions"}
            </Badge>
          )}
        </span>
      ))}
    </div>
  );
}

function ScopeBuilder({ scopeBlocks, setScopeBlocks, audiences }) {
  const usedAudiences = new Set(scopeBlocks.filter((b) => b.type === "audience").map((b) => b.audienceName));
  const availableAudiences = audiences.filter((a) => !usedAudiences.has(a.name));

  function updateBlock(id, patch) {
    setScopeBlocks(scopeBlocks.map((b) => b.id === id ? { ...b, ...patch } : b));
  }
  function removeBlock(id) {
    setScopeBlocks(scopeBlocks.filter((b) => b.id !== id));
  }
  function addAudienceBlock(audienceName) {
    setScopeBlocks([...scopeBlocks, { id: uid++, type: "audience", audienceName }]);
  }
  function addCustomBlock() {
    setScopeBlocks([...scopeBlocks, {
      id: uid++, type: "custom", orGate: false,
      rows: [{ id: uid++, source: DATA_SOURCES[0], operator: "IS IN", value: "" }],
    }]);
  }
  function addRow(blockId) {
    const block = scopeBlocks.find((b) => b.id === blockId);
    const operator = block.rows[0]?.operator || "IS IN";
    updateBlock(blockId, {
      rows: [...block.rows, { id: uid++, source: DATA_SOURCES[0], operator, value: "" }],
    });
  }
  function removeRow(blockId, rowId) {
    const block = scopeBlocks.find((b) => b.id === blockId);
    updateBlock(blockId, { rows: block.rows.filter((r) => r.id !== rowId) });
  }
  function updateRow(blockId, rowId, patch) {
    const block = scopeBlocks.find((b) => b.id === blockId);
    updateBlock(blockId, { rows: block.rows.map((r) => r.id === rowId ? { ...r, ...patch } : r) });
  }
  function setBlockOperator(blockId, operator) {
    const block = scopeBlocks.find((b) => b.id === blockId);
    updateBlock(blockId, { rows: block.rows.map((r) => ({ ...r, operator })) });
  }

  return (
    <div className="space-y-3">
      {scopeBlocks.length === 0 ? (
        <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
          No scope groups yet. This policy will evaluate globally.
        </div>
      ) : (
        scopeBlocks.map((block, bi) => {
          const audience = block.type === "audience" ? audiences.find((a) => a.name === block.audienceName) : null;
          return (
            <div key={block.id}>
              <div className="overflow-hidden rounded-lg border">
                <div className="flex items-center justify-between border-b bg-muted/40 px-3.5 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Group {bi + 1}</span>
                    <Badge variant={block.type === "audience" ? "outline" : "secondary"}>
                      {block.type === "audience" ? "Audience" : "Custom"}
                    </Badge>
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeBlock(block.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {block.type === "audience" ? (
                  <div className="space-y-2 p-3.5">
                    <p className="text-sm font-medium">{block.audienceName}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {audience?.summary.map((c, i) => (
                        <Badge key={i} variant="outline">{c.source} {c.operator} "{c.value}"</Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 p-3.5">
                    <ConditionRows
                      rows={block.rows}
                      orGate={block.orGate}
                      setOrGate={(value) => updateBlock(block.id, { orGate: value })}
                      onUpdateRow={(rid, patch) => updateRow(block.id, rid, patch)}
                      onRemoveRow={(rid) => removeRow(block.id, rid)}
                      onAddRow={() => addRow(block.id)}
                      onSetGroupOperator={(operator) => setBlockOperator(block.id, operator)}
                    />
                  </div>
                )}
              </div>
              {bi < scopeBlocks.length - 1 && (
                <div className="flex py-2">
                  <ConditionGateLabel staticLabel showToggle={false} />
                </div>
              )}
            </div>
          );
        })
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full border-dashed">
            <Plus className="h-3.5 w-3.5" /> Add group
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72">
          <DropdownMenuItem onClick={addCustomBlock}>
            <Plus className="h-3.5 w-3.5" /> New condition group
          </DropdownMenuItem>
          {availableAudiences.length > 0 && <DropdownMenuSeparator />}
          {availableAudiences.map((a) => (
            <DropdownMenuItem key={a.id} onClick={() => addAudienceBlock(a.name)}>
              <Users className="h-3.5 w-3.5 text-muted-foreground" /> {a.name}
            </DropdownMenuItem>
          ))}
          {availableAudiences.length === 0 && scopeBlocks.some((b) => b.type === "audience") && (
            <div className="px-2 py-1.5 text-xs text-muted-foreground">All audiences already added</div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <Label>{label}</Label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function SimpleSelect({ value, onChange, options, placeholder, labels = {} }) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder || "Select…"} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => <SelectItem key={o} value={o}>{labels[o] || o}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function MultiSelectChips({ value = [], onChange, options, labels = {}, placeholder = "Select…", variant = "default" }) {
  const selected = Array.isArray(value) ? value : (value ? [value] : []);
  const matchSelect = variant === "select";

  function toggle(option) {
    if (selected.includes(option)) onChange(selected.filter((item) => item !== option));
    else onChange([...selected, option]);
  }

  function removeChip(option, event) {
    event.preventDefault();
    event.stopPropagation();
    onChange(selected.filter((item) => item !== option));
  }

  const selectedLabel = selected.map((option) => labels[option] || option).join(", ");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            matchSelect
              ? "flex h-auto min-h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
              : "flex min-h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          )}
        >
          <div className="flex min-w-0 flex-1 items-center gap-1.5 text-left">
            {selected.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : matchSelect ? (
              <span className="truncate text-sm font-medium">{selectedLabel}</span>
            ) : (
              selected.map((option) => (
                <Badge key={option} variant="secondary" className="gap-1 pr-1 font-normal">
                  {labels[option] || option}
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(event) => removeChip(option, event)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") removeChip(option, event);
                    }}
                    className="rounded-sm text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </span>
                </Badge>
              ))
            )}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <DropdownMenuItem
              key={option}
              onSelect={(event) => {
                event.preventDefault();
                toggle(option);
              }}
              className="flex items-center justify-between gap-2"
            >
              <span>{labels[option] || option}</span>
              {active && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function outcomeToneBoxClass(tone) {
  const map = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    cyan: "border-cyan-200 bg-cyan-50 text-cyan-700",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
  };
  return map[tone] || map.slate;
}

function OutcomeOptionContent({ outcome, compact = false }) {
  const Icon = outcome.icon || CheckCircle;
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-left">
        <div className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded border", outcomeToneBoxClass(outcome.tone))}>
          <Icon className="h-3 w-3" />
        </div>
        <p className="text-sm font-medium leading-tight">{outcome.key}</p>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-3 text-left">
      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-md border", outcomeToneBoxClass(outcome.tone))}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-tight">{outcome.key}</p>
        {outcome.desc && (
          <p className="mt-1 text-xs leading-snug text-muted-foreground">{outcome.desc}</p>
        )}
      </div>
    </div>
  );
}

function OutcomeSelect({ outcomes, value, onChange, compactTrigger = false }) {
  const selected = outcomes.find((o) => o.key === value);
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger className={cn("h-auto min-h-10 shadow-sm", compactTrigger ? "py-2" : "py-2.5")}>
        {selected ? (
          <OutcomeOptionContent outcome={selected} compact={compactTrigger} />
        ) : (
          <SelectValue placeholder="Select outcome…" />
        )}
      </SelectTrigger>
      <SelectContent className="min-w-[var(--radix-select-trigger-width)]">
        {outcomes.map((o) => (
          <SelectItem key={o.key} value={o.key} className="items-start py-2.5 pr-9 [&>span:last-child]:w-full">
            <OutcomeOptionContent outcome={o} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function SectionCard({ title, subtitle, icon: Icon, children, right }) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 border-b bg-muted/20 py-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border bg-background text-primary shadow-sm">
            <Icon className="h-3.5 w-3.5" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-sm">{title}</CardTitle>
            {subtitle && <CardDescription>{subtitle}</CardDescription>}
          </div>
        </div>
        {right}
      </CardHeader>
      <CardContent className="space-y-5 p-6">{children}</CardContent>
    </Card>
  );
}

function ConfigurationSectionContent({ children }) {
  return (
    <div className="flex flex-1 justify-center overflow-auto px-6 py-6">
      <div className="w-full max-w-4xl">{children}</div>
    </div>
  );
}

function StatusDot({ status }) {
  const active = status === "Active";
  return (
    <Badge variant={active ? "outline" : "secondary"} className={cn("gap-1.5", active && "border-emerald-200 bg-emerald-50 text-emerald-700")}>
      <span className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-emerald-500" : "bg-muted-foreground/70")} />
      {status}
    </Badge>
  );
}

let uid = 1000;

/* ---------------- Reusable condition builder (used by Scope + Rules + Audiences) ---------------- */

function ConditionGateLabel({ orGate, onToggle, showToggle = true, staticLabel = false }) {
  const label = staticLabel ? "AND" : (orGate ? "OR" : "AND");
  const className = "inline-flex items-center gap-0.5 text-[14px] font-medium text-muted-foreground";

  if (!showToggle) {
    return <span className={className}>{label}</span>;
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(className, "rounded-md px-1 py-0.5 transition-colors hover:bg-muted/60 hover:text-foreground")}
      title={`Switch to ${orGate ? "AND" : "OR"}`}
    >
      {label}
      <ChevronDown className="h-3.5 w-3.5" />
    </button>
  );
}

function ConditionRows({ rows, orGate, setOrGate, onUpdateRow, onRemoveRow, onAddRow, onSetGroupOperator }) {
  const groupOperator = rows[0]?.operator || OPERATORS[0];
  const isFieldComparison = FIELD_COMPARISON_OPERATORS.has(groupOperator);

  return (
    <div className="space-y-0">
      {rows.map((row, index) => (
        <div key={row.id}>
          {index > 0 && (
            <div className="flex py-2">
              <ConditionGateLabel
                orGate={orGate}
                onToggle={() => setOrGate(!orGate)}
                showToggle={index === 1}
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="grid flex-1 grid-cols-[1.4fr_1fr_1fr] gap-2">
              <SimpleSelect value={row.source} onChange={(v) => onUpdateRow(row.id, { source: v })} options={DATA_SOURCES} />
              <SimpleSelect value={groupOperator} onChange={onSetGroupOperator} options={OPERATORS} />
              {isFieldComparison ? (
                <SimpleSelect
                  value={row.value}
                  onChange={(v) => onUpdateRow(row.id, { value: v })}
                  options={DATA_SOURCES.filter((d) => d !== row.source)}
                  placeholder="compare to field…"
                />
              ) : (
                <Input value={row.value} onChange={(e) => onUpdateRow(row.id, { value: e.target.value })} placeholder="value or list reference" />
              )}
            </div>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => onRemoveRow(row.id)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
      <div className="mt-3">
        <Button type="button" variant="link" size="sm" className="h-auto px-0 py-1 text-xs" onClick={onAddRow}>
          <Plus className="h-3.5 w-3.5" /> Add condition
        </Button>
      </div>
    </div>
  );
}

function createBranch(type, partial = {}) {
  return {
    id: uid++,
    kind: "IF",
    groups: [{ id: uid++, rows: [{ id: uid++, source: DATA_SOURCES[0], operator: "IS IN", value: "" }] }],
    orGate: false,
    outcome: type.outcomes[0].key,
    trigger: TRIGGERS[0],
    controlledAction: "",
    controlledActions: [],
    reason: "",
    requiresApproval: false,
    approver: APPROVERS[0],
    deferToStage: "",
    actions: [],
    notifications: [],
    ...partial,
  };
}

// Build a fully-formed branch from a lightweight seed spec (used by seedRuleForPolicy).
function seedBranch(type, spec) {
  const groups = spec.groups
    ? spec.groups.map((rows) => ({ id: uid++, rows: rows.map((r) => ({ id: uid++, source: DATA_SOURCES[0], operator: "IS IN", value: "", ...r })) }))
    : [{ id: uid++, rows: (spec.rows || [{}]).map((r) => ({ id: uid++, source: DATA_SOURCES[0], operator: "IS IN", value: "", ...r })) }];
  return createBranch(type, {
    kind: spec.kind || "IF",
    groups,
    orGate: spec.orGate || false,
    outcome: spec.outcome || type.outcomes[0].key,
    trigger: spec.trigger || TRIGGERS[0],
    controlledActions: spec.controlledActions || (spec.controlledAction ? [spec.controlledAction] : []),
    controlledAction: spec.controlledAction || spec.controlledActions?.[0] || "",
    reason: spec.reason || "",
    requiresApproval: spec.requiresApproval || false,
    approver: spec.approver || APPROVERS[0],
    deferToStage: spec.deferToStage || "",
    actions: (spec.actions || []).map((a) => createAction(a)),
    notifications: (spec.notifications || []).map((n) => ({ id: uid++, persona: n.persona, template: n.template })),
  });
}

function branchesFromSeed(type, seed) {
  if (seed.branches) return seed.branches.map((b) => seedBranch(type, b));
  return [
    seedBranch(type, {
      kind: "IF",
      rows: [seed.row],
      outcome: seed.ifOutcome,
      actions: seed.notify ? ["Create Case"] : [],
      notifications: seed.notify ? [{ persona: "Interviewer", template: NOTIFY_TEMPLATES[0] }] : [],
    }),
    seedBranch(type, { kind: "ELSE", outcome: seed.elseOutcome }),
  ];
}

function BranchActionsEditor({ branch, type, onChange }) {
  const availableActions = type.actions.filter((action) => action !== "Notify");
  const actions = (branch.actions || []).map(normalizeAction);

  function updateAction(id, patch) {
    onChange(actions.map((item) => item.id === id ? { ...item, ...patch } : item));
  }

  function changeActionType(id, newType) {
    onChange(actions.map((item) => item.id === id ? createAction(newType, id) : item));
  }

  return (
    <Field label="System actions">
      <div className="space-y-3">
        {actions.length === 0 ? (
          <p className="text-xs text-muted-foreground">No system actions added.</p>
        ) : (
          actions.map((action) => {
            const meta = ACTION_CONFIG[action.type];
            return (
              <div key={action.id} className="space-y-3 rounded-lg border bg-muted/20 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">Action</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => onChange(actions.filter((item) => item.id !== action.id))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Action type</Label>
                    <SimpleSelect
                      value={action.type}
                      onChange={(value) => changeActionType(action.id, value)}
                      options={availableActions}
                    />
                  </div>
                  {meta && (
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">{meta.label}</Label>
                      <SimpleSelect
                        value={action.config?.[meta.field] || meta.options[0]}
                        onChange={(value) => updateAction(action.id, { config: { ...action.config, [meta.field]: value } })}
                        options={meta.options}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div className="border-t border-border/50 pt-3">
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto px-0 py-1 text-xs"
            onClick={() => onChange([...actions, createAction(availableActions[0])])}
          >
            <Plus className="h-3.5 w-3.5" /> Add action
          </Button>
        </div>
      </div>
    </Field>
  );
}

function BranchNotificationsEditor({ branch, onChange }) {
  const notifications = branch.notifications || [];

  const addButton = (
    <Button
      type="button"
      variant="link"
      size="sm"
      className="h-auto px-0 py-1 text-xs"
      onClick={() => onChange([...notifications, { id: uid++, persona: PERSONAS[0], template: NOTIFY_TEMPLATES[0] }])}
    >
      <Plus className="h-3.5 w-3.5" /> Add notification
    </Button>
  );

  return (
    <Field label="Notifications">
      {notifications.length === 0 ? (
        addButton
      ) : (
        <div className="rounded-lg border bg-muted/20 p-3">
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_1fr_2rem] gap-2">
              <Label className="text-xs text-muted-foreground">Persona</Label>
              <Label className="text-xs text-muted-foreground">Message template</Label>
              <span />
            </div>
            {notifications.map((notification) => (
              <div key={notification.id} className="grid grid-cols-[1fr_1fr_2rem] items-center gap-2">
                <SimpleSelect
                  value={notification.persona}
                  onChange={(value) => onChange(notifications.map((item) => item.id === notification.id ? { ...item, persona: value } : item))}
                  options={PERSONAS}
                />
                <SimpleSelect
                  value={notification.template}
                  onChange={(value) => onChange(notifications.map((item) => item.id === notification.id ? { ...item, template: value } : item))}
                  options={NOTIFY_TEMPLATES}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => onChange(notifications.filter((item) => item.id !== notification.id))}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-2">{addButton}</div>
        </div>
      )}
    </Field>
  );
}

function BranchEnforcementEditor({ branch, onChange }) {
  const [reasonOpen, setReasonOpen] = useState(() => !!branch.reason?.trim());
  const deferValue = branch.deferToStage || "Immediate";

  function toggleReason(open) {
    setReasonOpen(open);
    if (!open) onChange({ reason: "" });
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border bg-muted/20 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium">Outcome reason</p>
            <p className="text-xs text-muted-foreground">Optional note for reviewers and audit logs.</p>
          </div>
          <Switch checked={reasonOpen} onCheckedChange={toggleReason} />
        </div>
        {reasonOpen && (
          <Textarea
            className="mt-3"
            value={branch.reason || ""}
            onChange={(e) => onChange({ reason: e.target.value })}
            rows={2}
            placeholder="e.g. Currently employed by a Tier 1 protected client (EPFO UAN verified)."
          />
        )}
      </div>

      <div className="rounded-lg border bg-muted/20 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium">Require approval before enforcing</p>
            <p className="text-xs text-muted-foreground">Hold the outcome until a human confirms (e.g. legal sign-off).</p>
          </div>
          <Switch
            checked={!!branch.requiresApproval}
            onCheckedChange={(checked) => onChange({ requiresApproval: checked })}
          />
        </div>
        {branch.requiresApproval && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Approver</Label>
              <SimpleSelect value={branch.approver || APPROVERS[0]} onChange={(v) => onChange({ approver: v })} options={APPROVERS} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Enforce at stage</Label>
              <SimpleSelect
                value={deferValue}
                onChange={(v) => onChange({ deferToStage: v === "Immediate" ? "" : v })}
                options={ENFORCEMENT_STAGES}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ConditionGroupBuilder({ groups, setGroups, orGate, setOrGate, singleGroup = false }) {
  function addRow(gid) {
    setGroups(groups.map((g) => {
      if (g.id !== gid) return g;
      const operator = g.rows[0]?.operator || "IS IN";
      return { ...g, rows: [...g.rows, { id: uid++, source: DATA_SOURCES[0], operator, value: "" }] };
    }));
  }
  function removeRow(gid, rid) {
    setGroups(groups.map((g) => g.id === gid ? { ...g, rows: g.rows.filter((r) => r.id !== rid) } : g));
  }
  function updateRow(gid, rid, patch) {
    setGroups(groups.map((g) => g.id === gid ? { ...g, rows: g.rows.map((r) => r.id === rid ? { ...r, ...patch } : r) } : g));
  }
  function setGroupOperator(gid, operator) {
    setGroups(groups.map((g) => g.id === gid ? { ...g, rows: g.rows.map((r) => ({ ...r, operator })) } : g));
  }
  function addGroup() {
    const operator = groups[groups.length - 1]?.rows[0]?.operator || "IS IN";
    setGroups([...groups, { id: uid++, rows: [{ id: uid++, source: DATA_SOURCES[0], operator, value: "" }] }]);
  }
  function removeGroup(gid) { if (groups.length > 1) setGroups(groups.filter((g) => g.id !== gid)); }

  return (
    <div className="space-y-3">
      {groups.map((g, gi) => (
        <div key={g.id}>
          {gi > 0 && (
            <div className="flex pb-3">
              <ConditionGateLabel staticLabel showToggle={false} />
            </div>
          )}
          <div className="overflow-hidden rounded-lg border">
            {groups.length > 1 && (
              <div className="flex justify-end border-b bg-muted/50 px-3.5 py-1.5">
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeGroup(g.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
            <div className="p-3.5">
              <ConditionRows
                rows={g.rows}
                orGate={orGate}
                setOrGate={setOrGate}
                onUpdateRow={(rid, patch) => updateRow(g.id, rid, patch)}
                onRemoveRow={(rid) => removeRow(g.id, rid)}
                onAddRow={() => addRow(g.id)}
                onSetGroupOperator={(operator) => setGroupOperator(g.id, operator)}
              />
            </div>
          </div>
        </div>
      ))}
      {!singleGroup && (
        <Button type="button" variant="outline" className="w-full border-dashed" onClick={addGroup}>
          <Plus className="h-3.5 w-3.5" /> Add condition group
        </Button>
      )}
    </div>
  );
}

/* ---------------- Sidebar shell ---------------- */

const NAV_PRIMARY = [
  { id: "library", label: "Policies", icon: Shield },
  { id: "audiences", label: "Audiences", icon: Users },
  { id: "messages", label: "Message Library", icon: MessageSquare },
  { id: "hitl", label: "HITL Registry", icon: UserCheck },
  { id: "testlab", label: "Test Lab", icon: Waypoints },
];

const NAV_SECONDARY = [
  { id: "lists", label: "Managed Lists", icon: ListChecks },
  { id: "types", label: "Policy Types", icon: Database },
  { id: "functions", label: "Business Functions", icon: Building2 },
];

// Decorative icon rail — not interactive; shows which product area is active.
const ICON_RAIL_TOP = [
  { icon: Home },
  { divider: true },
  { icon: ChartNetwork },
  { icon: GitBranch },
  { icon: Shield, active: true },
  { icon: Bot },
  { divider: true },
  { icon: ClipboardCheck },
  { icon: List },
  { icon: TowerControl },
];

function IconRailTile({ item, navIconClass }) {
  if (item.divider) return <div className="h-px w-6 bg-border/80" />;
  const Icon = item.icon;
  return (
    <div
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-lg border",
        item.active ? "border-primary/25 bg-primary/10" : "border-border bg-white"
      )}
      aria-hidden
    >
      <Icon className={cn("h-[18px] w-[18px]", item.active ? "text-primary" : navIconClass)} />
    </div>
  );
}

function NavItem({ item, view, setView, setEditingId, navIconClass }) {
  const Icon = item.icon;
  const active = view === item.id;
  return (
    <button
      type="button"
      onClick={() => { setView(item.id); setEditingId(null); }}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
        active
          ? "bg-primary/10 font-medium text-primary"
          : "text-foreground/80 hover:bg-muted/60"
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", navIconClass)} />
      {item.label}
    </button>
  );
}

function AppSidebar({ view, setView, setEditingId, collapsed, setCollapsed }) {
  const navIconClass = "text-[#464F5E]";

  return (
    <aside className="flex shrink-0">
      {/* Icon rail — decorative only */}
      <div className="flex w-[52px] shrink-0 flex-col items-center border-r bg-[#f3f3f6] py-3">
        <div className="flex flex-col items-center gap-3">
          {ICON_RAIL_TOP.map((item, i) => (
            <IconRailTile key={i} item={item} navIconClass={navIconClass} />
          ))}
        </div>
        <div className="flex-1" />
        <div className="flex flex-col items-center gap-3">
          <div className="h-px w-6 bg-border/80" />
          <IconRailTile item={{ icon: Code }} navIconClass={navIconClass} />
        </div>
      </div>

      {/* Policy Center panel */}
      {!collapsed && (
        <div className="flex w-[200px] shrink-0 flex-col border-r bg-white">
          <div className="px-4 pb-2 pt-5">
            <p className="text-sm text-muted-foreground">Policy Center</p>
          </div>
          <nav className="flex-1 space-y-0.5 px-2">
            {NAV_PRIMARY.map((n) => (
              <NavItem key={n.id} item={n} view={view} setView={setView} setEditingId={setEditingId} navIconClass={navIconClass} />
            ))}
            <Separator className="my-2" />
            {NAV_SECONDARY.map((n) => (
              <NavItem key={n.id} item={n} view={view} setView={setView} setEditingId={setEditingId} navIconClass={navIconClass} />
            ))}
          </nav>
          <div className="flex justify-end p-2">
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", navIconClass)}
              onClick={() => setCollapsed(true)}
              title="Collapse sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {collapsed && (
        <div className="flex w-10 shrink-0 flex-col border-r bg-white">
          <div className="flex justify-center p-2">
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", navIconClass)}
              onClick={() => setCollapsed(false)}
              title="Expand sidebar"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </aside>
  );
}

export default function PolicyLibraryApp() {
  const [view, setView] = useState("library");
  const [configMode, setConfigMode] = useState("policy");
  const [policies, setPolicies] = useState(POLICIES_SEED);
  const [audiences, setAudiences] = useState(AUDIENCES_SEED);
  const [taxonomy, setTaxonomy] = useState(TAXONOMY_SEED);
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(""), 2200); }

  function openBuilder(id) { setEditingId(id); setView("builder"); }
  function newPolicy() { setEditingId("new"); setView("builder"); }
  const inBuilder = view === "builder";

  return (
    <div className="flex min-h-screen bg-[#f8f8fb] text-foreground">
      {!inBuilder && (
        <AppSidebar
          view={view}
          setView={setView}
          setEditingId={setEditingId}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />
      )}

      {/* Main */}
      <main className="min-w-0 flex-1">
        {view === "library" && <LibraryView policies={policies} openBuilder={openBuilder} newPolicy={newPolicy} />}
        {view === "audiences" && <AudiencesView audiences={audiences} setAudiences={setAudiences} showToast={showToast} />}
        {view === "messages" && (
          <PlaceholderView
            title="Message Library"
            description="Notification templates and outbound messages used by policy outcomes."
            icon={MessageSquare}
          />
        )}
        {view === "hitl" && (
          <PlaceholderView
            title="HITL Registry"
            description="Human-in-the-loop approval gates, approvers, and escalation rules."
            icon={UserCheck}
          />
        )}
        {view === "testlab" && (
          <PlaceholderView
            title="Test Lab"
            description="Run policy scenarios against sample candidate and workflow data."
            icon={Waypoints}
          />
        )}
        {view === "lists" && <ListsView />}
        {view === "types" && <TypesView />}
        {view === "functions" && <FunctionsView taxonomy={taxonomy} setTaxonomy={setTaxonomy} showToast={showToast} />}
        {view === "builder" && (
          <BuilderView
            policyId={editingId}
            policies={policies}
            setPolicies={setPolicies}
            audiences={audiences}
            setAudiences={setAudiences}
            taxonomy={taxonomy}
            configMode={configMode}
            onExit={() => { setView("library"); setEditingId(null); }}
            showToast={showToast}
          />
        )}
      </main>

      <ConfiguratorModeSwitcher
        mode={configMode}
        onChange={setConfigMode}
        insetLeft={inBuilder ? "1.5rem" : sidebarCollapsed ? "4.5rem" : "17.5rem"}
      />

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm text-primary-foreground shadow-lg">
          <Check className="h-4 w-4 text-emerald-400" /> {toast}
        </div>
      )}
    </div>
  );
}

/* ---------------- Library view ---------------- */

function LibraryView({ policies, openBuilder, newPolicy }) {
  const [typeFilter, setTypeFilter] = useState("All");
  const [search, setSearch] = useState("");
  const filtered = policies.filter((p) =>
    (typeFilter === "All" || p.type === typeFilter) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Policy Library</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{policies.length} policies across {POLICY_TYPES.length} types</p>
        </div>
        <Button onClick={newPolicy}><Plus className="h-4 w-4" /> New Policy</Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] max-w-xs flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search policies…" className="pl-8" />
        </div>
        {["All", ...POLICY_TYPES.map((t) => t.key)].map((t) => {
          const active = typeFilter === t;
          return (
            <Button
              key={t}
              size="sm"
              variant="outline"
              className={cn(active && SELECTED_CHIP_CLASSES)}
              onClick={() => setTypeFilter(t)}
            >
              {t}
            </Button>
          );
        })}
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Business Function</TableHead>
              <TableHead>Trigger</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="bg-muted/50">Source</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => (
              <TableRow key={p.id} onClick={() => openBuilder(p.id)} className="cursor-pointer">
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell><Badge variant="outline">{p.type}</Badge></TableCell>
                <TableCell className="text-muted-foreground">
                  <span className="opacity-70">{p.domain}</span> <ChevronRight className="inline h-3 w-3 opacity-50" /> {p.fn}
                </TableCell>
                <TableCell>
                  {p.trigger ? <span className="text-xs text-muted-foreground">{p.trigger}</span> : <span className="text-xs text-muted-foreground">—</span>}
                </TableCell>
                <TableCell>
                  {p.scope.length === 0 && !p.scopeInline && !activeApplicability(p.applicability).length
                    ? <Badge variant="secondary">Global</Badge>
                    : <div className="flex flex-wrap gap-1">
                        {activeApplicability(p.applicability).map((a) => <Badge key={a.dim} variant="outline">{a.value}</Badge>)}
                        {p.scope.map((s) => <Badge key={s} variant="outline">{s}</Badge>)}
                        {p.scopeInline && <Badge variant="secondary">Custom group</Badge>}
                      </div>}
                </TableCell>
                <TableCell><StatusDot status={p.status} /></TableCell>
                <TableCell className="max-w-[14rem] bg-muted/40">
                  <Input
                    value={p.source || "—"}
                    disabled
                    readOnly
                    tabIndex={-1}
                    className="h-8 cursor-default border-0 bg-transparent px-2 text-xs text-muted-foreground shadow-none disabled:cursor-default disabled:opacity-100"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

/* ---------------- Audiences view ---------------- */

function AudiencesView({ audiences, setAudiences, showToast }) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [groups, setGroups] = useState([{ id: uid++, rows: [{ id: uid++, source: DATA_SOURCES[0], operator: "IS IN", value: "" }] }]);
  const [orGate, setOrGate] = useState(false);
  const [expanded, setExpanded] = useState(null);

  function save() {
    if (!name.trim()) return;
    const summary = groups.flatMap((g) => g.rows).filter((r) => r.value).map((r) => ({ source: r.source, operator: r.operator, value: r.value }));
    setAudiences([...audiences, { id: `aud-${uid++}`, name, summary, usedBy: [] }]);
    setCreating(false); setName(""); setGroups([{ id: uid++, rows: [{ id: uid++, source: DATA_SOURCES[0], operator: "IS IN", value: "" }] }]);
    showToast("Audience created");
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Audiences</h1>
        <Button onClick={() => setCreating(!creating)}><Plus className="h-4 w-4" /> New Audience</Button>
      </div>
      <p className="mb-5 text-sm text-muted-foreground">Defined once, referenced by any number of policies. Editing here updates every policy that uses it.</p>

      {creating && (
        <Card className="mb-5 border-primary/30">
          <CardContent className="space-y-4 p-5">
            <Field label="Audience name">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. APAC Contract Candidates" />
            </Field>
            <ConditionGroupBuilder groups={groups} setGroups={setGroups} orGate={orGate} setOrGate={setOrGate} />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
              <Button onClick={save}><Save className="h-3.5 w-3.5" /> Save Audience</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3.5">
        {audiences.map((a) => (
          <Card key={a.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted"><Users className="h-3.5 w-3.5 text-muted-foreground" /></div>
                  <span className="text-sm font-semibold">{a.name}</span>
                </div>
                <Button variant={a.usedBy.length > 0 ? "secondary" : "ghost"} size="sm" className="h-6 px-2 text-xs"
                  onClick={() => setExpanded(expanded === a.id ? null : a.id)}>
                  Used by {a.usedBy.length}
                </Button>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {a.summary.map((c, i) => (
                  <Badge key={i} variant="outline">{c.source} {c.operator} "{c.value}"</Badge>
                ))}
              </div>
              {expanded === a.id && a.usedBy.length > 0 && (
                <div className="mt-3 space-y-1 border-t pt-3">
                  {a.usedBy.map((p) => (
                    <div key={p} className="flex items-center gap-1.5 text-xs text-muted-foreground"><Link2 className="h-3 w-3" /> {p}</div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Placeholder views ---------------- */

function PlaceholderView({ title, description, icon: Icon }) {
  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <div className="mb-1 flex items-center gap-2.5">
        <Icon className="h-5 w-5 text-[#464F5E]" />
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

/* ---------------- Managed Lists registry view ---------------- */

function ListsView() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Managed Lists</h1>
      <p className="mb-5 text-sm text-muted-foreground">Reference data that policies match against — tiered no-poach lists, do-not-hire employers, and competitor exclusions. Tier, cooling-off period, and alias/subsidiary handling are attributes of the list, so policies stay simple.</p>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>List</TableHead>
              <TableHead>Kind</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Entries</TableHead>
              <TableHead>Cooling-off</TableHead>
              <TableHead>Alias / Subsidiary</TableHead>
              <TableHead>Source</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MANAGED_LISTS.map((list) => (
              <TableRow key={list.id}>
                <TableCell>
                  <div className="font-medium">{list.name}</div>
                  <div className="mt-0.5 max-w-md text-xs text-muted-foreground">{list.note}</div>
                </TableCell>
                <TableCell><Badge variant={list.kind === "No-Poach" ? "default" : "outline"}>{list.kind}</Badge></TableCell>
                <TableCell>{list.tier ? <Badge variant="secondary">{list.tier}</Badge> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                <TableCell className="text-muted-foreground">{list.entries.toLocaleString()}</TableCell>
                <TableCell>{list.coolingOff ? <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">{list.coolingOff}</Badge> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {list.aliases && <Badge variant="secondary">Aliases</Badge>}
                    {list.subsidiaries && <Badge variant="secondary">Subsidiaries</Badge>}
                    {!list.aliases && !list.subsidiaries && <span className="text-xs text-muted-foreground">—</span>}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{list.source}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Button variant="outline" className="mt-3.5 w-full border-dashed">
        <Plus className="h-3.5 w-3.5" /> Register new managed list
        <span className="ml-1 font-normal text-muted-foreground">— platform admin, config only</span>
      </Button>
    </div>
  );
}

/* ---------------- Policy Types registry view ---------------- */

function TypesView() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Policy Types</h1>
      <p className="mb-5 text-sm text-muted-foreground">Each type declares its allowed outcomes, rule shape, and binding rules. Adding a new type is a config change — no engineering or redesign required.</p>

      <div className="space-y-3.5">
        {POLICY_TYPES.map((t) => {
          const Icon = t.icon;
          return (
            <Card key={t.key}>
              <CardContent className="p-5">
                <div className="mb-3 flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted"><Icon className="h-4 w-4" /></div>
                  <div>
                    <div className="font-semibold">{t.key}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{t.description}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <div className="mb-1.5 text-xs font-medium text-muted-foreground">Allowed outcomes</div>
                    <div className="flex flex-wrap gap-1">{t.outcomes.map((o) => <Badge key={o.key} variant={outcomeVariant(o.key)}>{o.key}</Badge>)}</div>
                  </div>
                  <div>
                    <div className="mb-1.5 text-xs font-medium text-muted-foreground">Rule shape</div>
                    <div className="text-xs text-muted-foreground">IF / ELSE IF / ELSE · FIRST_MATCH · one outcome per branch</div>
                  </div>
                  <div>
                    <div className="mb-1.5 text-xs font-medium text-muted-foreground">Available actions</div>
                    <div className="flex flex-wrap gap-1">{t.actions.map((a) => <Badge key={a} variant="secondary">{a}</Badge>)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        <Button variant="outline" className="w-full border-dashed">
          <Plus className="h-3.5 w-3.5" /> Register new policy type
          <span className="ml-1 font-normal text-muted-foreground">— platform admin, config only</span>
        </Button>
      </div>
    </div>
  );
}

/* ---------------- Business Functions taxonomy view ---------------- */

function FunctionsView({ taxonomy, setTaxonomy, showToast }) {
  const [newDomain, setNewDomain] = useState("");
  const [newFn, setNewFn] = useState({});

  function addDomain() {
    if (!newDomain.trim() || taxonomy[newDomain]) return;
    setTaxonomy({ ...taxonomy, [newDomain]: [] });
    setNewDomain(""); showToast("Domain added");
  }
  function addFunction(domain) {
    const val = newFn[domain];
    if (!val || !val.trim()) return;
    setTaxonomy({ ...taxonomy, [domain]: [...taxonomy[domain], val] });
    setNewFn({ ...newFn, [domain]: "" }); showToast("Function added");
  }
  function removeFunction(domain, fn) {
    setTaxonomy({ ...taxonomy, [domain]: taxonomy[domain].filter((f) => f !== fn) });
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Business Functions</h1>
      <p className="mb-5 text-sm text-muted-foreground">Two-level taxonomy — Domain implies Function. Editable by admins without a release.</p>

      <div className="space-y-3.5">
        {Object.entries(taxonomy).map(([domain, fns]) => (
          <Card key={domain}>
            <CardContent className="p-4">
              <div className="mb-3 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">{domain}</span>
              </div>
              <div className="mb-3 flex flex-wrap gap-1.5 pl-6">
                {fns.map((f) => (
                  <Badge key={f} variant="secondary" className="gap-1">
                    {f}
                    <button onClick={() => removeFunction(domain, f)} className="text-muted-foreground hover:text-destructive"><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-2 pl-6">
                <Input value={newFn[domain] || ""} onChange={(e) => setNewFn({ ...newFn, [domain]: e.target.value })}
                  placeholder="Add function…" className="h-8 max-w-xs text-xs" />
                <Button variant="link" size="sm" className="h-auto text-xs" onClick={() => addFunction(domain)}>
                  <Plus className="h-3.5 w-3.5" /> Add
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        <div className="flex items-center gap-2">
          <Input value={newDomain} onChange={(e) => setNewDomain(e.target.value)} placeholder="New domain name…" className="flex-1 border-dashed" />
          <Button variant="outline" className="border-dashed" onClick={addDomain}><Plus className="h-3.5 w-3.5" /> Add domain</Button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Builder ---------------- */

const BUILDER_TABS = [
  { id: "context", label: "Context", icon: Sparkle },
  { id: "configuration", label: "Configuration", icon: Settings },
  { id: "usage", label: "Usage", icon: Activity },
];

const CONFIG_SECTIONS = [
  { id: "general", label: "General", icon: FileText },
  { id: "scope", label: "Scope", icon: MapPin },
  { id: "rules", label: "Rules", icon: GitBranch },
  { id: "summary", label: "Summary", icon: FileText },
];

const SAMPLE_DOCS = [
  "GDPR_Interview_Recording_Guidelines.pdf",
  "EU_Data_Privacy_Policy_2024.docx",
  "Interview_Intelligence_SOP.pdf",
];

function BuilderView({ policyId, policies, setPolicies, audiences, taxonomy, configMode, onExit, showToast }) {
  const existing = policies.find((p) => p.id === policyId);
  const [activeTab, setActiveTab] = useState("context");
  const [configSection, setConfigSection] = useState("general");
  const [name, setName] = useState(existing?.name || "Untitled Policy");
  const [status, setStatus] = useState(existing?.status || "Draft");
  const [description, setDescription] = useState(
    existing?.name === "EU Recording Restriction"
      ? "Block interview recording for candidates in GDPR jurisdictions and notify interviewers when recording is disabled."
      : existing?.name === "Interview Feature Restriction"
        ? "Country-specific rules for interview recording and AI insights: soft stop with approval for US executive roles, full recording block in Germany, and AI insights block in Spain."
        : "",
  );

  const [aiPrompt, setAiPrompt] = useState(() => defaultContextPrompt(existing));
  const [documents, setDocuments] = useState(existing ? [SAMPLE_DOCS[0], SAMPLE_DOCS[2]] : []);
  const [aiGenerated, setAiGenerated] = useState(!!existing);
  const [generating, setGenerating] = useState(false);

  const [typeKey, setTypeKey] = useState(existing?.type || "Guardrail");
  const type = POLICY_TYPES.find((t) => t.key === typeKey);
  const seededRule = seedRuleForPolicy(existing, type);

  const [domain, setDomain] = useState(existing?.domain || Object.keys(taxonomy)[0]);
  const [fn, setFn] = useState(existing?.fn || taxonomy[Object.keys(taxonomy)[0]][0]);
  const [personas, setPersonas] = useState(existing?.personas || []);
  const [trigger, setTrigger] = useState(existing?.trigger || TRIGGERS[0]);
  const [controlledAction, setControlledAction] = useState(() => defaultControlledAction(existing));
  const [applicability, setApplicability] = useState({ ...defaultApplicability, ...(existing?.applicability || {}) });

  const [scopeBlocks, setScopeBlocks] = useState(() => initScopeBlocks(existing));

  const [branches, setBranches] = useState(() => hydrateBranchesForMode(
    branchesFromSeed(type, seededRule),
    { existing, fn, policyControlledAction: defaultControlledAction(existing), policyTrigger: existing?.trigger || TRIGGERS[0], configMode },
  ));

  const controlledActionOptions = getControlledActionOptions(fn);

  function syncBranchesForMode(nextMode) {
    if (nextMode === "rule") {
      setBranches((prev) => prev.map((b) => ({
        ...b,
        trigger: b.trigger || trigger,
        controlledActions: getBranchControlledActions(b, controlledAction).length
          ? getBranchControlledActions(b, controlledAction)
          : defaultBranchControlledActions(fn, controlledAction, b.outcome),
        controlledAction: (getBranchControlledActions(b, controlledAction)[0]
          || defaultBranchControlledActions(fn, controlledAction, b.outcome)[0]
          || ""),
      })));
    }
  }

  useEffect(() => {
    syncBranchesForMode(configMode);
  }, [configMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const linkedWorkflows = WORKFLOWS_SEED.filter((w) => w.policies.includes(existing?.id));

  function addElseIf() {
    const insertAt = branches.length - 1;
    const nb = createBranch(type, { kind: "ELSE IF" });
    setBranches([...branches.slice(0, insertAt), nb, ...branches.slice(insertAt)]);
  }
  function removeBranch(id) { setBranches(branches.filter((b) => b.id !== id)); }
  function updateBranch(id, patch) { setBranches(branches.map((b) => b.id === id ? { ...b, ...patch } : b)); }

  function generateFromAI() {
    if (!aiPrompt.trim()) return;
    setGenerating(true);
    setTimeout(() => {
      const inferredType = aiPrompt.toLowerCase().includes("route") || aiPrompt.toLowerCase().includes("fast track") ? "Routing"
        : aiPrompt.toLowerCase().includes("assign") ? "Assignment"
        : aiPrompt.toLowerCase().includes("transition") || aiPrompt.toLowerCase().includes("state") ? "State Transition"
        : "Guardrail";
      const inferredName = aiPrompt.length > 48 ? aiPrompt.slice(0, 45) + "…" : aiPrompt;
      setTypeKey(inferredType);
      setName(inferredName.charAt(0).toUpperCase() + inferredName.slice(1));
      setDescription(aiPrompt);
      setAiGenerated(true);
      setGenerating(false);
      showToast("Policy draft generated from context");
    }, 1200);
  }

  function addDocument(doc) {
    if (!documents.includes(doc)) setDocuments([...documents, doc]);
  }
  function removeDocument(doc) { setDocuments(documents.filter((d) => d !== doc)); }

  function publish() {
    const scope = scopeBlocks.filter((b) => b.type === "audience").map((b) => b.audienceName);
    const scopeInline = scopeBlocks.some((b) => b.type === "custom");
    const base = { id: existing?.id || `p${uid++}`, name, type: typeKey, domain, fn, scope, scopeInline, status, personas, applicability, source: existing?.source, configMode };
    const record = configMode === "rule"
      ? {
          ...base,
          trigger: branches[0]?.trigger || trigger,
          branchSettings: branches.map((b, index) => ({
            index,
            kind: b.kind,
            trigger: b.trigger,
            controlledAction: b.controlledAction,
            controlledActions: getBranchControlledActions(b),
          })),
        }
      : { ...base, trigger, controlledAction };
    if (existing) setPolicies(policies.map((p) => p.id === record.id ? record : p));
    else setPolicies([...policies, record]);
    showToast(existing ? "Policy updated" : "Policy created");
    onExit();
  }

  const scopeLabel = buildScopeLabel(applicability, scopeBlocks);

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f8fb]">
      {/* header */}
      <div className="sticky top-0 z-20 border-b bg-white/85 px-6 py-4 backdrop-blur-xl">
        <div className="relative flex items-center gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Button variant="outline" size="icon" className="h-9 w-9 shrink-0 bg-white shadow-sm" onClick={onExit}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Input value={name} onChange={(e) => setName(e.target.value)}
              className="h-auto min-w-0 max-w-[min(36vw,28rem)] border-0 bg-transparent px-0 text-2xl font-semibold tracking-[-0.03em] shadow-none focus-visible:ring-0" />
          </div>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                {BUILDER_TABS.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger key={tab.id} value={tab.id}>
                      <Icon className="h-4 w-4" /> {tab.label}
                      {tab.id === "usage" && linkedWorkflows.length > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 min-w-5 justify-center px-1.5">{linkedWorkflows.length}</Badge>
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>
          </div>

          <div className="flex flex-1 items-center justify-end gap-2">
            {status === "Draft" ? (
              <Button variant="outline" onClick={() => setStatus("Active")}>Publish</Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">Active</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={() => setStatus("Draft")}>Move to draft</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button onClick={publish} className="shadow-primary/20">
              {existing ? "Save changes" : "Save"}
            </Button>
          </div>
        </div>
      </div>

      {/* tab content */}
      <div className="flex-1 overflow-auto">
        {activeTab === "context" && (
          <ContextTab
            aiPrompt={aiPrompt} setAiPrompt={setAiPrompt}
            documents={documents} addDocument={addDocument} removeDocument={removeDocument}
            generating={generating} generateFromAI={generateFromAI} aiGenerated={aiGenerated}
            name={name} typeKey={typeKey} domain={domain} fn={fn} scopeLabel={scopeLabel}
            personas={personas} branches={branches} type={type} trigger={trigger} controlledAction={controlledAction}
            configMode={configMode}
            description={description} onEditConfig={() => setActiveTab("configuration")}
          />
        )}

        {activeTab === "configuration" && configMode === "policy" && (
          <ConfigurationTab
            configSection={configSection} setConfigSection={setConfigSection}
            typeKey={typeKey} setTypeKey={setTypeKey} type={type} setBranches={setBranches}
            domain={domain} setDomain={setDomain} fn={fn} setFn={setFn} taxonomy={taxonomy}
            description={description} setDescription={setDescription}
            personas={personas} trigger={trigger} setTrigger={setTrigger}
            controlledAction={controlledAction} setControlledAction={setControlledAction}
            applicability={applicability} setApplicability={setApplicability}
            scopeBlocks={scopeBlocks} setScopeBlocks={setScopeBlocks}
            audiences={audiences}
            branches={branches} addElseIf={addElseIf} removeBranch={removeBranch} updateBranch={updateBranch}
          />
        )}

        {activeTab === "configuration" && configMode === "rule" && (
          <ConfigurationTabRuleLevel
            configSection={configSection} setConfigSection={setConfigSection}
            typeKey={typeKey} setTypeKey={setTypeKey} type={type} setBranches={setBranches}
            domain={domain} setDomain={setDomain} fn={fn} setFn={setFn} taxonomy={taxonomy}
            description={description} setDescription={setDescription}
            personas={personas}
            applicability={applicability} setApplicability={setApplicability}
            scopeBlocks={scopeBlocks} setScopeBlocks={setScopeBlocks}
            audiences={audiences}
            branches={branches} addElseIf={addElseIf} removeBranch={removeBranch} updateBranch={updateBranch}
          />
        )}

        {activeTab === "usage" && (
          <UsageTab policyId={existing?.id} policyName={name} policyStatus={status} workflows={linkedWorkflows} />
        )}
      </div>
    </div>
  );
}

/* ---------------- Context tab (AI-first) ---------------- */

function ContextTab({ aiPrompt, setAiPrompt, documents, addDocument, removeDocument, generating, generateFromAI, aiGenerated,
  name, typeKey, domain, fn, scopeLabel, personas, branches, type, trigger, controlledAction, configMode, description, onEditConfig }) {
  const availableDocs = SAMPLE_DOCS.filter((d) => !documents.includes(d));

  return (
    <div className={cn("mx-auto grid max-w-6xl gap-6 px-6 py-6", aiGenerated && "xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] xl:items-stretch")}>
      <Card className="flex min-h-[calc(100vh-11rem)] flex-col overflow-hidden">
        <CardHeader className="shrink-0 border-b bg-gradient-to-br from-primary/[0.08] via-background to-background py-5">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm shadow-primary/20">
              <Sparkle className="h-3.5 w-3.5" />
            </div>
            <CardTitle className="text-base">Describe the policy</CardTitle>
          </div>
          <CardDescription>Tell AI what this should do, then refine only the details that matter.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-4 p-5">
          <Textarea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="e.g. Block interview recording for candidates in EU/GDPR countries. Notify the interviewer that recording is disabled and create a compliance case if they attempt to override."
            className="min-h-0 flex-1 resize-none border-0 bg-muted/40 p-4 text-[15px] leading-relaxed shadow-none focus-visible:bg-background"
          />

          <div className="shrink-0">
            <div className="mb-2 flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Reference documents</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="link" size="sm" className="h-auto text-xs"><Plus className="h-3.5 w-3.5" /> Add document</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel className="text-xs">Sample documents</DropdownMenuLabel>
                  {availableDocs.map((doc) => (
                    <DropdownMenuItem key={doc} onClick={() => addDocument(doc)}>
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" /> {doc}
                    </DropdownMenuItem>
                  ))}
                  {availableDocs.length === 0 && <div className="px-2 py-1.5 text-xs text-muted-foreground">All sample docs attached</div>}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-primary"><Upload className="h-3.5 w-3.5" /> Upload from computer…</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {documents.length === 0 ? (
              <div className="rounded-lg border border-dashed px-4 py-6 text-center">
                <Paperclip className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">No documents attached. Add policies, SOPs, or compliance guidelines for better AI suggestions.</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {documents.map((doc) => (
                  <Badge key={doc} variant="secondary" className="gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" /> {doc}
                    <button onClick={() => removeDocument(doc)} className="text-muted-foreground hover:text-destructive"><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex shrink-0 justify-end">
            <Button onClick={generateFromAI} disabled={!aiPrompt.trim() || generating}>
              <Sparkle className={cn("h-4 w-4", generating && "animate-pulse")} />
              {generating ? "Generating…" : aiGenerated ? "Regenerate" : "Generate policy"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {aiGenerated && (
        <Card className="overflow-hidden">
          <CardHeader className="flex-row items-center justify-between space-y-0 border-b bg-muted/20 py-4">
            <div className="space-y-1">
              <CardTitle className="text-base">Policy preview</CardTitle>
              <CardDescription>Simplified view — open Configuration to fine-tune</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onEditConfig}><Settings className="h-3.5 w-3.5" /> Open configuration</Button>
          </CardHeader>
          <CardContent className="space-y-5 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-background text-primary shadow-sm">
                {(() => { const Icon = POLICY_TYPES.find((t) => t.key === typeKey)?.icon || Shield; return <Icon className="h-5 w-5" />; })()}
              </div>
              <div>
                <h4 className="text-lg font-semibold">{name}</h4>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description || aiPrompt}</p>
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-1">
              <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                <span className="shrink-0 text-xs text-muted-foreground">Type</span>
                <Badge variant="outline" className="ml-auto">{typeKey}</Badge>
              </div>
              <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                <span className="shrink-0 text-xs text-muted-foreground">Function</span>
                <span className="ml-auto truncate text-right text-sm">{domain} → {fn}</span>
              </div>
              {configMode === "policy" && (
                <>
                  <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                    <span className="shrink-0 text-xs text-muted-foreground">Trigger</span>
                    <span className="ml-auto truncate text-right text-sm">{trigger}</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                    <span className="shrink-0 text-xs text-muted-foreground">Action</span>
                    <span className="ml-auto truncate text-right text-sm">{controlledAction || "—"}</span>
                  </div>
                </>
              )}
              <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                <span className="shrink-0 text-xs text-muted-foreground">Scope</span>
                <span className="ml-auto truncate text-right text-sm">{scopeLabel}</span>
              </div>
            </div>

            {personas.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-background px-3 py-2 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                <span className="shrink-0 text-xs text-muted-foreground">Personas</span>
                <div className="ml-auto flex flex-wrap justify-end gap-1">{personas.map((p) => <Badge key={p} variant="outline">{p}</Badge>)}</div>
              </div>
            )}

            <div>
              <span className="text-xs text-muted-foreground">{configMode === "rule" ? "Rules" : "What it does"}</span>
              <div className="mt-2 space-y-2">
                {branches.map((b) => (
                  <div key={b.id} className="flex items-start gap-2.5 text-sm">
                    <span className="mt-0.5 w-14 shrink-0 text-xs text-muted-foreground">{b.kind}</span>
                    <div className="flex-1">
                      {configMode === "rule" && getBranchControlledActions(b).length > 0 && (
                        <p className="mb-0.5 text-[11px] text-muted-foreground">{formatControlledActionsList(getBranchControlledActions(b))}</p>
                      )}
                      {b.kind !== "ELSE" && b.groups?.flatMap((g) => g.rows).filter((r) => r.value).length > 0 ? (
                        <span className="text-muted-foreground">
                          {configMode === "policy" ? "When " : ""}
                          {b.groups.flatMap((g) => g.rows).filter((r) => r.value).map((r) => `${r.source} ${r.operator} "${r.value}"`).join(" and ")}
                        </span>
                      ) : b.kind === "ELSE" ? (
                        <span className="text-muted-foreground">Otherwise</span>
                      ) : (
                        <span className="italic text-muted-foreground">Conditions not set</span>
                      )}
                      <span className="mx-1.5 text-muted-foreground">→</span>
                      <OutcomeWithAction
                        outcome={b.outcome}
                        controlledActions={configMode === "rule" ? getBranchControlledActions(b) : undefined}
                        controlledAction={configMode === "policy" ? controlledAction : undefined}
                      />
                      {b.requiresApproval && (
                        <span className="ml-2 text-xs text-amber-700">needs {b.approver} approval{b.deferToStage ? ` · enforce at ${b.deferToStage}` : ""}</span>
                      )}
                      {b.actions?.length > 0 && (
                        <span className="ml-2 text-xs text-muted-foreground">{b.actions.map(formatActionLabel).join(" · ")}</span>
                      )}
                      {b.notifications?.map((notification) => (
                        <span key={notification.id} className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Bell className="h-3 w-3" /> {notification.persona}: {notification.template}
                        </span>
                      ))}
                      {b.reason && <p className="mt-0.5 text-xs italic text-muted-foreground">“{b.reason}”</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ---------------- Configuration tab (sidenav) ---------------- */

function ConfigurationTab({ configSection, setConfigSection, typeKey, setTypeKey, type, setBranches,
  domain, setDomain, fn, setFn, taxonomy, description, setDescription, personas,
  trigger, setTrigger, controlledAction, setControlledAction,
  applicability, setApplicability,
  scopeBlocks, setScopeBlocks, audiences,
  branches, addElseIf, removeBranch, updateBranch }) {
  const controlledActionOptions = getControlledActionOptions(fn);

  function changeDomain(nextDomain) {
    const nextFn = taxonomy[nextDomain][0];
    setDomain(nextDomain);
    setFn(nextFn);
    const options = getControlledActionOptions(nextFn);
    if (!options.includes(controlledAction)) setControlledAction(options[0] || "");
  }

  function changeFn(nextFn) {
    setFn(nextFn);
    const options = getControlledActionOptions(nextFn);
    if (!options.includes(controlledAction)) setControlledAction(options[0] || "");
  }
  return (
    <div className="flex min-h-[calc(100vh-180px)]">
      {/* sidenav */}
      <div className="w-52 shrink-0 border-r bg-background py-4">
        <p className="mb-2 px-4 text-xs font-medium text-muted-foreground">Sections</p>
        <nav className="space-y-1 px-2">
          {CONFIG_SECTIONS.map((s) => {
            const Icon = s.icon;
            const active = configSection === s.id;
            return (
              <Button key={s.id} variant="ghost"
                className={cn("w-full justify-start gap-2.5 font-normal", active && SELECTED_CHIP_CLASSES)}
                onClick={() => setConfigSection(s.id)}>
                <Icon className="h-4 w-4" /> {s.label}
              </Button>
            );
          })}
        </nav>
      </div>

      {/* section content */}
      <ConfigurationSectionContent>
        {configSection === "general" && (
          <SectionCard title="General" subtitle="Type, taxonomy, and description" icon={FileText}>
            <Field label="Policy type" hint="Determines allowed outcomes in Rules">
              <div className="grid grid-cols-4 gap-2">
                {POLICY_TYPES.map((t) => {
                  const Icon = t.icon;
                  const active = typeKey === t.key;
                  return (
                    <button key={t.key} onClick={() => { setTypeKey(t.key); setBranches([
                      createBranch(t, { kind: "IF" }),
                      createBranch(t, { kind: "ELSE", outcome: t.outcomes[t.outcomes.length - 1].key }),
                    ]); }}
                      className={cn("flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-colors",
                        active ? SELECTED_CHIP_CLASSES : "hover:border-muted-foreground/40")}>
                      <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
                      <span className={cn("text-xs font-semibold", active ? "text-primary" : "text-foreground")}>{t.key}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">{type.description}</p>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Domain">
                <SimpleSelect value={domain} onChange={changeDomain} options={Object.keys(taxonomy)} />
              </Field>
              <Field label="Function" hint="implied by Domain">
                <SimpleSelect value={fn} onChange={changeFn} options={taxonomy[domain] || []} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Trigger" hint="When the policy is evaluated">
                <SimpleSelect value={trigger} onChange={setTrigger} options={TRIGGERS} />
              </Field>
              <Field label="Controlled action" hint="The specific capability this policy gates">
                <SimpleSelect
                  value={controlledAction}
                  onChange={setControlledAction}
                  options={controlledActionOptions}
                />
              </Field>
            </div>

            <Field label="Description">
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </Field>
          </SectionCard>
        )}

        {configSection === "scope" && (
          <SectionCard title="Scope" subtitle="Applicability, audience groups, and custom conditions — combined with AND" icon={MapPin}>
            <Field label="Applicability" hint="Tenant, location, and job dimensions">
              <div className="grid grid-cols-2 gap-3">
                {Object.keys(APPLICABILITY).map((dim) => (
                  <div key={dim} className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">{APPLICABILITY[dim].label}</Label>
                    <SimpleSelect
                      value={applicability[dim]}
                      onChange={(v) => setApplicability({ ...applicability, [dim]: v })}
                      options={APPLICABILITY[dim].options}
                    />
                  </div>
                ))}
              </div>
            </Field>
            <Separator />
            <ScopeBuilder scopeBlocks={scopeBlocks} setScopeBlocks={setScopeBlocks} audiences={audiences} />
          </SectionCard>
        )}

        {configSection === "rules" && (
          <SectionCard title="Rules" subtitle={`IF / ELSE IF / ELSE branches · FIRST_MATCH · one ${typeKey} outcome per branch`} icon={GitBranch}>
            {branches.map((b, bi) => (
              <div key={b.id}>
                <div className="overflow-hidden rounded-lg border">
                  <div className="flex items-center justify-between border-b bg-muted/50 px-3.5 py-2">
                    <Badge variant={branchVariant(b.kind)}>{b.kind}</Badge>
                    {b.kind === "ELSE IF" && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeBranch(b.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <div className="space-y-3.5 p-3.5">
                    {b.kind !== "ELSE" && (
                      <ConditionGroupBuilder
                        groups={b.groups}
                        setGroups={(g) => updateBranch(b.id, { groups: g })}
                        orGate={b.orGate}
                        setOrGate={(v) => updateBranch(b.id, { orGate: v })}
                      />
                    )}
                    <Field label={`Outcome (${typeKey})`}>
                      <OutcomeSelect
                        outcomes={type.outcomes}
                        value={b.outcome}
                        onChange={(v) => updateBranch(b.id, { outcome: v })}
                      />
                      {controlledAction && (
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          Applies to <span className="font-medium text-foreground">{controlledAction}</span>
                        </p>
                      )}
                    </Field>
                    <BranchEnforcementEditor
                      branch={b}
                      onChange={(patch) => updateBranch(b.id, patch)}
                    />
                    <BranchActionsEditor
                      branch={b}
                      type={type}
                      onChange={(actions) => updateBranch(b.id, { actions })}
                    />
                    <BranchNotificationsEditor
                      branch={b}
                      onChange={(notifications) => updateBranch(b.id, { notifications })}
                    />
                  </div>
                </div>
                {bi < branches.length - 1 && (
                  <div className="flex items-center justify-center py-1.5 text-xs text-muted-foreground">
                    <ArrowRight className="mr-1 h-3 w-3 rotate-90" /> if no match, continue
                  </div>
                )}
              </div>
            ))}
            <Button variant="outline" className="w-full border-dashed" onClick={addElseIf}>
              <Plus className="h-3.5 w-3.5" /> Add ELSE IF branch
            </Button>
          </SectionCard>
        )}

        {configSection === "summary" && (
          <SectionCard title="Summary" subtitle="What this policy will do once published" icon={FileText}>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="mb-1 block text-xs text-muted-foreground">Type</span><Badge variant="outline">{typeKey}</Badge></div>
              <div><span className="mb-1 block text-xs text-muted-foreground">Business Function</span><span>{domain} <ChevronRight className="inline h-3 w-3 opacity-50" /> {fn}</span></div>
              <div><span className="mb-1 block text-xs text-muted-foreground">Trigger</span><Badge variant="secondary">{trigger}</Badge></div>
              <div><span className="mb-1 block text-xs text-muted-foreground">Controlled action</span><Badge variant="outline">{controlledAction || "—"}</Badge></div>
              <div><span className="mb-1 block text-xs text-muted-foreground">Personas</span>
                {personas.length ? <div className="flex flex-wrap gap-1">{personas.map((p) => <Badge key={p} variant="outline">{p}</Badge>)}</div> : <span className="text-xs text-muted-foreground">Not set — derived at outcome level</span>}
              </div>
              <div className="col-span-2"><span className="mb-1 block text-xs text-muted-foreground">Scope</span>
                <ScopeSummary scopeBlocks={scopeBlocks} applicability={applicability} />
              </div>
            </div>
            <Separator />
            <div>
              <span className="mb-2 block text-xs text-muted-foreground">Branches ({branches.length})</span>
              <div className="space-y-2.5">
                {branches.map((b) => (
                    <div key={b.id} className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <Badge variant={branchVariant(b.kind)}>{b.kind}</Badge>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <OutcomeWithAction outcome={b.outcome} controlledAction={controlledAction} />
                        {b.requiresApproval && (
                          <Badge variant="outline" className="gap-1 border-amber-200 bg-amber-50 text-amber-700">
                            <Check className="h-3 w-3" /> {b.approver} approval{b.deferToStage ? ` · enforce at ${b.deferToStage}` : ""}
                          </Badge>
                        )}
                        {b.actions?.map((action) => (
                          <Badge key={normalizeAction(action).id} variant="secondary">{formatActionLabel(action)}</Badge>
                        ))}
                        {b.notifications?.map((notification) => (
                          <span key={notification.id} className="flex items-center gap-1 text-muted-foreground">
                            <Bell className="h-3 w-3" />{notification.persona} · {notification.template}
                          </span>
                        ))}
                      </div>
                      {b.reason && <p className="pl-1 text-xs italic text-muted-foreground">“{b.reason}”</p>}
                    </div>
                ))}
              </div>
            </div>
          </SectionCard>
        )}
      </ConfigurationSectionContent>
    </div>
  );
}

/* ---------------- Configuration tab — rule-level variant ---------------- */

function ConfigurationTabRuleLevel({ configSection, setConfigSection, typeKey, setTypeKey, type, setBranches,
  domain, setDomain, fn, setFn, taxonomy, description, setDescription, personas,
  applicability, setApplicability,
  scopeBlocks, setScopeBlocks, audiences,
  branches, addElseIf, removeBranch, updateBranch }) {
  const controlledActionOptions = getControlledActionOptions(fn);

  function changeDomain(nextDomain) {
    const nextFn = taxonomy[nextDomain][0];
    setDomain(nextDomain);
    changeFn(nextFn);
  }

  function changeFn(nextFn) {
    setFn(nextFn);
    const options = getControlledActionOptions(nextFn);
    setBranches((prev) => prev.map((b) => {
      const nextActions = (b.controlledActions || []).filter((action) => options.includes(action));
      return {
        ...b,
        controlledActions: nextActions,
        controlledAction: nextActions[0] || "",
      };
    }));
  }

  return (
    <div className="flex min-h-[calc(100vh-180px)]">
      <div className="w-52 shrink-0 border-r bg-background py-4">
        <p className="mb-2 px-4 text-xs font-medium text-muted-foreground">Sections</p>
        <nav className="space-y-1 px-2">
          {CONFIG_SECTIONS.map((s) => {
            const Icon = s.icon;
            const active = configSection === s.id;
            return (
              <Button key={s.id} variant="ghost"
                className={cn("w-full justify-start gap-2.5 font-normal", active && SELECTED_CHIP_CLASSES)}
                onClick={() => setConfigSection(s.id)}>
                <Icon className="h-4 w-4" /> {s.label}
              </Button>
            );
          })}
        </nav>
      </div>

      <ConfigurationSectionContent>
        {configSection === "general" && (
          <SectionCard title="General" subtitle="Type, taxonomy, and description" icon={FileText}>
            <Field label="Policy type" hint="Determines allowed outcomes in Rules">
              <div className="grid grid-cols-4 gap-2">
                {POLICY_TYPES.map((t) => {
                  const Icon = t.icon;
                  const active = typeKey === t.key;
                  return (
                    <button key={t.key} onClick={() => { setTypeKey(t.key); setBranches([
                      createBranch(t, { kind: "IF" }),
                      createBranch(t, { kind: "ELSE", outcome: t.outcomes[t.outcomes.length - 1].key }),
                    ]); }}
                      className={cn("flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-colors",
                        active ? SELECTED_CHIP_CLASSES : "hover:border-muted-foreground/40")}>
                      <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
                      <span className={cn("text-xs font-semibold", active ? "text-primary" : "text-foreground")}>{t.key}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">{type.description}</p>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Product Experience">
                <SimpleSelect value={domain} onChange={changeDomain} options={Object.keys(taxonomy)} />
              </Field>
              <Field label="Product">
                <SimpleSelect value={fn} onChange={changeFn} options={taxonomy[domain] || []} />
              </Field>
            </div>

            <Field label="Description">
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </Field>
          </SectionCard>
        )}

        {configSection === "scope" && (
          <SectionCard title="Scope" subtitle="Audience groups and custom conditions — combined with AND" icon={MapPin}>
            <ScopeBuilder scopeBlocks={scopeBlocks} setScopeBlocks={setScopeBlocks} audiences={audiences} />
          </SectionCard>
        )}

        {configSection === "rules" && (
          <SectionCard title="Rules" subtitle={`Conditions and outcomes per branch · ${typeKey}`} icon={GitBranch}>
            {branches.map((b, bi) => (
              <div key={b.id}>
                <div className="overflow-hidden rounded-lg border">
                  <div className="flex items-center justify-between border-b bg-muted/50 px-3.5 py-2">
                    <Badge variant={branchVariant(b.kind)}>{b.kind}</Badge>
                    {b.kind === "ELSE IF" && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeBranch(b.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <div className="space-y-3.5 p-3.5">
                    {b.kind !== "ELSE" && (
                      <ConditionGroupBuilder
                        groups={b.groups}
                        setGroups={(g) => updateBranch(b.id, { groups: g })}
                        orGate={b.orGate}
                        setOrGate={(v) => updateBranch(b.id, { orGate: v })}
                      />
                    )}
                    <Field label={`Outcome (${typeKey})`}>
                      <div className="grid grid-cols-2 gap-3">
                        <OutcomeSelect
                          outcomes={type.outcomes}
                          value={b.outcome}
                          onChange={(v) => updateBranch(b.id, { outcome: v })}
                          compactTrigger
                        />
                        <MultiSelectChips
                          value={getBranchControlledActions(b)}
                          onChange={(actions) => updateBranch(b.id, {
                            controlledActions: actions,
                            controlledAction: actions[0] || "",
                          })}
                          options={controlledActionOptions}
                          labels={CONTROLLED_ACTION_LABELS}
                          placeholder="Select features…"
                          variant="select"
                        />
                      </div>
                    </Field>
                    <BranchEnforcementEditor branch={b} onChange={(patch) => updateBranch(b.id, patch)} />
                    <BranchActionsEditor branch={b} type={type} onChange={(actions) => updateBranch(b.id, { actions })} />
                    <BranchNotificationsEditor branch={b} onChange={(notifications) => updateBranch(b.id, { notifications })} />
                  </div>
                </div>
                {bi < branches.length - 1 && (
                  <div className="flex items-center justify-center py-1.5 text-xs text-muted-foreground">
                    <ArrowRight className="mr-1 h-3 w-3 rotate-90" /> if no match, continue
                  </div>
                )}
              </div>
            ))}
            <Button variant="outline" className="w-full border-dashed" onClick={addElseIf}>
              <Plus className="h-3.5 w-3.5" /> Add ELSE IF branch
            </Button>
          </SectionCard>
        )}

        {configSection === "summary" && (
          <SectionCard title="Summary" subtitle="What this policy will do once published" icon={FileText}>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="mb-1 block text-xs text-muted-foreground">Type</span><Badge variant="outline">{typeKey}</Badge></div>
              <div><span className="mb-1 block text-xs text-muted-foreground">Product</span><span>{domain} <ChevronRight className="inline h-3 w-3 opacity-50" /> {fn}</span></div>
              <div><span className="mb-1 block text-xs text-muted-foreground">Configurator</span><Badge variant="secondary">V2</Badge></div>
              <div><span className="mb-1 block text-xs text-muted-foreground">Personas</span>
                {personas.length ? <div className="flex flex-wrap gap-1">{personas.map((p) => <Badge key={p} variant="outline">{p}</Badge>)}</div> : <span className="text-xs text-muted-foreground">Not set — derived at outcome level</span>}
              </div>
              <div className="col-span-2"><span className="mb-1 block text-xs text-muted-foreground">Scope</span>
                <ScopeSummary scopeBlocks={scopeBlocks} applicability={applicability} groupsOnly />
              </div>
            </div>
            <Separator />
            <div>
              <span className="mb-2 block text-xs text-muted-foreground">Branches ({branches.length})</span>
              <div className="space-y-2.5">
                {branches.map((b) => (
                  <div key={b.id} className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Badge variant={branchVariant(b.kind)}>{b.kind}</Badge>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <OutcomeWithAction outcome={b.outcome} controlledActions={getBranchControlledActions(b)} />
                      {b.requiresApproval && (
                        <Badge variant="outline" className="gap-1 border-amber-200 bg-amber-50 text-amber-700">
                          <Check className="h-3 w-3" /> {b.approver} approval{b.deferToStage ? ` · enforce at ${b.deferToStage}` : ""}
                        </Badge>
                      )}
                      {b.actions?.map((action) => (
                        <Badge key={normalizeAction(action).id} variant="secondary">{formatActionLabel(action)}</Badge>
                      ))}
                      {b.notifications?.map((notification) => (
                        <span key={notification.id} className="flex items-center gap-1 text-muted-foreground">
                          <Bell className="h-3 w-3" />{notification.persona} · {notification.template}
                        </span>
                      ))}
                    </div>
                    {b.reason && <p className="pl-1 text-xs italic text-muted-foreground">“{b.reason}”</p>}
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        )}
      </ConfigurationSectionContent>
    </div>
  );
}

/* ---------------- Usage tab ---------------- */

function UsageMetricCard({ label, value, hint, icon: Icon }) {
  return (
    <Card className="shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">{formatMetric(value)}</p>
            {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-muted/30 text-primary">
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function UsageTab({ policyId, policyName, policyStatus, workflows }) {
  const metrics = getUsageMetrics(policyId, workflows.length);

  if (!policyId) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <Activity className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
        <h3 className="mb-1 font-semibold">No usage yet</h3>
        <p className="text-sm text-muted-foreground">Publish this policy first — usage metrics and linked workflows appear once it's saved and active.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold tracking-tight">Usage</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Where this policy runs and how often it fires in production.
        </p>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <UsageMetricCard
          label="Linked workflows"
          value={metrics.workflowCount}
          hint={metrics.workflowCount === 1 ? "1 active reference" : `${metrics.workflowCount} active references`}
          icon={Workflow}
        />
        <UsageMetricCard
          label="Evaluations (30d)"
          value={metrics.evaluations30d}
          hint={policyStatus === "Draft" ? "Draft policies are not evaluated" : "Records checked against this policy"}
          icon={Activity}
        />
        <UsageMetricCard
          label="Match rate"
          value={metrics.matchRate}
          hint={`${formatMetric(metrics.outcomeHits)} outcomes applied`}
          icon={Zap}
        />
        <UsageMetricCard
          label="Last triggered"
          value={metrics.lastTriggered}
          hint={policyStatus === "Active" ? "Most recent evaluation" : "Policy is not active"}
          icon={Clock}
        />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">Linked workflows & pipelines</h3>
            <p className="text-xs text-muted-foreground">
              {workflows.length === 0
                ? `"${policyName}" is not referenced by any workflow yet.`
                : `"${policyName}" is attached to ${workflows.length} workflow${workflows.length !== 1 ? "s" : ""} or pipeline${workflows.length !== 1 ? "s" : ""}.`}
            </p>
          </div>
        </div>

        {workflows.length === 0 ? (
          <div className="rounded-lg border border-dashed px-6 py-12 text-center">
            <GitBranch className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No workflows reference this policy. Attach it from the workflow builder.</p>
          </div>
        ) : (
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {workflows.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="font-medium">{w.name}</TableCell>
                    <TableCell><Badge variant={w.type === "Pipeline" ? "default" : "outline"}>{w.type}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{w.stage}</TableCell>
                    <TableCell><StatusDot status={w.status} /></TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" title="Open workflow">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  );
}
