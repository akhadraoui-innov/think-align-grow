import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthPage } from "@/components/auth/AuthPage";
import { useAuth } from "@/hooks/useAuth";

export default function Auth() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/explore");
    }
  }, [user, loading, navigate]);

  return <AuthPage />;
}
