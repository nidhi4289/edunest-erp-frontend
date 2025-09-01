import { useMemo, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { api } from "@/services/api";
import { useBrand } from "@/theme/BrandProvider";
import { Users, UserPlus, Search, Filter } from "lucide-react";

type Student = { id: number; name: string; grade: string; status?: "Active" | "Alumni" | "On Leave" };

export default function Students() {
  const [q, setQ] = useState("");
  const [grade, setGrade] = useState("All");
  const [rows, setRows] = useState<Student[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { brand, success, warning, error } = useBrand();

  useEffect(() => {
    api.get("/students")
      .then(response => {
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

  const filtered = useMemo(
    () => rows.filter(r => 
      (grade === "All" || r.grade === grade) && 
      r.name.toLowerCase().includes(q.toLowerCase())
    ),
    [rows, q, grade]
  );

  const getStatusColor = (status: string) => {
    switch(status) {
      case "Active": return success;
      case "On Leave": return warning;
      case "Alumni": return brand;
      default: return "#6b7280";
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Students</h1>
            <p className="text-sm text-neutral-500">Loading students...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with colorful gradient */}
      <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Users className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Students</h1>
              <p className="text-white/80">Manage enrollment, grades and more</p>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span className="bg-white/20 px-3 py-1 rounded-full">
                  {rows.length} Total Students
                </span>
                <span className="bg-white/20 px-3 py-1 rounded-full">
                  {filtered.length} Showing
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and filters with colorful accents */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search students..." 
            value={q} 
            onChange={e=>setQ(e.target.value)} 
            className="pl-10 border-2 focus:border-purple-500 transition-colors"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select value={grade} onValueChange={setGrade}>
            <SelectTrigger className="w-40 border-2 focus:border-blue-500">
              <SelectValue placeholder="Grade" />
            </SelectTrigger>
            <SelectContent>
              {["All","Grade 6","Grade 7","Grade 8"].map(g => 
                <SelectItem key={g} value={g}>{g}</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white border-0">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-xl" style={{ color: brand }}>
                Add New Student
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Full name" className="border-2 focus:border-purple-500" />
              <Select defaultValue="Grade 6">
                <SelectTrigger className="border-2 focus:border-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Grade 6","Grade 7","Grade 8"].map(g=> 
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button 
                onClick={()=>setOpen(false)}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                Save Student
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Colorful student cards */}
      <div className="grid gap-4">
        {filtered.map((student, index) => (
          <Card key={student.id} className="border-l-4 hover:shadow-lg transition-all duration-200" 
                style={{ borderLeftColor: getStatusColor(student.status || "Active") }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
                    style={{ 
                      background: `linear-gradient(135deg, ${getStatusColor(student.status || "Active")}, ${brand})` 
                    }}
                  >
                    {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{student.name}</h3>
                    <p className="text-gray-600">{student.grade}</p>
                  </div>
                </div>
                <Badge 
                  variant="secondary" 
                  className="text-white border-0"
                  style={{ backgroundColor: getStatusColor(student.status || "Active") }}
                >
                  {student.status || "Active"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4">
            <Users className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No students found</h3>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}