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

def normalize_to_match_percentage(cos_sim: float) -> float:
    """
    Normalizes cosine similarity to a realistic, user-facing match score in [0.20, 0.98].
    Titan V2 embeddings for distinct domains typically sit around 0.35 - 0.50,
    while closely related topics sit between 0.75 - 0.95.
    This mapping scales similarity into an intuitive student affinity score.
    """
    if cos_sim <= 0.0:
        return round(max(0.15, 0.25 + cos_sim * 0.1), 3)
    
    # Sigmoidal / power scaling so strong matches feel like 82-98%
    # and moderate matches feel like 45-70%
    score = 0.20 + (cos_sim ** 1.3) * 0.78
    return round(min(0.98, max(0.20, score)), 3)

def rank_events(user_vector: List[float], events: List[dict], campus_lat: float, campus_lng: float, max_radius_km: float = 8.0) -> List[dict]:
    valid_events = []
    
    for event in events:
        lat = event.get("lat", 0)
        lng = event.get("lng", 0)
        dist = haversine_distance_km(campus_lat, campus_lng, lat, lng)
        if dist <= max_radius_km:
            event_vector = event.get("eventVector")
            sim = 0.50 # Baseline 50% match if no vector
            if event_vector and user_vector:
                raw_sim = compute_cosine_similarity(user_vector, event_vector)
                sim = normalize_to_match_percentage(raw_sim)
            event["similarityScore"] = sim
            event["distanceKm"] = round(dist, 2)
            valid_events.append(event)
            
    # Sort by similarity descending
    valid_events.sort(key=lambda x: x.get("similarityScore", 0), reverse=True)
    return valid_events
