#!/bin/bash

# Colors for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# PID file location
PID_FILE=".vite.pid"

# Function to display usage information
usage() {
    echo -e "${BLUE}Usage:${NC} $0 {start|stop|restart|status|help}"
    echo ""
    echo "Commands:"
    echo -e "  ${GREEN}start${NC}    - Start the development server"
    echo -e "  ${GREEN}stop${NC}     - Stop the development server"
    echo -e "  ${GREEN}restart${NC}  - Restart the development server"
    echo -e "  ${GREEN}status${NC}   - Check if the server is running"
    echo -e "  ${GREEN}help${NC}     - Display this help message"
    echo ""
}

# Function to check if the server is running
is_running() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            return 0
        else
            # PID file exists but process is not running
            rm -f "$PID_FILE"
            return 1
        fi
    fi
    return 1
}

# Function to start the server
start_server() {
    echo -e "${BLUE}Starting development server...${NC}"
    
    if is_running; then
        echo -e "${YELLOW}Server is already running!${NC}"
        PID=$(cat "$PID_FILE")
        echo -e "PID: ${GREEN}$PID${NC}"
        return 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}Error: npm is not installed${NC}"
        return 1
    fi
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}node_modules not found. Installing dependencies...${NC}"
        npm install
        if [ $? -ne 0 ]; then
            echo -e "${RED}Error: Failed to install dependencies${NC}"
            return 1
        fi
    fi
    
    # Start the dev server in the background
    nohup npm run dev > dev-server.log 2>&1 &
    PID=$!
    echo $PID > "$PID_FILE"
    
    # Wait a bit to check if it started successfully
    sleep 2
    
    if is_running; then
        echo -e "${GREEN}✓ Server started successfully!${NC}"
        echo -e "PID: ${GREEN}$PID${NC}"
        echo -e "Log file: ${BLUE}dev-server.log${NC}"
        echo -e "Server should be available at: ${BLUE}http://localhost:5173${NC}"
    else
        echo -e "${RED}✗ Failed to start server${NC}"
        echo -e "Check ${BLUE}dev-server.log${NC} for details"
        return 1
    fi
}

# Function to stop the server
stop_server() {
    echo -e "${BLUE}Stopping development server...${NC}"
    
    if ! is_running; then
        echo -e "${YELLOW}Server is not running${NC}"
        return 1
    fi
    
    PID=$(cat "$PID_FILE")
    
    # Try graceful shutdown first
    kill "$PID" 2>/dev/null
    
    # Wait for process to terminate
    for i in {1..10}; do
        if ! ps -p "$PID" > /dev/null 2>&1; then
            break
        fi
        sleep 0.5
    done
    
    # Force kill if still running
    if ps -p "$PID" > /dev/null 2>&1; then
        echo -e "${YELLOW}Forcing shutdown...${NC}"
        kill -9 "$PID" 2>/dev/null
    fi
    
    # Clean up PID file
    rm -f "$PID_FILE"
    
    echo -e "${GREEN}✓ Server stopped successfully${NC}"
}

# Function to restart the server
restart_server() {
    echo -e "${BLUE}Restarting development server...${NC}"
    stop_server
    sleep 1
    start_server
}

# Function to check server status
check_status() {
    if is_running; then
        PID=$(cat "$PID_FILE")
        echo -e "${GREEN}✓ Server is running${NC}"
        echo -e "PID: ${GREEN}$PID${NC}"
        
        # Check if port is listening
        if command -v lsof &> /dev/null; then
            PORT=$(lsof -ti:5173 2>/dev/null)
            if [ -n "$PORT" ]; then
                echo -e "Port 5173: ${GREEN}Active${NC}"
                echo -e "URL: ${BLUE}http://localhost:5173${NC}"
            fi
        fi
    else
        echo -e "${RED}✗ Server is not running${NC}"
    fi
}

# Main script logic
case "$1" in
    start)
        start_server
        ;;
    stop)
        stop_server
        ;;
    restart)
        restart_server
        ;;
    status)
        check_status
        ;;
    help|--help|-h)
        usage
        ;;
    *)
        echo -e "${RED}Error: Invalid command '$1'${NC}"
        echo ""
        usage
        exit 1
        ;;
esac

exit 0
