import math
from typing import Optional

# Raio médio da Terra em quilômetros
EARTH_RADIUS_KM = 6371.0
DEFAULT_FALLBACK_DISTANCE_KM = 2.5

def calculate_haversine_distance(
    lat1: Optional[float],
    lng1: Optional[float],
    lat2: Optional[float],
    lng2: Optional[float]
) -> float:
    """
    Calcula a distância ortodrômica em quilômetros (km) entre duas coordenadas GPS
    (latitude/longitude) utilizando a Fórmula de Haversine.

    Args:
        lat1 (float | None): Latitude do primeiro ponto.
        lng1 (float | None): Longitude do primeiro ponto.
        lat2 (float | None): Latitude do segundo ponto.
        lng2 (float | None): Longitude do segundo ponto.

    Returns:
        float: Distância arredondada com 1 casa decimal em km (ex: 1.5).
    """
    if lat1 is None or lng1 is None or lat2 is None or lng2 is None:
        return DEFAULT_FALLBACK_DISTANCE_KM

    d_lat = math.radians(lat2 - lat1)
    d_lng = math.radians(lng2 - lng1)

    a = (
        math.sin(d_lat / 2.0) ** 2 +
        math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
        math.sin(d_lng / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    distance = EARTH_RADIUS_KM * c

    return round(distance, 1)
