import requests
import json
import time

url = "http://localhost:8000/api/workflow/start"
payload = {"prompt": "What is 2+2?", "enabled_mcps": [], "hitl_enabled": True}
headers = {'Content-Type': 'application/json'}

try:
    print("Starting workflow...")
    res = requests.post(url, json=payload, headers=headers)
    session_id = res.json()["session_id"]
    print(f"Session ID: {session_id}")

    # polling for status
    for _ in range(30):
        time.sleep(2)
        state_res = requests.get(f"http://localhost:8000/api/workflow/{session_id}")
        state = state_res.json()
        status = state.get("status")
        print(f"Status: {status}")
        if status == "PAUSED_FOR_HITL":
            print("Reached HITL!")
            # Send feedback
            print("Sending feedback...")
            fb_payload = {"session_id": session_id, "approved": False, "feedback": "Make it a poem"}
            requests.post("http://localhost:8000/api/workflow/approve", json=fb_payload, headers=headers)
            break
        elif status == "COMPLETED" or status == "FAILED":
            print("Ended too early!")
            break

    # wait a bit for it to run again
    time.sleep(5)
    for _ in range(30):
         time.sleep(2)
         state_res = requests.get(f"http://localhost:8000/api/workflow/{session_id}")
         state = state_res.json()
         status = state.get("status")
         print(f"Status: {status}")
         if status == "PAUSED_FOR_HITL":
             print("Reached HITL again!")
             print("Sending Approve...")
             fb_payload = {"session_id": session_id, "approved": True, "feedback": "Approve"}
             requests.post("http://localhost:8000/api/workflow/approve", json=fb_payload, headers=headers)
             break

    time.sleep(5)
    state_res = requests.get(f"http://localhost:8000/api/workflow/{session_id}")
    state = state_res.json()
    print(f"Final Status: {state.get('status')}")
    # print all messages
    for msg in state.get("chat_history", []):
        print(f"[{msg['agent']}]: {str(msg['content'])[:50]}...")

except Exception as e:
    print(f"Error: {e}")
