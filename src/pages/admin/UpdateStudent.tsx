import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Search, Save, User, ChevronLeft, ChevronRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
// import { api } from "@/services/api"; // Commented out since backend not present

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  uniqueId: string;
  grade: string;
  dateOfBirth: string;
  address: string;
  fatherName: string;
  motherName: string;
  admissionDate: string;
}

interface SearchCriteria {
  firstName: string;
  lastName: string;
  uniqueId: string;
  grade: string;
}

interface EditableFields {
  [key: string]: boolean;
}

interface UpdateResult {
  success: boolean;
  message: string;
}

export default function UpdateStudent() {
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
    firstName: "",
    lastName: "",
    uniqueId: "",
    grade: ""
  });
  
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editableFields, setEditableFields] = useState<EditableFields>({});
  const [editedStudent, setEditedStudent] = useState<Student | null>(null);
  const [searching, setSearching] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateResult, setUpdateResult] = useState<UpdateResult | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Mock data for testing
  const mockStudents: Student[] = [
    {
      id: "1",
      firstName: "John",
      lastName: "Doe",
      uniqueId: "STU001",
      grade: "Grade 8",
      dateOfBirth: "2010-05-15",
      address: "123 Main St, City, State, 12345",
      fatherName: "Robert Doe",
      motherName: "Jane Doe",
      admissionDate: "2024-01-15"
    },
    {
      id: "2",
      firstName: "Sarah",
      lastName: "Smith",
      uniqueId: "STU002",
      grade: "Grade 9",
      dateOfBirth: "2009-08-22",
      address: "456 Oak Ave, City, State, 12345",
      fatherName: "Michael Smith",
      motherName: "Lisa Smith",
      admissionDate: "2024-01-15"
    },
    {
      id: "3",
      firstName: "John",
      lastName: "Wilson",
      uniqueId: "STU003",
      grade: "Grade 8",
      dateOfBirth: "2010-03-10",
      address: "789 Pine St, City, State, 12345",
      fatherName: "David Wilson",
      motherName: "Emily Wilson",
      admissionDate: "2024-01-20"
    }
  ];

  const handleSearch = async () => {
    // Validate at least one field is filled
    const hasSearchCriteria = Object.values(searchCriteria).some(value => value.trim() !== "");
    
    if (!hasSearchCriteria) {
      setUpdateResult({
        success: false,
        message: "Please enter at least one search criteria (First Name, Last Name, Student ID, or Grade)"
      });
      return;
    }

    setSearching(true);
    setUpdateResult(null);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      /* 
      // Backend API call - Commented out until backend is ready
      const response = await api.post('/admin/search-students', {
        searchCriteria: searchCriteria,
        page: currentPage,
        limit: itemsPerPage
      });
      
      setSearchResults(response.data.students);
      setTotalPages(Math.ceil(response.data.totalCount / itemsPerPage));
      */

      // Mock search logic
      const filteredStudents = mockStudents.filter(student => {
        return (
          (!searchCriteria.firstName || student.firstName.toLowerCase().includes(searchCriteria.firstName.toLowerCase())) &&
          (!searchCriteria.lastName || student.lastName.toLowerCase().includes(searchCriteria.lastName.toLowerCase())) &&
          (!searchCriteria.uniqueId || student.uniqueId.toLowerCase().includes(searchCriteria.uniqueId.toLowerCase())) &&
          (!searchCriteria.grade || student.grade.toLowerCase().includes(searchCriteria.grade.toLowerCase()))
        );
      });

      setSearchResults(filteredStudents);
      setTotalPages(Math.ceil(filteredStudents.length / itemsPerPage));
      setCurrentPage(1);
      
      if (filteredStudents.length === 0) {
        setUpdateResult({
          success: false,
          message: "No students found matching the search criteria"
        });
      }

    } catch (error: any) {
      setUpdateResult({
        success: false,
        message: "Search failed. Please try again."
      });
    } finally {
      setSearching(false);
    }
  };

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    setEditedStudent({ ...student });
    setEditableFields({});
    setUpdateResult(null);
  };

  const handleFieldEdit = (fieldName: string) => {
    setEditableFields(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    if (editedStudent) {
      setEditedStudent(prev => ({
        ...prev!,
        [fieldName]: value
      }));
    }
  };

  const handleSave = async () => {
    if (!editedStudent) return;

    setUpdating(true);
    setUpdateResult(null);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      /* 
      // Backend API call - Commented out until backend is ready
      const response = await api.put(`/admin/update-student/${editedStudent.id}`, {
        student: editedStudent
      });
      
      setUpdateResult({
        success: true,
        message: response.data.message || "Student updated successfully"
      });
      */

      // Mock success response
      setUpdateResult({
        success: true,
        message: "Student updated successfully"
      });

      // Update the student in search results
      setSearchResults(prev => 
        prev.map(student => 
          student.id === editedStudent.id ? editedStudent : student
        )
      );

      setSelectedStudent(editedStudent);
      setEditableFields({});

    } catch (error: any) {
      setUpdateResult({
        success: false,
        message: "Update failed. Please try again."
      });
    } finally {
      setUpdating(false);
    }
  };

  const renderEditableField = (label: string, fieldName: keyof Student, value: string) => {
    const isEditing = editableFields[fieldName];
    
    return (
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <div className="flex-1">
          <label className="text-sm font-medium text-gray-600">{label}</label>
          {isEditing ? (
            <Input
              value={value}
              onChange={(e) => handleFieldChange(fieldName, e.target.value)}
              className="mt-1"
              type={fieldName === 'dateOfBirth' || fieldName === 'admissionDate' ? 'date' : 'text'}
            />
          ) : (
            <p className="mt-1 text-gray-900">{value || 'Not provided'}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleFieldEdit(fieldName)}
          className="ml-2"
        >
          <Edit className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  const paginatedResults = searchResults.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl p-6 text-white">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <label className="text-sm font-medium text-gray-600 mb-1 block">Student ID</label>
              <Input
                placeholder="Enter student ID"
                value={searchCriteria.uniqueId}
                onChange={(e) => setSearchCriteria(prev => ({
                  ...prev,
                  uniqueId: e.target.value
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
              className="bg-gradient-to-r from-green-500 to-blue-600"
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
                    <TableHead>Date of Birth</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedResults.map((student) => (
                    <TableRow 
                      key={student.id}
                      className={selectedStudent?.id === student.id ? "bg-blue-50" : ""}
                    >
                      <TableCell className="font-medium">{student.uniqueId}</TableCell>
                      <TableCell>{student.firstName} {student.lastName}</TableCell>
                      <TableCell>{student.grade}</TableCell>
                      <TableCell>{student.dateOfBirth}</TableCell>
                      <TableCell>
                        <Button
                          variant={selectedStudent?.id === student.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleStudentSelect(student)}
                        >
                          {selectedStudent?.id === student.id ? "Selected" : "Select"}
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
              <CardTitle>Student Details</CardTitle>
              <Button
                onClick={handleSave}
                disabled={updating || Object.keys(editableFields).length === 0}
                className="bg-gradient-to-r from-green-500 to-blue-600"
              >
                <Save className="h-4 w-4 mr-2" />
                {updating ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderEditableField("First Name", "firstName", editedStudent.firstName)}
              {renderEditableField("Last Name", "lastName", editedStudent.lastName)}
              {renderEditableField("Student ID", "uniqueId", editedStudent.uniqueId)}
              {renderEditableField("Grade", "grade", editedStudent.grade)}
              {renderEditableField("Date of Birth", "dateOfBirth", editedStudent.dateOfBirth)}
              {renderEditableField("Address", "address", editedStudent.address)}
              {renderEditableField("Father Name", "fatherName", editedStudent.fatherName)}
              {renderEditableField("Mother Name", "motherName", editedStudent.motherName)}
              {renderEditableField("Admission Date", "admissionDate", editedStudent.admissionDate)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Update Result */}
      {updateResult && (
        <Alert className={updateResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <AlertDescription className={updateResult.success ? "text-green-800" : "text-red-800"}>
            {updateResult.message}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}