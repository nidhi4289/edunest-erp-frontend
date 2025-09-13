
// ...existing imports...

interface AttendanceRecord {
  date: string;
  status?: string;
  isPresent?: boolean;
  remarks?: string;
}
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
// ...existing code...
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search, User, BookOpen, TrendingUp, FileText, Calendar, Phone, MapPin, Users, Printer, Download } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
// import { api } from "@/services/api"; // Commented out since backend not present

interface Student {
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

interface Marksheet {
  id: string;
  studentId: string;
  term: string;
  grade: string;
  academicYear: string;
  assessments: Assessment[];
  totalMarks: number;
  percentage: number;
  overallGrade: string;
  rank: number;
  totalStudents: number;
  date: string;
}

interface SearchCriteria {
  firstName: string;
  lastName: string;
  grade: string;
}

// ...existing code...

export default function StudentDetails() {

  // All state declarations first
  const { token } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
    firstName: "",
    lastName: "",
    grade: ""
  });
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [marksheets, setMarksheets] = useState<Marksheet[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [studentMarks, setStudentMarks] = useState<any[]>([]);
  const [marksLoading, setMarksLoading] = useState(false);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('2025-26');
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState<string | null>(null);
  const [openRemarkModal, setOpenRemarkModal] = useState<string | null>(null);
  const [teacherRemark, setTeacherRemark] = useState("");
  const [pendingMarksheet, setPendingMarksheet] = useState<any>(null);

  // Attendance fetching effect (must be after activeTab and selectedStudent are declared)
  useEffect(() => {
    const fetchAttendance = async () => {
      if (!selectedStudent) return;
      setAttendanceLoading(true);
      try {
        const res = await fetch(`http://localhost:5199/api/Attendance/student?eduNestId=${encodeURIComponent(selectedStudent.eduNestId)}&grade=${encodeURIComponent(selectedStudent.grade)}&section=${encodeURIComponent(selectedStudent.section)}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        if (res.ok) {
          const data = await res.json();
          setAttendance(data || []);
        } else {
          setAttendance([]);
        }
      } catch (e) {
        setAttendance([]);
      } finally {
        setAttendanceLoading(false);
      }
    };
    if (activeTab === "attendance" && selectedStudent) {
      fetchAttendance();
    }
    // eslint-disable-next-line
  }, [activeTab, selectedStudent]);

  // Attendance fetching effect (must be after activeTab and selectedStudent are declared)
  useEffect(() => {
    const fetchAttendance = async () => {
      if (!selectedStudent) return;
      setAttendanceLoading(true);
      try {
        const res = await fetch(`http://localhost:5199/api/Attendance/student?eduNestId=${encodeURIComponent(selectedStudent.eduNestId)}&grade=${encodeURIComponent(selectedStudent.grade)}&section=${encodeURIComponent(selectedStudent.section)}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        if (res.ok) {
          const data = await res.json();
          setAttendance(data || []);
        } else {
          setAttendance([]);
        }
      } catch (e) {
        setAttendance([]);
      } finally {
        setAttendanceLoading(false);
      }
    };
    if (activeTab === "attendance" && selectedStudent) {
      fetchAttendance();
    }
    // eslint-disable-next-line
  }, [activeTab, selectedStudent]);

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!selectedStudent) return;
      setAttendanceLoading(true);
      try {
        const res = await fetch(`http://localhost:5199/api/Attendance/student?eduNestId=${encodeURIComponent(selectedStudent.eduNestId)}&grade=${encodeURIComponent(selectedStudent.grade)}&section=${encodeURIComponent(selectedStudent.section)}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        if (res.ok) {
          const data = await res.json();
          setAttendance(data || []);
        } else {
          setAttendance([]);
        }
      } catch (e) {
        setAttendance([]);
      } finally {
        setAttendanceLoading(false);
      }
    };
    if (activeTab === "attendance" && selectedStudent) {
      fetchAttendance();
    }
    // eslint-disable-next-line
  }, [activeTab, selectedStudent]);

  // Refs for print content
  const printRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Generate a default avatar SVG
  const generateDefaultAvatar = (firstName: string, lastName: string) => {
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="150" height="150" xmlns="http://www.w3.org/2000/svg">
        <rect width="150" height="150" fill="#4F46E5"/>
        <text x="75" y="85" font-family="Arial, sans-serif" font-size="60" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">${initials}</text>
      </svg>
    `)}`;
  };

  // No mockStudents, will fetch from backend

  const mockMarksheets: Marksheet[] = [
    {
      id: "1",
      studentId: "1",
      term: "First Term",
      grade: "Grade 8",
      academicYear: "2023-24",
      assessments: [
        { id: "1", term: "First Term", subject: "Mathematics", marks: 85, totalMarks: 100, grade: "A", date: "2023-10-15", remarks: "Excellent" },
        { id: "2", term: "First Term", subject: "Science", marks: 78, totalMarks: 100, grade: "B+", date: "2023-10-16", remarks: "Good" },
        { id: "3", term: "First Term", subject: "English", marks: 92, totalMarks: 100, grade: "A+", date: "2023-10-17", remarks: "Outstanding" },
        { id: "4", term: "First Term", subject: "Social Studies", marks: 80, totalMarks: 100, grade: "A-", date: "2023-10-18", remarks: "Very Good" },
        { id: "5", term: "First Term", subject: "Hindi", marks: 75, totalMarks: 100, grade: "B", date: "2023-10-19", remarks: "Good" }
      ],
      totalMarks: 410,
      percentage: 82,
      overallGrade: "A",
      rank: 5,
      totalStudents: 45,
      date: "2023-10-20"
    },
    {
      id: "2",
      studentId: "1",
      term: "Second Term",
      grade: "Grade 8",
      academicYear: "2023-24",
      assessments: [
        { id: "6", term: "Second Term", subject: "Mathematics", marks: 88, totalMarks: 100, grade: "A", date: "2024-01-15", remarks: "Excellent" },
        { id: "7", term: "Second Term", subject: "Science", marks: 82, totalMarks: 100, grade: "A-", date: "2024-01-16", remarks: "Very Good" },
        { id: "8", term: "Second Term", subject: "English", marks: 90, totalMarks: 100, grade: "A+", date: "2024-01-17", remarks: "Outstanding" },
        { id: "9", term: "Second Term", subject: "Social Studies", marks: 85, totalMarks: 100, grade: "A", date: "2024-01-18", remarks: "Excellent" },
        { id: "10", term: "Second Term", subject: "Hindi", marks: 79, totalMarks: 100, grade: "B+", date: "2024-01-19", remarks: "Good" }
      ],
      totalMarks: 424,
      percentage: 84.8,
      overallGrade: "A",
      rank: 3,
      totalStudents: 45,
      date: "2024-01-20"
    }
  ];

  // Show modal to enter remarks before printing
  const handlePrintReportCard = (marksheet: Marksheet) => {
    setPendingMarksheet(marksheet);
    setTeacherRemark("");
    setOpenRemarkModal(marksheet.id);
  };

  // Actually print after remarks entered
  const handleConfirmPrint = async () => {
    if (!selectedStudent || !pendingMarksheet) return;
    setPrinting(pendingMarksheet.id);
    setOpenRemarkModal(null);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Helper function to add text with word wrap
      const addText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 10) => {
        pdf.setFontSize(fontSize);
        const lines = pdf.splitTextToSize(text, maxWidth);
        pdf.text(lines, x, y);
        return y + (lines.length * (fontSize * 0.35));
      };

      // School Header
      pdf.setFillColor(79, 70, 229); // #4F46E5
      pdf.rect(0, 0, pageWidth, 25, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('EduNest School', pageWidth / 2, 12, { align: 'center' });
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Academic Excellence • Character Development • Future Leaders', pageWidth / 2, 18, { align: 'center' });
      pdf.text('123 Education Street, Knowledge City, State 12345 | Phone: (555) 123-4567', pageWidth / 2, 22, { align: 'center' });
      pdf.setTextColor(0, 0, 0);
      yPosition = 35;
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('REPORT CARD', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 8;
      pdf.setFontSize(14);
      pdf.setTextColor(79, 70, 229);
      pdf.text(`${pendingMarksheet.term} - ${pendingMarksheet.academicYear}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Student Information', 20, yPosition);
      yPosition += 8;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      const studentInfo = [
        `Student Name: ${selectedStudent.firstName} ${selectedStudent.lastName}`,
        `Student ID: ${selectedStudent.eduNestId}`,
        `Class: ${selectedStudent.grade} - Section ${selectedStudent.section}`,
        `Date of Birth: ${formatDate(selectedStudent.dateOfBirth)}`,
        `Father's Name: ${selectedStudent.fatherName}`,
        `Mother's Name: ${selectedStudent.motherName}`
      ];
      studentInfo.forEach(info => {
        pdf.text(info, 20, yPosition);
        yPosition += 6;
      });
      yPosition += 5;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('Academic Performance', 20, yPosition);
      yPosition += 10;
      const headers = ['Subject', 'Marks', 'Total', '%', 'Grade', 'Remarks'];
      const colWidths = [40, 20, 20, 15, 20, 35];
      let xPos = 20;
      pdf.setFillColor(243, 244, 246);
      pdf.rect(20, yPosition - 5, 150, 8, 'F');
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      headers.forEach((header, index) => {
        pdf.text(header, xPos + 2, yPosition, { maxWidth: colWidths[index] - 4 });
        xPos += colWidths[index];
      });
      yPosition += 8;
      pdf.setFont('helvetica', 'normal');
      pendingMarksheet.assessments.forEach((assessment: any, index: number) => {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
        }
        xPos = 20;
        const rowData = [
          assessment.subject,
          assessment.marks.toString(),
          assessment.totalMarks.toString(),
          ((assessment.marks / assessment.totalMarks) * 100).toFixed(2) + '%',
          assessment.grade,
          assessment.remarks || '-'
        ];
        if (index % 2 === 0) {
          pdf.setFillColor(249, 250, 251);
          pdf.rect(20, yPosition - 4, 150, 6, 'F');
        }
        rowData.forEach((data, colIndex) => {
          pdf.text(data, xPos + 2, yPosition, { maxWidth: colWidths[colIndex] - 4 });
          xPos += colWidths[colIndex];
        });
        yPosition += 6;
      });
      yPosition += 10;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('Overall Performance', 20, yPosition);
      yPosition += 8;
      pdf.setFillColor(248, 250, 252);
      pdf.rect(20, yPosition - 3, 70, 25, 'F');
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      const summaryData = [
        `Total Marks: ${pendingMarksheet.totalMarks}/500`,
        `Percentage: ${pendingMarksheet.percentage.toFixed(2)}%`,
        `Overall Grade: ${pendingMarksheet.overallGrade}`,
        `Class Rank: ${pendingMarksheet.rank}/${pendingMarksheet.totalStudents}`
      ];
      summaryData.forEach(data => {
        pdf.text(data, 22, yPosition);
        yPosition += 5;
      });
      yPosition += 10;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('Class Teacher\'s Comments', 20, yPosition);
      yPosition += 8;
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(10);
      const comment = teacherRemark || `${selectedStudent.firstName} has shown excellent progress throughout the ${pendingMarksheet.term.toLowerCase()}.`;
      yPosition = addText(comment, 20, yPosition, 150, 10);
      yPosition += 15;
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = 20;
      }
      pdf.setDrawColor(0, 0, 0);
      pdf.line(20, yPosition, pageWidth - 20, yPosition);
      yPosition += 10;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      const signatures = ['Class Teacher', 'Principal', 'Parent/Guardian'];
      const sigWidth = (pageWidth - 40) / 3;
      signatures.forEach((sig, index) => {
        const xPos = 20 + (index * sigWidth);
        pdf.line(xPos + 10, yPosition + 15, xPos + sigWidth - 10, yPosition + 15);
        pdf.text(sig, xPos + (sigWidth / 2), yPosition + 20, { align: 'center' });
      });
      yPosition += 30;
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      const footerText = `Report generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} | EduNest School Management System`;
      pdf.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
      const fileName = `${selectedStudent.firstName}_${selectedStudent.lastName}_${pendingMarksheet.term.replace(/\s+/g, '_')}_${pendingMarksheet.academicYear.replace('/', '-')}_ReportCard.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setPrinting(null);
      setPendingMarksheet(null);
    }
  };
  // All other functions remain the same
  const handleSearch = async () => {
    const hasSearchCriteria = Object.values(searchCriteria).some(value => value.trim() !== "");
    if (!hasSearchCriteria) return;
    setSearching(true);
    try {
      const params = new URLSearchParams();
      if (searchCriteria.firstName) params.append("firstName", searchCriteria.firstName);
      if (searchCriteria.lastName) params.append("lastName", searchCriteria.lastName);
      if (searchCriteria.grade) params.append("grade", searchCriteria.grade);
      const response = await axios.get(`http://localhost:5199/Students?${params.toString()}`,
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      // The backend returns an array of students
      const students: Student[] = response.data.map((s: any) => ({
        ...s,
        photo: s.photo || generateDefaultAvatar(s.firstName, s.lastName)
      }));
      setSearchResults(students);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleStudentSelect = async (student: Student) => {
    setSelectedStudent(student);
    setLoading(true);
    setStudentMarks([]);
    try {
      setMarksheets([]);
      setAssessments([]);
      if (student.eduNestId && selectedAcademicYear) {
        setMarksLoading(true);
        const res = await fetch(`http://localhost:5199/api/StudentMarks/student?eduNestId=${encodeURIComponent(student.eduNestId)}&academicYear=${encodeURIComponent(selectedAcademicYear)}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : undefined
        });
        if (res.ok) {
          const data = await res.json();
          setStudentMarks((data || []).map((item: any, idx: number) => ({
            ...item,
            term: item.assessmentName || '',
          })));
          // Map backend response to Assessment[]
          setAssessments((data || []).map((item: any, idx: number) => ({
            id: item.assessmentId || String(idx),
            term: item.assessmentName || '',
            subject: item.subjectName,
            marks: item.marksObtained,
            totalMarks: item.maxMarks,
            grade: item.gradeAwarded,
            date: '', // Not available in API, leave blank or infer if possible
            remarks: item.remarks
          })));
        } else {
          setStudentMarks([]);
          setAssessments([]);
        }
        setMarksLoading(false);
      }
    } catch (error) {
      setStudentMarks([]);
      setAssessments([]);
      setMarksLoading(false);
      console.error('Error loading student marks:', error);
    } finally {
      setLoading(false);
    }
  };
  // Fetch marks again if academic year changes and a student is selected
  useEffect(() => {
    if (selectedStudent && selectedStudent.eduNestId && selectedAcademicYear) {
      (async () => {
        setMarksLoading(true);
        try {
          const res = await fetch(`http://localhost:5199/api/StudentMarks/student?eduNestId=${encodeURIComponent(selectedStudent.eduNestId)}&academicYear=${encodeURIComponent(selectedAcademicYear)}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : undefined
          });
          if (res.ok) {
            const data = await res.json();
            setStudentMarks(data || []);
            setAssessments((data || []).map((item: any, idx: number) => ({
              id: item.assessmentId || String(idx),
              term: item.assessmentName || '',
              subject: item.subjectName,
              marks: item.marksObtained,
              totalMarks: item.maxMarks,
              grade: item.gradeAwarded,
              date: '',
              remarks: item.remarks
            })));
          } else {
            setStudentMarks([]);
            setAssessments([]);
          }
        } catch (error) {
          setStudentMarks([]);
          setAssessments([]);
        } finally {
          setMarksLoading(false);
        }
      })();
    }
  }, [selectedAcademicYear, selectedStudent, token]);

  // Returns an array of { term, [subject1]: %, [subject2]: %, ... }
  const getGrowthData = () => {
    const subjects = [...new Set(assessments.map(a => a.subject))];
    const terms = [...new Set(assessments.map(a => a.term))];
    return terms.map(term => {
      const termData: any = { term };
      subjects.forEach(subject => {
        // Find the assessment for this subject and term
        const found = assessments.find(a => a.term === term && a.subject === subject);
        termData[subject] = found && found.totalMarks ? (found.marks / found.totalMarks) * 100 : null;
      });
      return termData;
    });
  };

  const getSubjectColors = () => {
    return ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getGradeBadgeColor = (grade: string) => {
    if (grade.includes('A')) return 'bg-green-100 text-green-800';
    if (grade.includes('B')) return 'bg-blue-100 text-blue-800';
    if (grade.includes('C')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Student Details</h1>
            <p className="text-white/80">Search students and view complete academic records</p>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Students
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">First Name</label>
              <Input
                placeholder="Enter first name"
                value={searchCriteria.firstName}
                onChange={(e) => setSearchCriteria(prev => ({
                  ...prev,
                  firstName: e.target.value
                }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">Last Name</label>
              <Input
                placeholder="Enter last name"
                value={searchCriteria.lastName}
                onChange={(e) => setSearchCriteria(prev => ({
                  ...prev,
                  lastName: e.target.value
                }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">Grade</label>
              <Input
                placeholder="Enter grade"
                value={searchCriteria.grade}
                onChange={(e) => setSearchCriteria(prev => ({
                  ...prev,
                  grade: e.target.value
                }))}
              />
            </div>
          </div>
          
          <Button 
            onClick={handleSearch}
            disabled={searching}
            className="bg-gradient-to-r from-indigo-500 to-purple-600"
          >
            {searching ? "Searching..." : "Search Students"}
          </Button>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results ({searchResults.length} students found)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>EduNest ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {searchResults.map((student) => (
                  <TableRow 
                    key={student.eduNestId}
                    className={selectedStudent?.eduNestId === student.eduNestId ? "bg-indigo-50" : ""}
                  >
                    <TableCell className="font-medium">{student.eduNestId}</TableCell>
                    <TableCell>{student.firstName} {student.lastName}</TableCell>
                    <TableCell>{student.grade}</TableCell>
                    <TableCell>{student.section}</TableCell>
                    <TableCell>
                      <Button
                        variant={selectedStudent?.eduNestId === student.eduNestId ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleStudentSelect(student)}
                      >
                        {selectedStudent?.eduNestId === student.eduNestId ? "Selected" : "View Details"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Student Details */}
      {selectedStudent && (
        <div className="space-y-6">
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <span className="ml-3">Loading student details...</span>
              </CardContent>
            </Card>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="academics">Academic Records</TabsTrigger>
                <TabsTrigger value="growth">Growth Analysis</TabsTrigger>
                <TabsTrigger value="attendance">Attendance</TabsTrigger>
              {/* Attendance Tab */}
              <TabsContent value="attendance">
                <div className="py-12 text-center text-gray-500 text-lg">
                  No attendance records found.
                </div>
              </TabsContent>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Student Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Photo and Basic Info */}
                      <div className="space-y-4">
                        <div className="text-center">
                          <img
                            src={selectedStudent.photo || generateDefaultAvatar(selectedStudent.firstName, selectedStudent.lastName)}
                            alt={`${selectedStudent.firstName} ${selectedStudent.lastName}`}
                            className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-indigo-100"
                          />
                          <h3 className="text-xl font-semibold mt-3">
                            {selectedStudent.firstName} {selectedStudent.lastName}
                          </h3>
                          <p className="text-gray-600">{selectedStudent.eduNestId}</p>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">Grade:</span>
                            <Badge className="bg-indigo-100 text-indigo-800">
                              {selectedStudent.grade} - {selectedStudent.section}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">DOB:</span>
                            <span className="text-sm">{formatDate(selectedStudent.dateOfBirth)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">Admission:</span>
                            <span className="text-sm">{selectedStudent.admissionNumber}</span>
                          </div>
                        </div>
                      </div>

                      {/* Contact Information */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-900">Contact Information</h4>
                        <div className="space-y-3">
                          <div className="flex items-start gap-2">
                            <Phone className="h-4 w-4 text-gray-500 mt-0.5" />
                            <div>
                              <span className="text-sm text-gray-600">Phone:</span>
                              <p className="text-sm">{selectedStudent.phoneNumber}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                            <div>
                              <span className="text-sm text-gray-600">Address:</span>
                              <p className="text-sm">
                                {selectedStudent.addressLine1}, {selectedStudent.addressLine2}, {selectedStudent.city}, {selectedStudent.state}, {selectedStudent.zipCode}, {selectedStudent.country}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-sm text-gray-600">Email:</span>
                            <p className="text-sm">{selectedStudent.email}</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-sm text-gray-600">Blood Group:</span>
                            {/* No bloodGroup in new API, so skip or show status */}
                            <Badge variant="outline">{selectedStudent.status}</Badge>
                          </div>
                        </div>
                      </div>

                      {/* Family Information */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-900">Family Information</h4>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-500" />
                            <div>
                              <span className="text-sm text-gray-600">Father:</span>
                              <p className="text-sm font-medium">{selectedStudent.fatherName}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-500" />
                            <div>
                              <span className="text-sm text-gray-600">Mother:</span>
                              <p className="text-sm font-medium">{selectedStudent.motherName}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Academic Records Tab */}
              <TabsContent value="academics">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Academic Records
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {assessments.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Term</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Marks</TableHead>
                            <TableHead>Grade</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Remarks</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {/* Group marks by assessmentName */}
                          {(() => {
                            // Group marks by assessmentName
                            const grouped: { [key: string]: any[] } = {};
                            studentMarks.forEach((mark: any) => {
                              const key = mark.assessmentName || 'Other';
                              if (!grouped[key]) grouped[key] = [];
                              grouped[key].push(mark);
                            });
                            return Object.entries(grouped).map(([assessmentName, marks]) => [
                              <TableRow key={assessmentName} className="bg-gray-50">
                                <TableCell colSpan={5} className="font-bold text-indigo-700 text-base">
                                  {assessmentName}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                    onClick={() => handlePrintReportCard({
                                      id: assessmentName,
                                      studentId: selectedStudent?.eduNestId || '',
                                      term: assessmentName,
                                      grade: selectedStudent?.grade || '',
                                      academicYear: selectedAcademicYear,
                                      assessments: marks.map((assessment: any, idx: number) => ({
                                        id: assessment.id || assessment.assessmentId || String(idx),
                                        term: assessmentName,
                                        subject: assessment.subjectName,
                                        marks: assessment.marksObtained,
                                        totalMarks: assessment.maxMarks,
                                        grade: assessment.gradeAwarded,
                                        date: assessment.date || '',
                                        remarks: assessment.remarks
                                      })),
                                      totalMarks: marks.reduce((sum: number, a: any) => sum + (a.marksObtained || 0), 0),
                                      percentage: marks.length > 0 ? (marks.reduce((sum: number, a: any) => sum + (a.marksObtained || 0), 0) / marks.reduce((sum: number, a: any) => sum + (a.maxMarks || 0), 0)) * 100 : 0,
                                      overallGrade: '',
                                      rank: 0,
                                      totalStudents: 0,
                                      date: marks[0]?.date || ''
                                    })}
                                    disabled={printing === assessmentName}
                                  >
                                    <Download className="h-4 w-4" />
                                    Generate Report Card
                                  </Button>
      {/* Modal for teacher remarks before printing */}
      <Dialog open={!!openRemarkModal} onOpenChange={open => { if (!open) setOpenRemarkModal(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Teacher's Remarks</DialogTitle>
            <DialogDescription>
              Please enter remarks to be included in the report card for this term.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={teacherRemark}
            onChange={e => setTeacherRemark(e.target.value)}
            placeholder="Enter remarks here..."
            rows={4}
            className="mb-4"
          />
          <DialogFooter>
            <Button onClick={handleConfirmPrint} disabled={printing !== null} className="bg-blue-600 text-white">
              {printing ? "Generating..." : "Generate & Print Report Card"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
                                </TableCell>
                              </TableRow>,
                              ...marks.map((assessment: any, idx: number) => (
                                <TableRow key={`${assessment.id || assessment.assessmentId || idx}-${assessment.subjectName}-${idx}`}>
                                  <TableCell></TableCell>
                                  <TableCell className="font-medium">{assessment.subjectName}</TableCell>
                                  <TableCell>
                                    {assessment.marksObtained}/{assessment.maxMarks}
                                    <span className="text-sm text-gray-500 ml-2">
                                      ({assessment.maxMarks ? ((assessment.marksObtained / assessment.maxMarks) * 100).toFixed(1) : '0'}%)
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    <Badge className={getGradeBadgeColor(assessment.gradeAwarded)}>
                                      {assessment.gradeAwarded}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{assessment.date ? formatDate(assessment.date) : ''}</TableCell>
                                  <TableCell className="text-sm text-gray-600">{assessment.remarks}</TableCell>
                                </TableRow>
                              ))
                            ]);
                          })()}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8">
                        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No academic records found</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>


              {/* Growth Analysis Tab */}
              <TabsContent value="growth">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Academic Growth Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {assessments.length > 0 ? (
                      <div className="space-y-6">
                        {/* Line Chart for Growth Trend */}
                        <div>
                          <h4 className="font-semibold mb-4">Growth per Subject Across Terms</h4>
                          <ResponsiveContainer width="100%" height={400}>
                            <LineChart data={getGrowthData()}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="term" />
                              <YAxis domain={[0, 100]} label={{ value: 'Percentage', angle: -90, position: 'insideLeft' }} />
                              <Tooltip formatter={(value: any) => [`${value.toFixed(1)}%`, 'Score']} />
                              <Legend />
                              {[...new Set(assessments.map(a => a.subject))].map((subject, index) => (
                                <Line
                                  key={subject}
                                  type="monotone"
                                  dataKey={subject}
                                  stroke={getSubjectColors()[index % getSubjectColors().length]}
                                  strokeWidth={2}
                                  dot={{ r: 4 }}
                                />
                              ))}
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                        {/* Pie Chart removed as requested */}

                        {/* Bar Chart for Term Comparison */}
                        <div>
                          <h4 className="font-semibold mb-4">Term-wise Overall Percentage</h4>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={(() => {
                              // For each term, find all assessments, sum marks and totalMarks, and compute overall %
                              const terms = [...new Set(assessments.map(a => a.term))];
                              return terms.map(term => {
                                const termAssessments = assessments.filter(a => a.term === term);
                                const totalMarks = termAssessments.reduce((sum, a) => sum + (a.totalMarks || 0), 0);
                                const marks = termAssessments.reduce((sum, a) => sum + (a.marks || 0), 0);
                                const overall = totalMarks > 0 ? (marks / totalMarks) * 100 : 0;
                                return { term, overall };
                              });
                            })()}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="term" />
                              <YAxis domain={[0, 100]} label={{ value: 'Overall %', angle: -90, position: 'insideLeft' }} />
                              <Tooltip formatter={(value: any) => [`${value.toFixed(1)}%`, 'Overall']} />
                              <Bar
                                dataKey="overall"
                                fill="#8884d8"
                                name="Overall %"
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No data available for growth analysis</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Attendance Tab */}
              <TabsContent value="attendance">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Attendance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {attendanceLoading ? (
                      <div className="text-center py-8">Loading attendance...</div>
                    ) : attendance.length > 0 ? (
                      <div className="w-full px-0">
                        <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                          {Object.entries(
                            attendance.reduce((acc, rec) => {
                              const dateObj = new Date(rec.date);
                              const month = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
                              if (!acc[month]) acc[month] = [];
                              acc[month].push(rec);
                              return acc;
                            }, {} as Record<string, typeof attendance>)
                          ).map(([month, records]) => (
                            <div key={month} className="mb-0 w-full bg-white border rounded-lg shadow p-2">
                              <div className="font-semibold text-lg mb-2 pl-2">{month}</div>
                              <div className="overflow-x-auto w-full">
                                <Table className="w-full min-w-[300px]">
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="w-2/3 text-base">Date</TableHead>
                                      <TableHead className="w-1/3 text-base">Status</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {records.map((rec, idx) => (
                                      <TableRow key={rec.date + '-' + idx}>
                                        <TableCell className="text-base">{formatDate(rec.date)}</TableCell>
                                        <TableCell className="text-base">{rec.isPresent !== undefined ? (rec.isPresent ? 'Present' : 'Absent') : (rec.status || '-')}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">No attendance records found.</div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Report Cards Tab - WITH PRINT BUTTON */}

            </Tabs>
          )}
        </div>
      )}
    </div>
  );
}