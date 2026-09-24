# BITS Goa project notes — path-network version

## Core idea

Choose a BITS Goa start point and destination. The app calculates two campus-network routes:

1. **Covered / sheltered-first**
2. **Open / outdoor-first**

Live weather is sampled at checkpoints along both paths. A weather-risk score is then used to keep one route as the primary route and the other as backup.

## Covered paths considered

BITS Goa's current conference/walking information explicitly says to use two covered pathways during rain/humid weather:

- one from the **C hostels to the Main Building / B-Dome**
- one from the **D hostels to the D-Spine**

Those are now represented as lower-cost covered edges in `COVERED_EDGES`.

## Why the map was changed

The earlier version created routes by connecting buildings with straight interpolated lines. That made some routes visually pass through buildings/lawns and made the D-side geometry too linear.

This version uses an explicit graph (`OPEN_EDGES`) so the route is made from named campus connectors. This makes it much easier to correct a connector without rewriting the weather logic.

## If you know a path is wrong

Please tell me something like:

- `CH-3 -> CH-4 -> covered connector -> B-Dome`
- `DH-6 -> D-Mess -> D-Spine`
- `Main Gate -> Reception -> Central Lawns`

or send a screenshot/marked campus map. I can then update the graph directly.

## Viva explanation

**Input:** start + destination.

**Processing:** graph routing → covered/open path comparison → live weather sampling → weather-risk calculation.

**Output:** primary route + backup route + weather metrics + route statistics + checkpoint table + CSV.
