import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface OrgMembership {
  organization_id: string;
  role: string;
  org_name: string;
}

interface OrgContextType {
  memberships: OrgMembership[];
  activeOrgId: string | null;
  setActiveOrgId: (id: string | null) => void;
  activeOrg: OrgMembership | null;
  loading: boolean;
}

const OrgContext = createContext<OrgContextType>({
  memberships: [],
  activeOrgId: null,
  setActiveOrgId: () => {},
  activeOrg: null,
  loading: true,
});

export function OrgProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [memberships, setMemberships] = useState<OrgMembership[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setMemberships([]);
      setActiveOrgId(null);
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("organization_members")
        .select("organization_id, role, organizations(name)")
        .eq("user_id", user.id);

      const mapped: OrgMembership[] = (data || []).map((m: any) => ({
        organization_id: m.organization_id,
        role: m.role,
        org_name: m.organizations?.name || "Organisation",
      }));

      setMemberships(mapped);

      // Restore from localStorage or pick first
      const stored = localStorage.getItem("activeOrgId");
      if (stored && mapped.some((m) => m.organization_id === stored)) {
        setActiveOrgId(stored);
      } else if (mapped.length > 0) {
        setActiveOrgId(mapped[0].organization_id);
      } else {
        setActiveOrgId(null);
      }
      setLoading(false);
    })();
  }, [user]);

  useEffect(() => {
    if (activeOrgId) {
      localStorage.setItem("activeOrgId", activeOrgId);
    }
  }, [activeOrgId]);

  const activeOrg = memberships.find((m) => m.organization_id === activeOrgId) || null;

  return (
    <OrgContext.Provider value={{ memberships, activeOrgId, setActiveOrgId, activeOrg, loading }}>
      {children}
    </OrgContext.Provider>
  );
}

export function useActiveOrg() {
  return useContext(OrgContext);
}
