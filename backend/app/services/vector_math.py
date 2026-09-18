import math
from typing import List

def compute_cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    if len(vec_a) != len(vec_b) or not vec_a:
        return 0.0
    
    dot_product = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    
    if norm_a == 0 or norm_b == 0:
        return 0.0
        
    return dot_product / (norm_a * norm_b)

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0 # Earth radius in km
    
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)
    
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    
    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c

def rank_events(user_vector: List[float], events: List[dict], campus_lat: float, campus_lng: float, max_radius_km: float = 8.0) -> List[dict]:
    valid_events = []
    
    for event in events:
        dist = haversine_distance_km(campus_lat, campus_lng, event["lat"], event["lng"])
        if dist <= max_radius_km:
            event_vector = event.get("eventVector")
            sim = 0.0
            if event_vector and user_vector:
                sim = compute_cosine_similarity(user_vector, event_vector)
            event["_similarity"] = sim
            valid_events.append(event)
            
    # Sort by similarity descending
    valid_events.sort(key=lambda x: x["_similarity"], reverse=True)
    return valid_events
