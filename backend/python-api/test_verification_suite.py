import requests
import base64
import time
import json
import cv2
import numpy as np

BASE_URL = "http://localhost:8002"
RPC_URL = "http://127.0.0.1:8545"
TEST_AADHAR = "123456789012"
TEST_MOBILE = "9988776655"
TEST_NAME = "Test User"
TEST_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" # Hardhat Account #0

# Create a dummy image
img = np.zeros((100, 100, 3), dtype=np.uint8)
_, buffer = cv2.imencode('.jpg', img)
DUMMY_IMAGE_B64 = "data:image/jpeg;base64," + base64.b64encode(buffer).decode()

def print_res(response):
    try:
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except:
        print(f"Raw: {response.text}")

def check_rpc():
    print("\n--- Checking Blockchain Connection ---")
    try:
        res = requests.post(RPC_URL, json={"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}, timeout=2)
        if res.status_code == 200:
            print("Blockchain RPC is reachable.")
            return True
        else:
            print(f"Blockchain RPC returned status {res.status_code}")
            return False
    except Exception as e:
        print(f"Blockchain RPC not reachable: {e}")
        return False

def test_otp_flow():
    print("\n--- Testing OTP Flow ---")
    # 1. Send OTP
    print("1. Sending OTP...")
    try:
        res = requests.post(f"{BASE_URL}/send-otp", json={"aadhar_number": TEST_AADHAR, "mobile_number": TEST_MOBILE}, timeout=2)
        print_res(res)
        if res.status_code != 200: return False
    except Exception as e:
        print(f"Failed to connect to backend: {e}")
        return False

    # 2. Verify OTP (Correct)
    print("2. Verifying OTP (Correct)...")
    res = requests.post(f"{BASE_URL}/verify-otp", json={"aadhar_number": TEST_AADHAR, "otp": "1234"})
    print_res(res)
    if res.status_code != 200: return False

    return True

def test_registration():
    print("\n--- Testing Registration ---")
    payload = {
        "name": TEST_NAME,
        "voter_address": TEST_ADDRESS,
        "aadhar_number": TEST_AADHAR,
        "image_data": DUMMY_IMAGE_B64,
        "otp": "1234"
    }
    res = requests.post(f"{BASE_URL}/register", json=payload)
    print_res(res)
    return res.status_code == 200

def test_face_verification():
    print("\n--- Testing Face Verification ---")
    payload = {
        "voter_address": TEST_ADDRESS,
        "image_data": DUMMY_IMAGE_B64 
    }
    res = requests.post(f"{BASE_URL}/verify-face", json=payload)
    print_res(res)

def test_monitor():
    print("\n--- Testing Monitor ---")
    payload = {
        "image_data": DUMMY_IMAGE_B64
    }
    res = requests.post(f"{BASE_URL}/monitor", json=payload)
    print_res(res)

if __name__ == "__main__":
    if not check_rpc():
        print("WARNING: Blockchain likely offline. Registration might fail.")

    print("\nWaiting for backend to start...")
    time.sleep(3) # Give backend time to start if run concurrently

    if test_otp_flow():
        if test_registration():
            test_face_verification()
    
    test_monitor()
