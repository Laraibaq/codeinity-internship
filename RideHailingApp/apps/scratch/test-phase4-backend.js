const fs = require("fs");
const path = require("path");

const API_BASE = "http://localhost:3000";

function getLatestOtp(purpose, identifier) {
  const logPath = "C:\\Users\\LAPTECH\\.gemini\\antigravity-ide\\brain\\37084e2e-8141-4425-acd2-6acf01ad7f06\\.system_generated\\tasks\\task-787.log";
  if (!fs.existsSync(logPath)) return null;
  const content = fs.readFileSync(logPath, "utf-8");
  const regex = new RegExp(`\\[otp:${purpose}\\] code for ${identifier.replace("+", "\\+")}: (\\d{6})`, "g");
  const matches = [...content.matchAll(regex)];
  if (matches.length > 0) {
    return matches[matches.length - 1][1];
  }
  return null;
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const res = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, ok: res.ok, data };
}

async function runBackendTests() {
  console.log("==================================================");
  console.log("TESTING PHASE 4 BACKEND ENDPOINTS & OWNERSHIP");
  console.log("==================================================");

  // 1. Create a fresh test passenger
  const ts = Date.now().toString().slice(-6);
  const phone = `+141556${ts}`;
  const email = `passenger_p4_${ts}@example.com`;
  const password = "Password123!";

  console.log(`[1] Registering passenger ${phone}...`);
  const regRes = await request("/auth/register/passenger", {
    method: "POST",
    body: { name: "Phase4 Passenger", phone, email, password },
  });
  console.log("Register status:", regRes.status);
  const passengerId = regRes.data.id;
  console.log("Passenger ID from registration:", passengerId);

  console.log(`[1b] Logging in as passenger ${phone}...`);
  const loginRes = await request("/auth/login", {
    method: "POST",
    body: { identifier: phone, password },
  });
  console.log("Login status:", loginRes.status);
  const passengerToken = loginRes.data.accessToken;

  // 2. Unauthenticated ride creation check
  console.log("\n[2] Testing unauthenticated POST /rides...");
  const unauthRes = await request("/rides", {
    method: "POST",
    body: {
      pickupLat: 31.5204,
      pickupLng: 74.3587,
      pickupAddress: "Mall of Lahore",
      dropoffLat: 31.5216,
      dropoffLng: 74.4036,
      dropoffAddress: "Allama Iqbal Airport",
      distanceKm: 6.54,
      etaMinutes: 16,
      proposedFare: 17.50,
    },
  });
  console.log("Unauthenticated status (expected 401):", unauthRes.status);

  // 3. Validation failures
  console.log("\n[3] Testing invalid bodies on POST /rides...");
  // Negative fare
  const negFareRes = await request("/rides", {
    method: "POST",
    headers: { Authorization: `Bearer ${passengerToken}` },
    body: {
      pickupLat: 31.5204,
      pickupLng: 74.3587,
      pickupAddress: "Mall of Lahore",
      dropoffLat: 31.5216,
      dropoffLng: 74.4036,
      dropoffAddress: "Allama Iqbal Airport",
      distanceKm: 6.54,
      etaMinutes: 16,
      proposedFare: -10,
    },
  });
  console.log("Negative fare status (expected 400):", negFareRes.status, negFareRes.data?.message);

  // Missing pickup address
  const missingAddrRes = await request("/rides", {
    method: "POST",
    headers: { Authorization: `Bearer ${passengerToken}` },
    body: {
      pickupLat: 31.5204,
      pickupLng: 74.3587,
      dropoffLat: 31.5216,
      dropoffLng: 74.4036,
      dropoffAddress: "Allama Iqbal Airport",
      distanceKm: 6.54,
      etaMinutes: 16,
      proposedFare: 20,
    },
  });
  console.log("Missing pickup address status (expected 400):", missingAddrRes.status, missingAddrRes.data?.message);

  // Non-whitelisted property
  const nonWhitelistedRes = await request("/rides", {
    method: "POST",
    headers: { Authorization: `Bearer ${passengerToken}` },
    body: {
      pickupLat: 31.5204,
      pickupLng: 74.3587,
      pickupAddress: "Mall of Lahore",
      dropoffLat: 31.5216,
      dropoffLng: 74.4036,
      dropoffAddress: "Allama Iqbal Airport",
      distanceKm: 6.54,
      etaMinutes: 16,
      proposedFare: 20,
      unknownField: "test",
    },
  });
  console.log("Non-whitelisted property status (expected 400):", nonWhitelistedRes.status, nonWhitelistedRes.data?.message);

  // 4. Valid Ride Creation
  console.log("\n[4] Creating valid ride via POST /rides...");
  const validRideRes = await request("/rides", {
    method: "POST",
    headers: { Authorization: `Bearer ${passengerToken}` },
    body: {
      pickupLat: 31.5204,
      pickupLng: 74.3587,
      pickupAddress: "Mall of Lahore, Cantt",
      dropoffLat: 31.5216,
      dropoffLng: 74.4036,
      dropoffAddress: "Allama Iqbal Int'l Airport",
      distanceKm: 6.54,
      etaMinutes: 16,
      proposedFare: 17.50,
    },
  });
  console.log("Create ride status (expected 201):", validRideRes.status);
  console.log("Created ride ID:", validRideRes.data?.id);
  console.log("Created ride status:", validRideRes.data?.status);
  console.log("Passenger ID in ride:", validRideRes.data?.passengerId);
  console.log("Proposed Fare:", validRideRes.data?.proposedFare);

  const createdRideId = validRideRes.data?.id;

  // 5. GET /rides/:id with passenger
  console.log("\n[5] Fetching created ride via GET /rides/:id...");
  const getRideRes = await request(`/rides/${createdRideId}`, {
    headers: { Authorization: `Bearer ${passengerToken}` },
  });
  console.log("GET ride status (expected 200):", getRideRes.status);
  console.log("Passenger name:", getRideRes.data?.passenger?.name);

  // 6. Another passenger accessing this ride
  console.log("\n[6] Testing unauthorized passenger access to ride...");
  const otherPhone = `+141557${ts}`;
  const otherReg = await request("/auth/register/passenger", {
    method: "POST",
    body: { name: "Other Passenger", phone: otherPhone, email: `other_${ts}@example.com`, password: "Password123!" },
  });
  const otherLogin = await request("/auth/login", {
    method: "POST",
    body: { identifier: otherPhone, password: "Password123!" },
  });
  const otherToken = otherLogin.data.accessToken;

  const forbiddenAccessRes = await request(`/rides/${createdRideId}`, {
    headers: { Authorization: `Bearer ${otherToken}` },
  });
  console.log("Other passenger access status (expected 403):", forbiddenAccessRes.status, forbiddenAccessRes.data?.message);

  return {
    passengerId,
    createdRideId,
    success: validRideRes.status === 201 && getRideRes.status === 200 && forbiddenAccessRes.status === 403,
  };
}

runBackendTests().then((res) => {
  console.log("\nRESULT:", JSON.stringify(res, null, 2));
  process.exit(res.success ? 0 : 1);
}).catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
