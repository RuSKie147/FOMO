from app.services.vector_math import compute_cosine_similarity, haversine_distance_km

def test_cosine_similarity():
    vec1 = [1.0, 0.0]
    vec2 = [0.0, 1.0]
    assert compute_cosine_similarity(vec1, vec2) == 0.0
    
    vec3 = [1.0, 1.0]
    assert abs(compute_cosine_similarity(vec1, vec3) - 0.7071) < 0.001
    
def test_haversine():
    # NYC to LA approx
    d = haversine_distance_km(40.7128, -74.0060, 34.0522, -118.2437)
    assert 3900 < d < 4000
