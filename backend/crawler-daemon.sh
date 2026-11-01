#!/usr/bin/env bash
set -euo pipefail

export PATH="/Users/s-ikari/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

echo "=== Sansu Drill agy Crawler Daemon Starting ==="
echo "Working directory: $PROJECT_DIR"
echo "Python: $(which python3)"
echo "AGY: $(which agy || echo 'not in PATH')"

exec /opt/homebrew/bin/python3 backend/sync_and_generate.py "$@"
