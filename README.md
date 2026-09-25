# BITS Goa Weather-Aware Campus Route Planner v9

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

## Accuracy note
The official BITS Goa campus/admin material establishes campus landmarks and hostel groups, while the pedestrian/covered-path geometry in this student project is modeled from the supplied screenshots. It should not be represented as an official GIS pedestrian network.

## Run locally
Open with VS Code Live Server, or deploy the files to GitHub Pages. Internet access is required for Leaflet tiles and Open-Meteo weather.
