import requests
import json
import argparse

def print_colored(text, color_code):
    print(f"\033[{color_code}m{text}\033[0m")

def run_tests(base_url):
    print_colored(f"🚀 Starting Verification against {base_url}...", "94")
    passed = 0
    total = 6
    
    # 1. POST /api/auth/demo-login
    print_colored("\nTest 1: POST /api/auth/demo-login", "95")
    # curl -X POST http://localhost:8000/api/auth/demo-login -H "Content-Type: application/json" -d '{"email":"alex.chen@iitd.ac.in"}'
    try:
        res = requests.post(f"{base_url}/api/auth/demo-login", json={"email": "alex.chen@iitd.ac.in"})
        if res.status_code in [200, 201]:
            print_colored(f"PASS - Status {res.status_code}", "92")
            print(f"Response snippet: {str(res.text)[:100]}...")
            passed += 1
            user_id = res.json().get('userId') or res.json().get('user_id', 'u_alex')
        else:
            print_colored(f"FAIL - Status {res.status_code}", "91")
            user_id = 'u_alex'
    except Exception as e:
        print_colored(f"FAIL - Exception: {e}", "91")
        user_id = 'u_alex'

    # 2. POST /api/vibe-check
    print_colored("\nTest 2: POST /api/vibe-check", "95")
    # curl -X POST http://localhost:8000/api/vibe-check -H "Content-Type: application/json" -d '{"userId":"u_alex", "answers":["music", "coding", "nightowl", "introvert", "coffee"]}'
    try:
        res = requests.post(f"{base_url}/api/vibe-check", json={"userId": user_id, "answers": ["music", "coding", "nightowl", "introvert", "coffee"]})
        if res.status_code in [200, 201]:
            print_colored(f"PASS - Status {res.status_code}", "92")
            print(f"Response snippet: {str(res.text)[:100]}...")
            passed += 1
        else:
            print_colored(f"FAIL - Status {res.status_code}", "91")
    except Exception as e:
        print_colored(f"FAIL - Exception: {e}", "91")

    # 3. GET /api/upload-url
    print_colored("\nTest 3: GET /api/upload-url", "95")
    # curl -X GET "http://localhost:8000/api/upload-url?fileType=image/jpeg&fileName=test.jpg"
    try:
        res = requests.get(f"{base_url}/api/upload-url", params={"fileType": "image/jpeg", "fileName": "test.jpg"})
        if res.status_code == 200:
            print_colored(f"PASS - Status {res.status_code}", "92")
            print(f"Response snippet: {str(res.text)[:100]}...")
            passed += 1
        else:
            print_colored(f"FAIL - Status {res.status_code}", "91")
    except Exception as e:
        print_colored(f"FAIL - Exception: {e}", "91")

    # 4. POST /api/events
    print_colored("\nTest 4: POST /api/events", "95")
    # curl -X POST http://localhost:8000/api/events -H "Content-Type: application/json" -d '{"title":"Test Event", "category":"CHILL"}'
    try:
        res = requests.post(f"{base_url}/api/events", json={"title": "Test Event", "category": "CHILL"})
        if res.status_code in [200, 201]:
            print_colored(f"PASS - Status {res.status_code}", "92")
            print(f"Response snippet: {str(res.text)[:100]}...")
            event_id = res.json().get('eventId') or res.json().get('id', 'evt_1')
            passed += 1
        else:
            print_colored(f"FAIL - Status {res.status_code}", "91")
            event_id = 'evt_1'
    except Exception as e:
        print_colored(f"FAIL - Exception: {e}", "91")
        event_id = 'evt_1'

    # 5. GET /api/feed
    print_colored("\nTest 5: GET /api/feed", "95")
    # curl -X GET "http://localhost:8000/api/feed?userId=u_alex"
    try:
        res = requests.get(f"{base_url}/api/feed", params={"userId": user_id})
        if res.status_code == 200:
            print_colored(f"PASS - Status {res.status_code}", "92")
            print(f"Response snippet: {str(res.text)[:100]}...")
            passed += 1
        else:
            print_colored(f"FAIL - Status {res.status_code}", "91")
    except Exception as e:
        print_colored(f"FAIL - Exception: {e}", "91")

    # 6. POST /api/events/{id}/join
    print_colored(f"\nTest 6: POST /api/events/{event_id}/join", "95")
    # curl -X POST http://localhost:8000/api/events/evt_1/join -H "Content-Type: application/json" -d '{"userId":"u_alex"}'
    try:
        res = requests.post(f"{base_url}/api/events/{event_id}/join", json={"userId": user_id})
        if res.status_code in [200, 201]:
            print_colored(f"PASS - Status {res.status_code}", "92")
            print(f"Response snippet: {str(res.text)[:100]}...")
            passed += 1
        else:
            print_colored(f"FAIL - Status {res.status_code}", "91")
    except Exception as e:
        print_colored(f"FAIL - Exception: {e}", "91")
        
    print_colored(f"\n🏁 Summary: {passed}/{total} tests passed.", "96" if passed == total else "93")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default="http://localhost:8000", help="Base API URL")
    args = parser.parse_args()
    run_tests(args.url)
