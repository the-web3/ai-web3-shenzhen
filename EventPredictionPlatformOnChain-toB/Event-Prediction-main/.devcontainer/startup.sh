#!/bin/bash
# Startup script - runs on every container start
# Ensures SSH service is running

# Check if SSH is already running
if pgrep -x sshd > /dev/null; then
    exit 0  # SSH already running, nothing to do
fi

# Start SSH service
if ps -p 1 -o comm= | grep -q systemd; then
    # systemd is PID 1 (actually running)
    sudo systemctl start ssh >/dev/null 2>&1 || true
else
    # Fallback for non-systemd containers (sysvinit)
    sudo service ssh start >/dev/null 2>&1 || sudo /usr/sbin/sshd >/dev/null 2>&1 || true
fi
