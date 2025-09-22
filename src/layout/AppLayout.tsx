import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { 
  Home, Users, GraduationCap, MessageSquare, Settings as SettingsIcon, 
  Shield, UserPlus, Edit, DollarSign, FileSpreadsheet,
  ChevronDown, ChevronRight, Menu, X, Clock, UserCheck, 
  BookOpen, ClipboardList, FileText, User, LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
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
  const { logout, userId, role } = useAuth();
  const navigate = useNavigate();

  // Get user role from AuthContext
  type UserRole = "Admin" | "Teacher" | "Student";
  const userRole: UserRole = (role as UserRole) || "Student";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Base navigation items for all users
  const baseItems = [
    { to: "/comms", label: "Comms", icon: MessageSquare, end: false },
  ] as const;
  
  // Student nav: My Details as child under Student parent if role is Student
  const studentItems = [
    { to: "/student/my-details", label: "My Details", icon: BookOpen, end: false },
  ];
  const [studentExpanded, setStudentExpanded] = useState(false);

  // Staff sub-items (only for staff and admin)
  const staffItems = [
    { to: "/staff/upload-attendance", label: "Upload Attendance", icon: Clock },
    { to: "/staff/upload-marks", label: "Upload Marks", icon: FileText },
    { to: "/staff/student-details", label: "Student Details", icon: UserCheck },
    { to: "/staff/assign-homework", label: "Assign Homework", icon: ClipboardList },
  ] as const;

  // Admin sub-items (only for admin)
 const adminItems = [
  { to: "/dashboard", label: "Dashboard", icon: Home, end: true },
  { to: "/admin/add-student", label: "Add Student", icon: UserPlus },
  { to: "/admin/bulk-add-students", label: "Add Bulk Students", icon: UserPlus },
  { to: "/admin/update-student", label: "Update Student", icon: Edit },
  { to: "/admin/upload-fees", label: "Upload Fees", icon: DollarSign },
  { to: "/admin/comms", label: "Communications", icon: MessageSquare },
  { to: "/admin/add-staff", label: "Add Staff", icon: UserPlus },
  { to: "/admin/manage-staff", label: "Manage Staff", icon: Users },
  { to: "/admin/master-data-setup", label: "Master Data Setup", icon: FileSpreadsheet },
] as const;

  // Determine what to show based on role
  const showAdminItems: boolean = userRole === "Admin";
  const showStaffItems: boolean = userRole === "Admin" || userRole === "Teacher";

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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-3 h-auto p-2 hover:bg-gray-50">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: brand }}
                  >
                    <User className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-sm">Profile</div>
                    <div className="text-xs text-gray-500 capitalize">{userRole}</div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-sm">
                  <div className="font-medium">User ID: {userId}</div>
                  <div className="text-gray-500 capitalize">Role: {userRole}</div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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

          {/* Student Section (visible only to Student) */}
          {userRole === "Student" && (
            <div className="space-y-1">
              <button
                onClick={() => setStudentExpanded(!studentExpanded)}
                className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4" />
                  Student
                </div>
                {studentExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>

              {/* Student Sub-items */}
              {studentExpanded && (
                <div className="ml-4 space-y-1 border-l-2 border-neutral-100 pl-3">
                  {studentItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
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

          {/* Staff Section (visible to staff and admin, not Student) */}
          {userRole !== "Student" && showStaffItems && (
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

          {/* Admin Section (visible only to admin, not Student) */}
          {userRole !== "Student" && showAdminItems && (
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
          <div className="text-xs text-center text-gray-500">
            EduNest ERP v1.0
          </div>
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