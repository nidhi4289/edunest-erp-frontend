import MyDetails from "@/pages/student/MyDetails";
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import AppLayout from "@/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Settings from "@/pages/Settings";
import Login from "@/pages/Login";
import AddBulkStudents from "@/pages/admin/AddBulkStudents";
import UpdateStudent from "@/pages/admin/UpdateStudent";
import UploadFees from "@/pages/admin/UploadFees";
import ManageComms from "@/pages/admin/ManageComms";
import Comms from "@/pages/Comms";
import UploadAttendance from "@/pages/staff/UploadAttendance";
import StudentDetails from "@/pages/staff/StudentDetails";
import "./index.css";
import FirstReset from "./pages/FirstReset";
import AddStudent from "./pages/admin/AddStudent";
import UploadMarks from "@/pages/staff/UploadMarks";
import AssignHomework from "@/pages/staff/AssignHomework";
import AddStaff from "@/pages/admin/AddStaff";
import ManageStaff from "@/pages/admin/ManageStaff";
import MasterDataSetup from "./pages/admin/MasterDataSetup";
import AssignWork from "@/pages/student/AssignedWork";

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, userId } = useAuth();
  // Check both authentication status and userId presence
  const isFullyAuthenticated = isAuthenticated && userId;
  return isFullyAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Root redirect component
const RootRedirect = () => {
  return <Navigate to="/login" replace />;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootRedirect />
  },
  {
    path: "/login",
    element: <Login />
  },
  {
    path: "/first-reset",
    element: <FirstReset />
  },
  {
    path: "/",
    element: <ProtectedRoute><AppLayout /></ProtectedRoute>,
    children: [
      { path: "/dashboard", element: <Dashboard /> },
      { path: "/settings", element: <Settings /> },
      { path: "/admin/bulk-add-students", element: <AddBulkStudents /> },
      { path: "/admin/add-student", element: <AddStudent /> },
      { path: "/admin/update-student", element: <UpdateStudent /> },
      { path: "/admin/upload-fees", element: <UploadFees /> },
      { path: "/admin/comms", element: <ManageComms /> },
      { path: "/admin/add-staff", element: <AddStaff /> },
      { path: "/admin/manage-staff", element: <ManageStaff /> },
      { path: "/admin/master-data-setup", element: <MasterDataSetup /> },
      { path: "/comms", element: <Comms /> },
      { path: "/staff/upload-attendance", element: <UploadAttendance /> },
      { path: "/staff/student-details", element: <StudentDetails /> },
      { path: "/staff/upload-marks", element: <UploadMarks /> },
      { path: "/staff/assign-homework", element: <AssignHomework /> },
      { path: "/student/my-details", element: <MyDetails /> },
      { path: "/student/assigned-work", element: <AssignWork /> }
    ],
  },
]);

const App = () => {
  return (
    <React.StrictMode>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </React.StrictMode>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);