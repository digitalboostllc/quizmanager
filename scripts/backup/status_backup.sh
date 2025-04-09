#!/bin/bash

# status_backup.sh - Check the status of the backup system

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/../.." &> /dev/null && pwd)"
PID_FILE="${PROJECT_DIR}/backup.pid"
LOG_FILE="${PROJECT_DIR}/logs/backup.out"
BACKUP_DIR="/Users/said/Library/Mobile Documents/com~apple~CloudDocs/quizzer"
BACKUP_LOG="${BACKUP_DIR}/backup.log"

echo "=== Backup System Status ==="

# Check if the PID file exists
if [ ! -f "${PID_FILE}" ]; then
    echo "Status: NOT RUNNING"
    echo "PID file not found at ${PID_FILE}"
    exit 1
fi

# Read the PID
PID=$(cat "${PID_FILE}")

# Check if the process is running
if ps -p "${PID}" > /dev/null; then
    echo "Status: RUNNING"
    echo "Process ID: ${PID}"
    echo "Running since: $(ps -p ${PID} -o lstart=)"
else
    echo "Status: NOT RUNNING (stale PID file)"
    echo "PID ${PID} not found in process list"
    echo "You may need to remove the stale PID file: ${PID_FILE}"
    exit 1
fi

# Check logs
echo ""
echo "=== Log Information ==="

if [ -f "${LOG_FILE}" ]; then
    LOG_SIZE=$(du -h "${LOG_FILE}" | cut -f1)
    LOG_MODIFIED=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "${LOG_FILE}")
    echo "Startup Log:"
    echo "  Location: ${LOG_FILE}"
    echo "  Size: ${LOG_SIZE}"
    echo "  Last modified: ${LOG_MODIFIED}"
    echo "  Last 5 lines:"
    echo "  --------------"
    tail -n 5 "${LOG_FILE}" | sed 's/^/  /'
else
    echo "Startup log not found at ${LOG_FILE}"
fi

echo ""

if [ -f "${BACKUP_LOG}" ]; then
    LOG_SIZE=$(du -h "${BACKUP_LOG}" | cut -f1)
    LOG_MODIFIED=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "${BACKUP_LOG}")
    echo "Backup Log:"
    echo "  Location: ${BACKUP_LOG}"
    echo "  Size: ${LOG_SIZE}"
    echo "  Last modified: ${LOG_MODIFIED}"
    echo "  Last 10 lines:"
    echo "  --------------"
    tail -n 10 "${BACKUP_LOG}" | sed 's/^/  /'
else
    echo "Backup log not found at ${BACKUP_LOG}"
    echo "This may indicate the backup system hasn't completed its first backup yet"
    echo "or the backup directory is misconfigured."
fi

# Check backup directory
echo ""
echo "=== Backup Storage Information ==="

if [ -d "${BACKUP_DIR}" ]; then
    TOTAL_SIZE=$(du -sh "${BACKUP_DIR}" | cut -f1)
    DB_BACKUPS=$(find "${BACKUP_DIR}/database" -name "*.sql.gz" | wc -l | tr -d ' ')
    CODE_BACKUPS=$(find "${BACKUP_DIR}/code" -name "*.tar.gz" | wc -l | tr -d ' ')
    ENV_BACKUPS=$(find "${BACKUP_DIR}/environment" -name ".env*" | wc -l | tr -d ' ')
    UPLOAD_BACKUPS=$(find "${BACKUP_DIR}/uploads" -name "*.tar.gz" | wc -l | tr -d ' ')
    
    echo "Backup directory: ${BACKUP_DIR}"
    echo "Total size: ${TOTAL_SIZE}"
    echo "Database backups: ${DB_BACKUPS}"
    echo "Codebase backups: ${CODE_BACKUPS}"
    echo "Environment backups: ${ENV_BACKUPS}"
    echo "Upload backups: ${UPLOAD_BACKUPS}"
    
    # Show most recent backups
    echo ""
    echo "Most recent database backup:"
    ls -lt "${BACKUP_DIR}/database" | grep -v "total" | head -1 | awk '{print "  "$9" - "$6" "$7" "$8}'
    
    echo "Most recent codebase backup:"
    ls -lt "${BACKUP_DIR}/code" | grep -v "total" | head -1 | awk '{print "  "$9" - "$6" "$7" "$8}'
else
    echo "Backup directory not found at ${BACKUP_DIR}"
    echo "This may indicate the backup system hasn't completed its first backup yet"
    echo "or the backup directory is misconfigured."
fi 