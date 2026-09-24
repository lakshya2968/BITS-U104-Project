# BITS Goa Weather-Aware Campus Route Planner

A BITS Pilani K. K. Birla Goa Campus student project that compares two route models between campus landmarks using current weather data.

## What is fixed in this version

- Removed the old Goa-city demo/test destinations completely.
- All selectable locations are BITS Goa campus landmarks.
- The map is centered on the BITS Goa campus.
- The route engine creates two BITS Goa-specific alternatives:
  - **Covered / sheltered route**: favors the Main Building, Library Complex, Computer Center, Lecture Theatres, Auditorium, Dome, Plaza and SAC corridor.
  - **Open / outdoor route**: favors Central Lawns, Shopping Complex, Medical Centre, Playground, C-Mess and the D-side area.
  - **D-side hostels**: DH-1 through DH-6 are included as selectable start/destination points.
  - **D-Spine**: when a trip touches the D-side, the covered route explicitly considers the D-Spine as a route corridor; the open alternative also considers D-Spine access as a navigation landmark.
- The lower weather-risk option is automatically shown as the **primary route**.
- The other route remains visible as the **backup route**.
- Weather checkpoints are shown along both routes.
- Current temperature, apparent temperature, humidity, rain, rain probability and wind are displayed.
- A route-risk score is calculated from rain, rain probability, heat, wind and storm indicators.
- CSV export contains the sampled weather data for data-analysis work.
- No weather API key is required; the project uses Open-Meteo.

## Run locally

Use VS Code Live Server, or:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## GitHub Pages

Upload `index.html`, `style.css` and `script.js` to the repository root and enable GitHub Pages.

The HTML uses `script.js?v=4` so browsers are less likely to keep an older cached JavaScript file after deployment. If GitHub Pages still shows an old interface, hard-refresh the page (`Ctrl + F5`).

## Project logic

1. User chooses a BITS Goa start point and destination.
2. The app builds a covered/sheltered route model and an open/outdoor route model.
3. Several checkpoints are sampled along each route.
4. Open-Meteo supplies current weather for each checkpoint.
5. Each checkpoint gets a 0–100 weather-risk score.
6. Route scores are calculated from the checkpoint scores with exposure adjustments.
7. Lower score becomes primary; the other route is the backup.
8. The map, recommendation, statistics and CSV are updated.

## Important accuracy note

BITS Goa's official published campus information/map was used to select landmark names. The coordinates and walking lines in this student project are **approximate route-model points**, not an official BITS pedestrian navigation dataset. BITS Goa sources confirm DH1–DH6 and describe the D-Spine as the corridor connecting the B-Dome/auditorium side to the D block; the exact plotted pedestrian coordinates still need verification against a campus path/GIS map. For a real navigation application, the next upgrade would be to replace the modeled lines with verified pedestrian paths or a campus GIS/path network.

## Official campus information used

- BITS Pilani Goa Campus: https://www.bits-pilani.ac.in/goa/about-us/
- BITS Goa Campus Facilities: https://www.bits-pilani.ac.in/goa/campus-facilities/
- BITS Goa SWD/hostel information: https://swd.bits-goa.ac.in/contact/
- BITS Goa D-Spine / campus walking information: https://sites.google.com/goa.bits-pilani.ac.in/map-contacts-info-ismc26goa?usp=sharing
- Published BITS Goa campus map/information: https://universe.bits-pilani.ac.in/uploads/campusinfo.pdf
- Weather: https://open-meteo.com/
- Maps: https://www.openstreetmap.org/
- Leaflet: https://leafletjs.com/
