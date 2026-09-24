# Weather Route Planner

A small-scale college project that combines:

- Interactive maps
- Predefined locations
- User-selected start and destination
- Current weather data
- Route-area analysis
- Coverage circles
- Data-based weather risk classification

## Files

- `index.html` — website structure
- `style.css` — styling
- `script.js` — map, route, weather API and analysis logic

## How to run

You can open `index.html` in a browser, but using a local server is recommended.

For example, with VS Code:
1. Install the Live Server extension.
2. Open the project folder.
3. Right-click `index.html`.
4. Choose **Open with Live Server**.

## Important

The project currently uses sample locations in Goa. To use your own locations, edit the `LOCATIONS` array in `script.js`.

Example:

```js
{
  id: "college",
  name: "My College",
  lat: 23.83,
  lon: 91.28
}
```

The weather is fetched from Open-Meteo and no API key is required for this prototype.

## What the project analyses

For each of five points between the selected start and destination, the website obtains:

- Temperature
- Apparent temperature
- Humidity
- Rain
- Precipitation
- Wind speed
- Weather code

A project-specific risk score is then calculated. The score is used only for visualization and should not be described as an official weather or safety warning.
