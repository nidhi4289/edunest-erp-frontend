import { createContext, useContext, useEffect, useState } from "react";

type AuthCtx = {
  token: string | null;
  isAuthenticated: boolean;
  login: (t: string) => void;
  logout: () => void;
};

const Ctx = createContext<AuthCtx>({ 
  token: null, 
  isAuthenticated: false,
  login: () => {}, 
  logout: () => {} 
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  
  useEffect(() => { 
    setToken(localStorage.getItem("authToken")); // Changed from "token" to "authToken"
  }, []);
  
  const login = (t: string) => { 
    localStorage.setItem("authToken", t); // Changed from "token" to "authToken"
    setToken(t); 
  };
  
  const logout = () => { 
    localStorage.removeItem("authToken"); // Changed from "token" to "authToken"
    setToken(null); 
  };
  
  return (
    <Ctx.Provider value={{ 
      token, 
      isAuthenticated: !!token,
      login, 
      logout 
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);