import { useMemo, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { api } from "@/services/api";

type Student = { id: number; name: string; grade: string; status?: "Active" | "Alumni" | "On Leave" };

export default function Students() {
  const [q, setQ] = useState("");
  const [grade, setGrade] = useState("All");
  const [rows, setRows] = useState<Student[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Add this useEffect to fetch from backend
  useEffect(() => {
    api.get("/students")
      .then(response => {
        // Map backend data and add default status if missing
        const studentsWithStatus = response.data.map((student: any) => ({
          ...student,
          status: student.status || "Active"
        }));
        setRows(studentsWithStatus);
        setLoading(false);
      })
      .catch(error => {
        console.error("Failed to fetch students:", error);
        setLoading(false);
      });
  }, []);

  // Add the missing filtered variable
  const filtered = useMemo(
    () => rows.filter(r => 
      (grade === "All" || r.grade === grade) && 
      r.name.toLowerCase().includes(q.toLowerCase())
    ),
    [rows, q, grade]
  );

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Students</h1>
        <p className="text-sm text-neutral-500">Loading students...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Students</h1>
          <p className="text-sm text-neutral-500">Manage enrollment, grades and more.</p>
        </div>
        <div className="flex items-center gap-2">
          <Input placeholder="Search…" value={q} onChange={e=>setQ(e.target.value)} className="w-56" />
          <Select value={grade} onValueChange={setGrade}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Grade" /></SelectTrigger>
            <SelectContent>
              {["All","Grade 6","Grade 7","Grade 8"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button>Add Student</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add a new student</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Full name" id="name" />
                <Select defaultValue="Grade 6" onValueChange={()=>{}}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Grade 6","Grade 7","Grade 8"].map(g=> <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <DialogFooter><Button onClick={()=>setOpen(false)}>Save</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(s=>(
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs text-neutral-500">#{s.id}</TableCell>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{s.grade}</TableCell>
                  <TableCell><Badge variant="secondary">{s.status}</Badge></TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center py-10 text-neutral-500">No students found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}