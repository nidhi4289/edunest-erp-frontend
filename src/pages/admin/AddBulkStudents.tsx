import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus, Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import * as XLSX from 'xlsx';
import { api } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { toProperCase } from "@/lib/utils";

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

// Helper function to validate alphabetic names (allows spaces, hyphens, apostrophes)
const isValidName = (name: string): boolean => {
  if (!name || typeof name !== 'string') return false;
  // Allow letters, spaces, hyphens, and apostrophes (for names like O'Connor, Mary-Jane)
  const nameRegex = /^[a-zA-Z\s'-]+$/;
  return nameRegex.test(name.trim()) && name.trim().length > 0;
};

// Helper function to validate grade/section against actual master data
const isValidGradeSection = (value: string, validValues: string[]): boolean => {
  if (!value || typeof value !== 'string') return false;
  return validValues.includes(value.trim());
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

interface ClassData {
  id: string;
  grade: string;
  section: string;
  name: string;
  subjects?: any[];
  subjectIds?: string[];
}

interface StudentData {
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
  const { token, masterDataClasses } = useAuth();

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
  const sampleData: StudentData[] = [
    {
      firstName: "Duggu",
      lastName: "Sharma",
      dateOfBirth: "31-08-2015",
      fatherName: "Pratap Sharma",
      fatherEmail: "abc@gh.lkj",
      motherName: "Meenu Sharma",
      motherEmail: "avb@gh.lkj",
      grade: "7",
      section: "A",
      status: "Active",
      admissionNumber: "123456780",
      phoneNumber: "8826987650",
      secondaryPhoneNumber: "",
      email: "student1@example.com",
      addressLine1: "MJ 44",
      addressLine2: "Jawahar",
      city: "Ratlam",
      state: "MP",
      zipCode: "457001",
      country: "India"
    },
    {
      firstName: "Rahul",
      lastName: "Patel",
      dateOfBirth: "15-12-2014",
      fatherName: "Suresh Patel",
      fatherEmail: "suresh@example.com",
      motherName: "Priya Patel",
      motherEmail: "priya@example.com",
      grade: "7",
      section: "B",
      status: "Active",
      admissionNumber: "123456781",
      phoneNumber: "9876543210",
      secondaryPhoneNumber: "9876543211",
      email: "rahul@example.com",
      addressLine1: "45 Park Street",
      addressLine2: "Sector 7",
      city: "Ratlam",
      state: "MP",
      zipCode: "400001",
      country: "India"
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
        "dateOfBirth (DD-MM-YYYY)",
        "fatherName",
        "fatherEmail",
        "motherName",
        "motherEmail",
        "grade",
        "section",
        "status",
        "admissionNumber",
        "phoneNumber",
        "secondaryPhoneNumber",
        "email",
        "addressLine1",
        "addressLine2",
        "city",
        "state",
        "zipCode",
        "country"
      ],
      // Sample data rows - keep dates as text strings
      ...sampleData.map(student => [
        student.firstName,
        student.lastName,
        student.dateOfBirth, // Keep as text string
        student.fatherName,
        student.fatherEmail,
        student.motherName,
        student.motherEmail,
        student.grade,
        student.section,
        student.status,
        student.admissionNumber,
        student.phoneNumber,
        student.secondaryPhoneNumber,
        student.email,
        student.addressLine1,
        student.addressLine2,
        student.city,
        student.state,
        student.zipCode,
        student.country
      ])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Set column widths
    const columnWidths = [
      { wch: 15 }, // firstName
      { wch: 15 }, // lastName
      { wch: 18 }, // dateOfBirth - wider for format info
      { wch: 15 }, // fatherName
      { wch: 20 }, // fatherEmail
      { wch: 15 }, // motherName
      { wch: 20 }, // motherEmail
      { wch: 8 },  // grade
      { wch: 10 }, // section
      { wch: 10 }, // status
      { wch: 15 }, // admissionNumber
      { wch: 12 }, // phoneNumber
      { wch: 15 }, // secondaryPhoneNumber
      { wch: 20 }, // email
      { wch: 15 }, // addressLine1
      { wch: 15 }, // addressLine2
      { wch: 12 }, // city
      { wch: 10 }, // state
      { wch: 8 },  // zipCode
      { wch: 10 }  // country
    ];
    worksheet['!cols'] = columnWidths;

    // Format dateOfBirth column (column C, index 2) as text to prevent Excel auto-formatting
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:T100');
    for (let row = 1; row <= range.e.r; row++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: 2 }); // Column C (dateOfBirth)
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].t = 's'; // Set cell type as string/text
        worksheet[cellAddress].z = '@'; // Set number format as text
      }
    }

    // Add data validation and instructions as comments
    if (!worksheet['!comments']) worksheet['!comments'] = [];
    
    // Add comment to dateOfBirth header cell
    worksheet['!comments'].push({
      ref: 'C1',
      a: 'System',
      t: 'IMPORTANT: Keep date format as DD-MM-YYYY (e.g., 31-08-2015). Do not let Excel change this format!'
    });

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
    
    // Generate filename with current date and time
    const now = new Date();
    const dateString = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const timeString = now.toTimeString().slice(0, 8).replace(/:/g, '-'); // HH-MM-SS
    const filename = `student_upload_template_${dateString}_${timeString}.xlsx`;
    
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
        
        // Skip header row and convert to StudentData format
        const students: StudentData[] = (jsonData as string[][])
          .slice(1)
          .filter(row => row.length > 0 && row[0]) // Filter out empty rows
          .map((row, index) => ({
            firstName: toProperCase(row[0] || ''),
            lastName: toProperCase(row[1] || ''),
            dateOfBirth: parseAndFormatDate(row[2]) || '', // Use enhanced date parsing
            fatherName: toProperCase(row[3] || ''),
            fatherEmail: row[4] || '',
            motherName: toProperCase(row[5] || ''),
            motherEmail: row[6] || '',
            grade: String(row[7] || ''),
            section: String(row[8] || ''),
            status: row[9] || 'Active',
            admissionNumber: cleanNumericField(row[10]),
            phoneNumber: cleanNumericField(row[11]),
            secondaryPhoneNumber: cleanNumericField(row[12]),
            email: row[13] || '',
            addressLine1: row[14] || '',
            addressLine2: row[15] || '',
            city: toProperCase(row[16] || ''),
            state: toProperCase(row[17] || ''),
            zipCode: cleanNumericField(row[18]),
            country: toProperCase(row[19] || 'India')
          }));
        
        setPreviewData(students);
        setShowPreview(true);
        
        // Check for potential date format issues
        const dateIssues = students.filter(student => 
          student.dateOfBirth && !isValidDate(student.dateOfBirth)
        );
        
        if (dateIssues.length > 0) {
          setUploadResult({
            success: false,
            message: `Found ${dateIssues.length} row(s) with date format issues. Please check the preview and fix dates in YYYY-MM-DD format.`,
            errors: dateIssues.slice(0, 3).map((student, idx) => 
              `Row ${students.indexOf(student) + 2}: Invalid date "${student.dateOfBirth}" for ${student.firstName} ${student.lastName}`
            )
          });
        }
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
        const rowNumber = index + 2; // +2 because index starts at 0 and we skip header row
        
        // Mandatory field validation
        if (!student.firstName || !student.firstName.trim()) {
          errors.push(`Row ${rowNumber}: First name is required`);
        } else if (!isValidName(student.firstName)) {
          errors.push(`Row ${rowNumber}: First name should contain only alphabets, spaces, hyphens, and apostrophes`);
        }
        
        if (!student.lastName || !student.lastName.trim()) {
          errors.push(`Row ${rowNumber}: Last name is required`);
        } else if (!isValidName(student.lastName)) {
          errors.push(`Row ${rowNumber}: Last name should contain only alphabets, spaces, hyphens, and apostrophes`);
        }
        
        if (!student.fatherName || !student.fatherName.trim()) {
          errors.push(`Row ${rowNumber}: Father name is required`);
        } else if (!isValidName(student.fatherName)) {
          errors.push(`Row ${rowNumber}: Father name should contain only alphabets, spaces, hyphens, and apostrophes`);
        }
        
        if (!student.motherName || !student.motherName.trim()) {
          errors.push(`Row ${rowNumber}: Mother name is required`);
        } else if (!isValidName(student.motherName)) {
          errors.push(`Row ${rowNumber}: Mother name should contain only alphabets, spaces, hyphens, and apostrophes`);
        }
        
        // Date of birth validation
        if (!student.dateOfBirth || !student.dateOfBirth.trim()) {
          errors.push(`Row ${rowNumber}: Date of birth is required`);
        } else if (!isValidDate(student.dateOfBirth)) {
          errors.push(`Row ${rowNumber}: Invalid date of birth. Use DD-MM-YYYY format (e.g., 31-08-2015)`);
        }
        
        // Grade validation
        if (!student.grade || !student.grade.trim()) {
          errors.push(`Row ${rowNumber}: Grade is required`);
        } else if (!isValidGradeSection(student.grade, validGrades)) {
          errors.push(`Row ${rowNumber}: Grade "${student.grade}" is not a valid grade. Valid grades are: ${validGrades.join(', ')}`);
        }
        
        // Section validation
        if (!student.section || !student.section.trim()) {
          errors.push(`Row ${rowNumber}: Section is required`);
        } else if (!isValidGradeSection(student.section, validSections)) {
          errors.push(`Row ${rowNumber}: Section "${student.section}" is not a valid section. Valid sections are: ${validSections.join(', ')}`);
        }
        
        // Grade-Section combination validation
        if (student.grade && student.section && 
            isValidGradeSection(student.grade, validGrades) && 
            isValidGradeSection(student.section, validSections)) {
          if (!isValidGradeSectionCombination(student.grade, student.section)) {
            errors.push(`Row ${rowNumber}: Grade "${student.grade}" and Section "${student.section}" combination does not exist in the system`);
          }
        }
        
        // Admission number validation
        if (!student.admissionNumber || !student.admissionNumber.trim()) {
          errors.push(`Row ${rowNumber}: Admission number is required`);
        }
        
        // Email validation (if provided)
        if (student.email && student.email.trim() && !isValidEmail(student.email)) {
          errors.push(`Row ${rowNumber}: Invalid email format for student email`);
        }
        
        // Father email validation (if provided)
        if (student.fatherEmail && student.fatherEmail.trim() && !isValidEmail(student.fatherEmail)) {
          errors.push(`Row ${rowNumber}: Invalid email format for father email`);
        }
        
        // Mother email validation (if provided)
        if (student.motherEmail && student.motherEmail.trim() && !isValidEmail(student.motherEmail)) {
          errors.push(`Row ${rowNumber}: Invalid email format for mother email`);
        }
        
        // City validation (if provided)
        if (student.city && !isValidName(student.city)) {
          errors.push(`Row ${rowNumber}: City name should contain only alphabets, spaces, hyphens, and apostrophes`);
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

      // Prepare data for backend - add eduNestId and format dates
      const studentsForBackend = previewData.map(student => ({
        eduNestId: "", // Backend will generate this
        firstName: toCamelCase(student.firstName.trim()),
        lastName: toCamelCase(student.lastName.trim()),
        dateOfBirth: student.dateOfBirth ? (() => {
          const [day, month, year] = student.dateOfBirth.split('-');
          // Create date in UTC to avoid timezone issues
          const utcDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
          return utcDate.toISOString(); // Returns UTC format: YYYY-MM-DDTHH:mm:ss.sssZ
        })() : null,
        fatherName: toCamelCase(student.fatherName.trim()),
        fatherEmail: student.fatherEmail ? student.fatherEmail.trim() : '',
        motherName: toCamelCase(student.motherName.trim()),
        motherEmail: student.motherEmail ? student.motherEmail.trim() : '',
        grade: String(student.grade).trim(),
        section: String(student.section).trim(),
        status: student.status || 'Active',
        admissionNumber: student.admissionNumber ? student.admissionNumber.trim() : '',
        phoneNumber: student.phoneNumber ? student.phoneNumber.trim() : '',
        secondaryPhoneNumber: student.secondaryPhoneNumber ? student.secondaryPhoneNumber.trim() : '',
        email: student.email ? student.email.trim() : '',
        addressLine1: student.addressLine1 ? student.addressLine1.trim() : '',
        addressLine2: student.addressLine2 ? student.addressLine2.trim() : '',
        city: student.city ? toCamelCase(student.city.trim()) : '',
        state: student.state ? student.state.trim() : '',
        zipCode: student.zipCode ? student.zipCode.trim() : '',
        country: student.country ? student.country.trim() : 'India'
      }));

  // Backend API call
  const response = await api.post(`${import.meta.env.VITE_API_URL}/Students/bulk-add`, studentsForBackend, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Handle successful response
      setUploadResult({
        success: true,
        message: response.data.message || `Successfully uploaded ${previewData.length} students`,
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
      
      // Safely extract error information
      const errorMessage = error.response?.data?.message || 'Upload failed. Please try again.';
      const backendErrors = error.response?.data?.errors;
      
      // Ensure errors is always an array
      let errorArray: string[] = [];
      if (Array.isArray(backendErrors)) {
        errorArray = backendErrors;
      } else if (typeof backendErrors === 'string') {
        errorArray = [backendErrors];
      } else if (backendErrors && typeof backendErrors === 'object') {
        // Handle case where errors might be an object
        errorArray = Object.values(backendErrors).flat().filter(err => typeof err === 'string');
      }
      
      setUploadResult({
        success: false,
        message: errorMessage,
        errors: errorArray.length > 0 ? errorArray : undefined
      });
    } finally {
      setUploading(false);
    }
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
              <li>Fill in the student information (replace sample data with real data)</li>
              <li><strong>MANDATORY FIELDS:</strong> First Name, Last Name, Father Name, Mother Name, Date of Birth, Grade, Section, Admission Number</li>
              <li><strong>NAME FIELDS:</strong> Use only alphabets, spaces, hyphens (-), and apostrophes (') for names</li>
              <li><strong>DATE FORMAT:</strong> Keep date format as DD-MM-YYYY (e.g., 31-08-2015)</li>
              <li><strong>EMAIL FORMAT:</strong> Provide valid email addresses for student, father, and mother emails (optional)</li>
              <li><strong>NUMERIC FIELDS:</strong> Enter phone numbers, admission numbers, and zip codes as regular numbers (leading zeros will be automatically removed)</li>
              <li>If Excel changes date format, select the date column and format it as "Text"</li>
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
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">� Email Validation:</h3>
            <p className="text-blue-800 text-sm">
              Email addresses for students, fathers, and mothers are optional but must be in valid format when provided (e.g., user@example.com).
            </p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="font-semibold text-green-900 mb-2">✅ Field Validation Rules:</h3>
            <ul className="text-green-800 text-sm space-y-1">
              <li><strong>Names:</strong> Only alphabets, spaces, hyphens (-), and apostrophes (') allowed</li>
              <li><strong>Date of Birth:</strong> Must be in DD-MM-YYYY format (e.g., 31-08-2015)</li>
              <li><strong>Grade & Section:</strong> Must match existing classes in your school system</li>
              <li><strong>Emails:</strong> Must be valid email format when provided (optional)</li>
              <li><strong>Numeric Fields:</strong> Leading zeros will be automatically removed from phone numbers, admission numbers, and zip codes</li>
              <li><strong>Auto-formatting:</strong> Names and city will be converted to proper camelCase format</li>
              <li><strong>Valid Grades:</strong> {validGrades.length > 0 ? validGrades.join(', ') : 'None configured'}</li>
              <li><strong>Valid Sections:</strong> {validSections.length > 0 ? validSections.join(', ') : 'None configured'}</li>
            </ul>
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
              Template includes all required columns with sample data
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
                      <TableHead>Grade</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Admission #</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.slice(0, 10).map((student, index) => (
                      <TableRow key={index}>
                        <TableCell>{student.firstName} {student.lastName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={student.dateOfBirth && isValidDate(student.dateOfBirth) ? 'text-green-600' : 'text-red-600'}>
                              {student.dateOfBirth || 'Not provided'}
                            </span>
                            {student.dateOfBirth && isValidDate(student.dateOfBirth) && (
                              <CheckCircle className="h-3 w-3 text-green-600" />
                            )}
                            {student.dateOfBirth && !isValidDate(student.dateOfBirth) && (
                              <AlertCircle className="h-3 w-3 text-red-600" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{student.grade}</TableCell>
                        <TableCell>{student.section}</TableCell>
                        <TableCell>{student.status}</TableCell>
                        <TableCell>{student.admissionNumber}</TableCell>
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
              {uploadResult.errors && Array.isArray(uploadResult.errors) && uploadResult.errors.length > 0 && (
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