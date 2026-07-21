import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useSession } from "@/hooks/use-auth";
import { useUserPreferences } from "@/hooks/use-user-account";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/account-settings")({
  component: AccountSettingsPage,
});

function AccountSettingsPage() {
  const { user } = useSession();
  const { preferences, savePreferences } = useUserPreferences(user?.id);
  const [draft, setDraft] = useState(preferences);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => { setDraft(preferences); }, [preferences]);

  const handleSavePreferences = () => {
    setSavingPrefs(true);
    try {
      savePreferences(draft);
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match."); return; }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated successfully");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div>
      <PageHeader title="Settings" description="Manage your account preferences and security." />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Customize how goAI Asset Management works for you.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <PreferenceRow label="Email Notifications" description="Receive updates about assignments and asset changes by email." checked={draft.emailNotifications} onCheckedChange={(c) => setDraft({ ...draft, emailNotifications: c })} />
            <PreferenceRow label="In-App Notifications" description="Show alerts in the notification center." checked={draft.inAppNotifications} onCheckedChange={(c) => setDraft({ ...draft, inAppNotifications: c })} />
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSavePreferences} disabled={savingPrefs}>{savingPrefs ? "Saving…" : "Save"}</Button>
              <Button type="button" variant="outline" onClick={() => setDraft(preferences)} disabled={savingPrefs}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your account password.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" required />
              </div>
              <Button type="submit" disabled={changingPassword}>{changingPassword ? "Updating…" : "Change Password"}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PreferenceRow({ label, description, checked, onCheckedChange, disabled }: { label: string; description: string; checked: boolean; onCheckedChange: (c: boolean) => void; disabled?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="font-medium text-sm">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  );
}
