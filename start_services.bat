@echo off
echo ==========================================
echo   E-Voting System - Starting All Services
echo   (Sepolia Testnet Mode)
echo ==========================================
echo.

echo [1/3] Starting Backend (Node.js)...
start "Backend Node" cmd /k "cd backend\node-api && npm start"

echo [2/3] Starting OTP Service...
start "OTP Service" cmd /k "cd backend\otp-service && npm start"

echo [3/3] Starting Frontend...
start "Frontend App" cmd /k "cd frontend && npm run dev"

echo.
echo ==========================================
echo   All services started successfully!
echo ==========================================
echo.
echo   Frontend:    http://localhost:3000
echo   Backend:     http://localhost:5000
echo   OTP Service: http://localhost:4000
echo   Blockchain:  Sepolia Testnet (Public RPC)
echo   Contract:    0x0C2Cf528350f31eB62192E4aB630Fec35150eDd2
echo.
echo ==========================================
echo   IMPORTANT: Make sure MetaMask is on
echo   Sepolia Testnet with Sepolia ETH!
echo ==========================================
echo.
pause
