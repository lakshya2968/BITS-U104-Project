The screenshot is no longer used as the map background.

The project uses a live OpenStreetMap base map. The manually marked covered paths from the supplied JSON are retained, with the D-Spine classified as covered. Their original screenshot pixel coordinates are georeferenced using the Google Maps view center/zoom supplied with the screenshot so they can be displayed on the real map.

Normal routes use OSRM's walking router. Weather uses Open-Meteo current conditions and precipitation probability. Rain/significant rain risk selects the covered route; dry conditions select the normal road route.
