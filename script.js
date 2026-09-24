const API_KEY = "YOUR_OPENWEATHER_API_KEY";

// 1. Defined destinations
const destinations = [
  { id: 1, name: "Panaji Central", lat: 15.4989, lon: 73.8278 },
  { id: 2, name: "Calangute Hub", lat: 15.5442, lon: 73.7550 },
  { id: 3, name: "Vasco South Zone", lat: 15.3959, lon: 73.8157 }
];

// 2. Initialize Leaflet Map
const map = L.map('map').setView([15.4500, 73.8000], 11);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// 3. Draw Covered Areas (Circle representing covered service zone)
const coveredArea = L.circle([15.4500, 73.8000], {
  color: '#28a745',
  fillColor: '#28a745',
  fillOpacity: 0.2,
  radius: 15000 // 15 km radius
}).addTo(map).bindPopup("Operational Coverage Area");

// 4. Populate Dropdown & Markers
const selectEl = document.getElementById('destination');

destinations.forEach(loc => {
  // Add dropdown option
  const opt = document.createElement('option');
  opt.value = loc.id;
  opt.textContent = loc.name;
  selectEl.appendChild(opt);

  // Add marker on map
  L.marker([loc.lat, loc.lon])
    .addTo(map)
    .bindPopup(`<b>${loc.name}</b>`);
});

// 5. Handle Selection & Weather Fetch
selectEl.addEventListener('change', async (e) => {
  const selectedId = e.target.value;
  if (!selectedId) return;

  const target = destinations.find(d => d.id == selectedId);
  
  // Pan map to location
  map.flyTo([target.lat, target.lon], 13);

  // Fetch Weather
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${target.lat}&lon=${target.lon}&appid=${API_KEY}&units=metric`
    );
    const data = await res.json();
    displayResult(target.name, data);
  } catch (err) {
    console.error("Error fetching weather:", err);
  }
});

function displayResult(name, data) {
  const card = document.getElementById('weather-card');
  const temp = Math.round(data.main.temp);
  const condition = data.weather[0].main;

  document.getElementById('loc-name').textContent = name;
  document.getElementById('loc-temp').textContent = temp;
  document.getElementById('loc-cond').textContent = data.weather[0].description;

  const adviceEl = document.getElementById('loc-advice');
  if (condition === 'Rain' || condition === 'Drizzle' || condition === 'Thunderstorm') {
    adviceEl.textContent = "🌧️ Weather Alert: Rainy conditions expected. Travel with caution.";
    adviceEl.className = "advice warn";
  } else if (temp > 35) {
    adviceEl.textContent = "☀️ High Heat: Ensure hydration if traveling outside.";
    adviceEl.className = "advice warn";
  } else {
    adviceEl.textContent = "✅ Excellent weather conditions for travel!";
    adviceEl.className = "advice good";
  }

  card.classList.remove('hidden');
}
