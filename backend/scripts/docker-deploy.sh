#!/bin/bash

# Docker Deployment Script for SkillUp Backend
# This script handles deployment to different environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="production"
COMPOSE_FILE=""
ENV_FILE=".env"
SERVICE_NAME="skillup-backend"

# Show usage
usage() {
    echo -e "${BLUE}Usage: $0 [OPTIONS]${NC}"
    echo ""
    echo -e "${YELLOW}OPTIONS:${NC}"
    echo "  -e, --env ENVIRONMENT     Environment: dev|prod (default: production)"
    echo "  -f, --file FILE          Docker Compose file (auto-detected if not specified)"
    echo "  -s, --service SERVICE    Service name (default: skillup-backend)"
    echo "  --env-file FILE          Environment file (default: .env)"
    echo "  --build                  Force rebuild images"
    echo "  --stop                   Stop services"
    echo "  --restart                Restart services"
    echo "  --logs                   Follow logs after deployment"
    echo "  -h, --help               Show this help message"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo "  $0 -e dev                    # Deploy to development"
    echo "  $0 -e prod --build           # Deploy to production with rebuild"
    echo "  $0 --restart                 # Restart services"
    echo "  $0 --stop                    # Stop all services"
}

# Parse command line arguments
FORCE_BUILD=false
STOP_SERVICES=false
RESTART_SERVICES=false
FOLLOW_LOGS=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -f|--file)
            COMPOSE_FILE="$2"
            shift 2
            ;;
        -s|--service)
            SERVICE_NAME="$2"
            shift 2
            ;;
        --env-file)
            ENV_FILE="$2"
            shift 2
            ;;
        --build)
            FORCE_BUILD=true
            shift
            ;;
        --stop)
            STOP_SERVICES=true
            shift
            ;;
        --restart)
            RESTART_SERVICES=true
            shift
            ;;
        --logs)
            FOLLOW_LOGS=true
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

# Validate environment
if [[ "$ENVIRONMENT" != "dev" && "$ENVIRONMENT" != "prod" && "$ENVIRONMENT" != "production" ]]; then
    echo -e "${RED}❌ Invalid environment: $ENVIRONMENT${NC}"
    echo -e "${YELLOW}Valid environments: dev, prod, production${NC}"
    exit 1
fi

# Normalize environment
if [[ "$ENVIRONMENT" == "prod" ]]; then
    ENVIRONMENT="production"
fi

# Auto-detect compose file if not specified
if [[ -z "$COMPOSE_FILE" ]]; then
    if [[ "$ENVIRONMENT" == "dev" ]]; then
        COMPOSE_FILE="docker-compose.dev.yml"
    else
        COMPOSE_FILE="docker-compose.prod.yml"
    fi
fi

# Check if compose file exists
if [[ ! -f "$COMPOSE_FILE" ]]; then
    echo -e "${RED}❌ Compose file not found: $COMPOSE_FILE${NC}"
    exit 1
fi

# Check if environment file exists
if [[ ! -f "$ENV_FILE" ]]; then
    echo -e "${RED}❌ Environment file not found: $ENV_FILE${NC}"
    echo -e "${YELLOW}💡 Copy .env.example to $ENV_FILE and configure it${NC}"
    exit 1
fi

echo -e "${BLUE}🚀 SkillUp Backend Deployment${NC}"
echo -e "${YELLOW}===============================${NC}"
echo -e "Environment: ${GREEN}${ENVIRONMENT}${NC}"
echo -e "Compose File: ${GREEN}${COMPOSE_FILE}${NC}"
echo -e "Env File: ${GREEN}${ENV_FILE}${NC}"
echo -e "Service: ${GREEN}${SERVICE_NAME}${NC}"
echo ""

# Function to check if services are running
check_services() {
    echo -e "${YELLOW}📋 Checking service status...${NC}"
    docker-compose -f "$COMPOSE_FILE" ps
}

# Function to stop services
stop_services() {
    echo -e "${YELLOW}🛑 Stopping services...${NC}"
    docker-compose -f "$COMPOSE_FILE" down
    echo -e "${GREEN}✅ Services stopped${NC}"
}

# Function to start services
start_services() {
    local build_flag=""
    if [[ "$FORCE_BUILD" == true ]]; then
        build_flag="--build"
        echo -e "${YELLOW}🏗️ Building and starting services...${NC}"
    else
        echo -e "${YELLOW}▶️ Starting services...${NC}"
    fi
    
    docker-compose -f "$COMPOSE_FILE" up -d $build_flag
    
    # Wait for services to be ready
    echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
    sleep 5
    
    # Check health
    echo -e "${YELLOW}🔍 Checking service health...${NC}"
    docker-compose -f "$COMPOSE_FILE" ps
    
    echo -e "${GREEN}✅ Services started successfully${NC}"
}

# Function to restart services
restart_services() {
    echo -e "${YELLOW}🔄 Restarting services...${NC}"
    docker-compose -f "$COMPOSE_FILE" restart
    echo -e "${GREEN}✅ Services restarted${NC}"
}

# Function to follow logs
follow_logs() {
    echo -e "${YELLOW}📄 Following logs... (Press Ctrl+C to stop)${NC}"
    docker-compose -f "$COMPOSE_FILE" logs -f
}

# Main execution
main() {
    # Load environment variables
    if [[ -f "$ENV_FILE" ]]; then
        export $(cat "$ENV_FILE" | grep -v '^#' | xargs)
    fi
    
    # Handle different operations
    if [[ "$STOP_SERVICES" == true ]]; then
        stop_services
    elif [[ "$RESTART_SERVICES" == true ]]; then
        restart_services
    else
        start_services
    fi
    
    # Show service status
    check_services
    
    # Show useful information
    echo ""
    echo -e "${GREEN}🎉 Deployment completed!${NC}"
    echo -e "${YELLOW}Useful commands:${NC}"
    echo -e "  • Check status: ${GREEN}docker-compose -f $COMPOSE_FILE ps${NC}"
    echo -e "  • View logs: ${GREEN}docker-compose -f $COMPOSE_FILE logs${NC}"
    echo -e "  • Stop services: ${GREEN}docker-compose -f $COMPOSE_FILE down${NC}"
    echo -e "  • Health check: ${GREEN}curl http://localhost:${PORT:-5000}/health/db${NC}"
    echo ""
    
    # Follow logs if requested
    if [[ "$FOLLOW_LOGS" == true ]]; then
        follow_logs
    fi
}

# Run main function
main 