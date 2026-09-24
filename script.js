// ============================================================
// WEATHER ROUTE PLANNER
// No API key is required: this project uses Open-Meteo.
// To use your own locations, edit the LOCATIONS array below.
// ============================================================

const LOCATIONS = [
  {
    id: "panaji",
    name: "Panaji Central",
    lat: 15.4909,
    lon: 73.8278
  },
  {
    id: "calangute",
    name: "Calangute Hub",
    lat: 15.5442,
    lon: 73.7550
  },
  {
    id: "vasco",
    name: "Vasco South Zone",
    lat: 15.3959,
    lon: 73.8157
  },
  {
    id: "margao",
    name: "Margao Central",
    lat: 15.2832,
    lon: 73.9862
  }
];

const COVERAGE_RADIUS_KM = 3;

let map;
let routeLayer = null;
let coverageLayers = [];
let routeMarkers = [];

const startSelect = document.getElementById("start");
const destinationSelect = document.getElementById("destination");
const analyseBtn = document.getElementById("analyseBtn");
const statusBox = document.getElementById("status");

function init() {
  // Create map
  map = L.map("map").setView([15.45, 73.85], 11);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  // Add all predefined locations
  LOCATIONS.forEach(location => {
    const marker = L.marker([location.lat, location.lon]).addTo(map);
    marker.bindPopup(`<b>${escapeHtml(location.name)}</b>`);
  });

  // Populate dropdowns
  LOCATIONS.forEach(location => {
    const startOption = document.createElement("option");
    startOption.value = location.id;
    startOption.textContent = location.name;
    startSelect.appendChild(startOption);

    const destinationOption = document.createElement("option");
    destinationOption.value = location.id;
    destinationOption.textContent = location.name;
    destinationSelect.appendChild(destinationOption);
  });

  // Sensible defaults
  startSelect.value = "panaji";
  destinationSelect.value = "calangute";

  analyseBtn.addEventListener("click", analyseRoute);
}

async function analyseRoute() {
  const start = getLocation(startSelect.value);
  const destination = getLocation(destinationSelect.value);

  if (!start || !destination) {
    showStatus("Please select both a starting location and destination.");
    return;
  }

  if (start.id === destination.id) {
    showStatus("Starting location and destination cannot be the same.");
    return;
  }

  setLoading(true);
  clearRoute();

  try {
    showStatus("Calculating route areas and fetching current weather...");

    // Create 5 points between start and destination.
    const routePoints = createRoutePoints(start, destination, 5);

    // Fetch current weather for every route point.
    const weatherData = await Promise.all(
      routePoints.map(point => fetchWeather(point))
    );

    drawRoute(routePoints, weatherData);
    renderResults(start, destination, routePoints, weatherData);

    hideStatus();
  } catch (error) {
    console.error(error);
    showStatus(
      "Could not load weather data. Check your internet connection and try again."
    );
  } finally {
    setLoading(false);
  }
}

function createRoutePoints(start, destination, numberOfPoints) {
  const points = [];

  for (let i = 0; i < numberOfPoints; i++) {
    const t = i / (numberOfPoints - 1);

    points.push({
      name:
        i === 0
          ? start.name
          : i === numberOfPoints - 1
            ? destination.name
            : `Route Area ${i}`,
      lat: start.lat + (destination.lat - start.lat) * t,
      lon: start.lon + (destination.lon - start.lon) * t,
      index: i
    });
  }

  return points;
}

async function fetchWeather(point) {
  const url =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${point.lat}` +
    `&longitude=${point.lon}` +
    "&current=temperature_2m,relative_humidity_2m,apparent_temperature," +
    "precipitation,rain,weather_code,wind_speed_10m" +
    "&timezone=auto";

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Weather request failed: ${response.status}`);
  }

  const json = await response.json();

  return {
    point,
    temperature: json.current.temperature_2m,
    humidity: json.current.relative_humidity_2m,
    apparentTemperature: json.current.apparent_temperature,
    precipitation: json.current.precipitation,
    rain: json.current.rain,
    weatherCode: json.current.weather_code,
    wind: json.current.wind_speed_10m,
    condition: weatherCodeToText(json.current.weather_code)
  };
}

function drawRoute(points, weatherData) {
  const latLngs = points.map(p => [p.lat, p.lon]);

  // Draw route as separate coloured segments.
  for (let i = 0; i < weatherData.length - 1; i++) {
    const segmentScore = Math.max(
      getWeatherRisk(weatherData[i]),
      getWeatherRisk(weatherData[i + 1])
    );

    const segmentColor =
      segmentScore >= 60 ? "#dc2626" :
      segmentScore >= 30 ? "#f59e0b" :
      "#16a34a";

    L.polyline(
      [
        [points[i].lat, points[i].lon],
        [points[i + 1].lat, points[i + 1].lon]
      ],
      {
        color: segmentColor,
        weight: 7,
        opacity: 0.85
      }
    ).addTo(map);
  }

  // Add coverage circles and route markers.
  weatherData.forEach(item => {
    const risk = getWeatherRisk(item);

    const circleColor =
      risk >= 60 ? "#dc2626" :
      risk >= 30 ? "#f59e0b" :
      "#16a34a";

    const circle = L.circle(
      [item.point.lat, item.point.lon],
      {
        radius: COVERAGE_RADIUS_KM * 1000,
        color: circleColor,
        fillColor: circleColor,
        fillOpacity: 0.14,
        weight: 2
      }
    ).addTo(map);

    coverageLayers.push(circle);

    const marker = L.circleMarker(
      [item.point.lat, item.point.lon],
      {
        radius: 7,
        color: circleColor,
        fillColor: circleColor,
        fillOpacity: 1,
        weight: 2
      }
    ).addTo(map);

    marker.bindPopup(`
      <b>${escapeHtml(item.point.name)}</b><br>
      ${escapeHtml(item.condition)}<br>
      Temperature: ${round(item.temperature)}°C<br>
      Rain: ${round(item.rain)} mm<br>
      Wind: ${round(item.wind)} km/h
    `);

    routeMarkers.push(marker);
  });

  const bounds = L.latLngBounds(latLngs);
  map.fitBounds(bounds.pad(0.25));
}

function renderResults(start, destination, points, weatherData) {
  const distance = calculateRouteDistance(points);

  const avgTemp =
    weatherData.reduce((sum, item) => sum + item.temperature, 0) /
    weatherData.length;

  const maxRain = Math.max(...weatherData.map(item => item.rain));
  const averageRisk =
    weatherData.reduce((sum, item) => sum + getWeatherRisk(item), 0) /
    weatherData.length;

  const badge = document.getElementById("routeBadge");
  const advice = document.getElementById("advice");

  document.getElementById("distanceValue").textContent =
    `${round(distance)} km`;

  document.getElementById("temperatureValue").textContent =
    `${round(avgTemp)}°C`;

  document.getElementById("rainValue").textContent =
    `${round(maxRain)} mm`;

  document.getElementById("areasValue").textContent =
    `${points.length}`;

  const classification = getClassification(averageRisk);

  badge.textContent = classification.label;
  badge.className = `badge ${classification.className}`;

  advice.innerHTML = buildAdvice(
    start,
    destination,
    averageRisk,
    maxRain,
    avgTemp
  );

  const weatherList = document.getElementById("weatherList");
  weatherList.innerHTML = "";

  weatherData.forEach(item => {
    const risk = getWeatherRisk(item);

    const row = document.createElement("div");
    row.className = "weather-row";

    row.innerHTML = `
      <div>
        <div class="weather-name">${escapeHtml(item.point.name)}</div>
        <div class="weather-meta">
          ${escapeHtml(item.condition)} ·
          Humidity ${round(item.humidity)}% ·
          Wind ${round(item.wind)} km/h
        </div>
      </div>
      <div class="weather-temp">
        ${round(item.temperature)}°C<br>
        <small>${riskLabel(risk)}</small>
      </div>
    `;

    weatherList.appendChild(row);
  });

  document.getElementById("result").classList.remove("hidden");
}

function buildAdvice(start, destination, risk, maxRain, avgTemp) {
  let message;

  if (risk >= 60) {
    message =
      "⚠️ Several route areas currently have weather conditions that may make travel uncomfortable. Check the latest forecast before leaving.";
  } else if (risk >= 30) {
    message =
      "🌦️ Some route areas have moderate weather risk. Carry suitable protection and keep an eye on changing conditions.";
  } else {
    message =
      "✅ Current conditions along the analysed route are relatively favourable.";
  }

  return `
    <strong>${escapeHtml(start.name)} → ${escapeHtml(destination.name)}</strong><br>
    ${message}<br><br>
    Average temperature: <strong>${round(avgTemp)}°C</strong>.
    Highest current rain value: <strong>${round(maxRain)} mm</strong>.
    <br><small>
      This is an analytical project score based on the weather variables fetched
      from the API; it is not an official travel-safety warning.
    </small>
  `;
}

function getWeatherRisk(weather) {
  let score = 0;

  // Rain / precipitation
  if (weather.rain >= 4) score += 45;
  else if (weather.rain >= 1) score += 25;
  else if (weather.rain > 0) score += 10;

  // Weather code
  if ([95, 96, 99].includes(weather.weatherCode)) score += 50;
  else if ([65, 67, 80, 81, 82].includes(weather.weatherCode)) score += 30;
  else if ([51, 53, 55, 56, 57].includes(weather.weatherCode)) score += 15;

  // Strong wind
  if (weather.wind >= 40) score += 20;
  else if (weather.wind >= 25) score += 10;

  // Heat
  if (weather.temperature >= 38) score += 20;
  else if (weather.temperature >= 35) score += 10;

  return Math.min(score, 100);
}

function getClassification(risk) {
  if (risk >= 60) {
    return { label: "Higher weather risk", className: "risky" };
  }

  if (risk >= 30) {
    return { label: "Moderate weather risk", className: "moderate" };
  }

  return { label: "Favourable conditions", className: "good" };
}

function riskLabel(risk) {
  if (risk >= 60) return "Higher risk";
  if (risk >= 30) return "Moderate";
  return "Low risk";
}

function calculateRouteDistance(points) {
  let total = 0;

  for (let i = 0; i < points.length - 1; i++) {
    total += haversine(
      points[i].lat,
      points[i].lon,
      points[i + 1].lat,
      points[i + 1].lon
    );
  }

  return total;
}

function haversine(lat1, lon1, lat2, lon2) {
  const earthRadius = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return 2 * earthRadius * Math.asin(Math.sqrt(a));
}

function toRadians(value) {
  return value * Math.PI / 180;
}

function weatherCodeToText(code) {
  const map = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with hail",
    99: "Thunderstorm with heavy hail"
  };

  return map[code] || "Unknown weather";
}

function getLocation(id) {
  return LOCATIONS.find(location => location.id === id);
}

function clearRoute() {
  coverageLayers.forEach(layer => map.removeLayer(layer));
  routeMarkers.forEach(marker => map.removeLayer(marker));

  coverageLayers = [];
  routeMarkers = [];

  // Remove every existing polyline created by this application.
  map.eachLayer(layer => {
    if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
      map.removeLayer(layer);
    }
  });
}

function setLoading(isLoading) {
  analyseBtn.disabled = isLoading;
  analyseBtn.textContent = isLoading ? "Analysing..." : "Analyse Route";
}

function showStatus(message) {
  statusBox.textContent = message;
  statusBox.classList.remove("hidden");
}

function hideStatus() {
  statusBox.classList.add("hidden");
}

function round(value) {
  return Number(value).toFixed(1);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

init();
