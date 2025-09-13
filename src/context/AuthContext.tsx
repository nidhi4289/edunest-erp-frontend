import { createContext, useContext, useEffect, useState } from "react";

type AuthCtx = {
  token: string | null;
  isAuthenticated: boolean;
  role: string | null;
  userGuid: string | null;
  login: (t: string, r: string, u: string) => void;
  logout: () => void;
};

const Ctx = createContext<AuthCtx>({ 
  token: null, 
  isAuthenticated: false,
  role: null,
  userGuid: null,
  login: () => {}, 
  logout: () => {} 
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [userGuid, setUserGuid] = useState<string | null>(null);

  useEffect(() => { 
    setToken(localStorage.getItem("authToken"));
    setRole(localStorage.getItem("authRole"));
    setUserGuid(localStorage.getItem("authUserGuid"));
  }, []);
  
  const login = (t: string, r: string, u: string) => { 
    localStorage.setItem("authToken", t);
    localStorage.setItem("authRole", r);
    localStorage.setItem("authUserGuid", u);
    setToken(t);
    setRole(r);
    setUserGuid(u);
  };
  
  const logout = () => { 
    localStorage.removeItem("authToken");
    localStorage.removeItem("authRole");
    localStorage.removeItem("authUserGuid");
    setToken(null);
    setRole(null);
    setUserGuid(null);
  };
  
  return (
    <Ctx.Provider value={{ 
      token, 
      isAuthenticated: !!token,
      role,
      userGuid,
      login, 
      logout 
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);