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
  Calendar, FileText, X, Check, CheckCircle, AlertCircle, Plus, Wallet,
  Upload, Camera, Eye, Download, Trash2
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

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
  receiptImages?: ReceiptImage[];
}

interface ReceiptImage {
  id: string;
  feeRecordId: string;
  fileName: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  uploadedBy: string;
}

interface FeeFormData {
  feeCollected: string | number;
  feeWaived: string | number;
  waiverReason: string;
  dateOfCollection: string;
  receiptFiles?: File[];
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
    dateOfCollection: new Date().toISOString().split('T')[0],
    receiptFiles: []
  });
  const [updatingFee, setUpdatingFee] = useState(false);
  const [feeResultDialog, setFeeResultDialog] = useState<ResultDialogState>({
    open: false,
    title: '',
    message: '',
    type: 'success'
  });
  
  // Receipt image states
  const [selectedReceiptFiles, setSelectedReceiptFiles] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [uploadingReceipts, setUploadingReceipts] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [currentReceiptImages, setCurrentReceiptImages] = useState<ReceiptImage[]>([]);
  const [selectedFeeForReceipts, setSelectedFeeForReceipts] = useState<string | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Reset function to clear results when dropdown changes
  const resetSearchResults = () => {
    setSearchResults([]);
    setSelectedStudent(null);
    setFeeRecords([]);
    setCurrentPage(1);
    setTotalPages(1);
    setFeeError(null);
  };

  // Get valid grades and sections from master data
  const validGrades = [...new Set(masterDataClasses.map(cls => String(cls.grade)))];
  const validSections = [...new Set(masterDataClasses.map(cls => String(cls.section)))];

  // Receipt image utility functions
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length !== files.length) {
      setFeeResultDialog({
        open: true,
        title: 'Invalid File Type',
        message: 'Please select only image files (JPEG, PNG, GIF, etc.)',
        type: 'error'
      });
      return;
    }

    // Limit file size to 5MB per image
    const oversizedFiles = imageFiles.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setFeeResultDialog({
        open: true,
        title: 'File Too Large',
        message: 'Please select images smaller than 5MB each',
        type: 'error'
      });
      return;
    }

    setSelectedReceiptFiles(prev => [...prev, ...imageFiles]);
    
    // Create preview URLs
    const newPreviews = imageFiles.map(file => URL.createObjectURL(file));
    setPreviewImages(prev => [...prev, ...newPreviews]);
  };

  const removeReceiptFile = (index: number) => {
    setSelectedReceiptFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewImages(prev => {
      URL.revokeObjectURL(prev[index]); // Clean up memory
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadReceiptImages = async (feeRecordId: string) => {
    if (selectedReceiptFiles.length === 0) return [];

    setUploadingReceipts(true);
    try {
      const uploadedImages: ReceiptImage[] = [];

      for (const file of selectedReceiptFiles) {
        const formData = new FormData();
        formData.append('receiptImage', file);
        formData.append('feeRecordId', feeRecordId);

        const response = await api.post(`${import.meta.env.VITE_API_URL}/api/ReceiptImages`, formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });

        uploadedImages.push(response.data);
      }

      console.log('Receipt images uploaded successfully:', uploadedImages);
      return uploadedImages;
    } catch (error) {
      console.error('Error uploading receipt images:', error);
      throw error;
    } finally {
      setUploadingReceipts(false);
    }
  };

  const loadReceiptImages = async (feeRecordId: string) => {
    try {
      const response = await api.get(`${import.meta.env.VITE_API_URL}/api/ReceiptImages/fee/${feeRecordId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setCurrentReceiptImages(response.data);
    } catch (error) {
      console.error('Error loading receipt images:', error);
      setCurrentReceiptImages([]);
    }
  };

  const deleteReceiptImage = async (imageId: string) => {
    try {
      await api.delete(`${import.meta.env.VITE_API_URL}/api/ReceiptImages/${imageId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Refresh the images list
      if (selectedFeeForReceipts) {
        loadReceiptImages(selectedFeeForReceipts);
      }
    } catch (error) {
      console.error('Error deleting receipt image:', error);
      setFeeResultDialog({
        open: true,
        title: 'Delete Failed',
        message: 'Failed to delete receipt image. Please try again.',
        type: 'error'
      });
    }
  };

  const viewReceipts = async (feeRecordId: string) => {
    setSelectedFeeForReceipts(feeRecordId);
    await loadReceiptImages(feeRecordId);
    setShowReceiptDialog(true);
  };

  const takePhotoFromCamera = async () => {
    try {
      // Check if running on native platform
      if (!Capacitor.isNativePlatform()) {
        setFeeResultDialog({
          open: true,
          title: 'Camera Not Available',
          message: 'Camera capture is only available on mobile devices. Please use file selection instead.',
          type: 'error'
        });
        return;
      }

      const image = await CapacitorCamera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        width: 1024, // Limit image size for better performance
        height: 1024,
      });

      if (image.dataUrl) {
        // Convert dataURL to File object
        const response = await fetch(image.dataUrl);
        const blob = await response.blob();
        const timestamp = new Date().getTime();
        const fileName = `receipt_${timestamp}.jpg`;
        const file = new File([blob], fileName, { type: 'image/jpeg' });

        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
          setFeeResultDialog({
            open: true,
            title: 'File Too Large',
            message: 'Image size exceeds 5MB limit. Please try again with lower quality.',
            type: 'error'
          });
          return;
        }

        // Add to selected files
        setSelectedReceiptFiles(prev => [...prev, file]);
        
        // Create preview URL
        const previewUrl = URL.createObjectURL(blob);
        setPreviewImages(prev => [...prev, previewUrl]);
        
        setFeeResultDialog({
          open: true,
          title: 'Photo Captured',
          message: 'Receipt photo captured successfully!',
          type: 'success'
        });
      }
    } catch (error: any) {
      console.error('Camera capture error:', error);
      let errorMessage = 'Failed to capture photo. Please try again.';
      
      if (error.message?.includes('permission')) {
        errorMessage = 'Camera permission denied. Please enable camera access in settings.';
      } else if (error.message?.includes('cancelled')) {
        return; // User cancelled, don't show error
      }
      
      setFeeResultDialog({
        open: true,
        title: 'Camera Error',
        message: errorMessage,
        type: 'error'
      });
    }
  };

  const selectFromGallery = async () => {
    try {
      // Check if running on native platform
      if (!Capacitor.isNativePlatform()) {
        // For web, trigger the file input
        document.getElementById('receipt-upload-edit') || document.getElementById('receipt-upload-add')?.click();
        return;
      }

      const image = await CapacitorCamera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos, // Use photo library instead of camera
        width: 1024,
        height: 1024,
      });

      if (image.dataUrl) {
        // Convert dataURL to File object
        const response = await fetch(image.dataUrl);
        const blob = await response.blob();
        const timestamp = new Date().getTime();
        const fileName = `receipt_${timestamp}.jpg`;
        const file = new File([blob], fileName, { type: 'image/jpeg' });

        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
          setFeeResultDialog({
            open: true,
            title: 'File Too Large',
            message: 'Image size exceeds 5MB limit. Please try again with a smaller image.',
            type: 'error'
          });
          return;
        }

        // Add to selected files
        setSelectedReceiptFiles(prev => [...prev, file]);
        
        // Create preview URL
        const previewUrl = URL.createObjectURL(blob);
        setPreviewImages(prev => [...prev, previewUrl]);
      }
    } catch (error: any) {
      console.error('Gallery selection error:', error);
      if (!error.message?.includes('cancelled')) {
        setFeeResultDialog({
          open: true,
          title: 'Gallery Error',
          message: 'Failed to select image from gallery. Please try again.',
          type: 'error'
        });
      }
    }
  };

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

      // Upload receipt images if any are selected
      let uploadMessage = '';
      if (selectedReceiptFiles.length > 0 && response.data) {
        try {
          const uploadedImages = await uploadReceiptImages(response.data.id);
          uploadMessage = ` and ${uploadedImages.length} receipt image(s) uploaded`;
        } catch (uploadError) {
          console.error('Receipt upload error:', uploadError);
          uploadMessage = ', but receipt upload failed';
        }
      }

      setFeeResultDialog({
        open: true,
        title: editingFeeId ? 'Update Successful' : 'Add Successful',
        message: (editingFeeId ? 'Fee record updated successfully' : 'Fee record added successfully') + uploadMessage,
        type: 'success'
      });

      // Clear receipt files after successful upload
      setSelectedReceiptFiles([]);
      setPreviewImages(prev => {
        prev.forEach(url => URL.revokeObjectURL(url));
        return [];
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
      dateOfCollection: new Date().toISOString().split('T')[0],
      receiptFiles: []
    });
    
    // Clear receipt files and previews
    setSelectedReceiptFiles([]);
    setPreviewImages(prev => {
      prev.forEach(url => URL.revokeObjectURL(url));
      return [];
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
                onChange={(e) => {
                  setSearchCriteria(prev => ({
                    ...prev,
                    firstName: e.target.value
                  }));
                  if (searchResults.length > 0) {
                    resetSearchResults();
                  }
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">Last Name</label>
              <Input
                placeholder="Enter last name"
                value={searchCriteria.lastName}
                onChange={(e) => {
                  setSearchCriteria(prev => ({
                    ...prev,
                    lastName: e.target.value
                  }));
                  if (searchResults.length > 0) {
                    resetSearchResults();
                  }
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">Grade</label>
              <Select
                value={searchCriteria.grade || "all"}
                onValueChange={(value) => {
                  setSearchCriteria(prev => ({
                    ...prev,
                    grade: value === "all" ? "" : value
                  }));
                  resetSearchResults();
                }}
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
                onValueChange={(value) => {
                  setSearchCriteria(prev => ({
                    ...prev,
                    section: value === "all" ? "" : value
                  }));
                  resetSearchResults();
                }}
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
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditFee(record)}
                                className="flex items-center gap-1"
                              >
                                <Edit className="h-3 w-3" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedFeeForReceipts(record.id);
                                  setShowReceiptDialog(true);
                                  loadReceiptImages(record.id);
                                }}
                                className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                              >
                                <Camera className="h-3 w-3" />
                                Receipts
                              </Button>
                            </div>
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

            {/* Receipt Upload Section */}
            <div className="space-y-2">
              <Label>Receipt Images</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div className="text-center">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">Upload receipt images</p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    id="receipt-upload-edit"
                  />
                  <div className="flex gap-2 justify-center flex-wrap">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={takePhotoFromCamera}
                    >
                      <Camera className="h-4 w-4 mr-1" />
                      Camera
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={selectFromGallery}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Gallery
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('receipt-upload-edit')?.click()}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Files
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">JPEG, PNG, GIF (max 5MB each)</p>
                </div>
              </div>
              
              {/* Preview Selected Images */}
              {previewImages.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {previewImages.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Receipt ${index + 1}`}
                        className="w-full h-20 object-cover rounded border"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeReceiptFile(index)}
                        className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full bg-red-500 text-white hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
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

            {/* Receipt Upload Section */}
            <div className="space-y-2">
              <Label>Receipt Images</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div className="text-center">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">Upload receipt images</p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    id="receipt-upload-add"
                  />
                  <div className="flex gap-2 justify-center flex-wrap">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={takePhotoFromCamera}
                    >
                      <Camera className="h-4 w-4 mr-1" />
                      Camera
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={selectFromGallery}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Gallery
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('receipt-upload-add')?.click()}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Files
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">JPEG, PNG, GIF (max 5MB each)</p>
                </div>
              </div>
              
              {/* Preview Selected Images */}
              {previewImages.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {previewImages.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Receipt ${index + 1}`}
                        className="w-full h-20 object-cover rounded border"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeReceiptFile(index)}
                        className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full bg-red-500 text-white hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
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

      {/* Receipt Viewing Dialog */}
      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Receipt Images
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {currentReceiptImages.length === 0 ? (
              <div className="text-center py-8">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No receipt images found for this fee record.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentReceiptImages.map((receipt) => (
                  <div key={receipt.id} className="border rounded-lg overflow-hidden">
                    <div className="aspect-square bg-gray-100">
                      <img
                        src={`${import.meta.env.VITE_API_URL}/api/ReceiptImages/${receipt.id}/download`}
                        alt={`Receipt ${receipt.fileName}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=';
                        }}
                      />
                    </div>
                    <div className="p-3">
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        {receipt.fileName}
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        {receipt.uploadedAt && new Date(receipt.uploadedAt).toLocaleDateString()}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = `${import.meta.env.VITE_API_URL}/api/ReceiptImages/${receipt.id}/download`;
                            link.download = receipt.fileName;
                            link.click();
                          }}
                          className="flex-1"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteReceiptImage(receipt.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button 
              onClick={() => setShowReceiptDialog(false)}
              className="bg-gradient-to-r from-emerald-500 to-teal-600"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}