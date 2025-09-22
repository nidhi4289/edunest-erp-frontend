import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Comms from "./pages/Comms";
import Settings from "./pages/Settings";
import AppLayout from "./layout/AppLayout";
import { useAuth, AuthProvider } from "./context/AuthContext";
import { ReactNode } from "react";
import FirstReset from "./pages/FirstReset";

// Import admin pages
import AddStudent from "./pages/admin/AddStudent";
import AddBulkStudents from "./pages/admin/AddBulkStudents";
import UpdateStudent from "./pages/admin/UpdateStudent";
import UploadFees from "./pages/admin/UploadFees";
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

function Protected({ children }: { children: ReactNode }) {
  const { token, userId } = useAuth();
  // Check both token and userId presence for complete authentication
  const isFullyAuthenticated = token && userId;
  if (!isFullyAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/first-reset" element={<FirstReset />} />
          
          {/* Protected routes with AppLayout */}
          <Route path="/" element={<Protected><AppLayout /></Protected>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="comms" element={<Comms />} />
            <Route path="settings" element={<Settings />} />
            
            {/* Admin routes */}
            <Route path="admin/add-student" element={<AddStudent />} />
            <Route path="admin/bulk-add-students" element={<AddBulkStudents />} />
            <Route path="admin/update-student" element={<UpdateStudent />} />
            <Route path="admin/upload-fees" element={<UploadFees />} />
            <Route path="admin/comms" element={<ManageComms />} />
            <Route path="admin/add-staff" element={<AddStaff />} />
            <Route path="admin/manage-staff" element={<ManageStaff />} />
            <Route path="admin/master-data-setup" element={<MasterDataSetup />} />
            
            {/* Staff routes */}
            <Route path="staff/upload-attendance" element={<UploadAttendance />} />
            <Route path="staff/upload-marks" element={<UploadMarks />} />
            <Route path="staff/student-details" element={<StudentDetails />} />
            <Route path="staff/assign-homework" element={<AssignHomework />} />
            
            {/* Student routes */}
            <Route path="student/my-details" element={<MyDetails />} />
            <Route path="student/assigned-work" element={<AssignedWork />} />
          </Route>
          
          {/* Catch all - redirect to login if not authenticated, dashboard if authenticated */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
