import { createContext, useContext, useState, useEffect, ReactNode } from "react";

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
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<boolean>;
  logout: () => void;
  setMockUser: (role: UserRole, tier?: MemberTier, remember?: boolean) => void;
  updateAvatar: (url: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "wj_auth_user";
const EXPIRY_KEY = "wj_auth_expiry";
const SESSION_MS = 24 * 60 * 60 * 1000; // 1 day
const REMEMBER_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function readStoredUser(): User | null {
  try {
    const expiry = localStorage.getItem(EXPIRY_KEY);
    if (!expiry || Date.now() > Number(expiry)) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(EXPIRY_KEY);
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
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  localStorage.setItem(
    EXPIRY_KEY,
    String(Date.now() + (remember ? REMEMBER_MS : SESSION_MS))
  );
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

  useEffect(() => {
    // Re-check expiry on focus / tab return
    const onFocus = () => {
      const restored = readStoredUser();
      if (!restored && user) setUser(null);
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [user]);

  const login = async (
    email: string,
    password: string,
    remember: boolean = false
  ): Promise<boolean> => {
    // Mock authentication - in production, this would call an API
    const mockUser = mockUsers[email.toLowerCase()];
    if (mockUser && password.length >= 4) {
      setUser(mockUser);
      persistUser(mockUser, remember);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    persistUser(null, false);
  };

  const updateAvatar = (url: string) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, avatar: url };
      // Preserve existing expiry; just rewrite stored user object
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
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
    setUser(next);
    persistUser(next, remember);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
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
