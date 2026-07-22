import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { MockDB, type Category } from "@/lib/mock-db";
import { CATEGORY_ICON_OPTIONS } from "@/lib/category-icons";

export function CategoryDialog({
  open, onOpenChange, onSaved, editing = null,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
  editing?: Category | null;
}) {
  const [form, setForm] = useState({
    category_name: "",
    description: "",
    status: "active" as "active" | "inactive",
    icon: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setError("");
      if (editing) {
        setForm({
          category_name: editing.category_name,
          description: editing.description ?? "",
          status: editing.status ?? "active",
          icon: editing.icon ?? "",
        });
      } else {
        setForm({
          category_name: "",
          description: "",
          status: "active",
          icon: "",
        });
      }
    }
  }, [open, editing]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    if (!form.category_name.trim()) {
      setError("Category name is required");
      setSaving(false);
      return;
    }

    try {
      const payload = {
        category_name: form.category_name.trim(),
        description: form.description.trim() || null,
        status: form.status,
        icon: form.icon || null,
      };

      if (editing) {
        MockDB.updateCategory(editing.id, payload);
        toast.success("Category updated successfully");
      } else {
        MockDB.addCategory(payload);
        toast.success("Category added successfully");
      }
      onSaved();
      onOpenChange(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Category" : "Add Category"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid grid-cols-1 gap-4 pt-2">
          <Field label="Category Name" required error={error}>
            <Input
              value={form.category_name}
              required
              onChange={(e) => {
                setForm({ ...form, category_name: e.target.value });
                if (error) setError("");
              }}
            />
          </Field>
          <Field label="Description">
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <Field label="Status">
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as "active" | "inactive" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Category Icon">
            <Select value={form.icon || "none"} onValueChange={(v) => setForm({ ...form, icon: v === "none" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="Select an icon (optional)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No icon</SelectItem>
                {CATEGORY_ICON_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className="inline-flex items-center gap-2">
                      <option.Icon className="h-4 w-4" />
                      {option.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : editing ? "Save Changes" : "Add Category"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}{required && <span className="text-destructive"> *</span>}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
