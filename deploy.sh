#!/bin/bash
set -e

cd /home/ubuntu/codespace/personal-finance-tracker

echo "Pulling latest changes..."
git pull

echo "Building frontend..."
cd frontend
npm run build
cd ..

echo "Restarting Flask backend..."
sudo systemctl restart finance-tracker.service

echo "Done."
