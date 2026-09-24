# Project presentation notes

## Problem statement
Students may have to walk between hostels, academic blocks, the library, SAC, medical centre and other campus locations. Rain, storms, high heat or strong wind can make an exposed route less comfortable than a sheltered alternative.

## Proposed solution
The application compares a covered/sheltered route and an open route, samples current weather at route checkpoints, calculates a risk score and presents one as the primary route while retaining the other as a backup.

## Data-analysis component
The project collects:
- temperature
- apparent temperature
- humidity
- rain
- rain probability
- wind speed
- weather code
- route mode
- checkpoint

The CSV export can be opened in Excel, Google Sheets, Python/pandas or R for further analysis.

## Future improvements
- Use a verified BITS Goa pedestrian path network.
- Add route distance/time from a routing engine.
- Add hourly forecasts for the next few hours.
- Store observations over several days and plot weather-vs-route-risk trends.
- Add a dashboard showing daily rain probability and route selection frequency.
- Add a user-defined preference: shortest, most sheltered, or lowest weather risk.
