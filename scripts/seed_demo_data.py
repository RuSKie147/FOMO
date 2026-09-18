import hashlib
import json
import random
import time
import requests
import argparse

def print_colored(text, color_code):
    print(f"\033[{color_code}m{text}\033[0m")

users = [
    {
        "email": "alex.chen@iiitd.ac.in",
        "name": "Alex Chen",
        "major": "CS Major",
        "answers": ["Coding & Hackathons", "Late-night owl 🦉", "Building a side project"]
    },
    {
        "email": "priya.sharma@iiitd.ac.in",
        "name": "Priya Sharma",
        "major": "Design Major",
        "answers": ["Art & Design", "Exploring new cafes", "Ideas machine & creative"]
    },
    {
        "email": "marcus.beats@iiitd.ac.in",
        "name": "Marcus Johnson",
        "major": "Music Major",
        "answers": ["Music & Concerts", "Weekend warrior", "Chill vibes & listener"]
    },
    {
        "email": "rando.calrissian@iiitd.ac.in",
        "name": "Rando Calrissian",
        "major": "Undeclared",
        "answers": ["Pickup sports game", "Big loud crowds", "Hype person & energy"]
    }
]

events_data = [
    {"title": "Indie Jam Session & Synth Hangout", "category": "MUSIC", "desc": "Bringing an analog synth and guitars. Looking for vocalists and drummers for chill improv."},
    {"title": "Midnight Hackathon Sprint", "category": "HACK", "desc": "Building AI agents and serverless apps till sunrise. Coffee and red bull provided."},
    {"title": "Campus 5K Fun Run", "category": "FITNESS", "desc": "Gentle morning 5k around campus perimeter road. All paces welcome!"},
    {"title": "Lo-Fi Study Group @ Library", "category": "STUDY", "desc": "Silent study session on 3rd floor. Noise cancelling headphones recommended."},
    {"title": "Street Food Crawl - South Campus", "category": "FOOD", "desc": "Hitting the best momos and chai spots near gate 2. Cash only!"},
    {"title": "Figma Design Sprint", "category": "HACK", "desc": "Redesigning student portal UI together. Beginners welcome to shadow."},
    {"title": "Acoustic Open Mic Night", "category": "MUSIC", "desc": "Hostel lawn acoustic circle. Bring your guitar, uke, or just your voice."},
    {"title": "Sunrise Yoga on the Quad", "category": "FITNESS", "desc": "Mindful movement and breathwork before morning lectures start."},
    {"title": "AI/ML Paper Reading Circle", "category": "STUDY", "desc": "Discussing attention mechanisms and embedding models in depth."},
    {"title": "Board Game & Chai Evening", "category": "CHILL", "desc": "Catan, Ticket to Ride, and endless adrak chai."},
    {"title": "Photography Walk - Heritage Trail", "category": "CHILL", "desc": "Golden hour photo walk around campus architecture and trees."},
    {"title": "Startup Pitch Practice", "category": "HACK", "desc": "3-minute pitch drill with constructive feedback from fellow student founders."}
]

IIITD_LAT = 28.5458
IIITD_LON = 77.2733

def run_seed(base_url):
    base_url = base_url.rstrip("/")
    print_colored(f"🌱 Starting FOMO seeding against: {base_url}", "92")
    
    created_users = {}
    
    print_colored("\n👤 Creating and vibe-checking demo users...", "96")
    for u in users:
        try:
            res = requests.post(f"{base_url}/api/auth/demo-login", json={"email": u["email"], "name": u["name"]}, timeout=10)
            if res.status_code in [200, 201]:
                user_data = res.json()
                u_id = user_data["userId"]
                created_users[u["email"]] = {**u, "userId": u_id}
                print(f" -> User created/logged in: {u['name']} (ID: {u_id[:8]}...)")
                
                # Perform Vibe Check
                vibe_res = requests.post(
                    f"{base_url}/api/vibe-check",
                    json={"userId": u_id, "answers": u["answers"]},
                    timeout=10
                )
                if vibe_res.status_code in [200, 201]:
                    print(f"    ✓ Vibe check saved ({vibe_res.json().get('vibeSummary', '')[:40]}...)")
            else:
                print_colored(f" -> Failed to login {u['name']}: {res.status_code} {res.text}", "91")
        except Exception as e:
            print_colored(f" -> Error creating user {u['name']}: {e}", "91")

    print_colored("\n🎉 Seeding campus events...", "95")
    first_event_id = None
    for i, e in enumerate(events_data):
        lat = IITD_LAT + random.uniform(-0.02, 0.02)
        lon = IITD_LON + random.uniform(-0.02, 0.02)
        payload = {
            "title": e["title"],
            "description": e["desc"],
            "category": e["category"],
            "lat": lat,
            "lng": lon
        }
        try:
            res = requests.post(f"{base_url}/api/events", json=payload, timeout=10)
            if res.status_code in [200, 201]:
                evt = res.json()
                event_id = evt.get("eventId")
                if i == 0:
                    first_event_id = event_id
                print(f" -> Created [{e['category']}] {e['title']}")
            else:
                print_colored(f" -> Failed to create event {e['title']}: {res.status_code}", "91")
        except Exception as e:
            print_colored(f" -> Error creating event: {e}", "91")

    if first_event_id:
        print_colored(f"\n👥 Pre-joining 3 members to '{events_data[0]['title']}'...", "93")
        joiners = ["priya.sharma@iitd.ac.in", "marcus.beats@iitd.ac.in", "rando.calrissian@iitd.ac.in"]
        for email in joiners:
            u = created_users.get(email)
            if u:
                try:
                    join_res = requests.post(
                        f"{base_url}/api/events/{first_event_id}/join",
                        json={
                            "userId": u["userId"],
                            "name": u["name"],
                            "major": u["major"],
                            "vibeSummary": ", ".join(u["answers"][:2])
                        },
                        timeout=10
                    )
                    if join_res.status_code in [200, 201]:
                        print(f"    ✓ {u['name']} joined! (Count: {join_res.json().get('memberCount')}/4)")
                    else:
                        print_colored(f"    ✗ {u['name']} failed to join: {join_res.status_code}", "91")
                except Exception as e:
                    print_colored(f"    ✗ Error joining {u['name']}: {e}", "91")
        print_colored(f"   => Event is now 3/4 full! Ready for Alex Chen to trigger CREW_LOCKED!", "92")

    print_colored("\n✅ Demo seeding completed successfully!", "92")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default="http://localhost:8000", help="API URL to seed")
    args = parser.parse_args()
    run_seed(args.url)
