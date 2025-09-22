import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen } from "lucide-react";
import { Table as UITable } from "@/components/ui/table";
interface AttendanceRecord {
  date: string;
  status?: string;
  isPresent?: boolean;
  remarks?: string;
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

interface Assessment {
  id: string;
  term: string;
  subject: string;
  marks: number;
  totalMarks: number;
  grade: string;
  date: string;
  remarks?: string;
}


export default function MyDetails() {
  const { token, userId } = useAuth();
  const [details, setDetails] = useState<StudentDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("profile");
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [marksLoading, setMarksLoading] = useState(false);
  const [marksError, setMarksError] = useState("");
  const [academicYear] = useState("2025-26");

  // Attendance state
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState("");

  // Fetch attendance for the logged-in student
  useEffect(() => {
    if (!details || !details.eduNestId || !token) return;
    setAttendanceLoading(true);
    setAttendanceError("");
  fetch(`${import.meta.env.VITE_API_URL}/api/Attendance/student?eduNestId=${encodeURIComponent(details.eduNestId)}&grade=${encodeURIComponent(details.grade)}&section=${encodeURIComponent(details.section)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch attendance records");
        return res.json();
      })
      .then((data) => setAttendance(data || []))
      .catch((err) => setAttendanceError(err.message))
      .finally(() => setAttendanceLoading(false));
  }, [details, token]);

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

  useEffect(() => {
    if (!details || !details.eduNestId || !token) return;
    setMarksLoading(true);
    setMarksError("");
  fetch(`${import.meta.env.VITE_API_URL}/api/StudentMarks/student?eduNestId=${encodeURIComponent(details.eduNestId)}&academicYear=${encodeURIComponent(academicYear)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch academic records");
        return res.json();
      })
      .then((data) => {
        setAssessments((data || []).map((item: any, idx: number) => ({
          id: item.assessmentId || String(idx),
          term: item.assessmentName || '',
          subject: item.subjectName,
          marks: item.marksObtained,
          totalMarks: item.maxMarks,
          grade: item.gradeAwarded,
          date: item.date || '',
          remarks: item.remarks
        })));
      })
      .catch((err) => setMarksError(err.message))
      .finally(() => setMarksLoading(false));
  }, [details, token, academicYear]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white mb-6">
        <h1 className="text-2xl font-bold">My Details</h1>
        <p className="text-sm opacity-80">View your personal and academic information</p>
      </div>

  <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="profile">Personal Details</TabsTrigger>
          <TabsTrigger value="academics">Academic Records</TabsTrigger>
          <TabsTrigger value="attendance">My Attendance</TabsTrigger>
        </TabsList>
        <TabsContent value="attendance">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>My Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              {attendanceLoading && <div className="text-center py-8">Loading attendance...</div>}
              {attendanceError && <div className="text-red-600 text-center py-4">{attendanceError}</div>}
              {attendance.length > 0 ? (
                Object.entries(
                  attendance.reduce((acc, rec) => {
                    const date = new Date(rec.date);
                    const month = date.toLocaleString('default', { month: 'long', year: 'numeric' });
                    if (!acc[month]) acc[month] = [];
                    acc[month].push(rec);
                    return acc;
                  }, {} as Record<string, AttendanceRecord[]>)
                ).map(([month, records]) => (
                  <div key={month} className="mb-8">
                    <div className="font-bold text-indigo-700 text-lg mb-2">{month}</div>
                    <UITable>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Remarks</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {records.map((rec, idx) => (
                          <TableRow key={rec.date + '-' + idx}>
                            <TableCell>{new Date(rec.date).toLocaleDateString()}</TableCell>
                            <TableCell>{rec.isPresent !== undefined ? (rec.isPresent ? 'Present' : 'Absent') : (rec.status || '-')}</TableCell>
                            <TableCell>{rec.remarks || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </UITable>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">No attendance records found.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Student Information</CardTitle>
            </CardHeader>
            <CardContent>
              {loading && <div className="text-center py-8">Loading...</div>}
              {error && <div className="text-red-600 text-center py-4">{error}</div>}
              {details && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>EduNest ID:</Label>
                    <div className="mb-2 font-medium text-neutral-700">{details.eduNestId}</div>
                    <Label>Name:</Label>
                    <div className="mb-2 font-medium text-neutral-700">{details.firstName} {details.lastName}</div>
                    <Label>Date of Birth:</Label>
                    <div className="mb-2 font-medium text-neutral-700">{new Date(details.dateOfBirth).toLocaleDateString()}</div>
                    <Label>Email:</Label>
                    <div className="mb-2 font-medium text-neutral-700">{details.email}</div>
                    <Label>Phone Number:</Label>
                    <div className="mb-2 font-medium text-neutral-700">{details.phoneNumber}</div>
                    <Label>Secondary Phone:</Label>
                    <div className="mb-2 font-medium text-neutral-700">{details.secondaryPhoneNumber || '-'}</div>
                    <Label>Status:</Label>
                    <div className="mb-2 font-medium text-neutral-700">{details.status}</div>
                    <Label>Admission Number:</Label>
                    <div className="mb-2 font-medium text-neutral-700">{details.admissionNumber}</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Grade:</Label>
                    <div className="mb-2 font-medium text-neutral-700">{details.grade}</div>
                    <Label>Section:</Label>
                    <div className="mb-2 font-medium text-neutral-700">{details.section}</div>
                    <Label>Father's Name:</Label>
                    <div className="mb-2 font-medium text-neutral-700">{details.fatherName}</div>
                    <Label>Father's Email:</Label>
                    <div className="mb-2 font-medium text-neutral-700">{details.fatherEmail || '-'}</div>
                    <Label>Mother's Name:</Label>
                    <div className="mb-2 font-medium text-neutral-700">{details.motherName}</div>
                    <Label>Mother's Email:</Label>
                    <div className="mb-2 font-medium text-neutral-700">{details.motherEmail || '-'}</div>
                    <Label>Address:</Label>
                    <div className="mb-2 font-medium text-neutral-700">{details.addressLine1}, {details.addressLine2}, {details.city}, {details.state}, {details.zipCode}, {details.country}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="academics">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Academic Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              {marksLoading && <div className="text-center py-8">Loading academic records...</div>}
              {marksError && <div className="text-red-600 text-center py-4">{marksError}</div>}
              {assessments.length > 0 ? (
                // Group by term
                Object.entries(
                  assessments.reduce((acc, a) => {
                    if (!acc[a.term]) acc[a.term] = [];
                    acc[a.term].push(a);
                    return acc;
                  }, {} as Record<string, Assessment[]>)
                ).map(([term, records]) => (
                  <div key={term} className="mb-8">
                    <div className="font-bold text-indigo-700 text-lg mb-2">{term}</div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Subject</TableHead>
                          <TableHead>Marks</TableHead>
                          <TableHead>Grade</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Remarks</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {records.map((a) => (
                          <TableRow key={a.id + a.subject}>
                            <TableCell>{a.subject}</TableCell>
                            <TableCell>{a.marks}/{a.totalMarks}</TableCell>
                            <TableCell>{a.grade}</TableCell>
                            <TableCell>{a.date ? new Date(a.date).toLocaleDateString() : ""}</TableCell>
                            <TableCell>{a.remarks}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No academic records found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
