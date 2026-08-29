// Carries a few fields entered on register.tsx forward to later screens in the registration flow
// (currently just the phone number, read by verify-phone.tsx, which register.tsx now navigates to
// directly). A plain module-level object is enough for this: it's a single in-memory string for a UI
// shell with no backend yet (rule 5), not state that needs to be reactive, persisted, or shared
// across unrelated screens -- a full state library would be overkill for one field. It resets on app
// reload, which is fine for a flow that starts fresh from register.tsx each time anyway.
export const registrationDraft = {
  phone: "",
};
