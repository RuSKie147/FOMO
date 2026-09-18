from app.services.bedrock_service import bedrock_service

def test_fallback_vector():
    vec = bedrock_service._fallback_vector("test")
    assert len(vec) == 512
    assert all(isinstance(x, float) for x in vec)

def test_fallback_icebreaker():
    icebreaker = bedrock_service.generate_icebreaker("Bob, Alice")
    assert isinstance(icebreaker, str)
    assert len(icebreaker) > 0
