import { createContext, useContext, useEffect, useState } from "react";

type AuthCtx = {
  token: string | null;
  isAuthenticated: boolean;
  role: string | null;
  userGuid: string | null;
  userId: string | null;
  masterDataClasses: any[];
  setMasterDataClasses: (data: any[]) => void;
  masterDataSubjects: any[];
  setMasterDataSubjects: (data: any[]) => void;
  login: (t: string, r: string, u: string, userId: string) => Promise<void>;
  logout: () => void;
};

const Ctx = createContext<AuthCtx>({ 
  token: null, 
  isAuthenticated: false,
  role: null,
  userGuid: null,
  userId: null,
  masterDataClasses: [],
  setMasterDataClasses: () => {},
  masterDataSubjects: [],
  setMasterDataSubjects: () => {},
  login: async () => {}, 
  logout: () => {} 
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [userGuid, setUserGuid] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [masterDataClasses, setMasterDataClasses] = useState<any[]>([]);
  const [masterDataSubjects, setMasterDataSubjects] = useState<any[]>([]);

  useEffect(() => { 
    const storedToken = localStorage.getItem("authToken");
    const storedRole = localStorage.getItem("authRole");
    const storedUserGuid = localStorage.getItem("authUserGuid");
    const storedUserId = localStorage.getItem("authUserId");
    
    // Check if we have a complete session (token and userId)
    // If incomplete, clear everything to prevent partial authentication
    if (storedToken && !storedUserId) {
      console.warn("Incomplete authentication session detected. Clearing storage.");
      localStorage.removeItem("authToken");
      localStorage.removeItem("authRole");
      localStorage.removeItem("authUserGuid");
      localStorage.removeItem("authUserId");
      localStorage.removeItem("masterDataClasses");
      localStorage.removeItem("masterDataSubjects");
      return;
    }
    
    setToken(storedToken);
    setRole(storedRole);
    setUserGuid(storedUserGuid);
    setUserId(storedUserId);
    
    const storedClasses = localStorage.getItem("masterDataClasses");
      if (storedClasses) {
        // Patch for legacy localStorage: ensure subjects/subjectIds are present
        let parsed = JSON.parse(storedClasses);
        parsed = parsed.map((cls: any) => {
          if (Array.isArray(cls.classSubjects)) {
            return {
              ...cls,
              subjects: cls.classSubjects.map((cs: any) => ({
                id: cs.subjectId,
                name: cs.subjectName
              })),
              subjectIds: cls.classSubjects.map((cs: any) => cs.subjectId)
            };
          }
          return { ...cls, subjects: [], subjectIds: [] };
        });
        setMasterDataClasses(parsed);
      }
    const storedSubjects = localStorage.getItem("masterDataSubjects");
    if (storedSubjects) setMasterDataSubjects(JSON.parse(storedSubjects));
  }, []);

  const login = async (t: string, r: string, u: string, userId: string) => { 
    localStorage.setItem("authToken", t);
    localStorage.setItem("authRole", r);
    localStorage.setItem("authUserGuid", u);
    localStorage.setItem("authUserId", userId);
    setToken(t);
    setRole(r);
    setUserGuid(u);
    setUserId(userId);
    // Fetch master data classes after login
    try {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/MasterData/classes`, {
        headers: { 'Authorization': `Bearer ${t}` }
      });
      if (res.ok) {
        let data = await res.json();
        // Map classSubjects to subjects and subjectIds for each class
        data = data.map((cls: any) => {
          if (Array.isArray(cls.classSubjects)) {
            return {
              ...cls,
              subjects: cls.classSubjects.map((cs: any) => ({
                id: cs.subjectId,
                name: cs.subjectName
              })),
              subjectIds: cls.classSubjects.map((cs: any) => cs.subjectId)
            };
          }
          return { ...cls, subjects: [], subjectIds: [] };
        });
        setMasterDataClasses(data);
        localStorage.setItem("masterDataClasses", JSON.stringify(data));
      } else {
        setMasterDataClasses([]);
        localStorage.removeItem("masterDataClasses");
      }
    } catch {
      setMasterDataClasses([]);
      localStorage.removeItem("masterDataClasses");
    }
    // Fetch master data subjects after login
    try {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/MasterData/subjects`, {
        headers: { 'Authorization': `Bearer ${t}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMasterDataSubjects(data);
        localStorage.setItem("masterDataSubjects", JSON.stringify(data));
      } else {
        setMasterDataSubjects([]);
        localStorage.removeItem("masterDataSubjects");
      }
    } catch {
      setMasterDataSubjects([]);
      localStorage.removeItem("masterDataSubjects");
    }
  };

  const logout = () => { 
    localStorage.removeItem("authToken");
    localStorage.removeItem("authRole");
    localStorage.removeItem("authUserGuid");
    localStorage.removeItem("authUserId");
    localStorage.removeItem("masterDataClasses");
    localStorage.removeItem("masterDataSubjects");
    setToken(null);
    setRole(null);
    setUserGuid(null);
    setUserId(null);
    setMasterDataClasses([]);
    setMasterDataSubjects([]);
  };

  return (
    <Ctx.Provider value={{ 
      token, 
      isAuthenticated: !!token,
      role,
      userGuid,
      userId,
      masterDataClasses,
      setMasterDataClasses,
      masterDataSubjects,
      setMasterDataSubjects,
      login, 
      logout 
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);