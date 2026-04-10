#!/bin/bash
# Quick Docker Development Setup Script

set -e

echo "🐳 ICHAS Management System - Docker Setup"
echo "=========================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker Desktop first."
    echo "   https://www.docker.com/products/docker-desktop"
    exit 1
fi

echo "✅ Docker found: $(docker --version)"

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed."
    exit 1
fi

echo "✅ Docker Compose found: $(docker-compose --version)"
echo ""

# Create data directory
echo "📁 Creating data directory..."
mkdir -p data
echo "✅ Created: ./data"
echo ""

# Build the image
echo "🔨 Building Docker image..."
docker-compose build

echo ""
echo "✅ Build complete!"
echo ""

# Start the container
echo "🚀 Starting container..."
docker-compose up -d

echo "✅ Container started!"
echo ""

# Wait for container to be ready
echo "⏳ Waiting for application to be ready..."
sleep 10

# Initialize database
echo "🗄️  Initializing database..."
docker-compose exec -T app npm run db:generate
docker-compose exec -T app npm run db:push

echo "✅ Database initialized!"
echo ""

# Display connection info
echo "=========================================="
echo "✨ SUCCESS - Application is Running!"
echo "=========================================="
echo ""
echo "🌐 Access your application:"
echo "   → http://localhost:3000"
echo ""
echo "📊 View logs:"
echo "   → docker-compose logs -f"
echo ""
echo "🛑 Stop application:"
echo "   → docker-compose down"
echo ""
echo "📚 Deployment guide:"
echo "   → Read DEPLOYMENT_GUIDE.md"
echo ""
