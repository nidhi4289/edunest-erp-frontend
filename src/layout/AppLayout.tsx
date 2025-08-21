// src/layout/AppLayout.tsx
import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import {
  Home, Users, GraduationCap, BookOpen, CalendarCheck2,
  FileText, MessageSquare, Settings as SettingsIcon,
  ChevronDown, LogOut, Moon, Sun, Shield, Database, Menu
} from "lucide-react";

// shadcn/ui
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


// ---------- helpers (color utilities) ----------
function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((x) => x + x).join("") : h;
  const bigint = parseInt(full, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}
function alpha(hex: string, a: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
function brandGrad(brand: string, a = 0.14) {
  return `linear-gradient(135deg, ${alpha(brand, a)}, transparent 60%)`;
}

// ---------- demo schools (tenant switcher) ----------
type School = { id: string; name: string; brand: string };
const DEMO_SCHOOLS: School[] = [
  { id: "demo", name: "Green Valley High", brand: "#2563eb" }, // blue-600
  { id: "oak", name: "Oakridge Public School", brand: "#16a34a" }, // green-600
  { id: "sun", name: "Sunrise International", brand: "#f59e0b" }, // amber-500
];

// ---------- small pieces ----------
function BrandButton(
  { children, brand, className = "", ...props }:
  React.ComponentProps<typeof Button> & { brand: string }
) {
  return (
    <Button
      className={`border-0 text-white shadow-sm hover:opacity-95 ${className}`}
      style={{ backgroundColor: brand }}
      {...props}
    >
      {children}
    </Button>
  );
}

// ---------- Sidebar ----------
// Fix the Sidebar component - the issue is around line 124
function Sidebar({
  brand,
  open,
  onClose,
}: {
  brand: string;
  open: boolean;
  onClose: () => void;
}) {
  const items = [
    { to: "/", label: "Dashboard", icon: Home, end: true },
    { to: "/students", label: "Students", icon: Users, end: false },
    { to: "/staff", label: "Staff", icon: GraduationCap, end: false },
    { to: "/classes", label: "Classes", icon: BookOpen, end: false },
    { to: "/attendance", label: "Attendance", icon: CalendarCheck2, end: false },
    { to: "/assessments", label: "Assessments", icon: FileText, end: false },
    { to: "/comms", label: "Comms", icon: MessageSquare, end: false },
    { to: "/settings", label: "Settings", icon: SettingsIcon, end: false },
  ] as const;

  return (
    <>
      {/* overlay for mobile */}
      <div
        className={`fixed inset-0 bg-black/30 lg:hidden transition-opacity ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      <aside
        className={`fixed lg:static z-40 h-full w-64 border-r bg-white/80 backdrop-blur
                    dark:bg-neutral-900/60 dark:border-neutral-800 transition-transform
                    ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="px-4 py-5 flex items-center gap-2">
          <Shield style={{ color: brand }} className="h-6 w-6" />
          <span className="font-semibold text-lg" style={{ color: brand }}>EduNest ERP</span>
        </div>
        <Separator />
        <nav className="px-2 py-4 space-y-1">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.end as boolean | undefined}
              className={({ isActive }) =>
                `w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition
                 hover:bg-neutral-100 dark:hover:bg-neutral-800`
                + (isActive ? " font-medium" : "")
              }
              style={({ isActive }) =>
                isActive ? { background: alpha(brand, 0.10), borderLeft: `3px solid ${brand}` } : undefined
              }
              onClick={onClose}
            >
              <it.icon className="h-4 w-4" />
              {it.label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3">
          <Card className="border-none bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800">
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-sm">Free Tier</CardTitle>
              <CardDescription className="text-xs">Designed to run lean on AWS.</CardDescription>
            </CardHeader>
            <CardContent className="p-3 pt-1">
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <Database className="h-3.5 w-3.5" /> RDS schema-per-tenant
              </div>
            </CardContent>
          </Card>
        </div>
      </aside>
    </>
  );
}

// ---------- Topbar ----------
function Topbar({
  school,
  setSchool,
  dark,
  setDark,
  onMenu,
}: {
  school: School;
  setSchool: (id: string) => void;
  dark: boolean;
  setDark: (b: boolean) => void;
  onMenu: () => void;
}) {
  return (
    <div
      className="h-16 border-b sticky top-0 z-30 flex items-center px-3 md:px-4 gap-3 dark:border-neutral-800"
      style={{ backgroundImage: brandGrad(school.brand, 0.14), backdropFilter: "blur(8px)" }}
    >
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenu} aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </Button>

      {/* School switcher */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 bg-white/70 dark:bg-neutral-900/60">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: school.brand }} />
            <span className="truncate max-w-[180px]">{school.name}</span>
            <ChevronDown className="h-4 w-4 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Switch school</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {DEMO_SCHOOLS.map((s) => (
            <DropdownMenuItem key={s.id} onClick={() => setSchool(s.id)} className="gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: s.brand }} />
              {s.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="h-6 hidden md:block" />

      <div className="flex-1 flex items-center gap-2">
        <div className="relative w-full max-w-md">
          <Input placeholder="Search students, staff, classes…" className="pl-8" />
          {/* decorative icon via background omitted; keep input simple */}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Switch checked={dark} onCheckedChange={setDark} aria-label="Toggle dark mode" />
        {dark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <Avatar className="h-7 w-7 ring-2" style={{ boxShadow: `0 0 0 2px ${alpha(school.brand, 0.25)}` }}>
                <AvatarFallback>AS</AvatarFallback>
              </Avatar>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              Signed in as
              <div className="text-xs text-neutral-500">admin@schoolcrm</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2">
              <SettingsIcon className="h-4 w-4" /> Profile & Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 text-red-600">
              <LogOut className="h-4 w-4" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ---------- AppLayout ----------
export default function AppLayout() {
  const [dark, setDark] = React.useState(false);
  const [schoolId, setSchoolId] = React.useState(DEMO_SCHOOLS[0].id);
  const school = React.useMemo(() => DEMO_SCHOOLS.find((s) => s.id === schoolId)!, [schoolId]);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // brand → CSS var for easy theming
  React.useEffect(() => {
    document.documentElement.style.setProperty("--brand", school.brand);
  }, [school.brand]);

  // dark mode toggle (tailwind v4 prefers .dark on root)
  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <div className="grid grid-cols-1 lg:grid-cols-[16rem_1fr] h-screen">
        <Sidebar brand={school.brand} open={mobileOpen} onClose={() => setMobileOpen(false)} />
        <div className="flex flex-col h-full overflow-hidden">
          <Topbar
            school={school}
            setSchool={setSchoolId}
            dark={dark}
            setDark={setDark}
            onMenu={() => setMobileOpen(true)}
          />
          <main className="flex-1 overflow-y-auto p-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
