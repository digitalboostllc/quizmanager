# Backup System for Quizzer Application

This document describes the automated backup system for the Quizzer application.

## Overview

The backup system provides continuous, automated backups of:
- PostgreSQL database
- Code and configuration files
- Environment files (.env*)
- Upload directories (if they exist)

Backups run on a regular schedule and are stored in a structured directory.

## Scripts

The system consists of four shell scripts:

1. **backup_system.sh** - The core backup script that runs continuously
2. **start_backup.sh** - Starts the backup system as a background process
3. **stop_backup.sh** - Stops the backup system
4. **status_backup.sh** - Checks the status of the backup system

## Configuration

The backup system is configured in `backup_system.sh`. Key configuration parameters:

```bash
# Base directory for storing backups
BACKUP_DIR="/backups/quizzer"

# Number of days to keep backups before deletion
RETENTION_DAYS=14

# Time between backups in seconds (default: 24 hours)
# For 3 hours, use: BACKUP_INTERVAL=10800
BACKUP_INTERVAL=86400

# Database connection details
DB_USER="said"
DB_NAME="fbquiz"
DB_HOST="localhost"
DB_PORT="5432"
```

**Important:** Before running the backup system, modify these settings if needed, particularly:
- Ensure `BACKUP_DIR` points to a directory with sufficient storage
- Update database connection details if they differ from the defaults

## Usage

### Starting the Backup System

To start the backup system:

```bash
./start_backup.sh
```

This will:
- Start the backup system in the background
- Create a PID file to track the process
- Output logs to the logs directory

### Checking Status

To check the status of the backup system:

```bash
./status_backup.sh
```

This displays:
- Whether the backup system is running
- Process ID and start time
- Log information
- Details about existing backups
- Storage usage

### Stopping the Backup System

To stop the backup system:

```bash
./stop_backup.sh
```

This will gracefully stop the backup process and remove the PID file.

## Backup Structure

Backups are organized in the following structure:

```
/backups/quizzer/
├── database/         # Database dumps
├── code/             # Code backups
├── environment/      # Environment file backups
├── uploads/          # Upload file backups
└── backup.log        # Backup log file
```

Each backup is timestamped with the format `YYYYMMDD_HHMMSS`.

## Automated Cleanup

The system automatically removes backups older than the retention period (default: 14 days) to prevent disk space issues.

## Monitoring

- Check `status_backup.sh` for backup status
- Review logs in the backup log file
- Verify backup files are being created in the backup directory

## Running on System Startup

To run the backup system automatically on system startup, you can:

1. **Using crontab** (Linux/macOS):
   ```
   @reboot /path/to/start_backup.sh
   ```

2. **Using systemd** (Linux):
   Create a systemd service file in `/etc/systemd/system/quizzer-backup.service`:
   ```
   [Unit]
   Description=Quizzer Backup System
   After=network.target postgresql.service

   [Service]
   User=your_username
   WorkingDirectory=/path/to/quizzer
   ExecStart=/path/to/quizzer/backup_system.sh
   Restart=on-failure

   [Install]
   WantedBy=multi-user.target
   ```

   Then enable and start the service:
   ```
   sudo systemctl enable quizzer-backup
   sudo systemctl start quizzer-backup
   ```

## Troubleshooting

1. **Backup not running:**
   - Check if process is running: `ps aux | grep backup_system`
   - Verify PID file exists
   - Check startup logs for errors

2. **Database backup failures:**
   - Verify PostgreSQL is running
   - Check database credentials
   - Ensure user has permissions to run pg_dump

3. **Disk space issues:**
   - Reduce retention period
   - Move backups to a larger disk
   - Exclude larger files/directories from code backups 