import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { useSession, useRoles } from "@/hooks/use-auth";
import { useUserProfile } from "@/hooks/use-user-account";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useSession();
  const { isAdmin, isIt } = useRoles(user?.id);
  const roleLabel = isAdmin ? "Administrator" : isIt ? "IT Team" : "Employee";
  const { profile, saveProfile } = useUserProfile(user, roleLabel);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFullName(profile.fullName);
    setPhone(profile.phone);
    setLocation(profile.location);
    setProfilePicture(profile.profilePicture);
  }, [profile]);

  const initials = (profile.fullName || profile.email || "?").slice(0, 2).toUpperCase();

  const handleImageChange = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file."); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("Image must be smaller than 2 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => setProfilePicture(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!fullName.trim()) { toast.error("Full name is required."); return; }
    setSaving(true);
    try {
      saveProfile({ fullName, phone, location, profilePicture });
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFullName(profile.fullName);
    setPhone(profile.phone);
    setLocation(profile.location);
    setProfilePicture(profile.profilePicture);
  };

  return (
    <div>
      <PageHeader title="My Profile" description="View and update your personal information." />
      <Card className="max-w-2xl">
        <CardContent className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                {profilePicture && <AvatarImage src={profilePicture} alt={fullName} />}
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              <Button type="button" size="icon" variant="secondary" className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full" onClick={() => fileRef.current?.click()} aria-label="Upload profile picture">
                <Camera className="h-4 w-4" />
              </Button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(e.target.files?.[0] ?? null)} />
            </div>
            <div>
              <p className="font-semibold text-lg">{profile.fullName}</p>
              <p className="text-sm text-muted-foreground">{profile.email || "—"}</p>
              <p className="text-sm text-muted-foreground">{profile.role}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name" required><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></Field>
            <Field label="Email Address"><Input value={profile.email || "—"} disabled readOnly /></Field>
            <Field label="Role"><Input value={profile.role} disabled readOnly /></Field>
            <Field label="Employee ID"><Input value={profile.employeeId || "—"} disabled readOnly /></Field>
            <Field label="Department"><Input value={profile.department || "—"} disabled readOnly /></Field>
            <Field label="Phone Number"><Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" /></Field>
            <Field label="Location" className="sm:col-span-2"><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Optional" /></Field>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={saving}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </div>
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
