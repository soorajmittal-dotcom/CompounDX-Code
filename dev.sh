#!/bin/bash
# Start both backend and frontend for development

trap 'kill $(jobs -p) 2>/dev/null' EXIT

echo "Starting Travel Points Optimizer..."
echo "Backend: http://localhost:8000 (Swagger: http://localhost:8000/docs)"
echo "Frontend: http://localhost:3000"
echo ""

# Start backend
cd backend && pip install -r requirements.txt -q && uvicorn app.main:app --reload --port 8000 &

# Start frontend
cd frontend && npm install --silent && npm run dev &

wait
