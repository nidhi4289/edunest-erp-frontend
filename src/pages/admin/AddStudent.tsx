import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Update the import path if Label is located elsewhere, for example:
import { Label } from "@/components/ui/label";
// Or, if you have a Label component in another location, use its correct path.
// import { Label } from "../components/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserPlus, Save } from "lucide-react";

import { api } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { toProperCase } from "@/lib/utils";
import { getAllStates, getCitiesByState } from "@/config/locationConfig";

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

interface ResultDialogState {
  open: boolean;
  title: string;
  message: string;
  type: 'success' | 'error';
}

export default function AddStudent() {
  const { token, masterDataClasses } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [resultDialog, setResultDialog] = useState<ResultDialogState>({
    open: false,
    title: '',
    message: '',
    type: 'success'
  });
  
  // Location management
  const [availableCities, setAvailableCities] = useState<string[]>([]);

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
    // List of fields that should have proper case formatting
    const nameFields = ['firstName', 'lastName', 'fatherName', 'motherName', 'city', 'state', 'country'];
    
    // Apply proper case conversion for name fields
    const processedValue = nameFields.includes(field) ? toProperCase(value) : value;
    
    setStudentForm(prev => ({
      ...prev,
      [field]: processedValue
    }));

    // Handle state selection - update available cities
    if (field === 'state') {
      const cities = getCitiesByState(processedValue);
      setAvailableCities(cities);
      // Reset city if it's not available in the new state
      if (studentForm.city && !cities.includes(studentForm.city)) {
        setStudentForm(prev => ({
          ...prev,
          city: ''
        }));
      }
    }

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
      setResultDialog({
        open: true,
        title: 'Validation Error',
        message: 'Please fix the validation errors and try again',
        type: 'error'
      });
      return;
    }

    setSubmitting(true);

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
  const response = await api.post(`${import.meta.env.VITE_API_URL}/Students`, studentData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setResultDialog({
        open: true,
        title: 'Success',
        message: 'Student added successfully!',
        type: 'success'
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
      setResultDialog({
        open: true,
        title: 'Add Failed',
        message: error.response?.data?.message || 'Failed to add student. Please try again.',
        type: 'error'
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
              <Select value={studentForm.grade} onValueChange={(value) => {
                handleInputChange("grade", value);
                handleInputChange("section", ""); // Reset section when grade changes
              }}>
                <SelectTrigger className={validationErrors.grade ? 'border-red-500' : 'border-gray-300'}>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {[...new Set(masterDataClasses.map(cls => cls.grade))].map(grade => (
                    <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validationErrors.grade && (
                <p className="text-sm text-red-600">{validationErrors.grade}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="section" className="text-sm font-medium text-gray-700">
                Section <span className="text-red-500">*</span>
              </Label>
              <Select
                value={studentForm.section}
                onValueChange={(value) => handleInputChange("section", value)}
                disabled={!studentForm.grade}
              >
                <SelectTrigger className={validationErrors.section ? 'border-red-500' : 'border-gray-300'}>
                  <SelectValue placeholder={studentForm.grade ? "Select section" : "Select grade first"} />
                </SelectTrigger>
                <SelectContent>
                  {masterDataClasses
                    .filter(cls => String(cls.grade) === studentForm.grade)
                    .map(cls => (
                      <SelectItem key={cls.section} value={cls.section}>{cls.section}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {validationErrors.section && (
                <p className="text-sm text-red-600">{validationErrors.section}</p>
              )}
            </div>

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
            
            {/* State Dropdown */}
            <div className="space-y-2">
              <Label htmlFor="state" className="text-sm font-medium text-gray-700">
                State <span className="text-red-500">*</span>
              </Label>
              <Select value={studentForm.state} onValueChange={(value) => handleInputChange("state", value)}>
                <SelectTrigger className={`${validationErrors.state ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}`}>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {getAllStates().map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validationErrors.state && (
                <p className="text-sm text-red-600">{validationErrors.state}</p>
              )}
            </div>

            {/* City Dropdown */}
            <div className="space-y-2">
              <Label htmlFor="city" className="text-sm font-medium text-gray-700">
                City <span className="text-red-500">*</span>
              </Label>
              <Select value={studentForm.city} onValueChange={(value) => handleInputChange("city", value)}>
                <SelectTrigger className={`${validationErrors.city ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}`}>
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  {availableCities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validationErrors.city && (
                <p className="text-sm text-red-600">{validationErrors.city}</p>
              )}
            </div>

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

      {/* Result Dialog */}
      <Dialog open={resultDialog.open} onOpenChange={(open) => setResultDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className={resultDialog.type === 'error' ? 'text-red-600' : 'text-green-600'}>
              {resultDialog.title}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 mt-2">
            {resultDialog.message}
          </p>
          <div className="flex justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => setResultDialog(prev => ({ ...prev, open: false }))}
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}