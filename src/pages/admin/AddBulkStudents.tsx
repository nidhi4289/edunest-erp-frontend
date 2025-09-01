import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus, Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import * as XLSX from 'xlsx';
// import { api } from "@/services/api"; // Commented out since backend not present

interface StudentData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  grade: string;
  admissionDate: string;
  fatherName: string;
  motherName: string;
  address: string;
  uniqueId: string;
}

interface UploadResult {
  success: boolean;
  message: string;
  successCount?: number;
  errorCount?: number;
  errors?: string[];
}

export default function AddBulkStudents() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [previewData, setPreviewData] = useState<StudentData[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Sample data for the Excel template
  const sampleData: StudentData[] = [
    {
      firstName: "John",
      lastName: "Doe",
      dateOfBirth: "2010-05-15",
      gender: "Male",
      grade: "Grade 8",
      admissionDate: "2024-01-15",
      fatherName: "Robert Doe",
      motherName: "Jane Doe",
      address: "123 Main St, City, State, 12345",
      uniqueId: "STU001"
    },
    {
      firstName: "Sarah",
      lastName: "Smith",
      dateOfBirth: "2009-08-22",
      gender: "Female",
      grade: "Grade 9",
      admissionDate: "2024-01-15",
      fatherName: "Michael Smith",
      motherName: "Lisa Smith",
      address: "456 Oak Ave, City, State, 12345",
      uniqueId: "STU002"
    }
  ];

  const downloadTemplate = () => {
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    
    // Convert sample data to worksheet format
    const worksheetData = [
      // Header row
      [
        "Student First Name",
        "Student Last Name", 
        "Date of Birth (YYYY-MM-DD)",
        "Gender",
        "Grade",
        "Admission Date (YYYY-MM-DD)",
        "Father Name",
        "Mother Name",
        "Address",
        "Unique ID"
      ],
      // Sample data rows
      ...sampleData.map(student => [
        student.firstName,
        student.lastName,
        student.dateOfBirth,
        student.gender,
        student.grade,
        student.admissionDate,
        student.fatherName,
        student.motherName,
        student.address,
        student.uniqueId
      ])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Set column widths
    const columnWidths = [
      { wch: 15 }, // firstName
      { wch: 15 }, // lastName
      { wch: 20 }, // dateOfBirth
      { wch: 10 }, // gender
      { wch: 12 }, // grade
      { wch: 20 }, // admissionDate
      { wch: 15 }, // fatherName
      { wch: 15 }, // motherName
      { wch: 30 }, // address
      { wch: 12 }  // uniqueId
    ];
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
    
    // Generate Excel file and download
    XLSX.writeFile(workbook, "student_upload_template.xlsx");
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
        
        // Skip header row and convert to StudentData format
        const students: StudentData[] = (jsonData as string[][])
          .slice(1)
          .filter(row => row.length > 0 && row[0]) // Filter out empty rows
          .map((row, index) => ({
            firstName: row[0] || '',
            lastName: row[1] || '',
            dateOfBirth: row[2] || '',
            gender: row[3] || '',
            grade: row[4] || '',
            admissionDate: row[5] || '',
            fatherName: row[6] || '',
            motherName: row[7] || '',
            address: row[8] || '',
            uniqueId: row[9] || ''
          }));
        
        setPreviewData(students);
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
      previewData.forEach((student, index) => {
        if (!student.firstName || !student.lastName) {
          errors.push(`Row ${index + 2}: First name and last name are required`);
        }
        if (!student.uniqueId) {
          errors.push(`Row ${index + 2}: Unique ID is required`);
        }
        if (student.dateOfBirth && !isValidDate(student.dateOfBirth)) {
          errors.push(`Row ${index + 2}: Invalid date of birth format`);
        }
        if (student.admissionDate && !isValidDate(student.admissionDate)) {
          errors.push(`Row ${index + 2}: Invalid admission date format`);
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
      const response = await api.post('/admin/bulk-add-students', {
        students: previewData
      });
      
      // Handle successful response
      setUploadResult({
        success: true,
        message: response.data.message || `Successfully uploaded ${previewData.length} students`,
        successCount: response.data.successCount || previewData.length,
        errorCount: response.data.errorCount || 0
      });
      */

      // Hardcoded success response for now
      setUploadResult({
        success: true,
        message: `Successfully uploaded ${previewData.length} students`,
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
      
      // Hardcoded error response for testing (uncomment to test error state)
      // setUploadResult({
      //   success: false,
      //   message: 'Upload failed. Please try again.'
      // });
      
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const isValidDate = (dateString: string): boolean => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <UserPlus className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Add Bulk Students</h1>
            <p className="text-white/80">Upload multiple students using Excel file</p>
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
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">How to upload students:</h3>
            <ol className="list-decimal list-inside space-y-1 text-blue-800">
              <li>Download the Excel template below</li>
              <li>Fill in the student information (remove sample data)</li>
              <li>Ensure all required fields are completed</li>
              <li>Upload the completed Excel file</li>
              <li>Review the preview and confirm the upload</li>
            </ol>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              onClick={downloadTemplate}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <Download className="h-4 w-4" />
              Download Excel Template
            </Button>
            <span className="text-sm text-gray-500">
              Template includes sample data and proper formatting
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Students
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
              <h3 className="font-semibold">Preview ({previewData.length} students):</h3>
              <div className="max-h-64 overflow-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>DOB</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Unique ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.slice(0, 10).map((student, index) => (
                      <TableRow key={index}>
                        <TableCell>{student.firstName} {student.lastName}</TableCell>
                        <TableCell>{student.dateOfBirth}</TableCell>
                        <TableCell>{student.gender}</TableCell>
                        <TableCell>{student.grade}</TableCell>
                        <TableCell>{student.uniqueId}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {previewData.length > 10 && (
                <p className="text-sm text-gray-500">
                  Showing first 10 students. Total: {previewData.length}
                </p>
              )}
            </div>
          )}

          <Button 
            onClick={handleUpload}
            disabled={!file || uploading || previewData.length === 0}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600"
          >
            {uploading ? "Uploading..." : `Upload ${previewData.length} Students`}
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
          <CardTitle>Recent Uploads</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>File Name</TableHead>
                <TableHead>Students Count</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>2024-01-15 10:30 AM</TableCell>
                <TableCell>grade_8_students.xlsx</TableCell>
                <TableCell>25</TableCell>
                <TableCell>
                  <span className="text-green-600 font-medium">Success</span>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>2024-01-14 02:15 PM</TableCell>
                <TableCell>new_admissions.xlsx</TableCell>
                <TableCell>12</TableCell>
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