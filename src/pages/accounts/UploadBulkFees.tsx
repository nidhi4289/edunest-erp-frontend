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
import { toProperCase } from "@/lib/utils";

interface ClassData {
  id: string;
  grade: string;
  section: string;
  name: string;
  subjects?: any[];
  subjectIds?: string[];
}

// Helper function to validate alphabetic names (allows spaces, hyphens, apostrophes)
const isValidName = (name: string): boolean => {
  if (!name || typeof name !== 'string') return false;
  // Allow letters, spaces, hyphens, and apostrophes (for names like O'Connor, Mary-Jane)
  const nameRegex = /^[a-zA-Z\s'-]+$/;
  return nameRegex.test(name.trim()) && name.trim().length > 0;
};

// Helper function to validate email format
const isValidEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

// Helper function to clean numeric fields (remove leading zeros but keep the value)
const cleanNumericField = (value: any): string => {
  if (!value) return '';
  const stringValue = String(value).trim();
  // Remove leading zeros but keep at least one digit
  return stringValue.replace(/^0+(?=\d)/, '') || '0';
};

// Helper function to validate grade/section against actual master data
const isValidGradeSection = (value: string, validValues: string[]): boolean => {
  if (!value || typeof value !== 'string') return false;
  return validValues.includes(value.trim());
};

// Helper function to convert text to camel case
const toCamelCase = (text: string): string => {
  if (!text || typeof text !== 'string') return text;
  
  return text
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      if (index === 0) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join('');
};

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

export default function UploadBulkFees() {
  const { token, masterDataClasses } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [previewData, setPreviewData] = useState<FeesData[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Get valid grades and sections from master data
  const validGrades = [...new Set(masterDataClasses.map(cls => String(cls.grade)))];
  const validSections = [...new Set(masterDataClasses.map(cls => String(cls.section)))];
  
  // Function to validate if a grade-section combination exists
  const isValidGradeSectionCombination = (grade: string, section: string): boolean => {
    return masterDataClasses.some(cls => 
      String(cls.grade) === String(grade) && String(cls.section) === String(section)
    );
  };

  // Sample data for the Excel template
  const sampleData: FeesData[] = [
    {
      firstName: "Shivansh",
      lastName: "Sharma",
      fatherName: "Ankit",
      dateOfBirth: "03-02-2015",
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
      dateOfBirth: "15-12-2014",
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
      dateOfBirth: "10-03-2016",
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
        "dateOfBirth (DD-MM-YYYY)",
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
    ];    worksheet['!cols'] = columnWidths;

    // Format dateOfBirth column (column D, index 3) as text to prevent Excel auto-formatting
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:J100');
    for (let row = 1; row <= range.e.r; row++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: 3 }); // Column D (dateOfBirth)
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].t = 's'; // Set cell type as string/text
        worksheet[cellAddress].z = '@'; // Set number format as text
      }
    }

    // Add data validation and instructions as comments
    if (!worksheet['!comments']) worksheet['!comments'] = [];
    
    // Add comment to dateOfBirth header cell
    worksheet['!comments'].push({
      ref: 'D1',
      a: 'System',
      t: 'IMPORTANT: Keep date format as DD-MM-YYYY (e.g., 31-08-2015). Do not let Excel change this format!'
    });

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "BulkFees");
    
    // Generate filename with current date and time
    const now = new Date();
    const dateString = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const timeString = now.toTimeString().slice(0, 8).replace(/:/g, '-'); // HH-MM-SS
    const filename = `bulk_fees_upload_template_${dateString}_${timeString}.xlsx`;
    
    // Generate Excel file and download
    XLSX.writeFile(workbook, filename);
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
            firstName: toProperCase(row[0] || ''),
            lastName: toProperCase(row[1] || ''),
            fatherName: toProperCase(row[2] || ''),
            dateOfBirth: parseAndFormatDate(row[3]) || '',
            student_edunest_id: row[4] || '',
            fee_collected: cleanNumericField(row[5]) || '0',
            fee_waived: cleanNumericField(row[6]) || '0',
            waiver_reason: row[7] || '',
            grade: String(row[8] || ''),
            section: String(row[9] || '')
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
    const regex = /^\d{2}-\d{2}-\d{4}$/;
    if (!regex.test(dateString)) return false;
    const [day, month, year] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date instanceof Date && !isNaN(date.getTime()) &&
           date.getDate() === parseInt(day) &&
           date.getMonth() === parseInt(month) - 1 &&
           date.getFullYear() === parseInt(year);
  };

  const handleUpload = async () => {
    if (!file || previewData.length === 0) return;

    setUploading(true);
    
    try {
      // Validate data before upload
      const errors: string[] = [];
      previewData.forEach((fees, index) => {
        const rowNumber = index + 2; // +2 because index starts at 0 and we skip header row
        
        if (!fees.firstName || !fees.firstName.trim()) {
          errors.push(`Row ${rowNumber}: First name is required`);
        } else if (!isValidName(fees.firstName)) {
          errors.push(`Row ${rowNumber}: First name should contain only alphabets, spaces, hyphens, and apostrophes`);
        }
        
        if (!fees.lastName || !fees.lastName.trim()) {
          errors.push(`Row ${rowNumber}: Last name is required`);
        } else if (!isValidName(fees.lastName)) {
          errors.push(`Row ${rowNumber}: Last name should contain only alphabets, spaces, hyphens, and apostrophes`);
        }
        
        if (!fees.fatherName || !fees.fatherName.trim()) {
          errors.push(`Row ${rowNumber}: Father name is required`);
        } else if (!isValidName(fees.fatherName)) {
          errors.push(`Row ${rowNumber}: Father name should contain only alphabets, spaces, hyphens, and apostrophes`);
        }
        
        if (!fees.dateOfBirth || !fees.dateOfBirth.trim()) {
          errors.push(`Row ${rowNumber}: Date of birth is required`);
        } else if (!isValidDate(fees.dateOfBirth)) {
          errors.push(`Row ${rowNumber}: Date of birth must be in DD-MM-YYYY format (e.g., 31-08-2015)`);
        }
        
        if (!fees.student_edunest_id || !fees.student_edunest_id.trim()) {
          errors.push(`Row ${rowNumber}: Student EduNest ID is required`);
        }
        
        if (!fees.fee_collected || isNaN(Number(fees.fee_collected))) {
          errors.push(`Row ${rowNumber}: Valid fee collected amount is required`);
        } else if (Number(fees.fee_collected) < 0) {
          errors.push(`Row ${rowNumber}: Fee collected amount cannot be negative`);
        }
        
        if (fees.fee_waived && isNaN(Number(fees.fee_waived))) {
          errors.push(`Row ${rowNumber}: Fee waived must be a valid number`);
        } else if (fees.fee_waived && Number(fees.fee_waived) < 0) {
          errors.push(`Row ${rowNumber}: Fee waived amount cannot be negative`);
        }
        
        if (!fees.grade || !fees.grade.trim()) {
          errors.push(`Row ${rowNumber}: Grade is required`);
        } else if (!isValidGradeSection(fees.grade, validGrades)) {
          errors.push(`Row ${rowNumber}: Grade "${fees.grade}" is not a valid grade. Valid grades are: ${validGrades.join(', ')}`);
        }
        
        if (!fees.section || !fees.section.trim()) {
          errors.push(`Row ${rowNumber}: Section is required`);
        } else if (!isValidGradeSection(fees.section, validSections)) {
          errors.push(`Row ${rowNumber}: Section "${fees.section}" is not a valid section. Valid sections are: ${validSections.join(', ')}`);
        }
        
        // Grade-Section combination validation
        if (fees.grade && fees.section && 
            isValidGradeSection(fees.grade, validGrades) && 
            isValidGradeSection(fees.section, validSections)) {
          if (!isValidGradeSectionCombination(fees.grade, fees.section)) {
            errors.push(`Row ${rowNumber}: Grade "${fees.grade}" and Section "${fees.section}" combination does not exist in the system`);
          }
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
        firstName: toCamelCase(fees.firstName.trim()),
        lastName: toCamelCase(fees.lastName.trim()),
        fatherName: toCamelCase(fees.fatherName.trim()),
        dateOfBirth: fees.dateOfBirth ? (() => {
          const [day, month, year] = fees.dateOfBirth.split('-');
          // Create date in UTC to avoid timezone issues
          const utcDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
          return utcDate.toISOString(); // Returns UTC format: YYYY-MM-DDTHH:mm:ss.sssZ
        })() : null,
        studentEduNestId: fees.student_edunest_id.trim(),
        dateOfCollection: new Date().toISOString(),
        feeCollected: parseFloat(fees.fee_collected),
        feeWaived: parseFloat(fees.fee_waived) || 0,
        waiverReason: fees.waiver_reason ? fees.waiver_reason.trim() : "",
        grade: String(fees.grade).trim(), 
        section: String(fees.section).trim() 
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

  // Enhanced date parsing function to handle multiple formats
  const parseAndFormatDate = (dateValue: any): string => {
    if (!dateValue) return '';
    
    // If it's already a string in DD-MM-YYYY format, return as is
    if (typeof dateValue === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(dateValue)) {
      return dateValue;
    }
    
    // If it's a number (Excel serial date), convert it to DD-MM-YYYY
    if (typeof dateValue === 'number') {
      // Excel serial date starts from 1900-01-01 (serial 1)
      // JavaScript Date starts from 1970-01-01
      const excelEpoch = new Date(1900, 0, 1);
      const date = new Date(excelEpoch.getTime() + (dateValue - 1) * 24 * 60 * 60 * 1000);
      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`; // Return DD-MM-YYYY format
      }
    }
    
    // Try to parse as various date formats
    const dateString = String(dateValue).trim();
    
    // Try different date formats
    const formats = [
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // DD-MM-YYYY or D-M-YYYY (preferred format)
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // DD/MM/YYYY or D/M/YYYY
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD or YYYY-M-D (legacy)
      /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/, // YYYY/MM/DD or YYYY/M/D
    ];
    
    for (const format of formats) {
      const match = dateString.match(format);
      if (match) {
        let year, month, day;
        
        if (format === formats[0] || format === formats[1]) {
          // DD-MM-YYYY or DD/MM/YYYY format (preferred)
          [, day, month, year] = match;
        } else {
          // YYYY-MM-DD or YYYY/MM/DD format (legacy)
          [, year, month, day] = match;
        }
        
        // Ensure month and day are two digits
        month = month.padStart(2, '0');
        day = day.padStart(2, '0');
        
        const formattedDate = `${day}-${month}-${year}`; // Always return DD-MM-YYYY
        
        // Validate the constructed date
        const testDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (!isNaN(testDate.getTime()) && 
            testDate.getDate() === parseInt(day) &&
            testDate.getMonth() === parseInt(month) - 1 &&
            testDate.getFullYear() === parseInt(year)) {
          return formattedDate;
        }
      }
    }
    
    // Try direct Date parsing as last resort
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`; // Return DD-MM-YYYY format
      }
    } catch (e) {
      // Ignore error and return empty string
    }
    
    return ''; // Return empty string if all parsing attempts fail
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
            <h1 className="text-3xl font-bold">Upload Bulk Fees</h1>
            <p className="text-white/80">Upload multiple student fee records using Excel file</p>
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
            <h3 className="font-semibold text-green-900 mb-2">How to upload bulk fees:</h3>
            <ol className="list-decimal list-inside space-y-1 text-green-800">
              <li>Download the Excel template below</li>
              <li>Fill in the fees information (replace sample data with real data)</li>
              <li><strong>MANDATORY FIELDS:</strong> First Name, Last Name, Father Name, Date of Birth, Student EduNest ID, Fee Collected, Grade, Section</li>
              <li><strong>NAME FIELDS:</strong> Use only alphabets, spaces, hyphens (-), and apostrophes (') for names</li>
              <li><strong>DATE FORMAT:</strong> Keep date format as DD-MM-YYYY (e.g., 31-08-2015)</li>
              <li><strong>NUMERIC FIELDS:</strong> Enter fee amounts as regular numbers (leading zeros will be automatically removed)</li>
              <li>Ensure all required fields are completed</li>
              <li>Upload the completed Excel file</li>
              <li>Review the preview and confirm the upload</li>
            </ol>
          </div>
          
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <h3 className="font-semibold text-amber-900 mb-2">📅 Date Format Important Note:</h3>
            <p className="text-amber-800 text-sm">
              To prevent Excel from auto-converting dates: Right-click the "dateOfBirth" column → 
              Format Cells → Category: Text → OK. This keeps dates in DD-MM-YYYY format.
            </p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="font-semibold text-green-900 mb-2">✅ Field Validation Rules:</h3>
            <ul className="text-green-800 text-sm space-y-1">
              <li><strong>Names:</strong> Only alphabets, spaces, hyphens (-), and apostrophes (') allowed</li>
              <li><strong>Date of Birth:</strong> Must be in DD-MM-YYYY format (e.g., 31-08-2015)</li>
              <li><strong>Grade & Section:</strong> Must match existing classes in your school system</li>
              <li><strong>Fee Amounts:</strong> Must be valid positive numbers (leading zeros will be removed)</li>
              <li><strong>Student EduNest ID:</strong> Must match existing student records</li>
              <li><strong>Valid Grades:</strong> {validGrades.length > 0 ? validGrades.join(', ') : 'None configured'}</li>
              <li><strong>Valid Sections:</strong> {validSections.length > 0 ? validSections.join(', ') : 'None configured'}</li>
            </ul>
          </div>
          
          <div className="bg-amber-50 p-4 rounded-lg">
            <h4 className="font-semibold text-amber-900 mb-2">Required Fields:</h4>
            <ul className="list-disc list-inside space-y-1 text-amber-800 text-sm">
              <li><strong>firstName:</strong> Student's first name (alphabets, spaces, hyphens, apostrophes only)</li>
              <li><strong>lastName:</strong> Student's last name (alphabets, spaces, hyphens, apostrophes only)</li>
              <li><strong>fatherName:</strong> Father's name (alphabets, spaces, hyphens, apostrophes only)</li>
              <li><strong>dateOfBirth:</strong> Date of birth in DD-MM-YYYY format (e.g., 31-08-2015)</li>
              <li><strong>student_edunest_id:</strong> Must match existing student records</li>
              <li><strong>fee_collected:</strong> Amount collected from student (numeric, cannot be negative)</li>
              <li><strong>fee_waived:</strong> Amount waived (numeric, optional - defaults to 0, cannot be negative)</li>
              <li><strong>waiver_reason:</strong> Reason for waiver (optional)</li>
              <li><strong>grade:</strong> Student's grade/class (must match existing grades in system)</li>
              <li><strong>section:</strong> Student's section (must match existing sections in system)</li>
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
            Upload Bulk Fee Records
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
            {uploading ? "Uploading..." : `Upload ${previewData.length} Bulk Fee Records`}
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
          <CardTitle>Recent Bulk Fee Uploads</CardTitle>
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