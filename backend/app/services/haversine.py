import math

def calculate_haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """
    Calcula a distância aproximada em quilômetros (km) entre dois pontos geográficos
    (latitude/longitude) utilizando a Fórmula de Haversine.
    """
    if lat1 is None or lng1 is None or lat2 is None or lng2 is None:
        return 2.5 # Valor padrão em km se faltar coordenada

    R = 6371.0  # Raio da Terra em quilômetros

    d_lat = math.radians(lat2 - lat1)
    d_lng = math.radians(lng2 - lng1)

    a = (
        math.sin(d_lat / 2.0) ** 2 +
        math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
        math.sin(d_lng / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    distance = R * c

    return round(distance, 1)
