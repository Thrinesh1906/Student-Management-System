#!/bin/sh
set -e
cp -n backend/.env.example backend/.env 2>/dev/null || true
echo "Environment files ready. Edit backend/.env for production secrets."
