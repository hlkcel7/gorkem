#!/bin/bash

# Build ve debug için manuel script
cd /workspaces/gorkem

echo "🏗️  Building project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    echo "📦 Creating timestamped distribution..."
    node scripts/zip-dist-timestamped.js
    
    echo "🔍 Latest dist files:"
    ls -la dist*.zip | tail -3
    
    echo "✅ Build and package complete!"
else
    echo "❌ Build failed!"
    exit 1
fi
