from web3 import Web3
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")

rpc_url = os.getenv("RPC_URL")
print(f"Connecting to: {rpc_url}")

w3 = Web3(Web3.HTTPProvider(rpc_url))

if w3.is_connected():
    print("SUCCESS: Connected to Blockchain")
    print(f"Block Number: {w3.eth.block_number}")
else:
    print("FAILURE: Could not connect to Blockchain")
