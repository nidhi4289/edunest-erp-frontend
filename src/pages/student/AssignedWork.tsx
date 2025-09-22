import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen } from "lucide-react";

interface Homework {
  id: string;
  classSubjectId: string;
  details: string;
  assignedDate: string;
  dueDate: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

interface StudentDetails {
  eduNestId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  fatherName: string;
  fatherEmail: string;
  motherName: string;
  motherEmail: string;
  grade: string;
  section: string;
  status: string;
  admissionNumber: string;
  phoneNumber: string;
  secondaryPhoneNumber: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  photo?: string;
}

export default function AssignedWork() {
  const { token, userId } = useAuth();
  const [details, setDetails] = useState<StudentDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [hwLoading, setHwLoading] = useState(false);
  const [hwError, setHwError] = useState("");

  // Fetch student details (reuse logic from MyDetails)
  useEffect(() => {
    if (!userId || !token) return;
    setLoading(true);
  fetch(`${import.meta.env.VITE_API_URL}/students/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch student details");
        return res.json();
      })
      .then((data) => setDetails(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId, token]);

  // Fetch homework after student details are loaded
  useEffect(() => {
    if (!details || !details.grade || !details.section || !token) return;
    setHwLoading(true);
    setHwError("");
  fetch(`${import.meta.env.VITE_API_URL}/api/Homework?grade=${encodeURIComponent(details.grade)}&section=${encodeURIComponent(details.section)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch assigned homework");
        return res.json();
      })
      .then((data) => setHomeworks(data || []))
      .catch((err) => setHwError(err.message))
      .finally(() => setHwLoading(false));
  }, [details, token]);

  return (
    <div className="p-6 space-y-6">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white mb-6">
        <h1 className="text-2xl font-bold">Assigned Work</h1>
        <p className="text-sm opacity-80">View your assigned homework and due dates</p>
      </div>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Assigned Homework
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading || hwLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : error || hwError ? (
            <div className="text-red-600 text-center py-4">{error || hwError}</div>
          ) : homeworks.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Details</TableHead>
                  <TableHead>Assigned Date</TableHead>
                  <TableHead>Due Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {homeworks.map((hw) => (
                  <TableRow key={hw.id}>
                    <TableCell>{hw.details}</TableCell>
                    <TableCell>{hw.assignedDate ? new Date(hw.assignedDate).toLocaleDateString() : ""}</TableCell>
                    <TableCell>{hw.dueDate ? new Date(hw.dueDate).toLocaleDateString() : ""}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">No assigned homework found.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
