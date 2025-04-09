#!/bin/bash

# stop_backup.sh - Stop the backup system running in the background

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/../.." &> /dev/null && pwd)"
PID_FILE="${PROJECT_DIR}/backup.pid"

# Check if the PID file exists
if [ ! -f "${PID_FILE}" ]; then
    echo "Error: PID file not found at ${PID_FILE}"
    echo "Backup system may not be running or was started without using start_backup.sh"
    exit 1
fi

# Read the PID
PID=$(cat "${PID_FILE}")

# Check if the process is running
if ps -p "${PID}" > /dev/null; then
    echo "Stopping backup system with PID ${PID}..."
    kill "${PID}"
    
    # Wait a moment to see if the process was killed
    sleep 2
    
    # Check again if the process is still running
    if ps -p "${PID}" > /dev/null; then
        echo "Process didn't stop. Forcing termination..."
        kill -9 "${PID}"
    fi
    
    echo "Backup system stopped."
else
    echo "No backup process found with PID ${PID}."
fi

# Remove the PID file
rm -f "${PID_FILE}"
echo "Removed PID file." 