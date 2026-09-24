# BITS Goa Weather-Aware Route Planner

A college-level web project for BITS Pilani K. K. Birla Goa Campus.

## What this version does

1. Select a starting landmark and destination.
2. Builds two route models:
   - **Covered / sheltered route**: modeled through academic/indoor-adjacent campus landmarks.
   - **Open route**: modeled through outdoor/open-space landmarks.
3. Fetches current weather for multiple checkpoints on both routes.
4. Calculates a project-specific weather risk score.
5. Automatically selects the lower-risk route as the **primary route**.
6. Keeps the other route visible as the **backup route**.
7. Shows temperature, apparent temperature, rain, rain probability, humidity and wind.
8. Displays colored weather checkpoints on the Leaflet map.
9. Exports route/weather observations as CSV for data-analysis work.

## Run locally

Open the folder in VS Code and use Live Server, or serve the folder with any local web server.

Example:

```bash
python -m http.server 8000
```

Then open http://localhost:8000 in a browser.

## Deploy on GitHub Pages

Upload these files to your repository root:

- `index.html`
- `style.css`
- `script.js`

Then enable GitHub Pages from the repository's Pages settings.

## Important project limitation

The route geometry is intentionally a **student-project model**, not an official BITS pedestrian navigation dataset. The landmark names are based on BITS Goa campus information and the published campus map, while the coordinates are approximate points used to demonstrate route/weather analysis. Before presenting the project as a real navigation system, replace the modeled paths with verified pedestrian-path data from the campus.

## Weather API

The project uses Open-Meteo, so there is no API key in the frontend.

## Suggested viva explanation

**Input:** start + destination.

**Processing:** create two route alternatives → sample weather at checkpoints → compute risk score → compare routes.

**Output:** primary route + backup route + map + weather table + CSV dataset.

This makes the project more than a map: it demonstrates data collection, data transformation, a simple decision model, visualization and export for analysis.

## Sources

- BITS Pilani Goa campus official site: https://www.bits-pilani.ac.in/goa/about-us/
- BITS Goa campus facilities: https://www.bits-pilani.ac.in/goa/campus-facilities/
- Published BITS Goa campus map / campus information: https://universe.bits-pilani.ac.in/uploads/campusinfo.pdf
- Weather API: https://open-meteo.com/
- Map tiles: https://www.openstreetmap.org/
- Map library: https://leafletjs.com/
