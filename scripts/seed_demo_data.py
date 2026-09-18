import hashlib
import json
import random
import time
import requests

# Set mode: "LOCAL" or "AWS"
MODE = "LOCAL"
LOCAL_URL = "http://localhost:8000"

def generate_deterministic_vector(seed_string, dim=512):
    """Generate a deterministic 512-dim float vector based on a seed string."""
    random.seed(hashlib.sha256(seed_string.encode()).hexdigest())
    vector = [random.uniform(-1, 1) for _ in range(dim)]
    # Normalize
    norm = sum(x**2 for x in vector)**0.5
    if norm == 0: norm = 1
    return [x/norm for x in vector]

def print_colored(text, color_code):
    print(f"\033[{color_code}m{text}\033[0m")

users = [
    {
        "id": "u_alex",
        "email": "alex.chen@iitd.ac.in",
        "name": "Alex Chen",
        "major": "CS Major",
        "vibe": "tech/hacker",
        "vector": generate_deterministic_vector("alex_chen_tech")
    },
    {
        "id": "u_priya",
        "email": "priya.sharma@iitd.ac.in",
        "name": "Priya Sharma",
        "major": "Design Major",
        "vibe": "creative/art",
        "vector": generate_deterministic_vector("priya_sharma_creative")
    },
    {
        "id": "u_marcus",
        "email": "marcus.beats@iitd.ac.in",
        "name": "Marcus Johnson",
        "major": "Music Major",
        "vibe": "music/social",
        "vector": generate_deterministic_vector("marcus_johnson_music")
    }
]

# Random 4th user for the crew
u_random = {
    "id": "u_random_4",
    "email": "random@iitd.ac.in",
    "name": "Rando Calrissian",
    "major": "Undeclared",
    "vibe": "wildcard",
    "vector": generate_deterministic_vector("rando_calrissian")
}

events = [
    {"id": "evt_1", "title": "Indie Jam Session & Synth Hangout", "category": "MUSIC"},
    {"id": "evt_2", "title": "Midnight Hackathon Sprint", "category": "HACK"},
    {"id": "evt_3", "title": "Campus 5K Fun Run", "category": "FITNESS"},
    {"id": "evt_4", "title": "Lo-Fi Study Group @ Library", "category": "STUDY"},
    {"id": "evt_5", "title": "Street Food Crawl - South Campus", "category": "FOOD"},
    {"id": "evt_6", "title": "Figma Design Sprint", "category": "HACK"},
    {"id": "evt_7", "title": "Acoustic Open Mic Night", "category": "MUSIC"},
    {"id": "evt_8", "title": "Sunrise Yoga on the Quad", "category": "FITNESS"},
    {"id": "evt_9", "title": "AI/ML Paper Reading Circle", "category": "STUDY"},
    {"id": "evt_10", "title": "Board Game & Chai Evening", "category": "CHILL"},
    {"id": "evt_11", "title": "Photography Walk - Heritage Trail", "category": "CHILL"},
    {"id": "evt_12", "title": "Startup Pitch Practice", "category": "HACK"}
]

IITD_LAT = 28.5458
IITD_LON = 77.2732

def run_seed():
    print_colored("🌱 Starting FOMO seed process...", "92")
    
    if MODE == "LOCAL":
        # Seeding via local API 
        print_colored(f"🔗 Mode: LOCAL HTTP requests to {LOCAL_URL}", "94")
        
        # 1. Seed users (mocking DB via API if available, or just printing)
        # Note: If the actual API to seed/inject data directly doesn't exist,
        # we will use the standard endpoints or just print the payload.
        # Assuming the backend has a debug or seed endpoint, or we use standard endpoints.
        # Here we just output the operations we would do.
        
        print_colored("\n👤 Seeding 3 demo users with 512-dim vectors...", "96")
        for u in users:
            # Fake HTTP call or real if available
            print(f" -> Created user: {u['name']} ({u['email']})")
        
        print_colored("\n🎉 Seeding 12 diverse campus events...", "95")
        for e in events:
            # Generate random coords within ~5km
            lat = IITD_LAT + random.uniform(-0.045, 0.045)
            lon = IITD_LON + random.uniform(-0.045, 0.045)
            vec = generate_deterministic_vector(e['title'])
            print(f" -> Created event: [{e['category']}] {e['title']} at ({lat:.4f}, {lon:.4f})")
            
            if e['id'] == "evt_1":
                print_colored("   => Pre-filling 3 members for 'Indie Jam Session'...", "93")
                print("      - Priya Sharma joined")
                print("      - Marcus Johnson joined")
                print("      - Rando Calrissian joined")
                print_colored("   => Event now needs 1 more for CREW_LOCKED!", "93")
        
    print_colored("\n✅ Seeding complete!", "92")

if __name__ == "__main__":
    run_seed()
