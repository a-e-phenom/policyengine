import { useState, useEffect, useRef, Fragment, createContext, useContext, useId } from "react";
import {
  Shield, GitBranch, Users, RefreshCw, MapPin, Database, FileText, Plus, Trash2, Trash,
  ChevronRight, Save, X, Check, ChevronDown,
  Search, ArrowRight, Building2, ChevronLeft, Bell, Link2, Sparkle,
  Upload, Paperclip, Settings, Workflow, ExternalLink, Activity, Zap, Clock, ListChecks,
  CheckCircle, Eye, Octagon, Ban, ArrowUpCircle, Pencil, Flag, RotateCcw,
  SkipForward, ListPlus, Shuffle, Repeat, Pause, XCircle, Inbox, UserPlus, Undo2, Hand,
  Home, ChartNetwork, Bot, List, Code, PanelRightClose, MessageSquare, UserCheck, Waypoints,
  ClipboardCheck, TowerControl, SlidersHorizontal, ArrowUp, Info, Calendar, AlertTriangle,
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

/* ---------------- People Engine ---------------- */

const ENGINES = {
  hiring: { key: "hiring", label: "Hiring" },
  people: { key: "people", label: "People" },
};

const PEOPLE_TAXONOMY_SEED = {
  "People Operations": ["Leave Management", "Attendance", "Absence Management"],
  "Compliance": ["Labour Law", "Payroll Compliance"],
  "Employee Experience (EX)": ["Self-Service", "Employee Portal"],
};

const PEOPLE_APPROVERS = ["Manager", "HRBP", "HR Director", "Payroll"];

const PEOPLE_PERSONAS = ["Employee", "Manager", "HRBP", "HR Director", "Payroll"];

const PEOPLE_DATA_SOURCES = [
  "Leave Balance (Annual)", "Leave Balance (Sick)", "Leave Balance (Casual)",
  "Leave Type", "Leave Duration (Days)", "Employment Type", "Probation Status",
  "Attendance Check-in Time", "Attendance Check-out Time", "Minutes Late",
  "Absence Pattern — Weekday", "Absence Count (Rolling 3 months)", "Absence Rate (Rolling 12 months)",
  "Consecutive Absence Days", "Regularisation Window (Days)", "Payroll Cycle Lock Status",
  "Medical Certificate Submitted", "Leave Application Submitted", "Country / Region",
];

const PEOPLE_TRIGGERS = [
  "On leave application", "On leave approval", "On attendance check-in", "On attendance check-out",
  "On regularisation request", "On leave year close", "On payroll cycle lock", "Continuous / scheduled",
];

const PEOPLE_TRIGGER = {
  LEAVE_APPLY: "On leave application",
  LEAVE_APPROVAL: "On leave approval",
  CHECK_IN: "On attendance check-in",
  CHECK_OUT: "On attendance check-out",
  REGULARISATION: "On regularisation request",
  YEAR_CLOSE: "On leave year close",
  CYCLE_LOCK: "On payroll cycle lock",
  SCHEDULED: "Continuous / scheduled",
};

const PEOPLE_CONTROLLED_ACTIONS_BY_FN = {
  "Leave Management": ["Leave Application", "Leave Approval", "Leave Cancellation", "Leave Balance Adjustment"],
  "Attendance": ["Attendance Check-in", "Attendance Check-out", "Attendance Regularisation", "Payroll Processing"],
  "Absence Management": ["Absence Review", "Disciplinary Action", "HR Escalation"],
  "Self-Service": ["Leave Application", "Attendance Regularisation"],
  "Employee Portal": ["Leave Application", "Attendance Check-in"],
  "Labour Law": ["Leave Approval", "Leave Balance Adjustment"],
  "Payroll Compliance": ["Payroll Processing", "Leave Balance Adjustment"],
};

const PEOPLE_POLICY_SOURCE = {
  LEAVE_ATTENDANCE: "Leave_Attendance_Policy.docx.pdf",
};

const PEOPLE_PARAMETERS_SEED = [
  { id: "ppe-1", key: "annualLeaveEntitlement", label: "Annual leave entitlement", value: "24", unit: "days/year", scope: "India · All employees", description: "Total annual leave days per leave year.", usedBy: ["Leave Application Gate", "Carry-Forward Cap"] },
  { id: "ppe-2", key: "monthlyAccrualRate", label: "Monthly accrual rate", value: "2", unit: "days/month", scope: "India · Full-time", description: "Annual leave accrues monthly from date of joining.", usedBy: ["Leave Application Gate"] },
  { id: "ppe-3", key: "carryForwardCap", label: "Carry-forward cap", value: "5", unit: "days", scope: "India · Annual leave", description: "Maximum unused annual leave carried to next leave year.", usedBy: ["Carry-Forward Cap"] },
  { id: "ppe-4", key: "encashmentMaxDays", label: "Encashment maximum", value: "10", unit: "days", scope: "India · On separation", description: "Max accrued annual leave encashed upon separation.", usedBy: ["Leave Encashment Gate"] },
  { id: "ppe-5", key: "gracePeriodMinutes", label: "Late arrival grace period", value: "15", unit: "minutes", scope: "India · All sites", description: "Window after scheduled start time before lateness is penalised.", usedBy: ["Late Arrival Grace"] },
  { id: "ppe-6", key: "regularisationWindowDays", label: "Regularisation window", value: "3", unit: "working days", scope: "India · All employees", description: "Days after discrepancy within which regularisation is accepted.", usedBy: ["Attendance Regularisation Gate"] },
  { id: "ppe-7", key: "shortTermAbsenceThreshold", label: "Short-term absence threshold", value: "3", unit: "instances", scope: "India · Rolling 3 months", description: "Repeated short-term absences triggering informal review.", usedBy: ["Absenteeism Pattern Block"] },
  { id: "ppe-8", key: "rollingAbsenceRatePct", label: "Rolling absence rate threshold", value: "10", unit: "%", scope: "India · Rolling 12 months", description: "Absence rate above which formal HR review is triggered.", usedBy: ["Absenteeism Pattern Block"] },
  { id: "ppe-9", key: "consecutiveAbsenceThreshold", label: "Consecutive absence threshold", value: "3", unit: "days", scope: "India · Unexplained", description: "Consecutive unexplained absences triggering formal review.", usedBy: ["Consecutive Absence Review"] },
  { id: "ppe-10", key: "probationLeaveLimit", label: "Probation leave limit", value: "1", unit: "leave/month", scope: "India · Probationary", description: "Max leaves per month during prohibition period.", usedBy: ["Probation Leave Restriction"] },
  { id: "ppe-11", key: "advanceNoticeDays", label: "Planned leave advance notice", value: "5", unit: "working days", scope: "India · Annual leave", description: "Minimum advance notice for planned leave applications.", usedBy: ["Leave Application Gate"] },
  { id: "ppe-12", key: "sickLeaveCertDays", label: "Sick leave certificate threshold", value: "2", unit: "consecutive days", scope: "India · Sick leave", description: "Medical certificate required for sick leave exceeding this duration.", usedBy: ["Sick Leave Documentation"] },
];

const PEOPLE_AUDIENCES_SEED = [
  { id: "paud-1", name: "India Employees", summary: [{ source: "Country / Region", operator: "EQUALS", value: "India" }], usedBy: ["Leave Application Gate", "Late Arrival Grace", "Absenteeism Pattern Block"] },
  { id: "paud-2", name: "Probationary Employees", summary: [{ source: "Probation Status", operator: "EQUALS", value: "On Probation" }], usedBy: ["Probation Leave Restriction"] },
  { id: "paud-3", name: "Part-Time Employees", summary: [{ source: "Employment Type", operator: "EQUALS", value: "Part-time" }], usedBy: ["Leave Application Gate"] },
];

const PERSONAS = ["Candidate", "Recruiter", "Hiring Manager", "Interviewer", "HRBP", "Compliance Reviewer"];

const DATA_SOURCES = [
  "Candidate Fit Score", "Requisition Approval Status", "Employment Status", "Country / Region",
  "Job Family", "Job Grade", "Tenant / Business Unit", "Consent Status", "Tenure Since Last Working Day",
  "Days Since Last Working Day", "Days Since Last Interview", "Days Since Last Application",
  "Sourcing Candidate Count", "Demographic Distribution Skew",
  "Model Confidence Score", "API Response Status", "Hiring Manager Availability",
  "Company (via UAN/EPFO)", "Company (via Resume/Application)", "Company (Current / Past)",
  "Interviewer Country / Region", "Candidate Country / Region", "Job Location Country / Region",
  "Recording Context Complete",
  "Performance Outcome", "Rehire Flag",
  "Do Not Rehire Flag", "Pipeline Status", "Legal Confirmation Status",
  "Offer Acceptance Status",
  "Eye Track", "Voice Tone", "Facial Expressions",
  "Policy Outcome: Identity Fraud", "Policy Outcome: Knowledge Fraud",
];
const OPERATORS = ["IS IN", "IS NOT IN", "EQUALS", "NOT EQUALS", "GREATER THAN", "LESS THAN", "BETWEEN", "MATCHES", "SAME AS", "NOT SAME AS"];
// Operators that compare one data field against another field, rather than a static value.
const FIELD_COMPARISON_OPERATORS = new Set(["SAME AS", "NOT SAME AS"]);

const NOTIFY_TEMPLATES = [
  "Recording Disabled — Policy Notice", "Recruiter: Candidate Flagged", "HRBP: Compliance Escalation",
  "Candidate: Application Status Update", "Manager: Approval Required",
  "Legal: No-Poach Confirmation Required", "Recruiter: Do-Not-Hire Match", "Recruiter: UAN / Resume Mismatch",
  "TA Ops: Rehire Cooling-Off Review",
  "Interviewer: Identity Fraud Soft Stop", "Interviewer: Knowledge Fraud Soft Stop",
  "Compliance: Interview Fraud Hard Stop",
];

// When the policy is evaluated in the candidate/workflow lifecycle.
const TRIGGERS = [
  "When application is received", "At screening", "At scheduling", "At interview", "At offer stage",
  "On job publish", "On candidate sourced", "On segment consumed", "On policy outcome", "Continuous / scheduled",
];

const POLICY_TRIGGER = {
  APPLY: "When application is received",
  SCHEDULING: "At scheduling",
  INTERVIEW: "At interview",
  OFFER: "At offer stage",
  SOURCING: "On candidate sourced",
  JOB_PUBLISH: "On job publish",
  POLICY_OUTCOME: "On policy outcome",
  SCHEDULED: "Continuous / scheduled",
};

function getPolicyTriggerLabel(policy) {
  const fromSettings = policy?.branchSettings?.map((b) => b.trigger).filter(Boolean) || [];
  const unique = [...new Set(fromSettings)];
  if (unique.length > 1) return unique.join(" · ");
  if (unique.length === 1) return unique[0];
  return policy?.trigger || "—";
}

function defaultTriggerForPolicy(name) {
  const n = normalizeText(name);
  if (n.includes("recording") || n.includes("interview feature")) return POLICY_TRIGGER.SCHEDULING;
  if (n.includes("identity fraud") || n.includes("knowledge fraud")) return POLICY_TRIGGER.INTERVIEW;
  if (n.includes("interview fraud escalation") || n.includes("fraud escalation")) return POLICY_TRIGGER.POLICY_OUTCOME;
  if (n.includes("job family suppression")) return POLICY_TRIGGER.JOB_PUBLISH;
  if (n.includes("msa-expiry")) return POLICY_TRIGGER.SCHEDULED;
  if (n.includes("consent") || n.includes("employee exclusion") || n.includes("country sourcing")
      || n.includes("company exclusion")
      || (n.includes("rehire") && !n.includes("performance") && !n.includes("protected-client"))) {
    return POLICY_TRIGGER.SOURCING;
  }
  return POLICY_TRIGGER.APPLY;
}

function finalizeSeedBranches(seed, defaultTrigger) {
  if (!seed?.branches) return seed;
  return {
    branches: seed.branches.map((b) => ({
      ...b,
      trigger: b.trigger || defaultTrigger,
    })),
  };
}

const TIER2_COOLING_OFF_MATCH_ROWS = [
  { source: "Company (via UAN/EPFO)", operator: "IS IN", value: "No-Poach — Tier 2" },
  { source: "Days Since Last Working Day", operator: "LESS THAN", value: "@tier2CoolOffDays" },
];

function buildNoPoachTemporalRules(type, { matchRows, matchLabel, applyReason, controlledAction = "Application Progression" }) {
  const pick = (key, fallbackIndex = 0) => type.outcomes.find((item) => item.key === key)?.key || type.outcomes[fallbackIndex]?.key || type.outcomes[0].key;
  const controlledActions = controlledAction ? [controlledAction] : [];
  const legalNotify = [{ persona: "Compliance Reviewer", template: "Legal: No-Poach Confirmation Required" }];
  return {
    branches: [
      {
        kind: "IF",
        trigger: POLICY_TRIGGER.APPLY,
        rows: matchRows,
        outcome: pick("Soft Stop"),
        controlledActions,
        reason: applyReason,
        requiresApproval: true,
        approver: "Legal",
        actions: ["Create Case"],
        notifications: legalNotify,
      },
      {
        kind: "ELSE IF",
        trigger: POLICY_TRIGGER.OFFER,
        groups: [[
          ...matchRows,
          { source: "Legal Confirmation Status", operator: "NOT EQUALS", value: "Approved" },
        ]],
        outcome: pick("Hard Stop"),
        controlledActions,
        reason: `Legal has not confirmed no-poach clearance by Offer — ${matchLabel}.`,
        actions: ["Create Case"],
        notifications: legalNotify,
      },
    ],
  };
}

// Lifecycle stage at which an outcome is actually enforced (supports deferred enforcement).
const ENFORCEMENT_STAGES = ["Immediate", "Application", "Screening", "Interview", "Offer"];

// Approvers for human-in-the-loop escalation gates.
const APPROVERS = ["Hiring Manager", "Legal", "Compliance Reviewer", "HRBP", "Talent Leadership"];

const CONTROLLED_ACTIONS_BY_FN = {
  "Interview Intelligence": ["Interview Recording", "Interview Scheduling", "Interview Transcription", "AI Interview Analysis", "Interview Progression"],
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
  "Interview Progression": "Progression",
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

function defaultBranchControlledActions(fn, policyAction, outcome) {
  const options = getControlledActionOptions(fn);
  if (Array.isArray(policyAction) && policyAction.length) return policyAction.filter((a) => options.includes(a));
  if (policyAction && options.includes(policyAction)) return [policyAction];
  if (outcome === "Allow" || outcome === "Advance") return [];
  return options[0] ? [options[0]] : [];
}

function hydrateBranches(branches, { existing, fn, policyControlledAction, policyTrigger }) {
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
      trigger: b.trigger || saved?.trigger || policyTrigger || TRIGGERS[0],
      controlledActions: branchActions,
      controlledAction: branchActions[0] || "",
    };
  });
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

const PARAMETERS_SEED = [
  {
    id: "par-1",
    key: "interviewCoolOffDays",
    label: "Interview cool-off window",
    value: "180",
    unit: "days",
    scope: "Tenant · Job family · Location",
    description: "Recently interviewed candidates are excluded from sourcing within this window (PDF default: 6 months).",
    usedBy: ["Rehire"],
  },
  {
    id: "par-2",
    key: "applicantRecencyDays",
    label: "Past applicant recency window",
    value: "90",
    unit: "days",
    scope: "Tenant · Job family · Location",
    description: "Past applicants excluded from sourcing outreach within this window.",
    usedBy: ["Rehire"],
  },
  {
    id: "par-6",
    key: "tier2CoolOffDays",
    label: "No-Poach Tier 2 cooling-off window",
    value: "180",
    unit: "days",
    scope: "Tenant · Job family · Location",
    description: "Departed Tier 2 protected-client candidates remain restricted within this window (list default: 6 months).",
    usedBy: ["No-Poach Tier 2 Cooling-Off"],
  },
  {
    id: "par-3",
    key: "rehireDepartureSoftStopDays",
    label: "Rehire departure soft-stop window",
    value: "180",
    unit: "days",
    scope: "India applicants",
    description: "Recent departure threshold for rehire performance soft stop (<6 months).",
    usedBy: ["Rehire Performance Screen"],
  },
  {
    id: "par-4",
    key: "rehireDepartureMonitorMinDays",
    label: "Rehire monitor window (min)",
    value: "365",
    unit: "days",
    scope: "India applicants",
    description: "Lower bound for departure monitor band (1–3 years).",
    usedBy: ["Rehire Performance Screen"],
  },
  {
    id: "par-5",
    key: "rehireDepartureMonitorMaxDays",
    label: "Rehire monitor window (max)",
    value: "1095",
    unit: "days",
    scope: "India applicants",
    description: "Upper bound for departure monitor band (1–3 years).",
    usedBy: ["Rehire Performance Screen"],
  },
  {
    id: "par-7",
    key: "interviewFraud",
    label: "Interview fraud signal",
    type: "computed",
    valueType: "boolean",
    value: "true",
    unit: null,
    scope: "Interview screening",
    description: "Dynamic boolean — true when all configured fraud signals are flagged.",
    usedBy: ["Interview Fraud Escalation", "Identity Fraud", "Knowledge Fraud"],
    compute: {
      orGate: false,
      groups: [{
        id: "cg-if-1",
        rows: [
          { id: "cr-if-1", source: "Eye Track", operator: "EQUALS", value: "Flagged" },
          { id: "cr-if-2", source: "Voice Tone", operator: "EQUALS", value: "Flagged" },
          { id: "cr-if-3", source: "Facial Expressions", operator: "EQUALS", value: "Flagged" },
        ],
      }],
    },
  },
];

function formatParameterRef(key) {
  return key ? `@${key}` : "";
}

function parseParameterRef(value) {
  const text = String(value || "");
  return text.startsWith("@") ? text.slice(1) : "";
}

function isParameterRef(value) {
  return String(value || "").startsWith("@");
}

function getParameterByKey(parameters, key) {
  return (parameters || []).find((param) => param.key === key);
}

function isComputedParameter(param) {
  return param?.type === "computed";
}

function createBlankComputeGroups() {
  return [{
    id: uid++,
    rows: [{ id: uid++, source: DATA_SOURCES[0], operator: "EQUALS", value: "" }],
  }];
}

function formatComputedParameterSummary(param) {
  if (!isComputedParameter(param)) return null;
  return getComputedParameterClauses(param).join(param.compute?.orGate ? " OR " : " AND ");
}

function getComputedParameterClauses(param) {
  if (!isComputedParameter(param)) return [];
  const { groups = [] } = param.compute || {};
  return groups.flatMap((group) => (group.rows || []).map((row) => `${row.source} ${row.operator} "${row.value || "…"}"`));
}

function formatConditionValue(value, parameters = []) {
  if (!value) return value;
  let display = String(value);
  parameters.forEach((param) => {
    const token = formatParameterRef(param.key);
    const replacement = isComputedParameter(param)
      ? `${param.label} (computed)`
      : `${param.label} (${param.value}${param.unit ? ` ${param.unit}` : ""})`;
    display = display.split(token).join(replacement);
  });
  return display;
}

function formatConditionClause(row, parameters = []) {
  return `${row.source} ${row.operator} "${formatConditionValue(row.value, parameters)}"`;
}

const AUDIENCES_SEED = [
  {
    id: "aud-1", name: "EMEA GDPR Candidates",
    summary: [{ source: "Country / Region", operator: "IS IN", value: "EU / GDPR Countries" }],
    usedBy: ["EU Recording Restriction"],
  },
  {
    id: "aud-2", name: "Current Employees",
    summary: [{ source: "Employment Status", operator: "EQUALS", value: "Current Employee" }],
    usedBy: ["EU Recording Restriction", "Current Employee Exclusion", "No-Poach Tier 1 Block", "Rehire"],
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
    summary: [
      { source: "Company (via UAN/EPFO)", operator: "IS IN", value: "No-Poach — Tier 2" },
      { source: "Days Since Last Working Day", operator: "LESS THAN", value: "@tier2CoolOffDays" },
    ],
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
    usedBy: ["Rehire Performance Screen", "Rehire Protected-Client Review", "Rehire"],
  },
];

const POLICY_PRIORITIES = ["High", "Medium", "Low"];

const PRIORITY_DOT_COLORS = {
  Mandatory: "bg-rose-500",
  High: "bg-amber-500",
  Medium: "bg-sky-500",
  Low: "bg-slate-400",
};

function PriorityDot({ priority, mandatory, className }) {
  const label = mandatory ? "Mandatory" : (priority || "Medium");
  return (
    <span className={cn("h-2 w-2 shrink-0 rounded-full", PRIORITY_DOT_COLORS[label] || PRIORITY_DOT_COLORS.Medium, className)} />
  );
}

const POLICY_SOURCE = {
  RECORDING: "Country-Level Recording Restriction Policy.pdf",
  SOURCING: "Sourcing Agent — Workflows & Policies.pdf",
  INDIA_APPLY: "Capgemini",
};

const POLICY_DEMO_OUTCOMES = {
  p1: { outcome: "Block", message: "Recording blocked when any geographic dimension is restricted or context is unknown." },
  p22: { outcome: "Soft Stop / Block", message: "Country-specific recording and AI insight rules apply." },
  p24: { outcome: "Soft Stop", message: "Identity fraud signals flagged — Soft Stop on interview progression." },
  p25: { outcome: "Soft Stop", message: "Knowledge fraud signals flagged — Soft Stop on interview progression." },
  p26: { outcome: "Hard Stop", message: "Identity Fraud and Knowledge Fraud both Soft Stop → escalates to Hard Stop." },
  p18: { outcome: "Block", message: "Current employees are excluded from external sourcing." },
  p21: { outcome: "Block", message: "Rehire ineligibility filters applied at sourcing time." },
  p23: { outcome: "Block", message: "Competitor or disqualified company exclusion." },
  p2: { outcome: "Soft Stop / Hard Stop", message: "Tier 1 no-poach: Soft Stop at Apply; Hard Stop at Offer if Legal has not approved." },
  p12: { outcome: "Soft Stop / Hard Stop", message: "Tier 2 departure within cooling-off window (@tier2CoolOffDays): Soft Stop at Apply; Hard Stop at Offer if Legal has not approved." },
};

function getPolicyPriorityLabel(policy) {
  if (policy?.mandatory) return "Mandatory";
  return policy?.priority || "Medium";
}

function priorityScore(policy) {
  if (policy?.mandatory) return 4;
  if (policy?.priority === "High") return 3;
  if (policy?.priority === "Low") return 1;
  return 2;
}

function defaultPolicyPriority(existing) {
  if (existing?.mandatory) return "High";
  return existing?.priority || "Medium";
}

function PriorityBadge({ policy, priority }) {
  const label = policy ? getPolicyPriorityLabel(policy) : (priority || "Medium");
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-2 py-0.5 text-xs font-medium">
      <PriorityDot priority={label} mandatory={label === "Mandatory"} className="h-1.5 w-1.5" />
      {label}
    </span>
  );
}

function PriorityConfigField({ priority, setPriority, mandatory }) {
  return (
    <Field label="Priority" hint="When multiple policies match the same case, higher priority wins. Mandatory policies always take precedence.">
      {mandatory ? (
        <div className="inline-flex items-center gap-2 rounded-lg border px-3 py-2">
          <PriorityDot mandatory />
          <span className="text-sm font-medium">Mandatory</span>
          <span className="text-xs text-muted-foreground">System-mandatory — cannot be lowered</span>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {POLICY_PRIORITIES.map((p) => {
            const active = priority === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                  active ? SELECTED_CHIP_CLASSES : "text-foreground hover:border-muted-foreground/40",
                )}
              >
                <PriorityDot priority={p} />
                {p}
              </button>
            );
          })}
        </div>
      )}
    </Field>
  );
}

function ConflictResolutionSummary({ priority, mandatory, coPolicies }) {
  return (
    <>
      <div>
        <span className="mb-1 block text-xs text-muted-foreground">Priority</span>
        <PriorityBadge policy={mandatory ? { mandatory: true } : { priority }} />
      </div>
      <div className="col-span-2 rounded-lg border bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground">
        <p>
          When multiple policies match, the <span className="font-medium text-foreground">highest priority</span> policy determines the final outcome and user message.
        </p>
        {coPolicies.length > 0 && (
          <div className="mt-2.5">
            <p className="mb-1.5 font-medium text-foreground">Co-linked policies on shared workflows</p>
            <div className="space-y-1">
              {coPolicies.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center gap-2">
                  <span className="text-foreground">{p.name}</span>
                  <PriorityBadge policy={p} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

const POLICIES_SEED = [
  { id: "p22", name: "Interview Feature Restriction", type: "Guardrail", domain: "Hiring Intelligence", fn: "Interview Intelligence", scope: [], status: "Active", personas: ["Candidate", "Interviewer"], trigger: "At scheduling", priority: "Medium", source: "-", controlledAction: "Interview Recording" },
  { id: "p24", name: "Identity Fraud", type: "Guardrail", domain: "Hiring Intelligence", fn: "Interview Intelligence", scope: [], status: "Active", personas: ["Interviewer", "Compliance Reviewer"], trigger: "At interview", priority: "High", source: "-", controlledAction: "Interview Progression" },
  { id: "p25", name: "Knowledge Fraud", type: "Guardrail", domain: "Hiring Intelligence", fn: "Interview Intelligence", scope: [], status: "Active", personas: ["Interviewer", "Compliance Reviewer"], trigger: "At interview", priority: "High", source: "-", controlledAction: "Interview Progression" },
  { id: "p26", name: "Interview Fraud Escalation", type: "Guardrail", domain: "Hiring Intelligence", fn: "Interview Intelligence", scope: [], status: "Active", personas: ["Compliance Reviewer", "HRBP"], trigger: "On policy outcome", priority: "High", source: "-", controlledAction: "Interview Progression",
    branchSettings: [
      { index: 0, kind: "IF", trigger: POLICY_TRIGGER.POLICY_OUTCOME, controlledActions: ["Interview Progression"] },
    ],
  },
  { id: "p1", name: "EU Recording Restriction", type: "Guardrail", domain: "Hiring Intelligence", fn: "Interview Intelligence", scope: ["EMEA GDPR Candidates", "Current Employees"], scopeInline: true, status: "Active", personas: ["Candidate", "Interviewer"], trigger: "At scheduling", priority: "High", applicability: { location: "EU / GDPR Countries" }, source: POLICY_SOURCE.RECORDING, controlledAction: "Interview Recording" },
  { id: "p2", name: "No-Poach Tier 1 Block", type: "Guardrail", domain: "Talent Acquisition", fn: "Sourcing", scope: ["Protected Client No-Poach Tier 1"], status: "Active", personas: ["Recruiter"], trigger: "When application is received", priority: "High", applicability: { location: "India" }, source: POLICY_SOURCE.INDIA_APPLY, controlledAction: "Application Progression",
    branchSettings: [
      { index: 0, kind: "IF", trigger: POLICY_TRIGGER.APPLY, controlledActions: ["Application Progression"] },
      { index: 1, kind: "ELSE IF", trigger: POLICY_TRIGGER.OFFER, controlledActions: ["Application Progression"] },
    ],
  },

  // ---- EPFO / India verification policies (spreadsheet) ----
  { id: "p8", name: "Do-Not-Hire Employer Block", type: "Guardrail", domain: "Talent Acquisition", fn: "Screening", scope: ["India Applicants", "Do-Not-Hire Employers"], status: "Active", personas: ["Recruiter", "Compliance Reviewer"], trigger: "When application is received", applicability: { location: "India" }, source: POLICY_SOURCE.INDIA_APPLY, controlledAction: "Application Submission" },
  { id: "p9", name: "Do-Not-Hire Alias Match", type: "Guardrail", domain: "Talent Acquisition", fn: "Screening", scope: ["India Applicants", "Do-Not-Hire Employers"], status: "Active", personas: ["Recruiter"], trigger: "When application is received", applicability: { location: "India" }, source: POLICY_SOURCE.INDIA_APPLY, controlledAction: "Application Submission" },
  { id: "p10", name: "Resume vs UAN Mismatch", type: "Guardrail", domain: "Talent Acquisition", fn: "Screening", scope: ["India Applicants"], status: "Active", personas: ["Recruiter", "Compliance Reviewer"], trigger: "When application is received", applicability: { location: "India" }, source: POLICY_SOURCE.INDIA_APPLY, controlledAction: "Application Submission" },
  { id: "p11", name: "Rehire Performance Screen", type: "Guardrail", domain: "Talent Acquisition", fn: "Screening", scope: ["India Applicants", "Rehire Candidates"], status: "Active", personas: ["HRBP"], trigger: "When application is received", applicability: { location: "India" }, source: POLICY_SOURCE.INDIA_APPLY, controlledAction: "Application Progression" },

  // ---- No-Poach program (spreadsheet, tiered) ----
  { id: "p12", name: "No-Poach Tier 2 Cooling-Off", type: "Guardrail", domain: "Talent Acquisition", fn: "Sourcing", scope: ["No-Poach Tier 2 Protected"], status: "Active", personas: ["Recruiter", "Compliance Reviewer"], trigger: "When application is received", applicability: { location: "India" }, source: POLICY_SOURCE.INDIA_APPLY, controlledAction: "Application Progression",
    branchSettings: [
      { index: 0, kind: "IF", trigger: POLICY_TRIGGER.APPLY, controlledActions: ["Application Progression"] },
      { index: 1, kind: "ELSE IF", trigger: POLICY_TRIGGER.OFFER, controlledActions: ["Application Progression"] },
    ],
  },
  { id: "p13", name: "No-Poach Concealment Hard Stop", type: "Guardrail", domain: "Talent Acquisition", fn: "Sourcing", scope: ["Protected Client No-Poach Tier 1"], status: "Active", personas: ["Compliance Reviewer"], trigger: "When application is received", applicability: { location: "India" }, source: POLICY_SOURCE.INDIA_APPLY, controlledAction: "Application Progression" },
  { id: "p14", name: "No-Poach Alias & Subsidiary Match", type: "Guardrail", domain: "Talent Acquisition", fn: "Sourcing", scope: ["Protected Client No-Poach Tier 1"], status: "Active", personas: ["Recruiter"], trigger: "When application is received", applicability: { location: "India" }, source: POLICY_SOURCE.INDIA_APPLY, controlledAction: "Application Progression" },
  { id: "p15", name: "No-Poach MSA-Expiry Downgrade", type: "State Transition", domain: "Talent Acquisition", fn: "Sourcing", scope: [], status: "Active", personas: ["Compliance Reviewer"], trigger: "Continuous / scheduled", source: POLICY_SOURCE.INDIA_APPLY, controlledAction: "No-Poach Restriction Level" },
  { id: "p16", name: "Rehire Protected-Client Review", type: "Guardrail", domain: "Talent Acquisition", fn: "Sourcing", scope: ["Rehire Candidates"], status: "Active", personas: ["Recruiter"], trigger: "When application is received", applicability: { location: "India" }, source: POLICY_SOURCE.INDIA_APPLY, controlledAction: "Application Progression" },

  // ---- Sourcing Agent policies (PDF 2) ----
  { id: "p23", name: "Company Exclusion", type: "Guardrail", domain: "Talent Acquisition", fn: "Sourcing", scope: [], status: "Active", personas: ["Recruiter"], trigger: "On candidate sourced", priority: "High", source: POLICY_SOURCE.SOURCING, controlledAction: "Candidate Sourcing" },
  { id: "p17", name: "Candidate Consent Gate", type: "Guardrail", domain: "Compliance", fn: "Data Privacy", scope: [], status: "Active", personas: ["Candidate"], trigger: "On candidate sourced", source: POLICY_SOURCE.SOURCING, controlledAction: "Candidate Sourcing" },
  { id: "p18", name: "Current Employee Exclusion", type: "Guardrail", domain: "Talent Acquisition", fn: "Sourcing", scope: ["Current Employees"], status: "Active", personas: ["Recruiter"], trigger: "On candidate sourced", mandatory: true, global: true, source: POLICY_SOURCE.SOURCING, controlledAction: "Candidate Sourcing" },
  { id: "p19", name: "Country Sourcing Restriction", type: "Guardrail", domain: "Compliance", fn: "Data Privacy", scope: [], status: "Active", personas: ["Recruiter"], trigger: "On candidate sourced", source: POLICY_SOURCE.SOURCING, controlledAction: "Candidate Sourcing" },
  { id: "p20", name: "Job Family Suppression", type: "Routing", domain: "Talent Acquisition", fn: "Sourcing", scope: [], status: "Draft", personas: [], trigger: "On job publish", priority: "Low", source: POLICY_SOURCE.SOURCING, controlledAction: "Automated Sourcing" },
  { id: "p21", name: "Rehire", type: "Guardrail", domain: "Talent Acquisition", fn: "Sourcing", scope: [], status: "Active", personas: ["Recruiter"], trigger: "On candidate sourced", source: POLICY_SOURCE.SOURCING, controlledAction: "Candidate Sourcing" },
];

const PEOPLE_POLICIES_SEED = [
  { id: "pe1", name: "Leave Application Gate", type: "Guardrail", domain: "People Operations", fn: "Leave Management", category: "leave", scope: ["India Employees"], status: "Active", personas: ["Employee", "Manager"], trigger: PEOPLE_TRIGGER.LEAVE_APPLY, priority: "High", applicability: { location: "India" }, source: PEOPLE_POLICY_SOURCE.LEAVE_ATTENDANCE, controlledAction: "Leave Application" },
  { id: "pe2", name: "Leave Approval Routing", type: "Routing", domain: "People Operations", fn: "Leave Management", category: "leave", scope: [], status: "Active", personas: ["Manager", "HRBP"], trigger: PEOPLE_TRIGGER.LEAVE_APPLY, priority: "High", source: PEOPLE_POLICY_SOURCE.LEAVE_ATTENDANCE, controlledAction: "Leave Approval" },
  { id: "pe3", name: "Maternity/Paternity Auto-Approve", type: "State Transition", domain: "People Operations", fn: "Leave Management", category: "leave", scope: [], status: "Active", personas: ["HRBP"], trigger: PEOPLE_TRIGGER.LEAVE_APPLY, priority: "Medium", source: PEOPLE_POLICY_SOURCE.LEAVE_ATTENDANCE, controlledAction: "Leave Approval" },
  { id: "pe4", name: "Probation Leave Restriction", type: "Guardrail", domain: "People Operations", fn: "Leave Management", category: "leave", scope: ["Probationary Employees"], status: "Active", personas: ["Employee", "Manager"], trigger: PEOPLE_TRIGGER.LEAVE_APPLY, priority: "High", source: PEOPLE_POLICY_SOURCE.LEAVE_ATTENDANCE, controlledAction: "Leave Application" },
  { id: "pe5", name: "Sick Leave Documentation", type: "Guardrail", domain: "People Operations", fn: "Leave Management", category: "leave", scope: [], status: "Active", personas: ["Employee", "Manager"], trigger: PEOPLE_TRIGGER.LEAVE_APPLY, priority: "Medium", source: PEOPLE_POLICY_SOURCE.LEAVE_ATTENDANCE, controlledAction: "Leave Application" },
  { id: "pe6", name: "Carry-Forward Cap", type: "Guardrail", domain: "People Operations", fn: "Leave Management", category: "leave", scope: [], status: "Active", personas: ["HRBP", "Payroll"], trigger: PEOPLE_TRIGGER.YEAR_CLOSE, priority: "Medium", source: PEOPLE_POLICY_SOURCE.LEAVE_ATTENDANCE, controlledAction: "Leave Balance Adjustment" },
  { id: "pe7", name: "Leave Encashment Gate", type: "Guardrail", domain: "People Operations", fn: "Leave Management", category: "leave", scope: [], status: "Active", personas: ["HRBP", "Payroll"], trigger: PEOPLE_TRIGGER.SCHEDULED, priority: "Low", source: PEOPLE_POLICY_SOURCE.LEAVE_ATTENDANCE, controlledAction: "Leave Balance Adjustment" },
  { id: "pe8", name: "Late Arrival Grace", type: "Guardrail", domain: "People Operations", fn: "Attendance", category: "attendance", scope: ["India Employees"], status: "Active", personas: ["Employee", "Manager"], trigger: PEOPLE_TRIGGER.CHECK_IN, priority: "Medium", source: PEOPLE_POLICY_SOURCE.LEAVE_ATTENDANCE, controlledAction: "Attendance Check-in" },
  { id: "pe9", name: "Attendance Regularisation Gate", type: "Guardrail", domain: "People Operations", fn: "Attendance", category: "attendance", scope: [], status: "Active", personas: ["Employee", "Manager"], trigger: PEOPLE_TRIGGER.REGULARISATION, priority: "High", source: PEOPLE_POLICY_SOURCE.LEAVE_ATTENDANCE, controlledAction: "Attendance Regularisation" },
  { id: "pe10", name: "Cycle Lock Enforcement", type: "Guardrail", domain: "People Operations", fn: "Attendance", category: "attendance", scope: [], status: "Active", personas: ["HRBP", "Payroll"], trigger: PEOPLE_TRIGGER.CYCLE_LOCK, priority: "High", source: PEOPLE_POLICY_SOURCE.LEAVE_ATTENDANCE, controlledAction: "Payroll Processing" },
  { id: "pe11", name: "Incomplete Attendance Record", type: "Guardrail", domain: "People Operations", fn: "Attendance", category: "attendance", scope: [], status: "Active", personas: ["Employee", "Manager"], trigger: PEOPLE_TRIGGER.CHECK_OUT, priority: "Medium", source: PEOPLE_POLICY_SOURCE.LEAVE_ATTENDANCE, controlledAction: "Attendance Check-out" },
  { id: "pe12", name: "Absenteeism Pattern Block", type: "Guardrail", domain: "People Operations", fn: "Absence Management", category: "absenteeism", scope: ["India Employees"], status: "Active", personas: ["Manager", "HRBP"], trigger: PEOPLE_TRIGGER.SCHEDULED, priority: "High", source: PEOPLE_POLICY_SOURCE.LEAVE_ATTENDANCE, controlledAction: "Absence Review" },
  { id: "pe13", name: "Consecutive Absence Review", type: "Guardrail", domain: "People Operations", fn: "Absence Management", category: "absenteeism", scope: [], status: "Active", personas: ["Manager", "HRBP"], trigger: PEOPLE_TRIGGER.SCHEDULED, priority: "High", source: PEOPLE_POLICY_SOURCE.LEAVE_ATTENDANCE, controlledAction: "HR Escalation" },
  { id: "pe14", name: "Leave Without Pay Trigger", type: "Guardrail", domain: "People Operations", fn: "Leave Management", category: "leave", scope: [], status: "Active", personas: ["Employee", "HRBP"], trigger: PEOPLE_TRIGGER.LEAVE_APPLY, priority: "Medium", source: PEOPLE_POLICY_SOURCE.LEAVE_ATTENDANCE, controlledAction: "Leave Application" },
];

const PEOPLE_WORKFLOWS_SEED = [
  { id: "pwf-1", name: "Leave Application Flow", type: "Workflow", stage: "Leave", status: "Active", policies: ["pe1", "pe2", "pe3", "pe4", "pe5", "pe14"] },
  { id: "pwf-2", name: "Attendance Management Flow", type: "Workflow", stage: "Attendance", status: "Active", policies: ["pe8", "pe9", "pe10", "pe11"] },
  { id: "pwf-3", name: "Absenteeism Review Flow", type: "Workflow", stage: "Absence", status: "Active", policies: ["pe12", "pe13"] },
  { id: "pwf-4", name: "Leave Year Close", type: "Pipeline", stage: "Year-end", status: "Active", policies: ["pe6", "pe7"] },
];

function getEngineDataSources(engine) {
  return engine === "people" ? PEOPLE_DATA_SOURCES : DATA_SOURCES;
}

function getEngineTriggers(engine) {
  return engine === "people" ? PEOPLE_TRIGGERS : TRIGGERS;
}

function getEnginePersonas(engine) {
  return engine === "people" ? PEOPLE_PERSONAS : PERSONAS;
}

function getControlledActionOptionsForEngine(fn, engine) {
  const map = engine === "people" ? PEOPLE_CONTROLLED_ACTIONS_BY_FN : CONTROLLED_ACTIONS_BY_FN;
  return map[fn] || (engine === "people" ? ["Workflow Step"] : ["Workflow Step"]);
}

function getWorkflowsForEngine(engine) {
  return engine === "people" ? PEOPLE_WORKFLOWS_SEED : WORKFLOWS_SEED;
}

function getCoPoliciesOnWorkflowsForEngine(policyId, policies, engine) {
  const workflows = getWorkflowsForEngine(engine).filter((w) => w.policies.includes(policyId));
  const coPolicyIds = new Set();
  workflows.forEach((w) => w.policies.forEach((id) => { if (id !== policyId) coPolicyIds.add(id); }));
  return [...coPolicyIds].map((id) => policies.find((p) => p.id === id)).filter(Boolean);
}

const WORKFLOWS_SEED = [
  { id: "wf-1", name: "Interview Scheduling Flow", type: "Workflow", stage: "Pre-Interview", status: "Active", policies: ["p22", "p1"] },
  { id: "wf-9", name: "Interview Fraud Detection Flow", type: "Workflow", stage: "Interview", status: "Active", policies: ["p24", "p25", "p26"] },
  { id: "wf-2", name: "Candidate Sourcing Pipeline", type: "Pipeline", stage: "Sourcing", status: "Active", policies: ["p2", "p17", "p18", "p19", "p20", "p21", "p23"] },
  { id: "wf-4", name: "Offer Management Flow", type: "Workflow", stage: "Offer", status: "Active", policies: ["p2", "p12", "p13"] },
  { id: "wf-7", name: "India Application Compliance Screen", type: "Pipeline", stage: "Screening", status: "Active", policies: ["p8", "p9", "p10", "p11", "p16"] },
  { id: "wf-8", name: "No-Poach Enforcement Flow", type: "Workflow", stage: "Sourcing", status: "Active", policies: ["p2", "p12", "p13", "p14", "p15", "p16"] },
];

function getCoPoliciesOnWorkflows(policyId, policies) {
  const workflows = WORKFLOWS_SEED.filter((w) => w.policies.includes(policyId));
  const coPolicyIds = new Set();
  workflows.forEach((w) => w.policies.forEach((id) => { if (id !== policyId) coPolicyIds.add(id); }));
  return [...coPolicyIds].map((id) => policies.find((p) => p.id === id)).filter(Boolean);
}

function getWorkflowConflictPreviews(policyId, policies) {
  return WORKFLOWS_SEED
    .filter((w) => w.policies.includes(policyId) && w.policies.length > 1)
    .map((workflow) => {
      const workflowPolicies = workflow.policies
        .map((id) => policies.find((p) => p.id === id))
        .filter(Boolean)
        .sort((a, b) => priorityScore(b) - priorityScore(a));
      const winner = workflowPolicies[0];
      const suppressed = workflowPolicies.slice(1);
      const winnerDemo = POLICY_DEMO_OUTCOMES[winner?.id] || { outcome: winner?.type || "—", message: "Highest-priority policy message is shown." };
      return { workflow, workflowPolicies, winner, suppressed, winnerDemo };
    });
}

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
  p24: { evaluations30d: 4120, matchRate: "6.8%", lastTriggered: "18 min ago", outcomeHits: 280 },
  p25: { evaluations30d: 4120, matchRate: "4.1%", lastTriggered: "22 min ago", outcomeHits: 169 },
  p26: { evaluations30d: 4120, matchRate: "1.2%", lastTriggered: "1 hour ago", outcomeHits: 49 },
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

function RuleBranchHeader({ ruleNumber, kind, onRemove }) {
  return (
    <div className="flex items-center justify-between border-b bg-muted/50 px-3.5 py-2">
      <span className="text-sm font-medium">Rule {ruleNumber}</span>
      <div className="flex items-center gap-2">
        <Badge variant={branchVariant(kind)}>{kind}</Badge>
        {kind === "ELSE IF" && onRemove && (
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={onRemove}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

function RuleBranchTriggerField({ trigger, onChange, triggers = TRIGGERS }) {
  return (
    <Field label="Trigger" hint="When this rule is evaluated in the workflow">
      <SimpleSelect whiteBg value={trigger || triggers[0]} onChange={onChange} options={triggers} />
    </Field>
  );
}

function seedRuleForPolicy(existing, type) {
  const defaultTrigger = existing?.trigger || defaultTriggerForPolicy(existing?.name) || TRIGGERS[0];
  const seed = buildSeedRuleForPolicy(existing, type);
  return seed?.branches ? finalizeSeedBranches(seed, defaultTrigger) : seed;
}

function buildSeedRuleForPolicy(existing, type) {
  const name = normalizeText(existing?.name);
  const defaultTrigger = existing?.trigger || defaultTriggerForPolicy(existing?.name) || TRIGGERS[0];
  const outcome = (key, fallbackIndex = 0) => type.outcomes.find((item) => item.key === key)?.key || type.outcomes[fallbackIndex]?.key || type.outcomes[0].key;
  const base = {
    row: { source: "Country / Region", operator: "IS IN", value: "EU / GDPR Countries" },
    ifOutcome: type.outcomes[0].key,
    elseOutcome: type.outcomes[1]?.key || type.outcomes[0].key,
    notify: false,
  };

  if (name.includes("alias & subsidiary")) {
    return finalizeSeedBranches(buildNoPoachTemporalRules(type, {
      matchRows: [{ source: "Company (via UAN/EPFO)", operator: "IS IN", value: "No-Poach — Tier 1 (aliases + subsidiaries)" }],
      matchLabel: "alias or subsidiary of a Tier 1 protected client",
      applyReason: "Alias or subsidiary of a Tier 1 protected client (EPFO UAN verified).",
    }), defaultTrigger);
  }
  if (name.includes("tier 2 cooling-off")) {
    return finalizeSeedBranches(buildNoPoachTemporalRules(type, {
      matchRows: TIER2_COOLING_OFF_MATCH_ROWS,
      matchLabel: "Tier 2 protected client within cooling-off period",
      applyReason: "Departed a Tier 2 protected client within the applicable cooling-off period.",
    }), defaultTrigger);
  }
  if (name.includes("tier 1 block") || (name.includes("no-poach") && name.includes("tier 1"))) {
    return finalizeSeedBranches(buildNoPoachTemporalRules(type, {
      matchRows: [{ source: "Company (via UAN/EPFO)", operator: "IS IN", value: "No-Poach — Tier 1" }],
      matchLabel: "Tier 1 protected client match",
      applyReason: "Currently employed by a Tier 1 protected client (EPFO UAN verified).",
    }), defaultTrigger);
  }

  /* ---- EPFO / India verification ---- */
  if (name.includes("do-not-hire employer")) {
    return { branches: [
      { kind: "IF", rows: [{ source: "Company (via UAN/EPFO)", operator: "IS IN", value: "Do Not Hire (DNH) List" }],
        outcome: outcome("Hard Stop"), reason: "Current or past employer is on the Do-Not-Hire list (EPFO UAN verified).",
        actions: ["Create Case"], notifications: [{ persona: "Recruiter", template: "Recruiter: Do-Not-Hire Match" }] },
    ] };
  }
  if (name.includes("do-not-hire alias")) {
    return { branches: [
      { kind: "IF", rows: [{ source: "Company (via UAN/EPFO)", operator: "IS IN", value: "DNH List — aliases" }],
        outcome: outcome("Soft Stop"), reason: "Employment history matches an alias of a Do-Not-Hire organization.",
        notifications: [{ persona: "Recruiter", template: "Recruiter: Do-Not-Hire Match" }] },
    ] };
  }
  if (name.includes("resume vs uan")) {
    return { branches: [
      { kind: "IF", rows: [{ source: "Company (via Resume/Application)", operator: "NOT SAME AS", value: "Company (via UAN/EPFO)" }],
        outcome: outcome("Hard Stop"), reason: "Resume employment history does not match EPFO UAN records.",
        actions: ["Create Case"], notifications: [{ persona: "Compliance Reviewer", template: "Recruiter: UAN / Resume Mismatch" }] },
    ] };
  }
  if (name.includes("rehire performance")) {
    return { branches: [
      { kind: "IF", groups: [[{ source: "Rehire Flag", operator: "EQUALS", value: "Yes" }, { source: "Performance Outcome", operator: "EQUALS", value: "5" }]],
        outcome: outcome("Hard Stop"), reason: "Rehire candidate with lowest performance rating (5)." },
      { kind: "ELSE IF", groups: [[{ source: "Days Since Last Working Day", operator: "LESS THAN", value: "@rehireDepartureSoftStopDays" }], [{ source: "Performance Outcome", operator: "IS IN", value: "1, 2, 3, 4" }]],
        outcome: outcome("Soft Stop"), reason: "Recent departure (<6 months) with performance 1–4." },
      { kind: "ELSE IF", groups: [[{ source: "Days Since Last Working Day", operator: "BETWEEN", value: "@rehireDepartureMonitorMinDays – @rehireDepartureMonitorMaxDays" }], [{ source: "Performance Outcome", operator: "IS IN", value: "1, 2, 3, 4" }]],
        outcome: outcome("Monitor"), reason: "Departure 1–3 years ago with performance 1–4." },
    ] };
  }

  /* ---- No-Poach program ---- */
  if (name.includes("concealment")) {
    return { branches: [
      { kind: "IF", rows: [{ source: "Company (via Resume/Application)", operator: "NOT SAME AS", value: "Company (via UAN/EPFO)" }],
        outcome: outcome("Hard Stop"), reason: "Suspected concealment of current employment with a Tier 1 protected client.",
        actions: ["Create Case"], notifications: [{ persona: "Compliance Reviewer", template: "Legal: No-Poach Confirmation Required" }] },
    ] };
  }
  if (name.includes("alias & subsidiary")) {
    return { branches: [
      { kind: "IF", rows: [{ source: "Company (via UAN/EPFO)", operator: "IS IN", value: "No-Poach — Tier 1 (aliases + subsidiaries)" }],
        outcome: outcome("Soft Stop"), reason: "Alias or subsidiary of a Tier 1 protected client (EPFO UAN verified).",
        requiresApproval: true, approver: "Legal", deferToStage: "Offer",
        notifications: [{ persona: "Compliance Reviewer", template: "Legal: No-Poach Confirmation Required" }] },
    ] };
  }
  if (name.includes("tier 2 cooling-off")) {
    return { branches: [
      { kind: "IF", rows: TIER2_COOLING_OFF_MATCH_ROWS,
        outcome: outcome("Soft Stop"), reason: "Departed a Tier 2 protected client within the applicable cooling-off period.",
        requiresApproval: true, approver: "Legal", deferToStage: "Offer",
        notifications: [{ persona: "Compliance Reviewer", template: "Legal: No-Poach Confirmation Required" }] },
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
    ] };
  }
  if (name.includes("no-poach")) {
    return { branches: [
      { kind: "IF", rows: [{ source: "Company (via UAN/EPFO)", operator: "IS IN", value: "No-Poach — Tier 1" }],
        outcome: outcome("Soft Stop"), reason: "Currently employed by a Tier 1 protected client (EPFO UAN verified).",
        requiresApproval: true, approver: "Legal", deferToStage: "Offer",
        notifications: [{ persona: "Compliance Reviewer", template: "Legal: No-Poach Confirmation Required" }] },
    ] };
  }

  /* ---- Sourcing Agent (PDF 2) ---- */
  if (name.includes("company exclusion")) {
    return { branches: [
      { kind: "IF", rows: [{ source: "Company (Current / Past)", operator: "IS IN", value: "Competitor Exclusion List" }],
        outcome: outcome("Block"), reason: "Current employer on competitor exclusion list for this tenant, job family, and location." },
      { kind: "ELSE IF", rows: [{ source: "Company (Current / Past)", operator: "IS IN", value: "Fraud / Disqualified Company List" }],
        outcome: outcome("Block"), reason: "Current or past employer on fraud, blacklist, or disqualified company list." },
    ] };
  }
  if (name.includes("consent gate")) {
    return { branches: [
      { kind: "IF", rows: [{ source: "Consent Status", operator: "EQUALS", value: "Opted Out" }],
        outcome: outcome("Block"), reason: "Candidate opted out — outreach prohibited in all jurisdictions." },
      { kind: "ELSE IF", groups: [[
        { source: "Country / Region", operator: "IS IN", value: "EU / GDPR Countries" },
        { source: "Consent Status", operator: "NOT EQUALS", value: "Granted" },
      ]],
        outcome: outcome("Block"), reason: "GDPR jurisdiction requires explicit consent before automated outreach.",
        notifications: [{ persona: "Candidate", template: "Candidate: Application Status Update" }] },
    ] };
  }
  if (name.includes("current employee exclusion")) {
    return { branches: [
      { kind: "IF", rows: [{ source: "Employment Status", operator: "EQUALS", value: "Current Employee" }],
        outcome: outcome("Block"), reason: "Current employees are excluded from external sourcing (mandatory policy)." },
    ] };
  }
  if (name.includes("country sourcing")) {
    return { branches: [
      { kind: "IF", rows: [{ source: "Country / Region", operator: "IS IN", value: "Restricted Countries" }],
        outcome: outcome("Block"), reason: "Automated sourcing is restricted in this jurisdiction." },
    ] };
  }
  if (name.includes("job family suppression")) {
    return { branches: [
      { kind: "IF", rows: [{ source: "Job Family", operator: "IS IN", value: "Suppressed Families" }],
        outcome: outcome("Skip", 1), reason: "Job family suppressed for automated sourcing — agent will not activate." },
    ] };
  }
  if (name.includes("rehire") && !name.includes("performance") && !name.includes("protected-client")) {
    return { branches: [
      { kind: "IF", rows: [{ source: "Do Not Rehire Flag", operator: "EQUALS", value: "Yes" }],
        outcome: outcome("Block"), reason: "Candidate marked do-not-rehire in CRM — excluded from all segments and outreach." },
      { kind: "ELSE IF", rows: [{ source: "Days Since Last Interview", operator: "LESS THAN", value: "@interviewCoolOffDays" }],
        outcome: outcome("Block"), reason: "Recently interviewed within configured cool-off window (default 6 months; overridable per tenant/job family/location)." },
      { kind: "ELSE IF", rows: [{ source: "Days Since Last Application", operator: "LESS THAN", value: "@applicantRecencyDays" }],
        outcome: outcome("Block"), reason: "Past applicant within recency window — not eligible for sourcing outreach." },
      { kind: "ELSE IF", rows: [{ source: "Pipeline Status", operator: "IS IN", value: "Interviewing, Offered, Active Pipeline" }],
        outcome: outcome("Block"), reason: "Candidate already active in an open pipeline stage." },
    ] };
  }

  /* ---- Interview fraud composition ---- */
  if (name.includes("identity fraud")) {
    return { branches: [
      { kind: "IF",
        groups: [[
          { source: "Eye Track", operator: "EQUALS", value: "Flagged" },
          { source: "Facial Expressions", operator: "EQUALS", value: "Flagged" },
        ]],
        outcome: outcome("Soft Stop"),
        controlledActions: ["Interview Progression"],
        reason: "Identity fraud signals detected (eye track / facial expressions). Soft Stop — interviewer can override with review.",
        notifications: [{ persona: "Interviewer", template: "Interviewer: Identity Fraud Soft Stop" }],
      },
    ] };
  }
  if (name.includes("knowledge fraud")) {
    return { branches: [
      { kind: "IF",
        rows: [{ source: "Voice Tone", operator: "EQUALS", value: "Flagged" }],
        outcome: outcome("Soft Stop"),
        controlledActions: ["Interview Progression"],
        reason: "Knowledge fraud signals detected (voice / response pattern). Soft Stop — interviewer can override with review.",
        notifications: [{ persona: "Interviewer", template: "Interviewer: Knowledge Fraud Soft Stop" }],
      },
    ] };
  }
  if (name.includes("interview fraud escalation") || name.includes("fraud escalation")) {
    return { branches: [
      { kind: "IF",
        groups: [[
          { source: "Policy Outcome: Identity Fraud", operator: "EQUALS", value: "Soft Stop" },
          { source: "Policy Outcome: Knowledge Fraud", operator: "EQUALS", value: "Soft Stop" },
        ]],
        outcome: outcome("Hard Stop"),
        controlledActions: ["Interview Progression"],
        reason: "Identity Fraud and Knowledge Fraud both returned Soft Stop — escalate to Hard Stop. Cannot proceed without a policy exception.",
        actions: ["Create Case"],
        notifications: [{ persona: "Compliance Reviewer", template: "Compliance: Interview Fraud Hard Stop" }],
      },
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
    ] };
  }

  /* ---- Original demo policies ---- */
  if (name.includes("recording restriction")) {
    return { branches: [
      {
        kind: "IF",
        orGate: true,
        groups: [
          [{ source: "Interviewer Country / Region", operator: "IS IN", value: "Restricted Countries" }],
          [{ source: "Candidate Country / Region", operator: "IS IN", value: "Restricted Countries" }],
          [{ source: "Job Location Country / Region", operator: "IS IN", value: "Restricted Countries" }],
        ],
        outcome: outcome("Block"),
        controlledAction: "Interview Recording",
        reason: "Any checked geographic dimension is in a restricted recording jurisdiction (OR-gate).",
        notifications: [{ persona: "Interviewer", template: NOTIFY_TEMPLATES[0] }],
      },
      {
        kind: "ELSE IF",
        rows: [{ source: "Recording Context Complete", operator: "EQUALS", value: "No" }],
        outcome: outcome("Block"),
        controlledAction: "Interview Recording",
        reason: "Country context unavailable — recording blocked by fallback policy.",
        notifications: [{ persona: "Interviewer", template: NOTIFY_TEMPLATES[0] }],
      },
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

  /* ---- People Engine (Leave & Attendance) ---- */
  if (name.includes("leave application gate")) {
    return { branches: [
      { kind: "IF", groups: [[{ source: "Leave Balance (Annual)", operator: "LESS THAN", value: "Leave Duration (Days)" }]],
        outcome: outcome("Soft Stop"), controlledActions: ["Leave Application"],
        reason: "Requested leave exceeds available annual leave balance — advance leave requires HR approval." },
      { kind: "ELSE IF", groups: [[{ source: "Probation Status", operator: "EQUALS", value: "On Probation" }, { source: "Leave Type", operator: "EQUALS", value: "Annual Leave" }]],
        outcome: outcome("Block"), controlledActions: ["Leave Application"],
        reason: "Annual leave cannot be taken during probation without HR approval." },
    ] };
  }
  if (name.includes("leave approval routing")) {
    return { branches: [
      { kind: "IF", rows: [{ source: "Leave Duration (Days)", operator: "LESS THAN", value: "4" }],
        outcome: outcome("Advance"), controlledActions: ["Leave Approval"],
        reason: "1–3 days: route to Direct Manager (24h SLA)." },
      { kind: "ELSE IF", rows: [{ source: "Leave Duration (Days)", operator: "BETWEEN", value: "4 – 10" }],
        outcome: outcome("Escalate"), controlledActions: ["Leave Approval"],
        reason: "4–10 days: Manager approval + HR notified (48h SLA)." },
      { kind: "ELSE IF", rows: [{ source: "Leave Duration (Days)", operator: "GREATER THAN", value: "10" }],
        outcome: outcome("Pause"), controlledActions: ["Leave Approval"],
        reason: ">10 days: requires Direct Manager + HR approval (72h SLA)." },
      { kind: "ELSE IF", rows: [{ source: "Leave Type", operator: "EQUALS", value: "Leave Without Pay" }],
        outcome: outcome("Escalate"), controlledActions: ["Leave Approval"],
        reason: "LWP requires HR approval.", requiresApproval: true, approver: "HRBP" },
    ] };
  }
  if (name.includes("maternity") || name.includes("paternity")) {
    return { branches: [
      { kind: "IF", rows: [{ source: "Medical Certificate Submitted", operator: "EQUALS", value: "Yes" }],
        outcome: outcome("Transition"), controlledActions: ["Leave Approval"],
        reason: "Documentation submitted — auto-approve maternity/paternity leave (same-day SLA)." },
      { kind: "ELSE", outcome: outcome("Hold"), controlledActions: ["Leave Approval"],
        reason: "Awaiting required documentation before approval." },
    ] };
  }
  if (name.includes("probation leave")) {
    return { branches: [
      { kind: "IF", groups: [[{ source: "Probation Status", operator: "EQUALS", value: "On Probation" }]],
        outcome: outcome("Soft Stop"), controlledActions: ["Leave Application"],
        reason: "Probationary employees limited to @probationLeaveLimit leave per month during prohibition period." },
    ] };
  }
  if (name.includes("sick leave documentation")) {
    return { branches: [
      { kind: "IF", groups: [[{ source: "Leave Type", operator: "EQUALS", value: "Sick Leave" }, { source: "Leave Duration (Days)", operator: "GREATER THAN", value: "@sickLeaveCertDays" }, { source: "Medical Certificate Submitted", operator: "NOT EQUALS", value: "Yes" }]],
        outcome: outcome("Soft Stop"), controlledActions: ["Leave Application"],
        reason: "Medical certificate required for sick leave exceeding @sickLeaveCertDays consecutive days." },
    ] };
  }
  if (name.includes("carry-forward")) {
    return { branches: [
      { kind: "IF", rows: [{ source: "Leave Balance (Annual)", operator: "GREATER THAN", value: "@carryForwardCap" }],
        outcome: outcome("Modify"), controlledActions: ["Leave Balance Adjustment"],
        reason: "Excess annual leave above @carryForwardCap days lapses at year-end; up to cap is carried forward." },
    ] };
  }
  if (name.includes("encashment")) {
    return { branches: [
      { kind: "IF", rows: [{ source: "Leave Balance (Annual)", operator: "GREATER THAN", value: "@encashmentMaxDays" }],
        outcome: outcome("Modify"), controlledActions: ["Leave Balance Adjustment"],
        reason: "Encashment capped at @encashmentMaxDays days of accrued annual leave on separation." },
    ] };
  }
  if (name.includes("late arrival")) {
    return { branches: [
      { kind: "IF", rows: [{ source: "Minutes Late", operator: "LESS THAN", value: "@gracePeriodMinutes" }],
        outcome: outcome("Allow"), controlledActions: ["Attendance Check-in"],
        reason: "Within @gracePeriodMinutes-minute grace period — no penalty." },
      { kind: "ELSE IF", rows: [{ source: "Minutes Late", operator: "GREATER THAN", value: "@gracePeriodMinutes" }],
        outcome: outcome("Monitor"), controlledActions: ["Attendance Check-in"],
        reason: "Late arrival beyond grace period — flagged for review; habitual lateness escalates." },
    ] };
  }
  if (name.includes("regularisation")) {
    return { branches: [
      { kind: "IF", rows: [{ source: "Regularisation Window (Days)", operator: "LESS THAN", value: "@regularisationWindowDays" }],
        outcome: outcome("Allow"), controlledActions: ["Attendance Regularisation"],
        reason: "Within @regularisationWindowDays working-day window — manager approval required (24h SLA)." },
      { kind: "ELSE", outcome: outcome("Block"), controlledActions: ["Attendance Regularisation"],
        reason: "Regularisation window expired — requires HR exception approval." },
    ] };
  }
  if (name.includes("cycle lock")) {
    return { branches: [
      { kind: "IF", rows: [{ source: "Payroll Cycle Lock Status", operator: "EQUALS", value: "Locked" }],
        outcome: outcome("Block"), controlledActions: ["Payroll Processing"],
        reason: "Attendance cycle locked — no further changes accepted for this payroll cycle." },
    ] };
  }
  if (name.includes("incomplete attendance")) {
    return { branches: [
      { kind: "IF", groups: [[{ source: "Attendance Check-in Time", operator: "EQUALS", value: "" }, { source: "Attendance Check-out Time", operator: "EQUALS", value: "" }]],
        outcome: outcome("Soft Stop"), controlledActions: ["Attendance Check-out"],
        reason: "Missing check-in or check-out — may result in payroll deduction unless regularised." },
    ] };
  }
  if (name.includes("absenteeism pattern")) {
    return { branches: [
      { kind: "IF", groups: [[{ source: "Absence Pattern — Weekday", operator: "IS IN", value: "Monday, Friday" }, { source: "Absence Count (Rolling 3 months)", operator: "GREATER THAN", value: "2" }]],
        outcome: outcome("Soft Stop"), controlledActions: ["Absence Review"],
        reason: "Repeated Monday/Friday absence pattern (3+ times) — manager discussion + HR flag." },
      { kind: "ELSE IF", rows: [{ source: "Absence Count (Rolling 3 months)", operator: "GREATER THAN", value: "@shortTermAbsenceThreshold" }],
        outcome: outcome("Escalate"), controlledActions: ["Absence Review"],
        reason: "@shortTermAbsenceThreshold instances in 3 months — informal discussion with manager." },
      { kind: "ELSE IF", rows: [{ source: "Absence Rate (Rolling 12 months)", operator: "GREATER THAN", value: "@rollingAbsenceRatePct" }],
        outcome: outcome("Hard Stop"), controlledActions: ["HR Escalation"],
        reason: "Absence rate exceeds @rollingAbsenceRatePct% — formal HR review and support plan." },
    ] };
  }
  if (name.includes("consecutive absence")) {
    return { branches: [
      { kind: "IF", rows: [{ source: "Consecutive Absence Days", operator: "GREATER THAN", value: "@consecutiveAbsenceThreshold" }],
        outcome: outcome("Escalate"), controlledActions: ["HR Escalation"],
        reason: "@consecutiveAbsenceThreshold+ consecutive unexplained absences — Manager + HR formal review." },
    ] };
  }
  if (name.includes("leave without pay") || name.includes("lwp")) {
    return { branches: [
      { kind: "IF", groups: [[{ source: "Leave Balance (Annual)", operator: "EQUALS", value: "0" }, { source: "Leave Balance (Sick)", operator: "EQUALS", value: "0" }, { source: "Leave Balance (Casual)", operator: "EQUALS", value: "0" }]],
        outcome: outcome("Escalate"), controlledActions: ["Leave Application"],
        reason: "No paid leave balance — LWP requires HR approval; payroll deduction applied.", requiresApproval: true, approver: "HRBP" },
      { kind: "ELSE IF", rows: [{ source: "Leave Application Submitted", operator: "NOT EQUALS", value: "Yes" }],
        outcome: outcome("Block"), controlledActions: ["Leave Application"],
        reason: "Absence without leave application — marked as unauthorised absence / LWP." },
    ] };
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
    const rows = (block.rows || []).filter((r) => r.value);
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

function ScopeSummary({ scopeBlocks, applicability, groupsOnly = false, groupOrGate = false }) {
  const appChips = groupsOnly ? [] : activeApplicability(applicability);
  if (!appChips.length && !scopeBlocks.length) return <Badge variant="secondary">Global</Badge>;
  const gateLabel = groupOrGate ? "OR" : "AND";
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {appChips.map((a) => (
        <Badge key={a.dim} variant="outline">{a.label}: {a.value}</Badge>
      ))}
      {scopeBlocks.map((block, i) => (
        <span key={block.id} className="inline-flex items-center gap-1.5">
          {(i > 0 || appChips.length > 0) && <span className="text-[10px] font-medium text-muted-foreground">{gateLabel}</span>}
          {block.type === "audience" ? (
            <Badge variant="outline">{block.audienceName}</Badge>
          ) : (
            <Badge variant="secondary">
              {(block.rows || []).filter((r) => r.value).length
                ? (block.rows || []).filter((r) => r.value).map((r) => `${r.source} ${r.operator} "${r.value}"`).join(", ")
                : "Custom conditions"}
            </Badge>
          )}
        </span>
      ))}
    </div>
  );
}

function ScopeBuilder({ scopeBlocks, setScopeBlocks, audiences, groupOrGate = false, setGroupOrGate, allowGroupOrGate = false }) {
  const usedAudiences = new Set(scopeBlocks.filter((b) => b.type === "audience").map((b) => b.audienceName));
  const availableAudiences = audiences.filter((a) => !usedAudiences.has(a.name));

  function removeBlock(id) {
    setScopeBlocks((prev) => prev.filter((b) => b.id !== id));
  }
  function addAudienceBlock(audienceName) {
    setScopeBlocks((prev) => [...prev, { id: uid++, type: "audience", audienceName }]);
  }
  function addCustomBlock() {
    setScopeBlocks((prev) => [...prev, {
      id: uid++, type: "custom", orGate: false,
      rows: [{ id: uid++, source: DATA_SOURCES[0], operator: "IS IN", value: "" }],
    }]);
  }
  function addRow(blockId) {
    setScopeBlocks((prev) => prev.map((b) => {
      if (b.id !== blockId) return b;
      const rows = b.rows || [];
      const operator = rows[0]?.operator || "IS IN";
      return {
        ...b,
        rows: [...rows, { id: uid++, source: DATA_SOURCES[0], operator, value: "" }],
      };
    }));
  }
  function removeRow(blockId, rowId) {
    setScopeBlocks((prev) => prev.map((b) => {
      if (b.id !== blockId) return b;
      return { ...b, rows: (b.rows || []).filter((r) => r.id !== rowId) };
    }));
  }
  function updateRow(blockId, rowId, patch) {
    setScopeBlocks((prev) => prev.map((b) => {
      if (b.id !== blockId) return b;
      return { ...b, rows: (b.rows || []).map((r) => (r.id === rowId ? { ...r, ...patch } : r)) };
    }));
  }
  function setBlockOperator(blockId, operator) {
    setScopeBlocks((prev) => prev.map((b) => {
      if (b.id !== blockId) return b;
      return { ...b, rows: (b.rows || []).map((r) => ({ ...r, operator })) };
    }));
  }
  function setBlockOrGate(blockId, nextOrGate) {
    setScopeBlocks((prev) => prev.map((b) => {
      if (b.id !== blockId) return b;
      const orGate = typeof nextOrGate === "boolean" ? nextOrGate : !b.orGate;
      return { ...b, orGate };
    }));
  }

  return (
    <div>
      {scopeBlocks.length === 0 ? (
        <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
          No scope groups yet. This policy will evaluate globally.
        </div>
      ) : (
        scopeBlocks.map((block, bi) => {
          const audience = block.type === "audience" ? audiences.find((a) => a.name === block.audienceName) : null;
          return (
            <Fragment key={block.id}>
              {bi > 0 && (
                <div className="flex py-2">
                  <ConditionGateLabel
                    orGate={groupOrGate}
                    onToggle={() => setGroupOrGate?.(!groupOrGate)}
                    showToggle={allowGroupOrGate}
                    staticLabel={!allowGroupOrGate}
                  />
                </div>
              )}
              <div className="group/block overflow-hidden rounded-lg border">
                <div className="flex items-center justify-between border-b bg-muted/40 px-3.5 py-1.5">
                  <span className="text-xs text-muted-foreground">Group {bi + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover/block:opacity-100 focus-visible:opacity-100"
                    onClick={() => removeBlock(block.id)}
                  >
                    <Trash className="h-3.5 w-3.5" />
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
                      rows={block.rows || []}
                      orGate={!!block.orGate}
                      setOrGate={(nextOrGate) => setBlockOrGate(block.id, nextOrGate)}
                      onUpdateRow={(rid, patch) => updateRow(block.id, rid, patch)}
                      onRemoveRow={(rid) => removeRow(block.id, rid)}
                      onAddRow={() => addRow(block.id)}
                      onSetGroupOperator={(operator) => setBlockOperator(block.id, operator)}
                      toggleAllGates
                      addButtonClassName="mt-5"
                    />
                  </div>
                )}
              </div>
            </Fragment>
          );
        })
      )}

      <div className="mt-5">
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
    </div>
  );
}

const FieldHintContext = createContext({ hintAsTooltip: false });

function FieldHintProvider({ hintAsTooltip, children }) {
  return (
    <FieldHintContext.Provider value={{ hintAsTooltip: !!hintAsTooltip }}>
      {children}
    </FieldHintContext.Provider>
  );
}

function HintIcon({ text }) {
  return (
    <span className="group/hint relative inline-flex shrink-0">
      <Info className="h-3.5 w-3.5 text-muted-foreground/70 transition-colors group-hover/hint:text-muted-foreground" aria-hidden />
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-50 hidden w-56 -translate-x-1/2 rounded-md border bg-popover px-2.5 py-2 text-xs leading-relaxed font-normal text-popover-foreground shadow-md group-hover/hint:block"
      >
        {text}
      </span>
    </span>
  );
}

function FieldHintLabel({ label, hint, className }) {
  const { hintAsTooltip } = useContext(FieldHintContext);
  return (
    <div className={cn("min-w-0", hintAsTooltip ? "flex items-center gap-1.5" : "", className)}>
      <p className="text-sm font-medium">{label}</p>
      {hint && hintAsTooltip && <HintIcon text={hint} />}
      {hint && !hintAsTooltip && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

function Field({ label, hint, children }) {
  const { hintAsTooltip } = useContext(FieldHintContext);
  return (
    <div className="space-y-1.5">
      <div className={cn("flex items-center gap-1.5", hint && !hintAsTooltip && "justify-between")}>
        <div className="flex items-center gap-1.5">
          <Label>{label}</Label>
          {hint && hintAsTooltip && <HintIcon text={hint} />}
        </div>
        {hint && !hintAsTooltip && (
          <span className="text-xs text-muted-foreground">{hint}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function SimpleSelect({ value, onChange, options, placeholder, labels = {}, whiteBg = false }) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger className={cn(whiteBg && "bg-white shadow-sm")}>
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

  const chipList = selected.map((option) => (
    <Badge key={option} variant="secondary" className="h-6 shrink-0 gap-1 pr-1 font-normal">
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
  ));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            matchSelect
              ? "flex h-auto min-h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-white px-2.5 py-1.5 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
              : "flex min-h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          )}
        >
          <div className={cn("flex min-w-0 flex-1 items-center gap-1.5 text-left", matchSelect && "flex-wrap py-0.5")}>
            {selected.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              chipList
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
              className="flex items-center gap-2.5"
            >
              <span
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                  active ? "border-primary bg-primary text-primary-foreground" : "border-input bg-white",
                )}
                aria-hidden
              >
                {active && <Check className="h-3 w-3" />}
              </span>
              <span>{labels[option] || option}</span>
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
      <SelectTrigger className={cn("bg-white shadow-sm", compactTrigger ? "h-auto min-h-10 py-2" : "h-auto min-h-10 py-2.5")}>
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
    <div className="flex min-h-0 flex-1 self-stretch justify-center overflow-auto px-6 py-6">
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

function parseValueParameterParts(value) {
  const text = String(value || "");
  if (!text.includes("@")) return [{ type: "literal", text }];
  const parts = [];
  const regex = /@([A-Za-z0-9_]+)/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "literal", text: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: "param", key: match[1] });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push({ type: "literal", text: text.slice(lastIndex) });
  }
  return parts.length ? parts : [{ type: "literal", text: "" }];
}

function removeParameterFromValue(value, key) {
  let next = String(value).replace(formatParameterRef(key), "");
  next = next.replace(/\s*[–—-]\s*/g, " – ").replace(/^\s*–\s*|\s*–\s*$/g, "").trim();
  return next;
}

function ParameterInsertMenu({ parameters, paramKey, onSelect, onClearLiteral, hasParameter }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0.5 top-1/2 h-7 w-7 -translate-y-1/2 rounded-md font-mono text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
          title="Insert parameter"
        >
          (x)
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Parameters</DropdownMenuLabel>
        {parameters.length === 0 ? (
          <DropdownMenuItem disabled>No parameters registered</DropdownMenuItem>
        ) : (
          parameters.map((param) => (
            <DropdownMenuItem
              key={param.key}
              onClick={() => onSelect(formatParameterRef(param.key))}
              className={cn(param.key === paramKey && "bg-primary/10")}
            >
              <div className="min-w-0">
                <div className="font-medium">{param.label}</div>
                <div className="text-xs text-muted-foreground">
                  @{param.key}
                  {isComputedParameter(param)
                    ? ` · ${formatComputedParameterSummary(param) || "computed"}`
                    : ` · default ${param.value}${param.unit ? ` ${param.unit}` : ""}`}
                </div>
              </div>
            </DropdownMenuItem>
          ))
        )}
        {hasParameter && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onClearLiteral}>Use literal value</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ConditionValueField({ value, onChange, parameters = [], allowParameters = false, placeholder = "value or list reference" }) {
  if (!allowParameters) {
    return (
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-white"
      />
    );
  }

  const parts = parseValueParameterParts(value);
  const hasParameter = parts.some((part) => part.type === "param");
  const isSingleParameter = parts.length === 1 && parts[0].type === "param";
  const singleParam = isSingleParameter ? getParameterByKey(parameters, parts[0].key) : null;

  if (isSingleParameter) {
    return (
      <div className="relative flex h-9 min-w-0 items-center rounded-md border border-input bg-white pl-2.5 pr-9 shadow-sm">
        <Badge variant="secondary" className="h-6 max-w-full gap-1 pr-1 font-normal">
          <span className="truncate">{singleParam?.label || parts[0].key}</span>
          <button
            type="button"
            className="shrink-0 rounded-sm text-muted-foreground hover:text-foreground"
            onClick={() => onChange("")}
            aria-label="Remove parameter"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
        <ParameterInsertMenu
          parameters={parameters}
          paramKey={parts[0].key}
          onSelect={onChange}
          onClearLiteral={() => onChange("")}
          hasParameter
        />
      </div>
    );
  }

  if (hasParameter) {
    return (
      <div className="relative flex h-9 min-w-0 items-center gap-1 overflow-hidden rounded-md border border-input bg-white px-2.5 pr-9 shadow-sm">
        {parts.map((part, index) => (
          part.type === "param" ? (
            <Badge key={`${part.key}-${index}`} variant="secondary" className="h-6 shrink-0 gap-1 pr-1 font-normal">
              <span className="max-w-[7rem] truncate">{getParameterByKey(parameters, part.key)?.label || part.key}</span>
              <button
                type="button"
                className="shrink-0 rounded-sm text-muted-foreground hover:text-foreground"
                onClick={() => onChange(removeParameterFromValue(value, part.key))}
                aria-label="Remove parameter"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ) : (
            <span key={`lit-${index}`} className="shrink-0 text-xs text-muted-foreground">{part.text.trim()}</span>
          )
        ))}
        <ParameterInsertMenu
          parameters={parameters}
          paramKey=""
          onSelect={onChange}
          onClearLiteral={() => onChange("")}
          hasParameter
        />
      </div>
    );
  }

  return (
    <div className="relative min-w-0">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-white pr-9"
      />
      <ParameterInsertMenu
        parameters={parameters}
        paramKey=""
        onSelect={onChange}
        onClearLiteral={() => onChange("")}
        hasParameter={false}
      />
    </div>
  );
}

function ConditionRows({ rows, orGate, setOrGate, onUpdateRow, onRemoveRow, onAddRow, onSetGroupOperator, parameters = [], allowParameters = false, toggleAllGates = false, addButtonClassName = "mt-3", dataSources = DATA_SOURCES }) {
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
                showToggle={toggleAllGates || index === 1}
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="grid flex-1 grid-cols-[1.4fr_1fr_1fr] gap-2">
              <SimpleSelect whiteBg value={row.source} onChange={(v) => onUpdateRow(row.id, { source: v })} options={dataSources} />
              <SimpleSelect whiteBg value={groupOperator} onChange={onSetGroupOperator} options={OPERATORS} />
              {isFieldComparison ? (
                <SimpleSelect
                  whiteBg
                  value={row.value}
                  onChange={(v) => onUpdateRow(row.id, { value: v })}
                  options={dataSources.filter((d) => d !== row.source)}
                  placeholder="compare to field…"
                />
              ) : (
                <ConditionValueField
                  value={row.value}
                  onChange={(v) => onUpdateRow(row.id, { value: v })}
                  parameters={parameters}
                  allowParameters={allowParameters}
                />
              )}
            </div>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => onRemoveRow(row.id)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
      <div className={addButtonClassName}>
        <Button type="button" variant="link" size="sm" className="mt-2 h-auto px-0 py-1 text-xs" onClick={onAddRow}>
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
  const branches = [
    seedBranch(type, {
      kind: "IF",
      rows: [seed.row],
      outcome: seed.ifOutcome,
      actions: seed.notify ? ["Create Case"] : [],
      notifications: seed.notify ? [{ persona: "Interviewer", template: NOTIFY_TEMPLATES[0] }] : [],
    }),
  ];
  if (seed.elseOutcome && seed.elseOutcome !== "Allow") {
    branches.push(seedBranch(type, { kind: "ELSE", outcome: seed.elseOutcome }));
  }
  return branches;
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
                      whiteBg
                      value={action.type}
                      onChange={(value) => changeActionType(action.id, value)}
                      options={availableActions}
                    />
                  </div>
                  {meta && (
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">{meta.label}</Label>
                      <SimpleSelect
                        whiteBg
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
                  whiteBg
                  value={notification.persona}
                  onChange={(value) => onChange(notifications.map((item) => item.id === notification.id ? { ...item, persona: value } : item))}
                  options={PERSONAS}
                />
                <SimpleSelect
                  whiteBg
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
          <FieldHintLabel
            label="Outcome reason"
            hint="Optional note for reviewers and audit logs."
          />
          <Switch checked={reasonOpen} onCheckedChange={toggleReason} />
        </div>
        {reasonOpen && (
          <Textarea
            className="mt-3 bg-white"
            value={branch.reason || ""}
            onChange={(e) => onChange({ reason: e.target.value })}
            rows={2}
            placeholder="e.g. Currently employed by a Tier 1 protected client (EPFO UAN verified)."
          />
        )}
      </div>

      <div className="rounded-lg border bg-muted/20 p-3">
        <div className="flex items-center justify-between gap-3">
          <FieldHintLabel
            label="Require approval before enforcing"
            hint="Hold the outcome until a human confirms (e.g. legal sign-off)."
          />
          <Switch
            checked={!!branch.requiresApproval}
            onCheckedChange={(checked) => onChange({ requiresApproval: checked })}
          />
        </div>
        {branch.requiresApproval && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Approver</Label>
              <SimpleSelect whiteBg value={branch.approver || APPROVERS[0]} onChange={(v) => onChange({ approver: v })} options={APPROVERS} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Enforce at stage</Label>
              <SimpleSelect
                whiteBg
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

function ConditionGroupBuilder({ groups, setGroups, orGate, setOrGate, singleGroup = false, parameters = [], allowParameters = false, dataSources = DATA_SOURCES }) {
  function addRow(gid) {
    setGroups(groups.map((g) => {
      if (g.id !== gid) return g;
      const operator = g.rows[0]?.operator || "IS IN";
      return { ...g, rows: [...g.rows, { id: uid++, source: dataSources[0], operator, value: "" }] };
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
    setGroups([...groups, { id: uid++, rows: [{ id: uid++, source: dataSources[0], operator, value: "" }] }]);
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
            <div className="bg-white p-3.5">
              <ConditionRows
                rows={g.rows}
                orGate={orGate}
                setOrGate={setOrGate}
                onUpdateRow={(rid, patch) => updateRow(g.id, rid, patch)}
                onRemoveRow={(rid) => removeRow(g.id, rid)}
                onAddRow={() => addRow(g.id)}
                onSetGroupOperator={(operator) => setGroupOperator(g.id, operator)}
                parameters={parameters}
                allowParameters={allowParameters}
                dataSources={dataSources}
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

const HIRING_NAV_PRIMARY = [
  { id: "library", label: "Policies", icon: Shield },
  { id: "audiences", label: "Audiences", icon: Users },
  { id: "messages", label: "Message Library", icon: MessageSquare },
  { id: "hitl", label: "HITL Registry", icon: UserCheck },
  { id: "testlab", label: "Test Lab", icon: Waypoints },
];

const HIRING_NAV_SECONDARY = [
  { id: "lists", label: "Managed Lists", icon: ListChecks },
  { id: "parameters", label: "Parameters", icon: SlidersHorizontal },
  { id: "types", label: "Policy Types", icon: Database },
  { id: "functions", label: "Business Functions", icon: Building2 },
];

const PEOPLE_NAV_PRIMARY = [
  { id: "library", label: "Policies", icon: Shield },
  { id: "leave_rules", label: "Leave Management", icon: Calendar },
  { id: "attendance_rules", label: "Attendance", icon: Clock },
  { id: "absenteeism", label: "Absenteeism", icon: AlertTriangle },
  { id: "audiences", label: "Audiences", icon: Users },
];

const PEOPLE_NAV_SECONDARY = [
  { id: "parameters", label: "Parameters", icon: SlidersHorizontal },
  { id: "types", label: "Policy Types", icon: Database },
  { id: "functions", label: "Business Functions", icon: Building2 },
];

function getNavForEngine(engine) {
  return engine === "people"
    ? { primary: PEOPLE_NAV_PRIMARY, secondary: PEOPLE_NAV_SECONDARY, centerLabel: "People Policy Center" }
    : { primary: HIRING_NAV_PRIMARY, secondary: HIRING_NAV_SECONDARY, centerLabel: "Policy Center" };
}

const DEFAULT_VIEW_BY_ENGINE = { hiring: "library", people: "library" };

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

function EngineSwitcher({ engine, setEngine, setView, setEditingId }) {
  return (
    <div className="flex rounded-lg border bg-muted/30 p-0.5">
      {Object.values(ENGINES).map((e) => (
        <button
          key={e.key}
          type="button"
          onClick={() => {
            setEngine(e.key);
            setView(DEFAULT_VIEW_BY_ENGINE[e.key]);
            setEditingId(null);
          }}
          className={cn(
            "flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
            engine === e.key
              ? "bg-white text-primary shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {e.label}
        </button>
      ))}
    </div>
  );
}

function AppSidebar({ view, setView, setEditingId, engine, setEngine }) {
  const navIconClass = "text-[#464F5E]";
  const { primary, secondary, centerLabel } = getNavForEngine(engine);

  return (
    <aside className="sticky top-0 flex h-screen shrink-0 self-start">
      {/* Icon rail — decorative only */}
      <div className="flex h-full w-[52px] shrink-0 flex-col items-center border-r bg-[#f3f3f6] py-3">
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
      <div className="flex h-full w-[200px] shrink-0 flex-col border-r bg-white">
        <div className="px-4 pb-2 pt-5">
          <p className="text-sm text-muted-foreground">{centerLabel}</p>
        </div>
        <nav className="flex-1 space-y-0.5 px-2">
          {primary.map((n) => (
            <NavItem key={n.id} item={n} view={view} setView={setView} setEditingId={setEditingId} navIconClass={navIconClass} />
          ))}
          <Separator className="my-2" />
          {secondary.map((n) => (
            <NavItem key={n.id} item={n} view={view} setView={setView} setEditingId={setEditingId} navIconClass={navIconClass} />
          ))}
        </nav>
        <div className="border-t px-3 py-3">
          <EngineSwitcher engine={engine} setEngine={setEngine} setView={setView} setEditingId={setEditingId} />
        </div>
      </div>
    </aside>
  );
}

export default function PolicyLibraryApp() {
  const [engine, setEngine] = useState("hiring");
  const [view, setView] = useState("library");
  const [parameters, setParameters] = useState(PARAMETERS_SEED);
  const [policies, setPolicies] = useState(POLICIES_SEED);
  const [audiences, setAudiences] = useState(AUDIENCES_SEED);
  const [taxonomy, setTaxonomy] = useState(TAXONOMY_SEED);
  const [peopleParameters, setPeopleParameters] = useState(PEOPLE_PARAMETERS_SEED);
  const [peoplePolicies, setPeoplePolicies] = useState(PEOPLE_POLICIES_SEED);
  const [peopleAudiences, setPeopleAudiences] = useState(PEOPLE_AUDIENCES_SEED);
  const [peopleTaxonomy, setPeopleTaxonomy] = useState(PEOPLE_TAXONOMY_SEED);
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState("");

  const isPeople = engine === "people";
  const activePolicies = isPeople ? peoplePolicies : policies;
  const setActivePolicies = isPeople ? setPeoplePolicies : setPolicies;
  const activeParameters = isPeople ? peopleParameters : parameters;
  const setActiveParameters = isPeople ? setPeopleParameters : setParameters;
  const activeAudiences = isPeople ? peopleAudiences : audiences;
  const setActiveAudiences = isPeople ? setPeopleAudiences : setAudiences;
  const activeTaxonomy = isPeople ? peopleTaxonomy : taxonomy;
  const setActiveTaxonomy = isPeople ? setPeopleTaxonomy : setTaxonomy;
  const activeDataSources = getEngineDataSources(engine);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(""), 2200); }

  function openBuilder(id) {
    setEditingId(id);
    setView("builder");
  }
  function newPolicy() { setEditingId("new"); setView("builder"); }
  const inBuilder = view === "builder";

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f8fb] text-foreground">
      {!inBuilder && (
        <AppSidebar
          view={view}
          setView={setView}
          setEditingId={setEditingId}
          engine={engine}
          setEngine={setEngine}
        />
      )}

      {/* Main */}
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
        {view === "library" && (
          <LibraryView
            policies={activePolicies}
            openBuilder={openBuilder}
            newPolicy={newPolicy}
            title={isPeople ? "People Policy Library" : "Policy Library"}
            subtitle={isPeople ? `${activePolicies.length} policies · Leave & Attendance (India)` : undefined}
          />
        )}
        {view === "leave_rules" && isPeople && (
          <DomainPolicyView pageKey="leave_rules" policies={activePolicies} parameters={activeParameters} openBuilder={openBuilder} />
        )}
        {view === "attendance_rules" && isPeople && (
          <DomainPolicyView pageKey="attendance_rules" policies={activePolicies} parameters={activeParameters} openBuilder={openBuilder} />
        )}
        {view === "absenteeism" && isPeople && (
          <DomainPolicyView pageKey="absenteeism" policies={activePolicies} parameters={activeParameters} openBuilder={openBuilder} />
        )}
        {view === "audiences" && (
          <AudiencesView
            audiences={activeAudiences}
            setAudiences={setActiveAudiences}
            showToast={showToast}
            dataSources={activeDataSources}
          />
        )}
        {view === "messages" && !isPeople && (
          <PlaceholderView
            title="Message Library"
            description="Notification templates and outbound messages used by policy outcomes."
            icon={MessageSquare}
          />
        )}
        {view === "hitl" && !isPeople && (
          <PlaceholderView
            title="HITL Registry"
            description="Human-in-the-loop approval gates, approvers, and escalation rules."
            icon={UserCheck}
          />
        )}
        {view === "testlab" && !isPeople && (
          <PlaceholderView
            title="Test Lab"
            description="Run policy scenarios against sample candidate and workflow data."
            icon={Waypoints}
          />
        )}
        {view === "lists" && !isPeople && <ListsView />}
        {view === "parameters" && (
          <ParametersView parameters={activeParameters} setParameters={setActiveParameters} showToast={showToast} />
        )}
        {view === "types" && <TypesView />}
        {view === "functions" && (
          <FunctionsView taxonomy={activeTaxonomy} setTaxonomy={setActiveTaxonomy} showToast={showToast} />
        )}
        {view === "builder" && (
          <BuilderView
            policyId={editingId}
            policies={activePolicies}
            setPolicies={setActivePolicies}
            audiences={activeAudiences}
            setAudiences={setActiveAudiences}
            taxonomy={activeTaxonomy}
            parameters={activeParameters}
            engine={engine}
            onExit={() => { setView("library"); setEditingId(null); }}
            showToast={showToast}
          />
        )}
      </main>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm text-primary-foreground shadow-lg">
          <Check className="h-4 w-4 text-emerald-400" /> {toast}
        </div>
      )}
    </div>
  );
}

/* ---------------- Library view ---------------- */

function LibraryView({ policies, openBuilder, newPolicy, title = "Policy Library", subtitle }) {
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
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{subtitle || `${policies.length} policies across ${POLICY_TYPES.length} types`}</p>
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
              <TableHead>Priority</TableHead>
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
                  {getPolicyTriggerLabel(p) !== "—"
                    ? <span className="text-xs text-muted-foreground">{getPolicyTriggerLabel(p)}</span>
                    : <span className="text-xs text-muted-foreground">—</span>}
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
                <TableCell><PriorityBadge policy={p} /></TableCell>
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

const PEOPLE_DOMAIN_PAGES = {
  leave_rules: {
    title: "Leave Management",
    description: "Entitlement, accrual, application, approval routing, and carry-forward rules from the Leave & Attendance Policy (India).",
    category: "leave",
    icon: Calendar,
    highlights: [
      "24 days annual leave/year, accruing at 2 days/month",
      "Approval routing by duration: Manager (1–3d), Manager + HR (4–10d), HR approval (>10d)",
      "Maternity/Paternity auto-approved on documentation",
      "5-day carry-forward cap; sick/casual leave lapses at year-end",
    ],
  },
  attendance_rules: {
    title: "Attendance",
    description: "Check-in/out, grace period, regularisation windows, and payroll cycle lock enforcement.",
    category: "attendance",
    icon: Clock,
    highlights: [
      "15-minute late arrival grace period",
      "Regularisation within 3 working days of discrepancy",
      "Monthly payroll cycle (26th–25th) with cycle lock",
      "Incomplete check-in/out triggers soft stop",
    ],
  },
  absenteeism: {
    title: "Absenteeism",
    description: "Pattern detection and escalation thresholds for unauthorised or repeated absence.",
    category: "absenteeism",
    icon: AlertTriangle,
    highlights: [
      "Monday/Friday pattern × 3 → manager discussion + HR flag",
      "3 instances in 3 months → informal review",
      "10%+ rolling 12-month rate → formal HR review",
      "3+ consecutive unexplained days → Manager + HR formal review",
    ],
  },
};

function DomainPolicyView({ pageKey, policies, parameters, openBuilder }) {
  const page = PEOPLE_DOMAIN_PAGES[pageKey];
  const Icon = page.icon;
  const domainPolicies = policies.filter((p) => p.category === page.category);
  const relatedParams = parameters.filter((p) =>
    p.usedBy?.some((u) => domainPolicies.some((pol) => pol.name === u))
  );

  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{page.title}</h1>
        </div>
        <p className="max-w-3xl text-sm text-muted-foreground">{page.description}</p>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Policy highlights</CardTitle>
            <CardDescription>Key rules from Leave_Attendance_Policy.docx.pdf</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {page.highlights.map((h) => (
                <li key={h} className="flex gap-2">
                  <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Parameters</CardTitle>
            <CardDescription>Configurable thresholds for this domain</CardDescription>
          </CardHeader>
          <CardContent>
            {relatedParams.length === 0 ? (
              <p className="text-sm text-muted-foreground">No domain-specific parameters configured.</p>
            ) : (
              <div className="space-y-2">
                {relatedParams.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                    <span className="font-medium">{p.label}</span>
                    <Badge variant="secondary">{p.value}{p.unit ? ` ${p.unit}` : ""}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/20 py-3">
          <CardTitle className="text-base">{domainPolicies.length} policies in this domain</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Trigger</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {domainPolicies.map((p) => (
              <TableRow key={p.id} onClick={() => openBuilder(p.id)} className="cursor-pointer">
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell><Badge variant="outline">{p.type}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">{getPolicyTriggerLabel(p)}</TableCell>
                <TableCell><PriorityBadge policy={p} /></TableCell>
                <TableCell><StatusDot status={p.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

/* ---------------- Audiences view ---------------- */

function AudiencesView({ audiences, setAudiences, showToast, dataSources = DATA_SOURCES }) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [groups, setGroups] = useState([{ id: uid++, rows: [{ id: uid++, source: dataSources[0], operator: "IS IN", value: "" }] }]);
  const [orGate, setOrGate] = useState(false);
  const [expanded, setExpanded] = useState(null);

  function save() {
    if (!name.trim()) return;
    const summary = groups.flatMap((g) => g.rows).filter((r) => r.value).map((r) => ({ source: r.source, operator: r.operator, value: r.value }));
    setAudiences([...audiences, { id: `aud-${uid++}`, name, summary, usedBy: [] }]);
    setCreating(false); setName(""); setGroups([{ id: uid++, rows: [{ id: uid++, source: dataSources[0], operator: "IS IN", value: "" }] }]);
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
            <ConditionGroupBuilder groups={groups} setGroups={setGroups} orGate={orGate} setOrGate={setOrGate} dataSources={dataSources} />
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

function ParametersView({ parameters, setParameters, showToast }) {
  const [expandedId, setExpandedId] = useState(null);

  function updateParameter(id, patch) {
    setParameters(parameters.map((param) => param.id === id ? { ...param, ...patch } : param));
    showToast?.("Parameter updated");
  }

  function setParameterType(id, nextType) {
    const param = parameters.find((item) => item.id === id);
    if (!param) return;
    if (nextType === "computed") {
      updateParameter(id, {
        type: "computed",
        valueType: "boolean",
        value: "true",
        unit: null,
        compute: param.compute || { orGate: false, groups: createBlankComputeGroups() },
      });
    } else {
      updateParameter(id, {
        type: "static",
        valueType: undefined,
        value: param.value === "true" ? "0" : (param.value || "0"),
        unit: param.unit || "days",
        compute: undefined,
      });
    }
  }

  function addParameter() {
    const next = {
      id: `par-${uid++}`,
      key: `param${uid}`,
      label: "New parameter",
      type: "static",
      value: "0",
      unit: "days",
      scope: "Tenant · Job family · Location",
      description: "",
      usedBy: [],
    };
    setParameters([...parameters, next]);
    setExpandedId(next.id);
    showToast?.("Parameter added");
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Parameters</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        Tenant-scoped values referenced in V3 rule conditions as{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">@parameterKey</code>.
        Static parameters hold defaults; computed parameters resolve dynamically from other properties.
      </p>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-8" />
              <TableHead>Parameter</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Default</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead className="text-right">Used by</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {parameters.map((param) => {
              const computed = isComputedParameter(param);
              const expanded = expandedId === param.id;
              const computeClauses = getComputedParameterClauses(param);
              return (
                <Fragment key={param.id}>
                  <TableRow className={cn(expanded && "border-b-0")}>
                    <TableCell className="px-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground"
                        onClick={() => setExpandedId(expanded ? null : param.id)}
                        aria-label={expanded ? "Collapse parameter" : "Expand parameter"}
                      >
                        <ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="font-medium">{param.label}</div>
                        <Badge variant={computed ? "default" : "outline"} className="text-[10px]">
                          {computed ? "Computed" : "Static"}
                        </Badge>
                      </div>
                      <div className="mt-0.5 max-w-md text-xs text-muted-foreground">{param.description}</div>
                      {computed && computeClauses.length > 0 && (
                        <div className="mt-2 flex flex-wrap items-center gap-1">
                          {computeClauses.map((clause, index) => (
                            <Fragment key={`${param.id}-clause-${index}`}>
                              {index > 0 && (
                                <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                                  {param.compute?.orGate ? "or" : "and"}
                                </span>
                              )}
                              <Badge variant="outline" className="font-normal">{clause}</Badge>
                            </Fragment>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-[11px]">{param.key}</Badge>
                    </TableCell>
                    <TableCell>
                      {computed ? (
                        <Badge variant="secondary" className="font-normal">Dynamic · boolean</Badge>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Input
                            value={param.value}
                            onChange={(e) => updateParameter(param.id, { value: e.target.value })}
                            className="h-8 w-24 bg-white text-xs"
                          />
                          {param.unit && <span className="text-xs text-muted-foreground">{param.unit}</span>}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{param.scope}</TableCell>
                    <TableCell className="text-right">
                      <div className="group/usedby relative inline-flex justify-end">
                        <span className="cursor-default rounded px-1.5 py-0.5 text-sm tabular-nums text-muted-foreground hover:bg-muted">
                          {param.usedBy.length}
                        </span>
                        {param.usedBy.length > 0 && (
                          <div className="pointer-events-none absolute right-0 top-full z-50 mt-1 hidden min-w-[12rem] rounded-md border bg-popover px-2.5 py-2 text-left shadow-md group-hover/usedby:block">
                            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Used by</p>
                            <div className="space-y-1">
                              {param.usedBy.map((name) => (
                                <div key={name} className="text-xs text-foreground">{name}</div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  {expanded && (
                    <TableRow className="bg-muted/10 hover:bg-muted/10">
                      <TableCell colSpan={6} className="p-4">
                        <div className="space-y-4">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <Field label="Label">
                              <Input
                                value={param.label}
                                onChange={(e) => updateParameter(param.id, { label: e.target.value })}
                                className="bg-white"
                              />
                            </Field>
                            <Field label="Key">
                              <Input
                                value={param.key}
                                onChange={(e) => updateParameter(param.id, { key: e.target.value.replace(/\s+/g, "") })}
                                className="bg-white font-mono text-sm"
                              />
                            </Field>
                          </div>
                          <Field label="Description">
                            <Textarea
                              value={param.description}
                              onChange={(e) => updateParameter(param.id, { description: e.target.value })}
                              rows={2}
                              className="bg-white"
                            />
                          </Field>
                          <Field label="Value type">
                            <SimpleSelect
                              whiteBg
                              value={computed ? "computed" : "static"}
                              onChange={(value) => setParameterType(param.id, value)}
                              options={["static", "computed"]}
                              labels={{ static: "Static default", computed: "Computed from properties" }}
                            />
                          </Field>
                          {computed ? (
                            <Field
                              label="Compute when"
                              hint="Parameter resolves to true when these conditions match (evaluated at runtime)."
                            >
                              <ConditionGroupBuilder
                                groups={param.compute?.groups || createBlankComputeGroups()}
                                setGroups={(groups) => updateParameter(param.id, {
                                  compute: { ...(param.compute || { orGate: false }), groups },
                                })}
                                orGate={!!param.compute?.orGate}
                                setOrGate={(orGate) => updateParameter(param.id, {
                                  compute: { ...(param.compute || { groups: createBlankComputeGroups() }), orGate },
                                })}
                                singleGroup
                              />
                            </Field>
                          ) : (
                            <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
                              <Field label="Default value">
                                <Input
                                  value={param.value}
                                  onChange={(e) => updateParameter(param.id, { value: e.target.value })}
                                  className="bg-white"
                                />
                              </Field>
                              <Field label="Unit">
                                <Input
                                  value={param.unit || ""}
                                  onChange={(e) => updateParameter(param.id, { unit: e.target.value })}
                                  className="bg-white"
                                  placeholder="days"
                                />
                              </Field>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Button variant="outline" className="mt-3.5 w-full border-dashed" onClick={addParameter}>
        <Plus className="h-3.5 w-3.5" /> Add parameter
      </Button>
    </div>
  );
}

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

function BuilderView({ policyId, policies, setPolicies, audiences, taxonomy, parameters, engine = "hiring", isAdmin = true, onExit, showToast }) {
  const existing = policies.find((p) => p.id === policyId);
  const engineTriggers = getEngineTriggers(engine);
  const engineDataSources = getEngineDataSources(engine);
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
  const [documents, setDocuments] = useState(existing
    ? (engine === "people" ? [PEOPLE_POLICY_SOURCE.LEAVE_ATTENDANCE] : [SAMPLE_DOCS[0], SAMPLE_DOCS[2]])
    : []);
  const [aiGenerated, setAiGenerated] = useState(!!existing);
  const [generating, setGenerating] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);

  const [typeKey, setTypeKey] = useState(existing?.type || "Guardrail");
  const type = POLICY_TYPES.find((t) => t.key === typeKey);
  const seededRule = seedRuleForPolicy(existing, type);

  const [domain, setDomain] = useState(existing?.domain || Object.keys(taxonomy)[0]);
  const [fn, setFn] = useState(existing?.fn || taxonomy[Object.keys(taxonomy)[0]][0]);
  const [personas, setPersonas] = useState(existing?.personas || []);
  const [trigger] = useState(existing?.trigger || engineTriggers[0]);
  const [priority, setPriority] = useState(() => defaultPolicyPriority(existing));
  const mandatory = !!existing?.mandatory;
  const [isGlobal, setIsGlobal] = useState(() => existing?.global ?? !!existing?.mandatory);
  const [applicability, setApplicability] = useState({ ...defaultApplicability, ...(existing?.applicability || {}) });

  const [scopeBlocks, setScopeBlocks] = useState(() => initScopeBlocks(existing));
  const [scopeOrGate, setScopeOrGate] = useState(() => !!existing?.scopeOrGate);

  const [branches, setBranches] = useState(() => hydrateBranches(
    branchesFromSeed(type, seededRule),
    { existing, fn, policyControlledAction: defaultControlledAction(existing), policyTrigger: existing?.trigger || engineTriggers[0] },
  ));

  useEffect(() => {
    if (activeTab !== "configuration") {
      setAiChatOpen(false);
    }
  }, [activeTab]);

  const linkedWorkflows = getWorkflowsForEngine(engine).filter((w) => w.policies.includes(existing?.id));
  const coPolicies = getCoPoliciesOnWorkflowsForEngine(existing?.id, policies, engine);
  const configReadOnly = isGlobal && !isAdmin;

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
    if (configReadOnly) {
      showToast("Global policies can only be edited by platform admins");
      return;
    }
    const scope = scopeBlocks.filter((b) => b.type === "audience").map((b) => b.audienceName);
    const scopeInline = scopeBlocks.some((b) => b.type === "custom");
    const base = { id: existing?.id || (engine === "people" ? `pe${uid++}` : `p${uid++}`), name, type: typeKey, domain, fn, scope, scopeInline, status, personas, applicability, source: existing?.source || (engine === "people" ? PEOPLE_POLICY_SOURCE.LEAVE_ATTENDANCE : undefined), priority: mandatory ? undefined : priority, mandatory: mandatory || undefined, global: isGlobal || undefined };
    const record = {
      ...base,
      scopeOrGate: scopeOrGate || undefined,
      trigger: branches[0]?.trigger || trigger,
      branchSettings: branches.map((b, index) => ({
        index,
        kind: b.kind,
        trigger: b.trigger,
        controlledAction: b.controlledAction,
        controlledActions: getBranchControlledActions(b),
      })),
    };
    if (existing) setPolicies(policies.map((p) => p.id === record.id ? record : p));
    else setPolicies([...policies, record]);
    showToast(existing ? "Policy updated" : "Policy created");
    onExit();
  }

  const scopeLabel = buildScopeLabel(applicability, scopeBlocks);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f8f8fb]">
      {/* header */}
      <div className="sticky top-0 z-20 shrink-0 border-b bg-white/85 px-6 py-4 backdrop-blur-xl">
        <div className="relative flex items-center gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Button variant="outline" size="icon" className="h-7 w-7 shrink-0 bg-white shadow-sm" onClick={onExit}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Input value={name} onChange={(e) => setName(e.target.value)} readOnly={configReadOnly}
              className="h-auto min-w-0 max-w-[min(36vw,28rem)] border-0 bg-transparent px-0 text-xl font-semibold tracking-[-0.03em] shadow-none focus-visible:ring-0" />
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
            {configReadOnly && (
              <Badge variant="secondary" className="hidden sm:inline-flex">View only</Badge>
            )}
            {status === "Draft" ? (
              <Button variant="outline" disabled={configReadOnly} onClick={() => setStatus("Active")}>Publish</Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" disabled={configReadOnly}>Active</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem disabled={configReadOnly} onClick={() => setStatus("Draft")}>Move to draft</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button onClick={publish} disabled={configReadOnly} className="shadow-primary/20">
              {existing ? "Save changes" : "Save"}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 items-stretch overflow-visible">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {activeTab === "context" && (
          <ContextTab
            aiPrompt={aiPrompt} setAiPrompt={setAiPrompt}
            documents={documents} addDocument={addDocument} removeDocument={removeDocument}
            generating={generating} generateFromAI={generateFromAI} aiGenerated={aiGenerated}
            name={name} typeKey={typeKey} domain={domain} fn={fn} scopeLabel={scopeLabel}
            personas={personas} branches={branches} type={type}
            parameters={parameters}
            description={description} onEditConfig={() => setActiveTab("configuration")}
            readOnly={configReadOnly}
          />
        )}

        {activeTab === "configuration" && (
          <ConfigurationTabRuleLevel
            configSection={configSection} setConfigSection={setConfigSection}
            typeKey={typeKey} setTypeKey={setTypeKey} type={type} setBranches={setBranches}
            domain={domain} setDomain={setDomain} fn={fn} setFn={setFn} taxonomy={taxonomy}
            description={description} setDescription={setDescription}
            personas={personas} policyName={name}
            applicability={applicability} setApplicability={setApplicability}
            scopeBlocks={scopeBlocks} setScopeBlocks={setScopeBlocks}
            scopeOrGate={scopeOrGate} setScopeOrGate={setScopeOrGate}
            audiences={audiences}
            parameters={parameters}
            branches={branches} addElseIf={addElseIf} removeBranch={removeBranch} updateBranch={updateBranch}
            priority={priority} setPriority={setPriority} mandatory={mandatory} coPolicies={coPolicies}
            isGlobal={isGlobal} setIsGlobal={setIsGlobal} readOnly={configReadOnly}
            engine={engine} dataSources={engineDataSources} triggers={engineTriggers}
          />
        )}

        {activeTab === "usage" && (
          <UsageTab policyId={existing?.id} policyName={name} policyStatus={status} workflows={linkedWorkflows} policies={policies} />
        )}
        </div>

      {activeTab === "configuration" && !configReadOnly && (
        aiChatOpen ? (
          <ConfigurationAiChatPanel
            onClose={() => setAiChatOpen(false)}
            policyName={name}
            typeKey={typeKey}
            configSection={configSection}
            branchCount={branches.length}
          />
        ) : (
          <ConfigurationAiTab onClick={() => setAiChatOpen(true)} />
        )
      )}
      </div>
    </div>
  );
}

/* ---------------- Context tab (AI-first) ---------------- */

function ContextTab({ aiPrompt, setAiPrompt, documents, addDocument, removeDocument, generating, generateFromAI, aiGenerated,
  name, typeKey, domain, fn, scopeLabel, personas, branches, type, parameters, description, onEditConfig, readOnly = false }) {
  const availableDocs = SAMPLE_DOCS.filter((d) => !documents.includes(d));

  return (
    <div className={cn("mx-auto grid max-w-6xl flex-1 gap-6 overflow-auto px-6 py-6", aiGenerated && "xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] xl:items-stretch")}>
      {readOnly && (
        <div className="col-span-full">
          <PolicyConfigReadOnlyNotice />
        </div>
      )}
      <Card className={cn("flex min-h-[calc(100vh-11rem)] flex-col overflow-hidden", readOnly && "pointer-events-none select-none opacity-60")}>
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
        <Card className={cn("overflow-hidden", readOnly && "pointer-events-none select-none opacity-60")}>
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
              <span className="text-xs text-muted-foreground">Rules</span>
              <div className="mt-2 space-y-2">
                {branches.map((b, bi) => (
                  <div key={b.id} className="flex items-start gap-2.5 text-sm">
                    <span className="mt-0.5 w-14 shrink-0 text-xs text-muted-foreground">
                      {`Rule ${bi + 1}`}
                    </span>
                    <div className="flex-1">
                      {b.trigger && (
                        <p className="mb-0.5 text-[11px] text-muted-foreground">{b.trigger}</p>
                      )}
                      {getBranchControlledActions(b).length > 0 && (
                        <p className="mb-0.5 text-[11px] text-muted-foreground">{formatControlledActionsList(getBranchControlledActions(b))}</p>
                      )}
                      {b.kind !== "ELSE" && b.groups?.flatMap((g) => g.rows).filter((r) => r.value).length > 0 ? (
                        <span className="text-muted-foreground">
                          {b.groups.flatMap((g) => g.rows).filter((r) => r.value).map((r) => formatConditionClause(r, parameters)).join(" and ")}
                        </span>
                      ) : b.kind === "ELSE" ? (
                        <span className="text-muted-foreground">Otherwise</span>
                      ) : (
                        <span className="italic text-muted-foreground">Conditions not set</span>
                      )}
                      <span className="mx-1.5 text-muted-foreground">→</span>
                      <OutcomeWithAction
                        outcome={b.outcome}
                        controlledActions={getBranchControlledActions(b)}
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

/* ---------------- Configuration AI assistant ---------------- */

const AI_AGENT_AVATAR = "/ai-agent-avatar.png";
const AI_INDIGO = "#312e81";

function buildConfigurationAiReply(input, { policyName, typeKey, configSection, branchCount }) {
  const text = input.toLowerCase();
  if (text.includes("trigger")) {
    return "Each rule can have its own trigger. Use the Trigger field at the top of each rule — for example Apply for soft stops and Offer for hard stops on no-poach policies.";
  }
  if (text.includes("parameter") || text.includes("(x)")) {
    return "Click (x) in a condition value field to insert a parameter tag. Registered parameters live under Parameters in the sidebar — e.g. tier2CoolOffDays for cooling-off windows.";
  }
  if (text.includes("cool") || text.includes("tier 2")) {
    return "For Tier 2 cooling-off, match the No-Poach Tier 2 list AND Days Since Last Working Day less than @tier2CoolOffDays. Adjust the default in Parameters.";
  }
  if (text.includes("rule") || text.includes("branch")) {
    return `This ${typeKey} policy has ${branchCount} rule${branchCount === 1 ? "" : "s"}. Rules are evaluated FIRST_MATCH — the first matching branch wins. You're on the ${configSection} section now.`;
  }
  return `For "${policyName}", I can help refine ${configSection === "rules" ? "conditions, triggers, and outcomes" : `the ${configSection} section`}. Try asking about triggers, parameters, or how to model a specific scenario.`;
}

const AI_NOTCH_OUTLINE_PATH = "M 36 104 Q 36 84 16 84 L 12 84 A 12 12 0 0 1 0 72 L 0 32 A 12 12 0 0 1 12 20 L 16 20 Q 36 20 36 0";

function ConfigurationAiTab({ onClick }) {
  const gradientId = useId().replace(/:/g, "");

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative shrink-0 self-center overflow-visible pr-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
      aria-label="Open AI assistant"
    >
      <span
        className="pointer-events-none absolute top-1/2 right-[calc(100%+0.75rem)] -translate-y-1/2 text-[11px] font-bold uppercase tracking-[0.16em] whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{ color: AI_INDIGO }}
      >
        AI
      </span>

      <div className="relative drop-shadow-[-3px_0_12px_rgba(15,23,42,0.12)]">
        <svg
          className="ai-notch-glow pointer-events-none absolute inset-0 h-full w-full overflow-visible"
          viewBox="0 0 36 104"
          fill="none"
          aria-hidden
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="104" x2="36" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="50%" stopColor="#2dd4bf" />
              <stop offset="100%" stopColor="#4338ca" />
            </linearGradient>
          </defs>
          <path
            d={AI_NOTCH_OUTLINE_PATH}
            stroke={`url(#${gradientId})`}
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="ai-notch-glow-stroke"
          />
        </svg>

        <div className="flex flex-col items-end">
          <div
            className="h-5 w-5 shrink-0 bg-white transition-colors duration-200 group-hover:bg-slate-50"
            style={{ clipPath: 'path("M 20 0 L 20 20 L 0 20 Q 20 20 20 0 Z")' }}
            aria-hidden
          />
          <div className="flex h-[4rem] w-9 shrink-0 items-center justify-center rounded-tl-xl rounded-bl-xl bg-white transition-colors duration-200 group-hover:bg-slate-50">
            <img
              src={AI_AGENT_AVATAR}
              alt=""
              className="h-6 w-6 rounded-full object-cover ring-1 ring-white"
            />
          </div>
          <div
            className="h-5 w-5 shrink-0 bg-white transition-colors duration-200 group-hover:bg-slate-50"
            style={{ clipPath: 'path("M 20 20 L 20 0 L 0 0 Q 20 0 20 20 Z")' }}
            aria-hidden
          />
        </div>
      </div>
    </button>
  );
}

function ConfigurationAiChatPanel({ onClose, policyName, typeKey, configSection, branchCount }) {
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      text: "I can help you configure this policy. What would you like to set up?",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 200);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  function sendMessage() {
    const text = input.trim();
    if (!text || sending) return;
    const userMsg = { id: `u-${Date.now()}`, role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: buildConfigurationAiReply(text, { policyName, typeKey, configSection, branchCount }),
        },
      ]);
      setSending(false);
    }, 700);
  }

  return (
    <aside
      className="flex min-h-0 w-[min(380px,34vw)] shrink-0 flex-col self-stretch border-l border-[#e5e7eb] bg-white"
      aria-label="AI assistant panel"
    >
      <div className="flex shrink-0 items-center gap-3 border-b border-[#e5e7eb] px-4 py-3.5">
        <img src={AI_AGENT_AVATAR} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
        <p className="min-w-0 flex-1 text-sm font-bold uppercase tracking-wide" style={{ color: AI_INDIGO }}>
          AI ASSISTANT
        </p>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          aria-label="Collapse AI assistant"
        >
          <PanelRightClose className="h-[18px] w-[18px]" />
        </button>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-5">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-[#F0F2F7] text-slate-800",
              )}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-[#F0F2F7] px-4 py-3 text-sm text-slate-500">Thinking…</div>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-[#e5e7eb] bg-white px-4 py-4">
        <div className="relative">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Ask AI..."
            className="h-11 rounded-lg border-slate-200 bg-white pr-12 pl-4 shadow-none"
            disabled={sending}
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="absolute top-1/2 right-1.5 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Send message"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

/* ---------------- Configuration tab — rule-level variant ---------------- */

function GlobalAlwaysOnBanner({ isGlobal, setIsGlobal, mandatory = false }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg bg-gray-50 px-4 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">Global (Always-on)</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Applies at all times across every workflow and context, and can not be disabled by users. 
        </p>
      </div>
      <Switch
        checked={isGlobal}
        onCheckedChange={setIsGlobal}
        disabled={mandatory}
        aria-label="Global always-on"
      />
    </div>
  );
}

function PolicyConfigReadOnlyNotice() {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
      <p className="text-sm font-medium text-amber-950">View only — global policy</p>
      <p className="mt-1 text-xs leading-relaxed text-amber-900/80">
        This policy is global and always-on. Its configuration cannot be edited unless you are a platform admin.
      </p>
    </div>
  );
}

function ConfigurationTabRuleLevel({ configSection, setConfigSection, typeKey, setTypeKey, type, setBranches,
  domain, setDomain, fn, setFn, taxonomy, description, setDescription, personas, policyName = "Untitled Policy",
  applicability, setApplicability,
  scopeBlocks, setScopeBlocks, audiences, parameters = [],
  scopeOrGate = false, setScopeOrGate,
  branches, addElseIf, removeBranch, updateBranch,
  priority, setPriority, mandatory, coPolicies, isGlobal, setIsGlobal, readOnly = false, engine = "hiring", dataSources = DATA_SOURCES, triggers = TRIGGERS }) {
  const controlledActionOptions = getControlledActionOptionsForEngine(fn, engine);

  function changeDomain(nextDomain) {
    const nextFn = taxonomy[nextDomain][0];
    setDomain(nextDomain);
    changeFn(nextFn);
  }

  function changeFn(nextFn) {
    setFn(nextFn);
    const options = getControlledActionOptionsForEngine(nextFn, engine);
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
    <div className="flex min-h-0 flex-1 items-stretch overflow-hidden">
      <div className="w-52 shrink-0 self-stretch overflow-y-auto border-r bg-background py-4">
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
        <FieldHintProvider hintAsTooltip>
        {configSection === "general" && (
          <SectionCard title="General" subtitle="General settings for the policy" icon={FileText}>
            {readOnly && <PolicyConfigReadOnlyNotice />}
            <GlobalAlwaysOnBanner isGlobal={isGlobal} setIsGlobal={setIsGlobal} mandatory={mandatory} />

            <div className={cn("space-y-5", readOnly && "pointer-events-none select-none opacity-60")}>
            <Field label="Policy type">
              <div className="grid grid-cols-4 gap-2">
                {POLICY_TYPES.map((t) => {
                  const Icon = t.icon;
                  const active = typeKey === t.key;
                  return (
                    <button key={t.key} onClick={() => { setTypeKey(t.key); setBranches([
                      createBranch(t, { kind: "IF" }),
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

            <PriorityConfigField priority={priority} setPriority={setPriority} mandatory={mandatory} />
            </div>
          </SectionCard>
        )}

        {configSection === "scope" && (
          <SectionCard
            title="Scope"
            subtitle="Audience groups and custom conditions"
            icon={MapPin}
          >
            {readOnly && <PolicyConfigReadOnlyNotice />}
            <div className={cn(readOnly && "pointer-events-none select-none opacity-60")}>
            <ScopeBuilder
              scopeBlocks={scopeBlocks}
              setScopeBlocks={setScopeBlocks}
              audiences={audiences}
              groupOrGate={scopeOrGate}
              setGroupOrGate={setScopeOrGate}
              allowGroupOrGate
            />
            </div>
          </SectionCard>
        )}

        {configSection === "rules" && (
          <SectionCard title="Rules" subtitle={`Conditions and outcomes per branch · ${typeKey}`} icon={GitBranch}>
            {readOnly && <PolicyConfigReadOnlyNotice />}
            <div className={cn("space-y-0", readOnly && "pointer-events-none select-none opacity-60")}>
            {branches.map((b, bi) => (
              <div key={b.id}>
                <div className="overflow-hidden rounded-lg border">
                  <RuleBranchHeader
                    ruleNumber={bi + 1}
                    kind={b.kind}
                    onRemove={() => removeBranch(b.id)}
                  />
                  <div className="space-y-3.5 p-3.5">
                    <RuleBranchTriggerField
                      trigger={b.trigger}
                      onChange={(v) => updateBranch(b.id, { trigger: v })}
                      triggers={triggers}
                    />
                    {b.kind !== "ELSE" && (
                      <ConditionGroupBuilder
                        groups={b.groups}
                        setGroups={(g) => updateBranch(b.id, { groups: g })}
                        orGate={b.orGate}
                        setOrGate={(v) => updateBranch(b.id, { orGate: v })}
                        parameters={parameters}
                        allowParameters
                        dataSources={dataSources}
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
            <Button variant="outline" className="w-full border-dashed" onClick={addElseIf} disabled={readOnly}>
              <Plus className="h-3.5 w-3.5" /> Add ELSE IF branch
            </Button>
            </div>
          </SectionCard>
        )}

        {configSection === "summary" && (
          <SectionCard title="Summary" subtitle="What this policy will do once published" icon={FileText}>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="mb-1 block text-xs text-muted-foreground">Type</span><Badge variant="outline">{typeKey}</Badge></div>
              <div><span className="mb-1 block text-xs text-muted-foreground">Product</span><span>{domain} <ChevronRight className="inline h-3 w-3 opacity-50" /> {fn}</span></div>
              <ConflictResolutionSummary priority={priority} mandatory={mandatory} coPolicies={coPolicies} />
              <div><span className="mb-1 block text-xs text-muted-foreground">Personas</span>
                {personas.length ? <div className="flex flex-wrap gap-1">{personas.map((p) => <Badge key={p} variant="outline">{p}</Badge>)}</div> : <span className="text-xs text-muted-foreground">Not set — derived at outcome level</span>}
              </div>
              <div className="col-span-2"><span className="mb-1 block text-xs text-muted-foreground">Scope</span>
                <ScopeSummary scopeBlocks={scopeBlocks} applicability={applicability} groupsOnly groupOrGate={scopeOrGate} />
              </div>
            </div>
            <Separator />
            <div>
              <span className="mb-2 block text-xs text-muted-foreground">Branches ({branches.length})</span>
              <div className="space-y-2.5">
                {branches.map((b, bi) => (
                  <div key={b.id} className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Badge variant={branchVariant(b.kind)}>{b.kind}</Badge>
                      {b.trigger && <Badge variant="outline">{b.trigger}</Badge>}
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
        </FieldHintProvider>
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

function UsageTab({ policyId, policyName, policyStatus, workflows, policies }) {
  const metrics = getUsageMetrics(policyId, workflows.length);
  const conflictPreviews = policyId ? getWorkflowConflictPreviews(policyId, policies) : [];

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
    <div className="mx-auto max-w-5xl flex-1 overflow-auto px-6 py-6">
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

      {conflictPreviews.length > 0 && (
        <div className="mt-8">
          <div className="mb-3">
            <h3 className="text-sm font-semibold">Conflict preview</h3>
            <p className="text-xs text-muted-foreground">
              When multiple policies on the same workflow match, priority determines which outcome and message users see.
            </p>
          </div>
          <div className="space-y-3">
            {conflictPreviews.map(({ workflow, workflowPolicies, winner, suppressed, winnerDemo }) => (
              <Card key={workflow.id} className="overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                <CardHeader className="border-b bg-muted/20 py-4">
                  <CardTitle className="text-sm">{workflow.name}</CardTitle>
                  <CardDescription>
                    {workflowPolicies.length} policies linked — {getPolicyPriorityLabel(winner)} priority wins
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-4">
                  <div>
                    <p className="mb-2 text-xs font-medium text-muted-foreground">Matching policies (by priority)</p>
                    <div className="space-y-1.5">
                      {workflowPolicies.map((p) => (
                        <div key={p.id} className={cn(
                          "flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-sm",
                          p.id === winner.id ? "border-emerald-200 bg-emerald-50/50" : "bg-muted/20",
                        )}>
                          <span className="font-medium">{p.name}</span>
                          <PriorityBadge policy={p} />
                          {p.id === winner.id ? (
                            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">Wins</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">Suppressed when higher priority matches</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <div className="rounded-lg border bg-background px-3 py-2.5">
                    <p className="text-xs text-muted-foreground">Resolved outcome</p>
                    <p className="mt-1 text-sm font-medium">{winnerDemo.outcome}</p>
                    <p className="mt-1 text-xs italic text-muted-foreground">"{winnerDemo.message}"</p>
                  </div>
                  {suppressed.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Suppressed messages from: {suppressed.map((p) => p.name).join(", ")}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
