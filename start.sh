#!/bin/bash


echo "=== SemiChain - Semiconductor Supply Chain ==="

# Kill existing processes on ports
kill $(lsof -t -i:3015) 2>/dev/null || true
kill $(lsof -t -i:5175) 2>/dev/null || true

# Setup database
createdb semicon_supply_db 2>/dev/null || echo "DB already exists"
psql semicon_supply_db < backend/db/schema.sql
psql semicon_supply_db < backend/db/seed.sql

# Install dependencies
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Copy env
cp .env backend/.env 2>/dev/null || true

# Start backend (in background subshell — does not affect current dir)
(cd backend && npm start) &

# Start frontend (in background subshell)
(cd frontend && npm run dev -- --port 5175) &

echo ""
echo "SemiChain running:"
echo "  Backend:  http://localhost:3015"
echo "  Frontend: http://localhost:5175"
echo ""
echo "Demo login: admin@demo.com / demo123"
