import hashlib
import json
import random
import time
import requests
import argparse
import sys
from datetime import datetime, timedelta, timezone

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def print_colored(text, color_code):
    try:
        print(f"\033[{color_code}m{text}\033[0m")
    except Exception:
        try:
            print(text)
        except Exception:
            print(text.encode('ascii', 'replace').decode('ascii'))

users = [
    {
        "email": "aarav.mehta@iiitd.ac.in",
        "name": "Aarav Mehta",
        "gender": "Male",
        "major": "CS Major",
        "answers": ["Coding & Hackathons", "Late-night owl 🦉", "Building a side project"]
    },
    {
        "email": "ananya.sharma@iiitd.ac.in",
        "name": "Ananya Sharma",
        "gender": "Female",
        "major": "Design Major",
        "answers": ["Art & Design", "Exploring new cafes", "Ideas machine & creative"]
    },
    {
        "email": "kabir.malhotra@iiitd.ac.in",
        "name": "Kabir Malhotra",
        "gender": "Male",
        "major": "ECE Major",
        "answers": ["Music & Concerts", "Weekend warrior", "Chill vibes & listener"]
    },
    {
        "email": "priya.patel@iiitd.ac.in",
        "name": "Priya Patel",
        "gender": "Female",
        "major": "AI & Data Science",
        "answers": ["Coding & Hackathons", "Coffee & Cafes", "Hype person & energy"]
    },
    {
        "email": "rohan.gupta@iiitd.ac.in",
        "name": "Rohan Gupta",
        "gender": "Male",
        "major": "Mechanical Engineering",
        "answers": ["Sports & Fitness", "Morning runner", "Planner & organizer"]
    },
    {
        "email": "rhea.sen@iiitd.ac.in",
        "name": "Rhea Sen",
        "gender": "Female",
        "major": "Mathematics & Computing",
        "answers": ["Study Groups", "Library grinder", "Deep discussions & podcasts"]
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
    
    try:
        requests.post(f"{base_url}/api/auth/reset-demo-db", timeout=5)
        print_colored("🧹 Cleaned database state for fresh seeding.", "90")
    except Exception as e:
        print(f"Note: Could not reset db via endpoint: {e}")
        
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
    second_event_id = None
    third_event_id = None
    user_list = list(created_users.values())
    now = datetime.now(timezone.utc)
    campus_locations = [
        "SAC Amphitheatre",
        "R&D Block 4th Floor",
        "Library 2nd Floor",
        "Cafeteria Gate 1",
        "Perimeter Track",
        "Student Center",
        "Hostel Lawn",
        "Academic Quad",
        "Design Studio Lab",
        "Faculty Lounge Lawns"
    ]
    for i, e in enumerate(events_data):
        lat = IIITD_LAT + random.uniform(-0.0016, 0.0016)
        lon = IIITD_LON + random.uniform(-0.0016, 0.0016)
        # Cycle through users as event hosts
        host_user = user_list[i % len(user_list)] if user_list else {}
        
        # Schedule between 1 hour and 28 hours ahead
        sched_time = now + timedelta(hours=1.5 + (i * 2.5))
        sched_iso = sched_time.isoformat()
        expires_iso = (sched_time + timedelta(hours=4)).isoformat()
        loc_name = campus_locations[i % len(campus_locations)]

        payload = {
            "userId": host_user.get("userId", "user_demo"),
            "hostName": host_user.get("name", "Campus User"),
            "title": e["title"],
            "description": e["desc"],
            "category": e["category"],
            "locationName": loc_name,
            "lat": lat,
            "lng": lon,
            "scheduledAt": sched_iso,
            "expiresAt": expires_iso
        }
        try:
            res = requests.post(f"{base_url}/api/events", json=payload, timeout=10)
            if res.status_code in [200, 201]:
                evt = res.json()
                event_id = evt.get("eventId")
                if i == 0:
                    first_event_id = event_id
                elif i == 1:
                    second_event_id = event_id
                elif i == 4:
                    third_event_id = event_id
                print(f" -> Created [{e['category']}] {e['title']}")
            else:
                print_colored(f" -> Failed to create event {e['title']}: {res.status_code}", "91")
        except Exception as e:
            print_colored(f" -> Error creating event: {e}", "91")

    if first_event_id:
        print_colored(f"\n👥 Pre-joining 3 members to '{events_data[0]['title']}'...", "93")
        joiners = ["ananya.sharma@iiitd.ac.in", "kabir.malhotra@iiitd.ac.in", "priya.patel@iiitd.ac.in"]
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
                            "vibeSummary": f"Likes: {', '.join(u['answers'][:3])}"
                        },
                        timeout=10
                    )
                    if join_res.status_code in [200, 201]:
                        print(f"    ✓ {u['name']} joined! (Count: {join_res.json().get('memberCount')}/4)")
                    else:
                        print_colored(f"    ✗ {u['name']} failed to join: {join_res.status_code}", "91")
                except Exception as e:
                    print_colored(f"    ✗ Error joining {u['name']}: {e}", "91")
        print_colored(f"   => Event is now 3/4 full! Ready for Aarav Mehta to trigger CREW_LOCKED!", "92")

    if second_event_id and "priya.patel@iiitd.ac.in" in created_users:
        u = created_users["priya.patel@iiitd.ac.in"]
        requests.post(
            f"{base_url}/api/events/{second_event_id}/join",
            json={"userId": u["userId"], "name": u["name"], "major": u["major"], "vibeSummary": f"Likes: {', '.join(u['answers'][:3])}"},
            timeout=10
        )

    if third_event_id and "rohan.gupta@iiitd.ac.in" in created_users:
        u1 = created_users["rohan.gupta@iiitd.ac.in"]
        requests.post(
            f"{base_url}/api/events/{third_event_id}/join",
            json={"userId": u1["userId"], "name": u1["name"], "major": u1["major"], "vibeSummary": f"Likes: {', '.join(u1['answers'][:3])}"},
            timeout=10
        )
        if "rhea.sen@iiitd.ac.in" in created_users:
            u2 = created_users["rhea.sen@iiitd.ac.in"]
            requests.post(
                f"{base_url}/api/events/{third_event_id}/join",
                json={"userId": u2["userId"], "name": u2["name"], "major": u2["major"], "vibeSummary": f"Likes: {', '.join(u2['answers'][:3])}"},
                timeout=10
            )

    print_colored("\n✅ Demo seeding completed successfully!", "92")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default="http://localhost:8000", help="API URL to seed")
    args = parser.parse_args()
    run_seed(args.url)
