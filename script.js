const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";
const CAMPUS_CENTER = [15.39109, 73.87794];

// Approximate landmark coordinates for a student-project prototype.
// Landmark names are based on BITS Goa campus information / published campus map.
const LOCATIONS = {
  "Main Gate": { lat: 15.38970, lon: 73.87490, type: "gate" },
  "Main Building": { lat: 15.39135, lon: 73.87770, type: "academic" },
  "Library Complex": { lat: 15.39205, lon: 73.87825, type: "academic" },
  "Lecture Theatres 1 & 2": { lat: 15.39235, lon: 73.87890, type: "academic" },
  "Lecture Theatres 3 & 4": { lat: 15.39210, lon: 73.87955, type: "academic" },
  "Auditorium": { lat: 15.39170, lon: 73.87965, type: "academic" },
  "Student Activity Centre": { lat: 15.39095, lon: 73.87995, type: "student" },
  "Medical Centre": { lat: 15.39065, lon: 73.88035, type: "service" },
  "Shopping Complex": { lat: 15.39025, lon: 73.87920, type: "service" },
  "AH-1 Hostel": { lat: 15.38995, lon: 73.87885, type: "hostel" },
  "AH-7 Hostel": { lat: 15.39045, lon: 73.87785, type: "hostel" },
  "CH-1 Hostel": { lat: 15.38955, lon: 73.88000, type: "hostel" },
  "CH-6 Hostel": { lat: 15.39055, lon: 73.88075, type: "hostel" },
  "Central Lawns": { lat: 15.39125, lon: 73.87865, type: "open" },
  "Playground": { lat: 15.38995, lon: 73.88115, type: "open" },
  "Visitor's Guest House": { lat: 15.39265, lon: 73.87755, type: "guest" }
};

const els = {
  start: document.getElementById("start"),
  destination: document.getElementById("destination"),
  plan: document.getElementById("planBtn"),
  reset: document.getElementById("resetBtn"),
  routeDecision: document.getElementById("routeDecision"),
  decisionText: document.getElementById("decisionText"),
  temp: document.getElementById("temp"),
  condition: document.getElementById("condition"),
  feels: document.getElementById("feels"),
  rain: document.getElementById("rain"),
  humidity: document.getElementById("humidity"),
  wind: document.getElementById("wind"),
  recommendation: document.getElementById("recommendation"),
  primaryDistance: document.getElementById("primaryDistance"),
  backupDistance: document.getElementById("backupDistance"),
  riskScore: document.getElementById("riskScore"),
  checkpoints: document.getElementById("checkpoints"),
  avgTemp: document.getElementById("avgTemp"),
  maxRain: document.getElementById("maxRain"),
  maxWind: document.getElementById("maxWind"),
  weatherTable: document.getElementById("weatherTable"),
  download: document.getElementById("downloadBtn"),
  weatherIcon: document.getElementById("weatherIcon")
};

let map;
let primaryLayer;
let backupLayer;
let checkpointLayer;
let endpointLayer;
let lastAnalysis = null;

function initMap() {
  map = L.map("map").setView(CAMPUS_CENTER, 16.5);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
  }).addTo(map);
  L.circle(CAMPUS_CENTER, { radius: 900, color: "#155eef", fillOpacity: 0.03, weight: 1 }).addTo(map);
}

function fillSelect(select, includeGate = false) {
  select.innerHTML = "";
  Object.keys(LOCATIONS).forEach(name => {
    if (!includeGate && name === "Main Gate") return;
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  });
}

function populate() {
  fillSelect(els.start, true);
  fillSelect(els.destination, false);
  els.start.value = "Main Gate";
  els.destination.value = "Library Complex";
}

function interpolate(a, b, t) {
  return { lat: a.lat + (b.lat - a.lat) * t, lon: a.lon + (b.lon - a.lon) * t };
}

function distanceKm(a, b) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLon = (b.lon - a.lon) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function totalDistance(points) {
  return points.slice(1).reduce((sum, p, i) => sum + distanceKm(points[i], p), 0);
}

function routeVia(start, end, mode) {
  const startP = LOCATIONS[start];
  const endP = LOCATIONS[end];

  // These are intentionally simple, reproducible route models for a student project.
  // They are NOT a claim that these are official pedestrian paths.
  const coveredAnchors = [
    LOCATIONS["Main Building"],
    LOCATIONS["Library Complex"],
    LOCATIONS["Lecture Theatres 1 & 2"],
    LOCATIONS["Auditorium"],
    LOCATIONS["Student Activity Centre"]
  ];
  const openAnchors = [
    LOCATIONS["Central Lawns"],
    LOCATIONS["Playground"],
    LOCATIONS["Shopping Complex"]
  ];

  const anchors = mode === "covered" ? coveredAnchors : openAnchors;
  const near = anchors.filter(p => distanceKm(startP, p) < 0.65 || distanceKm(endP, p) < 0.65);
  const chosen = near.length ? near.slice(0, 2) : [anchors[0], anchors[anchors.length - 1]];
  const points = [startP];
  chosen.forEach(p => points.push(p));
  points.push(endP);
  return densify(points, 5);
}

function densify(points, countPerSegment) {
  const out = [];
  for (let i = 0; i < points.length - 1; i++) {
    for (let j = 0; j < countPerSegment; j++) {
      out.push(interpolate(points[i], points[i + 1], j / countPerSegment));
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

function weatherText(code) {
  const c = Number(code);
  if (c === 0) return "Clear sky";
  if ([1, 2, 3].includes(c)) return "Partly cloudy";
  if ([45, 48].includes(c)) return "Foggy";
  if ([51, 53, 55, 56, 57].includes(c)) return "Drizzle";
  if ([61, 63, 65, 66, 67].includes(c)) return "Rain";
  if ([71, 73, 75, 77].includes(c)) return "Snow / ice";
  if ([80, 81, 82].includes(c)) return "Rain showers";
  if ([95, 96, 99].includes(c)) return "Thunderstorm";
  return "Unknown";
}

function weatherEmoji(code) {
  const c = Number(code);
  if (c === 0) return "☀️";
  if ([1, 2, 3].includes(c)) return "⛅";
  if ([45, 48].includes(c)) return "🌫️";
  if ([51, 53, 55, 56, 57].includes(c)) return "🌦️";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(c)) return "🌧️";
  if ([95, 96, 99].includes(c)) return "⛈️";
  return "🌤️";
}

async function fetchWeather(point) {
  const params = new URLSearchParams({
    latitude: point.lat.toFixed(5),
    longitude: point.lon.toFixed(5),
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m",
    hourly: "precipitation_probability,precipitation,rain,weather_code",
    forecast_days: "1",
    timezone: "auto"
  });
  const res = await fetch(`${WEATHER_URL}?${params.toString()}`);
  if (!res.ok) throw new Error(`Weather request failed (${res.status})`);
  const data = await res.json();
  const nowIndex = 0;
  const probability = data.hourly?.precipitation_probability?.[nowIndex] ?? 0;
  return {
    lat: point.lat,
    lon: point.lon,
    temp: data.current.temperature_2m,
    feels: data.current.apparent_temperature,
    humidity: data.current.relative_humidity_2m,
    rain: data.current.rain ?? 0,
    precipitation: data.current.precipitation ?? 0,
    rainProbability: probability,
    wind: data.current.wind_speed_10m,
    code: data.current.weather_code,
    condition: weatherText(data.current.weather_code)
  };
}

function pointRisk(w) {
  let score = 0;
  score += Math.min(w.rainProbability / 8, 12);
  score += Math.min(w.rain * 8, 30);
  if (w.code >= 61 && w.code <= 82) score += 20;
  if (w.code >= 95) score += 40;
  if (w.temp >= 35) score += 15;
  if (w.temp >= 38) score += 10;
  if (w.wind >= 30) score += 10;
  return Math.min(100, Math.round(score));
}

function routeRisk(weatherPoints, mode) {
  const base = weatherPoints.reduce((sum, w) => sum + pointRisk(w), 0) / weatherPoints.length;
  // Open routes expose the walker more to rain/heat; sheltered routes reduce those components.
  const rainExposure = weatherPoints.reduce((s, w) => s + w.rainProbability + w.rain * 20, 0) / weatherPoints.length;
  const heatExposure = weatherPoints.reduce((s, w) => s + Math.max(0, w.temp - 30), 0) / weatherPoints.length;
  let adjusted = base;
  if (mode === "open") adjusted += Math.min(18, rainExposure * 0.08 + heatExposure * 1.5);
  else adjusted -= Math.min(12, rainExposure * 0.05 + heatExposure * 0.8);
  return Math.max(0, Math.min(100, Math.round(adjusted)));
}

async function analyzeRoute(name, mode) {
  const points = routeVia(els.start.value, els.destination.value, mode);
  const sampled = points.filter((_, i) => i % 4 === 0 || i === points.length - 1);
  const weather = await Promise.all(sampled.map(fetchWeather));
  return {
    name,
    mode,
    points,
    weather,
    distance: totalDistance(points),
    risk: routeRisk(weather, mode)
  };
}

function clearLayers() {
  [primaryLayer, backupLayer, checkpointLayer, endpointLayer].forEach(layer => {
    if (layer) map.removeLayer(layer);
  });
  primaryLayer = backupLayer = checkpointLayer = endpointLayer = null;
}

function drawRoute(route, isPrimary) {
  const latlngs = route.points.map(p => [p.lat, p.lon]);
  const layer = L.polyline(latlngs, {
    color: isPrimary ? "#155eef" : "#7b8494",
    weight: isPrimary ? 7 : 5,
    opacity: isPrimary ? 0.92 : 0.75,
    dashArray: isPrimary ? null : "10 9"
  }).addTo(map);
  return layer;
}

function drawCheckpoints(routes) {
  checkpointLayer = L.layerGroup().addTo(map);
  routes.forEach(route => {
    route.weather.forEach((w, i) => {
      const risk = pointRisk(w);
      const color = risk < 25 ? "#159455" : risk < 55 ? "#c47f00" : "#d64545";
      L.circleMarker([w.lat, w.lon], { radius: 6, color, fillColor: color, fillOpacity: .9, weight: 2 })
        .bindPopup(`<b>${route.name}</b><br>${w.condition}<br>${w.temp.toFixed(1)} °C · Rain ${w.rain.toFixed(1)} mm · ${w.rainProbability}% rain probability<br>Risk score: ${risk}/100`)
        .addTo(checkpointLayer);
    });
  });
}

function fitRoutes(routes) {
  const all = routes.flatMap(r => r.points.map(p => [p.lat, p.lon]));
  map.fitBounds(L.latLngBounds(all), { padding: [30, 30] });
}

function showEndpoints() {
  endpointLayer = L.layerGroup().addTo(map);
  const s = LOCATIONS[els.start.value];
  const d = LOCATIONS[els.destination.value];
  L.marker([s.lat, s.lon]).bindTooltip(`Start: ${els.start.value}`, { permanent: true, direction: "top", offset: [0, -8] }).addTo(endpointLayer);
  L.marker([d.lat, d.lon]).bindTooltip(`Destination: ${els.destination.value}`, { permanent: true, direction: "top", offset: [0, -8] }).addTo(endpointLayer);
}

function choosePrimary(covered, open) {
  // Lower route-risk wins. If scores are nearly equal, weather-sensitive conditions favor covered.
  if (covered.risk < open.risk) return [covered, open];
  if (open.risk < covered.risk) return [open, covered];
  const rain = covered.weather.some(w => w.rain > 0 || w.rainProbability >= 45 || w.code >= 61);
  return rain ? [covered, open] : [open, covered];
}

function updateSummary(primary, backup, allRoutes) {
  const allWeather = allRoutes.flatMap(r => r.weather);
  const avg = allWeather.reduce((s, w) => s + w.temp, 0) / allWeather.length;
  const maxRain = Math.max(...allWeather.map(w => w.rain));
  const maxWind = Math.max(...allWeather.map(w => w.wind));
  const primaryMode = primary.mode === "covered" ? "Covered / sheltered" : "Open / outdoor";

  els.routeDecision.textContent = `${primaryMode} route recommended`;
  els.decisionText.textContent = `${primary.name} is the lower-risk route (${primary.risk}/100). ${backup.name} remains available as the backup (${backup.risk}/100).`;
  els.primaryDistance.textContent = `${primary.distance.toFixed(2)} km`;
  els.backupDistance.textContent = `${backup.distance.toFixed(2)} km`;
  els.riskScore.textContent = `${primary.risk}/100`;
  els.checkpoints.textContent = allWeather.length;
  els.avgTemp.textContent = `${avg.toFixed(1)} °C`;
  els.maxRain.textContent = `${maxRain.toFixed(1)} mm`;
  els.maxWind.textContent = `${maxWind.toFixed(0)} km/h`;

  const routeWord = primary.mode === "covered" ? "covered route" : "open route";
  els.recommendation.className = `recommendation ${primary.mode}`;
  els.recommendation.innerHTML = `<strong>Take the ${routeWord}.</strong><br>${primary.risk < 30 ? "Conditions look relatively comfortable." : primary.risk < 60 ? "Some caution is advised." : "Weather exposure is elevated; use the backup if conditions change."}`;

  const campus = allWeather[0];
  els.temp.textContent = campus.temp.toFixed(1);
  els.feels.textContent = `${campus.feels.toFixed(1)} °C`;
  els.rain.textContent = `${campus.rain.toFixed(1)} mm`;
  els.humidity.textContent = `${campus.humidity}%`;
  els.wind.textContent = `${campus.wind.toFixed(0)} km/h`;
  els.condition.textContent = `${campus.condition} · ${campus.rainProbability}% rain probability`;
  els.weatherIcon.textContent = weatherEmoji(campus.code);

  els.weatherTable.innerHTML = allRoutes.map(route => route.weather.map((w, i) => {
    const risk = pointRisk(w);
    const riskText = risk < 25 ? "Good" : risk < 55 ? "Caution" : "Risk";
    return `<tr><td>${route.name}</td><td>${i + 1}</td><td>${w.temp.toFixed(1)} °C</td><td>${w.rain.toFixed(1)} mm (${w.rainProbability}%)</td><td>${w.wind.toFixed(0)} km/h</td><td>${w.condition}</td><td>${riskText} · ${risk}</td></tr>`;
  }).join("")).join("");
}

function buildCsv() {
  if (!lastAnalysis) return;
  const rows = [["Route","Mode","Checkpoint","Latitude","Longitude","Temperature C","Rain mm","Rain probability %","Wind km/h","Condition","Risk score"]];
  lastAnalysis.routes.forEach(route => route.weather.forEach((w, i) => {
    rows.push([route.name, route.mode, i + 1, w.lat.toFixed(5), w.lon.toFixed(5), w.temp.toFixed(1), w.rain.toFixed(2), w.rainProbability, w.wind.toFixed(1), w.condition, pointRisk(w)]);
  }));
  const csv = rows.map(r => r.map(v => `"${String(v).replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "bits-goa-weather-route-analysis.csv";
  a.click();
  URL.revokeObjectURL(url);
}

async function planRoute() {
  if (els.start.value === els.destination.value) {
    els.decisionText.textContent = "Choose two different locations.";
    return;
  }
  els.plan.disabled = true;
  els.plan.textContent = "Analyzing…";
  els.routeDecision.textContent = "Fetching live weather…";
  els.decisionText.textContent = "Checking weather at multiple points on both route options.";
  try {
    const [covered, open] = await Promise.all([
      analyzeRoute("Covered route", "covered"),
      analyzeRoute("Open route", "open")
    ]);
    const [primary, backup] = choosePrimary(covered, open);
    lastAnalysis = { routes: [primary, backup], primary, backup };

    clearLayers();
    primaryLayer = drawRoute(primary, true);
    backupLayer = drawRoute(backup, false);
    drawCheckpoints([primary, backup]);
    showEndpoints();
    fitRoutes([primary, backup]);
    updateSummary(primary, backup, [primary, backup]);
  } catch (err) {
    console.error(err);
    els.routeDecision.textContent = "Weather data could not be loaded";
    els.decisionText.textContent = "Check your internet connection and try again. Open-Meteo is used without an API key.";
    els.recommendation.className = "recommendation warning";
    els.recommendation.textContent = "No route recommendation was generated.";
  } finally {
    els.plan.disabled = false;
    els.plan.textContent = "Plan route";
  }
}

function resetApp() {
  clearLayers();
  map.setView(CAMPUS_CENTER, 16.5);
  els.routeDecision.textContent = "Select two locations";
  els.decisionText.textContent = "The app will compare a modeled sheltered route and open route using live weather data.";
  els.recommendation.className = "recommendation neutral";
  els.recommendation.textContent = "Plan a route to see the recommendation.";
  els.temp.textContent = "--"; els.feels.textContent = "--"; els.rain.textContent = "--"; els.humidity.textContent = "--"; els.wind.textContent = "--";
  els.condition.textContent = "Waiting for route analysis…"; els.weatherIcon.textContent = "☁️";
  els.primaryDistance.textContent = "--"; els.backupDistance.textContent = "--"; els.riskScore.textContent = "--";
  els.checkpoints.textContent = "--"; els.avgTemp.textContent = "--"; els.maxRain.textContent = "--"; els.maxWind.textContent = "--";
  els.weatherTable.innerHTML = ""; lastAnalysis = null;
}

initMap();
populate();
els.plan.addEventListener("click", planRoute);
els.reset.addEventListener("click", resetApp);
els.download.addEventListener("click", buildCsv);
