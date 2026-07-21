import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { MockDB, type Employee } from "@/lib/mock-db";

export function EmployeeDialog({
  open, onOpenChange, onSaved, editing = null,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
  editing?: Employee | null;
}) {
  const [form, setForm] = useState({
    employee_code: "",
    name: "",
    email: "",
    phone: "",
    department: "",
    designation: "",
    location: "",
    status: "active" as "active" | "inactive",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (editing) {
        setForm({
          employee_code: editing.employee_code,
          name: editing.name,
          email: editing.email,
          phone: editing.phone ?? "",
          department: editing.department ?? "",
          designation: editing.designation ?? "",
          location: editing.location ?? "",
          status: editing.status ?? "active",
        });
      } else {
        setForm({
          employee_code: "",
          name: "",
          email: "",
          phone: "",
          department: "",
          designation: "",
          location: "",
          status: "active",
        });
      }
    }
  }, [open, editing]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    if (!form.employee_code.trim() || !form.name.trim() || !form.email.trim()) {
      toast.error("Please fill in required fields (Employee ID, Name, Email)");
      setSaving(false);
      return;
    }

    try {
      const payload = {
        employee_code: form.employee_code.trim(),
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        department: form.department.trim() || null,
        designation: form.designation.trim() || null,
        location: form.location.trim() || null,
        status: form.status,
      };

      if (editing) {
        MockDB.updateEmployee(editing.id, payload);
        toast.success("Employee updated successfully");
      } else {
        MockDB.addEmployee(payload);
        toast.success("Employee added successfully");
      }
      onSaved();
      onOpenChange(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An error occurred";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader><DialogTitle>{editing ? "Edit Employee" : "Add Employee"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <Field label="Employee ID" required>
            <Input placeholder="e.g. EMP-1003" value={form.employee_code} required onChange={(e) => setForm({ ...form, employee_code: e.target.value })} />
          </Field>
          <Field label="Employee Name" required>
            <Input value={form.name} required onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Email" required>
            <Input type="email" value={form.email} required onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Phone">
            <Input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="Department">
            <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          </Field>
          <Field label="Designation">
            <Input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
          </Field>
          <Field label="Location">
            <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </Field>
          {editing && (
            <Field label="Status">
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as "active" | "inactive" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          )}
          <DialogFooter className="sm:col-span-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : editing ? "Save Changes" : "Add Employee"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, required, className, children }: { label: string; required?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label>{label}{required && <span className="text-destructive"> *</span>}</Label>
      {children}
    </div>
  );
}
