import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Save, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { toProperCase } from "@/lib/utils";
import { getAllStates, getCitiesByState } from "@/config/locationConfig";

interface StaffForm {
  staffId: string;
  firstName: string;
  middleName: string;
  lastName: string;
  gender: string;
  dob: string;
  personalEmail: string;
  officialEmail: string;
  phone: string;
  role: string;
  joiningDate: string;
  status: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface ValidationErrors {
  [key: string]: string;
}

interface SubmitResult {
  success: boolean;
  message: string;
}

export default function AddStaff() {
  const { token } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  
  // Location management
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  const [staffForm, setStaffForm] = useState<StaffForm>({
    staffId: "",
    firstName: "",
    middleName: "",
    lastName: "",
    gender: "",
    dob: "",
    personalEmail: "",
    officialEmail: "",
    phone: "",
    role: "",
    joiningDate: "",
    status: "Active",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    zip: "",
    country: "India"
  });

  // Auto-generate Staff ID when firstName, lastName, or dob changes
  useEffect(() => {
    if (
      staffForm.firstName.trim() &&
      staffForm.lastName.trim() &&
      staffForm.dob
    ) {
      const dob = new Date(staffForm.dob);
      const yyyy = dob.getFullYear();
      const mm = String(dob.getMonth() + 1).padStart(2, "0");
      const dd = String(dob.getDate()).padStart(2, "0");
      const staffId = `STA-${staffForm.firstName.trim()}${staffForm.lastName.trim()}${yyyy}${mm}${dd}`;
      setStaffForm((prev) => ({
        ...prev,
        staffId,
      }));
    } else {
      setStaffForm((prev) => ({
        ...prev,
        staffId: "",
      }));
    }
    // eslint-disable-next-line
  }, [staffForm.firstName, staffForm.lastName, staffForm.dob]);

  const handleInputChange = (field: keyof StaffForm, value: string) => {
    // List of fields that should have proper case formatting
    const nameFields = ['firstName', 'middleName', 'lastName', 'fatherName', 'motherName', 'spouseName', 'city', 'state', 'country'];
    
    // Apply proper case conversion for name fields
    const processedValue = nameFields.includes(field) ? toProperCase(value) : value;
    
    setStaffForm(prev => ({
      ...prev,
      [field]: processedValue
    }));

    // Handle state selection - update available cities
    if (field === 'state') {
      const cities = getCitiesByState(processedValue);
      setAvailableCities(cities);
      // Reset city if it's not available in the new state
      if (staffForm.city && !cities.includes(staffForm.city)) {
        setStaffForm(prev => ({
          ...prev,
          city: ''
        }));
      }
    }

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

    const requiredFields = [
      'firstName', 'lastName', 'dob', 'personalEmail', 'officialEmail', 'phone', 'role', 'joiningDate', 'status', 'addressLine1', 'city', 'state', 'zip', 'country'
    ];

    requiredFields.forEach(field => {
      if (!staffForm[field as keyof StaffForm]?.trim()) {
        errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      }
    });

    if (staffForm.personalEmail && !validateEmail(staffForm.personalEmail)) {
      errors.personalEmail = "Please enter a valid personal email address";
    }
    if (staffForm.officialEmail && !validateEmail(staffForm.officialEmail)) {
      errors.officialEmail = "Please enter a valid official email address";
    }
    if (staffForm.phone && !validatePhoneNumber(staffForm.phone)) {
      errors.phone = "Please enter a valid 10-digit phone number";
    }
    if (staffForm.dob) {
      const birthDate = new Date(staffForm.dob);
      const today = new Date();
      if (birthDate >= today) {
        errors.dob = "Date of birth must be in the past";
      }
    }
    if (staffForm.joiningDate) {
      const joinDate = new Date(staffForm.joiningDate);
      if (staffForm.dob && joinDate <= new Date(staffForm.dob)) {
        errors.joiningDate = "Joining date must be after date of birth";
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
      const now = new Date();
      const toISOStringOrNull = (val: string) => val ? new Date(val).toISOString() : null;
      const staffData = {
        id: "3fa85f64-5717-4562-b3fc-2c963f66afa6", // You may want to generate a real UUID here
        staffId: staffForm.staffId.trim(),
        firstName: staffForm.firstName.trim(),
        lastName: staffForm.lastName.trim(),
        middleName: staffForm.middleName.trim(),
        gender: staffForm.gender,
        dob: toISOStringOrNull(staffForm.dob),
        personalEmail: staffForm.personalEmail.trim(),
        officialEmail: staffForm.officialEmail.trim(),
        phone: staffForm.phone.trim(),
        role: staffForm.role.trim(),
        joiningDate: toISOStringOrNull(staffForm.joiningDate),
        status: staffForm.status,
        addressLine1: staffForm.addressLine1.trim(),
        addressLine2: staffForm.addressLine2.trim(),
        city: staffForm.city.trim(),
        state: staffForm.state.trim(),
        zip: staffForm.zip.trim(),
        country: staffForm.country.trim(),
        createdAt: now.toISOString()
      };

      // Backend API call
  const response = await api.post(`${import.meta.env.VITE_API_URL}/api/Staff`, staffData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setSubmitResult({
        success: true,
        message: "Staff added successfully!"
      });

      setStaffForm({
        staffId: "",
        firstName: "",
        middleName: "",
        lastName: "",
        gender: "",
        dob: "",
        personalEmail: "",
        officialEmail: "",
        phone: "",
        role: "",
        joiningDate: "",
        status: "Active",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        zip: "",
        country: "India"
      });

    } catch (error: any) {
      console.error('Submit error:', error);
      setSubmitResult({
        success: false,
        message: error.response?.data?.message || "Failed to add staff. Please try again."
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderFormField = (
    label: string,
    field: keyof StaffForm,
    type: string = "text",
    required: boolean = true,
    placeholder?: string,
    readOnly?: boolean
  ) => (
    <div className="space-y-2">
      <Label htmlFor={field} className="text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Input
        id={field}
        type={type}
        value={staffForm[field]}
        onChange={(e) => handleInputChange(field, e.target.value)}
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        className={`${validationErrors[field] ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
        readOnly={readOnly}
      />
      {validationErrors[field] && (
        <p className="text-sm text-red-600">{validationErrors[field]}</p>
      )}
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <UserPlus className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Add New Staff</h1>
            <p className="text-white/80">Register a new staff member in the system</p>
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
            {renderFormField("Middle Name", "middleName", "text", false)}
            {renderFormField("Last Name", "lastName")}
            {/* Staff ID field moved to the end, no * sign, greyed out */}
            <div className="space-y-2">
              <Label htmlFor="staffId" className="text-sm font-medium text-gray-700">
                Staff ID
              </Label>
              <Input
                id="staffId"
                type="text"
                value={staffForm.staffId}
                readOnly
                className="bg-gray-100 cursor-not-allowed border-gray-300 focus:border-gray-300"
                placeholder="Auto-generated"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender" className="text-sm font-medium text-gray-700">
                Gender
              </Label>
              <Select value={staffForm.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                <SelectTrigger className={validationErrors.gender ? 'border-red-500' : 'border-gray-300'}>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              {validationErrors.gender && (
                <p className="text-sm text-red-600">{validationErrors.gender}</p>
              )}
            </div>
            {renderFormField("Date of Birth", "dob", "date")}
          </CardContent>
        </Card>

        {/* Contact & Professional Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Contact & Professional Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {renderFormField("Official Email", "officialEmail", "email")}
            {renderFormField("Phone", "phone", "tel")}
            {renderFormField("Personal Email", "personalEmail", "email", false)}
            <div className="space-y-2">
              <Label htmlFor="role" className="text-sm font-medium text-gray-700">
                Role <span className="text-red-500">*</span>
              </Label>
              <Select value={staffForm.role} onValueChange={(value) => handleInputChange("role", value)}>
                <SelectTrigger className={validationErrors.role ? 'border-red-500' : 'border-gray-300'}>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Teacher">Teacher</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Principal">Principal</SelectItem>
                </SelectContent>
              </Select>
              {validationErrors.role && (
                <p className="text-sm text-red-600">{validationErrors.role}</p>
              )}
            </div>
            {renderFormField("Joining Date", "joiningDate", "date")}
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                Status <span className="text-red-500">*</span>
              </Label>
              <Select value={staffForm.status} onValueChange={(value) => handleInputChange("status", value)}>
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
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Address Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {renderFormField("Address Line 1", "addressLine1")}
            {renderFormField("Address Line 2", "addressLine2", "text", false)}
            
            {/* State Dropdown */}
            <div className="space-y-2">
              <Label htmlFor="state" className="text-sm font-medium text-gray-700">
                State <span className="text-red-500">*</span>
              </Label>
              <Select value={staffForm.state} onValueChange={(value) => handleInputChange("state", value)}>
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
              <Select value={staffForm.city} onValueChange={(value) => handleInputChange("city", value)}>
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

            {renderFormField("Zip", "zip")}
            {renderFormField("Country", "country")}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex items-center justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setStaffForm({
                staffId: "",
                firstName: "",
                middleName: "",
                lastName: "",
                gender: "",
                dob: "",
                personalEmail: "",
                officialEmail: "",
                phone: "",
                role: "",
                joiningDate: "",
                status: "Active",
                addressLine1: "",
                addressLine2: "",
                city: "",
                state: "",
                zip: "",
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
            className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {submitting ? "Adding Staff..." : "Add Staff"}
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