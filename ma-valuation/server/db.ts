import { and, eq, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  users, organizations, projects, projectMembers, auditLog,
  historicalPeriods, incomeStatement, balanceSheet, cashFlow, operationalKpis, restatements,
  strategicOrientations, strategicAxes, strategicObjectives, strategicLevers, leverValuationImpact,
  businessPlans, bpAssumptions, bpProjections, bpSensitivity,
  valuationRuns, valuationParams, valuationResults, sectorMultiples, comparableTransactions,
  simulations, simulationLevers, simulationScenarios,
  type InsertUser, type InsertProject,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── USERS ───────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach((field) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  });

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }

  const isOwner = user.openId === ENV.ownerOpenId;
  if (isOwner) {
    values.role = "owner";
    updateSet.role = "owner";
  } else if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

// ─── ORGANIZATIONS ────────────────────────────────────────────────────────────

export async function getOrCreateOrganization(ownerOpenId: string, name: string) {
  const db = await getDb();
  if (!db) return null;

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const existing = await db.select().from(organizations).where(eq(organizations.slug, slug)).limit(1);
  if (existing[0]) return existing[0];

  await db.insert(organizations).values({ name, slug, plan: "pro" });
  const created = await db.select().from(organizations).where(eq(organizations.slug, slug)).limit(1);
  return created[0] ?? null;
}

export async function getOrganizationById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1);
  return result[0] ?? null;
}

// ─── PROJECTS ─────────────────────────────────────────────────────────────────

export async function getProjectsByOrg(orgId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projects).where(eq(projects.orgId, orgId)).orderBy(desc(projects.updatedAt));
}

export async function getProjectById(id: number, orgId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(projects)
    .where(and(eq(projects.id, id), eq(projects.orgId, orgId))).limit(1);
  return result[0] ?? null;
}

export async function createProject(data: InsertProject) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(projects).values(data);
  return result[0];
}

export async function updateProject(id: number, orgId: number, data: Partial<InsertProject>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(projects).set(data).where(and(eq(projects.id, id), eq(projects.orgId, orgId)));
}

export async function deleteProject(id: number, orgId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(projects).where(and(eq(projects.id, id), eq(projects.orgId, orgId)));
}

// ─── PROJECT MEMBERS ──────────────────────────────────────────────────────────

export async function getProjectMembers(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projectMembers).where(eq(projectMembers.projectId, projectId));
}

export async function addProjectMember(projectId: number, userId: number, role: "owner" | "analyst" | "client" | "viewer") {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(projectMembers).values({ projectId, userId, role });
}

// ─── HISTORICAL PERIODS ───────────────────────────────────────────────────────

export async function getHistoricalPeriods(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(historicalPeriods)
    .where(eq(historicalPeriods.projectId, projectId))
    .orderBy(asc(historicalPeriods.year));
}

export async function upsertHistoricalPeriod(projectId: number, year: number, mode: "rapide" | "structure" | "expert") {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const existing = await db.select().from(historicalPeriods)
    .where(and(eq(historicalPeriods.projectId, projectId), eq(historicalPeriods.year, year))).limit(1);
  if (existing[0]) {
    await db.update(historicalPeriods).set({ mode }).where(eq(historicalPeriods.id, existing[0].id));
    return existing[0].id;
  }
  const result = await db.insert(historicalPeriods).values({ projectId, year, mode });
  return (result as any).insertId as number;
}

export async function getIncomeStatement(periodId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(incomeStatement).where(eq(incomeStatement.periodId, periodId)).limit(1);
  return result[0] ?? null;
}

export async function upsertIncomeStatement(periodId: number, data: Record<string, unknown>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const existing = await db.select().from(incomeStatement).where(eq(incomeStatement.periodId, periodId)).limit(1);
  if (existing[0]) {
    await db.update(incomeStatement).set(data as any).where(eq(incomeStatement.id, existing[0].id));
  } else {
    await db.insert(incomeStatement).values({ periodId, ...data } as any);
  }
}

export async function getBalanceSheet(periodId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(balanceSheet).where(eq(balanceSheet.periodId, periodId)).limit(1);
  return result[0] ?? null;
}

export async function upsertBalanceSheet(periodId: number, data: Record<string, unknown>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const existing = await db.select().from(balanceSheet).where(eq(balanceSheet.periodId, periodId)).limit(1);
  if (existing[0]) {
    await db.update(balanceSheet).set(data as any).where(eq(balanceSheet.id, existing[0].id));
  } else {
    await db.insert(balanceSheet).values({ periodId, ...data } as any);
  }
}

export async function getCashFlow(periodId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(cashFlow).where(eq(cashFlow.periodId, periodId)).limit(1);
  return result[0] ?? null;
}

export async function upsertCashFlow(periodId: number, data: Record<string, unknown>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const existing = await db.select().from(cashFlow).where(eq(cashFlow.periodId, periodId)).limit(1);
  if (existing[0]) {
    await db.update(cashFlow).set(data as any).where(eq(cashFlow.id, existing[0].id));
  } else {
    await db.insert(cashFlow).values({ periodId, ...data } as any);
  }
}

export async function getOperationalKpis(periodId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(operationalKpis).where(eq(operationalKpis.periodId, periodId)).limit(1);
  return result[0] ?? null;
}

export async function upsertOperationalKpis(periodId: number, data: Record<string, unknown>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const existing = await db.select().from(operationalKpis).where(eq(operationalKpis.periodId, periodId)).limit(1);
  if (existing[0]) {
    await db.update(operationalKpis).set(data as any).where(eq(operationalKpis.id, existing[0].id));
  } else {
    await db.insert(operationalKpis).values({ periodId, ...data } as any);
  }
}

export async function getRestatements(periodId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(restatements).where(eq(restatements.periodId, periodId));
}

export async function createRestatement(data: typeof restatements.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(restatements).values(data);
}

export async function deleteRestatement(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(restatements).where(eq(restatements.id, id));
}

// ─── STRATEGIC ORIENTATIONS ───────────────────────────────────────────────────

export async function getStrategicOrientations(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(strategicOrientations)
    .where(eq(strategicOrientations.projectId, projectId))
    .orderBy(asc(strategicOrientations.sortOrder));
}

export async function createStrategicOrientation(data: typeof strategicOrientations.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(strategicOrientations).values(data);
  return (result as any).insertId as number;
}

export async function updateStrategicOrientation(id: number, data: Partial<typeof strategicOrientations.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(strategicOrientations).set(data as any).where(eq(strategicOrientations.id, id));
}

export async function deleteStrategicOrientation(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(strategicOrientations).where(eq(strategicOrientations.id, id));
}

export async function getStrategicAxes(orientationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(strategicAxes)
    .where(eq(strategicAxes.orientationId, orientationId))
    .orderBy(asc(strategicAxes.sortOrder));
}

export async function createStrategicAxis(data: typeof strategicAxes.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(strategicAxes).values(data);
  return (result as any).insertId as number;
}

export async function getStrategicObjectives(axisId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(strategicObjectives)
    .where(eq(strategicObjectives.axisId, axisId))
    .orderBy(asc(strategicObjectives.sortOrder));
}

export async function createStrategicObjective(data: typeof strategicObjectives.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(strategicObjectives).values(data);
  return (result as any).insertId as number;
}

export async function getStrategicLevers(objectiveId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(strategicLevers)
    .where(eq(strategicLevers.objectiveId, objectiveId))
    .orderBy(asc(strategicLevers.sortOrder));
}

export async function createStrategicLever(data: typeof strategicLevers.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(strategicLevers).values(data);
  return (result as any).insertId as number;
}

export async function updateStrategicLever(id: number, data: Partial<typeof strategicLevers.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(strategicLevers).set(data as any).where(eq(strategicLevers.id, id));
}

export async function deleteStrategicLever(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(strategicLevers).where(eq(strategicLevers.id, id));
}

// ─── BUSINESS PLANS ───────────────────────────────────────────────────────────

export async function getBusinessPlans(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(businessPlans).where(eq(businessPlans.projectId, projectId)).orderBy(desc(businessPlans.createdAt));
}

export async function getBusinessPlanById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(businessPlans).where(eq(businessPlans.id, id)).limit(1);
  return result[0] ?? null;
}

export async function createBusinessPlan(data: typeof businessPlans.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(businessPlans).values(data);
  return (result as any).insertId as number;
}

export async function getBpProjections(bpId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bpProjections).where(eq(bpProjections.bpId, bpId)).orderBy(asc(bpProjections.year));
}

export async function upsertBpProjection(bpId: number, year: number, scenario: "base" | "high" | "low", data: Record<string, unknown>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const existing = await db.select().from(bpProjections)
    .where(and(eq(bpProjections.bpId, bpId), eq(bpProjections.year, year), eq(bpProjections.scenario, scenario))).limit(1);
  if (existing[0]) {
    await db.update(bpProjections).set(data as any).where(eq(bpProjections.id, existing[0].id));
  } else {
    await db.insert(bpProjections).values({ bpId, year, scenario, ...data } as any);
  }
}

export async function getBpAssumptions(bpId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bpAssumptions).where(eq(bpAssumptions.bpId, bpId)).orderBy(asc(bpAssumptions.year));
}

export async function upsertBpAssumption(data: typeof bpAssumptions.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(bpAssumptions).values(data).onDuplicateKeyUpdate({ set: { value: data.value } });
}

export async function getBpSensitivity(bpId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bpSensitivity).where(eq(bpSensitivity.bpId, bpId));
}

// ─── VALUATION RUNS ───────────────────────────────────────────────────────────

export async function getValuationRuns(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(valuationRuns).where(eq(valuationRuns.projectId, projectId)).orderBy(desc(valuationRuns.createdAt));
}

export async function getValuationRunById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(valuationRuns).where(eq(valuationRuns.id, id)).limit(1);
  return result[0] ?? null;
}

export async function createValuationRun(data: typeof valuationRuns.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(valuationRuns).values(data);
  return (result as any).insertId as number;
}

export async function getValuationResults(runId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(valuationResults).where(eq(valuationResults.runId, runId));
}

export async function upsertValuationResult(runId: number, method: string, data: Record<string, unknown>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const existing = await db.select().from(valuationResults)
    .where(and(eq(valuationResults.runId, runId), eq(valuationResults.method, method))).limit(1);
  if (existing[0]) {
    await db.update(valuationResults).set(data as any).where(eq(valuationResults.id, existing[0].id));
  } else {
    await db.insert(valuationResults).values({ runId, method, ...data } as any);
  }
}

export async function getValuationParams(runId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(valuationParams).where(eq(valuationParams.runId, runId));
}

export async function upsertValuationParams(runId: number, method: string, paramsJson: unknown) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const existing = await db.select().from(valuationParams)
    .where(and(eq(valuationParams.runId, runId), eq(valuationParams.method, method))).limit(1);
  if (existing[0]) {
    await db.update(valuationParams).set({ paramsJson } as any).where(eq(valuationParams.id, existing[0].id));
  } else {
    await db.insert(valuationParams).values({ runId, method, paramsJson } as any);
  }
}

export async function getSectorMultiples(sectorCode: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sectorMultiples).where(eq(sectorMultiples.sectorCode, sectorCode)).orderBy(desc(sectorMultiples.year));
}

export async function getComparableTransactions(sectorCode: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(comparableTransactions)
    .where(eq(comparableTransactions.sectorCode, sectorCode))
    .orderBy(desc(comparableTransactions.year));
}

// ─── SIMULATIONS ──────────────────────────────────────────────────────────────

export async function getSimulations(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(simulations).where(eq(simulations.projectId, projectId)).orderBy(desc(simulations.createdAt));
}

export async function getSimulationById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(simulations).where(eq(simulations.id, id)).limit(1);
  return result[0] ?? null;
}

export async function createSimulation(data: typeof simulations.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(simulations).values(data);
  return (result as any).insertId as number;
}

export async function updateSimulation(id: number, data: Partial<typeof simulations.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(simulations).set(data as any).where(eq(simulations.id, id));
}

export async function getSimulationLevers(simulationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(simulationLevers)
    .where(eq(simulationLevers.simulationId, simulationId))
    .orderBy(asc(simulationLevers.sortOrder));
}

export async function upsertSimulationLever(data: typeof simulationLevers.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(simulationLevers).values(data);
}

export async function updateSimulationLever(id: number, data: Partial<typeof simulationLevers.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(simulationLevers).set(data as any).where(eq(simulationLevers.id, id));
}

export async function getSimulationScenarios(simulationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(simulationScenarios).where(eq(simulationScenarios.simulationId, simulationId));
}

export async function createSimulationScenario(data: typeof simulationScenarios.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(simulationScenarios).values(data);
  return (result as any).insertId as number;
}

// ─── AUDIT LOG ────────────────────────────────────────────────────────────────

export async function createAuditEntry(data: typeof auditLog.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLog).values(data);
}
