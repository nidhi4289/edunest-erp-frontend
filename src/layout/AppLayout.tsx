import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { 
  Home, Users, GraduationCap, MessageSquare, Settings as SettingsIcon, 
  Shield, UserPlus, Edit, DollarSign, FileSpreadsheet,
  ChevronDown, ChevronRight, Menu, X, Clock, UserCheck, 
  BookOpen, ClipboardList
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBrand } from "@/theme/BrandProvider";
import { useAuth } from "@/context/AuthContext";

function Sidebar({
  brand,
  open,
  onClose,
}: {
  brand: string;
  open: boolean;
  onClose: () => void;
}) {
  const [adminExpanded, setAdminExpanded] = useState(false);
  const [staffExpanded, setStaffExpanded] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Hardcode role as admin for testing
  type UserRole = "admin" | "staff" | "student";
  const userRole: UserRole = "admin"; // Change this to 'staff' or 'student' to test other roles

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Base navigation items for all users
  const baseItems = [
    { to: "/comms", label: "Comms", icon: MessageSquare, end: false },
  ] as const;
  
  // Items visible to all roles
  const studentItems = [
    { to: "/students", label: "Students", icon: Users, end: false },
  ] as const;

  // Staff sub-items (only for staff and admin)
  const staffItems = [
    { to: "/staff/upload-attendance", label: "Upload Attendance", icon: Clock },
    { to: "/staff/student-details", label: "Student Details", icon: UserCheck },
    { to: "/staff/assign-homework", label: "Assign Homework", icon: ClipboardList },
    { to: "/staff/create-lesson-plan", label: "Create Lesson Plan", icon: BookOpen },
  ] as const;

  // Admin sub-items (only for admin)
 const adminItems = [
  { to: "/dashboard", label: "Dashboard", icon: Home, end: true },
  { to: "/admin/bulk-add-students", label: "Add Bulk Students", icon: UserPlus },
  { to: "/admin/update-student", label: "Update Student", icon: Edit },
  { to: "/admin/upload-fees", label: "Upload Fees", icon: DollarSign },
  { to: "/admin/comms", label: "Communications", icon: MessageSquare },
] as const;

  // Determine what to show based on role
  const showAdminItems: boolean = userRole === "admin";
  const showStaffItems: boolean = userRole === "admin" || userRole === "staff";

  return (
    <>
      {/* Backdrop for mobile */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-neutral-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: brand }}
              >
                E
              </div>
              <div>
                <span className="font-semibold text-lg">EduNest ERP</span>
                <p className="text-xs text-gray-500 capitalize">{userRole} Dashboard</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="lg:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {/* Base Navigation Items (Comms) */}
          {baseItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-neutral-600 hover:bg-neutral-100"
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}

          {/* Student Items (Students page - visible to all) */}
          { studentItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-neutral-600 hover:bg-neutral-100"
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}

          {/* Staff Section (visible to staff and admin) */}
          {showStaffItems && (
            <div className="space-y-1">
              <button
                onClick={() => setStaffExpanded(!staffExpanded)}
                className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <GraduationCap className="h-4 w-4" />
                  Staff
                </div>
                {staffExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>

              {/* Staff Sub-items */}
              {staffExpanded && (
                <div className="ml-4 space-y-1 border-l-2 border-neutral-100 pl-3">
                  {staffItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "text-neutral-500 hover:bg-neutral-50"
                        }`
                      }
                    >
                      <item.icon className="h-3 w-3" />
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Admin Section (visible only to admin) */}
          {showAdminItems && (
            <div className="space-y-1">
              <button
                onClick={() => setAdminExpanded(!adminExpanded)}
                className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4" />
                  Admin
                </div>
                {adminExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>

              {/* Admin Sub-items */}
              {adminExpanded && (
                <div className="ml-4 space-y-1 border-l-2 border-neutral-100 pl-3">
                  {adminItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "text-neutral-500 hover:bg-neutral-50"
                        }`
                      }
                    >
                      <item.icon className="h-3 w-3" />
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Settings (visible to all) */}
          <NavLink
            to="/settings"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`
            }
          >
            <SettingsIcon className="h-4 w-4" />
            Settings
          </NavLink>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200">
          <div className="mb-2 text-xs text-gray-500">
            Testing as: <span className="font-medium capitalize text-blue-600">{userRole}</span>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </aside>
    </>
  );
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { brand } = useBrand();

  return (
    <div className="min-h-screen bg-neutral-50">
      <Sidebar 
        brand={brand} 
        open={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      <div className="lg:ml-64">
        {/* Top bar for mobile */}
        <header className="lg:hidden bg-white border-b border-neutral-200 p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </header>

        {/* Main content */}
        <main className="min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
}