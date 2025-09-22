import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Search, Save, User, ChevronLeft, ChevronRight, DollarSign, Calendar, FileText, X, Check, CheckCircle, AlertCircle } from "lucide-react";
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

interface FeeRecord {
  id: string;
  studentEduNestId: string;
  dateOfCollection: string;
  feeCollected: number;
  feeWaived: number;
  waiverReason?: string;
  grade: string;
  section: string;
  totalFees: number;
  feeRemaining: number;
  createdAt: string;
  modifiedDate: string;
}

interface SearchCriteria {
  firstName: string;
  lastName: string;
  grade: string;
}

interface EditableFields {
  [key: string]: boolean;
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

interface FeeEditData {
  feeCollected: number;
  feeWaived: number;
  waiverReason: string;
}

export default function UpdateStudent() {
  const { token } = useAuth();
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
    firstName: "",
    lastName: "",
    grade: ""
  });
  
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editableFields, setEditableFields] = useState<EditableFields>({});
  const [editedStudent, setEditedStudent] = useState<Student | null>(null);
  const [searching, setSearching] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateResult, setUpdateResult] = useState<UpdateResult | null>(null);
  const [resultDialog, setResultDialog] = useState<ResultDialogState>({
    open: false,
    title: '',
    message: '',
    type: 'success'
  });
  
  // Fee records state
  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>([]);
  const [loadingFees, setLoadingFees] = useState(false);
  const [feeError, setFeeError] = useState<string | null>(null);
  
  // Fee editing state
  const [editingFeeId, setEditingFeeId] = useState<string | null>(null);
  const [editFeeData, setEditFeeData] = useState<FeeEditData>({
    feeCollected: 0,
    feeWaived: 0,
    waiverReason: ""
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [updatingFee, setUpdatingFee] = useState(false);
  const [feeUpdateResult, setFeeUpdateResult] = useState<UpdateResult | null>(null);
  const [feeResultDialog, setFeeResultDialog] = useState<ResultDialogState>({
    open: false,
    title: '',
    message: '',
    type: 'success'
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

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
    setUpdateResult(null);
    
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

  const loadStudentFees = async (eduNestId: string) => {
    setLoadingFees(true);
    setFeeError(null);
    try {
  const response = await api.get(`${import.meta.env.VITE_API_URL}/api/Fees/${eduNestId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setFeeRecords(response.data);
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        // No fee records found for this student
        setFeeRecords([]);
        setFeeError(null);
      } else {
        console.error('Fee loading error:', error);
        setFeeError(error.response?.data?.message || "Failed to load fee records");
        setFeeRecords([]);
      }
    } finally {
      setLoadingFees(false);
    }
  };

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    setEditedStudent({ ...student });
    setEditableFields({});
    setUpdateResult(null);
    
    // Load fee records for the selected student
    loadStudentFees(student.eduNestId);
  };

  const handleFieldEdit = (fieldName: string) => {
    setEditableFields(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    if (editedStudent) {
      // List of fields that should have proper case formatting
      const nameFields = ['firstName', 'lastName', 'fatherName', 'motherName', 'city', 'state', 'country'];
      
      // Apply proper case conversion for name fields
      const processedValue = nameFields.includes(fieldName) ? toProperCase(value) : value;
      
      setEditedStudent(prev => ({
        ...prev!,
        [fieldName]: processedValue
      }));
    }
  };

  const handleSave = async () => {
    if (!editedStudent) return;

    setUpdating(true);
    setUpdateResult(null);

    try {
  // Backend API call to update student
  const response = await api.put(`${import.meta.env.VITE_API_URL}/Students/${editedStudent.eduNestId}`, editedStudent, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setResultDialog({
        open: true,
        title: 'Update Successful',
        message: 'Student updated successfully',
        type: 'success'
      });

      // Update the student in search results
      setSearchResults(prev => 
        prev.map(student => 
          student.eduNestId === editedStudent.eduNestId ? editedStudent : student
        )
      );

      setSelectedStudent(editedStudent);
      setEditableFields({});

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

  // Fee editing functions
  const handleEditFee = (feeRecord: FeeRecord) => {
    setEditingFeeId(feeRecord.id);
    setEditFeeData({
      feeCollected: feeRecord.feeCollected,
      feeWaived: feeRecord.feeWaived,
      waiverReason: feeRecord.waiverReason || ""
    });
    setIsEditDialogOpen(true);
    setFeeUpdateResult(null);
  };

  const handleFeeFieldChange = (field: keyof FeeEditData, value: string | number) => {
    setEditFeeData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveFee = async () => {
    if (!editingFeeId) return;

    setUpdatingFee(true);
    setFeeUpdateResult(null);

    try {
      // Validation
      if (editFeeData.feeCollected < 0) {
        setFeeResultDialog({
          open: true,
          title: 'Validation Error',
          message: 'Fee collected cannot be negative',
          type: 'error'
        });
        return;
      }

      if (editFeeData.feeWaived < 0) {
        setFeeResultDialog({
          open: true,
          title: 'Validation Error',
          message: 'Fee waived cannot be negative',
          type: 'error'
        });
        return;
      }

      // Find the original fee record
      const originalFee = feeRecords.find(fee => fee.id === editingFeeId);
      if (!originalFee) {
        setFeeResultDialog({
          open: true,
          title: 'Error',
          message: 'Original fee record not found.',
          type: 'error'
        });
        return;
      }

      // Prepare payload for backend with all fields
      const updatePayload = {
        ...originalFee,
        feeCollected: parseFloat(editFeeData.feeCollected.toString()),
        feeWaived: parseFloat(editFeeData.feeWaived.toString()),
        waiverReason: editFeeData.waiverReason.trim() || ""
      };

  // Backend API call to update fee
  const response = await api.put(`${import.meta.env.VITE_API_URL}/api/Fees/${editingFeeId}`, updatePayload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setFeeResultDialog({
        open: true,
        title: 'Update Successful',
        message: 'Fee record updated successfully',
        type: 'success'
      });

      // Update the fee record in the list
      setFeeRecords(prev => 
        prev.map(fee => 
          fee.id === editingFeeId 
            ? { 
                ...fee, 
                feeCollected: updatePayload.feeCollected,
                feeWaived: updatePayload.feeWaived,
                waiverReason: updatePayload.waiverReason || undefined,
                modifiedDate: new Date().toISOString() // Update modified date
              }
            : fee
        )
      );

      // Don't close dialog automatically - let user click OK
      // User will close via the dialog OK button

    } catch (error: any) {
      console.error('Fee update error:', error);
      setFeeResultDialog({
        open: true,
        title: 'Update Failed',
        message: error.response?.data?.message || 'Failed to update fee record. Please try again.',
        type: 'error'
      });
    } finally {
      setUpdatingFee(false);
    }
  };

  const handleCancelFeeEdit = () => {
    setIsEditDialogOpen(false);
    setEditingFeeId(null);
    setEditFeeData({
      feeCollected: 0,
      feeWaived: 0,
      waiverReason: ""
    });
    setFeeUpdateResult(null);
  };

  const renderEditableField = (label: string, fieldName: keyof Student, value: string, editable: boolean = true) => {
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
              type={fieldName === 'dateOfBirth' ? 'date' : 'text'}
            />
          ) : (
            <p className="mt-1 text-gray-900">{value || 'Not provided'}</p>
          )}
        </div>
        {editable && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleFieldEdit(fieldName)}
            className="ml-2"
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Helper to get totalFees as a single value (from first record or backend, not sum)
  const getSingleTotalFees = () => {
    // If you have a backend value, use it, else use the first record's totalFees
    if (feeRecords.length > 0) {
      return feeRecords[0].totalFees;
    }
    return 0;
  };

  const calculateFeeSummary = () => {
    const totalCollected = feeRecords.reduce((sum, record) => sum + record.feeCollected, 0);
    const totalWaived = feeRecords.reduce((sum, record) => sum + record.feeWaived, 0);
    const totalFees = getSingleTotalFees();
    const totalRemaining = totalFees - totalCollected;
    return {
      totalCollected,
      totalWaived,
      totalFees,
      totalRemaining,
      totalRecords: feeRecords.length
    };
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

      {/* Student Details with Tabs */}
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
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Student Details
                </TabsTrigger>
                <TabsTrigger value="fees" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Fee Records
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4 mt-6">
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
                  {renderEditableField("Email", "email", editedStudent.email)}
                  {renderEditableField("Address Line 1", "addressLine1", editedStudent.addressLine1)}
                  {renderEditableField("Address Line 2", "addressLine2", editedStudent.addressLine2)}
                  {renderEditableField("City", "city", editedStudent.city)}
                  {renderEditableField("State", "state", editedStudent.state)}
                  {renderEditableField("Zip Code", "zipCode", editedStudent.zipCode)}
                </div>
              </TabsContent>
              
              <TabsContent value="fees" className="space-y-4 mt-6">
                {loadingFees ? (
                  <div className="text-center py-8">
                    <p>Loading fee records...</p>
                  </div>
                ) : feeError ? (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-800">
                      {feeError}
                    </AlertDescription>
                  </Alert>
                ) : feeRecords.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No fee records found for this student</p>
                  </div>
                ) : (
                  <>
                    {/* Fee Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                      {(() => {
                        const summary = calculateFeeSummary();
                        return (
                          <>
                            <Card>
                              <CardContent className="p-4 text-center">
                                <p className="text-sm text-gray-600">Total Records</p>
                                <p className="text-2xl font-bold text-blue-600">{summary.totalRecords}</p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="p-4 text-center">
                                <p className="text-sm text-gray-600">Total Collected</p>
                                <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalCollected)}</p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="p-4 text-center">
                                <p className="text-sm text-gray-600">Total Waived</p>
                                <p className="text-2xl font-bold text-orange-600">{formatCurrency(summary.totalWaived)}</p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="p-4 text-center">
                                <p className="text-sm text-gray-600">Total Fees</p>
                                <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary.totalFees)}</p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="p-4 text-center">
                                <p className="text-sm text-gray-600">Total Remaining</p>
                                <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalRemaining)}</p>
                              </CardContent>
                            </Card>
                          </>
                        );
                      })()}
                    </div>

                    {/* Fee Records Table */}
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Collection Date</TableHead>
                            <TableHead>Grade/Section</TableHead>
                            <TableHead>Fee Collected</TableHead>
                            <TableHead>Fee Waived</TableHead>
                          
                            <TableHead>Waiver Reason</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead>Modified Date</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {feeRecords.map((record) => (
                            <TableRow key={record.id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-gray-400" />
                                  {formatDate(record.dateOfCollection)}
                                </div>
                              </TableCell>
                              <TableCell>{record.grade} - {record.section}</TableCell>
                              <TableCell className="text-green-600 font-medium">
                                {formatCurrency(record.feeCollected)}
                              </TableCell>
                              <TableCell className="text-orange-600 font-medium">
                                {formatCurrency(record.feeWaived)}
                              </TableCell>
                              {/* Removed Total Fees column */}
                              <TableCell className="text-sm text-gray-600">
                                {record.waiverReason || '-'}
                              </TableCell>
                              <TableCell className="text-sm text-gray-500">
                                {formatDate(record.createdAt)}
                              </TableCell>
                              <TableCell className="text-sm text-gray-500">
                                {formatDate(record.modifiedDate)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditFee(record)}
                                  className="flex items-center gap-1"
                                >
                                  <Edit className="h-3 w-3" />
                                  Edit
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Fee Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Fee Record</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="feeCollected">Fee Collected (₹)</Label>
              <Input
                id="feeCollected"
                type="number"
                min="0"
                step="0.01"
                value={editFeeData.feeCollected}
                onChange={(e) => handleFeeFieldChange('feeCollected', parseFloat(e.target.value) || 0)}
                placeholder="Enter fee collected amount"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="feeWaived">Fee Waived (₹)</Label>
              <Input
                id="feeWaived"
                type="number"
                min="0"
                step="0.01"
                value={editFeeData.feeWaived}
                onChange={(e) => handleFeeFieldChange('feeWaived', parseFloat(e.target.value) || 0)}
                placeholder="Enter fee waived amount"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="waiverReason">Waiver Reason</Label>
              <Textarea
                id="waiverReason"
                value={editFeeData.waiverReason}
                onChange={(e) => handleFeeFieldChange('waiverReason', e.target.value)}
                placeholder="Enter reason for fee waiver (optional)"
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2 pt-4">
              <Button
                onClick={handleSaveFee}
                disabled={updatingFee}
                className="flex-1 bg-gradient-to-r from-green-500 to-blue-600"
              >
                {updatingFee ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancelFeeEdit}
                disabled={updatingFee}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Student Update Result Dialog */}
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
              className="bg-gradient-to-r from-green-500 to-blue-600"
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fee Update Result Dialog */}
      <Dialog open={feeResultDialog.open} onOpenChange={(open) => setFeeResultDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${
              feeResultDialog.type === 'success' ? 'text-green-600' : 'text-red-600'
            }`}>
              {feeResultDialog.type === 'success' ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
              {feeResultDialog.title}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700">{feeResultDialog.message}</p>
          </div>
          <div className="flex justify-end">
            <Button 
              onClick={() => {
                setFeeResultDialog(prev => ({ ...prev, open: false }));
                if (feeResultDialog.type === 'success') {
                  setIsEditDialogOpen(false);
                  setEditingFeeId(null);
                }
              }}
              className="bg-gradient-to-r from-green-500 to-blue-600"
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}