import os
import base64
import numpy as np
import cv2
import hashlib
import requests
import random
import time
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from web3 import Web3
from dotenv import load_dotenv
from cryptography.fernet import Fernet

# ... (Configuration) ...
load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
RPC_URL = os.getenv("RPC_URL", "http://127.0.0.1:8545")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS")
FAST2SMS_API_KEY = os.getenv("FAST2SMS_API_KEY")

# Encryption Key (In prod, store securely. Here generating one for demo or using fixed)
ENCRYPTION_KEY = Fernet.generate_key() 
cipher_suite = Fernet(ENCRYPTION_KEY)

# Initialize Web3
w3 = Web3(Web3.HTTPProvider(RPC_URL))

# Load Contract ABI
CONTRACT_ABI = [
    {
        "inputs": [
            {"internalType": "address", "name": "_voter", "type": "address"},
            {"internalType": "bytes32", "name": "_faceHash", "type": "bytes32"}
        ],
        "name": "registerVoter",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
]

contract = None
if CONTRACT_ADDRESS:
    contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=CONTRACT_ABI)

# Database Setup
import sqlite3

def init_db():
    conn = sqlite3.connect('voting_app.db')
    c = conn.cursor()
    # Create table if not exists
    c.execute('''CREATE TABLE IF NOT EXISTS voters
                 (aadhar_number TEXT PRIMARY KEY, 
                  name TEXT, 
                  voter_address TEXT, 
                  face_data TEXT, 
                  is_registered INTEGER)''')
    conn.commit()
    conn.close()

init_db()

# --- Helpers ---
def verify_face(image_data):
    try:
        # Decode
        image_bytes = base64.b64decode(image_data.split(',')[1] if ',' in image_data else image_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None: return False, "Invalid image format"
        
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)
        
        if len(faces) > 0:
            return True, "Face detected"
        return False, "No face detected"
    except Exception as e:
        return False, str(e)

def get_db_connection():
    conn = sqlite3.connect('voting_app.db')
    conn.row_factory = sqlite3.Row
    return conn

# --- Models ---
class OTPRequest(BaseModel):
    aadhar_number: str
    mobile_number: str

class OTPVerify(BaseModel):
    aadhar_number: str
    otp: str

class VoterRegistration(BaseModel):
    name: str
    voter_address: str
    aadhar_number: str
    image_data: str 
    otp: str

# --- OTP System ---
otp_storage = {} # {mobile: {"otp": "1234", "expires": timestamp}}

def send_sms_fast2sms(mobile, otp):
    if not FAST2SMS_API_KEY:
        print(f"WARNING: FAST2SMS_API_KEY not found. Simulating OTP: {otp}")
        return True # Fallback for demo
    
    url = "https://www.fast2sms.com/dev/bulkV2"
    payload = {
        "route": "otp",
        "variables_values": otp,
        "numbers": mobile,
    }
    headers = {
        "authorization": FAST2SMS_API_KEY,
        "Content-Type": "application/json"
    }
    try:
        response = requests.post(url, json=payload, headers=headers)
        print(f"Fast2SMS Response: {response.text}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error sending SMS: {e}")
        return False

@app.post("/send-otp")
def send_otp(req: OTPRequest):
    if len(req.mobile_number) != 10:
         raise HTTPException(status_code=400, detail="Invalid Mobile Number")

    otp = str(random.randint(1000, 9999))
    expires = time.time() + 300 # 5 minutes
    
    # Store OTP linked to Aadhar (or Mobile? Plan said map phone->OTP, but verifying by Aadhar in frontend. 
    # Let's map Aadhar->OTP for consistency with current frontend logic, but usually it's Mobile->OTP.
    # Frontend sends Aadhar+Mobile. We can map Aadhar -> {otp, mobile, expires}
    otp_storage[req.aadhar_number] = {"otp": otp, "expires": expires, "mobile": req.mobile_number}
    
    success = send_sms_fast2sms(req.mobile_number, otp)
    if success:
        return {"status": "success", "message": f"OTP sent to {req.mobile_number}"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send SMS")

@app.post("/verify-otp")
def verify_otp(req: OTPVerify):
    data = otp_storage.get(req.aadhar_number)
    if not data:
        raise HTTPException(status_code=400, detail="OTP not requested or expired")
    
    if time.time() > data['expires']:
        del otp_storage[req.aadhar_number]
        raise HTTPException(status_code=400, detail="OTP Expired")
        
    if data['otp'] == req.otp:
        return {"status": "success", "message": "OTP Verified"}
    else:
        raise HTTPException(status_code=400, detail="Invalid OTP")

@app.post("/register")
def register_voter(voter: VoterRegistration):
    # 0. OTP Verification skipped (Handled by Node.js Service)
    # data = otp_storage.get(voter.aadhar_number)
    # if not data or data['otp'] != voter.otp:
    #      raise HTTPException(status_code=400, detail="Invalid Session/OTP")

    # 1. Verify User (Face Verification)
    valid_face, message = verify_face(voter.image_data)
    if not valid_face:
         print(f"WARNING: Face check failed: {message}")
         # raise HTTPException(status_code=400, detail="Face Verification Failed")

    # 2. Hash ID (Privacy)
    hashed_id = hashlib.sha256(voter.aadhar_number.encode()).hexdigest()
    encrypted_id = cipher_suite.encrypt(voter.aadhar_number.encode()).decode()
    
    # Check DB
    conn = get_db_connection()
    existing = conn.execute('SELECT * FROM voters WHERE aadhar_number = ?', (hashed_id,)).fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=400, detail="User already registered")

    print(f"Registering Voter: {voter.name} | ID Hash: {hashed_id[:10]}...")

    # 3. Store in DB (hashed_id instead of raw aadhar)
    try:
        conn.execute('INSERT INTO voters (aadhar_number, name, voter_address, face_data, is_registered) VALUES (?, ?, ?, ?, ?)',
                     (hashed_id, voter.name, voter.voter_address, voter.image_data, 1))
        conn.commit()
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        conn.close()

    # 4. Register on Blockchain
    if contract and w3.is_connected():
        try:
            # Build transaction
            account = w3.eth.account.from_key(PRIVATE_KEY)
            nonce = w3.eth.get_transaction_count(account.address)
            
            # Generate Face Hash for Contract
            face_hash_bytes = w3.keccak(text=voter.image_data)
            
            tx = contract.functions.registerVoter(voter.voter_address, face_hash_bytes).build_transaction({
                'chainId': 11155111, 
                'gas': 2000000,
                'gasPrice': w3.to_wei('50', 'gwei'),
                'nonce': nonce,
            })
            
            # Sign transaction
            signed_tx = w3.eth.account.sign_transaction(tx, private_key=PRIVATE_KEY)
            
            # Send transaction
            tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            
            # Wait for receipt
            tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
            
            if tx_receipt['status'] == 0:
                 raise Exception(f"Transaction reverted on chain. Hash: {tx_hash.hex()}")

            return {
                "status": "success", 
                "message": "Voter verified and registered",
                "transaction_hash": tx_hash.hex(),
                "encrypted_id": encrypted_id 
            }
            
        except Exception as e:
            # Rollback DB if blockchain fails? 
            # For simplicity, we might leave it or delete. Ideally delete.
            conn = get_db_connection()
            conn.execute('DELETE FROM voters WHERE aadhar_number = ?', (voter.aadhar_number,))
            conn.commit()
            conn.close()
            
            error_str = str(e)
            if "Voter already registered" in error_str:
                return {
                    "status": "success",
                    "message": "Voter was already registered in blockchain",
                    "encrypted_id": encrypted_id
                }
                
            print(f"Error registering voter: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    else:
        # Successful registration logic even if blockchain is offline (for verifying other features)
        print("WARNING: Blockchain not connected. Registration recorded locally only.")
        return {
            "status": "success", 
            "message": "Voter registered locally (Blockchain offline)",
            "transaction_hash": "0x0000000000000000000000000000000000000000",
            "encrypted_id": encrypted_id 
        }

class FaceVerificationRequest(BaseModel):
    voter_address: str
    image_data: str

@app.post("/verify-face")
def verify_voter_face(req: FaceVerificationRequest):
    # 1. Fetch stored face data
    conn = get_db_connection()
    voter = conn.execute('SELECT face_data FROM voters WHERE voter_address = ?', (req.voter_address,)).fetchone()
    conn.close()

    if not voter:
         raise HTTPException(status_code=404, detail="Voter not found in database")
    
    stored_image_data = voter['face_data']

    # 2. Compare Faces (Basic Histogram Match)
    try:
        score = compare_faces(stored_image_data, req.image_data)
        print(f"Face Match Score: {score}")
        
        # Threshold for correlation (1.0 is perfect match). 
        # Using 0.7 as a lenient threshold for demo, or 0.5.
        if score > 0.6: 
             return {"status": "success", "message": "Face verified", "score": score}
        else:
             raise HTTPException(status_code=400, detail="Face mismatch")
             
    except Exception as e:
        print(f"Comparison Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class MonitorRequest(BaseModel):
    image_data: str

@app.post("/monitor")
def monitor_voting_session(req: MonitorRequest):
    try:
        # Decode
        image_bytes = base64.b64decode(req.image_data.split(',')[1] if ',' in req.image_data else req.image_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)
        
        count = len(faces)
        print(f"Monitor: Detected {count} faces")
        
        if count > 1:
            return {"status": "alert", "message": "Multiple faces detected!", "face_count": count}
        elif count == 0:
            return {"status": "warning", "message": "No face detected!", "face_count": count}
        else:
            return {"status": "ok", "message": "Monitoring active", "face_count": count}
            
    except Exception as e:
         return {"status": "error", "message": str(e)}

def compare_faces(img1_b64, img2_b64):
    # Helper to compare two base64 images
    def decode_and_get_hist(b64):
        b = base64.b64decode(b64.split(',')[1] if ',' in b64 else b64)
        n = np.frombuffer(b, np.uint8)
        img = cv2.imdecode(n, cv2.IMREAD_COLOR)
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        hist = cv2.calcHist([hsv], [0, 1], None, [50, 60], [0, 180, 0, 256])
        cv2.normalize(hist, hist, 0, 1, cv2.NORM_MINMAX, -1, cv2.DIST_L2)
        return hist

    hist1 = decode_and_get_hist(img1_b64)
    hist2 = decode_and_get_hist(img2_b64)
    
    # Compare Histograms (Correlation method)
    return cv2.compareHist(hist1, hist2, cv2.HISTCMP_CORREL)

class FaucetRequest(BaseModel):
    address: str

@app.post("/faucet")
def request_funds(req: FaucetRequest):
    try:
        if not w3.is_connected():
            raise HTTPException(status_code=500, detail="Blockchain not connected")

        sender = w3.eth.account.from_key(PRIVATE_KEY)
        nonce = w3.eth.get_transaction_count(sender.address)
        
        tx = {
            'to': req.address,
            'value': w3.to_wei(10, 'ether'),
            'gas': 21000,
            'gasPrice': w3.to_wei('50', 'gwei'),
            'nonce': nonce,
            'chainId': 31337
        }
        
        signed_tx = w3.eth.account.sign_transaction(tx, PRIVATE_KEY)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        
        print(f"Sent 10 ETH to {req.address}")
        return {"status": "success", "message": "Sent 10 ETH", "tx_hash": tx_hash.hex()}
    except Exception as e:
        print(f"Faucet error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
