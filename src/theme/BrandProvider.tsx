import { createContext, useContext, useLayoutEffect, useState } from "react";
const Ctx = createContext<{brand:string,setBrand:(c:string)=>void}>({brand:"#2563eb",setBrand:()=>{}});
export function BrandProvider({initial="#2563eb", children}:{initial?:string; children:React.ReactNode}) {
  const [brand, setBrand] = useState(initial);
  useLayoutEffect(() => { document.documentElement.style.setProperty("--brand", brand); }, [brand]);
  return <Ctx.Provider value={{brand, setBrand}}>{children}</Ctx.Provider>;
}
export const useBrand = () => useContext(Ctx);
