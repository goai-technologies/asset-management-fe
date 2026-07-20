import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { MockDB } from "@/lib/mock-db";

export function EmployeeDialog({
  open, onOpenChange, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    employee_code: "",
    name: "",
    email: "",
    phone: "",
    department: "",
    designation: "",
    location: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        employee_code: "",
        name: "",
        email: "",
        phone: "",
        department: "",
        designation: "",
        location: "",
      });
    }
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    if (!form.employee_code.trim() || !form.name.trim() || !form.email.trim()) {
      toast.error("Please fill in required fields (Employee ID, Name, Email)");
      setSaving(false);
      return;
    }

    try {
      MockDB.addEmployee({
        employee_code: form.employee_code.trim(),
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        department: form.department.trim() || null,
        designation: form.designation.trim() || null,
        location: form.location.trim() || null,
      });
      toast.success("Employee added successfully");
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
        <DialogHeader><DialogTitle>Add Employee</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <Field label="Employee ID" required>
            <Input
              placeholder="e.g. EMP-1003"
              value={form.employee_code}
              required
              onChange={(e) => setForm({ ...form, employee_code: e.target.value })}
            />
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
          <Field label="Location" className="sm:col-span-2">
            <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </Field>

          <DialogFooter className="sm:col-span-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Add Employee"}</Button>
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
