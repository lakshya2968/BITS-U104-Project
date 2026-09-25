# BITS Goa Route Planner

A screenshot-derived BITS Pilani Goa Campus route planner.

## What this version does
- Marks the supplied campus locations approximately on a clean Leaflet/OpenStreetMap map.
- Keeps all covered/open path geometry hidden from the map until a route is requested.
- Uses the supplied path/grid data internally for routing.
- Supports covered-only, normal, and weather-aware routing.
- Shows only the selected route plus A/B route endpoints.
- Includes a quick D-Spine → A Wing → B Dome → C Wing route.
- Fetches current weather from Open-Meteo.

The marker positions and route geometry are approximate and should not be treated as survey-grade coordinates.
