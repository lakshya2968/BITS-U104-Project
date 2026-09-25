# BITS Goa Covered Route Planner

This revision replaces the screenshot-only map canvas with an interactive Leaflet/OpenStreetMap map.

## What changed
- Interactive street map instead of `map.png` as the map background.
- Supplied covered strokes are displayed as a **Covered paths** layer.
- D-Spine is displayed separately and treated as covered.
- Added **Covered only** routing mode: open-road cells are excluded.
- Added a **D-Spine → A Wing → B Dome → C Wing** multi-stop covered route button.
- Added a small generated connector where the supplied D-Spine covered stroke is disconnected from the supplied A/B/C covered network. It is shown as an orange dashed line so it is not confused with the user-marked covered strokes.
- Existing locations and the screenshot-derived navigation grid are retained and georeferenced to the supplied Google Maps center/zoom.
- Weather-aware and open+covered modes remain available.

## Files
Keep these files together on GitHub Pages:
- `index.html`
- `script.js`
- `style.css`
- `map-data.js`

`map.png` is no longer required by the app.

## Map provider
The app uses Leaflet with OpenStreetMap tiles. No Google Maps API key is required.

## Accuracy note
The route network was originally digitized from the supplied 1920x1080 Google Maps screenshot. The live map is georeferenced using the center/zoom from that view, so the overlay is approximate rather than survey-grade.
