require("dotenv").config({ path: "e:/code/codeinity-internship/RideHailingApp/apps/backend/.env" });
const { PrismaClient } = require("e:/code/codeinity-internship/RideHailingApp/apps/backend/dist/generated/prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const API_BASE = "http://localhost:3000";

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

async function runEndToEndVerification() {
  console.log("========================================================");
  console.log("PHASE 4 — PASSENGER RIDE REQUEST & FARE PROPOSAL VERIFICATION");
  console.log("========================================================");

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  const report = {
    backend: {},
    passengerFlow: {},
    realData: {},
    errorHandling: {},
    databaseVerification: {},
  };

  try {
    // 1. Authenticate Passenger
    const ts = Date.now().toString().slice(-6);
    const phone = `+141558${ts}`;
    const email = `phase4_flow_${ts}@example.com`;
    const password = "Password123!";

    console.log(`\n[1] Registering and authenticating Passenger (${phone})...`);
    const regRes = await request("/auth/register/passenger", {
      method: "POST",
      body: { name: "E2E Passenger", phone, email, password },
    });

    const loginRes = await request("/auth/login", {
      method: "POST",
      body: { identifier: phone, password },
    });

    const passengerToken = loginRes.data.accessToken;
    const passengerId = regRes.data.id;
    console.log("Passenger ID:", passengerId);
    console.log("JWT Token acquired successfully");
    report.backend.auth = true;

    // 2. Authenticate Driver for role isolation test
    console.log(`\n[2] Testing Driver role guard on POST /rides...`);
    const driverPhone = `+141559${ts}`;
    await request("/auth/register/driver", {
      method: "POST",
      body: { name: "Test Driver", phone: driverPhone, email: `driver_${ts}@example.com`, password },
    });
    const driverLogin = await request("/auth/login", {
      method: "POST",
      body: { identifier: driverPhone, password },
    });
    const driverToken = driverLogin.data.accessToken;

    const driverRideAttempt = await request("/rides", {
      method: "POST",
      headers: { Authorization: `Bearer ${driverToken}` },
      body: {
        pickupLat: 31.5204,
        pickupLng: 74.3587,
        pickupAddress: "Mall of Lahore",
        dropoffLat: 31.5216,
        dropoffLng: 74.4036,
        dropoffAddress: "Allama Iqbal Airport",
        distanceKm: 6.54,
        etaMinutes: 16,
        proposedFare: 18.50,
      },
    });
    console.log("Driver POST /rides status (403 expected):", driverRideAttempt.status);
    report.backend.driverRoleGuard = driverRideAttempt.status === 403;

    // 3. Error handling: invalid fare, missing destination, unauthorized
    console.log(`\n[3] Testing Error Handling...`);
    const invalidFareRes = await request("/rides", {
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
        proposedFare: -5.0,
      },
    });
    console.log("Invalid negative fare status (400 expected):", invalidFareRes.status);
    report.errorHandling.invalidFare = invalidFareRes.status === 400;

    const missingDestRes = await request("/rides", {
      method: "POST",
      headers: { Authorization: `Bearer ${passengerToken}` },
      body: {
        pickupLat: 31.5204,
        pickupLng: 74.3587,
        pickupAddress: "Mall of Lahore",
        distanceKm: 6.54,
        etaMinutes: 16,
        proposedFare: 18.50,
      },
    });
    console.log("Missing destination status (400 expected):", missingDestRes.status);
    report.errorHandling.missingDestination = missingDestRes.status === 400;

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
        proposedFare: 18.50,
      },
    });
    console.log("Unauthenticated status (401 expected):", unauthRes.status);
    report.errorHandling.unauthorized = unauthRes.status === 401;

    // 4. Real Flow: Submit Ride with Phase 3 Route & Coordinates
    console.log(`\n[4] Creating REAL Ride with Phase 3 Mapbox Coordinates & Proposed Fare...`);
    const ridePayload = {
      pickupLat: 31.5204,
      pickupLng: 74.3587,
      pickupAddress: "Mall of Lahore, Cantt, Lahore",
      dropoffLat: 31.5216,
      dropoffLng: 74.4036,
      dropoffAddress: "Allama Iqbal International Airport, Lahore",
      distanceKm: 6.54,
      etaMinutes: 16,
      proposedFare: 18.50,
    };

    const createRideRes = await request("/rides", {
      method: "POST",
      headers: { Authorization: `Bearer ${passengerToken}` },
      body: ridePayload,
    });

    console.log("POST /rides response status (201 expected):", createRideRes.status);
    const createdRide = createRideRes.data;
    console.log("Created Ride ID:", createdRide?.id);
    console.log("Created Ride Status:", createdRide?.status);
    console.log("Created Ride Proposed Fare:", createdRide?.proposedFare);
    console.log("Created Ride Passenger ID:", createdRide?.passengerId);

    const createdRideId = createdRide?.id;
    report.passengerFlow.rideCreation = createRideRes.status === 201 && Boolean(createdRideId);
    report.realData.pickupCoords = createdRide?.pickupLat === 31.5204 && createdRide?.pickupLng === 74.3587;
    report.realData.dropoffCoords = createdRide?.dropoffLat === 31.5216 && createdRide?.dropoffLng === 74.4036;
    report.realData.distance = createdRide?.distanceKm === 6.54;
    report.realData.duration = createdRide?.etaMinutes === 16;
    report.realData.fare = Number(createdRide?.proposedFare) === 18.5;

    // 5. Database Direct Verification in PostgreSQL
    console.log(`\n[5] Verifying Ride in PostgreSQL directly via Prisma...`);
    const dbRide = await prisma.ride.findUnique({
      where: { id: createdRideId },
      include: { passenger: true },
    });

    console.log("Database Record Found:", Boolean(dbRide));
    if (dbRide) {
      console.log("DB Ride ID:", dbRide.id);
      console.log("DB Passenger Ownership:", dbRide.passengerId === passengerId ? "MATCHES" : "MISMATCH");
      console.log("DB Status:", dbRide.status);
      console.log("DB Pickup:", dbRide.pickupAddress, `(${dbRide.pickupLat}, ${dbRide.pickupLng})`);
      console.log("DB Dropoff:", dbRide.dropoffAddress, `(${dbRide.dropoffLat}, ${dbRide.dropoffLng})`);
      console.log("DB Distance & ETA:", `${dbRide.distanceKm} km, ${dbRide.etaMinutes} min`);
      console.log("DB Proposed Fare:", dbRide.proposedFare.toString());
      console.log("DB Requested At:", dbRide.requestedAt);

      report.databaseVerification.exists = true;
      report.databaseVerification.ownership = dbRide.passengerId === passengerId;
      report.databaseVerification.pickup = dbRide.pickupAddress === ridePayload.pickupAddress;
      report.databaseVerification.dropoff = dbRide.dropoffAddress === ridePayload.dropoffAddress;
      report.databaseVerification.fare = dbRide.proposedFare.toString() === "18.5";
      report.databaseVerification.status = dbRide.status === "requested";
    }

    // 6. Ownership Security Test: Another Passenger cannot access this ride
    console.log(`\n[6] Testing Passenger Ride Isolation (Another Passenger access)...`);
    const otherPhone = `+141560${ts}`;
    await request("/auth/register/passenger", {
      method: "POST",
      body: { name: "Intruder Passenger", phone: otherPhone, email: `intruder_${ts}@example.com`, password },
    });
    const otherLogin = await request("/auth/login", {
      method: "POST",
      body: { identifier: otherPhone, password },
    });
    const otherToken = otherLogin.data.accessToken;

    const forbiddenCheck = await request(`/rides/${createdRideId}`, {
      headers: { Authorization: `Bearer ${otherToken}` },
    });
    console.log("Intruder GET /rides/:id status (403 expected):", forbiddenCheck.status);
    report.backend.passengerIsolation = forbiddenCheck.status === 403;

    // 7. Legitimate Passenger GET /rides/:id
    const legitimateGet = await request(`/rides/${createdRideId}`, {
      headers: { Authorization: `Bearer ${passengerToken}` },
    });
    console.log("Legitimate Passenger GET status (200 expected):", legitimateGet.status);
    report.passengerFlow.getRide = legitimateGet.status === 200;

    console.log("\n========================================================");
    console.log("VERIFICATION SUMMARY");
    console.log("========================================================");
    console.log(JSON.stringify(report, null, 2));

    return report;
  } finally {
    await prisma.$disconnect();
  }
}

runEndToEndVerification().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error("Fatal test failure:", err);
  process.exit(1);
});
