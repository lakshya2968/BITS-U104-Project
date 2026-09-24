# BITS Goa project presentation notes

## Problem statement

A BITS Goa student may walk between hostels, academic buildings, the library, SAC, medical centre, shopping complex and other campus facilities. Weather can change the comfort and practicality of an exposed route.

## Proposed solution

The website compares two route models between BITS Goa landmarks:

- **Covered / sheltered route** — favors building-adjacent academic and student-facility corridors, including the D-side covered connection toward the D-Spine when relevant.
- **Open / outdoor route** — favors lawns, outdoor areas and other open campus corridors, with D-Spine access considered when a trip touches the D-side.
- **D-side hostels** — DH1 through DH6 are selectable endpoints.
- **D-Spine** — modeled as a campus corridor between the B-Dome/auditorium side and the D-block/D-hostel side.

Live weather is sampled at multiple points on both routes. The system calculates a weather-risk score and automatically chooses the lower-risk option as the primary route while keeping the other as the backup.

## Data-analysis component

The application collects, for every route checkpoint:

- latitude / longitude
- temperature
- apparent temperature
- relative humidity
- rain
- rain probability
- wind speed
- weather code / condition
- route mode
- route name
- checkpoint number
- calculated risk score

The CSV export can be analysed in Excel, Google Sheets, Python/pandas or R.

## Good viva explanation

**Input:** BITS Goa start + destination.

**Processing:** generate two route alternatives → sample live weather → transform weather into risk scores → compare route scores.

**Output:** recommended primary route + backup route + map visualization + weather metrics + analysis table + CSV dataset.

## Sources used for the D-side update

- BITS Goa SWD hostel listings confirm DH1–DH6.
- A BITS Goa conference map page describes the D-Spine and the covered path from the D hostels to the D-Spine.

## Future improvements

- Replace approximate route lines with verified BITS Goa pedestrian paths.
- Add actual walking distance/time from a campus routing graph.
- Add hourly forecasts for planned departure time.
- Store observations over many days for trend analysis.
- Plot rain probability vs route selection.
- Plot temperature/wind vs route risk.
- Add preferences such as shortest, most sheltered or lowest weather risk.
