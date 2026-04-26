import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ImpersonationBanner } from "@/components/layout/ImpersonationBanner";
import { setImpersonationState } from "@/hooks/useImpersonation";

describe("ImpersonationBanner", () => {
  it("returns nothing when impersonation is inactive", () => {
    setImpersonationState({ active: false });
    const { container } = render(<ImpersonationBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders red banner with target email when impersonating", () => {
    setImpersonationState({
      active: true,
      targetEmail: "client@example.com",
      startedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    });
    const { container, getByRole } = render(<ImpersonationBanner />);
    expect(container.textContent).toMatch(/Mode support/i);
    expect(container.textContent).toMatch(/client@example\.com/);
    expect(getByRole("button", { name: /Quitter/i })).toBeTruthy();
    setImpersonationState({ active: false });
  });
});
