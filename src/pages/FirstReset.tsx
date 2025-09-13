import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { api } from "@/services/api";

export default function FirstReset() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userId, tenantId } = location.state || {};
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      await api.post("/Auth/first-reset", {
        userId,
        tenantId,
        newPassword
      });
      setSuccess(true);
      // Optionally redirect to login after success
      setTimeout(() => navigate("/login"), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Password reset failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Set New Password</h2>
      <form onSubmit={handleSubmit}>
        <label className="block mb-2">New Password</label>
        <input
          type="password"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          className="w-full p-2 border rounded mb-4"
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded"
          disabled={loading}
        >
          {loading ? "Setting..." : "Set Password"}
        </button>
      </form>
      {error && <div className="text-red-600 mt-2">{error}</div>}
      {success && <div className="text-green-600 mt-2">Password reset successful! Redirecting to login...</div>}
    </div>
  );
}