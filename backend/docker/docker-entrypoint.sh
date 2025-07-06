#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting SkillUp Backend...${NC}"

# Function to check if a service is ready
wait_for_service() {
    local host=$1
    local port=$2
    local service_name=$3
    
    echo -e "${YELLOW}⏳ Waiting for ${service_name} to be ready...${NC}"
    
    while ! nc -z "$host" "$port"; do
        echo -e "${YELLOW}   ${service_name} not ready yet, waiting...${NC}"
        sleep 2
    done
    
    echo -e "${GREEN}✅ ${service_name} is ready!${NC}"
}

# Check required environment variables
check_env_vars() {
    local required_vars=("SUPABASE_URL" "SUPABASE_ANON_KEY")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        echo -e "${RED}❌ Missing required environment variables:${NC}"
        for var in "${missing_vars[@]}"; do
            echo -e "${RED}   - $var${NC}"
        done
        exit 1
    fi
}

# Database health check
check_database() {
    echo -e "${YELLOW}🔍 Checking database connection...${NC}"
    
    # Try to connect to database
    if node -e "
        const { dbConfig } = require('./dist/src/config/db.config');
        dbConfig.connect()
            .then(() => {
                console.log('Database connection successful');
                process.exit(0);
            })
            .catch((err) => {
                console.error('Database connection failed:', err.message);
                process.exit(1);
            });
    "; then
        echo -e "${GREEN}✅ Database connection successful!${NC}"
    else
        echo -e "${RED}❌ Database connection failed!${NC}"
        exit 1
    fi
}

# Run database migrations if needed
run_migrations() {
    if [ "$NODE_ENV" = "production" ] && [ "$SKIP_MIGRATIONS" != "true" ]; then
        echo -e "${YELLOW}🔄 Running database migrations...${NC}"
        if npm run migrate:up; then
            echo -e "${GREEN}✅ Database migrations completed!${NC}"
        else
            echo -e "${YELLOW}⚠️ Database migrations failed or not needed${NC}"
        fi
    fi
}

# Main execution
main() {
    # Check environment variables
    check_env_vars
    
    # Check database connection
    check_database
    
    # Run migrations if needed
    run_migrations
    
    echo -e "${GREEN}🎉 All checks passed! Starting application...${NC}"
    
    # Execute the main command
    exec "$@"
}

# Run main function with all arguments
main "$@" 