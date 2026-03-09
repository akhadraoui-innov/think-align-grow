import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Compass, Layers, Gamepad2, Sparkles, User, Users } from "lucide-react";

const navItems = [
  { path: "/explore", icon: Compass, label: "Explorer" },
  { path: "/plans", icon: Layers, label: "Plans" },
  { path: "/workshop", icon: Users, label: "Workshop" },
  { path: "/lab", icon: Gamepad2, label: "Lab" },
  { path: "/ai", icon: Sparkles, label: "IA" },
  { path: "/profile", icon: User, label: "Profil" },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  if (location.pathname === "/") return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/80 backdrop-blur-xl safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-1.5">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          const Icon = item.icon;

          return (
            <motion.button
              key={item.path}
              onClick={() => navigate(item.path)}
              whileTap={{ scale: 0.85 }}
              className="relative flex flex-col items-center gap-0.5 px-3 py-2 transition-colors"
            >
              <div className="relative">
                {isActive && (
                  <motion.div
                    layoutId="bottomnav-indicator"
                    className="absolute -inset-2.5 rounded-xl bg-primary/12"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon
                  className={`relative h-5 w-5 transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                />
              </div>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="bottomnav-dot"
                  className="absolute -top-0.5 h-1 w-1 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
