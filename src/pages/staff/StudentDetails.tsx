import { useState, useRef } from "react";
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
  Bar
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
// import { api } from "@/services/api"; // Commented out since backend not present

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  uniqueId: string;
  grade: string;
  section: string;
  dateOfBirth: string;
  address: string;
  fatherName: string;
  motherName: string;
  admissionDate: string;
  phoneNumber: string;
  email: string;
  bloodGroup: string;
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

export default function StudentDetails() {
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
    firstName: "",
    lastName: "",
    grade: ""
  });
  
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [marksheets, setMarksheets] = useState<Marksheet[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState<string | null>(null);

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

  // Mock data for testing
  const mockStudents: Student[] = [
    {
      id: "1",
      firstName: "John",
      lastName: "Doe",
      uniqueId: "STU001",
      grade: "Grade 8",
      section: "A",
      dateOfBirth: "2010-05-15",
      address: "123 Main St, City, State, 12345",
      fatherName: "Robert Doe",
      motherName: "Jane Doe",
      admissionDate: "2024-01-15",
      phoneNumber: "+1-234-567-8900",
      email: "john.doe@school.edu",
      bloodGroup: "A+",
      photo: generateDefaultAvatar("John", "Doe")
    },
    {
      id: "2",
      firstName: "Sarah",
      lastName: "Smith",
      uniqueId: "STU002",
      grade: "Grade 9",
      section: "B",
      dateOfBirth: "2009-08-22",
      address: "456 Oak Ave, City, State, 12345",
      fatherName: "Michael Smith",
      motherName: "Lisa Smith",
      admissionDate: "2024-01-15",
      phoneNumber: "+1-234-567-8901",
      email: "sarah.smith@school.edu",
      bloodGroup: "B+",
      photo: generateDefaultAvatar("Sarah", "Smith")
    }
  ];

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

  /// Replace the handlePrintReportCard function with this one:
const handlePrintReportCard = async (marksheet: Marksheet) => {
  if (!selectedStudent) return;
  
  setPrinting(marksheet.id);
  
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

    // Reset text color
    pdf.setTextColor(0, 0, 0);
    yPosition = 35;

    // Report Card Title
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('REPORT CARD', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;

    pdf.setFontSize(14);
    pdf.setTextColor(79, 70, 229);
    pdf.text(`${marksheet.term} - ${marksheet.academicYear}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Student Information
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Student Information', 20, yPosition);
    yPosition += 8;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    
    const studentInfo = [
      `Student Name: ${selectedStudent.firstName} ${selectedStudent.lastName}`,
      `Student ID: ${selectedStudent.uniqueId}`,
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

    // Academic Performance Table
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Academic Performance', 20, yPosition);
    yPosition += 10;

    // Table headers
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

    // Table content
    pdf.setFont('helvetica', 'normal');
    marksheet.assessments.forEach((assessment, index) => {
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = 20;
      }

      xPos = 20;
      const rowData = [
        assessment.subject,
        assessment.marks.toString(),
        assessment.totalMarks.toString(),
        ((assessment.marks / assessment.totalMarks) * 100).toFixed(1) + '%',
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

    // Summary Section
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Overall Performance', 20, yPosition);
    yPosition += 8;

    pdf.setFillColor(248, 250, 252);
    pdf.rect(20, yPosition - 3, 70, 25, 'F');

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const summaryData = [
      `Total Marks: ${marksheet.totalMarks}/500`,
      `Percentage: ${marksheet.percentage}%`,
      `Overall Grade: ${marksheet.overallGrade}`,
      `Class Rank: ${marksheet.rank}/${marksheet.totalStudents}`
    ];

    summaryData.forEach(data => {
      pdf.text(data, 22, yPosition);
      yPosition += 5;
    });

    // Comments
    yPosition += 10;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Class Teacher\'s Comments', 20, yPosition);
    yPosition += 8;

    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(10);
    const comment = `${selectedStudent.firstName} has shown excellent progress throughout the ${marksheet.term.toLowerCase()}. ${
      marksheet.overallGrade === 'A' || marksheet.overallGrade === 'A+' ? 
      'Outstanding performance in all subjects with consistent dedication to studies.' : 
      'Good academic performance with room for improvement in some areas.'
    } Keep up the excellent work and continue to strive for academic excellence.`;

    yPosition = addText(comment, 20, yPosition, 150, 10);
    yPosition += 15;

    // Signatures
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

    // Footer
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    const footerText = `Report generated on ${new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })} | EduNest School Management System`;
    pdf.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });

    // Save the PDF
    const fileName = `${selectedStudent.firstName}_${selectedStudent.lastName}_${marksheet.term.replace(/\s+/g, '_')}_${marksheet.academicYear.replace('/', '-')}_ReportCard.pdf`;
    pdf.save(fileName);

  } catch (error) {
    console.error('Error generating PDF:', error);
    alert(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
  } finally {
    setPrinting(null);
  }
};
  // All other functions remain the same
  const handleSearch = async () => {
    const hasSearchCriteria = Object.values(searchCriteria).some(value => value.trim() !== "");
    
    if (!hasSearchCriteria) {
      return;
    }

    setSearching(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const filteredStudents = mockStudents.filter(student => {
        return (
          (!searchCriteria.firstName || student.firstName.toLowerCase().includes(searchCriteria.firstName.toLowerCase())) &&
          (!searchCriteria.lastName || student.lastName.toLowerCase().includes(searchCriteria.lastName.toLowerCase())) &&
          (!searchCriteria.grade || student.grade.toLowerCase().includes(searchCriteria.grade.toLowerCase()))
        );
      });

      setSearchResults(filteredStudents);

    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleStudentSelect = async (student: Student) => {
    setSelectedStudent(student);
    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Filter marksheets for selected student
      const studentMarksheets = mockMarksheets.filter(ms => ms.studentId === student.id);
      setMarksheets(studentMarksheets);
      
      // Flatten all assessments for growth tracking
      const allAssessments = studentMarksheets.flatMap(ms => ms.assessments);
      setAssessments(allAssessments);
      
    } catch (error) {
      console.error('Error loading student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGrowthData = () => {
    const subjects = [...new Set(assessments.map(a => a.subject))];
    const terms = [...new Set(assessments.map(a => a.term))];
    
    return terms.map(term => {
      const termData: any = { term };
      subjects.forEach(subject => {
        const assessment = assessments.find(a => a.term === term && a.subject === subject);
        termData[subject] = assessment ? (assessment.marks / assessment.totalMarks) * 100 : 0;
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
                  <TableHead>Student ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {searchResults.map((student) => (
                  <TableRow 
                    key={student.id}
                    className={selectedStudent?.id === student.id ? "bg-indigo-50" : ""}
                  >
                    <TableCell className="font-medium">{student.uniqueId}</TableCell>
                    <TableCell>{student.firstName} {student.lastName}</TableCell>
                    <TableCell>{student.grade}</TableCell>
                    <TableCell>{student.section}</TableCell>
                    <TableCell>
                      <Button
                        variant={selectedStudent?.id === student.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleStudentSelect(student)}
                      >
                        {selectedStudent?.id === student.id ? "Selected" : "View Details"}
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
            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="academics">Academic Records</TabsTrigger>
                <TabsTrigger value="growth">Growth Analysis</TabsTrigger>
                <TabsTrigger value="reports">Report Cards</TabsTrigger>
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
                          <p className="text-gray-600">{selectedStudent.uniqueId}</p>
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
                            <span className="text-sm">{formatDate(selectedStudent.admissionDate)}</span>
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
                              <p className="text-sm">{selectedStudent.address}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-sm text-gray-600">Email:</span>
                            <p className="text-sm">{selectedStudent.email}</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-sm text-gray-600">Blood Group:</span>
                            <Badge variant="outline">{selectedStudent.bloodGroup}</Badge>
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
                          {assessments.map((assessment) => (
                            <TableRow key={assessment.id}>
                              <TableCell>{assessment.term}</TableCell>
                              <TableCell className="font-medium">{assessment.subject}</TableCell>
                              <TableCell>
                                {assessment.marks}/{assessment.totalMarks}
                                <span className="text-sm text-gray-500 ml-2">
                                  ({((assessment.marks / assessment.totalMarks) * 100).toFixed(1)}%)
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge className={getGradeBadgeColor(assessment.grade)}>
                                  {assessment.grade}
                                </Badge>
                              </TableCell>
                              <TableCell>{formatDate(assessment.date)}</TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {assessment.remarks}
                              </TableCell>
                            </TableRow>
                          ))}
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
                          <h4 className="font-semibold mb-4">Subject-wise Performance Trend</h4>
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

                        {/* Bar Chart for Term Comparison */}
                        <div>
                          <h4 className="font-semibold mb-4">Term-wise Average Performance</h4>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={getGrowthData().map(termData => {
                              const subjects = [...new Set(assessments.map(a => a.subject))];
                              const average = subjects.reduce((sum, subject) => sum + (termData[subject] || 0), 0) / subjects.length;
                              return { ...termData, average };
                            })}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="term" />
                              <YAxis domain={[0, 100]} label={{ value: 'Average %', angle: -90, position: 'insideLeft' }} />
                              <Tooltip formatter={(value: any) => [`${value.toFixed(1)}%`, 'Average']} />
                              <Bar
                                dataKey="average"
                                fill="#8884d8"
                                name="Average Score"
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

              {/* Report Cards Tab - WITH PRINT BUTTON */}
              <TabsContent value="reports">
                <div className="space-y-4">
                  {marksheets.length > 0 ? (
                    marksheets.map((marksheet) => (
                      <Card key={marksheet.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                              <FileText className="h-5 w-5" />
                              {marksheet.term} - {marksheet.academicYear}
                            </CardTitle>
                            <div className="flex items-center gap-4">
                              <Badge className="bg-green-100 text-green-800">
                                Rank: {marksheet.rank}/{marksheet.totalStudents}
                              </Badge>
                              <Badge className={getGradeBadgeColor(marksheet.overallGrade)}>
                                Grade: {marksheet.overallGrade}
                              </Badge>
                              <Button
                                onClick={() => handlePrintReportCard(marksheet)}
                                disabled={printing === marksheet.id}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                                size="sm"
                              >
                                {printing === marksheet.id ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    <Download className="h-4 w-4" />
                                    Print PDF
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                            {/* Summary Stats */}
                            <div className="space-y-2">
                              <h4 className="font-semibold text-gray-900">Summary</h4>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span>Total Marks:</span>
                                  <span className="font-medium">{marksheet.totalMarks}/500</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Percentage:</span>
                                  <span className="font-medium">{marksheet.percentage}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Overall Grade:</span>
                                  <Badge className={getGradeBadgeColor(marksheet.overallGrade)}>
                                    {marksheet.overallGrade}
                                  </Badge>
                                </div>
                                <div className="flex justify-between">
                                  <span>Class Rank:</span>
                                  <span className="font-medium">{marksheet.rank}/{marksheet.totalStudents}</span>
                                </div>
                              </div>
                            </div>

                            {/* Subject Details */}
                            <div className="lg:col-span-3">
                              <h4 className="font-semibold text-gray-900 mb-3">Subject-wise Marks</h4>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>Marks Obtained</TableHead>
                                    <TableHead>Total Marks</TableHead>
                                    <TableHead>Percentage</TableHead>
                                    <TableHead>Grade</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {marksheet.assessments.map((assessment) => (
                                    <TableRow key={assessment.id}>
                                      <TableCell className="font-medium">{assessment.subject}</TableCell>
                                      <TableCell>{assessment.marks}</TableCell>
                                      <TableCell>{assessment.totalMarks}</TableCell>
                                      <TableCell>
                                        {((assessment.marks / assessment.totalMarks) * 100).toFixed(1)}%
                                      </TableCell>
                                      <TableCell>
                                        <Badge className={getGradeBadgeColor(assessment.grade)}>
                                          {assessment.grade}
                                        </Badge>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card>
                      <CardContent className="text-center py-8">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No report cards available</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      )}
    </div>
  );
}