import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import * as XLSX from 'xlsx';
// import { api } from "@/services/api"; // Commented out since backend not present

interface AttendanceData {
  firstName: string;
  lastName: string;
  grade: string;
  section: string;
  teacher: string;
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
  const [file, setFile] = useState<File | null>(null);
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

  const downloadTemplate = () => {
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    
    // Convert sample data to worksheet format
    const worksheetData = [
      // Header row
      [
        "First Name",
        "Last Name", 
        "Grade",
        "Section",
        "Teacher",
        "Attendance (Present/Absent)"
      ],
      // Sample data rows
      ...sampleData.map(attendance => [
        attendance.firstName,
        attendance.lastName,
        attendance.grade,
        attendance.section,
        attendance.teacher,
        attendance.attendance
      ])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Set column widths
    const columnWidths = [
      { wch: 15 }, // firstName
      { wch: 15 }, // lastName
      { wch: 12 }, // grade
      { wch: 10 }, // section
      { wch: 15 }, // teacher
      { wch: 20 }  // attendance
    ];
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
    
    // Generate Excel file and download
    const today = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `attendance_template_${today}.xlsx`);
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
        
        // Skip header row and convert to AttendanceData format
        const attendance: AttendanceData[] = (jsonData as string[][])
          .slice(1)
          .filter(row => row.length > 0 && row[0]) // Filter out empty rows
          .map((row, index) => ({
            firstName: row[0] || '',
            lastName: row[1] || '',
            grade: row[2] || '',
            section: row[3] || '',
            teacher: row[4] || '',
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
      // Validate data before upload
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
        if (!attendance.teacher) {
          errors.push(`Row ${index + 2}: Teacher name is required`);
        }
        if (!attendance.attendance || !['Present', 'Absent'].includes(attendance.attendance)) {
          errors.push(`Row ${index + 2}: Attendance must be either "Present" or "Absent"`);
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

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      /* 
      // Backend API call - Commented out until backend is ready
      const response = await api.post('/staff/upload-attendance', {
        attendance: previewData,
        date: new Date().toISOString().split('T')[0]
      });
      
      // Handle successful response
      setUploadResult({
        success: true,
        message: response.data.message || `Successfully uploaded attendance for ${previewData.length} students`,
        successCount: response.data.successCount || previewData.length,
        errorCount: response.data.errorCount || 0
      });
      */

      // Hardcoded success response for now
      setUploadResult({
        success: true,
        message: `Successfully uploaded attendance for ${previewData.length} students`,
        successCount: previewData.length,
        errorCount: 0
      });

      // Clear file and preview on success
      setFile(null);
      setPreviewData([]);
      setShowPreview(false);
      
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

    } catch (error: any) {
      /*
      // Backend error handling - Commented out until backend is ready
      setUploadResult({
        success: false,
        message: error.response?.data?.message || 'Upload failed. Please try again.',
        errors: error.response?.data?.errors || []
      });
      */
      
      console.error('Upload error:', error);
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

  const getAttendanceStats = () => {
    const present = previewData.filter(item => item.attendance === 'Present').length;
    const absent = previewData.filter(item => item.attendance === 'Absent').length;
    const total = previewData.length;
    const presentPercent = total > 0 ? ((present / total) * 100).toFixed(1) : '0';
    
    return { present, absent, total, presentPercent };
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <Clock className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Upload Attendance</h1>
            <p className="text-white/80">Upload student attendance records using Excel file</p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="font-semibold text-orange-900 mb-2">How to upload attendance:</h3>
            <ol className="list-decimal list-inside space-y-1 text-orange-800">
              <li>Download the Excel template below</li>
              <li>Fill in the attendance information (remove sample data)</li>
              <li>Ensure all required fields are completed</li>
              <li>Use only "Present" or "Absent" for attendance status</li>
              <li>Upload the completed Excel file</li>
              <li>Review the preview and confirm the upload</li>
            </ol>
          </div>
          
          <div className="bg-amber-50 p-4 rounded-lg">
            <h4 className="font-semibold text-amber-900 mb-2">Important Notes:</h4>
            <ul className="list-disc list-inside space-y-1 text-amber-800 text-sm">
              <li>All fields are required</li>
              <li>Attendance must be exactly "Present" or "Absent" (case-sensitive)</li>
              <li>Grade format: "Grade 8", "Grade 9", etc.</li>
              <li>Section should be single letter: "A", "B", "C", etc.</li>
              <li>Teacher name should match the assigned class teacher</li>
            </ul>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              onClick={downloadTemplate}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              Download Excel Template
            </Button>
            <span className="text-sm text-gray-500">
              Template includes sample data for today's date
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Attendance Records
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="border-2 border-dashed border-gray-300 p-4"
            />
            {file && (
              <p className="text-sm text-green-600">
                Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          {showPreview && previewData.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Preview ({previewData.length} attendance records):</h3>
              
              {/* Attendance Statistics */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Attendance Summary:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-800">{getAttendanceStats().total}</div>
                    <div className="text-gray-600">Total Students</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{getAttendanceStats().present}</div>
                    <div className="text-gray-600">Present</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{getAttendanceStats().absent}</div>
                    <div className="text-gray-600">Absent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{getAttendanceStats().presentPercent}%</div>
                    <div className="text-gray-600">Attendance Rate</div>
                  </div>
                </div>
              </div>
              
              <div className="max-h-64 overflow-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Attendance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.slice(0, 10).map((attendance, index) => (
                      <TableRow key={index}>
                        <TableCell>{attendance.firstName} {attendance.lastName}</TableCell>
                        <TableCell>{attendance.grade}</TableCell>
                        <TableCell>{attendance.section}</TableCell>
                        <TableCell>{attendance.teacher}</TableCell>
                        <TableCell>{getAttendanceBadge(attendance.attendance)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {previewData.length > 10 && (
                <p className="text-sm text-gray-500">
                  Showing first 10 records. Total: {previewData.length}
                </p>
              )}
            </div>
          )}

          <Button 
            onClick={handleUpload}
            disabled={!file || uploading || previewData.length === 0}
            className="w-full bg-gradient-to-r from-orange-500 to-red-600"
          >
            {uploading ? "Uploading..." : `Upload ${previewData.length} Attendance Records`}
          </Button>
        </CardContent>
      </Card>

      {/* Upload Result */}
      {uploadResult && (
        <Alert className={uploadResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <div className="flex items-center gap-2">
            {uploadResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={uploadResult.success ? "text-green-800" : "text-red-800"}>
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

      {/* Recent Uploads */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Attendance Uploads</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
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
              <TableRow>
                <TableCell>2024-01-15 10:30 AM</TableCell>
                <TableCell>grade_8_attendance.xlsx</TableCell>
                <TableCell>30</TableCell>
                <TableCell>
                  <span className="text-green-600 font-medium">28</span>
                </TableCell>
                <TableCell>
                  <span className="text-red-600 font-medium">2</span>
                </TableCell>
                <TableCell>
                  <span className="text-blue-600 font-medium">93.3%</span>
                </TableCell>
                <TableCell>
                  <span className="text-green-600 font-medium">Success</span>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>2024-01-14 02:15 PM</TableCell>
                <TableCell>grade_9_attendance.xlsx</TableCell>
                <TableCell>25</TableCell>
                <TableCell>
                  <span className="text-green-600 font-medium">24</span>
                </TableCell>
                <TableCell>
                  <span className="text-red-600 font-medium">1</span>
                </TableCell>
                <TableCell>
                  <span className="text-blue-600 font-medium">96.0%</span>
                </TableCell>
                <TableCell>
                  <span className="text-green-600 font-medium">Success</span>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>2024-01-13 09:45 AM</TableCell>
                <TableCell>grade_7_attendance.xlsx</TableCell>
                <TableCell>28</TableCell>
                <TableCell>
                  <span className="text-green-600 font-medium">26</span>
                </TableCell>
                <TableCell>
                  <span className="text-red-600 font-medium">2</span>
                </TableCell>
                <TableCell>
                  <span className="text-blue-600 font-medium">92.9%</span>
                </TableCell>
                <TableCell>
                  <span className="text-green-600 font-medium">Success</span>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}