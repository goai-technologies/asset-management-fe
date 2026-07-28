import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useCreateEmployeeMutation, useUpdateEmployeeMutation } from "@/hooks/use-asset-management";
import type { Employee } from "@/lib/types/asset-management";

type EmployeeFormState = {
  employee_code: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  location: string;
  status: "active" | "inactive";
};

type EmployeeFormErrors = Partial<Record<keyof EmployeeFormState, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getPhoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

function validateEmployeeForm(form: EmployeeFormState, isEditing: boolean): EmployeeFormErrors {
  const errors: EmployeeFormErrors = {};

  if (!form.employee_code.trim()) errors.employee_code = "Employee ID is required";
  if (!form.name.trim()) errors.name = "Employee name is required";

  if (!form.email.trim()) {
    errors.email = "Email is required";
  } else if (!EMAIL_PATTERN.test(form.email.trim())) {
    errors.email = "Enter a valid email address";
  }

  if (!isEditing) {
    if (!form.phone.trim()) {
      errors.phone = "Phone number is required";
    } else {
      const digits = getPhoneDigits(form.phone);
      if (digits.length < 7 || digits.length > 15) {
        errors.phone = "Phone number must contain 7 to 15 digits";
      }
    }

    if (!form.department.trim()) errors.department = "Department is required";
    if (!form.designation.trim()) errors.designation = "Designation is required";
    if (!form.location.trim()) errors.location = "Location is required";
  }

  return errors;
}

export function EmployeeDialog({
  open, onOpenChange, onSaved, editing = null,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
  editing?: Employee | null;
}) {
  const [form, setForm] = useState<EmployeeFormState>({
    employee_code: "",
    name: "",
    email: "",
    phone: "",
    department: "",
    designation: "",
    location: "",
    status: "active",
  });
  const [errors, setErrors] = useState<EmployeeFormErrors>({});
  const [saving, setSaving] = useState(false);
  const createMutation = useCreateEmployeeMutation();
  const updateMutation = useUpdateEmployeeMutation();

  const updateForm = <K extends keyof EmployeeFormState>(key: K, value: EmployeeFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  useEffect(() => {
    if (open) {
      setErrors({});
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

    const validationErrors = validateEmployeeForm(form, !!editing);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error(editing
        ? "Please fill in required fields (Employee ID, Name, Email)"
        : "Please complete all required fields before adding the employee.");
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
        await updateMutation.mutateAsync({ id: editing.id, updates: payload });
        toast.success("Employee updated successfully");
      } else {
        await createMutation.mutateAsync(payload);
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
          <Field label="Employee ID" required error={errors.employee_code}>
            <Input placeholder="e.g. EMP-1003" value={form.employee_code} required onChange={(e) => updateForm("employee_code", e.target.value)} />
          </Field>
          <Field label="Employee Name" required error={errors.name}>
            <Input value={form.name} required onChange={(e) => updateForm("name", e.target.value)} />
          </Field>
          <Field label="Email" required error={errors.email}>
            <Input type="email" value={form.email} required onChange={(e) => updateForm("email", e.target.value)} />
          </Field>
          <Field label="Phone" required={!editing} error={errors.phone}>
            <Input type="tel" value={form.phone} required={!editing} onChange={(e) => updateForm("phone", e.target.value)} />
          </Field>
          <Field label="Department" required={!editing} error={errors.department}>
            <Input value={form.department} required={!editing} onChange={(e) => updateForm("department", e.target.value)} />
          </Field>
          <Field label="Designation" required={!editing} error={errors.designation}>
            <Input value={form.designation} required={!editing} onChange={(e) => updateForm("designation", e.target.value)} />
          </Field>
          <Field label="Location" required={!editing} error={errors.location}>
            <Input value={form.location} required={!editing} onChange={(e) => updateForm("location", e.target.value)} />
          </Field>
          {editing && (
            <Field label="Status">
              <Select value={form.status} onValueChange={(v) => updateForm("status", v as "active" | "inactive")}>
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

function Field({ label, required, error, className, children }: { label: string; required?: boolean; error?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label>{label}{required && <span className="text-destructive"> *</span>}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
