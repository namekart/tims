#!/bin/bash

echo "🚀 Starting Fider-Plane Orchestrator..."
echo ""

# Check if .env exists, if not create from example
if [ ! -f .env ]; then
    echo "📋 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please edit .env with your actual credentials!"
    echo ""
fi

# Build and start with Docker Compose
echo "🐳 Building and starting orchestrator..."
docker compose up -d --build

echo ""
echo "⏳ Waiting for service to start..."
sleep 5

echo ""
echo "✅ Orchestrator started!"
echo ""
echo "📡 Service URL: http://localhost:3001"
echo "🏥 Health check: http://localhost:3001/health"
echo ""
echo "📋 Webhook URLs:"
echo "   Fider:  http://localhost:3001/webhooks/fider"
echo "   Plane:  http://localhost:3001/webhooks/plane"
echo ""
echo "📊 View logs:"
echo "   docker compose logs -f orchestrator"
echo ""

