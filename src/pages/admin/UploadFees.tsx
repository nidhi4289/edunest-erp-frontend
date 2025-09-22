import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import * as XLSX from 'xlsx';
import { api } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

interface FeesData {
  firstName: string;
  lastName: string;
  fatherName: string;
  dateOfBirth: string;
  student_edunest_id: string;
  fee_collected: string;
  fee_waived: string;
  waiver_reason: string;
  grade: string;
  section: string;
}

interface UploadResult {
  success: boolean;
  message: string;
  successCount?: number;
  errorCount?: number;
  errors?: string[];
}

export default function UploadFees() {
  const { token } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [previewData, setPreviewData] = useState<FeesData[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Sample data for the Excel template
  const sampleData: FeesData[] = [
    {
      firstName: "Shivansh",
      lastName: "Sharma",
      fatherName: "Ankit",
      dateOfBirth: "2015-02-03",
      student_edunest_id: "ST-ShivanshSharma20150204",
      fee_collected: "250",
      fee_waived: "0",
      waiver_reason: "",
      grade: "8",
      section: "A"
    },
    {
      firstName: "Rahul",
      lastName: "Patel",
      fatherName: "Suresh",
      dateOfBirth: "2014-12-15",
      student_edunest_id: "ST-RahulPatel20140215",
      fee_collected: "500",
      fee_waived: "100",
      waiver_reason: "Scholarship",
      grade: "9",
      section: "B"
    },
    {
      firstName: "Priya",
      lastName: "Singh",
      fatherName: "Rajesh",
      dateOfBirth: "2016-03-10",
      student_edunest_id: "ST-PriyaSingh20160310",
      fee_collected: "800",
      fee_waived: "0",
      waiver_reason: "",
      grade: "7",
      section: "C"
    }
  ];

  const downloadTemplate = () => {
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    
    // Convert sample data to worksheet format
    const worksheetData = [
      // Header row
      [
        "firstName",
        "lastName",
        "fatherName",
        "dateOfBirth",
        "student_edunest_id",
        "fee_collected",
        "fee_waived",
        "waiver_reason",
        "grade",
        "section"
      ],
      // Sample data rows
      ...sampleData.map(fees => [
        fees.firstName,
        fees.lastName,
        fees.fatherName,
        fees.dateOfBirth,
        fees.student_edunest_id,
        fees.fee_collected,
        fees.fee_waived,
        fees.waiver_reason,
        fees.grade,
        fees.section
      ])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Set column widths
    const columnWidths = [
      { wch: 15 }, // firstName
      { wch: 15 }, // lastName
      { wch: 15 }, // fatherName
      { wch: 12 }, // dateOfBirth
      { wch: 25 }, // student_edunest_id
      { wch: 15 }, // fee_collected
      { wch: 12 }, // fee_waived
      { wch: 20 }, // waiver_reason
      { wch: 8 },  // grade
      { wch: 10 }  // section
    ];
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Fees");
    
    // Generate Excel file and download
    XLSX.writeFile(workbook, "fees_upload_template.xlsx");
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
        
        // Skip header row and convert to FeesData format
        const fees: FeesData[] = (jsonData as string[][])
          .slice(1)
          .filter(row => row.length > 0 && row[0]) // Filter out empty rows
          .map((row, index) => ({
            firstName: row[0] || '',
            lastName: row[1] || '',
            fatherName: row[2] || '',
            dateOfBirth: row[3] || '',
            student_edunest_id: row[4] || '',
            fee_collected: row[5] || '0',
            fee_waived: row[6] || '0',
            waiver_reason: row[7] || '',
            grade: row[8] || '',
            section: row[9] || ''
          }));
        
        setPreviewData(fees);
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

  const isValidDate = (dateString: string): boolean => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  };

  const handleUpload = async () => {
    if (!file || previewData.length === 0) return;

    setUploading(true);
    
    try {
      // Validate data before upload
      const errors: string[] = [];
      previewData.forEach((fees, index) => {
        if (!fees.firstName) {
          errors.push(`Row ${index + 2}: First name is required`);
        }
        if (!fees.lastName) {
          errors.push(`Row ${index + 2}: Last name is required`);
        }
        if (!fees.fatherName) {
          errors.push(`Row ${index + 2}: Father name is required`);
        }
        if (!fees.dateOfBirth) {
          errors.push(`Row ${index + 2}: Date of birth is required`);
        } else if (!isValidDate(fees.dateOfBirth)) {
          errors.push(`Row ${index + 2}: Date of birth must be in YYYY-MM-DD format`);
        }
        if (!fees.student_edunest_id) {
          errors.push(`Row ${index + 2}: Student EduNest ID is required`);
        }
        if (!fees.fee_collected || isNaN(Number(fees.fee_collected))) {
          errors.push(`Row ${index + 2}: Valid fee collected amount is required`);
        }
        if (fees.fee_waived && isNaN(Number(fees.fee_waived))) {
          errors.push(`Row ${index + 2}: Fee waived must be a valid number`);
        }
        if (!fees.grade) {
          errors.push(`Row ${index + 2}: Grade is required`);
        }
        if (!fees.section) {
          errors.push(`Row ${index + 2}: Section is required`);
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

      // Prepare data for backend API
      const feesForBackend = previewData.map(fees => ({
        firstName: fees.firstName,
        lastName: fees.lastName,
        fatherName: fees.fatherName,
        dateOfBirth: fees.dateOfBirth,
        studentEduNestId: fees.student_edunest_id,
        dateOfCollection: new Date().toISOString(),
        feeCollected: parseFloat(fees.fee_collected),
        feeWaived: parseFloat(fees.fee_waived) || 0,
        waiverReason: fees.waiver_reason || "",
        grade: String(fees.grade), 
        section: String(fees.section) 
      }));

  // Backend API call
  const response = await api.post(`${import.meta.env.VITE_API_URL}/api/Fees/bulk`, feesForBackend, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Handle successful response
      setUploadResult({
        success: true,
        message: response.data.message || `Successfully uploaded fees for ${previewData.length} students`,
        successCount: response.data.successCount || previewData.length,
        errorCount: response.data.errorCount || 0
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
      console.error('Upload error:', error);
      setUploadResult({
        success: false,
        message: error.response?.data?.message || 'Upload failed. Please try again.',
        errors: error.response?.data?.errors || []
      });
    } finally {
      setUploading(false);
    }
  };

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    return isNaN(num) ? amount : `₹${num.toLocaleString()}`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <DollarSign className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Upload Fees</h1>
            <p className="text-white/80">Upload student fees records using Excel file</p>
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
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-2">How to upload fees:</h3>
            <ol className="list-decimal list-inside space-y-1 text-green-800">
              <li>Download the Excel template below</li>
              <li>Fill in the fees information (replace sample data with real data)</li>
              <li>Ensure all required fields are completed</li>
              <li>Upload the completed Excel file</li>
              <li>Review the preview and confirm the upload</li>
            </ol>
          </div>
          
          <div className="bg-amber-50 p-4 rounded-lg">
            <h4 className="font-semibold text-amber-900 mb-2">Required Fields:</h4>
            <ul className="list-disc list-inside space-y-1 text-amber-800 text-sm">
              <li><strong>firstName:</strong> Student's first name</li>
              <li><strong>lastName:</strong> Student's last name</li>
              <li><strong>fatherName:</strong> Father's name</li>
              <li><strong>dateOfBirth:</strong> Date of birth in YYYY-MM-DD format</li>
              <li><strong>student_edunest_id:</strong> Must match existing student records</li>
              <li><strong>fee_collected:</strong> Amount collected from student (numeric)</li>
              <li><strong>fee_waived:</strong> Amount waived (numeric, optional - defaults to 0)</li>
              <li><strong>waiver_reason:</strong> Reason for waiver (optional)</li>
              <li><strong>grade:</strong> Student's grade/class</li>
              <li><strong>section:</strong> Student's section</li>
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
            Upload Fees Records
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
              <h3 className="font-semibold">Preview ({previewData.length} fee records):</h3>
              <div className="max-h-64 overflow-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Father Name</TableHead>
                      <TableHead>DOB</TableHead>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Fee Collected</TableHead>
                      <TableHead>Fee Waived</TableHead>
                      <TableHead>Waiver Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.slice(0, 10).map((fees, index) => {
                      return (
                        <TableRow key={index}>
                          <TableCell>{fees.firstName} {fees.lastName}</TableCell>
                          <TableCell>{fees.fatherName}</TableCell>
                          <TableCell>{fees.dateOfBirth}</TableCell>
                          <TableCell className="font-mono text-xs">{fees.student_edunest_id}</TableCell>
                          <TableCell>{fees.grade}</TableCell>
                          <TableCell>{fees.section}</TableCell>
                          <TableCell>{formatCurrency(fees.fee_collected)}</TableCell>
                          <TableCell>{formatCurrency(fees.fee_waived)}</TableCell>
                          <TableCell className="text-sm">{fees.waiver_reason || '-'}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {previewData.length > 10 && (
                <p className="text-sm text-gray-500">
                  Showing first 10 records. Total: {previewData.length}
                </p>
              )}
              
              {/* Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Upload Summary:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Records:</span>
                    <p className="font-medium">{previewData.length}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Collected:</span>
                    <p className="font-medium text-green-600">
                      {formatCurrency(
                        previewData.reduce((sum, fees) => sum + (parseFloat(fees.fee_collected) || 0), 0).toString()
                      )}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Waived:</span>
                    <p className="font-medium text-orange-600">
                      {formatCurrency(
                        previewData.reduce((sum, fees) => sum + (parseFloat(fees.fee_waived) || 0), 0).toString()
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Button 
            onClick={handleUpload}
            disabled={!file || uploading || previewData.length === 0}
            className="w-full bg-gradient-to-r from-green-500 to-teal-600"
          >
            {uploading ? "Uploading..." : `Upload ${previewData.length} Fee Records`}
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
          <CardTitle>Recent Fee Uploads</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>File Name</TableHead>
                <TableHead>Records Count</TableHead>
                <TableHead>Total Collected</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>2024-01-15 10:30 AM</TableCell>
                <TableCell>january_fees.xlsx</TableCell>
                <TableCell>45</TableCell>
                <TableCell>₹2,25,000</TableCell>
                <TableCell>
                  <span className="text-green-600 font-medium">Success</span>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>2024-01-14 02:15 PM</TableCell>
                <TableCell>grade_8_fees.xlsx</TableCell>
                <TableCell>25</TableCell>
                <TableCell>₹1,25,000</TableCell>
                <TableCell>
                  <span className="text-green-600 font-medium">Success</span>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>2024-01-13 09:45 AM</TableCell>
                <TableCell>december_fees.xlsx</TableCell>
                <TableCell>52</TableCell>
                <TableCell>₹2,60,000</TableCell>
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