import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";

interface Homework {
  id: string;
  grade: string;
  section: string;
  subjectId: string;
  subjectName: string;
  assignedDate: string;
  dueDate: string;
  details: string;
}

export default function AssignHomework() {
  const { masterDataClasses, masterDataSubjects, token, userGuid } = useAuth();
  const [grade, setGrade] = useState("");
  const [section, setSection] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [assignedDate, setAssignedDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDetails, setEditDetails] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Get unique grades and sections from classes
  const grades = Array.from(new Set(masterDataClasses.map(cls => cls.grade)));
  const sections = grade ? Array.from(new Set(masterDataClasses.filter(cls => cls.grade === grade).map(cls => cls.section))) : [];
  const subjects = grade && section
    ? masterDataClasses.find(cls => cls.grade === grade && cls.section === section)?.subjects || []
    : [];

  // Fetch previous homework for selected grade/section/subject
  useEffect(() => {
    if (!grade || !section || !subjectId) {
      setHomeworks([]);
      return;
    }
    setLoading(true);
  fetch(`${import.meta.env.VITE_API_URL}/api/Homework?grade=${encodeURIComponent(grade)}&section=${encodeURIComponent(section)}&subjectId=${encodeURIComponent(subjectId)}`,
      {
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined
      }
    )
      .then(res => res.ok ? res.json() : [])
      .then(data => setHomeworks(data || []))
      .catch(() => setHomeworks([]))
      .finally(() => setLoading(false));
  }, [grade, section, subjectId, token]);

  const handleAssignHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grade || !section || !subjectId || !assignedDate || !dueDate || !description) return;
    setAdding(true);
    try {
      // Compose the required body
      const now = new Date().toISOString();
      // Find the correct class_subject_id for the selected subject in the selected class/section
      let classSubjectId = "";
      const selectedClass = masterDataClasses.find(cls => cls.grade === grade && cls.section === section);
      if (selectedClass && selectedClass.classSubjects) {
        const subj = selectedClass.classSubjects.find((cs: any) => cs.subjectId === subjectId);
        if (subj) classSubjectId = subj.class_subject_id || subj.classSubjectId || subj.id || "";
      }
      if (!classSubjectId) {
        alert("Could not determine class_subject_id for the selected subject.");
        setAdding(false);
        return;
      }
      const homeworkBody = {
        id: crypto.randomUUID(),
        classSubjectId: classSubjectId,
        createdById: userGuid,
        assignedDate: new Date(assignedDate).toISOString(),
        dueDate: new Date(dueDate).toISOString(),
        details: description,
        createdAt: now,
        updatedAt: now
      };
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/Homework`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(homeworkBody)
      });
      if (res.ok) {
        setDescription("");
        setAssignedDate("");
        setDueDate("");
        // Refresh homework list
  const getRes = await fetch(`${import.meta.env.VITE_API_URL}/api/Homework?grade=${encodeURIComponent(grade)}&section=${encodeURIComponent(section)}&subjectId=${encodeURIComponent(subjectId)}`,
          { headers: token ? { 'Authorization': `Bearer ${token}` } : undefined }
        );
        if (getRes.ok) {
          const data = await getRes.json();
          setHomeworks(data || []);
        }
      } else {
        alert("Failed to assign homework. Please try again.");
      }
    } catch (err) {
      alert("Error assigning homework. Please try again.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <Calendar className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Assign Homework</h1>
            <p className="text-white/80">Assign and view homework for your classes</p>
          </div>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Assign New Homework</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleAssignHomework}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Grade</Label>
                <select className="w-full border rounded px-2 py-1" value={grade} onChange={e => { setGrade(e.target.value); setSection(""); setSubjectId(""); }} required>
                  <option value="">Select grade</option>
                  {grades.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <Label>Section</Label>
                <select className="w-full border rounded px-2 py-1" value={section} onChange={e => { setSection(e.target.value); setSubjectId(""); }} required disabled={!grade}>
                  <option value="">Select section</option>
                  {sections.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <Label>Subject</Label>
                <select className="w-full border rounded px-2 py-1" value={subjectId} onChange={e => setSubjectId(e.target.value)} required disabled={!grade || !section}>
                  <option value="">Select subject</option>
                  {subjects.map((subj: any) => <option key={subj.id} value={subj.id}>{subj.name}</option>)}
                </select>
              </div>
              <div>
                <Label>Assigned Date</Label>
                <Input type="date" value={assignedDate} onChange={e => setAssignedDate(e.target.value)} required />
              </div>
              <div>
                <Label>Due Date</Label>
                <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
              </div>
            </div>
            <div>
              <Label>Homework Description</Label>
              <textarea
                className="w-full border rounded px-2 py-1 min-h-[80px]"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Enter homework details..."
                required
              />
            </div>
            <Button type="submit" className="bg-gradient-to-r from-indigo-500 to-purple-600" disabled={adding}>
              {adding ? "Assigning..." : "Assign Homework"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Previous Homework</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading homework...</div>
          ) : homeworks.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assigned Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {homeworks.map(hw => (
                  <TableRow key={hw.id}>
                    <TableCell>{new Date(hw.assignedDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {editingId === hw.id ? (
                        <input
                          type="date"
                          className="border rounded px-2 py-1"
                          value={editDueDate}
                          onChange={e => setEditDueDate(e.target.value)}
                        />
                      ) : (
                        new Date(hw.dueDate).toLocaleDateString()
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === hw.id ? (
                        <input
                          type="text"
                          className="border rounded px-2 py-1 w-full"
                          value={editDetails}
                          onChange={e => setEditDetails(e.target.value)}
                        />
                      ) : (
                        hw.details
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === hw.id ? (
                        <>
                          <Button size="sm" className="mr-2" disabled={savingEdit}
                            onClick={async () => {
                              setSavingEdit(true);
                              try {
                                const updated = {
                                  ...hw,
                                  details: editDetails,
                                  dueDate: new Date(editDueDate).toISOString()
                                };
                                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/Homework/${hw.id}`, {
                                  method: "PUT",
                                  headers: {
                                    "Content-Type": "application/json",
                                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                                  },
                                  body: JSON.stringify(updated)
                                });
                                if (res.ok) {
                                  setHomeworks(hws => hws.map(h => h.id === hw.id ? { ...h, details: editDetails, dueDate: editDueDate } : h));
                                  setEditingId(null);
                                } else {
                                  alert("Failed to update homework.");
                                }
                              } catch {
                                alert("Error updating homework.");
                              } finally {
                                setSavingEdit(false);
                              }
                            }}>
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" className="mr-2" variant="outline"
                            onClick={() => {
                              setEditingId(hw.id);
                              setEditDetails(hw.details);
                              setEditDueDate(hw.dueDate ? hw.dueDate.slice(0, 10) : "");
                            }}>
                            Edit
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => {/* TODO: implement delete */}}>
                            Delete
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">No homework found for this selection.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
