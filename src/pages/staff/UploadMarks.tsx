import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function UploadMarks() {
  const { token } = useAuth();
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

  // Fetch assessments when academic year changes
  useEffect(() => {
    if (!academicYear) return;
    setLoading(true);
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    fetch(`http://localhost:5199/api/MasterData/assessments?academicYear=${academicYear}`, { headers })
      .then(res => res.json())
      .then(data => setAssessments(data || []))
      .finally(() => setLoading(false));
  }, [academicYear]);

  // Get unique values for dropdowns
  const gradeOptions = Array.from(new Set(assessments.map((a: any) => a.grade)));
  const sectionOptions = selectedGrade
    ? Array.from(new Set(assessments.filter((a: any) => a.grade === selectedGrade).map((a: any) => a.section)))
    : [];
  // Only distinct assessment names for dropdown
  const assessmentOptions = (selectedGrade && selectedSection)
    ? Array.from(
        assessments
          .filter((a: any) => a.grade === selectedGrade && a.section === selectedSection)
          .reduce((map: any, a: any) => {
            if (!map.has(a.name)) map.set(a.name, a);
            return map;
          }, new Map())
          .values()
      )
    : [];
  const subjectOptions = (selectedGrade && selectedSection && selectedAssessment)
    ? assessments.filter((a: any) => a.grade === selectedGrade && a.section === selectedSection && a.name === selectedAssessment)
    : [];

  // Find the assessment object and max marks for selected subject
  const assessmentObj = assessments.find((a: any) =>
    a.grade === selectedGrade &&
    a.section === selectedSection &&
    a.name === selectedAssessment &&
    a.subjectName === selectedSubject
  );
  const maxMarksAllowed = assessmentObj?.maxMarks ?? null;
  const allMarksFilled = students.length > 0 && students.every((stu: any) => {
    const val = marks[stu.eduNestId];
    return val !== undefined && val !== null && val.trim() !== '' && !isNaN(Number(val));
  });

  // Update grading type and max marks when subject is selected
  useEffect(() => {
    if (selectedGrade && selectedSection && selectedAssessment && selectedSubject) {
      setGradingType(assessmentObj?.gradingType || "");
      setMaxMarks(assessmentObj?.maxMarks ?? null);
    } else {
      setGradingType("");
      setMaxMarks(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGrade, selectedSection, selectedAssessment, selectedSubject, assessments]);

  // Handler to fetch students after selection
  const handleSearchStudents = async () => {
    if (!selectedGrade || !selectedSection || !selectedAssessment || !selectedSubject) return;
    setSearching(true);
    try {
      const res = await fetch(`http://localhost:5199/students?grade=${encodeURIComponent(selectedGrade)}&section=${encodeURIComponent(selectedSection)}`, {
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
      const assessmentId = assessmentObj?.id || "";
      const payload = students.map((stu: any) => ({
        id: '', // Let backend generate or fill if needed
        eduNestId: stu.eduNestId,
        assessmentId,
        marksObtained: Number(marks[stu.eduNestId]),
        gradeAwarded: '',
        remarks: ''
      }));
      const res = await fetch('http://localhost:5199/api/StudentMarks/bulk', {
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
        setUploadResult(err.message || 'Failed to upload marks.');
      }
    } catch (err) {
      setUploadResult('Failed to upload marks.');
    } finally {
      setUploading(false);
    }
  };


  return (
    <div className="p-6 space-y-6 min-h-screen transition-colors">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" /></svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold">Upload Marks</h1>
            <p className="text-white/80">Select assessment and subject to upload marks</p>
          </div>
        </div>
      </div>
      {/* Selection Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-700 dark:text-indigo-200">
            <svg className="h-5 w-5 text-indigo-500 dark:text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" /></svg>
            Select Assessment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              value={selectedGrade}
              onValueChange={val => {
                setSelectedGrade(val);
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
                setStudents([]);
                setMarks({});
                setUploadResult(null);
              }}
              disabled={!selectedSection || !assessmentOptions.length}
            >
              <SelectTrigger className="w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"><SelectValue placeholder="Assessment" /></SelectTrigger>
              <SelectContent>
                {assessmentOptions.map(assess => {
                  const a = assess as any;
                  return <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>;
                })}
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
              disabled={!selectedAssessment || !subjectOptions.length}
            >
              <SelectTrigger className="w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"><SelectValue placeholder="Subject" /></SelectTrigger>
              <SelectContent>
                {subjectOptions.map(subject => (
                  <SelectItem key={subject.id} value={subject.subjectName}>{subject.subjectName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {typeof maxMarksAllowed === 'number' && selectedSubject && (
            <div className="mb-2 text-sm text-gray-600 dark:text-gray-300">
              Max Marks for <span className="font-semibold">{selectedSubject}</span>: <span className="font-semibold">{maxMarksAllowed}</span>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-4">
            <button
              className="w-full px-4 py-2 rounded bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold shadow hover:from-indigo-600 hover:to-purple-700 transition"
              onClick={handleSearchStudents}
              disabled={
                !selectedGrade ||
                !selectedSection ||
                !selectedAssessment ||
                !selectedSubject ||
                searching
              }
            >
              {searching ? 'Loading...' : 'Show Students'}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Students Table with marks entry */}
      {students.length > 0 && (
        <Card className="bg-white dark:bg-gray-900 shadow border border-gray-200 dark:border-gray-800 max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-indigo-700 dark:text-indigo-200">Enter Marks for {selectedSubject} ({selectedAssessment})</CardTitle>
          </CardHeader>
          <CardContent>
            {typeof maxMarksAllowed === 'number' && (
              <div className="mb-4 text-sm text-gray-600 dark:text-gray-300">Max Marks for <span className="font-semibold">{selectedSubject}</span>: <span className="font-semibold">{maxMarksAllowed}</span></div>
            )}
            <div className="overflow-x-auto">
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
            {/* Upload button only if all marks filled */}
            {allMarksFilled && (
              <button
                className="mt-6 w-full px-4 py-2 rounded bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold shadow hover:from-indigo-600 hover:to-purple-700 transition"
                onClick={handleUploadMarks}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Upload Marks'}
              </button>
            )}
            {uploadResult && (
              <div className={`mt-4 text-center font-semibold ${uploadResult.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{uploadResult}</div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
