import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function UploadMarks() {
  const { token, masterDataClasses, masterDataSubjects } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [assessments, setAssessments] = useState<any[]>([]);
  const academicYear = "2025-26";
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [selectedAssessment, setSelectedAssessment] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [gradingType, setGradingType] = useState<string>("");
  const [maxMarks, setMaxMarks] = useState<number | null>(null);
  const [marks, setMarks] = useState<{ [studentId: string]: string }>({});
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingAssessmentNames, setLoadingAssessmentNames] = useState(false);
  const [availableAssessmentNames, setAvailableAssessmentNames] = useState<string[]>([]);

  // Get unique values for dropdowns from masterDataClasses (same as other working pages)
  const gradeOptions = Array.from(new Set(masterDataClasses.map((c: any) => String(c.grade))));
  const sectionOptions = selectedGrade
    ? Array.from(new Set(masterDataClasses.filter((c: any) => String(c.grade) === selectedGrade).map((c: any) => String(c.section))))
    : [];
  
  // Get subjects for selected grade/section
  const availableSubjects = (selectedGrade && selectedSection)
    ? masterDataClasses
        .filter((c: any) => String(c.grade) === selectedGrade && String(c.section) === selectedSection)
        .flatMap((c: any) => c.subjects || [])
        .filter((subj: any, index: number, arr: any[]) => 
          arr.findIndex((s: any) => s.id === subj.id) === index
        )
    : [];

  // Fetch available assessment names for selected grade and section
  const fetchAssessmentNames = async () => {
    if (!selectedGrade || !selectedSection) {
      setAvailableAssessmentNames([]);
      return;
    }
    
    setLoadingAssessmentNames(true);
    try {
      const url = `${import.meta.env.VITE_API_URL}/api/MasterData/assessments?academicYear=${encodeURIComponent(academicYear)}&grade=${encodeURIComponent(selectedGrade)}&section=${encodeURIComponent(selectedSection)}`;
      
      const res = await fetch(url, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      
      if (res.ok) {
        const data = await res.json();
        
        // Extract unique assessment names
        const assessmentNames = Array.from(new Set(data.map((a: any) => a.name))).filter(Boolean);
        
        // If no assessments found, add default "No assessment" option
        if (assessmentNames.length === 0) {
          setAvailableAssessmentNames(['No assessment']);
        } else {
          setAvailableAssessmentNames(assessmentNames as string[]);
        }
      } else {
        setAvailableAssessmentNames(['No assessment']);
      }
    } catch (error) {
      setAvailableAssessmentNames(['No assessment']);
    } finally {
      setLoadingAssessmentNames(false);
    }
  };

  // Fetch assessment names when grade and section are selected
  useEffect(() => {
    fetchAssessmentNames();
  }, [selectedGrade, selectedSection, token]);

  // Fetch assessments when all parameters are selected
  const fetchAssessments = async () => {
    if (!selectedGrade || !selectedSection || !selectedSubject || !selectedAssessment) {
      setAssessments([]);
      return;
    }
    
    setLoading(true);
    try {
      const subjectObj = availableSubjects.find((s: any) => s.name === selectedSubject);
      const subjectName = subjectObj ? subjectObj.name : selectedSubject;
      
      const url = `${import.meta.env.VITE_API_URL}/api/MasterData/assessments?academicYear=${encodeURIComponent(academicYear)}&grade=${encodeURIComponent(selectedGrade)}&section=${encodeURIComponent(selectedSection)}&subjectName=${encodeURIComponent(subjectName)}&assessmentName=${encodeURIComponent(selectedAssessment)}`;
      
      const res = await fetch(url, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      
      if (res.ok) {
        const data = await res.json();
        setAssessments(data || []);
        
        // Set grading type and max marks from the first assessment
        if (data && data.length > 0) {
          setGradingType(data[0].gradingType || "");
          setMaxMarks(data[0].maxMarks || null);
        }
      } else {
        setAssessments([]);
      }
    } catch (error) {
      setAssessments([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch assessments when all required parameters are selected
  useEffect(() => {
    fetchAssessments();
  }, [selectedGrade, selectedSection, selectedSubject, selectedAssessment, token]);

  // Find the assessment object and max marks for selected subject
  const assessmentObj = assessments.length > 0 ? assessments[0] : null;
  const maxMarksAllowed = assessmentObj?.maxMarks ?? null;
  
  const allMarksFilled = students.length > 0 && students.every((stu: any) => {
    const val = marks[stu.eduNestId];
    return val !== undefined && val !== null && val.trim() !== '' && !isNaN(Number(val));
  });

  // Update grading type and max marks when assessment data changes
  useEffect(() => {
    if (assessmentObj) {
      setGradingType(assessmentObj.gradingType || "");
      setMaxMarks(assessmentObj.maxMarks ?? null);
    } else {
      setGradingType("");
      setMaxMarks(null);
    }
  }, [assessmentObj]);

  // Handler to fetch students after selection
  const handleSearchStudents = async () => {
    if (!selectedGrade || !selectedSection || !selectedAssessment || !selectedSubject) return;
    setSearching(true);
    try {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/students?grade=${encodeURIComponent(selectedGrade)}&section=${encodeURIComponent(selectedSection)}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      const data = await res.json();
      setStudents(data || []);
      setMarks({});
      setUploadResult(null);
    } catch (err) {
      setStudents([]);
    } finally {
      setSearching(false);
    }
  };

  // Handler for marks input
  const handleMarkChange = (studentId: string, value: string) => {
    setMarks(prev => ({ ...prev, [studentId]: value }));
  };

  // Upload marks handler
  const handleUploadMarks = async () => {
    if (!allMarksFilled) return;
    setUploading(true);
    setUploadResult(null);
    try {
      // Get the assessment ID from the fetched assessment data
      const assessmentId = assessmentObj?.id;
      
      if (!assessmentId) {
        setUploadResult('Error: Assessment ID not found. Please ensure an assessment is created for this subject.');
        return;
      }
      
      const payload = students.map((stu: any) => ({
        eduNestId: stu.eduNestId,
        assessmentId: assessmentId,
        assessmentName: selectedAssessment,
        subjectName: selectedSubject,
        marksObtained: Number(marks[stu.eduNestId]),
        maxMarks: maxMarksAllowed || 0,
        gradeAwarded: '',
        remarks: ''
      }));
      
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/StudentMarks/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(payload),
      });
      
      if (res.ok) {
        setUploadResult('Marks uploaded successfully!');
      } else {
        const err = await res.json();
        setUploadResult(`Failed to upload marks: ${err.title || err.message || 'Unknown error'}`);
      }
    } catch (err) {
      setUploadResult('Failed to upload marks.');
    } finally {
      setUploading(false);
    }
  };


  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 min-h-screen transition-colors">
      {/* Gradient Header - Mobile Optimized */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white mb-4 sm:mb-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="p-2 sm:p-3 bg-white/20 rounded-lg sm:rounded-xl backdrop-blur-sm">
            <svg className="h-6 w-6 sm:h-8 sm:w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" /></svg>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Upload Marks</h1>
            <p className="text-white/80 text-sm sm:text-base">Select assessment and subject to upload marks</p>
          </div>
        </div>
      </div>
      {/* Selection Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-700 dark:text-indigo-200 text-lg sm:text-xl">
            <svg className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-500 dark:text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" /></svg>
            Select Assessment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Select
              value={selectedGrade}
              onValueChange={val => {
                setSelectedGrade(val);
                setSelectedSection("");
                setSelectedAssessment("");
                setSelectedSubject("");
                setAvailableAssessmentNames([]);
                setStudents([]);
                setMarks({});
                setUploadResult(null);
              }}
              disabled={loading || !gradeOptions.length}
            >
              <SelectTrigger className="w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"><SelectValue placeholder="Grade" /></SelectTrigger>
              <SelectContent>
                {gradeOptions.map(grade => (
                  <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedSection}
              onValueChange={val => {
                setSelectedSection(val);
                setSelectedAssessment("");
                setSelectedSubject("");
                setStudents([]);
                setMarks({});
                setUploadResult(null);
              }}
              disabled={!selectedGrade || !sectionOptions.length}
            >
              <SelectTrigger className="w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"><SelectValue placeholder="Section" /></SelectTrigger>
              <SelectContent>
                {sectionOptions.map(section => (
                  <SelectItem key={section} value={section}>{section}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedAssessment}
              onValueChange={val => {
                setSelectedAssessment(val);
                setSelectedSubject("");
                setStudents([]);
                setMarks({});
                setUploadResult(null);
              }}
              disabled={!selectedSection || !availableAssessmentNames.length || loadingAssessmentNames}
            >
              <SelectTrigger className="w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <SelectValue placeholder={loadingAssessmentNames ? "Loading assessments..." : "Assessment"} />
              </SelectTrigger>
              <SelectContent>
                {availableAssessmentNames.map(assessmentName => (
                  <SelectItem key={assessmentName} value={assessmentName}>{assessmentName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedSubject}
              onValueChange={val => {
                setSelectedSubject(val);
                setStudents([]);
                setMarks({});
                setUploadResult(null);
              }}
              disabled={!selectedAssessment || !availableSubjects.length}
            >
              <SelectTrigger className="w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"><SelectValue placeholder="Subject" /></SelectTrigger>
              <SelectContent>
                {availableSubjects.map(subject => (
                  <SelectItem key={subject.id} value={subject.name}>{subject.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {typeof maxMarksAllowed === 'number' && selectedSubject && (
            <div className="mb-2 text-sm text-gray-600 dark:text-gray-300 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              Max Marks for <span className="font-semibold text-blue-700 dark:text-blue-300">{selectedSubject}</span>: <span className="font-semibold text-blue-700 dark:text-blue-300">{maxMarksAllowed}</span>
            </div>
          )}
          <div className="mt-4">
            <button
              className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold shadow-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSearchStudents}
              disabled={
                !selectedGrade ||
                !selectedSection ||
                !selectedAssessment ||
                !selectedSubject ||
                searching ||
                selectedAssessment === 'No assessment'
              }
            >
              {searching ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Loading Students...</span>
                </div>
              ) : selectedAssessment === 'No assessment' ? (
                'No Assessment Available'
              ) : (
                'Show Students'
              )}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Students Table with marks entry - Mobile Optimized */}
      {students.length > 0 && (
        <Card className="bg-white dark:bg-gray-900 shadow border border-gray-200 dark:border-gray-800 w-full">
          <CardHeader>
            <CardTitle className="text-indigo-700 dark:text-indigo-200 text-lg sm:text-xl">
              Enter Marks for {selectedSubject} ({selectedAssessment})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {typeof maxMarksAllowed === 'number' && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  Max Marks for <span className="font-semibold">{selectedSubject}</span>: <span className="font-semibold">{maxMarksAllowed}</span>
                </span>
              </div>
            )}
            
            {/* Mobile Card Layout */}
            <div className="block sm:hidden space-y-3">
              {students.map((stu: any) => (
                <div key={stu.eduNestId} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-500 uppercase">ID:</span>
                      <span className="font-medium">{stu.eduNestId}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-500 uppercase">Name:</span>
                      <span className="font-medium">{stu.firstName} {stu.lastName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-500 uppercase">Subject:</span>
                      <span>{selectedSubject}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-500 uppercase">Marks:</span>
                      <div className="flex flex-col items-end">
                        <input
                          type="number"
                          className={`w-20 px-2 py-1 border rounded bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-center ${
                            marks[stu.eduNestId] && (
                              isNaN(Number(marks[stu.eduNestId])) ||
                              Number(marks[stu.eduNestId]) > (typeof maxMarksAllowed === 'number' ? maxMarksAllowed : Infinity)
                            ) ? 'border-red-500' : ''
                          }`}
                          value={marks[stu.eduNestId] ?? ''}
                          onChange={e => {
                            const val = e.target.value;
                            if (val === '' || (!isNaN(Number(val)) && Number(val) <= (typeof maxMarksAllowed === 'number' ? maxMarksAllowed : Infinity))) {
                              handleMarkChange(stu.eduNestId, val);
                            } else if (Number(val) > (typeof maxMarksAllowed === 'number' ? maxMarksAllowed : Infinity)) {
                              handleMarkChange(stu.eduNestId, String(maxMarksAllowed));
                            }
                          }}
                          min="0"
                          step="0.01"
                          max={typeof maxMarksAllowed === 'number' ? maxMarksAllowed : undefined}
                        />
                        {marks[stu.eduNestId] && (
                          (isNaN(Number(marks[stu.eduNestId])) || Number(marks[stu.eduNestId]) > (typeof maxMarksAllowed === 'number' ? maxMarksAllowed : Infinity)) && (
                            <div className="text-xs text-red-600 mt-1">Enter ≤ {maxMarksAllowed}</div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EduNest ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marks</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                  {students.map((stu: any) => (
                    <tr key={stu.eduNestId} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-2 font-medium">{stu.eduNestId}</td>
                      <td className="px-4 py-2">{stu.firstName} {stu.lastName}</td>
                      <td className="px-4 py-2">{selectedSubject}</td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          className={`w-24 px-2 py-1 border rounded bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 ${
                            marks[stu.eduNestId] && (
                              isNaN(Number(marks[stu.eduNestId])) ||
                              Number(marks[stu.eduNestId]) > (typeof maxMarksAllowed === 'number' ? maxMarksAllowed : Infinity)
                            ) ? 'border-red-500' : ''
                          }`}
                          value={marks[stu.eduNestId] ?? ''}
                          onChange={e => {
                            const val = e.target.value;
                            // Only allow numbers and not greater than maxMarksAllowed
                            if (val === '' || (!isNaN(Number(val)) && Number(val) <= (typeof maxMarksAllowed === 'number' ? maxMarksAllowed : Infinity))) {
                              handleMarkChange(stu.eduNestId, val);
                            } else if (Number(val) > (typeof maxMarksAllowed === 'number' ? maxMarksAllowed : Infinity)) {
                              handleMarkChange(stu.eduNestId, String(maxMarksAllowed));
                            }
                          }}
                          min="0"
                          step="0.01"
                          max={typeof maxMarksAllowed === 'number' ? maxMarksAllowed : undefined}
                        />
                        {marks[stu.eduNestId] && (
                          (isNaN(Number(marks[stu.eduNestId])) || Number(marks[stu.eduNestId]) > (typeof maxMarksAllowed === 'number' ? maxMarksAllowed : Infinity)) && (
                            <div className="text-xs text-red-600 mt-1">Enter a valid number ≤ {maxMarksAllowed}</div>
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Upload button only if all marks filled and not "No assessment" */}
            {allMarksFilled && selectedAssessment !== 'No assessment' && (
              <button
                className="mt-6 w-full px-4 py-3 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold shadow-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleUploadMarks}
                disabled={uploading}
              >
                {uploading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Uploading...</span>
                  </div>
                ) : (
                  'Upload Marks'
                )}
              </button>
            )}
            
            {/* Show message when "No assessment" is selected */}
            {selectedAssessment === 'No assessment' && (
              <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-center space-x-2">
                  <svg className="h-5 w-5 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="text-yellow-800 dark:text-yellow-200 font-medium">
                    No assessments available for this grade and section combination.
                  </span>
                </div>
              </div>
            )}
            
            {uploadResult && (
              <div className={`mt-4 p-3 rounded-lg text-center font-semibold ${
                uploadResult.includes('success') 
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
              }`}>
                {uploadResult}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
