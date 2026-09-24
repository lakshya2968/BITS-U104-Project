# BITS Goa Weather-Aware Campus Route Planner — Path Network v5

This version is BITS Goa-centric and no longer uses the old Goa-city demo locations.

## What changed in v5

- Reworked the landmark layout to better match the published BITS Goa campus maps.
- Removed the earlier diagonal/straight-line route construction that could cut through buildings or lawns.
- Added an explicit **campus path network** with junctions between the gate, academic area, A/C/AH hostel areas and D-side.
- Added **all current student-hostel selections used by this model**: AH1–AH9, CH1–CH7 and DH1–DH6.
- Added **D-Spine South → Mid → North** as an explicit route corridor.
- Added the two covered-path concepts documented by BITS Goa's current walking/conference information:
  - **C-hostels → Main Building / B-Dome**
  - **D-hostels → D-Spine**
- Covered links are drawn in teal; D-Spine is purple.
- The route engine now uses a shortest-path graph rather than interpolating a direct line between two buildings.
- Covered mode gives documented covered links a lower routing cost; open mode favors normal outdoor circulation while still allowing covered links if they are the only practical connection.
- Weather is sampled along the actual selected graph path for both route modes.
- The lower weather-risk route is shown as primary; the other remains the backup.
- CSV export remains available for the data-analysis part of the project.

## Important path-accuracy note

BITS Goa's public material confirms the campus landmarks and explicitly describes two covered pathways for rain/humid weather. It does not publish a machine-readable pedestrian GIS network. Therefore the path graph in this student project is a **verified-concept + approximate-coordinate model**, not an official navigation service.

If a BITS Goa student provides a current campus pedestrian map or tells us that a particular connector is missing/wrong, the path graph can be edited in one place: `OPEN_EDGES` and `COVERED_EDGES` in `script.js`.

## Run locally

Use VS Code Live Server, or:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Data-analysis component

The app records for each weather checkpoint:

- route mode
- route name
- checkpoint number
- latitude / longitude
- temperature
- apparent temperature
- humidity
- rain
- rain probability
- wind
- weather condition/code
- calculated risk score

Use the CSV in Excel, Google Sheets, Python/pandas or R for graphs and analysis.

## Sources

- BITS Goa official campus overview: https://www.bits-pilani.ac.in/goa/about-us/
- BITS Goa campus facilities: https://www.bits-pilani.ac.in/goa/campus-facilities/
- BITS Goa SWD hostel listings: https://swd.bits-goa.ac.in/contact/
- BITS Goa map / walking information: https://sites.google.com/goa.bits-pilani.ac.in/map-contacts-info-ismc26goa?usp=sharing
- Published BITS Goa campus map: https://universe.bits-pilani.ac.in/uploads/campusinfo.pdf
- Weather: https://open-meteo.com/
- Map tiles: https://www.openstreetmap.org/
- Leaflet: https://leafletjs.com/
