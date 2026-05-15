import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import * as db from "./db";

// ─── Middleware admin/owner ───────────────────────────────────────────────────

const ownerOrAnalystProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!["owner", "analyst", "admin"].includes(ctx.user.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux analystes et propriétaires." });
  }
  return next({ ctx });
});

// ─── Router organisations ─────────────────────────────────────────────────────

const orgRouter = router({
  getOrCreate: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ input }) => {
      return db.getOrCreateOrganization("owner", input.name);
    }),
  get: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.orgId) return null;
    return db.getOrganizationById(ctx.user.orgId);
  }),
});

// ─── Router projets ───────────────────────────────────────────────────────────

const projectsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const orgId = ctx.user.orgId ?? 1;
    return db.getProjectsByOrg(orgId);
  }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const orgId = ctx.user.orgId ?? 1;
      const project = await db.getProjectById(input.id, orgId);
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });
      return project;
    }),

  create: ownerOrAnalystProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      companyName: z.string().min(1).max(255),
      sectorCode: z.string().optional(),
      sectorLabel: z.string().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.user.orgId ?? 1;
      await db.createProject({
        orgId,
        name: input.name,
        companyName: input.companyName,
        sectorCode: input.sectorCode,
        sectorLabel: input.sectorLabel,
        description: input.description,
        status: "draft",
        createdBy: ctx.user.id,
      });
      await db.createAuditEntry({ userId: ctx.user.id, action: "create", entity: "project", createdAt: new Date() });
    }),

  update: ownerOrAnalystProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(255).optional(),
      companyName: z.string().min(1).max(255).optional(),
      sectorCode: z.string().optional(),
      sectorLabel: z.string().optional(),
      status: z.enum(["draft", "active", "completed", "archived"]).optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.user.orgId ?? 1;
      const { id, ...data } = input;
      await db.updateProject(id, orgId, data);
    }),

  delete: ownerOrAnalystProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.user.orgId ?? 1;
      await db.deleteProject(input.id, orgId);
    }),
});

// ─── Router Module 1 — Données Historiques ────────────────────────────────────

const historicalRouter = router({
  getPeriods: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => db.getHistoricalPeriods(input.projectId)),

  upsertPeriod: ownerOrAnalystProcedure
    .input(z.object({
      projectId: z.number(),
      year: z.number().int().min(2000).max(2030),
      mode: z.enum(["rapide", "structure", "expert"]),
    }))
    .mutation(async ({ input }) => {
      return db.upsertHistoricalPeriod(input.projectId, input.year, input.mode);
    }),

  getIncomeStatement: protectedProcedure
    .input(z.object({ periodId: z.number() }))
    .query(async ({ input }) => db.getIncomeStatement(input.periodId)),

  upsertIncomeStatement: ownerOrAnalystProcedure
    .input(z.object({
      periodId: z.number(),
      revenue: z.string().nullable().optional(),
      revenueGrowthPct: z.string().nullable().optional(),
      costOfGoods: z.string().nullable().optional(),
      grossMargin: z.string().nullable().optional(),
      grossMarginPct: z.string().nullable().optional(),
      personnelCosts: z.string().nullable().optional(),
      otherOpex: z.string().nullable().optional(),
      ebitda: z.string().nullable().optional(),
      ebitdaPct: z.string().nullable().optional(),
      depreciation: z.string().nullable().optional(),
      ebit: z.string().nullable().optional(),
      financialResult: z.string().nullable().optional(),
      tax: z.string().nullable().optional(),
      netIncome: z.string().nullable().optional(),
    }))
    .mutation(async ({ input }) => {
      const { periodId, ...data } = input;
      await db.upsertIncomeStatement(periodId, data);
    }),

  getBalanceSheet: protectedProcedure
    .input(z.object({ periodId: z.number() }))
    .query(async ({ input }) => db.getBalanceSheet(input.periodId)),

  upsertBalanceSheet: ownerOrAnalystProcedure
    .input(z.object({
      periodId: z.number(),
      fixedAssets: z.string().nullable().optional(),
      intangibleAssets: z.string().nullable().optional(),
      financialAssets: z.string().nullable().optional(),
      inventory: z.string().nullable().optional(),
      receivables: z.string().nullable().optional(),
      cash: z.string().nullable().optional(),
      totalAssets: z.string().nullable().optional(),
      equity: z.string().nullable().optional(),
      financialDebtLt: z.string().nullable().optional(),
      financialDebtSt: z.string().nullable().optional(),
      payables: z.string().nullable().optional(),
      otherLiabilities: z.string().nullable().optional(),
      netFinancialDebt: z.string().nullable().optional(),
      workingCapitalRequirement: z.string().nullable().optional(),
    }))
    .mutation(async ({ input }) => {
      const { periodId, ...data } = input;
      await db.upsertBalanceSheet(periodId, data);
    }),

  getCashFlow: protectedProcedure
    .input(z.object({ periodId: z.number() }))
    .query(async ({ input }) => db.getCashFlow(input.periodId)),

  upsertCashFlow: ownerOrAnalystProcedure
    .input(z.object({
      periodId: z.number(),
      operatingCf: z.string().nullable().optional(),
      capexMaintenance: z.string().nullable().optional(),
      capexGrowth: z.string().nullable().optional(),
      freeCashFlow: z.string().nullable().optional(),
      wcrVariation: z.string().nullable().optional(),
      debtRepayment: z.string().nullable().optional(),
      dividends: z.string().nullable().optional(),
    }))
    .mutation(async ({ input }) => {
      const { periodId, ...data } = input;
      await db.upsertCashFlow(periodId, data);
    }),

  getKpis: protectedProcedure
    .input(z.object({ periodId: z.number() }))
    .query(async ({ input }) => db.getOperationalKpis(input.periodId)),

  upsertKpis: ownerOrAnalystProcedure
    .input(z.object({
      periodId: z.number(),
      headcountFte: z.number().nullable().optional(),
      revenuePerFte: z.string().nullable().optional(),
      clientCount: z.number().nullable().optional(),
      top5ClientConcentrationPct: z.string().nullable().optional(),
      churnRatePct: z.string().nullable().optional(),
      recurringRevenuePct: z.string().nullable().optional(),
      orderBacklog: z.string().nullable().optional(),
      npsScore: z.number().nullable().optional(),
    }))
    .mutation(async ({ input }) => {
      const { periodId, ...data } = input;
      await db.upsertOperationalKpis(periodId, data);
    }),

  getRestatements: protectedProcedure
    .input(z.object({ periodId: z.number() }))
    .query(async ({ input }) => db.getRestatements(input.periodId)),

  createRestatement: ownerOrAnalystProcedure
    .input(z.object({
      periodId: z.number(),
      type: z.string(),
      label: z.string(),
      amount: z.string().nullable().optional(),
      justification: z.string().optional(),
      impactOnEbitda: z.string().nullable().optional(),
      impactOnDebt: z.string().nullable().optional(),
    }))
    .mutation(async ({ input }) => {
      await db.createRestatement(input as any);
    }),

  deleteRestatement: ownerOrAnalystProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => db.deleteRestatement(input.id)),

  analyzeWithAI: ownerOrAnalystProcedure
    .input(z.object({
      projectId: z.number(),
      periodId: z.number(),
      sectorCode: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const [is, bs, cf, kpis] = await Promise.all([
        db.getIncomeStatement(input.periodId),
        db.getBalanceSheet(input.periodId),
        db.getCashFlow(input.periodId),
        db.getOperationalKpis(input.periodId),
      ]);

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `Tu es un analyste M&A senior chez un cabinet de conseil de premier rang (McKinsey, BCG, Roland Berger). Tu analyses des données financières historiques d'entreprises en vue d'une transaction. Ton analyse est factuelle, dense, et orientée valorisation. Tu identifies les tendances, les anomalies, les points de vigilance et les leviers de valeur. Tu réponds en français, en paragraphes denses, sans bullet points superflus.`,
          },
          {
            role: "user",
            content: `Analyse ces données financières historiques pour le secteur ${input.sectorCode ?? "non spécifié"} :

Compte de résultat : ${JSON.stringify(is)}
Bilan : ${JSON.stringify(bs)}
Flux de trésorerie : ${JSON.stringify(cf)}
KPIs opérationnels : ${JSON.stringify(kpis)}

Fournis : (1) analyse des tendances clés, (2) ratios critiques et leur interprétation sectorielle, (3) points de vigilance pour la valorisation, (4) leviers d'amélioration identifiés.`,
          },
        ],
      });

      const rawContent = response.choices[0]?.message?.content;
      const analysis = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent ?? "");
      return { analysis };
    }),
});

// ─── Router Module 2 — Stratégie & Leviers ────────────────────────────────────

const strategyRouter = router({
  getOrientations: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => db.getStrategicOrientations(input.projectId)),

  createOrientation: ownerOrAnalystProcedure
    .input(z.object({
      projectId: z.number(),
      title: z.string().min(1),
      description: z.string().optional(),
      priority: z.enum(["high", "medium", "low"]).default("medium"),
    }))
    .mutation(async ({ ctx, input }) => {
      return db.createStrategicOrientation({ ...input, createdBy: ctx.user.id, sortOrder: 0 });
    }),

  updateOrientation: ownerOrAnalystProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      priority: z.enum(["high", "medium", "low"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateStrategicOrientation(id, data);
    }),

  deleteOrientation: ownerOrAnalystProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => db.deleteStrategicOrientation(input.id)),

  getAxes: protectedProcedure
    .input(z.object({ orientationId: z.number() }))
    .query(async ({ input }) => db.getStrategicAxes(input.orientationId)),

  createAxis: ownerOrAnalystProcedure
    .input(z.object({
      orientationId: z.number(),
      title: z.string().min(1),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return db.createStrategicAxis({ ...input, sortOrder: 0 });
    }),

  getObjectives: protectedProcedure
    .input(z.object({ axisId: z.number() }))
    .query(async ({ input }) => db.getStrategicObjectives(input.axisId)),

  createObjective: ownerOrAnalystProcedure
    .input(z.object({
      axisId: z.number(),
      title: z.string().min(1),
      kpiName: z.string().optional(),
      kpiCurrent: z.string().nullable().optional(),
      kpiTarget: z.string().nullable().optional(),
      horizonMonths: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      return db.createStrategicObjective({ ...input, sortOrder: 0 });
    }),

  getLevers: protectedProcedure
    .input(z.object({ objectiveId: z.number() }))
    .query(async ({ input }) => db.getStrategicLevers(input.objectiveId)),

  createLever: ownerOrAnalystProcedure
    .input(z.object({
      objectiveId: z.number(),
      title: z.string().min(1),
      description: z.string().optional(),
      revenueImpactPct: z.string().nullable().optional(),
      revenueImpactAmount: z.string().nullable().optional(),
      ebitdaImpactPct: z.string().nullable().optional(),
      ebitdaImpactAmount: z.string().nullable().optional(),
      wcrImpactDays: z.number().nullable().optional(),
      capexRequired: z.string().nullable().optional(),
      riskReductionScore: z.number().min(0).max(10).nullable().optional(),
      probabilityPct: z.string().nullable().optional(),
      horizonT1: z.string().nullable().optional(),
      horizonT2: z.string().nullable().optional(),
      horizonT3: z.string().nullable().optional(),
    }))
    .mutation(async ({ input }) => {
      return db.createStrategicLever({ ...input, status: "identified", sortOrder: 0 });
    }),

  updateLever: ownerOrAnalystProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(["identified", "validated", "in_progress", "done"]).optional(),
      revenueImpactPct: z.string().nullable().optional(),
      ebitdaImpactPct: z.string().nullable().optional(),
      ebitdaImpactAmount: z.string().nullable().optional(),
      probabilityPct: z.string().nullable().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateStrategicLever(id, data);
    }),

  deleteLever: ownerOrAnalystProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => db.deleteStrategicLever(input.id)),

  suggestLeverImpact: ownerOrAnalystProcedure
    .input(z.object({
      leverTitle: z.string(),
      leverDescription: z.string().optional(),
      sectorCode: z.string().optional(),
      currentEbitda: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `Tu es un expert en valorisation d'entreprise et en stratégie M&A. Tu estimes l'impact quantifié de leviers stratégiques sur la valorisation d'une entreprise. Tu fournis des estimations chiffrées réalistes basées sur des benchmarks sectoriels. Réponds uniquement en JSON.`,
          },
          {
            role: "user",
            content: `Estime l'impact du levier suivant sur la valorisation :
Levier : ${input.leverTitle}
Description : ${input.leverDescription ?? "N/A"}
Secteur : ${input.sectorCode ?? "non spécifié"}
EBITDA actuel : ${input.currentEbitda ? `${input.currentEbitda} k€` : "non spécifié"}

Réponds en JSON avec : { revenueImpactPct, ebitdaImpactPct, ebitdaImpactAmount, probabilityPct, horizonMonths, rationale }`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "lever_impact",
            strict: true,
            schema: {
              type: "object",
              properties: {
                revenueImpactPct: { type: "number" },
                ebitdaImpactPct: { type: "number" },
                ebitdaImpactAmount: { type: "number" },
                probabilityPct: { type: "number" },
                horizonMonths: { type: "number" },
                rationale: { type: "string" },
              },
              required: ["revenueImpactPct", "ebitdaImpactPct", "ebitdaImpactAmount", "probabilityPct", "horizonMonths", "rationale"],
              additionalProperties: false,
            },
          },
        },
      });
      const rawContent = response.choices[0]?.message?.content;
      const content = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent ?? "{}");
      return JSON.parse(content);
    }),
});

// ─── Router Module 3 — Business Plan ─────────────────────────────────────────

const businessPlanRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => db.getBusinessPlans(input.projectId)),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => db.getBusinessPlanById(input.id)),

  create: ownerOrAnalystProcedure
    .input(z.object({
      projectId: z.number(),
      mode: z.enum(["rapide", "structure", "expert"]),
      horizonYears: z.number().int().min(3).max(5),
      baseYear: z.number().int(),
      label: z.string().optional(),
    }))
    .mutation(async ({ input }) => db.createBusinessPlan(input)),

  getProjections: protectedProcedure
    .input(z.object({ bpId: z.number() }))
    .query(async ({ input }) => db.getBpProjections(input.bpId)),

  upsertProjection: ownerOrAnalystProcedure
    .input(z.object({
      bpId: z.number(),
      year: z.number().int(),
      scenario: z.enum(["base", "high", "low"]),
      revenue: z.string().nullable().optional(),
      grossMargin: z.string().nullable().optional(),
      ebitda: z.string().nullable().optional(),
      ebit: z.string().nullable().optional(),
      netIncome: z.string().nullable().optional(),
      netFinancialDebt: z.string().nullable().optional(),
      equity: z.string().nullable().optional(),
      wcr: z.string().nullable().optional(),
      freeCashFlow: z.string().nullable().optional(),
      capex: z.string().nullable().optional(),
    }))
    .mutation(async ({ input }) => {
      const { bpId, year, scenario, ...data } = input;
      await db.upsertBpProjection(bpId, year, scenario, data);
    }),

  getAssumptions: protectedProcedure
    .input(z.object({ bpId: z.number() }))
    .query(async ({ input }) => db.getBpAssumptions(input.bpId)),

  upsertAssumption: ownerOrAnalystProcedure
    .input(z.object({
      bpId: z.number(),
      year: z.number().int(),
      category: z.string(),
      label: z.string(),
      value: z.string().nullable().optional(),
      unit: z.string().optional(),
      source: z.enum(["manual", "lever", "historical"]).default("manual"),
    }))
    .mutation(async ({ input }) => db.upsertBpAssumption(input as any)),

  getSensitivity: protectedProcedure
    .input(z.object({ bpId: z.number() }))
    .query(async ({ input }) => db.getBpSensitivity(input.bpId)),

  analyzeWithAI: ownerOrAnalystProcedure
    .input(z.object({
      bpId: z.number(),
      sectorCode: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const [projections, assumptions] = await Promise.all([
        db.getBpProjections(input.bpId),
        db.getBpAssumptions(input.bpId),
      ]);

      const bpResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `Tu es un analyste M&A senior. Tu évalues la crédibilité et la robustesse d'un business plan en vue d'une transaction. Tu analyses la cohérence des hypothèses, la trajectoire de croissance, et la comparaison avec les benchmarks sectoriels. Réponds en français, en paragraphes denses.`,
          },
          {
            role: "user",
            content: `Analyse ce business plan pour le secteur ${input.sectorCode ?? "non spécifié"} :

Projections : ${JSON.stringify(projections.slice(0, 20))}
Hypothèses clés : ${JSON.stringify(assumptions.slice(0, 20))}

Évalue : (1) crédibilité de la trajectoire de croissance, (2) cohérence des marges projetées, (3) comparaison avec les benchmarks sectoriels, (4) risques et points de vigilance pour un acquéreur.`,
          },
        ],
      });

      const bpRawContent = bpResponse.choices[0]?.message?.content;
      const bpAnalysis = typeof bpRawContent === "string" ? bpRawContent : JSON.stringify(bpRawContent ?? "");
      return { analysis: bpAnalysis };
    }),
});

// ─── Router Module 4 — Valorisation ──────────────────────────────────────────

const valuationRouter = router({
  listRuns: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => db.getValuationRuns(input.projectId)),

  getRun: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => db.getValuationRunById(input.id)),

  createRun: ownerOrAnalystProcedure
    .input(z.object({
      projectId: z.number(),
      bpId: z.number().optional(),
      label: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return db.createValuationRun({ ...input, createdBy: ctx.user.id, status: "draft" });
    }),

  getResults: protectedProcedure
    .input(z.object({ runId: z.number() }))
    .query(async ({ input }) => db.getValuationResults(input.runId)),

  getParams: protectedProcedure
    .input(z.object({ runId: z.number() }))
    .query(async ({ input }) => db.getValuationParams(input.runId)),

  upsertParams: ownerOrAnalystProcedure
    .input(z.object({
      runId: z.number(),
      method: z.string(),
      paramsJson: z.unknown(),
    }))
    .mutation(async ({ input }) => {
      await db.upsertValuationParams(input.runId, input.method, input.paramsJson);
    }),

  calculate: ownerOrAnalystProcedure
    .input(z.object({
      runId: z.number(),
      projectId: z.number(),
      methods: z.array(z.object({
        method: z.enum(["ebitda_multiple", "dcf", "anr", "market_comps", "transactions", "yield", "goodwill"]),
        params: z.record(z.string(), z.unknown()),
        weight: z.number().min(0).max(100),
      })),
    }))
    .mutation(async ({ input }) => {
      const results: Array<{ method: string; evLow: number; evMid: number; evHigh: number; equityValueMid: number; multipleUsed?: number }> = [];

      for (const m of input.methods) {
        const p = m.params as Record<string, number>;
        let evLow = 0, evMid = 0, evHigh = 0, multipleUsed: number | undefined;

        switch (m.method) {
          case "ebitda_multiple": {
            const ebitda = p.ebitda ?? 0;
            const multLow = p.multipleLow ?? 5;
            const multMid = p.multipleMid ?? 7;
            const multHigh = p.multipleHigh ?? 9;
            const debt = p.netDebt ?? 0;
            evLow = ebitda * multLow;
            evMid = ebitda * multMid;
            evHigh = ebitda * multHigh;
            multipleUsed = multMid;
            break;
          }
          case "dcf": {
            const fcfs = (p.fcfs as unknown as number[]) ?? [];
            const wacc = (p.wacc ?? 10) / 100;
            const terminalGrowth = (p.terminalGrowth ?? 2) / 100;
            const lastFcf = fcfs[fcfs.length - 1] ?? 0;
            const terminalValue = lastFcf * (1 + terminalGrowth) / (wacc - terminalGrowth);
            const pvFcf = fcfs.reduce((acc: number, fcf: number, i: number) => acc + fcf / Math.pow(1 + wacc, i + 1), 0);
            const pvTerminal = terminalValue / Math.pow(1 + wacc, fcfs.length);
            evMid = pvFcf + pvTerminal;
            evLow = evMid * 0.85;
            evHigh = evMid * 1.15;
            break;
          }
          case "anr": {
            const assets = p.adjustedNetAssets ?? 0;
            evMid = assets;
            evLow = assets * 0.9;
            evHigh = assets * 1.1;
            break;
          }
          case "market_comps":
          case "transactions": {
            const ebitda = p.ebitda ?? 0;
            const multLow = p.multipleLow ?? 4;
            const multMid = p.multipleMid ?? 6;
            const multHigh = p.multipleHigh ?? 8;
            evLow = ebitda * multLow;
            evMid = ebitda * multMid;
            evHigh = ebitda * multHigh;
            multipleUsed = multMid;
            break;
          }
          case "yield": {
            const netIncome = p.netIncome ?? 0;
            const yieldRate = (p.yieldRate ?? 10) / 100;
            evMid = netIncome / yieldRate;
            evLow = evMid * 0.85;
            evHigh = evMid * 1.15;
            break;
          }
          case "goodwill": {
            const anr = p.anr ?? 0;
            const superProfit = p.superProfit ?? 0;
            const rate = (p.rate ?? 10) / 100;
            const years = p.years ?? 5;
            const gw = superProfit * (1 - Math.pow(1 + rate, -years)) / rate;
            evMid = anr + gw;
            evLow = evMid * 0.85;
            evHigh = evMid * 1.15;
            break;
          }
        }

        const netDebt = (p.netDebt as number) ?? 0;
        results.push({
          method: m.method,
          evLow: Math.round(evLow),
          evMid: Math.round(evMid),
          evHigh: Math.round(evHigh),
          equityValueMid: Math.round(evMid - netDebt),
          multipleUsed,
        });

        await db.upsertValuationResult(input.runId, m.method, {
          evLow: String(Math.round(evLow)),
          evMid: String(Math.round(evMid)),
          evHigh: String(Math.round(evHigh)),
          equityValueLow: String(Math.round(evLow - netDebt)),
          equityValueMid: String(Math.round(evMid - netDebt)),
          equityValueHigh: String(Math.round(evHigh - netDebt)),
          multipleUsed: multipleUsed ? String(multipleUsed) : null,
          weightPct: String(m.weight),
        });
      }

      // Valorisation pondérée
      const totalWeight = results.reduce((s, r) => s + (input.methods.find(m => m.method === r.method)?.weight ?? 0), 0);
      const weightedEv = totalWeight > 0
        ? results.reduce((s, r) => s + r.evMid * (input.methods.find(m => m.method === r.method)?.weight ?? 0) / totalWeight, 0)
        : 0;

      return { results, weightedEv: Math.round(weightedEv) };
    }),

  getSectorMultiples: protectedProcedure
    .input(z.object({ sectorCode: z.string() }))
    .query(async ({ input }) => db.getSectorMultiples(input.sectorCode)),

  getComparableTransactions: protectedProcedure
    .input(z.object({ sectorCode: z.string() }))
    .query(async ({ input }) => db.getComparableTransactions(input.sectorCode)),

  generateNarrative: ownerOrAnalystProcedure
    .input(z.object({ runId: z.number(), companyName: z.string(), sectorCode: z.string().optional() }))
    .mutation(async ({ input }) => {
      const results = await db.getValuationResults(input.runId);
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `Tu es un expert en valorisation d'entreprise. Tu rédiges des narratives de valorisation institutionnelles, denses et précises, à destination d'investisseurs et d'acquéreurs potentiels. Tu présentes les résultats de valorisation multi-méthodes avec nuance et rigueur analytique. Réponds en français.`,
          },
          {
            role: "user",
            content: `Rédige une narrative de valorisation pour ${input.companyName} (secteur : ${input.sectorCode ?? "non spécifié"}) basée sur ces résultats :

${JSON.stringify(results)}

Structure : (1) fourchette de valorisation retenue et justification, (2) analyse méthode par méthode, (3) points de convergence et de divergence, (4) facteurs d'ajustement recommandés, (5) conclusion et recommandation.`,
          },
        ],
      });
      const rawNarrative = response.choices[0]?.message?.content;
      const narrative = typeof rawNarrative === "string" ? rawNarrative : JSON.stringify(rawNarrative ?? "");
      // Sauvegarder la narrative sur le premier résultat
      if (results[0]) {
        await db.upsertValuationResult(input.runId, results[0].method, { narrativeAi: narrative });
      }
      return { narrative };
    }),
});

// ─── Router Module 5 — Simulation Inverse ────────────────────────────────────

const simulationRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => db.getSimulations(input.projectId)),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => db.getSimulationById(input.id)),

  create: ownerOrAnalystProcedure
    .input(z.object({
      projectId: z.number(),
      runId: z.number().optional(),
      label: z.string().optional(),
      targetEv: z.number(),
      currentEv: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const gapToFill = input.currentEv ? input.targetEv - input.currentEv : null;
      return db.createSimulation({
        projectId: input.projectId,
        runId: input.runId,
        label: input.label,
        targetEv: String(input.targetEv),
        currentEv: input.currentEv ? String(input.currentEv) : null,
        gapToFill: gapToFill ? String(gapToFill) : null,
        createdBy: ctx.user.id,
      });
    }),

  update: ownerOrAnalystProcedure
    .input(z.object({
      id: z.number(),
      targetEv: z.number().optional(),
      currentEv: z.number().optional(),
      label: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const updateData: Record<string, unknown> = {};
      if (data.label !== undefined) updateData.label = data.label;
      if (data.targetEv !== undefined) updateData.targetEv = String(data.targetEv);
      if (data.currentEv !== undefined) {
        updateData.currentEv = String(data.currentEv);
        if (data.targetEv !== undefined) {
          updateData.gapToFill = String(data.targetEv - data.currentEv);
        }
      }
      await db.updateSimulation(id, updateData as any);
    }),

  getLevers: protectedProcedure
    .input(z.object({ simulationId: z.number() }))
    .query(async ({ input }) => db.getSimulationLevers(input.simulationId)),

  addLever: ownerOrAnalystProcedure
    .input(z.object({
      simulationId: z.number(),
      leverType: z.enum(["ebitda_improvement", "debt_reduction", "multiple_expansion", "revenue_growth"]),
      label: z.string(),
      currentValue: z.number().optional(),
      targetValue: z.number().optional(),
      evImpact: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      await db.upsertSimulationLever({
        simulationId: input.simulationId,
        leverType: input.leverType,
        label: input.label,
        currentValue: input.currentValue ? String(input.currentValue) : null,
        targetValue: input.targetValue ? String(input.targetValue) : null,
        evImpact: input.evImpact ? String(input.evImpact) : null,
        isActive: false,
        sortOrder: 0,
      });
    }),

  toggleLever: ownerOrAnalystProcedure
    .input(z.object({ id: z.number(), isActive: z.boolean() }))
    .mutation(async ({ input }) => {
      await db.updateSimulationLever(input.id, { isActive: input.isActive });
    }),

  updateLever: ownerOrAnalystProcedure
    .input(z.object({
      id: z.number(),
      targetValue: z.number().optional(),
      evImpact: z.number().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const updateData: Record<string, unknown> = {};
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      if (data.targetValue !== undefined) updateData.targetValue = String(data.targetValue);
      if (data.evImpact !== undefined) updateData.evImpact = String(data.evImpact);
      await db.updateSimulationLever(id, updateData as any);
    }),

  getScenarios: protectedProcedure
    .input(z.object({ simulationId: z.number() }))
    .query(async ({ input }) => db.getSimulationScenarios(input.simulationId)),

  createScenario: ownerOrAnalystProcedure
    .input(z.object({
      simulationId: z.number(),
      name: z.string(),
      activeLeversJson: z.unknown().optional(),
      resultingEv: z.number().optional(),
      probabilityPct: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return db.createSimulationScenario({
        simulationId: input.simulationId,
        name: input.name,
        activeLeversJson: input.activeLeversJson,
        resultingEv: input.resultingEv ? String(input.resultingEv) : null,
        probabilityPct: input.probabilityPct ? String(input.probabilityPct) : null,
        notes: input.notes,
      });
    }),

  analyzeFeasibility: ownerOrAnalystProcedure
    .input(z.object({
      simulationId: z.number(),
      targetEv: z.number(),
      currentEv: z.number(),
      activeLevers: z.array(z.object({
        label: z.string(),
        leverType: z.string(),
        evImpact: z.number(),
      })),
    }))
    .mutation(async ({ input }) => {
      const gap = input.targetEv - input.currentEv;
      const coveredByLevers = input.activeLevers.reduce((s, l) => s + l.evImpact, 0);
      const coverageRatio = gap > 0 ? coveredByLevers / gap : 0;

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `Tu es un expert en valorisation M&A. Tu analyses la faisabilité d'un objectif de valorisation et fournis une analyse critique des leviers activés. Tu es factuel, précis et orienté décision. Réponds en français.`,
          },
          {
            role: "user",
            content: `Analyse de faisabilité :
- Valorisation actuelle : ${input.currentEv} k€
- Objectif de valorisation : ${input.targetEv} k€
- Gap à combler : ${gap} k€
- Leviers activés couvrent : ${Math.round(coveredByLevers)} k€ (${Math.round(coverageRatio * 100)}% du gap)
- Leviers : ${JSON.stringify(input.activeLevers)}

Fournis : (1) évaluation de la faisabilité de l'objectif, (2) analyse critique des leviers sélectionnés, (3) leviers manquants ou sous-exploités, (4) chemin critique recommandé, (5) probabilité de succès estimée.`,
          },
        ],
      });

      return {
        analysis: response.choices[0]?.message?.content ?? "",
        coverageRatio,
        coveredByLevers,
        gap,
      };
    }),
});

// ─── Router principal ─────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  org: orgRouter,
  projects: projectsRouter,
  historical: historicalRouter,
  strategy: strategyRouter,
  businessPlan: businessPlanRouter,
  valuation: valuationRouter,
  simulation: simulationRouter,
});

export type AppRouter = typeof appRouter;
