import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { PasswordInput } from "@/components/password-input";
import { requestPasswordReset, resetPassword } from "@/lib/api/auth";
import { toast } from "sonner";

type ForgotPasswordStep = "email" | "otp" | "password";

export function ForgotPasswordDialog({
  open,
  onOpenChange,
  initialEmail = "",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialEmail?: string;
}) {
  const [step, setStep] = useState<ForgotPasswordStep>("email");
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setStep("email");
      setEmail(initialEmail);
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }, [open, initialEmail]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error, devToken } = await requestPasswordReset(email.trim());
    setLoading(false);
    if (error) {
      toast.error(error);
      return;
    }
    if (devToken) {
      toast.message(`Dev reset code: ${devToken}`, { duration: 10000 });
    }
    toast.success("Verification code sent to your email.");
    setStep("otp");
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Please enter the 6-digit verification code.");
      return;
    }
    toast.success("Email verified. Set your new password.");
    setStep("password");
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error } = await resetPassword(email.trim(), otp, newPassword);
    setLoading(false);
    if (error) {
      toast.error(error);
      return;
    }

    toast.success("Password updated. Please sign in with your new password.");
    onOpenChange(false);
  };

  const handleResendOtp = async () => {
    setLoading(true);
    const { error, devToken } = await requestPasswordReset(email.trim());
    setLoading(false);
    if (error) {
      toast.error(error);
      return;
    }
    if (devToken) {
      toast.message(`Dev reset code: ${devToken}`, { duration: 10000 });
    }
    toast.success("A new verification code has been sent.");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        {step === "email" && (
          <>
            <DialogHeader>
              <DialogTitle>Forgot Password</DialogTitle>
              <DialogDescription>
                Enter your registered email address and we&apos;ll send a verification code.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Email</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Sending…" : "Send Code"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}

        {step === "otp" && (
          <>
            <DialogHeader>
              <DialogTitle>Verify Email</DialogTitle>
              <DialogDescription>
                Enter the 6-digit code sent to <span className="font-medium text-foreground">{email}</span>.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-otp">Verification Code</Label>
                <InputOTP id="forgot-otp" maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setStep("email")}
                  disabled={loading}
                >
                  Change email
                </button>
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={handleResendOtp}
                  disabled={loading}
                >
                  Resend code
                </button>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || otp.length !== 6}>
                  {loading ? "Verifying…" : "Verify Code"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}

        {step === "password" && (
          <>
            <DialogHeader>
              <DialogTitle>Set New Password</DialogTitle>
              <DialogDescription>
                Create a new password for your account.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-new-password">New Password</Label>
                <PasswordInput
                  id="forgot-new-password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="forgot-confirm-password">Confirm Password</Label>
                <PasswordInput
                  id="forgot-confirm-password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Updating…" : "Reset Password"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
