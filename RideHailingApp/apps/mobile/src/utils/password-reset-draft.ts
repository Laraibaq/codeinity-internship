// Carries state across the 3-screen password-reset flow (forgot-password.tsx -> reset-password-
// verify.tsx -> reset-password.tsx), same plain-module-level-object pattern as registration-draft.ts
// for the same reason: a few in-memory values for a flow with no persistence needs, not state that
// needs to be reactive or survive an app reload.
export const passwordResetDraft = {
  // The normalized phone or trimmed email the code was requested for -- verify-phone's OTP call
  // and confirm's password update both need to key off the exact same string.
  identifier: "",
  // Set by reset-password-verify.tsx once the code is confirmed; reset-password.tsx sends this
  // (not the identifier/code again) to actually change the password.
  resetToken: "",
};
