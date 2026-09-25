# BITS Goa Weather-Aware Route Planner

This version uses an **actual interactive OpenStreetMap base map** instead of the uploaded screenshot.

## Features
- Real OpenStreetMap campus/road map.
- Normal walking route from the OSRM routing service.
- Covered-path overlay from the manually marked JSON data supplied for this project.
- D-Spine is treated as covered.
- Live BITS Goa weather from Open-Meteo.
- If rain or significant rain probability is detected, the covered route is selected.
- If conditions are dry, the normal road route is selected.
- The other route is displayed as a dashed alternative.

## GitHub Pages
Upload all files in this folder to the repository root. Do **not** upload the ZIP itself.

## Important
Internet access is required because the page loads OpenStreetMap tiles, OSRM walking routes and Open-Meteo weather data.

Sources/services: OpenStreetMap, OSRM, Open-Meteo.
