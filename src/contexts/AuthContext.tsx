import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

export type MemberTier = "light" | "plus" | "black";
export type UserRole = "guest" | "member" | "admin" | "staff";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tier?: MemberTier;
  bikeId?: string;
  bikeName?: string;
  purchaseDate?: string;
  estimatedDailyKm?: number;
  totalKm?: number;
  avatar?: string;
  isDemo?: boolean;
  mustCompleteProfile?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    email: string,
    password: string,
    remember?: boolean
  ) => Promise<{ success: boolean; code?: string; message?: string }>;
  logout: () => void;
  setMockUser: (role: UserRole, tier?: MemberTier, remember?: boolean) => void;
  updateAvatar: (url: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "wj_auth_user";
const EXPIRY_KEY = "wj_auth_expiry";
const DEMO_KEY = "wj_auth_demo";
const SESSION_MS = 24 * 60 * 60 * 1000; // 1 day
const REMEMBER_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function readStoredUser(): User | null {
  try {
    if (localStorage.getItem(DEMO_KEY) !== "1") return null;
    const expiry = localStorage.getItem(EXPIRY_KEY);
    if (!expiry || Date.now() > Number(expiry)) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(EXPIRY_KEY);
      localStorage.removeItem(DEMO_KEY);
      return null;
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function persistUser(user: User | null, remember: boolean) {
  if (!user) {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(EXPIRY_KEY);
    localStorage.removeItem(DEMO_KEY);
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  localStorage.setItem(
    EXPIRY_KEY,
    String(Date.now() + (remember ? REMEMBER_MS : SESSION_MS))
  );
  if (user.isDemo) localStorage.setItem(DEMO_KEY, "1");
}

// Mock users for demonstration
const mockUsers: Record<string, User> = {
  "admin@wjvision.com": {
    id: "admin-001",
    name: "Admin User",
    email: "admin@wjvision.com",
    role: "admin",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
  },
  "staff@wjvision.com": {
    id: "staff-001",
    name: "Marco Hendriks",
    email: "staff@wjvision.com",
    role: "staff",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=marco",
  },
  "light@wjvision.com": {
    id: "member-light-001",
    name: "Emma van der Berg",
    email: "light@wjvision.com",
    role: "member",
    tier: "light",
    bikeId: "V8-2024-NL-00421",
    bikeName: "WJ V8 Urban",
    purchaseDate: "2024-01-15",
    estimatedDailyKm: 12,
    totalKm: 1840,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emma",
  },
  "plus@wjvision.com": {
    id: "member-plus-001",
    name: "Lucas de Vries",
    email: "plus@wjvision.com",
    role: "member",
    tier: "plus",
    bikeId: "V8-2024-NL-00892",
    bikeName: "WJ V8 Sport",
    purchaseDate: "2023-10-22",
    estimatedDailyKm: 18,
    totalKm: 4250,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=lucas",
  },
  "black@wjvision.com": {
    id: "member-black-001",
    name: "Sophie Jansen",
    email: "black@wjvision.com",
    role: "member",
    tier: "black",
    bikeId: "V8-2024-NL-00156",
    bikeName: "WJ V8 Prestige",
    purchaseDate: "2023-06-10",
    estimatedDailyKm: 25,
    totalKm: 8920,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sophie",
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readStoredUser());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Build a real user from a Supabase session by reading profile + user_roles
  const hydrateFromSession = async (session: Session | null) => {
    if (!session?.user) {
      // Don't blow away an active demo session
      if (localStorage.getItem(DEMO_KEY) === "1") {
        setUser(readStoredUser());
      } else {
        setUser(null);
      }
      return;
    }
    const authUser = session.user;
    // Defer DB calls so onAuthStateChange stays sync-safe
    setTimeout(async () => {
      const [{ data: profile }, { data: roles }] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, email, avatar_url, must_complete_profile")
          .eq("user_id", authUser.id)
          .maybeSingle(),
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", authUser.id),
      ]);

      const roleNames = (roles ?? []).map((r: any) => r.role);
      const role: UserRole = roleNames.includes("admin")
        ? "admin"
        : roleNames.includes("staff")
        ? "staff"
        : roleNames.includes("member")
        ? "member"
        : "member";

      const next: User = {
        id: authUser.id,
        name: profile?.full_name || authUser.email?.split("@")[0] || "Member",
        email: profile?.email || authUser.email || "",
        role,
        avatar: profile?.avatar_url || undefined,
        isDemo: false,
        mustCompleteProfile: !!(profile as any)?.must_complete_profile,
      };
      setUser(next);
    }, 0);
  };

  useEffect(() => {
    // 1. Subscribe FIRST, then 2. fetch existing session
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      hydrateFromSession(session);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        hydrateFromSession(session);
      } else if (localStorage.getItem(DEMO_KEY) === "1") {
        setUser(readStoredUser());
      }
      setIsLoading(false);
    });

    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (
    email: string,
    password: string,
    _remember: boolean = false
  ) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error || !data.session) {
      return {
        success: false,
        code: (error as any)?.code,
        message: error?.message,
      };
    }
    localStorage.removeItem(DEMO_KEY);
    return { success: true };
  };

  const logout = () => {
    // Sign out of Supabase (no-op if there is no session)
    supabase.auth.signOut().catch(() => {});
    setUser(null);
    persistUser(null, false);
  };

  const updateAvatar = (url: string) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, avatar: url };
      // Only persist demo users to localStorage; real users come from Supabase
      if (prev.isDemo) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
      }
      return next;
    });
  };

  const setMockUser = (
    role: UserRole,
    tier?: MemberTier,
    remember: boolean = false
  ) => {
    let next: User | null = null;
    if (role === "admin") {
      next = mockUsers["admin@wjvision.com"];
    } else if (role === "staff") {
      next = mockUsers["staff@wjvision.com"];
    } else if (role === "member" && tier) {
      next = mockUsers[`${tier}@wjvision.com`];
    }
    if (next) next = { ...next, isDemo: true };
    setUser(next);
    persistUser(next, remember);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        setMockUser,
        updateAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
