# Project Notes — v10

## Changes from v9
- Calibrated real GPS coordinates for A-Wing, B-Dome, C-Wing, Library, SAC, C-Mess,
  LT-1/2/3/4, and DH-1/DH-3/DH-4/DH-6, using two real anchor points the user supplied
  (Main-Gate-area/DH-6 and SAC) fitted against the user's Google Maps screenshot
  annotations (`bits-goa-map-data.json` / `bits-goa-map-data (1).json`).
- DH-2 and DH-5 weren't individually marked in that screenshot; they were nudged by
  the average offset of their calibrated neighbors so the hostel row stays visually
  coherent. They are not independently calibrated — flagged in code comments.
- Added 5 new locations traced from the screenshot: Sub Spot, ICE & SPICE, Food King
  (food outlets), A-Mess (previously missing from the Mess group), and CC-Lab
  (a computer lab near Computer Centre).
- Added a new covered walkway (chain `AWC-*`) connecting the academic core
  (B-Dome / ICE & SPICE) down to the A-side hostel area and A-Mess — this route
  didn't exist in the network before.
- Refined the academic-corridor covered path (LT-3/4 → B-Dome → C-Wing → LT-1/2)
  and added a second parallel covered loop between DH-4 and DH-6, both traced
  directly from the screenshot's drawn paths.
- Added a short D-Spine bridge segment (`DSPBR-*`) connecting the existing spine
  near D-5 directly into the recalibrated DH-4, from the screenshot's "dspine"-typed
  path data.
- Added open-path alternatives for the new spots (Sub Spot, CC-Lab, Food King,
  ICE & SPICE, A-Mess) so an uncovered route option exists even where the new
  covered walkway also reaches them.
- Bumped cache-busting query param to v=10.

## Known limitation
Coordinates for path-only junction nodes that weren't part of the newly supplied
screenshot (e.g. D-West, D-1…D-East, D-South, D-Dorm, D-Mess) were left unchanged.
Since nearby buildings shifted by up to ~150-200m during calibration, a few of
these older connecting edges may look slightly less straight on the map than
before. This doesn't affect routing correctness, only visual straightness — send
more real GPS anchor points if you want these recalibrated too.

## Changes from v8 (superseded by v9, kept for history)
- D-Spine is now explicitly classified as a covered path in the graph.
- D-Spine edges are included in `COVERED_PATHS` and therefore in `coveredPairs`.
- D-Spine is no longer added as a separate open-only edge.
- Added a more detailed D-side network with D-West/D-1...D-East and D-South/D-Dorm junctions.
- Kept straight-line distance separate from walkable distance.
- Covered and open routes are computed on the same explicit campus graph with different route costs.
- The recommendation includes a rain fallback: if open is selected, covered is the backup; if covered is selected, open remains the alternative for drier conditions.
- The map labels the D-Spine as covered.

## Source/reference notes
- User-supplied screenshots are the geometry reference for red D-Spine and yellow covered paths.
- BITS Goa official/admin sources are used for campus naming and hostel group context.
- OpenStreetMap is the visual basemap only.
- Open-Meteo supplies current weather values.
