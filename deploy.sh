#!/bin/bash

# AI Author - Docker Deployment Script
# This script makes it easy to deploy the application locally with Docker

set -e

echo "🚀 AI Author - Docker Deployment"
echo "====================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if docker-compose is available
if command -v docker-compose &> /dev/null; then
    echo "✅ Using Docker Compose for deployment"
    echo ""
    echo "📦 Building and starting the application..."
    docker-compose up --build -d

    echo ""
    echo "🎉 Deployment successful!"
    echo "📱 Your app is running at: http://localhost:3000"
    echo ""
    echo "🛠️  Useful commands:"
    echo "   Stop:     docker-compose down"
    echo "   Restart:  docker-compose restart"
    echo "   Logs:     docker-compose logs -f"
    echo "   Shell:    docker-compose exec ai-story-author sh"

elif command -v docker &> /dev/null; then
    echo "✅ Using Docker for deployment"
    echo ""
    echo "📦 Building the Docker image..."
    docker build -t ai-story-author .

    echo "🚀 Starting the container..."
    docker run -d -p 3000:80 --name ai-story-author-container ai-story-author

    echo ""
    echo "🎉 Deployment successful!"
    echo "📱 Your app is running at: http://localhost:3000"
    echo ""
    echo "🛠️  Useful commands:"
    echo "   Stop:     docker stop ai-story-author-container"
    echo "   Remove:   docker rm ai-story-author-container"
    echo "   Logs:     docker logs -f ai-story-author-container"
    echo "   Shell:    docker exec -it ai-story-author-container sh"

else
    echo "❌ Neither Docker nor Docker Compose found."
    echo "   Please install Docker to use this deployment script."
    exit 1
fi

echo ""
echo "📖 For more information, see the README.md file"