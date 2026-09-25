const CAMPUS = { lat: 15.3913605, lon: 73.879555, zoom: 16.8, width: 1920, height: 1080 };
const OSM = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSRM = 'https://router.project-osrm.org/route/v1/driving';
const WEATHER = 'https://api.open-meteo.com/v1/forecast';

let map, normalLayer = null, coveredLayer = null, altLayer = null, startMarker = null, endMarker = null;
let weather = null;

function worldXY(lat, lon) {
  const scale = 256 * Math.pow(2, CAMPUS.zoom);
  return [(lon + 180) / 360 * scale, (1 - Math.asinh(Math.tan(lat * Math.PI / 180)) / Math.PI) / 2 * scale];
}

const centerWorld = worldXY(CAMPUS.lat, CAMPUS.lon);

function pixelToLatLng(x, y) {
  const scale = 256 * Math.pow(2, CAMPUS.zoom);
  const wx = centerWorld[0] + (x - CAMPUS.width / 2);
  const wy = centerWorld[1] + (y - CAMPUS.height / 2);
  const lon = wx / scale * 360 - 180;
  const n = Math.PI - 2 * Math.PI * wy / scale;
  const lat = 180 / Math.PI * Math.atan(Math.sinh(n));
  return [lat, lon];
}

function hav(a, b) {
  const R = 6371000, p = Math.PI / 180;
  const d1 = (b[0] - a[0]) * p, d2 = (b[1] - a[1]) * p;
  const x = Math.sin(d1 / 2) ** 2 + Math.cos(a[0] * p) * Math.cos(b[0] * p) * Math.sin(d2 / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

function fmtDist(m) {
  return m < 1000 ? Math.round(m) + ' m' : (m / 1000).toFixed(2) + ' km';
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function getLoc(id) {
  return MAP_DATA.locations.find(x => x.id === id);
}

function getLocByName(name) {
  return MAP_DATA.locations.find(x => x.name.toLowerCase() === name.toLowerCase());
}

function getNamedPoint(name) {
  if (name === 'D-SPINE' || name === 'D-Spine' || name === 'D-spine') {
    return pixelToLatLng(MAP_DATA.routingAnchors['D-SPINE'].x, MAP_DATA.routingAnchors['D-SPINE'].y);
  }
  const l = getLocByName(name);
  return l ? l._ll : null;
}

function initMap() {
  map = L.map('map', { zoomControl: true }).setView([CAMPUS.lat, CAMPUS.lon], 16);
  L.tileLayer(OSM, { maxZoom: 19, attribution: '© OpenStreetMap contributors' }).addTo(map);

  const group = L.featureGroup();
  MAP_DATA.locations.forEach(l => {
    const ll = pixelToLatLng(l.x, l.y);
    l._ll = ll;
    const m = L.circleMarker(ll, { radius: 6, weight: 2, fillColor: '#146c94', color: '#ffffff', fillOpacity: 0.9 }).addTo(group);
    m.bindTooltip(esc(l.name), { permanent: true, direction: 'top', className: 'location-label', offset: [0, -6] });
    m.on('click', () => {
      document.getElementById('start').value = l.id;
    });
  });
  group.addTo(map);
}

function populate() {
  const s = document.getElementById('start'), e = document.getElementById('destination');
  s.innerHTML = ''; e.innerHTML = '';
  MAP_DATA.locations.forEach(l => {
    const o = document.createElement('option');
    o.value = l.id;
    o.textContent = l.name;
    s.appendChild(o);
    const q = o.cloneNode(true);
    e.appendChild(q);
  });
  if (MAP_DATA.locations.length > 1) {
    s.value = MAP_DATA.locations[0].id;
    e.value = MAP_DATA.locations[1].id;
  }
}

async function fetchWeather() {
  const url = WEATHER + `?latitude=${CAMPUS.lat}&longitude=${CAMPUS.lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m&hourly=precipitation_probability,rain&forecast_days=1&timezone=auto`;
  const r = await fetch(url);
  if (!r.ok) throw new Error('Weather request failed');
  const d = await r.json(), c = d.current, probs = d.hourly?.precipitation_probability || [], rains = d.hourly?.rain || [];
  let idx = d.hourly?.time?.findIndex(t => t === c.time);
  if (idx < 0) idx = 0;

  const prob = probs[idx] ?? 0, rainNow = Math.max(c.rain || 0, c.precipitation || 0, rains[idx] || 0);
  weather = {
    temp: c.temperature_2m,
    feels: c.apparent_temperature,
    humidity: c.relative_humidity_2m,
    wind: c.wind_speed_10m,
    prob,
    rain: rainNow,
    code: c.weather_code
  };

  weather.raining = weather.rain > 0.1 || weather.prob >= 40 || [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(weather.code);

  document.getElementById('weatherMain').textContent = `${Math.round(weather.temp)}°C`;
  document.getElementById('weatherDetail').textContent = `Feels like ${Math.round(weather.feels)}°C • BITS Goa campus`;
  document.getElementById('weatherGrid').innerHTML = `
    <div>Humidity<b>${weather.humidity}%</b></div>
    <div>Wind<b>${Math.round(weather.wind)} km/h</b></div>
    <div>Rain now<b>${weather.rain.toFixed(1)} mm</b></div>
    <div>Rain chance<b>${weather.prob}%</b></div>
  `;

  const st = document.getElementById('weatherStatus');
  st.className = 'weather-status ' + (weather.raining ? 'rain' : 'clear');
  st.textContent = weather.raining
    ? '🌧 Rain / significant rain risk — covered route preferred.'
    : '☀️ Conditions are currently dry — normal mapped route preferred.';

  return weather;
}

function routeUrl(a, b) {
  return OSRM + `/${a[1]},${a[0]};${b[1]},${b[0]}?overview=full&geometries=geojson&steps=false`;
}

async function osrm(a, b) {
  const r = await fetch(routeUrl(a, b));
  if (!r.ok) throw new Error('Normal mapped routing failed');
  const d = await r.json();
  if (!d.routes?.length) throw new Error('No normal mapped route found');
  return {
    coords: d.routes[0].geometry.coordinates.map(p => [p[1], p[0]]),
    distance: d.routes[0].distance,
    duration: d.routes[0].duration
  };
}

function coveredPaths() {
  return MAP_DATA.paths.filter(p => p.type === 'covered' || p.type === 'dspine');
}

function buildCoveredGraph() {
  const nodes = [], edges = [], idx = new Map();
  const key = (x, y) => `${Number(x).toFixed(1)},${Number(y).toFixed(1)}`;

  function addNode(ll, k) {
    if (!idx.has(k)) {
      idx.set(k, nodes.length);
      nodes.push(ll);
    }
    return idx.get(k);
  }

  function addEdge(a, b, wOverride = null) {
    if (a === b) return;
    const w = wOverride ?? hav(nodes[a], nodes[b]);
    edges.push([a, b, w]);
  }

  // 1. Add all physical mapped paths
  for (const p of coveredPaths()) {
    const ids = p.points.map(q => addNode(pixelToLatLng(q.x, q.y), key(q.x, q.y)));
    for (let i = 1; i < ids.length; i++) addEdge(ids[i - 1], ids[i]);
  }

  const physicalNodeCount = nodes.length;

  // 2. Add indoor anchor locations
  const anchors = {};
  const indoorNames = [...new Set((MAP_DATA.indoorConnections || []).flat())];
  
  for (const name of indoorNames) {
    const ll = getNamedPoint(name);
    if (ll) {
      const k = name.toUpperCase() === 'D-SPINE' ? 'D-SPINE' : `loc:${name.toLowerCase()}`;
      anchors[name] = addNode(ll, k);
    }
  }

  // 3. Connect anchors to nearby physical nodes
  for (const name of indoorNames) {
    const ll = getNamedPoint(name);
    const ai = anchors[name];
    if (!ll || ai == null) continue;

    let connected = false;
    for (let i = 0; i < physicalNodeCount; i++) {
      const d = hav(ll, nodes[i]);
      if (d <= 60) {
        addEdge(ai, i);
        connected = true;
      }
    }

    if (!connected) {
      let nearest = -1, best = Infinity;
      for (let i = 0; i < physicalNodeCount; i++) {
        const d = hav(ll, nodes[i]);
        if (d < best) {
          best = d;
          nearest = i;
        }
      }
      if (nearest >= 0) addEdge(ai, nearest);
    }
  }

  // 4. Add direct hostel connections to D-SPINE
  const hostelNames = ['Dh-1', 'Dh-3', 'Dh-4', 'Dh-6'];
  for (const hName of hostelNames) {
    const hLoc = getLocByName(hName);
    if (hLoc && anchors['D-SPINE'] != null) {
      const hNode = addNode(hLoc._ll, `loc:${hName.toLowerCase()}`);
      addEdge(hNode, anchors['D-SPINE']);
    }
  }

  // 5. Explicit indoor connections
  for (const [a, b] of (MAP_DATA.indoorConnections || [])) {
    if (anchors[a] != null && anchors[b] != null) {
      addEdge(anchors[a], anchors[b]);
    }
  }

  return { nodes, edges, anchors };
}

function nearestNode(ll, nodes) {
  let bi = 0, bd = Infinity;
  nodes.forEach((x, i) => {
    const d = hav(ll, x);
    if (d < bd) { bd = d; bi = i; }
  });
  return { i: bi, d: bd, ll: nodes[bi] };
}

function dijkstra(g, start, end) {
  const n = g.nodes.length, dist = Array(n).fill(Infinity), prev = Array(n).fill(-1), used = Array(n).fill(false), adj = Array.from({ length: n }, () => []);
  g.edges.forEach(([a, b, w]) => { adj[a].push([b, w]); adj[b].push([a, w]); });
  dist[start] = 0;

  for (let k = 0; k < n; k++) {
    let u = -1, best = Infinity;
    for (let i = 0; i < n; i++) if (!used[i] && dist[i] < best) { best = dist[i]; u = i; }
    if (u < 0 || u === end) break;
    used[u] = true;
    for (const [v, w] of adj[u]) {
      if (dist[v] > dist[u] + w) {
        dist[v] = dist[u] + w;
        prev[v] = u;
      }
    }
  }

  if (!isFinite(dist[end])) return null;
  const path = [];
  for (let u = end; u !== -1; u = prev[u]) path.push(u);
  path.reverse();
  return { indices: path, distance: dist[end] };
}

async function coveredRoute(start, end) {
  const g = buildCoveredGraph();
  if (!g.nodes.length) throw new Error('No covered paths loaded');
  const ns = nearestNode(start, g.nodes), ne = nearestNode(end, g.nodes), core = dijkstra(g, ns.i, ne.i);
  if (!core) throw new Error('Covered network is disconnected for these locations');

  const [entry, exit] = await Promise.all([
    osrm(start, ns.ll).catch(() => ({ coords: [start, ns.ll], distance: hav(start, ns.ll) })),
    osrm(ne.ll, end).catch(() => ({ coords: [ne.ll, end], distance: hav(ne.ll, end) }))
  ]);

  const coreCoords = core.indices.map(i => g.nodes[i]);
  const coords = [...entry.coords, ...coreCoords, ...exit.coords];
  const distance = entry.distance + core.distance + exit.distance;
  return { coords, distance, duration: distance / 1.25 };
}

function drawRoute(r, kind) {
  return L.polyline(r.coords, {
    color: kind === 'normal' ? '#1976d2' : kind === 'covered' ? '#f0a000' : '#7b61a8',
    weight: kind === 'alternative' ? 4 : 6,
    opacity: 0.88,
    dashArray: kind === 'alternative' ? '8 8' : null,
    lineCap: 'round',
    lineJoin: 'round'
  }).addTo(map);
}

function clearRoutes() {
  [normalLayer, coveredLayer, altLayer].forEach(x => x && map.removeLayer(x));
  normalLayer = coveredLayer = altLayer = null;
  if (startMarker) map.removeLayer(startMarker);
  if (endMarker) map.removeLayer(endMarker);
}

async function plan() {
  clearRoutes();
  const a = getLoc(document.getElementById('start').value);
  const b = getLoc(document.getElementById('destination').value);

  if (!a || !b || a.id === b.id) return;
  const start = a._ll, end = b._ll;

  startMarker = L.marker(start).addTo(map).bindPopup('Start: ' + esc(a.name));
  endMarker = L.marker(end).addTo(map).bindPopup('Destination: ' + esc(b.name));
  map.fitBounds(L.latLngBounds([start, end]).pad(0.25));

  const rec = document.getElementById('recommendation');
  const detail = document.getElementById('recommendationDetail');
  const metrics = document.getElementById('routeMetrics');

  rec.textContent = 'Calculating…';
  detail.textContent = '';
  metrics.textContent = '';

  try {
    const [normal, covered] = await Promise.all([osrm(start, end), coveredRoute(start, end)]);
    const useCovered = weather?.raining ?? false;
    const primary = useCovered ? covered : normal;
    const alt = useCovered ? normal : covered;

    normalLayer = drawRoute(primary, useCovered ? 'covered' : 'normal');
    altLayer = drawRoute(alt, 'alternative');

    rec.textContent = useCovered ? 'Covered route selected' : 'Normal mapped route selected';
    detail.textContent = useCovered
      ? 'Rain/significant rain risk detected. The primary route can use D-Spine and move indoors through B-Dome, C-Wing or A-Wing where that covered network connects.'
      : 'Conditions are dry. The normal mapped route is primary; the covered network is retained as an alternative.';
    metrics.innerHTML = `<b>Primary:</b> ${fmtDist(primary.distance)} • ~${Math.max(1, Math.round(primary.duration / 60))} min<br><b>Alternative:</b> ${fmtDist(alt.distance)} • ~${Math.max(1, Math.round(alt.duration / 60))} min`;
  } catch (e) {
    try {
      const normal = await osrm(start, end);
      normalLayer = drawRoute(normal, 'normal');
      rec.textContent = 'Normal mapped route selected';
      detail.textContent = 'The covered network could not be connected for this pair, so the normal mapped route is shown.';
      metrics.innerHTML = `<b>Distance:</b> ${fmtDist(normal.distance)} • ~${Math.max(1, Math.round(normal.duration / 60))} min`;
    } catch (err) {
      rec.textContent = 'Could not calculate route';
      detail.textContent = 'Check your internet connection and try again.';
      metrics.textContent = err.message;
    }
  }
}

async function refreshWeather() {
  const btn = document.getElementById('weatherBtn');
  btn.disabled = true;
  btn.textContent = 'Loading…';
  try {
    await fetchWeather();
  } catch (e) {
    document.getElementById('weatherMain').textContent = 'Unavailable';
    document.getElementById('weatherDetail').textContent = 'Could not fetch live weather.';
    document.getElementById('weatherStatus').textContent = 'Weather unavailable.';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Refresh weather';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  populate();
  initMap();
  refreshWeather();
  document.getElementById('weatherBtn').onclick = refreshWeather;
  document.getElementById('planBtn').onclick = plan;
  document.getElementById('clearBtn').onclick = clearRoutes;
});
