import React, { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import * as XLSX from 'xlsx';
import { api } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

interface ClassData {
  id: string;
  name: string;
  grade: string;
  section: string;
}

interface StudentForTemplate {
  eduNestId: string;
  firstName: string;
  lastName: string;
  grade: string;
  section: string;
}

interface AttendanceData {
  eduNestId?: string;
  firstName: string;
  lastName: string;
  grade: string;
  section: string;
  teacher?: string;
  attendance: string;
}

interface UploadResult {
  success: boolean;
  message: string;
  successCount?: number;
  errorCount?: number;
  errors?: string[];
}

export default function UploadAttendance() {
  // ...existing code for state and handlers...

  // Add missing students state
  const [students, setStudents] = useState<AttendanceData[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'P' | 'A'>>( {} );
  const [submitting, setSubmitting] = useState(false);
  const [attendanceResult, setAttendanceResult] = useState<UploadResult | null>(null);
  const [attendanceDate, setAttendanceDate] = useState<string>("");
  const { token, masterDataClasses } = useAuth();

  // Submit attendance
  const handleSubmitAttendance = async () => {
    if (!students.length || !attendanceDate || !selectedGrade || !selectedSection) {
      setAttendanceResult({ success: false, message: 'Please select grade, section, date, and load students.' });
      return;
    }
    setSubmitting(true);
    setAttendanceResult(null);
    try {
      const payload = students.map(stu => ({
        studentId: stu.eduNestId,
        grade: selectedGrade,
        section: selectedSection,
        date: attendanceDate,
        isPresent: (attendanceMap[stu.eduNestId] || 'P') === 'P',
      }));
      const res = await api.post('/api/Attendance/bulk', payload);
      setAttendanceResult({
        success: true,
        message: res.data?.message || `Successfully submitted attendance for ${students.length} students.`
      });
    } catch (err: any) {
      setAttendanceResult({
        success: false,
        message: err.response?.data?.message || 'Failed to submit attendance. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [previewData, setPreviewData] = useState<AttendanceData[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Sample data for the Excel template
  const sampleData: AttendanceData[] = [
    {
      firstName: "John",
      lastName: "Doe",
      grade: "Grade 8",
      section: "A",
      teacher: "Mrs. Smith",
      attendance: "Present"
    },
    {
      firstName: "Sarah",
      lastName: "Wilson",
      grade: "Grade 8",
      section: "A",
      teacher: "Mrs. Smith",
      attendance: "Absent"
    },
    {
      firstName: "Michael",
      lastName: "Johnson",
      grade: "Grade 9",
      section: "B",
      teacher: "Mr. Brown",
      attendance: "Present"
    },
    {
      firstName: "Emily",
      lastName: "Davis",
      grade: "Grade 9",
      section: "B",
      teacher: "Mr. Brown",
      attendance: "Present"
    }
  ];


  // Generate Excel template for selected grade/section
  const generateAttendanceTemplate = async () => {
    if (!selectedGrade || !selectedSection) return;
    setLoadingTemplate(true);
    try {
      // Fetch all students for selected grade/section
      const res = await api.get(`/Students?grade=${encodeURIComponent(selectedGrade)}&section=${encodeURIComponent(selectedSection)}`);
      const students: AttendanceData[] = res.data || [];
      // Prepare worksheet data with required columns
      const worksheetData = [
        ["studentId", "grade", "section", "date", "isPresent"],
        ...students.map(stu => [
          stu.eduNestId || '',
          stu.grade || selectedGrade,
          stu.section || selectedSection,
          new Date().toISOString().split('T')[0],
          true
        ])
      ];
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      worksheet['!cols'] = [
        { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 10 }
      ];
      XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
      const today = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `attendance_template_${selectedGrade}_${selectedSection}_${today}.xlsx`);
    } catch (err) {
      // Optionally show error
    } finally {
      setLoadingTemplate(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadResult(null);
      previewFile(selectedFile);
    }
  };

  const previewFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        const attendance: AttendanceData[] = (jsonData as string[][])
          .slice(1)
          .filter(row => row.length > 0 && row[0])
          .map((row) => ({
            eduNestId: row[0] || '',
            firstName: row[1] || '',
            lastName: row[2] || '',
            grade: row[3] || '',
            section: row[4] || '',
            attendance: row[5] || ''
          }));
        setPreviewData(attendance);
        setShowPreview(true);
      } catch (error) {
        console.error('Error reading file:', error);
        setUploadResult({
          success: false,
          message: 'Error reading Excel file. Please check the file format.'
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleUpload = async () => {
    if (!file || previewData.length === 0) return;
    setUploading(true);
    try {
      const errors: string[] = [];
      previewData.forEach((attendance, index) => {
        if (!attendance.firstName || !attendance.lastName) {
          errors.push(`Row ${index + 2}: First name and last name are required`);
        }
        if (!attendance.grade) {
          errors.push(`Row ${index + 2}: Grade is required`);
        }
        if (!attendance.section) {
          errors.push(`Row ${index + 2}: Section is required`);
        }
        if (!attendance.attendance || !['Present', 'Absent', 'P', 'A'].includes(attendance.attendance)) {
          errors.push(`Row ${index + 2}: Attendance must be either "P"/"A" or "Present"/"Absent"`);
        }
      });

      if (errors.length > 0) {
        setUploadResult({
          success: false,
          message: 'Validation errors found',
          errors: errors
        });
        return;
      }

      // Prepare payload for backend
      const today = new Date().toISOString();
      const payload = previewData.map((row) => ({
        studentId: row.eduNestId || '',
        grade: row.grade,
        section: row.section,
        date: today,
        isPresent:
          row.attendance === 'P' || row.attendance === 'Present' ? true : false
      }));

      // Call backend
      const response = await api.post('/api/Attendance/bulk', payload);
      setUploadResult({
        success: true,
        message: response.data?.message || `Successfully uploaded attendance for ${previewData.length} students`,
        successCount: previewData.length,
        errorCount: 0
      });

      setFile(null);
      setPreviewData([]);
      setShowPreview(false);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error: any) {
      setUploadResult({
        success: false,
        message: error.response?.data?.message || 'Upload failed. Please try again.',
        errors: error.response?.data?.errors || []
      });
    } finally {
      setUploading(false);
    }
  };

  const getAttendanceBadge = (attendance: string) => {
    return attendance === 'Present' ? (
      <Badge variant="default" className="bg-green-600">Present</Badge>
    ) : (
      <Badge variant="destructive" className="bg-red-600">Absent</Badge>
    );
  };

  // Update getAttendanceStats to use 'P' and 'A' only
  // ...existing code for getAttendanceStats...

  // Add missing state for selectedGrade, selectedSection, and loadingTemplate
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [loadingTemplate, setLoadingTemplate] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);

  // Get unique grades and sections from masterDataClasses
  const gradeOptions = Array.from(new Set(masterDataClasses.map(c => String(c.grade))));
  const sectionOptions = selectedGrade
    ? Array.from(new Set(masterDataClasses.filter(c => String(c.grade) === selectedGrade).map(c => String(c.section))))
    : [];

  // Search students by grade/section
  const handleSearchStudents = async () => {
    if (!selectedGrade || !selectedSection) return;
    try {
      const res = await api.get(`/Students?grade=${encodeURIComponent(selectedGrade)}&section=${encodeURIComponent(selectedSection)}`);
      setStudents(res.data || []);
      // Reset attendance map
      setAttendanceMap({});
    } catch (err) {
      setStudents([]);
      setAttendanceMap({});
    }
  };

  // Handle attendance value change
  const handleAttendanceChange = (studentId: string, value: 'P' | 'A') => {
    setAttendanceMap(prev => ({ ...prev, [studentId]: value }));
  };

  // Handle submit attendance

  // Helper for attendance stats in preview
  const getAttendanceStats = () => {
    const total = previewData.length;
    const present = previewData.filter(
      (a) => a.attendance === "Present" || a.attendance === "P"
    ).length;
    const absent = previewData.filter(
      (a) => a.attendance === "Absent" || a.attendance === "A"
    ).length;
    const presentPercent = total > 0 ? ((present / total) * 100).toFixed(1) : "0";
    return { total, present, absent, presentPercent };
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors">
      <h2 className="text-3xl font-extrabold mb-6 text-indigo-700 dark:text-indigo-200">Upload Attendance</h2>
      <Tabs defaultValue="take" className="w-full">
        <TabsList className="mb-4 bg-white dark:bg-gray-800 rounded-lg p-1 shadow border border-gray-200 dark:border-gray-700">
          <TabsTrigger value="take" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=inactive]:text-indigo-700 dark:data-[state=inactive]:text-indigo-200">Take Attendance</TabsTrigger>
          <TabsTrigger value="excel" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=inactive]:text-indigo-700 dark:data-[state=inactive]:text-indigo-200">Upload via Excel</TabsTrigger>
        </TabsList>
        {/* Take Attendance Tab */}
        <TabsContent value="take">
          <Card className="bg-white dark:bg-gray-900 shadow border border-gray-200 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="text-indigo-700 dark:text-indigo-200">Take Attendance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 mb-4">
                <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                  <SelectTrigger className="w-32 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <SelectValue placeholder="Grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {gradeOptions.map(grade => (
                      <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedGrade}>
                  <SelectTrigger className="w-32 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <SelectValue placeholder="Section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectionOptions.map(section => (
                      <SelectItem key={section} value={section}>{section}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} className="w-48 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" />
                <Button onClick={handleSearchStudents} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow" disabled={!selectedGrade || !selectedSection}>Search Students</Button>
              </div>
              <Table className="rounded-lg overflow-hidden border border-gray-100 dark:border-gray-800">
                <TableHeader className="bg-gray-100 dark:bg-gray-800">
                  <TableRow>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Attendance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-gray-400">No students found. Please search.</TableCell>
                    </TableRow>
                  ) : (
                    students.map((stu, idx) => (
                      <TableRow key={stu.eduNestId || idx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <TableCell>{stu.eduNestId}</TableCell>
                        <TableCell>{stu.firstName} {stu.lastName}</TableCell>
                        <TableCell>
                          <Select value={attendanceMap[stu.eduNestId] || 'P'} onValueChange={val => handleAttendanceChange(stu.eduNestId, val as 'P' | 'A')}>
                            <SelectTrigger className="w-24 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="P">Present</SelectItem>
                              <SelectItem value="A">Absent</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white shadow" onClick={handleSubmitAttendance} disabled={students.length === 0 || submitting}>
                {submitting ? 'Submitting...' : 'Submit Attendance'}
              </Button>
              {attendanceResult && (
                <Alert className={`mt-4 ${attendanceResult.success ? 'border-green-500' : 'border-red-500'}`}> 
                  {attendanceResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600 inline mr-2" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 inline mr-2" />
                  )}
                  <AlertDescription>{attendanceResult.message}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        {/* Upload via Excel Tab */}
        <TabsContent value="excel">
          <Card className="bg-white dark:bg-gray-900 shadow border border-gray-200 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="text-indigo-700 dark:text-indigo-200">Upload via Excel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 mb-4">
                <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                  <SelectTrigger className="w-32 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <SelectValue placeholder="Grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {gradeOptions.map(grade => (
                      <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedGrade}>
                  <SelectTrigger className="w-32 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <SelectValue placeholder="Section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectionOptions.map(section => (
                      <SelectItem key={section} value={section}>{section}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} className="w-48 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" />
                <Button onClick={generateAttendanceTemplate} disabled={!selectedGrade || !selectedSection || !attendanceDate || loadingTemplate} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow">
                  {loadingTemplate ? "Generating..." : "Generate Attendance Template"}
                </Button>
              </div>
              <Input type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="border-2 border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-4" />
              {file && (
                <p className="text-sm text-green-600">Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)</p>
              )}
              {showPreview && previewData.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-indigo-700 dark:text-indigo-200">Preview ({previewData.length} attendance records):</h3>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3">Attendance Summary:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">{getAttendanceStats().total}</div>
                        <div className="text-gray-600 dark:text-gray-400">Total Students</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{getAttendanceStats().present}</div>
                        <div className="text-gray-600 dark:text-gray-400">Present</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{getAttendanceStats().absent}</div>
                        <div className="text-gray-600 dark:text-gray-400">Absent</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{getAttendanceStats().presentPercent}%</div>
                        <div className="text-gray-600 dark:text-gray-400">Attendance Rate</div>
                      </div>
                    </div>
                  </div>
                  <div className="max-h-64 overflow-auto border rounded-lg border-gray-100 dark:border-gray-800">
                    <Table>
                      <TableHeader className="bg-gray-100 dark:bg-gray-800">
                        <TableRow>
                          <TableHead>eduNestId</TableHead>
                          <TableHead>First Name</TableHead>
                          <TableHead>Last Name</TableHead>
                          <TableHead>Grade</TableHead>
                          <TableHead>Section</TableHead>
                          <TableHead>Attendance (A/P)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.slice(0, 10).map((attendance, index) => (
                          <TableRow key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <TableCell>{attendance.eduNestId}</TableCell>
                            <TableCell>{attendance.firstName}</TableCell>
                            <TableCell>{attendance.lastName}</TableCell>
                            <TableCell>{attendance.grade}</TableCell>
                            <TableCell>{attendance.section}</TableCell>
                            <TableCell>{attendance.attendance}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {previewData.length > 10 && (
                    <p className="text-sm text-gray-500">Showing first 10 records. Total: {previewData.length}</p>
                  )}
                </div>
              )}
              <Button onClick={handleUpload} disabled={!file || uploading || previewData.length === 0} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow">
                {uploading ? "Uploading..." : `Upload ${previewData.length} Attendance Records`}
              </Button>
              {uploadResult && (
                <Alert className={uploadResult.success ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950" : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"}>
                  <div className="flex items-center gap-2">
                    {uploadResult.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertDescription className={uploadResult.success ? "text-green-800 dark:text-green-300" : "text-red-800 dark:text-red-300"}>
                      {uploadResult.message}
                      {uploadResult.errors && (
                        <ul className="mt-2 list-disc list-inside">
                          {uploadResult.errors.slice(0, 5).map((error, index) => (
                            <li key={index} className="text-sm">{error}</li>
                          ))}
                          {uploadResult.errors.length > 5 && (
                            <li className="text-sm">... and {uploadResult.errors.length - 5} more errors</li>
                          )}
                        </ul>
                      )}
                    </AlertDescription>
                  </div>
                </Alert>
              )}
            </CardContent>
          </Card>
          {/* Recent Attendance Uploads (only in Excel tab) */}
          <Card className="mt-6 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow">
            <CardHeader>
              <CardTitle className="text-indigo-700 dark:text-indigo-200">Recent Attendance Uploads</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader className="bg-gray-100 dark:bg-gray-800">
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>File Name</TableHead>
                    <TableHead>Students Count</TableHead>
                    <TableHead>Present</TableHead>
                    <TableHead>Absent</TableHead>
                    <TableHead>Attendance Rate</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <TableCell>2024-01-15 10:30 AM</TableCell>
                    <TableCell>grade_8_attendance.xlsx</TableCell>
                    <TableCell>30</TableCell>
                    <TableCell><span className="text-green-600 font-medium">28</span></TableCell>
                    <TableCell><span className="text-red-600 font-medium">2</span></TableCell>
                    <TableCell><span className="text-blue-600 font-medium">93.3%</span></TableCell>
                    <TableCell><span className="text-green-600 font-medium">Success</span></TableCell>
                  </TableRow>
                  <TableRow className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <TableCell>2024-01-14 02:15 PM</TableCell>
                    <TableCell>grade_9_attendance.xlsx</TableCell>
                    <TableCell>25</TableCell>
                    <TableCell><span className="text-green-600 font-medium">24</span></TableCell>
                    <TableCell><span className="text-red-600 font-medium">1</span></TableCell>
                    <TableCell><span className="text-blue-600 font-medium">96.0%</span></TableCell>
                    <TableCell><span className="text-green-600 font-medium">Success</span></TableCell>
                  </TableRow>
                  <TableRow className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <TableCell>2024-01-13 09:45 AM</TableCell>
                    <TableCell>grade_7_attendance.xlsx</TableCell>
                    <TableCell>28</TableCell>
                    <TableCell><span className="text-green-600 font-medium">26</span></TableCell>
                    <TableCell><span className="text-red-600 font-medium">2</span></TableCell>
                    <TableCell><span className="text-blue-600 font-medium">92.9%</span></TableCell>
                    <TableCell><span className="text-green-600 font-medium">Success</span></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}