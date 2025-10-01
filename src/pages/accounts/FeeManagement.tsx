import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Edit, Search, Save, User, ChevronLeft, ChevronRight, DollarSign, 
  Calendar, FileText, X, Check, CheckCircle, AlertCircle, Plus, Wallet 
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

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
  section: string;
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

interface FeeFormData {
  feeCollected: number | string;
  feeWaived: number | string;
  waiverReason: string;
  dateOfCollection: string;
}

export default function FeeManagement() {
  const { token, masterDataClasses } = useAuth();
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
    firstName: "",
    lastName: "",
    grade: "",
    section: ""
  });
  
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searching, setSearching] = useState(false);
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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [feeFormData, setFeeFormData] = useState<FeeFormData>({
    feeCollected: "",
    feeWaived: "",
    waiverReason: "",
    dateOfCollection: new Date().toISOString().split('T')[0]
  });
  const [updatingFee, setUpdatingFee] = useState(false);
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
        message: 'Please enter at least one search criteria (First Name, Last Name, Grade, or Section)',
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
      if (searchCriteria.section.trim()) {
        params.append('section', searchCriteria.section.trim());
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
    
    // Load fee records for the selected student
    loadStudentFees(student.eduNestId);
  };

  // Fee editing functions
  const handleEditFee = (feeRecord: FeeRecord) => {
    setEditingFeeId(feeRecord.id);
    setFeeFormData({
      feeCollected: feeRecord.feeCollected,
      feeWaived: feeRecord.feeWaived,
      waiverReason: feeRecord.waiverReason || "",
      dateOfCollection: feeRecord.dateOfCollection.split('T')[0]
    });
    setIsEditDialogOpen(true);
    setFeeResultDialog({ open: false, title: '', message: '', type: 'success' });
  };

  const handleAddFee = () => {
    setEditingFeeId(null);
    setFeeFormData({
      feeCollected: "" as any,
      feeWaived: "" as any,
      waiverReason: "",
      dateOfCollection: new Date().toISOString().split('T')[0]
    });
    setIsAddDialogOpen(true);
    setFeeResultDialog({ open: false, title: '', message: '', type: 'success' });
  };

  const handleFeeFieldChange = (field: keyof FeeFormData, value: string | number) => {
    setFeeFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveFee = async () => {
    if (!selectedStudent) return;

    setUpdatingFee(true);
    setFeeResultDialog({ open: false, title: '', message: '', type: 'success' });

    try {
      // Validation
      const feeCollectedValue = typeof feeFormData.feeCollected === 'string' 
        ? parseFloat(feeFormData.feeCollected) || 0 
        : feeFormData.feeCollected;
      const feeWaivedValue = typeof feeFormData.feeWaived === 'string' 
        ? parseFloat(feeFormData.feeWaived) || 0 
        : feeFormData.feeWaived;

      if (feeCollectedValue < 0) {
        setFeeResultDialog({
          open: true,
          title: 'Validation Error',
          message: 'Fee collected cannot be negative',
          type: 'error'
        });
        return;
      }

      if (feeWaivedValue < 0) {
        setFeeResultDialog({
          open: true,
          title: 'Validation Error',
          message: 'Fee waived cannot be negative',
          type: 'error'
        });
        return;
      }

      if (!feeFormData.dateOfCollection) {
        setFeeResultDialog({
          open: true,
          title: 'Validation Error',
          message: 'Collection date is required',
          type: 'error'
        });
        return;
      }

      const payload = {
        firstName: selectedStudent.firstName,
        lastName: selectedStudent.lastName,
        fatherName: selectedStudent.fatherName,
        dateOfBirth: selectedStudent.dateOfBirth,
        studentEduNestId: selectedStudent.eduNestId,
        dateOfCollection: new Date(feeFormData.dateOfCollection).toISOString(),
        feeCollected: feeCollectedValue,
        feeWaived: feeWaivedValue,
        waiverReason: feeFormData.waiverReason.trim() || "",
        grade: selectedStudent.grade,
        section: selectedStudent.section
      };

      let response;
      
      if (editingFeeId) {
        // Edit existing fee record
        response = await api.put(`${import.meta.env.VITE_API_URL}/api/Fees/${editingFeeId}`, payload, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } else {
        // Add new fee record
        console.log('Adding new fee record with payload:', payload);
        response = await api.post(`${import.meta.env.VITE_API_URL}/api/Fees`, payload, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('Add fee response:', response.data);
      }

      setFeeResultDialog({
        open: true,
        title: editingFeeId ? 'Update Successful' : 'Add Successful',
        message: editingFeeId ? 'Fee record updated successfully' : 'Fee record added successfully',
        type: 'success'
      });

      // Refresh fee records
      loadStudentFees(selectedStudent.eduNestId);

    } catch (error: any) {
      console.error('Fee save error:', error);
      setFeeResultDialog({
        open: true,
        title: editingFeeId ? 'Update Failed' : 'Add Failed',
        message: error.response?.data?.message || `Failed to ${editingFeeId ? 'update' : 'add'} fee record. Please try again.`,
        type: 'error'
      });
    } finally {
      setUpdatingFee(false);
    }
  };

  const handleCancelFeeEdit = () => {
    setIsEditDialogOpen(false);
    setIsAddDialogOpen(false);
    setEditingFeeId(null);
    setFeeFormData({
      feeCollected: "" as any,
      feeWaived: "" as any,
      waiverReason: "",
      dateOfCollection: new Date().toISOString().split('T')[0]
    });
    setFeeResultDialog({ open: false, title: '', message: '', type: 'success' });
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

  // Helper to get totalFees as a single value (from first record or backend)
  const getSingleTotalFees = () => {
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
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <Wallet className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Fee Management</h1>
            <p className="text-white/80">Search students and manage their fee records</p>
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
              <label className="text-sm font-medium text-gray-600 mb-1 block">Grade</label>
              <Select
                value={searchCriteria.grade || "all"}
                onValueChange={(value) => setSearchCriteria(prev => ({
                  ...prev,
                  grade: value === "all" ? "" : value
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  {validGrades.map(grade => (
                    <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">Section</label>
              <Select
                value={searchCriteria.section || "all"}
                onValueChange={(value) => setSearchCriteria(prev => ({
                  ...prev,
                  section: value === "all" ? "" : value
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {validSections.map(section => (
                    <SelectItem key={section} value={section}>{section}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              * At least one search field is required
            </p>
            <Button 
              onClick={handleSearch}
              disabled={searching}
              className="bg-gradient-to-r from-emerald-500 to-teal-600"
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
                      className={selectedStudent?.eduNestId === student.eduNestId ? "bg-emerald-50" : ""}
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
                          className={selectedStudent?.eduNestId === student.eduNestId ? "bg-emerald-600 hover:bg-emerald-700" : ""}
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

      {/* Student Fee Records */}
      {selectedStudent && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Fee Records - {selectedStudent.firstName} {selectedStudent.lastName}</CardTitle>
              <Button
                onClick={handleAddFee}
                className="bg-gradient-to-r from-emerald-500 to-teal-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Fee Record
              </Button>
            </div>
          </CardHeader>
          <CardContent>
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
                <p className="text-gray-500 mb-4">No fee records found for this student</p>
                <Button
                  onClick={handleAddFee}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Fee Record
                </Button>
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
              <Label htmlFor="dateOfCollection">Collection Date</Label>
              <Input
                id="dateOfCollection"
                type="date"
                value={feeFormData.dateOfCollection}
                onChange={(e) => handleFeeFieldChange('dateOfCollection', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="feeCollected">Fee Collected (₹)</Label>
              <Input
                id="feeCollected"
                type="number"
                min="0"
                step="0.01"
                value={feeFormData.feeCollected}
                onChange={(e) => handleFeeFieldChange('feeCollected', e.target.value)}
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
                value={feeFormData.feeWaived}
                onChange={(e) => handleFeeFieldChange('feeWaived', e.target.value)}
                placeholder="Enter fee waived amount"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="waiverReason">Waiver Reason</Label>
              <Textarea
                id="waiverReason"
                value={feeFormData.waiverReason}
                onChange={(e) => handleFeeFieldChange('waiverReason', e.target.value)}
                placeholder="Enter reason for fee waiver (optional)"
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2 pt-4">
              <Button
                onClick={handleSaveFee}
                disabled={updatingFee}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600"
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

      {/* Fee Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Fee Record</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dateOfCollection">Collection Date</Label>
              <Input
                id="dateOfCollection"
                type="date"
                value={feeFormData.dateOfCollection}
                onChange={(e) => handleFeeFieldChange('dateOfCollection', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="feeCollected">Fee Collected (₹)</Label>
              <Input
                id="feeCollected"
                type="number"
                min="0"
                step="0.01"
                value={feeFormData.feeCollected}
                onChange={(e) => handleFeeFieldChange('feeCollected', e.target.value)}
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
                value={feeFormData.feeWaived}
                onChange={(e) => handleFeeFieldChange('feeWaived', e.target.value)}
                placeholder="Enter fee waived amount"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="waiverReason">Waiver Reason</Label>
              <Textarea
                id="waiverReason"
                value={feeFormData.waiverReason}
                onChange={(e) => handleFeeFieldChange('waiverReason', e.target.value)}
                placeholder="Enter reason for fee waiver (optional)"
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2 pt-4">
              <Button
                onClick={handleSaveFee}
                disabled={updatingFee}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600"
              >
                {updatingFee ? (
                  <>Adding...</>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Fee Record
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
              className="bg-gradient-to-r from-emerald-500 to-teal-600"
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fee Result Dialog */}
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
                  setIsAddDialogOpen(false);
                  setEditingFeeId(null);
                }
              }}
              className="bg-gradient-to-r from-emerald-500 to-teal-600"
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}