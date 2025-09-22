import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Search, Edit, AlertCircle, CheckCircle, Eye, Save, User, ChevronLeft, ChevronRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/context/AuthContext";
import { toProperCase } from "@/lib/utils";

interface Staff {
  id: string;
  staffId: string;
  firstName: string;
  lastName: string;
  middleName: string;
  gender: string;
  dob: string;
  personalEmail: string;
  officialEmail: string;
  phone: string;
  role: string;
  joiningDate: string;
  exitDate: string | null;
  status: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  createdAt: string;
}

interface SearchCriteria {
  firstName: string;
  lastName: string;
  staffId: string;
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

export default function ManageStaff() {
  const { token } = useAuth();
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
    firstName: "",
    lastName: "",
    staffId: ""
  });
  
  const [searchResults, setSearchResults] = useState<Staff[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [editableFields, setEditableFields] = useState<EditableFields>({});
  const [editedStaff, setEditedStaff] = useState<Staff | null>(null);
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

  const handleSearch = async () => {
    setSearching(true);
    setUpdateResult(null);
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (searchCriteria.firstName.trim()) {
        params.append("firstName", searchCriteria.firstName.trim());
      }
      if (searchCriteria.lastName.trim()) {
        params.append("lastName", searchCriteria.lastName.trim());
      }
      if (searchCriteria.staffId.trim()) {
        params.append("staffId", searchCriteria.staffId.trim());
      }

      // Backend API call
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/Staff?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch staff members");
      }

      const data = await response.json();
      setSearchResults(data);
      setTotalPages(Math.ceil(data.length / itemsPerPage));
      setCurrentPage(1);
      
      if (data.length === 0) {
        setResultDialog({
          open: true,
          title: 'No Results',
          message: 'No staff members found matching the search criteria',
          type: 'error'
        });
      }

    } catch (error: any) {
      console.error('Search error:', error);
      setResultDialog({
        open: true,
        title: 'Search Failed',
        message: error.message || 'Search failed. Please try again.',
        type: 'error'
      });
    } finally {
      setSearching(false);
    }
  };

  const handleStaffSelect = (staff: Staff) => {
    setSelectedStaff(staff);
    setEditedStaff({ ...staff });
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
    if (editedStaff) {
      // List of fields that should have proper case formatting
      const nameFields = ['firstName', 'middleName', 'lastName', 'fatherName', 'motherName', 'spouseName', 'city', 'state', 'country'];
      
      // Apply proper case conversion for name fields
      const processedValue = nameFields.includes(fieldName) ? toProperCase(value) : value;
      
      setEditedStaff(prev => ({
        ...prev!,
        [fieldName]: processedValue
      }));
    }
  };

  const handleSave = async () => {
    if (!editedStaff) return;

    setUpdating(true);
    setUpdateResult(null);

    try {
      // Prepare the data for the backend
      const staffData = {
        ...editedStaff,
        dob: editedStaff.dob ? new Date(editedStaff.dob).toISOString() : null,
        joiningDate: editedStaff.joiningDate ? new Date(editedStaff.joiningDate).toISOString() : null,
        exitDate: editedStaff.exitDate ? new Date(editedStaff.exitDate).toISOString() : null,
      };

      // Backend API call to update staff
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/Staff/${editedStaff.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(staffData)
      });
      
      if (!response.ok) {
        throw new Error("Failed to update staff member");
      }

      setResultDialog({
        open: true,
        title: 'Update Successful',
        message: 'Staff member updated successfully',
        type: 'success'
      });

      // Update the staff in search results
      setSearchResults(prev => 
        prev.map(staff => 
          staff.id === editedStaff.id ? editedStaff : staff
        )
      );

      setSelectedStaff(editedStaff);
      setEditableFields({});

    } catch (error: any) {
      console.error('Update error:', error);
      setResultDialog({
        open: true,
        title: 'Update Failed',
        message: error.message || 'Update failed. Please try again.',
        type: 'error'
      });
    } finally {
      setUpdating(false);
    }
  };

  const renderEditableField = (label: string, fieldName: keyof Staff, value: string, editable: boolean = true) => {
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
              type={fieldName === 'dob' || fieldName === 'joiningDate' || fieldName === 'exitDate' ? 'date' : 'text'}
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not provided';
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
      <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <Users className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Manage Staff</h1>
            <p className="text-white/80">Search and update staff information</p>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Staff
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
              <label className="text-sm font-medium text-gray-600 mb-1 block">Staff ID</label>
              <Input
                placeholder="Enter staff ID"
                value={searchCriteria.staffId}
                onChange={(e) => setSearchCriteria(prev => ({
                  ...prev,
                  staffId: e.target.value
                }))}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-end">
            <Button 
              onClick={handleSearch}
              disabled={searching}
              className="bg-gradient-to-r from-green-500 to-blue-600"
            >
              {searching ? "Searching..." : "Search Staff"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results ({searchResults.length} staff members found)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedResults.map((staff) => (
                    <TableRow 
                      key={staff.id}
                      className={selectedStaff?.id === staff.id ? "bg-blue-50" : ""}
                    >
                      <TableCell className="font-medium">{staff.staffId}</TableCell>
                      <TableCell>{staff.firstName} {staff.middleName} {staff.lastName}</TableCell>
                      <TableCell>{staff.officialEmail}</TableCell>
                      <TableCell>{staff.phone}</TableCell>
                      <TableCell>{staff.role}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          staff.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {staff.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant={selectedStaff?.id === staff.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleStaffSelect(staff)}
                        >
                          {selectedStaff?.id === staff.id ? "Selected" : "Select"}
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

      {/* Staff Details */}
      {selectedStaff && editedStaff && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Staff Details - {selectedStaff.firstName} {selectedStaff.lastName}</CardTitle>
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
              <TabsList className="grid w-full grid-cols-1">
                <TabsTrigger value="details" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Staff Details
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Non-editable fields */}
                  {renderEditableField("Staff ID", "staffId", editedStaff.staffId, false)}
                  {renderEditableField("Created At", "createdAt", formatDate(editedStaff.createdAt), false)}
                  
                  {/* Personal Information */}
                  {renderEditableField("First Name", "firstName", editedStaff.firstName)}
                  {renderEditableField("Middle Name", "middleName", editedStaff.middleName)}
                  {renderEditableField("Last Name", "lastName", editedStaff.lastName)}
                  {renderEditableField("Gender", "gender", editedStaff.gender)}
                  {renderEditableField("Date of Birth", "dob", editedStaff.dob?.split('T')[0] || '')}
                  
                  {/* Contact Information */}
                  {renderEditableField("Personal Email", "personalEmail", editedStaff.personalEmail)}
                  {renderEditableField("Official Email", "officialEmail", editedStaff.officialEmail)}
                  {renderEditableField("Phone", "phone", editedStaff.phone)}
                  
                  {/* Professional Information */}
                  {renderEditableField("Role", "role", editedStaff.role)}
                  {renderEditableField("Joining Date", "joiningDate", editedStaff.joiningDate?.split('T')[0] || '')}
                  {renderEditableField("Exit Date", "exitDate", editedStaff.exitDate?.split('T')[0] || '')}
                  {renderEditableField("Status", "status", editedStaff.status)}
                  
                  {/* Address Information */}
                  {renderEditableField("Address Line 1", "addressLine1", editedStaff.addressLine1)}
                  {renderEditableField("Address Line 2", "addressLine2", editedStaff.addressLine2)}
                  {renderEditableField("City", "city", editedStaff.city)}
                  {renderEditableField("State", "state", editedStaff.state)}
                  {renderEditableField("ZIP Code", "zip", editedStaff.zip)}
                  {renderEditableField("Country", "country", editedStaff.country)}
                </div>
              </TabsContent>
            </Tabs>
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