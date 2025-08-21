import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Active Students</CardTitle></CardHeader><CardContent><div className="text-3xl font-semibold">412</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Staff</CardTitle></CardHeader><CardContent><div className="text-3xl font-semibold">58</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Avg. Attendance</CardTitle></CardHeader><CardContent><div className="text-3xl font-semibold">96%</div></CardContent></Card>
      </div>
    </div>
  );
}
