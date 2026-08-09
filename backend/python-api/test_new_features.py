import requests
import base64
import time
import os

BASE_URL = "http://localhost:8002"
TEST_AADHAR = "999988887777"
TEST_MOBILE = "9876543210"
TEST_NAME = "Test User Aadhar"
TEST_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" # Hardhat Account #0 (Owner usually, but using for test)

# Load a real face image? Or use a dummy that returns a valid histogram?
# Since we use simple histogram comparison, comparing an image to ITSELF should always yield 1.0 match.
# So we can use any dummy image data, as long as it's a valid image structure for OpenCV.
# Let's use a very small valid red pixel image.
DUMMY_IMAGE = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAQ//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RCYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9sAQwEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2gAMAwEAAhEDEQA/AP/Z"

def test_full_flow():
    print("--- Starting Full Flow Verification ---")
    
    # 1. Send OTP
    print(f"\n1. Sending OTP to {TEST_MOBILE}...")
    try:
        res = requests.post(f"{BASE_URL}/send-otp", json={"aadhar_number": TEST_AADHAR, "mobile_number": TEST_MOBILE})
        print(f"Response: {res.json()}")
        if res.status_code != 200:
             print("FAIL: Send OTP")
             return
    except Exception as e:
        print(f"FAIL: {e}")
        return

    # 2. Verify OTP (We know it's "1234")
    print(f"\n2. Verifying OTP...")
    try:
        res = requests.post(f"{BASE_URL}/verify-otp", json={"aadhar_number": TEST_AADHAR, "otp": "1234"})
        print(f"Response: {res.json()}")
        if res.status_code != 200:
             print("FAIL: Verify OTP")
             return
    except Exception as e:
        print(f"FAIL: {e}")
        return

    # 3. Register (with Aadhar + Face)
    print(f"\n3. Registering User...")
    try:
        payload = {
            "name": TEST_NAME,
            "voter_address": TEST_ADDRESS,
            "aadhar_number": TEST_AADHAR,
            "image_data": DUMMY_IMAGE, # Using self as face
            "otp": "1234" # Need to send OTP again for Re-verification check
        }
        res = requests.post(f"{BASE_URL}/register", json=payload)
        print(f"Response: {res.json()}")
        
        # It might fail if already registered from previous run, handle that
        if res.status_code == 200:
            print("SUCCESS: Registration")
        elif "already registered" in res.text:
            print("INFO: Already Registered, continuing test...")
        else:
             print("FAIL: Registration")
             return
    except Exception as e:
        print(f"FAIL: {e}")
        return

    # 4. Verify Face (For Voting)
    print(f"\n4. Verifying Face (Should Match)...")
    try:
        # Sending the SAME image should match perfectly
        res = requests.post(f"{BASE_URL}/verify-face", json={"voter_address": TEST_ADDRESS, "image_data": DUMMY_IMAGE})
        print(f"Response: {res.json()}")
        if res.status_code == 200:
             print("SUCCESS: Face Match")
        else:
             print("FAIL: Face Match")
    except Exception as e:
        print(f"FAIL: {e}")

    # 5. Monitor (Count Faces)
    print(f"\n5. Monitoring (Should detect face)...")
    try:
        # Note: The dummy image is 1x1 pixel, might NOT be detected by Haar Cascade.
        # So we expect "0 faces" warning, but status should be 200 (warning is valid return).
        res = requests.post(f"{BASE_URL}/monitor", json={"image_data": DUMMY_IMAGE})
        print(f"Response: {res.json()}")
        if res.status_code == 200:
             print("SUCCESS: Monitor call worked")
        else:
             print("FAIL: Monitor call")
    except Exception as e:
        print(f"FAIL: {e}")

if __name__ == "__main__":
    test_full_flow()
