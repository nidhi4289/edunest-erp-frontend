import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Update the import path if Label is located elsewhere, for example:
import { Label } from "@/components/ui/label";
// Or, if you have a Label component in another location, use its correct path.
// import { Label } from "../components/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Save, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

interface StudentForm {
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

interface ValidationErrors {
  [key: string]: string;
}

interface SubmitResult {
  success: boolean;
  message: string;
}

export default function AddStudent() {
  const { token } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const [studentForm, setStudentForm] = useState<StudentForm>({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    fatherName: "",
    fatherEmail: "",
    motherName: "",
    motherEmail: "",
    grade: "",
    section: "",
    status: "Active",
    admissionNumber: "",
    phoneNumber: "",
    secondaryPhoneNumber: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "India"
  });

  const handleInputChange = (field: keyof StudentForm, value: string) => {
    setStudentForm(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    // Required field validations
    const requiredFields = [
      'firstName', 'lastName', 'dateOfBirth', 'fatherName', 'motherName',
      'grade', 'section', 'status', 'admissionNumber', 'phoneNumber',
      'email', 'addressLine1', 'city', 'state', 'zipCode', 'country'
    ];

    requiredFields.forEach(field => {
      if (!studentForm[field as keyof StudentForm]?.trim()) {
        errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      }
    });

    // Email validations
    if (studentForm.email && !validateEmail(studentForm.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (studentForm.fatherEmail && !validateEmail(studentForm.fatherEmail)) {
      errors.fatherEmail = "Please enter a valid father email address";
    }

    if (studentForm.motherEmail && !validateEmail(studentForm.motherEmail)) {
      errors.motherEmail = "Please enter a valid mother email address";
    }

    // Phone number validations
    if (studentForm.phoneNumber && !validatePhoneNumber(studentForm.phoneNumber)) {
      errors.phoneNumber = "Please enter a valid 10-digit phone number";
    }

    if (studentForm.secondaryPhoneNumber && !validatePhoneNumber(studentForm.secondaryPhoneNumber)) {
      errors.secondaryPhoneNumber = "Please enter a valid 10-digit secondary phone number";
    }

    // Date validation
    if (studentForm.dateOfBirth) {
      const birthDate = new Date(studentForm.dateOfBirth);
      const today = new Date();
      if (birthDate >= today) {
        errors.dateOfBirth = "Date of birth must be in the past";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setSubmitResult({
        success: false,
        message: "Please fix the validation errors and try again"
      });
      return;
    }

    setSubmitting(true);
    setSubmitResult(null);

    try {
      // Prepare data for backend
      const studentData = {
        eduNestId: "", // Backend will generate this
        firstName: studentForm.firstName.trim(),
        lastName: studentForm.lastName.trim(),
        dateOfBirth: new Date(studentForm.dateOfBirth).toISOString(),
        fatherName: studentForm.fatherName.trim(),
        fatherEmail: studentForm.fatherEmail.trim() || null,
        motherName: studentForm.motherName.trim(),
        motherEmail: studentForm.motherEmail.trim() || null,
        grade: studentForm.grade.trim(),
        section: studentForm.section.trim(),
        status: studentForm.status,
        admissionNumber: studentForm.admissionNumber.trim(),
        phoneNumber: studentForm.phoneNumber.trim(),
        secondaryPhoneNumber: studentForm.secondaryPhoneNumber.trim() || null,
        email: studentForm.email.trim(),
        addressLine1: studentForm.addressLine1.trim(),
        addressLine2: studentForm.addressLine2.trim(),
        city: studentForm.city.trim(),
        state: studentForm.state.trim(),
        zipCode: studentForm.zipCode.trim(),
        country: studentForm.country.trim()
      };

      // Backend API call
      const response = await api.post('http://localhost:5199/Students', studentData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setSubmitResult({
        success: true,
        message: "Student added successfully!"
      });

      // Reset form on success
      setStudentForm({
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        fatherName: "",
        fatherEmail: "",
        motherName: "",
        motherEmail: "",
        grade: "",
        section: "",
        status: "Active",
        admissionNumber: "",
        phoneNumber: "",
        secondaryPhoneNumber: "",
        email: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        zipCode: "",
        country: "India"
      });

    } catch (error: any) {
      console.error('Submit error:', error);
      setSubmitResult({
        success: false,
        message: error.response?.data?.message || "Failed to add student. Please try again."
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderFormField = (
    label: string,
    field: keyof StudentForm,
    type: string = "text",
    required: boolean = true,
    placeholder?: string
  ) => (
    <div className="space-y-2">
      <Label htmlFor={field} className="text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Input
        id={field}
        type={type}
        value={studentForm[field]}
        onChange={(e) => handleInputChange(field, e.target.value)}
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        className={`${validationErrors[field] ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
      />
      {validationErrors[field] && (
        <p className="text-sm text-red-600">{validationErrors[field]}</p>
      )}
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <UserPlus className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Add New Student</h1>
            <p className="text-white/80">Register a new student in the system</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {renderFormField("First Name", "firstName")}
            {renderFormField("Last Name", "lastName")}
            {renderFormField("Date of Birth", "dateOfBirth", "date")}
            {renderFormField("Student Email", "email", "email")}
          </CardContent>
        </Card>

        {/* Parent Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Parent Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderFormField("Father Name", "fatherName")}
            {renderFormField("Father Email", "fatherEmail", "email", false)}
            {renderFormField("Mother Name", "motherName")}
            {renderFormField("Mother Email", "motherEmail", "email", false)}
          </CardContent>
        </Card>

        {/* Academic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Academic Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="grade" className="text-sm font-medium text-gray-700">
                Grade <span className="text-red-500">*</span>
              </Label>
              <Select value={studentForm.grade} onValueChange={(value) => handleInputChange("grade", value)}>
                <SelectTrigger className={validationErrors.grade ? 'border-red-500' : 'border-gray-300'}>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"].map(grade => (
                    <SelectItem key={grade} value={grade}>Grade {grade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validationErrors.grade && (
                <p className="text-sm text-red-600">{validationErrors.grade}</p>
              )}
            </div>

            {renderFormField("Section", "section")}

            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                Status <span className="text-red-500">*</span>
              </Label>
              <Select value={studentForm.status} onValueChange={(value) => handleInputChange("status", value)}>
                <SelectTrigger className={validationErrors.status ? 'border-red-500' : 'border-gray-300'}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Alumni">Alumni</SelectItem>
                </SelectContent>
              </Select>
              {validationErrors.status && (
                <p className="text-sm text-red-600">{validationErrors.status}</p>
              )}
            </div>

            {renderFormField("Admission Number", "admissionNumber")}
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderFormField("Phone Number", "phoneNumber", "tel")}
            {renderFormField("Secondary Phone Number", "secondaryPhoneNumber", "tel", false)}
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Address Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {renderFormField("Address Line 1", "addressLine1")}
            {renderFormField("Address Line 2", "addressLine2")}
            {renderFormField("City", "city")}
            {renderFormField("State", "state")}
            {renderFormField("Zip Code", "zipCode")}
            {renderFormField("Country", "country")}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex items-center justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setStudentForm({
                firstName: "",
                lastName: "",
                dateOfBirth: "",
                fatherName: "",
                fatherEmail: "",
                motherName: "",
                motherEmail: "",
                grade: "",
                section: "",
                status: "Active",
                admissionNumber: "",
                phoneNumber: "",
                secondaryPhoneNumber: "",
                email: "",
                addressLine1: "",
                addressLine2: "",
                city: "",
                state: "",
                zipCode: "",
                country: "India"
              });
              setValidationErrors({});
              setSubmitResult(null);
            }}
          >
            Clear Form
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {submitting ? "Adding Student..." : "Add Student"}
          </Button>
        </div>
      </form>

      {/* Submit Result */}
      {submitResult && (
        <Alert className={submitResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <div className="flex items-center gap-2">
            {submitResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={submitResult.success ? "text-green-800" : "text-red-800"}>
              {submitResult.message}
            </AlertDescription>
          </div>
        </Alert>
      )}
    </div>
  );
}