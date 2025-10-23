#!/bin/bash

# Colors for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Build directory
BUILD_DIR="dist"

# Function to display usage information
usage() {
    echo -e "${BLUE}Usage:${NC} $0 {clean|build|rebuild|preview|help}"
    echo ""
    echo "Commands:"
    echo -e "  ${GREEN}clean${NC}    - Remove the build directory (dist/)"
    echo -e "  ${GREEN}build${NC}    - Build the application for production"
    echo -e "  ${GREEN}rebuild${NC}  - Clean and build (clean + build)"
    echo -e "  ${GREEN}preview${NC}  - Preview the production build locally"
    echo -e "  ${GREEN}help${NC}     - Display this help message"
    echo ""
}

# Function to clean the build directory
clean_build() {
    echo -e "${BLUE}Cleaning build directory...${NC}"
    
    if [ -d "$BUILD_DIR" ]; then
        rm -rf "$BUILD_DIR"
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Build directory cleaned successfully${NC}"
            echo -e "Removed: ${BLUE}$BUILD_DIR/${NC}"
        else
            echo -e "${RED}✗ Failed to clean build directory${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}Build directory does not exist${NC}"
    fi
}

# Function to build the application
build_app() {
    echo -e "${BLUE}Building application...${NC}"
    
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
    
    # Run the build
    echo -e "${YELLOW}Running npm run build...${NC}"
    npm run build
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Build completed successfully!${NC}"
        
        # Display build info
        if [ -d "$BUILD_DIR" ]; then
            BUILD_SIZE=$(du -sh "$BUILD_DIR" 2>/dev/null | cut -f1)
            FILE_COUNT=$(find "$BUILD_DIR" -type f | wc -l)
            echo -e "Build directory: ${BLUE}$BUILD_DIR/${NC}"
            echo -e "Build size: ${GREEN}$BUILD_SIZE${NC}"
            echo -e "Total files: ${GREEN}$FILE_COUNT${NC}"
        fi
    else
        echo -e "${RED}✗ Build failed${NC}"
        echo -e "Check the output above for error details"
        return 1
    fi
}

# Function to rebuild the application
rebuild_app() {
    echo -e "${BLUE}Rebuilding application...${NC}"
    echo ""
    clean_build
    echo ""
    build_app
}

# Function to preview the production build
preview_build() {
    echo -e "${BLUE}Starting preview server...${NC}"
    
    # Check if build exists
    if [ ! -d "$BUILD_DIR" ]; then
        echo -e "${RED}Error: Build directory not found${NC}"
        echo -e "Run ${GREEN}$0 build${NC} first to create a production build"
        return 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}Error: npm is not installed${NC}"
        return 1
    fi
    
    echo -e "${GREEN}Starting preview server...${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
    echo ""
    
    # Run the preview server (this will block)
    npm run preview
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}✗ Failed to start preview server${NC}"
        return 1
    fi
}

# Main script logic
case "$1" in
    clean)
        clean_build
        ;;
    build)
        build_app
        ;;
    rebuild)
        rebuild_app
        ;;
    preview)
        preview_build
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
