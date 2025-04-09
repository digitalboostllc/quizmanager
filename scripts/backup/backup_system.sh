#!/bin/bash

# backup_system.sh - Comprehensive backup script for Quiz Manager application
# This script runs continuously in the background to create regular backups

# Get the script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/../.." &> /dev/null && pwd)"

# Configuration
BACKUP_DIR="/Users/said/Library/Mobile Documents/com~apple~CloudDocs/quizzer"
LOG_FILE="${BACKUP_DIR}/backup.log"
RETENTION_DAYS=7
BACKUP_INTERVAL=10080  # 3 hours in seconds

# Database connection details (from .env)
DB_USER="said"
DB_NAME="fbquiz"
DB_HOST="localhost"
DB_PORT="5432"

# Create backup directory structure if it doesn't exist
mkdir -p "${BACKUP_DIR}/database"
mkdir -p "${BACKUP_DIR}/code"
mkdir -p "${BACKUP_DIR}/uploads"
mkdir -p "${BACKUP_DIR}/environment"

# Logging function
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

# Cleanup old backups
cleanup_old_backups() {
    log_message "Cleaning up backups older than ${RETENTION_DAYS} days..."
    find "${BACKUP_DIR}" -type f -name "*.sql.gz" -mtime +${RETENTION_DAYS} -delete
    find "${BACKUP_DIR}" -type f -name "*.tar.gz" -mtime +${RETENTION_DAYS} -delete
    find "${BACKUP_DIR}" -type f -name "*.env.*" -mtime +${RETENTION_DAYS} -delete
    log_message "Cleanup completed."
}

# Backup database
backup_database() {
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="${BACKUP_DIR}/database/database_${TIMESTAMP}.sql.gz"
    
    log_message "Starting database backup..."
    
    # Use pg_dump to backup the database
    pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" | gzip > "${BACKUP_FILE}"
    
    if [ $? -eq 0 ]; then
        log_message "Database backup completed successfully: ${BACKUP_FILE}"
    else
        log_message "ERROR: Database backup failed!"
    fi
}

# Backup codebase
backup_codebase() {
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="${BACKUP_DIR}/code/codebase_${TIMESTAMP}.tar.gz"
    
    log_message "Starting codebase backup..."
    
    # Create a compressed archive of the codebase, excluding node_modules, .next, and other large/unnecessary directories
    tar --exclude="node_modules" --exclude=".next" --exclude=".git" --exclude="uploads" \
        -zcf "${BACKUP_FILE}" -C "${PROJECT_DIR}" .
    
    if [ $? -eq 0 ]; then
        log_message "Codebase backup completed successfully: ${BACKUP_FILE}"
    else
        log_message "ERROR: Codebase backup failed!"
    fi
}

# Backup environment files
backup_environment() {
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    ENV_BACKUP_DIR="${BACKUP_DIR}/environment"
    
    log_message "Starting environment files backup..."
    
    # Copy all .env files with timestamp
    for env_file in $(find "${PROJECT_DIR}" -name ".env*" -type f); do
        filename=$(basename "${env_file}")
        cp "${env_file}" "${ENV_BACKUP_DIR}/${filename}.${TIMESTAMP}"
    done
    
    log_message "Environment files backup completed."
}

# Backup uploads directory (if it exists)
backup_uploads() {
    if [ -d "${PROJECT_DIR}/uploads" ]; then
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        BACKUP_FILE="${BACKUP_DIR}/uploads/uploads_${TIMESTAMP}.tar.gz"
        
        log_message "Starting uploads backup..."
        
        tar -zcf "${BACKUP_FILE}" -C "${PROJECT_DIR}" uploads
        
        if [ $? -eq 0 ]; then
            log_message "Uploads backup completed successfully: ${BACKUP_FILE}"
        else
            log_message "ERROR: Uploads backup failed!"
        fi
    else
        log_message "No uploads directory found. Skipping uploads backup."
    fi
}

# Check if public/uploads directory exists and back it up
backup_public_uploads() {
    if [ -d "${PROJECT_DIR}/public/uploads" ]; then
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        BACKUP_FILE="${BACKUP_DIR}/uploads/public_uploads_${TIMESTAMP}.tar.gz"
        
        log_message "Starting public/uploads backup..."
        
        tar -zcf "${BACKUP_FILE}" -C "${PROJECT_DIR}/public" uploads
        
        if [ $? -eq 0 ]; then
            log_message "Public uploads backup completed successfully: ${BACKUP_FILE}"
        else
            log_message "ERROR: Public uploads backup failed!"
        fi
    else
        log_message "No public/uploads directory found. Skipping public uploads backup."
    fi
}

# Perform a complete backup
perform_backup() {
    log_message "Starting complete backup process..."
    
    # Backup each component
    backup_database
    backup_codebase
    backup_environment
    backup_uploads
    backup_public_uploads
    
    # Cleanup old backups
    cleanup_old_backups
    
    log_message "Backup process completed."
}

# Initial backup
log_message "Backup system initialized"
perform_backup

# Main loop - run backups at specified interval
while true; do
    log_message "Sleeping for ${BACKUP_INTERVAL} seconds until next backup..."
    sleep ${BACKUP_INTERVAL}
    perform_backup
done 