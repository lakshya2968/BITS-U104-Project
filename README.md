# BITS Goa Weather-Aware Campus Route Planner v10

A student project for the BITS Pilani K. K. Birla Goa Campus.

## Main idea
Choose a campus start and destination. The app compares:

- Straight-line/geometric distance
- Walkable distance through an explicit campus path network
- Covered/sheltered walkable route
- Open/outdoor walkable route

The app then uses live Open-Meteo weather data to recommend a primary route and retain the other as a backup. If rain starts while an open route is being used, the covered route is presented as the fallback.

## Important map rule
The route network is modeled from the BITS Goa map screenshots supplied for this project.

- **Red D-Spine = covered** (explicitly included in the covered graph)
- **Yellow corridors = covered**
- Grey corridors = open/campus circulation used for the outdoor alternative
- Black dashed line = straight-line geometric comparison only

The D-Spine is not merely a visual overlay; its edges are part of the routing graph and contribute to covered-distance percentage.

## Campus grouping
Selectors group destinations into Campus Facilities, Academic, A-side hostels, C-side hostels, D-side hostels, Mess and Sports.

## v10 update: calibrated from a real Google Maps screenshot
A-Wing, B-Dome, C-Wing, Library, SAC, C-Mess, LT-1/2/3/4 and DH-1/3/4/6 now use
coordinates calibrated from the user's own Google Maps screenshot annotations,
anchored against two real GPS points. Five new spots were added (Sub Spot,
ICE & SPICE, Food King, A-Mess, CC-Lab), along with a newly discovered covered
walkway from the academic core down to A-Mess, a second parallel covered loop
between DH-4 and DH-6, and a short D-Spine extension into DH-4. See
`PROJECT_NOTES.md` for the full list and a known limitation around a few
older junction nodes that weren't part of the recalibration.

## Accuracy note
The official BITS Goa campus/admin material establishes campus landmarks and hostel groups. Most pedestrian/covered-path geometry is modeled from user-supplied screenshots, with a subset now calibrated against real GPS anchor points as described above. It should still not be represented as an official GIS pedestrian network — verify anything safety-critical on site.

## Run locally
Open with VS Code Live Server, or deploy the files to GitHub Pages. Internet access is required for Leaflet tiles and Open-Meteo weather.
