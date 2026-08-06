import math


def haversine_distance(lat1, lon1, lat2, lon2):
    """Distance in meters between two lat/lng points."""
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = (
        math.sin(dphi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    )
    return 2 * R * math.asin(math.sqrt(a))


def optimize_route(stops: list, start_lat: float, start_lon: float) -> list:
    """
    Nearest-neighbor route: starting from a depot/start point, always visit
    whichever remaining stop is closest, repeat until all stops are visited.

    stops: list of dicts, each with 'id', 'latitude', 'longitude'
    Returns: the same stops, reordered for an efficient visiting sequence,
    each annotated with distance_from_previous_m.
    """
    remaining = stops.copy()
    route = []
    current_lat, current_lon = start_lat, start_lon

    while remaining:
        distances = [
            (
                haversine_distance(
                    current_lat, current_lon, s["latitude"], s["longitude"]
                ),
                s,
            )
            for s in remaining
        ]
        distances.sort(key=lambda x: x[0])
        nearest_distance, nearest_stop = distances[0]

        route.append(
            {**nearest_stop, "distance_from_previous_m": round(nearest_distance)}
        )
        current_lat, current_lon = nearest_stop["latitude"], nearest_stop["longitude"]
        remaining.remove(nearest_stop)

    return route
