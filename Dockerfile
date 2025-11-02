
# Stage 1: Build the React application
FROM node:20-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json (or npm-shrinkwrap.json)
COPY package*.json ./

# Install dependencies
# Using 'npm install' to auto-update lock file when dependencies change
RUN npm install

# Copy the rest of the application source code
COPY . .

# Accept Gemini API key as build argument
ARG GEMINI_API_KEY
ENV GEMINI_API_KEY=${GEMINI_API_KEY}

# Build the application
# This will create a 'dist' folder with the static files
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:1.25-alpine

# Remove the default nginx configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy the custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built static files from the 'builder' stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose the port Nginx will listen on
EXPOSE 8080

# Test nginx configuration before starting
RUN nginx -t

# Command to run Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
