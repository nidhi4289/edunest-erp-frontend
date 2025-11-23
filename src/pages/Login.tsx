import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LogIn, User, Lock, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated, role } = useAuth();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect authenticated users away from login page
  useEffect(() => {
    if (isAuthenticated && role) {
      // Redirect to appropriate page based on role
      switch (role.toLowerCase()) {
        case 'student':
          navigate("/student/my-details", { replace: true });
          break;
        case 'teacher':
        case 'staff':
          navigate("/staff/upload-attendance", { replace: true });
          break;
        case 'admin':
        case 'principal':
        case 'superadmin':
          navigate("/dashboard", { replace: true });
          break;
        default:
          navigate("/settings", { replace: true });
      }
    }
  }, [isAuthenticated, role, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      console.log('🔐 Starting login process...', {
        userId,
        tenantId: import.meta.env.VITE_TENANT_ID,
        apiBaseURL: import.meta.env.VITE_API_URL
      });
      
      const response = await api.post("/Auth/login", {
        userId,
        password,
        tenantId: import.meta.env.VITE_TENANT_ID
      });

      const { token, role, passwordResetRequired, userGuid, grade, section, classId, className } = response.data;

      if (passwordResetRequired) {
        navigate("/first-reset", { state: { userId, tenantId: import.meta.env.VITE_TENANT_ID } });
        return;
      }

      if (!token) {
        throw new Error("No token received from server");
      }

      // Create topic name for push notifications if user is a student
      let studentData = null;
      if (role?.toLowerCase() === 'student' && grade && section) {
        const schoolId = import.meta.env.VITE_TENANT_ID;
        const topicName = `school_${schoolId}_class_${grade}${section}`;
        console.log('Generated topic name for push notifications:', topicName);
        
        studentData = {
          grade,
          section,
          classId,
          className,
          topicName
        };
      }

      await login(token, role, userGuid, userId, studentData);
      
      // Role-based redirect after login
      switch (role?.toLowerCase()) {
        case 'student':
          navigate("/student/my-details");
          break;
        case 'teacher':
        case 'staff':
          navigate("/staff/upload-attendance");
          break;
        case 'admin':
        case 'principal':
        case 'superadmin':
          navigate("/dashboard");
          break;
        default:
          navigate("/"); // This will trigger RoleBasedRedirect
      }
    } catch (err: any) {
      console.error("❌ Login failed with detailed error:", {
        errorMessage: err.message,
        errorCode: err.code,
        httpStatus: err.response?.status,
        httpStatusText: err.response?.statusText,
        responseData: err.response?.data,
        isNetworkError: !err.response,
        isTimeout: err.code === 'ECONNABORTED',
        requestConfig: {
          url: err.config?.url,
          method: err.config?.method,
          baseURL: err.config?.baseURL,
          timeout: err.config?.timeout
        }
      });
      
      // User-friendly error messages based on error type
      let userError = "Login failed. Please try again.";
      if (!err.response) {
        userError = "Cannot connect to server. Please check your internet connection.";
      } else if (err.response.status >= 500) {
        userError = "Server error. Please try again later.";
      } else if (err.response?.data?.message) {
        userError = err.response.data.message;
      }
      
      setError(userError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-800 flex items-center">
      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-700/30 to-indigo-800/40"></div>
        <div className="absolute inset-0 opacity-30">
          <div className="w-full h-full bg-gradient-to-br from-transparent via-white/5 to-transparent"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center p-12 text-white text-center">
          {/* Logo above EduNest ERP title */}
          <div className="mb-8">
            <img 
              src="/OnlyLogo.png" 
              alt="EduNest Logo" 
              className="h-36 w-36 object-contain mx-auto drop-shadow-2xl"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="h-36 w-36 hidden bg-white/20 backdrop-blur-lg rounded-3xl flex items-center justify-center shadow-2xl border border-white/30 mx-auto">
              <LogIn className="h-18 w-18 text-white drop-shadow-lg" />
            </div>
          </div>
          
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
            EduNest ERP
          </h1>
          <p className="text-xl text-blue-100 mb-8 max-w-md leading-relaxed">
            Empowering Educational Excellence Through Smart Management
          </p>
          
          {/* Feature Points */}
          <div className="space-y-4 max-w-sm">
            <div className="flex items-center gap-3 text-blue-100">
              <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
              <span>Comprehensive Student Management</span>
            </div>
            <div className="flex items-center gap-3 text-blue-100">
              <div className="w-2 h-2 bg-purple-300 rounded-full"></div>
              <span>Advanced Analytics & Reporting</span>
            </div>
            <div className="flex items-center gap-3 text-blue-100">
              <div className="w-2 h-2 bg-indigo-300 rounded-full"></div>
              <span>Secure Cloud-Based Platform</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-8 bg-white relative min-h-screen lg:min-h-0">
        {/* Mobile Logo (visible only on small screens) */}
        <div className="lg:hidden absolute top-8 left-1/2 transform -translate-x-1/2">
          <img 
            src="/OnlyLogo.png" 
            alt="EduNest Logo" 
            className="h-16 w-16 object-contain drop-shadow-2xl"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <div className="h-16 w-16 hidden bg-white/20 backdrop-blur-lg rounded-3xl flex items-center justify-center shadow-2xl border border-white/30">
            <LogIn className="h-8 w-8 text-gray-600 drop-shadow-lg" />
          </div>
        </div>

        {/* Login Card */}
        <div className="w-full max-w-md mt-20 lg:mt-0">
          {/* Welcome Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h2>
            <p className="text-gray-600">Please sign in to your account</p>
          </div>

          {/* Login Form */}
          <Card className="shadow-2xl border-0 bg-white">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* User ID Field */}
                <div className="space-y-2">
                  <Label htmlFor="userId" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600" />
                    User ID
                  </Label>
                  <div className="relative">
                    <Input
                      id="userId"
                      type="text"
                      placeholder="Enter your user ID"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      required
                      disabled={loading}
                      autoCapitalize="none"
                      autoCorrect="off"
                      autoComplete="username"
                      spellCheck={false}
                      className="pl-12 h-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 rounded-xl"
                    />
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                </div>
                
                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-blue-600" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      autoCapitalize="none"
                      autoCorrect="off"
                      autoComplete="current-password"
                      className="pl-12 pr-12 h-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 rounded-xl"
                    />
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      disabled={loading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="flex items-start gap-3 text-sm text-red-600 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <span className="font-medium">{error}</span>
                  </div>
                )}
                
                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold text-base rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl shadow-lg" 
                  disabled={loading}
                >
                  <LogIn className="h-5 w-5 mr-3" />
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
              
              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-2">
                    Secure access to your education management platform
                  </p>
                  <p className="text-xs text-gray-400">
                    © 2025 EduNest ERP. All rights reserved.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Having trouble? 
              <span className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer ml-1">
                Contact your system administrator
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}