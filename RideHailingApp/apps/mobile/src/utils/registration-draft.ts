// Carries a few fields entered earlier in the registration flow forward to later screens (the
// phone number, read by verify-phone.tsx; the vehicle type, read by register-vehicle-photos.tsx so
// it can ask for the right set of photos). A plain module-level object is enough for this: it's a
// few in-memory values for a UI shell with no backend yet (rule 5), not state that needs to be
// reactive, persisted, or shared across unrelated screens -- a full state library would be
// overkill. It resets on app reload, which is fine for a flow that starts fresh from register.tsx
// each time anyway.
export type DraftVehicleType = "car" | "bike" | "rickshaw";

export const registrationDraft = {
  phone: "",
  vehicleType: "car" as DraftVehicleType,
};
