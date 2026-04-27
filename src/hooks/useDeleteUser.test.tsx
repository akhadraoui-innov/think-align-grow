import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const invokeMock = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: (...args: unknown[]) => invokeMock(...args) } },
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: { success: (m: string) => toastSuccess(m), error: (m: string) => toastError(m) },
}));

import { useDeleteUser } from "./useDeleteUser";

function wrap() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  // eslint-disable-next-line react/display-name
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe("useDeleteUser", () => {
  beforeEach(() => {
    invokeMock.mockReset();
    toastSuccess.mockReset();
    toastError.mockReset();
    // Stub the URL/anchor APIs used by the archive download path
    Object.defineProperty(URL, "createObjectURL", { value: () => "blob:fake", writable: true });
    Object.defineProperty(URL, "revokeObjectURL", { value: () => {}, writable: true });
  });

  it("returns success and triggers an archive download on anonymize", async () => {
    invokeMock.mockResolvedValue({
      data: { success: true, mode: "anonymize", archive: { user: { id: "u1" } } },
      error: null,
    });
    const { result } = renderHook(() => useDeleteUser(), { wrapper: wrap() });
    await act(async () => {
      await result.current.mutateAsync({ userId: "u1", mode: "anonymize", userLabel: "alice@x" });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invokeMock).toHaveBeenCalledWith("delete-user", { body: { user_id: "u1", mode: "anonymize" } });
    expect(toastSuccess).toHaveBeenCalled();
    expect(toastSuccess.mock.calls[0][0]).toMatch(/anonymisé/i);
  });

  it("maps known error codes to user-friendly messages", async () => {
    invokeMock.mockResolvedValue({ data: { success: false, error: "cannot_delete_super_admin" }, error: null });
    const { result } = renderHook(() => useDeleteUser(), { wrapper: wrap() });
    await expect(
      result.current.mutateAsync({ userId: "u1", mode: "hard_delete" }),
    ).rejects.toBeInstanceOf(Error);
    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(toastError.mock.calls[0][0]).toMatch(/Super Admin/i);
  });

  it("falls back to a raw error message for unknown codes", async () => {
    invokeMock.mockResolvedValue({ data: null, error: { message: "boom" } });
    const { result } = renderHook(() => useDeleteUser(), { wrapper: wrap() });
    await expect(
      result.current.mutateAsync({ userId: "u1", mode: "hard_delete" }),
    ).rejects.toBeInstanceOf(Error);
    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(toastError.mock.calls[0][0]).toMatch(/boom/);
  });
});
