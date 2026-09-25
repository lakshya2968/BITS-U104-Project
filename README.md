# BITS Goa Weather-Aware Route Planner

This version uses an actual interactive OpenStreetMap base map.

## Key behavior
- **Dry/clear weather:** the normal mapped route is primary.
- **Rain or significant rain probability:** the covered route is primary.
- The covered network includes the marked **D-Spine** and covered paths.
- The planner allows movement **inside B-Dome, C-Wing and A-Wing** as covered/indoor connectors.
- Example: **DH-side → D-Spine → B-Dome → LT 3 & 4** can be selected as the rainy route when those locations are connected by the covered network.
- The non-selected route is shown as a dashed alternative.
- Current temperature, feels-like temperature, humidity, rain, rain probability and wind are shown beside the map.

## GitHub Pages
Upload all files in this folder to the repository root. Do not upload the ZIP itself.

Internet access is required for OpenStreetMap tiles, OSRM routing and Open-Meteo weather.

## Note
The covered/indoor network is a student-project model based on the manually marked campus paths supplied for the project. It is not an official BITS pedestrian-routing guarantee.
