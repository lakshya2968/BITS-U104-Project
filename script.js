const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";
const CAMPUS_CENTER = [15.39109, 73.87794];

// BITS Pilani K. K. Birla Goa Campus landmark model.
// Coordinates are approximate map points for a student-project prototype.
const LOCATIONS = {
  "Main Gate": { lat: 15.38970, lon: 73.87490, type: "gate" },
  "Reception": { lat: 15.39010, lon: 73.87570, type: "service" },
  "Main Building / B-Dome": { lat: 15.39135, lon: 73.87770, type: "academic" },
  "Library Complex": { lat: 15.39205, lon: 73.87825, type: "academic" },
  "Computer Center": { lat: 15.39225, lon: 73.87775, type: "academic" },
  "Lecture Theatres 1 & 2": { lat: 15.39235, lon: 73.87890, type: "academic" },
  "Lecture Theatres 3 & 4": { lat: 15.39210, lon: 73.87955, type: "academic" },
  "Auditorium": { lat: 15.39170, lon: 73.87965, type: "academic" },
  "The Dome": { lat: 15.39135, lon: 73.87930, type: "academic" },
  "The Plaza": { lat: 15.39115, lon: 73.87895, type: "common" },
  "Student Activity Centre": { lat: 15.39095, lon: 73.87995, type: "student" },
  "Medical Centre": { lat: 15.39065, lon: 73.88035, type: "service" },
  "Shopping Complex": { lat: 15.39025, lon: 73.87920, type: "service" },
  "A-Mess": { lat: 15.38990, lon: 73.87840, type: "mess" },
  "C-Mess": { lat: 15.38960, lon: 73.88045, type: "mess" },
  "AH-1 Hostel": { lat: 15.38995, lon: 73.87885, type: "hostel" },
  "AH-2 Hostel": { lat: 15.38970, lon: 73.87845, type: "hostel" },
  "AH-3 Hostel": { lat: 15.38935, lon: 73.87810, type: "hostel" },
  "AH-4 Hostel": { lat: 15.38905, lon: 73.87775, type: "hostel" },
  "AH-5 Hostel": { lat: 15.38875, lon: 73.87755, type: "hostel" },
  "AH-6 Hostel": { lat: 15.38845, lon: 73.87745, type: "hostel" },
  "AH-7 Hostel": { lat: 15.39045, lon: 73.87785, type: "hostel" },
  "AH-8 Hostel": { lat: 15.39065, lon: 73.87745, type: "hostel" },
  "AH-9 Hostel": { lat: 15.39080, lon: 73.87720, type: "hostel" },
  "CH-1 Hostel": { lat: 15.38955, lon: 73.88000, type: "hostel" },
  "CH-2 Hostel": { lat: 15.38935, lon: 73.88020, type: "hostel" },
  "CH-3 Hostel": { lat: 15.38910, lon: 73.88040, type: "hostel" },
  "CH-4 Hostel": { lat: 15.38885, lon: 73.88060, type: "hostel" },
  "CH-5 Hostel": { lat: 15.38860, lon: 73.88080, type: "hostel" },
  "CH-6 Hostel": { lat: 15.39055, lon: 73.88075, type: "hostel" },
  "CH-7 Hostel": { lat: 15.39080, lon: 73.88095, type: "hostel" },

  // D-side men's hostels. Positions are approximate project coordinates.
  "DH-1 Hostel": { lat: 15.39345, lon: 73.88170, type: "dhostel" },
  "DH-2 Hostel": { lat: 15.39375, lon: 73.88200, type: "dhostel" },
  "DH-3 Hostel": { lat: 15.39405, lon: 73.88230, type: "dhostel" },
  "DH-4 Hostel": { lat: 15.39435, lon: 73.88260, type: "dhostel" },
  "DH-5 Hostel": { lat: 15.39465, lon: 73.88290, type: "dhostel" },
  "DH-6 Hostel": { lat: 15.39495, lon: 73.88320, type: "dhostel" },

  "D-Mess": { lat: 15.39520, lon: 73.88335, type: "mess" },
  "Central Lawns": { lat: 15.39125, lon: 73.87865, type: "open" },
  "Playground": { lat: 15.38995, lon: 73.88115, type: "open" },
  "Visitor's Guest House": { lat: 15.39265, lon: 73.87755, type: "guest" }
};

// D-Spine is a long campus corridor connecting the B-Dome/auditorium area to the D block.
// These are approximate project waypoints, not an official pedestrian GIS trace.
const D_SPINE_POINTS = [
  { lat: 15.39155, lon: 73.87970 },
  { lat: 15.39210, lon: 73.88025 },
  { lat: 15.39265, lon: 73.88080 },
  { lat: 15.39315, lon: 73.88135 },
  { lat: 15.39365, lon: 73.88185 }
];

const D_SPINE_LABEL = "D-Spine";
const D_ZONE_NAMES = new Set([
  "Lecture Theatres 3 & 4", "Auditorium", "The Dome", "D-Mess",
  "DH-1 Hostel", "DH-2 Hostel", "DH-3 Hostel", "DH-4 Hostel", "DH-5 Hostel", "DH-6 Hostel"
]);

const COVERED_CORRIDOR = [
  "Main Building / B-Dome", "Library Complex", "Computer Center", "Lecture Theatres 1 & 2",
  "Lecture Theatres 3 & 4", "Auditorium", "The Dome", "The Plaza", "Student Activity Centre",
  "Medical Centre", "DH-1 Hostel", "DH-2 Hostel", "DH-3 Hostel", "DH-4 Hostel", "DH-5 Hostel", "DH-6 Hostel"
];
const OPEN_CORRIDOR = [
  "Central Lawns", "Shopping Complex", "Medical Centre", "Playground", "C-Mess", "D-Mess"
];


const els = Object.fromEntries([
  "start", "destination", "plan", "reset", "routeDecision", "decisionText", "temp", "condition",
  "feels", "rain", "rainProb", "humidity", "wind", "recommendation", "primaryDistance", "backupDistance",
  "primaryRisk", "backupRisk", "checkpoints", "avgTemp", "maxRain", "maxWind", "weatherTable", "download",
  "weatherIcon", "routeReason", "primaryMode", "backupMode", "coveredRisk", "openRisk", "coverageValue",
  "rainStatus", "heatStatus", "routeComparison", "analysisRows"
].map(id => [id, document.getElementById(id)]));

let map;
let primaryLayer, backupLayer, checkpointLayer, endpointLayer, landmarkLayer, campusPathLayer;
let lastAnalysis = null;

function initMap() {
  map = L.map("map", { zoomControl: true }).setView(CAMPUS_CENTER, 16.4);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
  }).addTo(map);
  L.circle(CAMPUS_CENTER, {
    radius: 1050, color: "#155eef", fillColor: "#155eef", fillOpacity: 0.035, weight: 1
  }).addTo(map);
  drawCampusLandmarks();
  drawCampusPaths();
}

function drawCampusLandmarks() {
  landmarkLayer = L.layerGroup().addTo(map);
  Object.entries(LOCATIONS).forEach(([name, p]) => {
    const marker = L.circleMarker([p.lat, p.lon], {
      radius: 3.5, color: "#667085", fillColor: "#fff", fillOpacity: 0.9, weight: 1
    }).bindTooltip(name, { direction: "top", opacity: 0.9 });
    marker.addTo(landmarkLayer);
  });
}

function drawCampusPaths() {
  campusPathLayer = L.layerGroup().addTo(map);
  const spine = L.polyline(D_SPINE_POINTS.map(p => [p.lat, p.lon]), {
    color: "#7c3aed", weight: 6, opacity: 0.72, dashArray: "8 8"
  }).bindTooltip("D-Spine · campus corridor", { sticky: true });
  spine.bindPopup("<b>D-Spine</b><br>Approximate project path connecting the B-Dome/auditorium side to the D-block/D-hostel side.");
  spine.addTo(campusPathLayer);
}

function fillSelect(select, includeGate) {
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

function nearestNames(target, names, count = 2) {
  return names
    .map(name => ({ name, d: distanceKm(target, LOCATIONS[name]) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, count)
    .map(x => x.name);
}

function nearestSpinePoint(target) {
  return D_SPINE_POINTS
    .map((point, index) => ({ point, index, d: distanceKm(target, point) }))
    .sort((a, b) => a.d - b.d)[0];
}

function isDZone(name) {
  return D_ZONE_NAMES.has(name);
}

function addUnique(list, item) {
  if (!list.some(x => x.name === item.name)) list.push(item);
}

function buildRouteNodes(startName, endName, mode) {
  const start = LOCATIONS[startName];
  const end = LOCATIONS[endName];
  const corridor = mode === "covered" ? COVERED_CORRIDOR : OPEN_CORRIDOR;
  const nodes = [{ name: startName, point: start }];
  const startD = isDZone(startName);
  const endD = isDZone(endName);
  const touchesDZone = startD || endD;

  // If a journey starts/ends in the D-side area, explicitly route through the D-Spine.
  // This models the real campus concept of the D hostels -> D-Spine -> academic/D-block connection.
  if (touchesDZone && mode === "covered") {
    if (startD) {
      const nearest = nearestSpinePoint(start);
      addUnique(nodes, { name: "D-side covered connector", point: nearest.point });
      for (let i = nearest.index + 1; i < D_SPINE_POINTS.length; i++) {
        addUnique(nodes, { name: `${D_SPINE_LABEL} ${i + 1}`, point: D_SPINE_POINTS[i] });
      }
    } else {
      for (let i = 0; i < D_SPINE_POINTS.length; i++) {
        addUnique(nodes, { name: `${D_SPINE_LABEL} ${i + 1}`, point: D_SPINE_POINTS[i] });
      }
    }
  } else if (touchesDZone && mode === "open") {
    // Open alternative may still use the D-Spine area as a navigation landmark,
    // but approaches it through the outdoor corridor rather than treating it as covered.
    const candidates = nearestNames(start, corridor, 1).concat(nearestNames(end, corridor, 1));
    [...new Set(candidates)].forEach(name => addUnique(nodes, { name, point: LOCATIONS[name] }));
    const spine = nearestSpinePoint(startD ? start : end);
    addUnique(nodes, { name: `${D_SPINE_LABEL} access`, point: spine.point });
  } else {
    const candidates = nearestNames(start, corridor, 2).concat(nearestNames(end, corridor, 2));
    const ordered = [...new Set(candidates)]
      .map(name => ({ name, d: distanceKm(start, LOCATIONS[name]) }))
      .sort((a, b) => a.d - b.d)
      .map(x => x.name);
    ordered.slice(0, 4).forEach(name => addUnique(nodes, { name, point: LOCATIONS[name] }));
  }

  // Ensure the destination is always the final node.
  return [...nodes, { name: endName, point: end }];
}

function densifyNodes(nodes, countPerSegment = 8) {
  const out = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    const a = nodes[i].point;
    const b = nodes[i + 1].point;
    for (let j = 0; j < countPerSegment; j++) out.push(interpolate(a, b, j / countPerSegment));
  }
  out.push(nodes[nodes.length - 1].point);
  return out;
}

function routeVia(start, end, mode) {
  const nodes = buildRouteNodes(start, end, mode);
  return { nodes, points: densifyNodes(nodes) };
}

function weatherText(code) {
  const c = Number(code);
  if (c === 0) return "Clear sky";
  if ([1, 2, 3].includes(c)) return "Cloudy / partly cloudy";
  if ([45, 48].includes(c)) return "Foggy";
  if ([51, 53, 55, 56, 57].includes(c)) return "Drizzle";
  if ([61, 63, 65, 66, 67].includes(c)) return "Rain";
  if ([80, 81, 82].includes(c)) return "Rain showers";
  if ([95, 96, 99].includes(c)) return "Thunderstorm";
  return "Other conditions";
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

function closestHourIndex(times, currentTime) {
  if (!Array.isArray(times) || !times.length || !currentTime) return 0;
  const target = new Date(currentTime).getTime();
  let best = 0, bestDiff = Infinity;
  times.forEach((t, i) => {
    const diff = Math.abs(new Date(t).getTime() - target);
    if (diff < bestDiff) { best = i; bestDiff = diff; }
  });
  return best;
}

async function fetchWeather(point) {
  const params = new URLSearchParams({
    latitude: point.lat.toFixed(5), longitude: point.lon.toFixed(5),
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m",
    hourly: "precipitation_probability,precipitation,rain,weather_code",
    forecast_days: "1", timezone: "auto"
  });
  const res = await fetch(`${WEATHER_URL}?${params}`);
  if (!res.ok) throw new Error(`Weather request failed (${res.status})`);
  const data = await res.json();
  const idx = closestHourIndex(data.hourly?.time, data.current?.time);
  return {
    lat: point.lat, lon: point.lon,
    temp: Number(data.current.temperature_2m), feels: Number(data.current.apparent_temperature),
    humidity: Number(data.current.relative_humidity_2m), rain: Number(data.current.rain ?? 0),
    precipitation: Number(data.current.precipitation ?? 0),
    rainProbability: Number(data.hourly?.precipitation_probability?.[idx] ?? 0),
    wind: Number(data.current.wind_speed_10m), code: Number(data.current.weather_code),
    condition: weatherText(data.current.weather_code)
  };
}

function pointRisk(w) {
  let score = 0;
  score += Math.min(w.rainProbability * 0.22, 22);
  score += Math.min(w.rain * 10, 30);
  if (w.code >= 61 && w.code <= 82) score += 22;
  if (w.code >= 95) score += 45;
  if (w.temp >= 32) score += Math.min((w.temp - 31) * 3, 15);
  if (w.temp >= 36) score += 8;
  if (w.wind >= 30) score += 8;
  return Math.min(100, Math.round(score));
}

function routeRisk(weatherPoints, mode) {
  const base = weatherPoints.reduce((sum, w) => sum + pointRisk(w), 0) / weatherPoints.length;
  const rainExposure = weatherPoints.reduce((s, w) => s + w.rainProbability + w.rain * 20, 0) / weatherPoints.length;
  const heatExposure = weatherPoints.reduce((s, w) => s + Math.max(0, w.temp - 30), 0) / weatherPoints.length;
  const stormExposure = weatherPoints.filter(w => w.code >= 95).length / weatherPoints.length * 25;
  let adjusted = base;
  if (mode === "open") adjusted += Math.min(22, rainExposure * 0.10 + heatExposure * 1.7 + stormExposure);
  else adjusted -= Math.min(16, rainExposure * 0.07 + heatExposure * 0.9);
  return Math.max(0, Math.min(100, Math.round(adjusted)));
}

async function analyzeRoute(label, mode) {
  const built = routeVia(els.start.value, els.destination.value, mode);
  const sampled = built.points.filter((_, i) => i % 8 === 0 || i === built.points.length - 1);
  const weather = await Promise.all(sampled.map(fetchWeather));
  return { name: label, mode, nodes: built.nodes, points: built.points, weather, distance: totalDistance(built.points), risk: routeRisk(weather, mode) };
}

function clearLayers() {
  [primaryLayer, backupLayer, checkpointLayer, endpointLayer].forEach(layer => layer && map.removeLayer(layer));
  primaryLayer = backupLayer = checkpointLayer = endpointLayer = null;
}

function drawRoute(route, primary) {
  const layer = L.polyline(route.points.map(p => [p.lat, p.lon]), {
    color: primary ? "#155eef" : "#7b8494", weight: primary ? 7 : 5,
    opacity: primary ? 0.95 : 0.72, dashArray: primary ? null : "11 9"
  }).addTo(map);
  const usesDSpine = route.nodes.some(n => String(n.name).toLowerCase().includes("d-spine"));
  const pathNote = usesDSpine ? "<br><b>Includes D-Spine</b>" : "";
  layer.bindPopup(`<b>${route.name}</b><br>${route.mode === "covered" ? "Sheltered / building-adjacent model" : "Open / outdoor model"}${pathNote}<br>Risk: ${route.risk}/100`);
  return layer;
}

function riskColor(risk) { return risk < 30 ? "#159455" : risk < 60 ? "#c47f00" : "#d64545"; }

function drawCheckpoints(routes) {
  checkpointLayer = L.layerGroup().addTo(map);
  routes.forEach(route => route.weather.forEach((w, i) => {
    const color = riskColor(pointRisk(w));
    L.circleMarker([w.lat, w.lon], { radius: 7, color, fillColor: color, fillOpacity: 0.9, weight: 2 })
      .bindPopup(`<b>${route.name} · checkpoint ${i + 1}</b><br>${w.condition}<br>${w.temp.toFixed(1)} °C · ${w.rainProbability}% rain probability<br>Rain: ${w.rain.toFixed(1)} mm · Wind: ${w.wind.toFixed(0)} km/h<br><b>Risk: ${pointRisk(w)}/100</b>`)
      .addTo(checkpointLayer);
  }));
}

function showEndpoints() {
  endpointLayer = L.layerGroup().addTo(map);
  const s = LOCATIONS[els.start.value], d = LOCATIONS[els.destination.value];
  L.marker([s.lat, s.lon]).bindTooltip(`START · ${els.start.value}`, { permanent: true, direction: "top", offset: [0, -8] }).addTo(endpointLayer);
  L.marker([d.lat, d.lon]).bindTooltip(`DESTINATION · ${els.destination.value}`, { permanent: true, direction: "top", offset: [0, -8] }).addTo(endpointLayer);
}

function fitRoutes(routes) {
  const all = routes.flatMap(r => r.points.map(p => [p.lat, p.lon]));
  map.fitBounds(L.latLngBounds(all), { padding: [32, 32] });
}

function choosePrimary(covered, open) {
  if (covered.risk < open.risk) return [covered, open];
  if (open.risk < covered.risk) return [open, covered];
  const rainLikely = covered.weather.some(w => w.rain > 0 || w.rainProbability >= 45 || w.code >= 61);
  return rainLikely ? [covered, open] : [open, covered];
}

function average(values) { return values.reduce((a, b) => a + b, 0) / Math.max(values.length, 1); }

function updateSummary(primary, backup, allRoutes) {
  const allWeather = allRoutes.flatMap(r => r.weather);
  const avgTemp = average(allWeather.map(w => w.temp));
  const maxRain = Math.max(...allWeather.map(w => w.rain));
  const maxWind = Math.max(...allWeather.map(w => w.wind));
  const rainProb = Math.round(average(allWeather.map(w => w.rainProbability)));
  const primaryLabel = primary.mode === "covered" ? "Covered / sheltered" : "Open / outdoor";
  const backupLabel = backup.mode === "covered" ? "Covered / sheltered" : "Open / outdoor";

  els.routeDecision.textContent = `${primaryLabel} route recommended`;
  els.decisionText.textContent = `${primary.name} has the lower weather-risk score (${primary.risk}/100). ${backup.name} remains visible as the backup (${backup.risk}/100).`;
  els.primaryDistance.textContent = `${primary.distance.toFixed(2)} km`;
  els.backupDistance.textContent = `${backup.distance.toFixed(2)} km`;
  els.primaryRisk.textContent = `${primary.risk}/100`;
  els.backupRisk.textContent = `${backup.risk}/100`;
  els.checkpoints.textContent = allWeather.length;
  els.avgTemp.textContent = `${avgTemp.toFixed(1)} °C`;
  els.maxRain.textContent = `${maxRain.toFixed(1)} mm`;
  els.maxWind.textContent = `${maxWind.toFixed(0)} km/h`;
  els.coveredRisk.textContent = `${allRoutes.find(r => r.mode === "covered").risk}/100`;
  els.openRisk.textContent = `${allRoutes.find(r => r.mode === "open").risk}/100`;
  els.coverageValue.textContent = primary.mode === "covered" ? "Higher shelter exposure" : "Outdoor conditions acceptable";
  els.rainStatus.textContent = rainProb >= 50 ? "High" : rainProb >= 25 ? "Moderate" : "Low";
  els.heatStatus.textContent = avgTemp >= 35 ? "High" : avgTemp >= 31 ? "Moderate" : "Low";
  els.routeComparison.textContent = `${primaryLabel} ${primary.risk}/100 vs ${backupLabel} ${backup.risk}/100`;

  els.recommendation.className = `recommendation ${primary.mode}`;
  els.recommendation.innerHTML = `<strong>Take the ${primary.mode === "covered" ? "covered / sheltered" : "open / outdoor"} route.</strong><br>${primary.risk < 30 ? "Weather exposure is relatively low." : primary.risk < 60 ? "Some weather caution is advised." : "Weather exposure is elevated; keep the backup route ready."}`;
  els.routeReason.textContent = primary.mode === "covered"
    ? "Rain, heat, wind or storm indicators increased outdoor exposure, so the sheltered model scored lower."
    : "Current weather indicators are relatively manageable, so the open model scored lower while the sheltered option remains available.";

  const campus = allWeather[0];
  els.temp.textContent = campus.temp.toFixed(1);
  els.feels.textContent = `${campus.feels.toFixed(1)} °C`;
  els.rain.textContent = `${campus.rain.toFixed(1)} mm`;
  els.rainProb.textContent = `${campus.rainProbability}%`;
  els.humidity.textContent = `${campus.humidity}%`;
  els.wind.textContent = `${campus.wind.toFixed(0)} km/h`;
  els.condition.textContent = `${campus.condition} · ${campus.rainProbability}% rain probability`;
  els.weatherIcon.textContent = weatherEmoji(campus.code);
  els.primaryMode.textContent = primaryLabel;
  els.backupMode.textContent = backupLabel;

  els.weatherTable.innerHTML = allRoutes.map(route => route.weather.map((w, i) => {
    const risk = pointRisk(w);
    const riskText = risk < 30 ? "Good" : risk < 60 ? "Caution" : "Risk";
    return `<tr><td>${route.name}</td><td>${i + 1}</td><td>${w.temp.toFixed(1)} °C</td><td>${w.rain.toFixed(1)} mm</td><td>${w.rainProbability}%</td><td>${w.wind.toFixed(0)} km/h</td><td>${w.condition}</td><td><span class="risk-chip ${riskText.toLowerCase()}">${riskText} · ${risk}</span></td></tr>`;
  }).join("")).join("");

  els.analysisRows.textContent = `${allWeather.length} weather checkpoints sampled across both BITS Goa route models.`;
}

function buildCsv() {
  if (!lastAnalysis) return;
  const rows = [["Start","Destination","Route","Mode","Checkpoint","Latitude","Longitude","Temperature C","Feels Like C","Rain mm","Rain probability %","Humidity %","Wind km/h","Condition","Risk score"]];
  lastAnalysis.routes.forEach(route => route.weather.forEach((w, i) => rows.push([
    els.start.value, els.destination.value, route.name, route.mode, i + 1, w.lat.toFixed(5), w.lon.toFixed(5),
    w.temp.toFixed(1), w.feels.toFixed(1), w.rain.toFixed(2), w.rainProbability, w.humidity, w.wind.toFixed(1), w.condition, pointRisk(w)
  ])));
  const csv = rows.map(r => r.map(v => `"${String(v).replaceAll('"', '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a"); a.href = url; a.download = "bits-goa-weather-route-analysis.csv"; a.click(); URL.revokeObjectURL(url);
}

async function planRoute() {
  if (els.start.value === els.destination.value) {
    els.decisionText.textContent = "Choose two different BITS Goa locations.";
    return;
  }
  els.plan.disabled = true; els.plan.textContent = "Analyzing BITS Goa…";
  els.routeDecision.textContent = "Analyzing campus weather…";
  els.decisionText.textContent = "Sampling live weather at checkpoints on the covered and open route models.";
  try {
    const [covered, open] = await Promise.all([
      analyzeRoute("Covered route", "covered"), analyzeRoute("Open route", "open")
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
    els.decisionText.textContent = "Check your internet connection and try again. Weather is supplied by Open-Meteo without an API key.";
    els.recommendation.className = "recommendation warning";
    els.recommendation.textContent = "No route recommendation was generated.";
  } finally {
    els.plan.disabled = false; els.plan.textContent = "Plan route";
  }
}

function resetApp() {
  clearLayers();
  map.setView(CAMPUS_CENTER, 16.4);
  els.routeDecision.textContent = "Choose a BITS Goa route";
  els.decisionText.textContent = "Select a campus start point and destination to compare covered and open route options.";
  els.recommendation.className = "recommendation neutral";
  els.recommendation.textContent = "Plan a route to see the weather-based recommendation.";
  [els.temp, els.feels, els.rain, els.rainProb, els.humidity, els.wind, els.primaryDistance, els.backupDistance, els.primaryRisk, els.backupRisk, els.checkpoints, els.avgTemp, els.maxRain, els.maxWind, els.coveredRisk, els.openRisk].forEach(e => e.textContent = "--");
  els.condition.textContent = "Waiting for route analysis…"; els.weatherIcon.textContent = "☁️";
  els.coverageValue.textContent = "--"; els.rainStatus.textContent = "--"; els.heatStatus.textContent = "--"; els.routeComparison.textContent = "--";
  els.routeReason.textContent = "--"; els.primaryMode.textContent = "--"; els.backupMode.textContent = "--"; els.analysisRows.textContent = "";
  els.weatherTable.innerHTML = ""; lastAnalysis = null;
}

initMap();
populate();
els.plan.addEventListener("click", planRoute);
els.reset.addEventListener("click", resetApp);
els.download.addEventListener("click", buildCsv);
