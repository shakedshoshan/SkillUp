#!/bin/bash

# Docker Build Script for SkillUp Backend
# This script handles building and tagging Docker images

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="skillup-backend"
REGISTRY=""
VERSION="latest"
BUILD_TARGET="production"

# Show usage
usage() {
    echo -e "${BLUE}Usage: $0 [OPTIONS]${NC}"
    echo ""
    echo -e "${YELLOW}OPTIONS:${NC}"
    echo "  -n, --name NAME        Image name (default: skillup-backend)"
    echo "  -r, --registry REGISTRY Registry URL (optional)"
    echo "  -v, --version VERSION  Version tag (default: latest)"
    echo "  -t, --target TARGET    Build target: production|builder (default: production)"
    echo "  -p, --push             Push to registry after build"
    echo "  -h, --help             Show this help message"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo "  $0                                          # Build basic image"
    echo "  $0 -v 1.0.0                                # Build with version tag"
    echo "  $0 -r docker.io/myuser -v 1.0.0 -p        # Build, tag, and push"
    echo "  $0 -t builder                              # Build development image"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -n|--name)
            IMAGE_NAME="$2"
            shift 2
            ;;
        -r|--registry)
            REGISTRY="$2"
            shift 2
            ;;
        -v|--version)
            VERSION="$2"
            shift 2
            ;;
        -t|--target)
            BUILD_TARGET="$2"
            shift 2
            ;;
        -p|--push)
            PUSH_IMAGE=true
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            usage
            exit 1
            ;;
    esac
done

# Validate build target
if [[ "$BUILD_TARGET" != "production" && "$BUILD_TARGET" != "builder" ]]; then
    echo -e "${RED}❌ Invalid build target: $BUILD_TARGET${NC}"
    echo -e "${YELLOW}Valid targets: production, builder${NC}"
    exit 1
fi

# Generate image tags
if [[ -n "$REGISTRY" ]]; then
    FULL_IMAGE_NAME="${REGISTRY}/${IMAGE_NAME}"
else
    FULL_IMAGE_NAME="${IMAGE_NAME}"
fi

MAIN_TAG="${FULL_IMAGE_NAME}:${VERSION}"
LATEST_TAG="${FULL_IMAGE_NAME}:latest"

echo -e "${BLUE}🐳 SkillUp Backend Docker Build${NC}"
echo -e "${YELLOW}================================${NC}"
echo -e "Image Name: ${GREEN}${FULL_IMAGE_NAME}${NC}"
echo -e "Version: ${GREEN}${VERSION}${NC}"
echo -e "Build Target: ${GREEN}${BUILD_TARGET}${NC}"
echo -e "Main Tag: ${GREEN}${MAIN_TAG}${NC}"
if [[ "$VERSION" != "latest" ]]; then
    echo -e "Latest Tag: ${GREEN}${LATEST_TAG}${NC}"
fi
echo ""

# Check if Dockerfile exists
if [[ ! -f "Dockerfile" ]]; then
    echo -e "${RED}❌ Dockerfile not found in current directory${NC}"
    exit 1
fi

# Build the image
echo -e "${YELLOW}🏗️ Building Docker image...${NC}"
docker build \
    --target "$BUILD_TARGET" \
    --tag "$MAIN_TAG" \
    --build-arg NODE_ENV=production \
    .

# Tag as latest if version is not latest
if [[ "$VERSION" != "latest" ]]; then
    echo -e "${YELLOW}🏷️ Tagging as latest...${NC}"
    docker tag "$MAIN_TAG" "$LATEST_TAG"
fi

echo -e "${GREEN}✅ Build completed successfully!${NC}"

# Show image details
echo -e "${YELLOW}📋 Image Details:${NC}"
docker images "$FULL_IMAGE_NAME" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"

# Push to registry if requested
if [[ "$PUSH_IMAGE" == true ]]; then
    if [[ -z "$REGISTRY" ]]; then
        echo -e "${RED}❌ Cannot push: No registry specified${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}🚀 Pushing to registry...${NC}"
    docker push "$MAIN_TAG"
    
    if [[ "$VERSION" != "latest" ]]; then
        docker push "$LATEST_TAG"
    fi
    
    echo -e "${GREEN}✅ Push completed successfully!${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Docker build process completed!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  • Run: ${GREEN}docker run -p 5000:5000 --env-file .env $MAIN_TAG${NC}"
echo -e "  • Or use: ${GREEN}docker-compose up${NC}" 