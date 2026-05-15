CREATE TABLE `audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int,
	`userId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`entity` varchar(100),
	`entityId` int,
	`diffJson` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `balance_sheet` (
	`id` int AUTO_INCREMENT NOT NULL,
	`periodId` int NOT NULL,
	`fixedAssets` decimal(18,2),
	`intangibleAssets` decimal(18,2),
	`financialAssets` decimal(18,2),
	`inventory` decimal(18,2),
	`receivables` decimal(18,2),
	`cash` decimal(18,2),
	`totalAssets` decimal(18,2),
	`equity` decimal(18,2),
	`financialDebtLt` decimal(18,2),
	`financialDebtSt` decimal(18,2),
	`payables` decimal(18,2),
	`otherLiabilities` decimal(18,2),
	`netFinancialDebt` decimal(18,2),
	`workingCapitalRequirement` decimal(18,2),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `balance_sheet_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bp_assumptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bpId` int NOT NULL,
	`year` int NOT NULL,
	`category` varchar(100) NOT NULL,
	`label` varchar(255) NOT NULL,
	`value` decimal(18,4),
	`unit` varchar(50),
	`source` enum('manual','lever','historical') NOT NULL DEFAULT 'manual',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bp_assumptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bp_projections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bpId` int NOT NULL,
	`year` int NOT NULL,
	`scenario` enum('base','high','low') NOT NULL DEFAULT 'base',
	`revenue` decimal(18,2),
	`grossMargin` decimal(18,2),
	`ebitda` decimal(18,2),
	`ebit` decimal(18,2),
	`netIncome` decimal(18,2),
	`netFinancialDebt` decimal(18,2),
	`equity` decimal(18,2),
	`wcr` decimal(18,2),
	`freeCashFlow` decimal(18,2),
	`capex` decimal(18,2),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bp_projections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bp_sensitivity` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bpId` int NOT NULL,
	`variable` varchar(100) NOT NULL,
	`deltaPct` decimal(8,4) NOT NULL,
	`evImpactLow` decimal(18,2),
	`evImpactMid` decimal(18,2),
	`evImpactHigh` decimal(18,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bp_sensitivity_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `business_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`mode` enum('rapide','structure','expert') NOT NULL DEFAULT 'rapide',
	`horizonYears` int NOT NULL DEFAULT 3,
	`baseYear` int NOT NULL,
	`label` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `business_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cash_flow` (
	`id` int AUTO_INCREMENT NOT NULL,
	`periodId` int NOT NULL,
	`operatingCf` decimal(18,2),
	`capexMaintenance` decimal(18,2),
	`capexGrowth` decimal(18,2),
	`freeCashFlow` decimal(18,2),
	`wcrVariation` decimal(18,2),
	`debtRepayment` decimal(18,2),
	`dividends` decimal(18,2),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cash_flow_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `comparable_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sectorCode` varchar(50) NOT NULL,
	`year` int NOT NULL,
	`targetName` varchar(255) NOT NULL,
	`evAmount` decimal(18,2),
	`revenue` decimal(18,2),
	`ebitda` decimal(18,2),
	`evEbitdaMultiple` decimal(8,4),
	`evRevenueMultiple` decimal(8,4),
	`source` varchar(100),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `comparable_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `historical_periods` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`year` int NOT NULL,
	`mode` enum('rapide','structure','expert') NOT NULL DEFAULT 'rapide',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `historical_periods_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `income_statement` (
	`id` int AUTO_INCREMENT NOT NULL,
	`periodId` int NOT NULL,
	`revenue` decimal(18,2),
	`revenueGrowthPct` decimal(8,4),
	`costOfGoods` decimal(18,2),
	`grossMargin` decimal(18,2),
	`grossMarginPct` decimal(8,4),
	`personnelCosts` decimal(18,2),
	`otherOpex` decimal(18,2),
	`ebitda` decimal(18,2),
	`ebitdaPct` decimal(8,4),
	`depreciation` decimal(18,2),
	`ebit` decimal(18,2),
	`financialResult` decimal(18,2),
	`tax` decimal(18,2),
	`netIncome` decimal(18,2),
	`segmentsJson` json,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `income_statement_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lever_valuation_impact` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leverId` int NOT NULL,
	`method` varchar(50) NOT NULL,
	`evDeltaLow` decimal(18,2),
	`evDeltaMid` decimal(18,2),
	`evDeltaHigh` decimal(18,2),
	`calculationDetailJson` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lever_valuation_impact_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `operational_kpis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`periodId` int NOT NULL,
	`headcountFte` int,
	`revenuePerFte` decimal(18,2),
	`clientCount` int,
	`top5ClientConcentrationPct` decimal(8,4),
	`churnRatePct` decimal(8,4),
	`recurringRevenuePct` decimal(8,4),
	`orderBacklog` decimal(18,2),
	`npsScore` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `operational_kpis_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`plan` enum('starter','pro','enterprise') NOT NULL DEFAULT 'starter',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organizations_id` PRIMARY KEY(`id`),
	CONSTRAINT `organizations_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `project_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('owner','analyst','client','viewer') NOT NULL DEFAULT 'viewer',
	`invitedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`sectorCode` varchar(50),
	`sectorLabel` varchar(100),
	`status` enum('draft','active','completed','archived') NOT NULL DEFAULT 'draft',
	`description` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `restatements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`periodId` int NOT NULL,
	`type` varchar(50) NOT NULL,
	`label` varchar(255) NOT NULL,
	`amount` decimal(18,2),
	`justification` text,
	`impactOnEbitda` decimal(18,2),
	`impactOnDebt` decimal(18,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `restatements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sector_multiples` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sectorCode` varchar(50) NOT NULL,
	`sectorLabel` varchar(100) NOT NULL,
	`year` int NOT NULL,
	`evEbitdaP25` decimal(8,4),
	`evEbitdaMedian` decimal(8,4),
	`evEbitdaP75` decimal(8,4),
	`evRevenueP25` decimal(8,4),
	`evRevenueMedian` decimal(8,4),
	`evRevenueP75` decimal(8,4),
	`source` varchar(100),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sector_multiples_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `simulation_levers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`simulationId` int NOT NULL,
	`leverType` enum('ebitda_improvement','debt_reduction','multiple_expansion','revenue_growth') NOT NULL,
	`label` varchar(255) NOT NULL,
	`currentValue` decimal(18,4),
	`targetValue` decimal(18,4),
	`evImpact` decimal(18,2),
	`isActive` boolean NOT NULL DEFAULT false,
	`sortOrder` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `simulation_levers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `simulation_scenarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`simulationId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`activeLeversJson` json,
	`resultingEv` decimal(18,2),
	`probabilityPct` decimal(8,4),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `simulation_scenarios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `simulations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`runId` int,
	`label` varchar(255),
	`targetEv` decimal(18,2) NOT NULL,
	`currentEv` decimal(18,2),
	`gapToFill` decimal(18,2),
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `simulations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `strategic_axes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orientationId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `strategic_axes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `strategic_levers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`objectiveId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`revenueImpactPct` decimal(8,4),
	`revenueImpactAmount` decimal(18,2),
	`ebitdaImpactPct` decimal(8,4),
	`ebitdaImpactAmount` decimal(18,2),
	`wcrImpactDays` int,
	`capexRequired` decimal(18,2),
	`riskReductionScore` int,
	`probabilityPct` decimal(8,4),
	`horizonT1` decimal(8,4),
	`horizonT2` decimal(8,4),
	`horizonT3` decimal(8,4),
	`status` enum('identified','validated','in_progress','done') NOT NULL DEFAULT 'identified',
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `strategic_levers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `strategic_objectives` (
	`id` int AUTO_INCREMENT NOT NULL,
	`axisId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`kpiName` varchar(100),
	`kpiCurrent` decimal(18,4),
	`kpiTarget` decimal(18,4),
	`horizonMonths` int,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `strategic_objectives_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `strategic_orientations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`priority` enum('high','medium','low') NOT NULL DEFAULT 'medium',
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `strategic_orientations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `valuation_params` (
	`id` int AUTO_INCREMENT NOT NULL,
	`runId` int NOT NULL,
	`method` varchar(50) NOT NULL,
	`paramsJson` json NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `valuation_params_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `valuation_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`runId` int NOT NULL,
	`method` varchar(50) NOT NULL,
	`evLow` decimal(18,2),
	`evMid` decimal(18,2),
	`evHigh` decimal(18,2),
	`equityValueLow` decimal(18,2),
	`equityValueMid` decimal(18,2),
	`equityValueHigh` decimal(18,2),
	`multipleUsed` decimal(8,4),
	`weightPct` decimal(8,4),
	`narrativeAi` text,
	`calculatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `valuation_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `valuation_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`bpId` int,
	`createdBy` int NOT NULL,
	`label` varchar(255),
	`status` enum('draft','final') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `valuation_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('owner','analyst','client','viewer','admin','user') NOT NULL DEFAULT 'analyst';--> statement-breakpoint
ALTER TABLE `users` ADD `orgId` int;--> statement-breakpoint
CREATE INDEX `idx_audit_projectId` ON `audit_log` (`projectId`);--> statement-breakpoint
CREATE INDEX `idx_bs_periodId` ON `balance_sheet` (`periodId`);--> statement-breakpoint
CREATE INDEX `idx_bpa_bpId` ON `bp_assumptions` (`bpId`);--> statement-breakpoint
CREATE INDEX `idx_bpp_bpId` ON `bp_projections` (`bpId`);--> statement-breakpoint
CREATE INDEX `idx_bps_bpId` ON `bp_sensitivity` (`bpId`);--> statement-breakpoint
CREATE INDEX `idx_bp_projectId` ON `business_plans` (`projectId`);--> statement-breakpoint
CREATE INDEX `idx_cf_periodId` ON `cash_flow` (`periodId`);--> statement-breakpoint
CREATE INDEX `idx_hp_projectId` ON `historical_periods` (`projectId`);--> statement-breakpoint
CREATE INDEX `idx_is_periodId` ON `income_statement` (`periodId`);--> statement-breakpoint
CREATE INDEX `idx_lvi_leverId` ON `lever_valuation_impact` (`leverId`);--> statement-breakpoint
CREATE INDEX `idx_kpi_periodId` ON `operational_kpis` (`periodId`);--> statement-breakpoint
CREATE INDEX `idx_pm_projectId` ON `project_members` (`projectId`);--> statement-breakpoint
CREATE INDEX `idx_pm_userId` ON `project_members` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_projects_orgId` ON `projects` (`orgId`);--> statement-breakpoint
CREATE INDEX `idx_rest_periodId` ON `restatements` (`periodId`);--> statement-breakpoint
CREATE INDEX `idx_simlev_simulationId` ON `simulation_levers` (`simulationId`);--> statement-breakpoint
CREATE INDEX `idx_simscen_simulationId` ON `simulation_scenarios` (`simulationId`);--> statement-breakpoint
CREATE INDEX `idx_sim_projectId` ON `simulations` (`projectId`);--> statement-breakpoint
CREATE INDEX `idx_sa_orientationId` ON `strategic_axes` (`orientationId`);--> statement-breakpoint
CREATE INDEX `idx_sl_objectiveId` ON `strategic_levers` (`objectiveId`);--> statement-breakpoint
CREATE INDEX `idx_sobj_axisId` ON `strategic_objectives` (`axisId`);--> statement-breakpoint
CREATE INDEX `idx_so_projectId` ON `strategic_orientations` (`projectId`);--> statement-breakpoint
CREATE INDEX `idx_vp_runId` ON `valuation_params` (`runId`);--> statement-breakpoint
CREATE INDEX `idx_vres_runId` ON `valuation_results` (`runId`);--> statement-breakpoint
CREATE INDEX `idx_vr_projectId` ON `valuation_runs` (`projectId`);