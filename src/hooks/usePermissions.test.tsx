import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// ─── Mocks ───────────────────────────────────────────────────────────────

const mockUser = { id: "user-1" };
let mockRoles: { role: string }[] = [];
let mockRolePerms: { role: string; permission_key: string }[] = [];

vi.mock("@/integrations/supabase/client", () => {
  const from = (table: string) => {
    if (table === "user_roles") {
      return {
        select: () => ({
          eq: () => Promise.resolve({ data: mockRoles, error: null }),
        }),
      };
    }
    if (table === "role_permissions") {
      return {
        select: () => Promise.resolve({ data: mockRolePerms, error: null }),
      };
    }
    if (table === "permission_domains") {
      return {
        select: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
      };
    }
    if (table === "permission_definitions") {
      return {
        select: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
      };
    }
    return { select: () => Promise.resolve({ data: [], error: null }) };
  };
  return { supabase: { from } };
});

vi.mock("./useAuth", () => ({
  useAuth: () => ({ user: mockUser, loading: false }),
}));

// Import after mocks
import { usePermissions } from "./usePermissions";

function wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  // eslint-disable-next-line react/display-name
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe("usePermissions", () => {
  beforeEach(() => {
    mockRoles = [];
    mockRolePerms = [];
    if (typeof sessionStorage !== "undefined") sessionStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("identifies super_admin and gives full SaaS team flag", async () => {
    mockRoles = [{ role: "super_admin" }];
    mockRolePerms = [
      { role: "super_admin", permission_key: "admin.users.view" },
      { role: "super_admin", permission_key: "admin.users.delete" },
    ];
    const { result } = renderHook(() => usePermissions(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isSuperAdmin).toBe(true);
    expect(result.current.isSaasTeam).toBe(true);
    expect(result.current.canAccessAdmin).toBe(true);
    expect(result.current.has("admin.users.view")).toBe(true);
    expect(result.current.has("admin.users.delete")).toBe(true);
  });

  it("restricts a member to no admin rights", async () => {
    mockRoles = [{ role: "member" }];
    mockRolePerms = [{ role: "member", permission_key: "workshops.participate" }];
    const { result } = renderHook(() => usePermissions(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isSuperAdmin).toBe(false);
    expect(result.current.isSaasTeam).toBe(false);
    expect(result.current.canAccessAdmin).toBe(false);
    expect(result.current.has("admin.users.view")).toBe(false);
    expect(result.current.has("workshops.participate")).toBe(true);
  });

  it("merges permissions across multiple roles", async () => {
    mockRoles = [{ role: "customer_lead" }, { role: "manager" }];
    mockRolePerms = [
      { role: "customer_lead", permission_key: "admin.orgs.view" },
      { role: "manager", permission_key: "team.manage" },
    ];
    const { result } = renderHook(() => usePermissions(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.has("admin.orgs.view")).toBe(true);
    expect(result.current.has("team.manage")).toBe(true);
    expect(result.current.hasAny("nope", "team.manage")).toBe(true);
    expect(result.current.hasAny("nope1", "nope2")).toBe(false);
    expect(result.current.isSaasTeam).toBe(true); // customer_lead is SaaS
  });

  it("strips write permissions when impersonating", async () => {
    mockRoles = [{ role: "super_admin" }];
    mockRolePerms = [
      { role: "super_admin", permission_key: "admin.users.view" },
      { role: "super_admin", permission_key: "admin.users.delete" },
      { role: "super_admin", permission_key: "admin.orgs.read" },
    ];
    sessionStorage.setItem(
      "heeplab.impersonation",
      JSON.stringify({ active: true, target: "x" }),
    );
    const { result } = renderHook(() => usePermissions(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));
    // view/read kept
    expect(result.current.has("admin.users.view")).toBe(true);
    expect(result.current.has("admin.orgs.read")).toBe(true);
    // write/delete stripped
    expect(result.current.has("admin.users.delete")).toBe(false);
    // impersonating disables super_admin/saas flags
    expect(result.current.isSuperAdmin).toBe(false);
    expect(result.current.isSaasTeam).toBe(false);
  });

  it("legacy compat flags reflect granular perms", async () => {
    mockRoles = [{ role: "owner" }];
    mockRolePerms = [
      { role: "owner", permission_key: "admin.orgs.view" },
      { role: "owner", permission_key: "admin.users.view" },
      { role: "owner", permission_key: "admin.billing.view" },
      { role: "owner", permission_key: "admin.settings.roles" },
    ];
    const { result } = renderHook(() => usePermissions(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.canManageOrgs).toBe(true);
    expect(result.current.canManageUsers).toBe(true);
    expect(result.current.canViewBilling).toBe(true);
    expect(result.current.canManageSettings).toBe(true);
    expect(result.current.canManageToolkits).toBe(false);
  });
});
