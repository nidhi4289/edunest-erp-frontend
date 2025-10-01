import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit, Search, Save, User, ChevronLeft, ChevronRight, CheckCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { toProperCase } from "@/lib/utils";

interface Student {
  eduNestId: string;
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

interface SearchCriteria {
  firstName: string;
  lastName: string;
  grade: string;
}

interface EditableFields {
  fatherName: boolean;
  fatherEmail: boolean;
  motherName: boolean;
  motherEmail: boolean;
  grade: boolean;
  section: boolean;
  status: boolean;
  admissionNumber: boolean;
  phoneNumber: boolean;
  secondaryPhoneNumber: boolean;
  email: boolean;
  addressLine1: boolean;
  addressLine2: boolean;
  city: boolean;
  state: boolean;
  zipCode: boolean;
  country: boolean;
}

interface UpdateResult {
  success: boolean;
  message: string;
}

interface ResultDialogState {
  open: boolean;
  title: string;
  message: string;
  type: 'success' | 'error';
}

export default function UpdateStudent() {
  const { token, masterDataClasses } = useAuth();
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
    firstName: "",
    lastName: "",
    grade: ""
  });
  
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editedStudent, setEditedStudent] = useState<Student | null>(null);
  const [editableFields, setEditableFields] = useState<EditableFields>({
    fatherName: false,
    fatherEmail: false,
    motherName: false,
    motherEmail: false,
    grade: false,
    section: false,
    status: false,
    admissionNumber: false,
    phoneNumber: false,
    secondaryPhoneNumber: false,
    email: false,
    addressLine1: false,
    addressLine2: false,
    city: false,
    state: false,
    zipCode: false,
    country: false
  });
  
  const [searching, setSearching] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateResult, setUpdateResult] = useState<UpdateResult | null>(null);
  const [resultDialog, setResultDialog] = useState<ResultDialogState>({
    open: false,
    title: '',
    message: '',
    type: 'success'
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Get valid grades and sections from master data
  const validGrades = [...new Set(masterDataClasses.map(cls => String(cls.grade)))];
  const validSections = [...new Set(masterDataClasses.map(cls => String(cls.section)))];

  const handleSearch = async () => {
    // Validate at least one field is filled
    const hasSearchCriteria = Object.values(searchCriteria).some(value => value.trim() !== "");
    
    if (!hasSearchCriteria) {
      setResultDialog({
        open: true,
        title: 'Search Criteria Required',
        message: 'Please enter at least one search criteria (First Name, Last Name, or Grade)',
        type: 'error'
      });
      return;
    }

    setSearching(true);
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (searchCriteria.firstName.trim()) {
        params.append('firstName', searchCriteria.firstName.trim());
      }
      if (searchCriteria.lastName.trim()) {
        params.append('lastName', searchCriteria.lastName.trim());
      }
      if (searchCriteria.grade.trim()) {
        params.append('grade', searchCriteria.grade.trim());
      }

      // Backend API call
      const response = await api.get(`${import.meta.env.VITE_API_URL}/Students?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setSearchResults(response.data);
      setTotalPages(Math.ceil(response.data.length / itemsPerPage));
      setCurrentPage(1);
      
      if (response.data.length === 0) {
        setResultDialog({
          open: true,
          title: 'No Results',
          message: 'No students found matching the search criteria',
          type: 'error'
        });
      }

    } catch (error: any) {
      console.error('Search error:', error);
      setResultDialog({
        open: true,
        title: 'Search Failed',
        message: error.response?.data?.message || 'Search failed. Please try again.',
        type: 'error'
      });
    } finally {
      setSearching(false);
    }
  };

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    setEditedStudent({ ...student });
    
    // Reset all editable fields to false
    setEditableFields({
      fatherName: false,
      fatherEmail: false,
      motherName: false,
      motherEmail: false,
      grade: false,
      section: false,
      status: false,
      admissionNumber: false,
      phoneNumber: false,
      secondaryPhoneNumber: false,
      email: false,
      addressLine1: false,
      addressLine2: false,
      city: false,
      state: false,
      zipCode: false,
      country: false
    });
    
    setUpdateResult(null);
    setResultDialog({ open: false, title: '', message: '', type: 'success' });
  };

  const handleFieldEdit = (fieldName: keyof EditableFields) => {
    setEditableFields(prev => ({
      ...prev,
      [fieldName]: true
    }));
  };

  const handleFieldChange = (fieldName: keyof Student, value: string) => {
    if (editedStudent) {
      setEditedStudent(prev => ({
        ...prev!,
        [fieldName]: value
      }));
    }
  };

  const handleSave = async () => {
    if (!selectedStudent || !editedStudent) return;

    setUpdating(true);
    setUpdateResult(null);
    setResultDialog({ open: false, title: '', message: '', type: 'success' });

    try {
      // Create a payload with only the changed fields
      const changedFields: Partial<Student> = {};
      let hasChanges = false;

      Object.entries(editableFields).forEach(([field, isEditable]) => {
        if (isEditable && editedStudent[field as keyof Student] !== selectedStudent[field as keyof Student]) {
          changedFields[field as keyof Student] = editedStudent[field as keyof Student];
          hasChanges = true;
        }
      });

      if (!hasChanges) {
        setResultDialog({
          open: true,
          title: 'No Changes',
          message: 'No changes were made to the student record',
          type: 'error'
        });
        return;
      }

      // Add required fields for identification
      const payload = {
        eduNestId: selectedStudent.eduNestId,
        firstName: selectedStudent.firstName,
        lastName: selectedStudent.lastName,
        dateOfBirth: selectedStudent.dateOfBirth,
        ...changedFields
      };

      // Backend API call
      const response = await api.put(`${import.meta.env.VITE_API_URL}/Students/${selectedStudent.eduNestId}`, payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setResultDialog({
        open: true,
        title: 'Update Successful',
        message: 'Student record updated successfully',
        type: 'success'
      });

      // Update the selected student with the new data
      setSelectedStudent(editedStudent);
      
      // Reset all editable fields
      setEditableFields({
        fatherName: false,
        fatherEmail: false,
        motherName: false,
        motherEmail: false,
        grade: false,
        section: false,
        status: false,
        admissionNumber: false,
        phoneNumber: false,
        secondaryPhoneNumber: false,
        email: false,
        addressLine1: false,
        addressLine2: false,
        city: false,
        state: false,
        zipCode: false,
        country: false
      });

      // Update search results if the student is in the current results
      setSearchResults(prev => 
        prev.map(student => 
          student.eduNestId === selectedStudent.eduNestId ? editedStudent : student
        )
      );

    } catch (error: any) {
      console.error('Update error:', error);
      setResultDialog({
        open: true,
        title: 'Update Failed',
        message: error.response?.data?.message || 'Update failed. Please try again.',
        type: 'error'
      });
    } finally {
      setUpdating(false);
    }
  };

  const renderEditableField = (label: string, fieldName: keyof Student, value: string, canEdit = true) => {
    const isEditable = canEdit && editableFields[fieldName as keyof EditableFields];
    
    return (
      <div key={fieldName} className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-600">{label}</label>
          {canEdit && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleFieldEdit(fieldName as keyof EditableFields)}
              disabled={isEditable}
              className="h-6 px-2 text-xs"
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
          )}
        </div>
        
        {isEditable ? (
          fieldName === 'grade' ? (
            <select
              value={value}
              onChange={(e) => handleFieldChange(fieldName, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {validGrades.map(grade => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
          ) : fieldName === 'section' ? (
            <select
              value={value}
              onChange={(e) => handleFieldChange(fieldName, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {validSections.map(section => (
                <option key={section} value={section}>{section}</option>
              ))}
            </select>
          ) : fieldName === 'status' ? (
            <select
              value={value}
              onChange={(e) => handleFieldChange(fieldName, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          ) : (
            <Input
              value={value}
              onChange={(e) => handleFieldChange(fieldName, e.target.value)}
              className="focus:ring-green-500 focus:border-green-500"
            />
          )
        ) : (
          <Input 
            value={value || 'N/A'} 
            readOnly 
            className="bg-gray-50 cursor-not-allowed"
          />
        )}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const paginatedResults = searchResults.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Update Student</h1>
            <p className="text-white/80">Search and update student information</p>
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
          
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              * At least one search field is required
            </p>
            <Button 
              onClick={handleSearch}
              disabled={searching}
              className="bg-gradient-to-r from-blue-500 to-purple-600"
            >
              {searching ? "Searching..." : "Search Students"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results ({searchResults.length} students found)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedResults.map((student) => (
                    <TableRow 
                      key={student.eduNestId}
                      className={selectedStudent?.eduNestId === student.eduNestId ? "bg-blue-50" : ""}
                    >
                      <TableCell className="font-medium">{student.eduNestId}</TableCell>
                      <TableCell>{student.firstName} {student.lastName}</TableCell>
                      <TableCell>{student.grade}</TableCell>
                      <TableCell>{student.section}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          student.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {student.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant={selectedStudent?.eduNestId === student.eduNestId ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleStudentSelect(student)}
                          className={selectedStudent?.eduNestId === student.eduNestId ? "bg-blue-600 hover:bg-blue-700" : ""}
                        >
                          {selectedStudent?.eduNestId === student.eduNestId ? "Selected" : "Select"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, searchResults.length)} of {searchResults.length} results
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Student Details */}
      {selectedStudent && editedStudent && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Student Details - {selectedStudent.firstName} {selectedStudent.lastName}</CardTitle>
              <Button
                onClick={handleSave}
                disabled={updating || Object.values(editableFields).every(v => !v)}
                className="bg-gradient-to-r from-green-500 to-blue-600"
              >
                <Save className="h-4 w-4 mr-2" />
                {updating ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Non-editable fields */}
                {renderEditableField("Student ID", "eduNestId", editedStudent.eduNestId, false)}
                {renderEditableField("First Name", "firstName", editedStudent.firstName, false)}
                {renderEditableField("Last Name", "lastName", editedStudent.lastName, false)}
                {renderEditableField("Date of Birth", "dateOfBirth", editedStudent.dateOfBirth?.split('T')[0] || '', false)}
                
                {/* Editable fields */}
                {renderEditableField("Father Name", "fatherName", editedStudent.fatherName)}
                {renderEditableField("Father Email", "fatherEmail", editedStudent.fatherEmail)}
                {renderEditableField("Mother Name", "motherName", editedStudent.motherName)}
                {renderEditableField("Mother Email", "motherEmail", editedStudent.motherEmail)}
                {renderEditableField("Grade", "grade", editedStudent.grade)}
                {renderEditableField("Section", "section", editedStudent.section)}
                {renderEditableField("Status", "status", editedStudent.status)}
                {renderEditableField("Admission Number", "admissionNumber", editedStudent.admissionNumber)}
                {renderEditableField("Phone Number", "phoneNumber", editedStudent.phoneNumber)}
                {renderEditableField("Secondary Phone Number", "secondaryPhoneNumber", editedStudent.secondaryPhoneNumber)}
                {renderEditableField("Email", "email", editedStudent.email)}
                {renderEditableField("Address Line 1", "addressLine1", editedStudent.addressLine1)}
                {renderEditableField("Address Line 2", "addressLine2", editedStudent.addressLine2)}
                {renderEditableField("City", "city", editedStudent.city)}
                {renderEditableField("State", "state", editedStudent.state)}
                {renderEditableField("Zip Code", "zipCode", editedStudent.zipCode)}
                {renderEditableField("Country", "country", editedStudent.country)}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Result Dialog */}
      <Dialog open={resultDialog.open} onOpenChange={(open) => setResultDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${
              resultDialog.type === 'success' ? 'text-green-600' : 'text-red-600'
            }`}>
              {resultDialog.type === 'success' ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
              {resultDialog.title}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700">{resultDialog.message}</p>
          </div>
          <div className="flex justify-end">
            <Button 
              onClick={() => setResultDialog(prev => ({ ...prev, open: false }))}
              className="bg-gradient-to-r from-blue-500 to-purple-600"
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}