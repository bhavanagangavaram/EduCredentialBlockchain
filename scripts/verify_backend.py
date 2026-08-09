import requests
import random
import secrets
import traceback

from web3 import Web3

BASE_URL = "http://127.0.0.1:8001" # Use 127.0.0.1 explicitly

def generate_random_hex(length=40):
    # Generates a random address
    raw = "0x" + secrets.token_hex(length // 2)
    return Web3.to_checksum_address(raw)

def generate_random_did(length=12):
    return ''.join([str(random.randint(0, 9)) for _ in range(length)])

def test_registration():
    print("Testing Registration Endpoint...")
    
    # Generate random voter data
    voter_address = generate_random_hex(40)
    aadhar = generate_random_did(12)
    name = f"Test User {random.randint(1000,9999)}"
    
    # 1x1 white pixel base64
    dummy_image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGNiAAAABgADNjd8qAAAAABJRU5ErkJggg=="
    
    payload = {
        "name": name,
        "voter_address": voter_address,
        "aadhar_number": aadhar,
        "image_data": dummy_image,
        "otp": "123456" 
    }
    
    try:
        response = requests.post(f"{BASE_URL}/register", json=payload)
        print(f"Status Code: {response.status_code}")
        print("Response Text:")
        try:
            print(response.json())
        except:
             print(response.text)
        
        if response.status_code == 200:
            print("[SUCCESS] Registration Verified")
        else:
            print("[FAILED] Registration Failed")
            
    except Exception as e:
        print(f"[ERROR] Connection Failed: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    test_registration()
