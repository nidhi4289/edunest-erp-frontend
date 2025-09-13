import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tenantId, setTenantId] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const response = await api.post("/Auth/login", {
        userId,
        password,
        tenantId
      });

      const { token, role, passwordResetRequired, userGuid } = response.data;

      if (passwordResetRequired) {
        navigate("/first-reset", { state: { userId, tenantId } });
        return;
      }

      if (!token) {
        throw new Error("No token received from server");
      }

      login(token, role, userGuid); // Pass userGuid to context
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">EduNest ERP</CardTitle>
          <p className="text-neutral-600">Sign in to your account</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="userId" className="text-sm font-medium">User ID</label>
              <Input
                id="userId"
                type="text"
                placeholder="Enter your user ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
              <div className="space-y-2">
              <label htmlFor="tenantId" className="text-sm font-medium">Tenant ID</label>
              <Input
                id="tenantId"
                type="text"
                placeholder="Enter tenant id"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          
          <div className="mt-4 text-xs text-neutral-500 text-center">
            Enter your credentials
          </div>
        </CardContent>
      </Card>
    </div>
  );
}