import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  json,
  index,
} from "drizzle-orm/mysql-core";

// ─────────────────────────────────────────────────────────────────────────────
// TABLES ORGANISATIONNELLES
// ─────────────────────────────────────────────────────────────────────────────

export const organizations = mysqlTable("organizations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  plan: mysqlEnum("plan", ["starter", "pro", "enterprise"]).default("starter").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  orgId: int("orgId"),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["owner", "analyst", "client", "viewer", "admin", "user"]).default("analyst").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  orgId: int("orgId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  sectorCode: varchar("sectorCode", { length: 50 }),
  sectorLabel: varchar("sectorLabel", { length: 100 }),
  status: mysqlEnum("status", ["draft", "active", "completed", "archived"]).default("draft").notNull(),
  description: text("description"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => [
  index("idx_projects_orgId").on(t.orgId),
]);

export const projectMembers = mysqlTable("project_members", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["owner", "analyst", "client", "viewer"]).default("viewer").notNull(),
  invitedAt: timestamp("invitedAt").defaultNow().notNull(),
}, (t) => [
  index("idx_pm_projectId").on(t.projectId),
  index("idx_pm_userId").on(t.userId),
]);

export const auditLog = mysqlTable("audit_log", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId"),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  entity: varchar("entity", { length: 100 }),
  entityId: int("entityId"),
  diffJson: json("diffJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
  index("idx_audit_projectId").on(t.projectId),
]);

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 1 — DONNÉES HISTORIQUES
// ─────────────────────────────────────────────────────────────────────────────

export const historicalPeriods = mysqlTable("historical_periods", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  year: int("year").notNull(),
  mode: mysqlEnum("mode", ["rapide", "structure", "expert"]).default("rapide").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => [
  index("idx_hp_projectId").on(t.projectId),
]);

export const incomeStatement = mysqlTable("income_statement", {
  id: int("id").autoincrement().primaryKey(),
  periodId: int("periodId").notNull(),
  revenue: decimal("revenue", { precision: 18, scale: 2 }),
  revenueGrowthPct: decimal("revenueGrowthPct", { precision: 8, scale: 4 }),
  costOfGoods: decimal("costOfGoods", { precision: 18, scale: 2 }),
  grossMargin: decimal("grossMargin", { precision: 18, scale: 2 }),
  grossMarginPct: decimal("grossMarginPct", { precision: 8, scale: 4 }),
  personnelCosts: decimal("personnelCosts", { precision: 18, scale: 2 }),
  otherOpex: decimal("otherOpex", { precision: 18, scale: 2 }),
  ebitda: decimal("ebitda", { precision: 18, scale: 2 }),
  ebitdaPct: decimal("ebitdaPct", { precision: 8, scale: 4 }),
  depreciation: decimal("depreciation", { precision: 18, scale: 2 }),
  ebit: decimal("ebit", { precision: 18, scale: 2 }),
  financialResult: decimal("financialResult", { precision: 18, scale: 2 }),
  tax: decimal("tax", { precision: 18, scale: 2 }),
  netIncome: decimal("netIncome", { precision: 18, scale: 2 }),
  segmentsJson: json("segmentsJson"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => [
  index("idx_is_periodId").on(t.periodId),
]);

export const balanceSheet = mysqlTable("balance_sheet", {
  id: int("id").autoincrement().primaryKey(),
  periodId: int("periodId").notNull(),
  fixedAssets: decimal("fixedAssets", { precision: 18, scale: 2 }),
  intangibleAssets: decimal("intangibleAssets", { precision: 18, scale: 2 }),
  financialAssets: decimal("financialAssets", { precision: 18, scale: 2 }),
  inventory: decimal("inventory", { precision: 18, scale: 2 }),
  receivables: decimal("receivables", { precision: 18, scale: 2 }),
  cash: decimal("cash", { precision: 18, scale: 2 }),
  totalAssets: decimal("totalAssets", { precision: 18, scale: 2 }),
  equity: decimal("equity", { precision: 18, scale: 2 }),
  financialDebtLt: decimal("financialDebtLt", { precision: 18, scale: 2 }),
  financialDebtSt: decimal("financialDebtSt", { precision: 18, scale: 2 }),
  payables: decimal("payables", { precision: 18, scale: 2 }),
  otherLiabilities: decimal("otherLiabilities", { precision: 18, scale: 2 }),
  netFinancialDebt: decimal("netFinancialDebt", { precision: 18, scale: 2 }),
  workingCapitalRequirement: decimal("workingCapitalRequirement", { precision: 18, scale: 2 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => [
  index("idx_bs_periodId").on(t.periodId),
]);

export const cashFlow = mysqlTable("cash_flow", {
  id: int("id").autoincrement().primaryKey(),
  periodId: int("periodId").notNull(),
  operatingCf: decimal("operatingCf", { precision: 18, scale: 2 }),
  capexMaintenance: decimal("capexMaintenance", { precision: 18, scale: 2 }),
  capexGrowth: decimal("capexGrowth", { precision: 18, scale: 2 }),
  freeCashFlow: decimal("freeCashFlow", { precision: 18, scale: 2 }),
  wcrVariation: decimal("wcrVariation", { precision: 18, scale: 2 }),
  debtRepayment: decimal("debtRepayment", { precision: 18, scale: 2 }),
  dividends: decimal("dividends", { precision: 18, scale: 2 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => [
  index("idx_cf_periodId").on(t.periodId),
]);

export const operationalKpis = mysqlTable("operational_kpis", {
  id: int("id").autoincrement().primaryKey(),
  periodId: int("periodId").notNull(),
  headcountFte: int("headcountFte"),
  revenuePerFte: decimal("revenuePerFte", { precision: 18, scale: 2 }),
  clientCount: int("clientCount"),
  top5ClientConcentrationPct: decimal("top5ClientConcentrationPct", { precision: 8, scale: 4 }),
  churnRatePct: decimal("churnRatePct", { precision: 8, scale: 4 }),
  recurringRevenuePct: decimal("recurringRevenuePct", { precision: 8, scale: 4 }),
  orderBacklog: decimal("orderBacklog", { precision: 18, scale: 2 }),
  npsScore: int("npsScore"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => [
  index("idx_kpi_periodId").on(t.periodId),
]);

export const restatements = mysqlTable("restatements", {
  id: int("id").autoincrement().primaryKey(),
  periodId: int("periodId").notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 18, scale: 2 }),
  justification: text("justification"),
  impactOnEbitda: decimal("impactOnEbitda", { precision: 18, scale: 2 }),
  impactOnDebt: decimal("impactOnDebt", { precision: 18, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
  index("idx_rest_periodId").on(t.periodId),
]);

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 2 — STRATÉGIE & LEVIERS
// ─────────────────────────────────────────────────────────────────────────────

export const strategicOrientations = mysqlTable("strategic_orientations", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  priority: mysqlEnum("priority", ["high", "medium", "low"]).default("medium").notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => [
  index("idx_so_projectId").on(t.projectId),
]);

export const strategicAxes = mysqlTable("strategic_axes", {
  id: int("id").autoincrement().primaryKey(),
  orientationId: int("orientationId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => [
  index("idx_sa_orientationId").on(t.orientationId),
]);

export const strategicObjectives = mysqlTable("strategic_objectives", {
  id: int("id").autoincrement().primaryKey(),
  axisId: int("axisId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  kpiName: varchar("kpiName", { length: 100 }),
  kpiCurrent: decimal("kpiCurrent", { precision: 18, scale: 4 }),
  kpiTarget: decimal("kpiTarget", { precision: 18, scale: 4 }),
  horizonMonths: int("horizonMonths"),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => [
  index("idx_sobj_axisId").on(t.axisId),
]);

export const strategicLevers = mysqlTable("strategic_levers", {
  id: int("id").autoincrement().primaryKey(),
  objectiveId: int("objectiveId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  revenueImpactPct: decimal("revenueImpactPct", { precision: 8, scale: 4 }),
  revenueImpactAmount: decimal("revenueImpactAmount", { precision: 18, scale: 2 }),
  ebitdaImpactPct: decimal("ebitdaImpactPct", { precision: 8, scale: 4 }),
  ebitdaImpactAmount: decimal("ebitdaImpactAmount", { precision: 18, scale: 2 }),
  wcrImpactDays: int("wcrImpactDays"),
  capexRequired: decimal("capexRequired", { precision: 18, scale: 2 }),
  riskReductionScore: int("riskReductionScore"),
  probabilityPct: decimal("probabilityPct", { precision: 8, scale: 4 }),
  horizonT1: decimal("horizonT1", { precision: 8, scale: 4 }),
  horizonT2: decimal("horizonT2", { precision: 8, scale: 4 }),
  horizonT3: decimal("horizonT3", { precision: 8, scale: 4 }),
  status: mysqlEnum("status", ["identified", "validated", "in_progress", "done"]).default("identified").notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => [
  index("idx_sl_objectiveId").on(t.objectiveId),
]);

export const leverValuationImpact = mysqlTable("lever_valuation_impact", {
  id: int("id").autoincrement().primaryKey(),
  leverId: int("leverId").notNull(),
  method: varchar("method", { length: 50 }).notNull(),
  evDeltaLow: decimal("evDeltaLow", { precision: 18, scale: 2 }),
  evDeltaMid: decimal("evDeltaMid", { precision: 18, scale: 2 }),
  evDeltaHigh: decimal("evDeltaHigh", { precision: 18, scale: 2 }),
  calculationDetailJson: json("calculationDetailJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
  index("idx_lvi_leverId").on(t.leverId),
]);

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 3 — BUSINESS PLAN
// ─────────────────────────────────────────────────────────────────────────────

export const businessPlans = mysqlTable("business_plans", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  mode: mysqlEnum("mode", ["rapide", "structure", "expert"]).default("rapide").notNull(),
  horizonYears: int("horizonYears").default(3).notNull(),
  baseYear: int("baseYear").notNull(),
  label: varchar("label", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => [
  index("idx_bp_projectId").on(t.projectId),
]);

export const bpAssumptions = mysqlTable("bp_assumptions", {
  id: int("id").autoincrement().primaryKey(),
  bpId: int("bpId").notNull(),
  year: int("year").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  value: decimal("value", { precision: 18, scale: 4 }),
  unit: varchar("unit", { length: 50 }),
  source: mysqlEnum("source", ["manual", "lever", "historical"]).default("manual").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => [
  index("idx_bpa_bpId").on(t.bpId),
]);

export const bpProjections = mysqlTable("bp_projections", {
  id: int("id").autoincrement().primaryKey(),
  bpId: int("bpId").notNull(),
  year: int("year").notNull(),
  scenario: mysqlEnum("scenario", ["base", "high", "low"]).default("base").notNull(),
  revenue: decimal("revenue", { precision: 18, scale: 2 }),
  grossMargin: decimal("grossMargin", { precision: 18, scale: 2 }),
  ebitda: decimal("ebitda", { precision: 18, scale: 2 }),
  ebit: decimal("ebit", { precision: 18, scale: 2 }),
  netIncome: decimal("netIncome", { precision: 18, scale: 2 }),
  netFinancialDebt: decimal("netFinancialDebt", { precision: 18, scale: 2 }),
  equity: decimal("equity", { precision: 18, scale: 2 }),
  wcr: decimal("wcr", { precision: 18, scale: 2 }),
  freeCashFlow: decimal("freeCashFlow", { precision: 18, scale: 2 }),
  capex: decimal("capex", { precision: 18, scale: 2 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => [
  index("idx_bpp_bpId").on(t.bpId),
]);

export const bpSensitivity = mysqlTable("bp_sensitivity", {
  id: int("id").autoincrement().primaryKey(),
  bpId: int("bpId").notNull(),
  variable: varchar("variable", { length: 100 }).notNull(),
  deltaPct: decimal("deltaPct", { precision: 8, scale: 4 }).notNull(),
  evImpactLow: decimal("evImpactLow", { precision: 18, scale: 2 }),
  evImpactMid: decimal("evImpactMid", { precision: 18, scale: 2 }),
  evImpactHigh: decimal("evImpactHigh", { precision: 18, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
  index("idx_bps_bpId").on(t.bpId),
]);

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 4 — VALORISATION
// ─────────────────────────────────────────────────────────────────────────────

export const valuationRuns = mysqlTable("valuation_runs", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  bpId: int("bpId"),
  createdBy: int("createdBy").notNull(),
  label: varchar("label", { length: 255 }),
  status: mysqlEnum("status", ["draft", "final"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => [
  index("idx_vr_projectId").on(t.projectId),
]);

export const valuationParams = mysqlTable("valuation_params", {
  id: int("id").autoincrement().primaryKey(),
  runId: int("runId").notNull(),
  method: varchar("method", { length: 50 }).notNull(),
  paramsJson: json("paramsJson").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => [
  index("idx_vp_runId").on(t.runId),
]);

export const valuationResults = mysqlTable("valuation_results", {
  id: int("id").autoincrement().primaryKey(),
  runId: int("runId").notNull(),
  method: varchar("method", { length: 50 }).notNull(),
  evLow: decimal("evLow", { precision: 18, scale: 2 }),
  evMid: decimal("evMid", { precision: 18, scale: 2 }),
  evHigh: decimal("evHigh", { precision: 18, scale: 2 }),
  equityValueLow: decimal("equityValueLow", { precision: 18, scale: 2 }),
  equityValueMid: decimal("equityValueMid", { precision: 18, scale: 2 }),
  equityValueHigh: decimal("equityValueHigh", { precision: 18, scale: 2 }),
  multipleUsed: decimal("multipleUsed", { precision: 8, scale: 4 }),
  weightPct: decimal("weightPct", { precision: 8, scale: 4 }),
  narrativeAi: text("narrativeAi"),
  calculatedAt: timestamp("calculatedAt").defaultNow().notNull(),
}, (t) => [
  index("idx_vres_runId").on(t.runId),
]);

export const sectorMultiples = mysqlTable("sector_multiples", {
  id: int("id").autoincrement().primaryKey(),
  sectorCode: varchar("sectorCode", { length: 50 }).notNull(),
  sectorLabel: varchar("sectorLabel", { length: 100 }).notNull(),
  year: int("year").notNull(),
  evEbitdaP25: decimal("evEbitdaP25", { precision: 8, scale: 4 }),
  evEbitdaMedian: decimal("evEbitdaMedian", { precision: 8, scale: 4 }),
  evEbitdaP75: decimal("evEbitdaP75", { precision: 8, scale: 4 }),
  evRevenueP25: decimal("evRevenueP25", { precision: 8, scale: 4 }),
  evRevenueMedian: decimal("evRevenueMedian", { precision: 8, scale: 4 }),
  evRevenueP75: decimal("evRevenueP75", { precision: 8, scale: 4 }),
  source: varchar("source", { length: 100 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const comparableTransactions = mysqlTable("comparable_transactions", {
  id: int("id").autoincrement().primaryKey(),
  sectorCode: varchar("sectorCode", { length: 50 }).notNull(),
  year: int("year").notNull(),
  targetName: varchar("targetName", { length: 255 }).notNull(),
  evAmount: decimal("evAmount", { precision: 18, scale: 2 }),
  revenue: decimal("revenue", { precision: 18, scale: 2 }),
  ebitda: decimal("ebitda", { precision: 18, scale: 2 }),
  evEbitdaMultiple: decimal("evEbitdaMultiple", { precision: 8, scale: 4 }),
  evRevenueMultiple: decimal("evRevenueMultiple", { precision: 8, scale: 4 }),
  source: varchar("source", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 5 — SIMULATION INVERSE
// ─────────────────────────────────────────────────────────────────────────────

export const simulations = mysqlTable("simulations", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  runId: int("runId"),
  label: varchar("label", { length: 255 }),
  targetEv: decimal("targetEv", { precision: 18, scale: 2 }).notNull(),
  currentEv: decimal("currentEv", { precision: 18, scale: 2 }),
  gapToFill: decimal("gapToFill", { precision: 18, scale: 2 }),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => [
  index("idx_sim_projectId").on(t.projectId),
]);

export const simulationLevers = mysqlTable("simulation_levers", {
  id: int("id").autoincrement().primaryKey(),
  simulationId: int("simulationId").notNull(),
  leverType: mysqlEnum("leverType", ["ebitda_improvement", "debt_reduction", "multiple_expansion", "revenue_growth"]).notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  currentValue: decimal("currentValue", { precision: 18, scale: 4 }),
  targetValue: decimal("targetValue", { precision: 18, scale: 4 }),
  evImpact: decimal("evImpact", { precision: 18, scale: 2 }),
  isActive: boolean("isActive").default(false).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => [
  index("idx_simlev_simulationId").on(t.simulationId),
]);

export const simulationScenarios = mysqlTable("simulation_scenarios", {
  id: int("id").autoincrement().primaryKey(),
  simulationId: int("simulationId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  activeLeversJson: json("activeLeversJson"),
  resultingEv: decimal("resultingEv", { precision: 18, scale: 2 }),
  probabilityPct: decimal("probabilityPct", { precision: 8, scale: 4 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
  index("idx_simscen_simulationId").on(t.simulationId),
]);

// ─────────────────────────────────────────────────────────────────────────────
// TYPES EXPORTÉS
// ─────────────────────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Organization = typeof organizations.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;
export type ProjectMember = typeof projectMembers.$inferSelect;
export type HistoricalPeriod = typeof historicalPeriods.$inferSelect;
export type IncomeStatement = typeof incomeStatement.$inferSelect;
export type BalanceSheet = typeof balanceSheet.$inferSelect;
export type CashFlow = typeof cashFlow.$inferSelect;
export type OperationalKpis = typeof operationalKpis.$inferSelect;
export type Restatement = typeof restatements.$inferSelect;
export type StrategicOrientation = typeof strategicOrientations.$inferSelect;
export type StrategicAxis = typeof strategicAxes.$inferSelect;
export type StrategicObjective = typeof strategicObjectives.$inferSelect;
export type StrategicLever = typeof strategicLevers.$inferSelect;
export type BusinessPlan = typeof businessPlans.$inferSelect;
export type BpProjection = typeof bpProjections.$inferSelect;
export type ValuationRun = typeof valuationRuns.$inferSelect;
export type ValuationResult = typeof valuationResults.$inferSelect;
export type Simulation = typeof simulations.$inferSelect;
export type SimulationLever = typeof simulationLevers.$inferSelect;
