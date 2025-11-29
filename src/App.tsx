import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Comms from "./pages/Comms";
import Settings from "./pages/Settings";
import AppLayout from "./layout/AppLayout";
import { useAuth, AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ReactNode, useEffect } from "react";
import FirstReset from "./pages/FirstReset";
import { PushNotificationService } from "./services/pushNotifications";

// Import admin pages
import AddStudent from "./pages/admin/AddStudent";
import AddBulkStudents from "./pages/admin/AddBulkStudents";
import UpdateStudent from "./pages/admin/UpdateStudent";
// Import accounts pages
import UploadBulkFees from "./pages/accounts/UploadBulkFees";
import FeeManagement from "./pages/accounts/FeeManagement";
import ManageComms from "./pages/admin/ManageComms";
import AddStaff from "./pages/admin/AddStaff";
import ManageStaff from "./pages/admin/ManageStaff";
import MasterDataSetup from "./pages/admin/MasterDataSetup";

// Import staff pages
import UploadAttendance from "./pages/staff/UploadAttendance";
import UploadMarks from "./pages/staff/UploadMarks";
import StudentDetails from "./pages/staff/StudentDetails";
import AssignHomework from "./pages/staff/AssignHomework";

// Import student pages
import MyDetails from "./pages/student/MyDetails";
import AssignedWork from "./pages/student/AssignedWork";

// Import shared pages
import NotificationDetails from "./pages/NotificationDetails";

function Protected({ children }: { children: ReactNode }) {
  const { token, userId } = useAuth();
  // Check both token and userId presence for complete authentication
  const isFullyAuthenticated = token && userId;
  if (!isFullyAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RoleBasedRedirect() {
  const { role } = useAuth();
  
  // If role is not loaded yet, show loading
  if (!role) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading...</span>
      </div>
    );
  }
  
  // Redirect to appropriate default page based on user role
  switch (role.toLowerCase()) {
    case 'student':
      return <Navigate to="/student/my-details" replace />;
    case 'teacher':
    case 'staff':
      return <Navigate to="/staff/upload-attendance" replace />;
    case 'admin':
    case 'principal':
    case 'superadmin':
      return <Navigate to="/dashboard" replace />;
    default:
      // Fallback for unknown roles - redirect to settings
      return <Navigate to="/settings" replace />;
  }
}

function RoleProtected({ children, allowedRoles }: { children: ReactNode, allowedRoles: string[] }) {
  const { role } = useAuth();
  
  // If role is not loaded yet, show loading
  if (!role) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading...</span>
      </div>
    );
  }
  
  if (!allowedRoles.includes(role.toLowerCase())) {
    // Redirect to appropriate page based on user's actual role
    return <RoleBasedRedirect />;
  }
  
  return <>{children}</>;
}

function AppWithNavigation() {
  const navigate = useNavigate();
  
  useEffect(() => {
    console.log('🔗 Setting up navigation callback for push notifications');
    
    // Set up navigation callback for push notifications
    PushNotificationService.setNavigationCallback((path: string) => {
      console.log(`📍 Navigation callback called with path: ${path}`);
      try {
        navigate(path);
        console.log(`✅ Navigation successful to: ${path}`);
      } catch (error) {
        console.error(`❌ Navigation failed to ${path}:`, error);
      }
    });
    
    console.log('✅ Navigation callback registered successfully');
    
    return () => {
      console.log('🧹 Cleaning up navigation callback');
      // Clean up callback on unmount
      PushNotificationService.setNavigationCallback(() => {});
    };
  }, [navigate]);
  
  return (
    <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/first-reset" element={<FirstReset />} />
          
          {/* Protected routes with AppLayout */}
          <Route path="/" element={<Protected><AppLayout /></Protected>}>
            <Route index element={<RoleBasedRedirect />} />
            
            {/* Dashboard - Admin/Principal/SuperAdmin only */}
            <Route path="dashboard" element={
              <RoleProtected allowedRoles={['admin', 'principal', 'superadmin']}>
                <Dashboard />
              </RoleProtected>
            } />
            
            {/* Communications - All roles can access */}
            <Route path="comms" element={<Comms />} />
            
            {/* Settings - All roles can access */}
            <Route path="settings" element={<Settings />} />
            
            {/* Notifications - All roles can access */}
            <Route path="notifications" element={<NotificationDetails />} />
            
            {/* Admin routes - Admin/Principal/SuperAdmin only */}
            <Route path="admin/add-student" element={
              <RoleProtected allowedRoles={['admin', 'principal', 'superadmin']}>
                <AddStudent />
              </RoleProtected>
            } />
            <Route path="admin/bulk-add-students" element={
              <RoleProtected allowedRoles={['admin', 'principal', 'superadmin']}>
                <AddBulkStudents />
              </RoleProtected>
            } />
            <Route path="admin/update-student" element={
              <RoleProtected allowedRoles={['admin', 'principal', 'superadmin']}>
                <UpdateStudent />
              </RoleProtected>
            } />
            <Route path="accounts/upload-bulk-fees" element={
              <RoleProtected allowedRoles={['admin', 'principal', 'superadmin']}>
                <UploadBulkFees />
              </RoleProtected>
            } />
            <Route path="accounts/fee-management" element={
              <RoleProtected allowedRoles={['admin', 'principal', 'superadmin']}>
                <FeeManagement />
              </RoleProtected>
            } />
            <Route path="admin/comms" element={
              <RoleProtected allowedRoles={['admin', 'principal', 'superadmin']}>
                <ManageComms />
              </RoleProtected>
            } />
            <Route path="admin/add-staff" element={
              <RoleProtected allowedRoles={['admin', 'principal', 'superadmin']}>
                <AddStaff />
              </RoleProtected>
            } />
            <Route path="admin/manage-staff" element={
              <RoleProtected allowedRoles={['admin', 'principal', 'superadmin']}>
                <ManageStaff />
              </RoleProtected>
            } />
            <Route path="admin/master-data-setup" element={
              <RoleProtected allowedRoles={['admin', 'principal', 'superadmin']}>
                <MasterDataSetup />
              </RoleProtected>
            } />
            
            {/* Staff routes - Staff/Teacher/Admin/Principal/SuperAdmin */}
            <Route path="staff/upload-attendance" element={
              <RoleProtected allowedRoles={['staff', 'teacher', 'admin', 'principal', 'superadmin']}>
                <UploadAttendance />
              </RoleProtected>
            } />
            <Route path="staff/upload-marks" element={
              <RoleProtected allowedRoles={['staff', 'teacher', 'admin', 'principal', 'superadmin']}>
                <UploadMarks />
              </RoleProtected>
            } />
            <Route path="staff/student-details" element={
              <RoleProtected allowedRoles={['staff', 'teacher', 'admin', 'principal', 'superadmin']}>
                <StudentDetails />
              </RoleProtected>
            } />
            <Route path="staff/assign-homework" element={
              <RoleProtected allowedRoles={['staff', 'teacher', 'admin', 'principal', 'superadmin']}>
                <AssignHomework />
              </RoleProtected>
            } />
            
            {/* Student routes - Student/Admin/Principal/SuperAdmin (admin can view student pages for support) */}
            <Route path="student/my-details" element={
              <RoleProtected allowedRoles={['student', 'admin', 'principal', 'superadmin']}>
                <MyDetails />
              </RoleProtected>
            } />
            <Route path="student/assigned-work" element={
              <RoleProtected allowedRoles={['student', 'admin', 'principal', 'superadmin']}>
                <AssignedWork />
              </RoleProtected>
            } />
          </Route>
          
          {/* Catch all - redirect based on role */}
          <Route path="*" element={<Protected><RoleBasedRedirect /></Protected>} />
        </Routes>
  );
}
function PushInit() {
  useEffect(() => {
    console.log("🚀 Initializing Push Notification Service AFTER NotificationProvider is ready");
    PushNotificationService.initialize();
  }, []);

  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <AppWithNavigation />
          <PushInit />   {/* 🔥 ADD THIS */}
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}
