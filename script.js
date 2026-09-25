(function () {
  'use strict';

  const DATA = window.MAP_DATA;
  const GRID = window.ROAD_GRID;
  const S = GRID.cellSize;
  const W = GRID.width;
  const H = GRID.height;
  const G = GRID.grid;

  const $ = (id) => document.getElementById(id);
  const startEl = $('start');
  const endEl = $('end');
  const modeEl = $('routeMode');
  const weatherValue = $('weatherValue');
  const weatherDetail = $('weatherDetail');
  const recommendation = $('recommendation');
  const recommendationDetail = $('recommendationDetail');
  const routeMetrics = $('routeMetrics');
  const locationList = $('locationList');
  const mapStatus = $('mapStatus');

  // Approximate georeferencing for the supplied 1920×1080 campus screenshot.
  // These values are deliberately used only to place the screenshot-derived
  // building markers on the live Leaflet map; they are not survey coordinates.
  const MAP_CENTER = { lat: 15.3913605, lon: 73.879555 };
  const SOURCE_ZOOM = 16.81;
  const SOURCE_CX = 960;
  const SOURCE_CY = 530;
  const WORLD = 256 * Math.pow(2, SOURCE_ZOOM);

  const radians = (d) => d * Math.PI / 180;
  const degrees = (r) => r * 180 / Math.PI;

  function pixelToLatLng(x, y) {
    const lon = MAP_CENTER.lon + (x - SOURCE_CX) / WORLD * 360;
    const y0 = Math.log(Math.tan(Math.PI / 4 + radians(MAP_CENTER.lat) / 2));
    const ym = y0 - (y - SOURCE_CY) / WORLD * 2 * Math.PI;
    const lat = degrees(2 * Math.atan(Math.exp(ym)) - Math.PI / 2);
    return [lat, lon];
  }

  function latLngToPixel(lat, lng) {
    const x = SOURCE_CX + (lng - MAP_CENTER.lon) / 360 * WORLD;
    const y0 = Math.log(Math.tan(Math.PI / 4 + radians(MAP_CENTER.lat) / 2));
    const ym = Math.log(Math.tan(Math.PI / 4 + radians(lat) / 2));
    const y = SOURCE_CY - (ym - y0) * WORLD / (2 * Math.PI);
    return { x, y };
  }

  const map = L.map('map', { preferCanvas: true, zoomControl: true }).setView([MAP_CENTER.lat, MAP_CENTER.lon], 17);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 20,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // IMPORTANT: network/path layers are intentionally NOT added to the map.
  // They remain available to the route engine below, but the visual map stays clean.
  const markerLayer = L.layerGroup().addTo(map);
  const routeLayer = L.layerGroup().addTo(map);

  const locations = DATA.locations.map((p) => ({
    ...p,
    latlng: pixelToLatLng(p.x, p.y)
  }));

  const spine = DATA.paths.find((p) => p.type === 'dspine');
  const dspinePoint = spine?.points?.length ? spine.points[Math.floor(spine.points.length / 2)] : null;
  if (dspinePoint) {
    locations.push({
      id: 'dspine',
      name: 'D-Spine',
      type: 'Covered corridor',
      x: dspinePoint.x,
      y: dspinePoint.y,
      latlng: pixelToLatLng(dspinePoint.x, dspinePoint.y),
      synthetic: true
    });
  }

  const specialNames = new Set(['D-Spine', 'A wing', 'B dome', 'C wing']);
  let weatherIsRainy = false;
  const markerRefs = [];

  function markerIcon(name, special) {
    return L.divIcon({
      className: 'location-marker-host',
      html: `<div class="location-marker ${special ? 'special' : ''}" title="${escapeHtml(name)}"><span class="dot"></span><span class="label">${escapeHtml(name)}</span></div>`,
      iconSize: [170, 34],
      iconAnchor: [8, 17]
    });
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch]));
  }

  function populateSelectors() {
    locations.forEach((p, i) => {
      const a = document.createElement('option');
      a.value = String(i);
      a.textContent = p.name;
      startEl.appendChild(a);

      const b = a.cloneNode(true);
      endEl.appendChild(b);
    });

    const d = locations.findIndex((p) => p.name === 'D-Spine');
    const b = locations.findIndex((p) => p.name === 'B dome');
    startEl.value = String(d >= 0 ? d : 0);
    endEl.value = String(b >= 0 ? b : Math.min(1, locations.length - 1));
  }

  function populateLocationList() {
    locations
      .filter((p) => !p.synthetic)
      .forEach((p, i) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'location-chip';
        chip.textContent = p.name;
        chip.addEventListener('click', () => {
          const idx = locations.indexOf(p);
          startEl.value = String(idx);
          if (+endEl.value === idx) endEl.value = String((idx + 1) % locations.length);
          planPair();
          map.setView(p.latlng, Math.max(map.getZoom(), 17));
        });
        locationList.appendChild(chip);
      });
  }

  function createMarkers() {
    locations.forEach((p, i) => {
      const marker = L.marker(p.latlng, {
        icon: markerIcon(p.name, specialNames.has(p.name)),
        keyboard: false,
        riseOnHover: true
      }).addTo(markerLayer);

      marker.on('click', () => {
        if (i === +startEl.value) return;
        endEl.value = String(i);
        planPair();
      });

      markerRefs.push(marker);
    });
  }

  populateSelectors();
  populateLocationList();
  createMarkers();

  function key(x, y) { return y * W + x; }
  function parseKey(k) { return [k % W, Math.floor(k / W)]; }

  class MinHeap {
    constructor() { this.a = []; }
    push(item) {
      const a = this.a;
      a.push(item);
      let i = a.length - 1;
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (a[p][0] <= item[0]) break;
        a[i] = a[p];
        i = p;
      }
      a[i] = item;
    }
    pop() {
      const a = this.a;
      if (!a.length) return null;
      const top = a[0];
      const last = a.pop();
      if (a.length) {
        let i = 0;
        while (true) {
          const left = i * 2 + 1;
          if (left >= a.length) break;
          const right = left + 1;
          const child = right < a.length && a[right][0] < a[left][0] ? right : left;
          if (a[child][0] >= last[0]) break;
          a[i] = a[child];
          i = child;
        }
        a[i] = last;
      }
      return top;
    }
  }

  // Build an internal covered raster from the supplied path strokes.
  // Nothing from this raster is drawn; it is only used for routing.
  const coveredGrid = G.map((row) => row.split(''));
  function rasterLine(a, b) {
    const x1 = Math.round(a.x / S), y1 = Math.round(a.y / S);
    const x2 = Math.round(b.x / S), y2 = Math.round(b.y / S);
    const n = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
    for (let i = 0; i <= n; i++) {
      const t = n ? i / n : 0;
      const x = Math.round(x1 + (x2 - x1) * t);
      const y = Math.round(y1 + (y2 - y1) * t);
      if (x >= 0 && x < W && y >= 0 && y < H) coveredGrid[y][x] = '2';
    }
  }

  DATA.paths.forEach((p) => {
    if (!p.points?.length) return;
    for (let i = 1; i < p.points.length; i++) rasterLine(p.points[i - 1], p.points[i]);
  });

  const generatedConnectorCells = new Set();
  function buildCoveredConnector() {
    if (!spine?.points?.length) return;
    const target = locations.find((p) => p.name === 'A wing') || locations.find((p) => p.name === 'B dome');
    if (!target) return;

    const starts = [];
    const seen = new Set();
    spine.points.forEach((p) => {
      const x = Math.round(p.x / S), y = Math.round(p.y / S);
      if (x < 0 || x >= W || y < 0 || y >= H) return;
      const k = key(x, y);
      if (!seen.has(k)) { seen.add(k); starts.push(k); }
    });

    const tx = Math.round(target.x / S), ty = Math.round(target.y / S);
    const dist = new Float64Array(W * H);
    dist.fill(Infinity);
    const prev = new Int32Array(W * H);
    prev.fill(-1);
    const heap = new MinHeap();
    starts.forEach((k) => { dist[k] = 0; heap.push([0, k]); });
    const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    let end = -1;

    while (heap.a.length) {
      const [d, k] = heap.pop();
      if (d !== dist[k]) continue;
      const x = k % W, y = Math.floor(k / W);
      if (Math.hypot(x - tx, y - ty) <= 3 && coveredGrid[y][x] === '2') { end = k; break; }
      for (const [dx, dy] of dirs) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || nx >= W || ny < 0 || ny >= H || G[ny][nx] === '0') continue;
        const nk = key(nx, ny);
        const nd = d + Math.hypot(dx, dy) * (G[ny][nx] === '2' ? 1 : 1.05);
        if (nd < dist[nk]) { dist[nk] = nd; prev[nk] = k; heap.push([nd, nk]); }
      }
    }

    if (end < 0) return;
    for (let k = end; k !== -1; k = prev[k]) generatedConnectorCells.add(k);
    generatedConnectorCells.forEach((k) => {
      const [x, y] = parseKey(k);
      coveredGrid[y][x] = '2';
    });
  }
  buildCoveredConnector();

  function snap(point, coveredOnly) {
    const gx = Math.round(point.x / S), gy = Math.round(point.y / S);
    let best = null;
    const allowed = (v) => v !== '0' && (!coveredOnly || v === '2');
    for (let r = 0; r < 100; r++) {
      for (let y = Math.max(0, gy - r); y <= Math.min(H - 1, gy + r); y++) {
        const xs = [Math.max(0, gx - r), Math.min(W - 1, gx + r)];
        for (const x of xs) {
          if (allowed(coveredOnly ? coveredGrid[y][x] : G[y][x])) {
            const d = (x - gx) ** 2 + (y - gy) ** 2;
            if (!best || d < best.d) best = { x, y, d };
          }
        }
      }
      for (let x = Math.max(0, gx - r + 1); x < Math.min(W, gx + r); x++) {
        const ys = [Math.max(0, gy - r), Math.min(H - 1, gy + r)];
        for (const y of ys) {
          if (allowed(coveredOnly ? coveredGrid[y][x] : G[y][x])) {
            const d = (x - gx) ** 2 + (y - gy) ** 2;
            if (!best || d < best.d) best = { x, y, d };
          }
        }
      }
      if (best && best.d <= r * r) return best;
    }
    return best;
  }

  function findRoute(a, b, mode) {
    const coveredOnly = mode === 'covered';
    const start = snap(a, coveredOnly);
    const target = snap(b, coveredOnly);
    if (!start || !target) return null;

    const dist = new Float64Array(W * H);
    dist.fill(Infinity);
    const prev = new Int32Array(W * H);
    prev.fill(-1);
    const heap = new MinHeap();
    const sk = key(start.x, start.y), tk = key(target.x, target.y);
    dist[sk] = 0;
    heap.push([0, sk]);
    const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];

    while (heap.a.length) {
      const [d, k] = heap.pop();
      if (d !== dist[k]) continue;
      if (k === tk) break;
      const x = k % W, y = Math.floor(k / W);
      for (const [dx, dy] of dirs) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
        const typ = G[ny][nx];
        if (typ === '0' || (coveredOnly && coveredGrid[ny][nx] !== '2')) continue;

        let multiplier = 1;
        if (mode === 'weather') {
          multiplier = typ === '2'
            ? (weatherIsRainy ? 0.65 : 1.05)
            : (weatherIsRainy ? 1.40 : 0.95);
        }
        const step = Math.hypot(dx, dy) * S * multiplier;
        const nk = key(nx, ny);
        const nd = d + step;
        if (nd < dist[nk]) {
          dist[nk] = nd;
          prev[nk] = k;
          heap.push([nd, nk]);
        }
      }
    }

    if (!Number.isFinite(dist[tk])) return null;

    const cells = [];
    for (let k = tk; k !== -1; k = prev[k]) {
      cells.push(k);
      if (k === sk) break;
    }
    cells.reverse();

    let meters = 0;
    let covered = 0;
    for (let i = 1; i < cells.length; i++) {
      const [x1, y1] = parseKey(cells[i - 1]);
      const [x2, y2] = parseKey(cells[i]);
      const segment = Math.hypot(x2 - x1, y2 - y1) * S * 1.65;
      meters += segment;
      if ((coveredOnly ? coveredGrid[y2][x2] : G[y2][x2]) === '2') covered += segment;
    }
    return { cells, meters, covered, coveredPct: meters ? covered / meters * 100 : 0 };
  }

  function drawRoute(result, options = {}) {
    if (!result) return;
    const latlngs = result.cells.map((k) => {
      const [x, y] = parseKey(k);
      return pixelToLatLng(x * S, y * S);
    });
    L.polyline(latlngs, {
      color: options.color || '#1769e0',
      weight: options.weight || 7,
      opacity: .96,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(routeLayer);
  }

  function setRouteMarkers(a, b) {
    const aMarker = L.marker(a.latlng, {
      icon: L.divIcon({ className: 'route-start', html: 'A', iconSize: [28,28], iconAnchor: [14,14] }),
      zIndexOffset: 900
    }).addTo(routeLayer);
    const bMarker = L.marker(b.latlng, {
      icon: L.divIcon({ className: 'route-end', html: 'B', iconSize: [28,28], iconAnchor: [14,14] }),
      zIndexOffset: 901
    }).addTo(routeLayer);
    aMarker.bindTooltip(`Start: ${a.name}`, { direction: 'top' });
    bMarker.bindTooltip(`Destination: ${b.name}`, { direction: 'top' });
  }

  function planPair() {
    routeLayer.clearLayers();
    const ai = Number(startEl.value);
    const bi = Number(endEl.value);
    const a = locations[ai];
    const b = locations[bi];
    if (!a || !b) return;

    if (ai === bi) {
      recommendation.textContent = 'Choose two different locations.';
      recommendationDetail.textContent = '';
      routeMetrics.textContent = '—';
      return;
    }

    const mode = modeEl.value;
    const result = findRoute(a, b, mode);
    if (!result) {
      recommendation.textContent = 'No route found';
      recommendationDetail.textContent = mode === 'covered'
        ? 'Those points are not connected by the supplied covered network.'
        : 'Try another pair of locations.';
      routeMetrics.textContent = '—';
      return;
    }

    drawRoute(result);
    setRouteMarkers(a, b);

    if (mode === 'weather') {
      recommendation.textContent = weatherIsRainy ? 'Rain-aware route selected' : 'Normal-weather route selected';
      recommendationDetail.textContent = weatherIsRainy
        ? 'The planner gives extra preference to covered cells.'
        : 'Current conditions do not strongly penalize open cells.';
    } else if (mode === 'covered') {
      recommendation.textContent = 'Covered route selected';
      recommendationDetail.textContent = 'Only the supplied covered network is used.';
    } else {
      recommendation.textContent = 'Normal route selected';
      recommendationDetail.textContent = 'Open and covered network cells are available.';
    }
    routeMetrics.innerHTML = `${result.meters.toFixed(0)} m <span class="muted">·</span> ${result.coveredPct.toFixed(0)}% covered`;
  }

  function planAllCovered() {
    routeLayer.clearLayers();
    const order = ['D-Spine', 'A wing', 'B dome', 'C wing'];
    let total = 0;
    let covered = 0;
    const legs = [];

    for (let i = 0; i < order.length - 1; i++) {
      const a = locations.find((p) => p.name === order[i]);
      const b = locations.find((p) => p.name === order[i + 1]);
      const result = findRoute(a, b, 'covered');
      if (!result) {
        recommendation.textContent = `No covered route: ${order[i]} → ${order[i + 1]}`;
        recommendationDetail.textContent = 'That leg is not connected by the supplied covered network.';
        routeMetrics.textContent = '—';
        return;
      }
      drawRoute(result, { weight: 8 });
      total += result.meters;
      covered += result.covered;
      legs.push(`${order[i]} → ${order[i + 1]}: ${result.meters.toFixed(0)} m`);
    }

    const a = locations.find((p) => p.name === order[0]);
    const b = locations.find((p) => p.name === order[order.length - 1]);
    setRouteMarkers(a, b);
    recommendation.textContent = 'Quick covered route created';
    recommendationDetail.textContent = 'D-Spine → A Wing → B Dome → C Wing';
    routeMetrics.innerHTML = `${total.toFixed(0)} m <span class="muted">·</span> ${(covered / total * 100).toFixed(0)}% covered<br><span class="small-text">${legs.join(' · ')}</span>`;
    startEl.value = String(locations.indexOf(a));
    endEl.value = String(locations.indexOf(b));
    modeEl.value = 'covered';
  }

  function weatherText(code) {
    if (code === 0) return 'Clear';
    if (code <= 3) return 'Cloudy';
    if (code <= 48) return 'Foggy';
    if (code <= 67) return 'Rain';
    if (code <= 77) return 'Snow/Hail';
    if (code <= 82) return 'Showers';
    if (code <= 99) return 'Thunderstorm';
    return 'Unknown';
  }

  async function fetchWeather() {
    weatherValue.textContent = 'Loading…';
    try {
      const url = 'https://api.open-meteo.com/v1/forecast?latitude=15.3914&longitude=73.8796&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m&hourly=precipitation_probability&forecast_days=1&timezone=Asia%2FKolkata';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Weather request failed');
      const data = await response.json();
      const current = data.current;
      const hourly = data.hourly;
      const index = Math.max(0, hourly.time.findIndex((t) => t >= current.time));
      const probability = index >= 0 ? hourly.precipitation_probability[index] : 0;

      weatherIsRainy = current.rain > 0 || current.precipitation > 0 || probability >= 45 || current.weather_code >= 51;
      weatherValue.textContent = `${Math.round(current.temperature_2m)}°C · ${weatherText(current.weather_code)}`;
      weatherDetail.textContent = `Feels ${Math.round(current.apparent_temperature)}°C · Rain ${current.rain} mm · ${probability}% chance · Wind ${Math.round(current.wind_speed_10m)} km/h`;
      mapStatus.textContent = weatherIsRainy ? 'Rain-aware mode available' : 'Map ready';

      if (modeEl.value === 'weather') planPair();
    } catch (error) {
      weatherIsRainy = false;
      weatherValue.textContent = 'Weather unavailable';
      weatherDetail.textContent = 'You can still use covered or normal routing.';
      mapStatus.textContent = 'Map ready';
    }
  }

  $('planBtn').addEventListener('click', planPair);
  $('allCoveredBtn').addEventListener('click', planAllCovered);
  $('clearBtn').addEventListener('click', () => {
    routeLayer.clearLayers();
    recommendation.textContent = 'Choose two locations.';
    recommendationDetail.textContent = '';
    routeMetrics.textContent = '—';
  });
  $('weatherBtn').addEventListener('click', fetchWeather);
  startEl.addEventListener('change', planPair);
  endEl.addEventListener('change', planPair);
  modeEl.addEventListener('change', planPair);

  map.whenReady(() => setTimeout(() => map.invalidateSize(), 120));
  fetchWeather();
})();
