import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Settings() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-neutral-500">Tenant configuration & appearance</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Brand & Appearance</CardTitle>
          <CardDescription>Set the accent color used for highlights.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <input type="color" defaultValue="#2563eb" className="h-10 w-14 rounded" />
            <Input defaultValue="#2563eb" className="w-40" />
            <Button>Use this color</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
