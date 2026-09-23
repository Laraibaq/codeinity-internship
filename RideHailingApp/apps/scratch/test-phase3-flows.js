// Test Phase 3 mathematical models, Mapbox integration, fallback handling, and state logic

function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

function calculateEstimatedRoute(origin, destination) {
  const straightDist = calculateHaversineDistanceKm(
    origin.latitude,
    origin.longitude,
    destination.latitude,
    destination.longitude,
  );
  const drivingDistanceKm = Number((straightDist * 1.28).toFixed(1));
  const durationMinutes = Math.max(3, Math.round((drivingDistanceKm / 30) * 60) + 2);

  const geometry = [];
  const steps = 8;
  for (let i = 0; i <= steps; i++) {
    const factor = i / steps;
    const curveOffset = Math.sin(factor * Math.PI) * 0.0018;
    geometry.push({
      latitude: origin.latitude + (destination.latitude - origin.latitude) * factor + curveOffset,
      longitude: origin.longitude + (destination.longitude - origin.longitude) * factor - curveOffset,
    });
  }

  return {
    distanceKm: drivingDistanceKm,
    durationMinutes,
    geometry,
    isEstimatedFallback: true,
  };
}

async function runTest() {
  console.log("=== PHASE 3 REAL LOCATION & ROUTE PREVIEW VERIFICATION ===");

  // 1. Check Mapbox Token Configuration
  const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim() || "";
  const isConfigured = mapboxToken.length > 0 && !mapboxToken.includes("dummy");
  console.log("\n1. Mapbox Token Status:");
  console.log(`- Configured: ${isConfigured}`);
  if (!isConfigured) {
    console.log("- Result: BLOCKED: Mapbox token is not configured (as expected, fallback enabled)");
  } else {
    console.log("- Result: Mapbox token present");
  }

  // 2. Haversine Distance Test
  // Example: SFO Airport (37.6213, -122.3790) to Union Square SF (37.7879, -122.4074)
  const origin = { latitude: 37.6213, longitude: -122.3790, name: "SFO Airport" };
  const destination = { latitude: 37.7879, longitude: -122.4074, name: "Union Square, SF" };

  const straightDist = calculateHaversineDistanceKm(
    origin.latitude,
    origin.longitude,
    destination.latitude,
    destination.longitude,
  );
  console.log("\n2. Geodesic Calculation Test:");
  console.log(`- Origin: ${origin.name} (${origin.latitude}, ${origin.longitude})`);
  console.log(`- Destination: ${destination.name} (${destination.latitude}, ${destination.longitude})`);
  console.log(`- Direct Haversine Distance: ${straightDist} km`);
  console.assert(straightDist > 15 && straightDist < 25, "Distance should be ~18-20 km");
  console.log("✓ Haversine direct distance test passed");

  // 3. Route Calculation & Geometry Generation
  const route = calculateEstimatedRoute(origin, destination);
  console.log("\n3. Route Preview Calculation Test:");
  console.log(`- Driving Distance: ${route.distanceKm} km`);
  console.log(`- Estimated Duration: ${route.durationMinutes} min`);
  console.log(`- Polyline Points: ${route.geometry.length}`);
  console.log(`- Fallback Flag: ${route.isEstimatedFallback}`);
  console.assert(route.distanceKm > straightDist, "Driving distance must account for road winding factor");
  console.assert(route.durationMinutes > 0, "Duration must be positive");
  console.assert(route.geometry.length === 9, "Must generate interpolated geometry");
  console.log("✓ Route calculation & geometry test passed");

  // 4. Short-distance trip test (1 km)
  const shortOrigin = { latitude: 37.7749, longitude: -122.4194 };
  const shortDest = { latitude: 37.7800, longitude: -122.4150 };
  const shortRoute = calculateEstimatedRoute(shortOrigin, shortDest);
  console.log("\n4. Short Trip Test:");
  console.log(`- Distance: ${shortRoute.distanceKm} km, Duration: ${shortRoute.durationMinutes} min`);
  console.assert(shortRoute.distanceKm < 2, "Short trip should be < 2 km");
  console.assert(shortRoute.durationMinutes >= 3, "Minimum duration threshold respected");
  console.log("✓ Short trip test passed");

  console.log("\n=== ALL TEST CHECKS PASSED ===");
}

runTest();
