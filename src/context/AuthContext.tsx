import { createContext, useContext, useEffect, useState } from "react";
import { PushNotificationService } from "@/services/pushNotifications";

type StudentData = {
  grade: string;
  section: string;
  classId: string;
  className: string;
  topicName?: string;
};

type AuthCtx = {
  token: string | null;
  isAuthenticated: boolean;
  role: string | null;
  userGuid: string | null;
  userId: string | null;
  studentData: StudentData | null;
  masterDataClasses: any[];
  setMasterDataClasses: (data: any[]) => void;
  masterDataSubjects: any[];
  setMasterDataSubjects: (data: any[]) => void;
  login: (t: string, r: string, u: string, userId: string, studentData?: StudentData) => Promise<void>;
  logout: () => void;
};

const Ctx = createContext<AuthCtx>({ 
  token: null, 
  isAuthenticated: false,
  role: null,
  userGuid: null,
  userId: null,
  studentData: null,
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
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [masterDataClasses, setMasterDataClasses] = useState<any[]>([]);
  const [masterDataSubjects, setMasterDataSubjects] = useState<any[]>([]);

  useEffect(() => { 
    const storedToken = localStorage.getItem("authToken");
    const storedRole = localStorage.getItem("authRole");
    const storedUserGuid = localStorage.getItem("authUserGuid");
    const storedUserId = localStorage.getItem("authUserId");
    const storedStudentData = localStorage.getItem("authStudentData");
    
    // Check if we have a complete session (token and userId)
    // If incomplete, clear everything to prevent partial authentication
    if (storedToken && !storedUserId) {
      console.warn("Incomplete authentication session detected. Clearing storage.");
      localStorage.removeItem("authToken");
      localStorage.removeItem("authRole");
      localStorage.removeItem("authUserGuid");
      localStorage.removeItem("authUserId");
      localStorage.removeItem("authStudentData");
      localStorage.removeItem("masterDataClasses");
      localStorage.removeItem("masterDataSubjects");
      return;
    }
    
    // If we have a token, validate it with the server
    if (storedToken && storedUserId) {
      const parsedStudentData = storedStudentData ? JSON.parse(storedStudentData) : null;
      validateToken(storedToken, storedRole, storedUserGuid, storedUserId, parsedStudentData);
    }
  }, []);

  const validateToken = async (token: string, role: string | null, userGuid: string | null, userId: string | null, studentData: StudentData | null = null) => {
    try {
      // Try to make a simple authenticated request to validate the token
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/MasterData/classes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        // Token is valid, set the auth state
        setToken(token);
        setRole(role);
        setUserGuid(userGuid);
        setUserId(userId);
        setStudentData(studentData);
        
        // Load master data from localStorage or fetch fresh
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
      } else {
        // Token is invalid or expired, clear everything
        console.warn("Stored token is invalid or expired. Clearing authentication.");
        clearAuthData();
      }
    } catch (error) {
      // Network error or other issues, clear auth data to be safe
      console.warn("Token validation failed. Clearing authentication.", error);
      clearAuthData();
    }
  };

  const clearAuthData = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authRole");
    localStorage.removeItem("authUserGuid");
    localStorage.removeItem("authUserId");
    localStorage.removeItem("authStudentData");
    localStorage.removeItem("masterDataClasses");
    localStorage.removeItem("masterDataSubjects");
    setToken(null);
    setRole(null);
    setUserGuid(null);
    setUserId(null);
    setStudentData(null);
    setMasterDataClasses([]);
    setMasterDataSubjects([]);
  };

  const login = async (t: string, r: string, u: string, userId: string, studentData?: StudentData) => { 
    localStorage.setItem("authToken", t);
    localStorage.setItem("authRole", r);
    localStorage.setItem("authUserGuid", u);
    localStorage.setItem("authUserId", userId);
    
    if (studentData) {
      localStorage.setItem("authStudentData", JSON.stringify(studentData));
      setStudentData(studentData);
    }
    
    setToken(t);
    setRole(r);
    setUserGuid(u);
    setUserId(userId);
    
    // Initialize push notifications after login
    try {
      await PushNotificationService.initialize();
      console.log('Push notifications initialized');
    } catch (error) {
      console.log('Push notifications initialization failed:', error);
    }
    
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
    clearAuthData();
  };

  return (
    <Ctx.Provider value={{ 
      token, 
      isAuthenticated: !!token,
      role,
      userGuid,
      userId,
      studentData,
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