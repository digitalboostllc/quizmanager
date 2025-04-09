#!/bin/bash

# start_backup.sh - Start the backup system as a background process

# Get the absolute path to the backup script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
BACKUP_SCRIPT="${SCRIPT_DIR}/backup_system.sh"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/../.." &> /dev/null && pwd)"

# Check if the backup script exists
if [ ! -f "${BACKUP_SCRIPT}" ]; then
    echo "Error: Backup script not found at ${BACKUP_SCRIPT}"
    exit 1
fi

# Check if the script is executable
if [ ! -x "${BACKUP_SCRIPT}" ]; then
    echo "Making backup script executable..."
    chmod +x "${BACKUP_SCRIPT}"
fi

# Create a log directory if it doesn't exist
mkdir -p "${PROJECT_DIR}/logs"

# Start the backup script in the background with nohup
echo "Starting backup system in the background..."
nohup "${BACKUP_SCRIPT}" > "${PROJECT_DIR}/logs/backup.out" 2>&1 &

# Save the process ID
echo $! > "${PROJECT_DIR}/backup.pid"
echo "Backup system started with PID $(cat ${PROJECT_DIR}/backup.pid)"
echo "Logs are available at ${PROJECT_DIR}/logs/backup.out" 