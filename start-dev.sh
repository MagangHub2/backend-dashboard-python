#!/bin/bash

# ==============================================
# Development Startup Script
# Menjalankan Python Backend + Baileys Service
# ==============================================

echo "╔════════════════════════════════════════════╗"
echo "║   Starting Development Services...         ║"
echo "╚════════════════════════════════════════════╝"

# Fungsi untuk cleanup saat script di-stop
cleanup() {
    echo ""
    echo "Stopping all services..."
    kill $BACKEND_PID $BAILEYS_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start Python Backend
echo ""
echo "🐍 Starting Python Backend (port 8000)..."
cd "$(dirname "$0")/backend-dashboard-python"
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Start Baileys Service
echo ""
echo "📱 Starting Baileys WhatsApp Service (port 3000)..."
cd "$(dirname "$0")/wa-baileys-service"
npm run dev &
BAILEYS_PID=$!

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║   Services Running:                        ║"
echo "║   • Backend:  http://localhost:8000        ║"
echo "║   • Baileys:  http://localhost:3000        ║"
echo "║   • Docs:     http://localhost:8000/docs   ║"
echo "║                                            ║"
echo "║   Press Ctrl+C to stop all services        ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Wait for both processes
wait $BACKEND_PID $BAILEYS_PID
