
import { useState, useEffect } from "react";
import { ASSESSMENT_NAMES, ACADEMIC_YEAR } from "../../config/genericConfig";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileSpreadsheet, BookOpen, DollarSign, CheckCircle, AlertCircle } from "lucide-react";

interface ResultDialogState {
  open: boolean;
  title: string;
  message: string;
  type: 'success' | 'error';
}

export default function MasterDataSetup() {
  // Handler for associating subjects with a class after creation
  const handleAssociateSubjects = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassId) return;
    try {
      const newClass = masterDataClasses.find((cls: any) => cls.id === newClassId);
      const body = {
        name: newClass?.name || "",
        grade: newClass?.grade || "",
        section: newClass?.section || "",
        subjectIds: selectedSubjectsForClass
      };
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/MasterData/classes/${newClassId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        // Refresh classes
  const getRes = await fetch(`${import.meta.env.VITE_API_URL}/api/MasterData/classes`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
        if (getRes.ok) {
          let data = await getRes.json();
          // Transform data to match AuthContext format
          data = data.map((cls: any) => {
            if (Array.isArray(cls.classSubjects)) {
              return {
                ...cls,
                subjects: cls.classSubjects.map((cs: any) => ({
                  id: cs.subjectId,
                  name: cs.subjectName
                })),
                subjectIds: cls.classSubjects.map((cs: any) => cs.subjectId)
              };
            }
            return { ...cls, subjects: [], subjectIds: [] };
          });
          setMasterDataClasses(data); // Update context with refreshed classes
          setResultDialog({
            open: true,
            title: 'Success',
            message: 'Class created and subjects associated successfully.',
            type: 'success'
          });
        }
      } else {
        setResultDialog({
          open: true,
          title: 'Association Failed',
          message: 'Failed to associate subjects with class.',
          type: 'error'
        });
      }
    } catch {
      setResultDialog({
        open: true,
        title: 'Error',
        message: 'Error associating subjects with class.',
        type: 'error'
      });
    }
    setShowSubjectModal(false);
  };
  // State for class details modal
  const [showClassDetailsModal, setShowClassDetailsModal] = useState(false);
  const [selectedClassDetails, setSelectedClassDetails] = useState<any>(null);
  const [editSubjectsForClass, setEditSubjectsForClass] = useState<string[]>([]);
  
  // Handler to update subjects for a class
  const handleUpdateClassSubjects = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassDetails) return;
    try {
      const body = {
        name: selectedClassDetails.name,
        grade: selectedClassDetails.grade,
        section: selectedClassDetails.section,
        subjectIds: editSubjectsForClass
      };
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/MasterData/classes/${selectedClassDetails.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        // Refresh classes
  const getRes = await fetch(`${import.meta.env.VITE_API_URL}/api/MasterData/classes`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
        if (getRes.ok) {
          let data = await getRes.json();
          // Transform data to match AuthContext format
          data = data.map((cls: any) => {
            if (Array.isArray(cls.classSubjects)) {
              return {
                ...cls,
                subjects: cls.classSubjects.map((cs: any) => ({
                  id: cs.subjectId,
                  name: cs.subjectName
                })),
                subjectIds: cls.classSubjects.map((cs: any) => cs.subjectId)
              };
            }
            return { ...cls, subjects: [], subjectIds: [] };
          });
          setMasterDataClasses(data); // Update context with refreshed classes
          setResultDialog({
            open: true,
            title: 'Success',
            message: 'Class subjects updated successfully.',
            type: 'success'
          });
        }
        setShowClassDetailsModal(false);
        setSelectedClassDetails(null);
      } else {
        setResultDialog({
          open: true,
          title: 'Update Failed',
          message: 'Failed to update class subjects.',
          type: 'error'
        });
      }
    } catch {
      setResultDialog({
        open: true,
        title: 'Error',
        message: 'Error updating class subjects.',
        type: 'error'
      });
    }
  };
  const [tab, setTab] = useState("classes");
  // State for Classes
  const [grade, setGrade] = useState("");
  const [section, setSection] = useState("");
  const { token, masterDataClasses, setMasterDataClasses, masterDataSubjects } = useAuth();

  // State for Assessments
  const [assessmentName, setAssessmentName] = useState("");
  const [assessmentType, setAssessmentType] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  // ...existing code...
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [showAddAssessment, setShowAddAssessment] = useState(false);
  const [gradingType, setGradingType] = useState("marks");
  const [maxMarks, setMaxMarks] = useState("");
  const [academicYear] = useState(ACADEMIC_YEAR);
  // Use subjects from context
  const [existingAssessments, setExistingAssessments] = useState<any[]>([]);
  
  // State for Fees
  const [monthlyFee, setMonthlyFee] = useState("");
  const [admissionFee, setAdmissionFee] = useState("");
  const [transportFee, setTransportFee] = useState("");
  const [libraryFee, setLibraryFee] = useState("");
  const [sportsFee, setSportsFee] = useState("");
  const [miscellaneousFee, setMiscellaneousFee] = useState("");
  const [feeGrade, setFeeGrade] = useState("");
  const [feeSection, setFeeSection] = useState("");
  const [existingFees, setExistingFees] = useState<any[]>([]);
  const [showAddFee, setShowAddFee] = useState(false);
  const [feesLoading, setFeesLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingFeeId, setEditingFeeId] = useState<string | null>(null);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editingAcademicYear, setEditingAcademicYear] = useState<string>("");
  
  // Result dialog state
  const [resultDialog, setResultDialog] = useState<ResultDialogState>({
    open: false,
    title: '',
    message: '',
    type: 'success'
  });
  
  // Delete confirmation dialog state
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    feeId: '',
    feeName: ''
  });
  const [deleting, setDeleting] = useState(false);
  // Fetch assessments when grade, section, and subject are selected
  // Fetch assessments function for reuse
  const fetchAssessments = async () => {
    console.log("fetchAssessments called with:", { 
      selectedGrade, 
      selectedSection, 
      selectedSubjectId, 
      assessmentName 
    });
    
    if (!selectedGrade || !selectedSection || !selectedSubjectId || !assessmentName) {
      console.log("fetchAssessments: Missing required fields, not making API call");
      setExistingAssessments([]);
      return;
    }
    try {
      const subjObj = masterDataSubjects?.find(s => String(s.id) === selectedSubjectId);
      const subjectName = subjObj ? subjObj.name : "";
      
      console.log("About to make API call with:", {
        subjObj,
        subjectName,
        selectedSubjectId,
        masterDataSubjectsCount: masterDataSubjects?.length,
        url: `${import.meta.env.VITE_API_URL}/api/MasterData/assessments?academicYear=${encodeURIComponent(academicYear)}&grade=${encodeURIComponent(selectedGrade)}&section=${encodeURIComponent(selectedSection)}&subjectName=${encodeURIComponent(subjectName)}&assessmentName=${encodeURIComponent(assessmentName)}`
      });
      
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/MasterData/assessments?academicYear=${encodeURIComponent(academicYear)}&grade=${encodeURIComponent(selectedGrade)}&section=${encodeURIComponent(selectedSection)}&subjectName=${encodeURIComponent(subjectName)}&assessmentName=${encodeURIComponent(assessmentName)}`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        }
      );
      if (res.ok) {
        const data = await res.json();
        setExistingAssessments(data);
      } else {
        setExistingAssessments([]);
      }
    } catch {
      setExistingAssessments([]);
    }
  };

  useEffect(() => {
    console.log("useEffect triggered for fetchAssessments with dependencies:", {
      selectedGrade, 
      selectedSection, 
      selectedSubjectId, 
      assessmentName, 
      academicYear,
      hasToken: !!token,
      masterDataSubjectsCount: masterDataSubjects?.length,
      masterDataClassesCount: masterDataClasses?.length
    });
    fetchAssessments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGrade, selectedSection, selectedSubjectId, assessmentName, academicYear, token, masterDataSubjects, masterDataClasses]);

  // Reset subject selection when class changes
  useEffect(() => {
    setSelectedSubjectId("");
    setAssessmentName(""); // Also reset assessment name
  }, [selectedGrade, selectedSection]);

  // Reset subject selection when the class's subject associations change
  useEffect(() => {
    if (selectedGrade && selectedSection && selectedSubjectId) {
      const selectedClass = masterDataClasses?.find(cls => 
        String(cls.grade) === selectedGrade && cls.section === selectedSection
      );
      
      console.log("Subject validation useEffect triggered:", {
        selectedGrade,
        selectedSection,
        selectedSubjectId,
        selectedClass,
        subjectIds: selectedClass?.subjectIds,
        subjects: selectedClass?.subjects
      });
      
      // Check if the currently selected subject is still valid for this class
      if (selectedClass) {
        const isSubjectStillValid = selectedClass.subjectIds?.includes(selectedSubjectId) || 
                                   selectedClass.subjects?.some(s => String(s.id) === selectedSubjectId);
        
        console.log("Subject validity check:", {
          isSubjectStillValid,
          selectedSubjectId,
          selectedSubjectIdType: typeof selectedSubjectId,
          subjectIdsIncludes: selectedClass.subjectIds?.includes(selectedSubjectId),
          subjectsIncludes: selectedClass.subjects?.some(s => String(s.id) === selectedSubjectId),
          subjectIds: selectedClass.subjectIds,
          subjects: selectedClass.subjects
        });
        
        if (!isSubjectStillValid) {
          console.log("Subject is not valid, resetting selectedSubjectId");
          setSelectedSubjectId("");
          setAssessmentName("");
        }
      }
    }
  }, [masterDataClasses, selectedGrade, selectedSection, selectedSubjectId]);

  // State for subject selection modal after class creation
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [newClassId, setNewClassId] = useState("");
  const [selectedSubjectsForClass, setSelectedSubjectsForClass] = useState<string[]>([]);

  // Handler for class submit
  const handleClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = `${grade}${section ? '-' + section : ''}`;
    // Check if combo already exists
    const exists = masterDataClasses.some(
      (cls) => String(cls.grade).trim() === grade.trim() && String(cls.section).trim() === section.trim()
    );
    if (exists) {
      setResultDialog({
        open: true,
        title: 'Validation Error',
        message: 'This grade and section combination already exists.',
        type: 'error'
      });
      return;
    }
    try {
      // Use selectedSubjectsForClass for initial subjectIds, or empty array
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/MasterData/classes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ grade, section, name, subjectIds: selectedSubjectsForClass })
      });
      if (res.ok) {
        // Store the grade and section before clearing form
        const createdGrade = grade;
        const createdSection = section;
        
        setGrade("");
        setSection("");
        setShowClassDetailsModal(false);
        // Reload classes from API and update context
  const getRes = await fetch(`${import.meta.env.VITE_API_URL}/api/MasterData/classes`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
        if (getRes.ok) {
          const data = await getRes.json();
          // Transform the data to ensure proper structure
          const transformedData = data.map((cls: any) => ({
            ...cls,
            subjects: cls.subjects || [],
            subjectIds: cls.subjectIds || []
          }));
          setMasterDataClasses(transformedData); // Update context with transformed classes
          // Find the newly created class using stored values
          const newClass = transformedData.find((cls: any) => String(cls.grade) === createdGrade && String(cls.section) === createdSection);
          if (newClass && newClass.id) {
            setNewClassId(newClass.id);
            setShowSubjectModal(true);
            setSelectedSubjectsForClass([]);
          } else {
            // If class creation succeeded but we can't find it, still show success
            setResultDialog({
              open: true,
              title: 'Success',
              message: 'Class created successfully.',
              type: 'success'
            });
          }
        } else {
          setResultDialog({
            open: true,
            title: 'Error',
            message: 'Class created but failed to refresh class list.',
            type: 'error'
          });
        }
      } else {
        setResultDialog({
          open: true,
          title: 'Save Failed',
          message: 'Failed to save class. Please try again.',
          type: 'error'
        });
      }
    } catch (err) {
      setResultDialog({
        open: true,
        title: 'Error',
        message: 'Error saving class. Please try again.',
        type: 'error'
      });
    }
  };
      {/* Modal for selecting subjects after class creation */}
      {showSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-40" onClick={() => setShowSubjectModal(false)} />
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative border border-gray-200 z-50">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl font-bold"
              onClick={() => setShowSubjectModal(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <form
              onSubmit={handleAssociateSubjects}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Select Subjects for this Class</Label>
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                  {masterDataSubjects && masterDataSubjects.length > 0 ? (
                    masterDataSubjects.map((subj, idx) => (
                      <label key={subj.id || idx} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          value={subj.id}
                          checked={selectedSubjectsForClass.includes(subj.id)}
                          onChange={e => {
                            const checked = e.target.checked;
                            setSelectedSubjectsForClass(prev =>
                              checked
                                ? [...prev, subj.id]
                                : prev.filter(id => id !== subj.id)
                            );
                          }}
                        />
                        {subj.name}
                      </label>
                    ))
                  ) : (
                    <span className="text-gray-400">No subjects found.</span>
                  )}
                </div>
              </div>
              <Button type="submit">Save Subjects</Button>
              <Button type="button" variant="outline" onClick={() => setShowSubjectModal(false)}>
                Cancel
              </Button>
            </form>
          </div>
        </div>
      )}

  const handleAssessmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Find classId from masterDataClasses
    const selectedClass = masterDataClasses.find(
      (cls) => String(cls.grade) === selectedGrade && String(cls.section) === selectedSection
    );
    if (!selectedClass) {
      setResultDialog({
        open: true,
        title: 'Validation Error',
        message: 'Class not found for selected grade and section.',
        type: 'error'
      });
      return;
    }
    const body = {
      name: assessmentName,
      academicYear,
      classId: selectedClass.id,
      subjectId: selectedSubjectId,
      gradingType,
      maxMarks: gradingType === "marks" ? Number(maxMarks) : 0
    };
    try {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/MasterData/assessments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setShowAddAssessment(false);
        setMaxMarks("");
        setGradingType("marks");
        await fetchAssessments(); // Refresh grid with new data
        setResultDialog({
          open: true,
          title: 'Success',
          message: 'Assessment saved successfully.',
          type: 'success'
        });
      } else {
        setResultDialog({
          open: true,
          title: 'Save Failed',
          message: 'Failed to save assessment. Please try again.',
          type: 'error'
        });
      }
    } catch (err) {
      setResultDialog({
        open: true,
        title: 'Error',
        message: 'Error saving assessment. Please try again.',
        type: 'error'
      });
    }
  };

  // Fees handlers
  const fetchFees = async () => {
    if (!feeGrade || !feeSection) {
      setExistingFees([]);
      return;
    }
    
    setFeesLoading(true);
    try {
      // Find the class based on grade and section
      const selectedClass = masterDataClasses.find(
        (cls) => String(cls.grade) === feeGrade && String(cls.section) === feeSection
      );
      if (!selectedClass) {
        setExistingFees([]);
        return;
      }
      
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/MasterData/fee-admin/class/${selectedClass.id}/year/${encodeURIComponent(academicYear)}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        console.log('Fee data received:', data); // Debug log
        // If data is a single object, wrap it in an array; if it's already an array, use as is
        if (data) {
          const feesArray = Array.isArray(data) ? data : [data];
          console.log('Setting fees array:', feesArray); // Debug log
          setExistingFees(feesArray);
        } else {
          setExistingFees([]);
        }
      } else {
        console.error('Failed to fetch fees, status:', res.status); // Debug log
        setExistingFees([]);
      }
    } catch (error) {
      console.error('Error fetching fees:', error);
      setExistingFees([]);
    } finally {
      setFeesLoading(false);
    }
  };

  const handleFeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that monthlyFee is provided (needed to calculate annual fee)
    if (!monthlyFee || Number(monthlyFee) <= 0) {
      setResultDialog({
        open: true,
        title: 'Validation Error',
        message: 'Monthly Fee is mandatory and must be greater than 0.',
        type: 'error'
      });
      return;
    }
    
    // Find classId from masterDataClasses
    const selectedClass = masterDataClasses.find(
      (cls) => String(cls.grade) === feeGrade && String(cls.section) === feeSection
    );
    if (!selectedClass) {
      setResultDialog({
        open: true,
        title: 'Validation Error',
        message: 'Class not found for selected grade and section.',
        type: 'error'
      });
      return;
    }

    // Calculate annual fee automatically
    const calculatedAnnualFee = Number(monthlyFee) * 12;
    
    const body = {
      classId: selectedClass.id,
      academicYear,
      monthlyFee: Number(monthlyFee) || 0,
      annualFee: calculatedAnnualFee,
      admissionFee: Number(admissionFee) || 0,
      transportFee: Number(transportFee) || 0,
      libraryFee: Number(libraryFee) || 0,
      sportsFee: Number(sportsFee) || 0,
      miscellaneousFee: Number(miscellaneousFee) || 0,
      isActive: true
    };
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/MasterData/fee-admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setShowAddFee(false);
        // Reset form
        setMonthlyFee("");
        setAdmissionFee("");
        setTransportFee("");
        setLibraryFee("");
        setSportsFee("");
        setMiscellaneousFee("");
        await fetchFees(); // Refresh grid with new data
        setResultDialog({
          open: true,
          title: 'Success',
          message: 'Fee structure saved successfully.',
          type: 'success'
        });
      } else {
        const errorData = await res.json().catch(() => ({ message: "Unknown error" }));
        setResultDialog({
          open: true,
          title: 'Save Failed',
          message: `Failed to save fee structure: ${errorData.message || "Please try again."}`,
          type: 'error'
        });
      }
    } catch (err) {
      console.error("Error saving fee structure:", err);
      setResultDialog({
        open: true,
        title: 'Error',
        message: 'Error saving fee structure. Please try again.',
        type: 'error'
      });
    }
  };

  // Handle editing a fee structure
  const handleEditFee = (fee: any) => {
    setIsEditMode(true);
    setEditingFeeId(fee.id);
    setEditingClassId(fee.classId);
    setEditingAcademicYear(fee.academicYear || academicYear);
    setMonthlyFee(fee.monthlyFee?.toString() || "");
    // Annual fee will be calculated automatically, so don't set it
    setAdmissionFee(fee.admissionFee?.toString() || "");
    setTransportFee(fee.transportFee?.toString() || "");
    setLibraryFee(fee.libraryFee?.toString() || "");
    setSportsFee(fee.sportsFee?.toString() || "");
    setMiscellaneousFee(fee.miscellaneousFee?.toString() || "");
    setShowAddFee(true);
  };

  // Handle updating a fee structure
  const handleUpdateFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFeeId) return;

    // Validate that monthlyFee is provided
    if (!monthlyFee || Number(monthlyFee) <= 0) {
      setResultDialog({
        open: true,
        title: 'Validation Error',
        message: 'Monthly Fee is mandatory and must be greater than 0.',
        type: 'error'
      });
      return;
    }

    try {
      // Calculate annual fee automatically
      const calculatedAnnualFee = parseFloat(monthlyFee) * 12;
      
      const body = {
        id: editingFeeId,
        classId: editingClassId,
        academicYear: editingAcademicYear,
        monthlyFee: parseFloat(monthlyFee) || 0,
        annualFee: calculatedAnnualFee,
        admissionFee: parseFloat(admissionFee) || 0,
        transportFee: parseFloat(transportFee) || 0,
        libraryFee: parseFloat(libraryFee) || 0,
        sportsFee: parseFloat(sportsFee) || 0,
        miscellaneousFee: parseFloat(miscellaneousFee) || 0,
        isActive: true
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/MasterData/fee-admin/${editingFeeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        setShowAddFee(false);
        setIsEditMode(false);
        setEditingFeeId(null);
        setEditingClassId(null);
        setEditingAcademicYear("");
        // Clear form
        setMonthlyFee("");
        setAdmissionFee("");
        setTransportFee("");
        setLibraryFee("");
        setSportsFee("");
        setMiscellaneousFee("");
        await fetchFees(); // Refresh grid with updated data
        setResultDialog({
          open: true,
          title: 'Success',
          message: 'Fee structure updated successfully.',
          type: 'success'
        });
      } else {
        const errorData = await res.json().catch(() => ({ message: "Unknown error" }));
        setResultDialog({
          open: true,
          title: 'Update Failed',
          message: `Failed to update fee structure: ${errorData.message || "Please try again."}`,
          type: 'error'
        });
      }
    } catch (err) {
      console.error("Error updating fee structure:", err);
      setResultDialog({
        open: true,
        title: 'Error',
        message: 'Error updating fee structure. Please try again.',
        type: 'error'
      });
    }
  };

  // Handle canceling edit mode
  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditingFeeId(null);
    setEditingClassId(null);
    setEditingAcademicYear("");
    setShowAddFee(false);
    // Clear form
    setMonthlyFee("");
    setAdmissionFee("");
    setTransportFee("");
    setLibraryFee("");
    setSportsFee("");
    setMiscellaneousFee("");
  };

  // Handle delete fee confirmation
  const handleDeleteFee = (fee: any) => {
    const feeName = `${feeGrade}-${feeSection} Fee Structure`;
    setDeleteDialog({
      open: true,
      feeId: fee.id,
      feeName: feeName
    });
  };

  // Handle actual fee deletion
  const handleConfirmDelete = async () => {
    if (!deleteDialog.feeId) return;

    setDeleting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/MasterData/fee-admin/${deleteDialog.feeId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (res.ok) {
        setDeleteDialog({ open: false, feeId: '', feeName: '' });
        await fetchFees(); // Refresh grid
        setResultDialog({
          open: true,
          title: 'Success',
          message: 'Fee structure deleted successfully.',
          type: 'success'
        });
      } else {
        const errorData = await res.json().catch(() => ({ message: "Unknown error" }));
        setResultDialog({
          open: true,
          title: 'Delete Failed',
          message: `Failed to delete fee structure: ${errorData.message || "Please try again."}`,
          type: 'error'
        });
      }
    } catch (err) {
      console.error("Error deleting fee structure:", err);
      setResultDialog({
        open: true,
        title: 'Error',
        message: 'Error deleting fee structure. Please try again.',
        type: 'error'
      });
    } finally {
      setDeleting(false);
    }
  };

  // Handle cancel delete
  const handleCancelDelete = () => {
    setDeleteDialog({ open: false, feeId: '', feeName: '' });
  };

  useEffect(() => {
    fetchFees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feeGrade, feeSection, academicYear, token, masterDataClasses]);

  return (
  <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <FileSpreadsheet className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Master Data Setup</h1>
            <p className="text-white/80">Manage classes and assessment details</p>
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="fees">Fees</TabsTrigger>
        </TabsList>

        {/* Classes Tab */}
        <TabsContent value="classes">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Create or Update Classes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Existing Classes Table */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-md font-semibold text-gray-700">Existing Classes</div>
                  <Button size="sm" onClick={() => {
                    setSelectedClassDetails(null);
                    setShowClassDetailsModal(true);
                    setEditSubjectsForClass([]);
                    setGrade(""); 
                    setSection("");
                  }}>Add Class</Button>
                </div>
                {masterDataClasses && masterDataClasses.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-md">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-2 border-b text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                          <th className="px-4 py-2 border-b text-left text-xs font-medium text-gray-500 uppercase">Section</th>
                          <th className="px-4 py-2 border-b text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {masterDataClasses.map((cls, idx) => (
                          <tr key={idx} className="border-b last:border-b-0">
                            <td className="px-4 py-2">{cls.grade}</td>
                            <td className="px-4 py-2">{cls.section}</td>
                            <td className="px-4 py-2">
                              <Button size="sm" variant="outline" onClick={() => {
                                setSelectedClassDetails(cls);
                                setShowClassDetailsModal(true);
                                setGrade(cls.grade || "");
                                setSection(cls.section || "");
                                if (Array.isArray(cls.subjectIds) && cls.subjectIds.length > 0) { 
                                  setEditSubjectsForClass(cls.subjectIds);
                                } else if (Array.isArray(cls.subjects) && cls.subjects.length > 0) {
                                  setEditSubjectsForClass(cls.subjects.map((s: any) => s.id));
                                } else {
                                  setEditSubjectsForClass([]);
                                }
                              }}>
                                Details 
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-gray-400 italic">No classes found.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assessments Tab */}
        <TabsContent value="assessments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Add or Modify Assessment Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Grade Dropdown */}
              <div className="mb-4">
                <Label htmlFor="gradeDropdown">Grade</Label>
                <select
                  id="gradeDropdown"
                  className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
                  value={selectedGrade}
                  onChange={e => setSelectedGrade(e.target.value)}
                >
                  <option value="">Select grade</option>
                  {[...new Set(masterDataClasses.map(cls => cls.grade))].map((grade, idx) => (
                    <option key={idx} value={grade}>{grade}</option>
                  ))}
                </select>
              </div>
              {/* Section Dropdown */}
              <div className="mb-4">
                <Label htmlFor="sectionDropdown">Section</Label>
                <select
                  id="sectionDropdown"
                  className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
                  value={selectedSection}
                  onChange={e => setSelectedSection(e.target.value)}
                  disabled={!selectedGrade}
                >
                  <option value="">Select section</option>
                  {masterDataClasses.filter(cls => String(cls.grade) === selectedGrade).map((cls, idx) => (
                    <option key={idx} value={cls.section}>{cls.section}</option>
                  ))}
                </select>
              </div>
              {/* Subject Dropdown (using selectedSubjectId) */}
              <div className="mb-4">
                <Label htmlFor="subjectDropdown">Subject</Label>
                <select
                  id="subjectDropdown"
                  className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
                  value={selectedSubjectId}
                  onChange={e => {
                    console.log("Subject dropdown onChange:", {
                      value: e.target.value,
                      valueType: typeof e.target.value,
                      valueAsInt: parseInt(e.target.value)
                    });
                    setSelectedSubjectId(e.target.value);
                    setAssessmentName(""); // Reset assessment name when subject changes
                  }}
                  disabled={!selectedGrade || !selectedSection}
                >
                  <option value="">{(!selectedGrade || !selectedSection) ? "Select class first" : "Select subject"}</option>
                  {/* Debug logging for troubleshooting */}
                  {(() => {
                    if (selectedGrade && selectedSection) {
                      const selectedClass = masterDataClasses?.find(cls => 
                        String(cls.grade) === selectedGrade && cls.section === selectedSection
                      );
                      console.log("Debug - Assessment Subject Dropdown:", {
                        selectedGrade,
                        selectedSection,
                        selectedClass,
                        selectedClassSubjectIds: selectedClass?.subjectIds,
                        selectedClassSubjects: selectedClass?.subjects,
                        masterDataClasses,
                        masterDataSubjects,
                        availableSubjects: masterDataSubjects?.filter((subj) => {
                          if (!selectedClass) return false;
                          return selectedClass.subjectIds?.includes(subj.id) || 
                                 selectedClass.subjects?.some(s => s.id === subj.id);
                        })
                      });
                    }
                    return null;
                  })()}
                  {masterDataSubjects && masterDataSubjects.length > 0 ? (
                    masterDataSubjects
                      .filter((subj) => {
                        // Only show subjects that are associated with the selected class
                        if (!selectedGrade || !selectedSection) return false;
                        
                        // Find the class that matches selected grade and section
                        const selectedClass = masterDataClasses?.find(cls => 
                          String(cls.grade) === selectedGrade && cls.section === selectedSection
                        );
                        
                        // If class found, check if this subject is associated with it
                        // The relationship is stored in the class, not the subject
                        if (selectedClass) {
                          // Check if subject is in the class's subjectIds array
                          return selectedClass.subjectIds?.includes(subj.id) || 
                                 selectedClass.subjects?.some(s => s.id === subj.id);
                        }
                        return false;
                      })
                      .map((subj, idx) => (
                        <option key={subj.id || idx} value={subj.id}>{subj.name}</option>
                      ))
                  ) : (
                    <option disabled>No subjects available</option>
                  )}
                </select>
              </div>

              {/* Assessment Name Dropdown (always visible) */}
              <div className="mb-4">
                <Label htmlFor="assessmentNameDropdown">Assessment Name</Label>
                <select
                  id="assessmentNameDropdown"
                  className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
                  value={assessmentName}
                  onChange={e => {
                    console.log("Assessment name changed to:", e.target.value);
                    setAssessmentName(e.target.value);
                  }}
                >
                  <option value="">Select assessment</option>
                  {ASSESSMENT_NAMES.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
              {/* Existing Assessments Table */}
              {selectedGrade && selectedSection && selectedSubjectId && assessmentName && (
                <div className="mb-6">
                  <div className="text-md font-semibold mb-2 text-gray-700">Existing Assessments</div>
                  {existingAssessments && existingAssessments.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white border border-gray-200 rounded-md">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-4 py-2 border-b text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-4 py-2 border-b text-left text-xs font-medium text-gray-500 uppercase">Academic Year</th>
                            <th className="px-4 py-2 border-b text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                            <th className="px-4 py-2 border-b text-left text-xs font-medium text-gray-500 uppercase">Section</th>
                            <th className="px-4 py-2 border-b text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                            <th className="px-4 py-2 border-b text-left text-xs font-medium text-gray-500 uppercase">Max Marks</th>
                            <th className="px-4 py-2 border-b text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {existingAssessments.map((assess, idx) => (
                            <tr key={assess.id || idx} className="border-b last:border-b-0">
                              <td className="px-4 py-2">{assess.name}</td>
                              <td className="px-4 py-2">{assess.academicYear}</td>
                              <td className="px-4 py-2">{assess.grade}</td>
                              <td className="px-4 py-2">{assess.section}</td>
                              <td className="px-4 py-2">{assess.subjectName}</td>
                              <td className="px-4 py-2">{assess.maxMarks}</td>
                              <td className="px-4 py-2 flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => alert('Edit not implemented yet')}>Edit</Button>
                                <Button size="sm" variant="destructive" onClick={() => alert('Delete not implemented yet')}>Delete</Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <>
                      <div className="text-gray-400 italic">No assessments found.</div>
                      <div className="mt-4">
                        <Button type="button" onClick={() => setShowAddAssessment(true)}>
                          Add Assessment
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
              {/* Modal for Add Assessment */}
              {showAddAssessment && (
                <div className="absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2">
                  <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative border border-gray-200">
                    <button
                      className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl font-bold"
                      onClick={() => setShowAddAssessment(false)}
                      aria-label="Close"
                    >
                      &times;
                    </button>
                    <form onSubmit={handleAssessmentSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="academicYear">Academic Year</Label>
                        <select id="academicYear" className="w-full border border-gray-300 rounded px-3 py-2 mt-1" value={academicYear} disabled>
                          <option value="2025-26">2025-26</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gradingType">Grading Type</Label>
                        <select
                          id="gradingType"
                          className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
                          value={gradingType}
                          onChange={e => setGradingType(e.target.value)}
                        >
                          <option value="marks">Marks</option>
                          <option value="grade">Grade</option>
                        </select>
                      </div>
                      {gradingType === "marks" && (
                        <div className="space-y-2">
                          <Label htmlFor="maxMarks">Max Marks</Label>
                          <Input id="maxMarks" type="number" value={maxMarks} onChange={e => setMaxMarks(e.target.value)} placeholder="Enter max marks" />
                        </div>
                      )}
                      <Button type="submit">Save Assessment</Button>
                      <Button type="button" variant="outline" onClick={() => setShowAddAssessment(false)}>
                        Cancel
                      </Button>
                    </form>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fees Tab */}
        <TabsContent value="fees">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Fee Structure Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Grade Dropdown for Fees */}
              <div className="mb-4">
                <Label htmlFor="feeGradeDropdown">Grade</Label>
                <select
                  id="feeGradeDropdown"
                  className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
                  value={feeGrade}
                  onChange={e => {
                    setFeeGrade(e.target.value);
                    setFeeSection(""); // Reset section when grade changes
                  }}
                >
                  <option value="">Select grade</option>
                  {masterDataClasses && masterDataClasses.length > 0 ? (
                    [...new Set(masterDataClasses.map(cls => cls.grade))].map((grade, idx) => (
                      <option key={idx} value={grade}>{grade}</option>
                    ))
                  ) : (
                    <option disabled>No grades available</option>
                  )}
                </select>
              </div>
              
              {/* Section Dropdown for Fees */}
              <div className="mb-4">
                <Label htmlFor="feeSectionDropdown">Section</Label>
                <select
                  id="feeSectionDropdown"
                  className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
                  value={feeSection}
                  onChange={e => setFeeSection(e.target.value)}
                  disabled={!feeGrade}
                >
                  <option value="">Select section</option>
                  {feeGrade && masterDataClasses ? (
                    masterDataClasses.filter(cls => String(cls.grade) === feeGrade).map((cls, idx) => (
                      <option key={idx} value={cls.section}>{cls.section}</option>
                    ))
                  ) : (
                    <option disabled>Select grade first</option>
                  )}
                </select>
              </div>

              {/* Existing Fees Table */}
              {feeGrade && feeSection && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-md font-semibold text-gray-700">
                      Existing Fees for Grade {feeGrade} - Section {feeSection}
                    </div>
                    <Button size="sm" onClick={() => setShowAddFee(true)} disabled={feesLoading || (existingFees && existingFees.length > 0)}>
                      Setup Fee Structure
                    </Button>
                  </div>
                  
                  {feesLoading ? (
                    <div className="text-center py-6">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-500 mt-2">Loading fees...</p>
                    </div>
                  ) : existingFees && existingFees.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white border border-gray-200 rounded-md">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-4 py-2 border-b text-left text-xs font-medium text-gray-500 uppercase">Monthly Fee</th>
                            <th className="px-4 py-2 border-b text-left text-xs font-medium text-gray-500 uppercase">Annual Fee</th>
                            <th className="px-4 py-2 border-b text-left text-xs font-medium text-gray-500 uppercase">Admission Fee</th>
                            <th className="px-4 py-2 border-b text-left text-xs font-medium text-gray-500 uppercase">Transport Fee</th>
                            <th className="px-4 py-2 border-b text-left text-xs font-medium text-gray-500 uppercase">Library Fee</th>
                            <th className="px-4 py-2 border-b text-left text-xs font-medium text-gray-500 uppercase">Sports Fee</th>
                            <th className="px-4 py-2 border-b text-left text-xs font-medium text-gray-500 uppercase">Miscellaneous Fee</th>
                            <th className="px-4 py-2 border-b text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-4 py-2 border-b text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {existingFees.map((fee, idx) => (
                            <tr key={fee.id || idx} className="border-b last:border-b-0">
                              <td className="px-4 py-2">₹{fee.monthlyFee?.toLocaleString() || 0}</td>
                              <td className="px-4 py-2 font-medium">₹{fee.annualFee?.toLocaleString() || 0}</td>
                              <td className="px-4 py-2">₹{fee.admissionFee?.toLocaleString() || 0}</td>
                              <td className="px-4 py-2">₹{fee.transportFee?.toLocaleString() || 0}</td>
                              <td className="px-4 py-2">₹{fee.libraryFee?.toLocaleString() || 0}</td>
                              <td className="px-4 py-2">₹{fee.sportsFee?.toLocaleString() || 0}</td>
                              <td className="px-4 py-2">₹{fee.miscellaneousFee?.toLocaleString() || 0}</td>
                              <td className="px-4 py-2">
                                <span className={`px-2 py-1 text-xs rounded-full ${fee.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                  {fee.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-4 py-2 flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleEditFee(fee)}>Edit</Button>
                                <Button size="sm" variant="destructive" onClick={() => handleDeleteFee(fee)}>Delete</Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <div className="text-gray-400 italic">No fee structure found for this class.</div>
                      <div className="mt-2 text-sm text-gray-500">Click "Setup Fee Structure" to create a comprehensive fee structure for this class.</div>
                    </div>
                  )}
                </div>
              )}

              {/* Message when no grade/section selected */}
              {(!feeGrade || !feeSection) && (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Please select both Grade and Section to view existing fee structure</p>
                </div>
              )}

              {/* Modal for Add Fee */}
              {showAddFee && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                  <div className="fixed inset-0 bg-black bg-opacity-40" onClick={() => setShowAddFee(false)} />
                  <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl relative border border-gray-200 z-50 max-h-[90vh] overflow-y-auto">
                    <button
                      className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl font-bold"
                      onClick={isEditMode ? handleCancelEdit : () => setShowAddFee(false)}
                      aria-label="Close"
                    >
                      &times;
                    </button>
                    <h2 className="text-xl font-bold mb-4">{isEditMode ? 'Edit Fee Structure' : 'Setup Fee Structure'}</h2>
                    <form onSubmit={isEditMode ? handleUpdateFee : handleFeeSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="monthlyFee">Monthly Fee (₹)</Label>
                          <Input 
                            id="monthlyFee" 
                            type="number" 
                            value={monthlyFee} 
                            onChange={e => setMonthlyFee(e.target.value)} 
                            placeholder="Enter monthly fee" 
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Annual Fee (₹) - Calculated</Label>
                          <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700 font-medium">
                            ₹{(parseFloat(monthlyFee) * 12 || 0).toLocaleString()}
                          </div>
                          <p className="text-xs text-gray-500">Automatically calculated as Monthly Fee × 12</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="admissionFee">Admission Fee (₹)</Label>
                          <Input 
                            id="admissionFee" 
                            type="number" 
                            value={admissionFee} 
                            onChange={e => setAdmissionFee(e.target.value)} 
                            placeholder="Enter admission fee" 
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="transportFee">Transport Fee (₹)</Label>
                          <Input 
                            id="transportFee" 
                            type="number" 
                            value={transportFee} 
                            onChange={e => setTransportFee(e.target.value)} 
                            placeholder="Enter transport fee" 
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="libraryFee">Library Fee (₹)</Label>
                          <Input 
                            id="libraryFee" 
                            type="number" 
                            value={libraryFee} 
                            onChange={e => setLibraryFee(e.target.value)} 
                            placeholder="Enter library fee" 
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="sportsFee">Sports Fee (₹)</Label>
                          <Input 
                            id="sportsFee" 
                            type="number" 
                            value={sportsFee} 
                            onChange={e => setSportsFee(e.target.value)} 
                            placeholder="Enter sports fee" 
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="miscellaneousFee">Miscellaneous Fee (₹)</Label>
                        <Input 
                          id="miscellaneousFee" 
                          type="number" 
                          value={miscellaneousFee} 
                          onChange={e => setMiscellaneousFee(e.target.value)} 
                          placeholder="Enter miscellaneous fee" 
                          min="0"
                          step="0.01"
                        />
                      </div>

                      {/* Total Fee Calculation */}
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h3 className="font-semibold text-blue-800 mb-3">Fee Summary</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span>Monthly Fee:</span>
                              <span className="font-medium">₹{(parseFloat(monthlyFee) || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Annual Fee (Monthly × 12):</span>
                              <span className="font-medium">₹{(parseFloat(monthlyFee) * 12 || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Admission Fee:</span>
                              <span className="font-medium">₹{(parseFloat(admissionFee) || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Transport Fee:</span>
                              <span className="font-medium">₹{(parseFloat(transportFee) || 0).toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span>Library Fee:</span>
                              <span className="font-medium">₹{(parseFloat(libraryFee) || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Sports Fee:</span>
                              <span className="font-medium">₹{(parseFloat(sportsFee) || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Miscellaneous Fee:</span>
                              <span className="font-medium">₹{(parseFloat(miscellaneousFee) || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between border-t pt-1 mt-2 font-semibold text-blue-800">
                              <span>Total Annual Cost:</span>
                              <span>₹{(
                                (parseFloat(monthlyFee) * 12 || 0) +
                                (parseFloat(admissionFee) || 0) +
                                (parseFloat(transportFee) || 0) +
                                (parseFloat(libraryFee) || 0) +
                                (parseFloat(sportsFee) || 0) +
                                (parseFloat(miscellaneousFee) || 0)
                              ).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded text-sm text-gray-600 mb-4">
                        <strong>Class Information:</strong><br/>
                        <strong>Academic Year:</strong> {academicYear}<br/>
                        <strong>Grade:</strong> {feeGrade}<br/>
                        <strong>Section:</strong> {feeSection}<br/>
                        <span className="text-blue-600">* Annual Fee is automatically calculated from Monthly Fee</span>
                      </div>
                      
                      <div className="flex gap-3">
                        <Button type="submit" className="flex-1">
                          {isEditMode ? 'Update Fee Structure' : 'Save Fee Structure'}
                        </Button>
                        <Button type="button" variant="outline" onClick={isEditMode ? handleCancelEdit : () => setShowAddFee(false)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    {/* Modal for class details and subject editing */}
    {showClassDetailsModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative border border-gray-200 z-50 pointer-events-auto">
          <button
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl font-bold"
            onClick={() => setShowClassDetailsModal(false)}
            aria-label="Close"
          >
            &times;
          </button>
          <h2 className="text-xl font-bold mb-4">{selectedClassDetails ? `Class Details: ${selectedClassDetails.name}` : "Add Class"}</h2>
          <form onSubmit={selectedClassDetails ? handleUpdateClassSubjects : handleClassSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="grade">Grade</Label>
              <Input id="grade" value={grade} onChange={e => setGrade(e.target.value)} placeholder="Enter grade (e.g. 1, 2, 10)" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="section">Section</Label>
              <Input id="section" value={section} onChange={e => setSection(e.target.value)} placeholder="Enter section (e.g. A, B)" />
            </div>
            {/* Show two sections if editing an existing class */}
            {selectedClassDetails ? (
              <>
                <div className="space-y-2">
                  <Label>Already Associated Subjects</Label>
                  <div className="flex flex-col gap-2 max-h-32 overflow-y-auto bg-gray-50 rounded p-2">
                    {masterDataSubjects && masterDataSubjects.length > 0 ? (
                      masterDataSubjects.filter(subj => editSubjectsForClass.includes(subj.id)).length > 0 ? (
                        masterDataSubjects.filter(subj => editSubjectsForClass.includes(subj.id)).map((subj, idx) => (
                          <div key={subj.id || idx} className="flex items-center gap-2 text-gray-700">
                            <span>{subj.name}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-gray-400">No subjects associated.</span>
                      )
                    ) : (
                      <span className="text-gray-400">No subjects found.</span>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Add More Subjects</Label>
                  <div className="flex flex-col gap-2 max-h-32 overflow-y-auto">
                    {masterDataSubjects && masterDataSubjects.length > 0 ? (
                      masterDataSubjects.filter(subj => !editSubjectsForClass.includes(subj.id)).length > 0 ? (
                        masterDataSubjects.filter(subj => !editSubjectsForClass.includes(subj.id)).map((subj, idx) => (
                          <label key={subj.id || idx} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              value={subj.id}
                              checked={false}
                              onChange={e => {
                                const checked = e.target.checked;
                                if (checked) {
                                  setEditSubjectsForClass(prev => [...prev, subj.id]);
                                }
                              }}
                            />
                            {subj.name}
                          </label>
                        ))
                      ) : (
                        <span className="text-gray-400">No more subjects to add.</span>
                      )
                    ) : (
                      <span className="text-gray-400">No subjects found.</span>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label>Subjects Associated</Label>
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                  {masterDataSubjects && masterDataSubjects.length > 0 ? (
                    masterDataSubjects.map((subj, idx) => (
                      <label key={subj.id || idx} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          value={subj.id}
                          checked={editSubjectsForClass.includes(subj.id)}
                          onChange={e => {
                            const checked = e.target.checked;
                            setEditSubjectsForClass(prev =>
                              checked
                                ? [...prev, subj.id]
                                : prev.filter(id => id !== subj.id)
                            );
                          }}
                        />
                        {subj.name}
                      </label>
                    ))
                  ) : (
                    <span className="text-gray-400">No subjects found.</span>
                  )}
                </div>
              </div>
            )}
            <Button type="submit">{selectedClassDetails ? "Save Changes" : "Add Class"}</Button>
            <Button type="button" variant="outline" onClick={() => setShowClassDetailsModal(false)}>
              Cancel
            </Button>
          </form>
        </div>
      </div>
    )}

    {/* Delete Confirmation Dialog */}
    <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && handleCancelDelete()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Confirm Delete
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-gray-700">
            Are you sure you want to delete the fee structure for <strong>{deleteDialog.feeName}</strong>?
          </p>
          <p className="text-sm text-red-600 mt-2">
            This action cannot be undone.
          </p>
        </div>
        <div className="flex gap-3 justify-end">
          <Button 
            variant="outline"
            onClick={handleCancelDelete}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive"
            onClick={handleConfirmDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
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
