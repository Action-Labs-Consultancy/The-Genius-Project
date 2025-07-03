#!/bin/bash

# Install backend dependencies
cd backend
pip install -r requirements.txt

# Install frontend dependencies and build
cd ../frontend
npm install
npm run build
