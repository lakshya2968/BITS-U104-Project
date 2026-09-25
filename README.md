# BITS Goa Weather-Aware Route Planner

This version uses the user's supplied Google Maps screenshot as the map canvas.

## Network rules
- Open paths: visible Google Maps road lines were extracted from the screenshot into a 6-pixel raster navigation grid.
- Covered paths: imported from `bits-goa-map-data (1).json`.
- D-Spine: imported from `bits-goa-map-data.json`, connected in point order, and treated as covered.
- Locations: imported from `bits-goa-map-data.json`.

## Run
Upload all files to GitHub Pages, keeping `map.png`, `index.html`, `script.js`, `style.css`, and `map-data.js` together.

The route engine uses Dijkstra on the screenshot-derived navigation grid. Distances are approximate because this is a screenshot-based map; the scale factor is based on the map zoom shown in the supplied URL.

Weather uses Open-Meteo when the page is online. If weather is unavailable, routing still works.
