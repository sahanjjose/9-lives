#!/bin/bash

# Define container names and volume name
CONTAINER_NAME="vending_machine-db1-1"
BACKEND_CONTAINER_NAME="vending_machine-backend-1"
MOSQUITTO_CONTAINER_NAME="vending_machine-mosquitto-1"
FRONTEND_CONTAINER_NAME="vending_machine-frontend-1"
VOLUME_NAME="vending_machine_vendingmachinedat"
COMPOSE_FILE="docker_compose.yml"
PROJECT_NAME="vending_machine"

# Function to shut down all services
shutdown() {
    echo "Shutting down services..."

    # Stop and remove the database container if it exists
    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo "Stopping and removing container: ${CONTAINER_NAME}"
        docker stop "${CONTAINER_NAME}" && docker rm "${CONTAINER_NAME}"
    else
        echo "Container ${CONTAINER_NAME} not found. Skipping removal."
    fi

    # Stop and remove the backend container if it exists
    if docker ps -a --format '{{.Names}}' | grep -q "^${BACKEND_CONTAINER_NAME}$"; then
        echo "Stopping and removing container: ${BACKEND_CONTAINER_NAME}"
        docker stop "${BACKEND_CONTAINER_NAME}" && docker rm "${BACKEND_CONTAINER_NAME}"
    else
        echo "Container ${BACKEND_CONTAINER_NAME} not found. Skipping removal."
    fi

    # Stop and remove the Mosquitto container if it exists
    if docker ps -a --format '{{.Names}}' | grep -q "^${MOSQUITTO_CONTAINER_NAME}$"; then
        echo "Stopping and removing container: ${MOSQUITTO_CONTAINER_NAME}"
        docker stop "${MOSQUITTO_CONTAINER_NAME}" && docker rm "${MOSQUITTO_CONTAINER_NAME}"
    else
        echo "Container ${MOSQUITTO_CONTAINER_NAME} not found. Skipping removal."
    fi

    # Stop and remove the frontend container if it exists
    if docker ps -a --format '{{.Names}}' | grep -q "^${FRONTEND_CONTAINER_NAME}$"; then
        echo "Stopping and removing container: ${FRONTEND_CONTAINER_NAME}"
        docker stop "${FRONTEND_CONTAINER_NAME}" && docker rm "${FRONTEND_CONTAINER_NAME}"
    else
        echo "Container ${FRONTEND_CONTAINER_NAME} not found. Skipping removal."
    fi

    # Bring down docker-compose services and remove associated volumes
    echo "Running docker compose down..."
    docker compose -f "$COMPOSE_FILE" down -v

    # Remove the named volume manually
    if docker volume ls --format '{{.Name}}' | grep -q "^${VOLUME_NAME}$"; then
        echo "Removing volume: ${VOLUME_NAME}"
        docker volume rm "${VOLUME_NAME}"
    else
        echo "Volume ${VOLUME_NAME} not found. Skipping removal."
    fi

    echo "Shutdown complete."
}

# Function to start up all services
startup() {
    echo "Starting up services..."

    # Start docker-compose services
    docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d --build

    echo "Startup complete."
}

# Function to reload only the backend service
reloadBackend() {
    if docker ps -a --format '{{.Names}}' | grep -q "^${BACKEND_CONTAINER_NAME}$"; then
        echo "Restarting backend container: ${BACKEND_CONTAINER_NAME}"
        docker stop "${BACKEND_CONTAINER_NAME}" && docker start "${BACKEND_CONTAINER_NAME}"
    else
        echo "Backend container ${BACKEND_CONTAINER_NAME} not found."
    fi

    echo "Backend reloaded."
}

# Function to rebuild only the frontend service
reloadFrontend() {
    echo "Rebuilding frontend container..."

    # Stop & remove the old container if it exists
    if docker ps -a --format '{{.Names}}' | grep -q "^${FRONTEND_CONTAINER_NAME}$"; then
        echo "Stopping and removing: ${FRONTEND_CONTAINER_NAME}"
        docker stop "${FRONTEND_CONTAINER_NAME}" && docker rm "${FRONTEND_CONTAINER_NAME}"
    else
        echo "Container ${FRONTEND_CONTAINER_NAME} not found. Proceeding to build."
    fi

    # Re‑build the frontend image and start that service only
    docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" build frontend
    docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d frontend

    echo "Frontend rebuilt and restarted."
}

# Function to stop all services without removing them
down() {
    echo "Stopping containers..."

    # Stop database container if it exists
    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo "Stopping container: ${CONTAINER_NAME}"
        docker stop "${CONTAINER_NAME}"
    else
        echo "Container ${CONTAINER_NAME} not found."
    fi

    # Stop backend container if it exists
    if docker ps -a --format '{{.Names}}' | grep -q "^${BACKEND_CONTAINER_NAME}$"; then
        echo "Stopping container: ${BACKEND_CONTAINER_NAME}"
        docker stop "${BACKEND_CONTAINER_NAME}"
    else
        echo "Container ${BACKEND_CONTAINER_NAME} not found."
    fi

    # Stop Mosquitto container if it exists
    if docker ps -a --format '{{.Names}}' | grep -q "^${MOSQUITTO_CONTAINER_NAME}$"; then
        echo "Stopping container: ${MOSQUITTO_CONTAINER_NAME}"
        docker stop "${MOSQUITTO_CONTAINER_NAME}"
    else
        echo "Container ${MOSQUITTO_CONTAINER_NAME} not found."
    fi

    # Stop frontend container if it exists
    if docker ps -a --format '{{.Names}}' | grep -q "^${FRONTEND_CONTAINER_NAME}$"; then
        echo "Stopping container: ${FRONTEND_CONTAINER_NAME}"
        docker stop "${FRONTEND_CONTAINER_NAME}"
    else
        echo "Container ${FRONTEND_CONTAINER_NAME} not found."
    fi

    echo "Containers stopped."
}

# Check script arguments
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 {shutdown|startup|reloadBackend|down}"
    exit 1
fi

# Execute the appropriate function based on the argument
case "$1" in
    shutdown)
        shutdown
        ;;
    startup)
        startup
        ;;
    reloadBackend)
        reloadBackend
        ;;
    reloadFrontend)
        reloadFrontend
        ;;
    down)
        down
        ;;
    *)
        echo "Invalid command. Usage: $0 {shutdown|startup|reloadBackend|down}"
        exit 1
        ;;
esac