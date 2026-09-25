# Project Notes — v9

## Changes from v8
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
