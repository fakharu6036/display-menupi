#!/bin/bash

# MENUPI Environment Variables Formatter
# This script formats your .env.local file correctly

set -e

ENV_FILE=".env.local"
EXAMPLE_FILE=".env.local.example"

echo "🔧 MENUPI Environment Variables Formatter"
echo "=========================================="
echo ""

# Check if .env.local exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ .env.local not found!"
    echo "   Creating from template..."
    cp "$EXAMPLE_FILE" "$ENV_FILE"
    echo "✅ Created .env.local from template"
    echo "   Please edit .env.local and add your credentials"
    exit 0
fi

echo "📝 Formatting $ENV_FILE..."
echo ""

# Create backup
cp "$ENV_FILE" "${ENV_FILE}.backup"
echo "✅ Backup created: ${ENV_FILE}.backup"
echo ""

# Read and format the file
TEMP_FILE=$(mktemp)

# Process the file line by line
while IFS= read -r line || [ -n "$line" ]; do
    # Skip empty lines and comments
    if [[ -z "$line" ]] || [[ "$line" =~ ^[[:space:]]*# ]]; then
        echo "$line" >> "$TEMP_FILE"
        continue
    fi
    
    # Remove leading/trailing whitespace
    line=$(echo "$line" | xargs)
    
    # Skip if empty after trimming
    if [ -z "$line" ]; then
        echo "" >> "$TEMP_FILE"
        continue
    fi
    
    # Check if line has = sign
    if [[ "$line" =~ = ]]; then
        KEY=$(echo "$line" | cut -d'=' -f1 | xargs)
        VALUE=$(echo "$line" | cut -d'=' -f2- | xargs)
        
        # Format key (uppercase, no spaces)
        KEY=$(echo "$KEY" | tr '[:lower:]' '[:upper:]' | tr -d ' ' | tr '-' '_')
        
        # Check if it's a frontend variable (should start with VITE_)
        if [[ "$KEY" =~ ^(API_BASE_URL|API_URL|PORT|GEMINI_API_KEY)$ ]] && [[ ! "$KEY" =~ ^VITE_ ]]; then
            # Add VITE_ prefix for frontend variables
            KEY="VITE_$KEY"
            echo "⚠️  Added VITE_ prefix to: $KEY"
        fi
        
        # Ensure no spaces around =
        echo "$KEY=$VALUE" >> "$TEMP_FILE"
    else
        # Keep line as-is if no = sign
        echo "$line" >> "$TEMP_FILE"
    fi
done < "$ENV_FILE"

# Replace original file
mv "$TEMP_FILE" "$ENV_FILE"

echo ""
echo "✅ Formatting complete!"
echo ""
echo "📋 Summary of changes:"
echo "   - All keys are uppercase"
echo "   - Frontend variables have VITE_ prefix"
echo "   - Backend variables have no prefix"
echo "   - Backup saved to: ${ENV_FILE}.backup"
echo ""
echo "🔍 Please review $ENV_FILE and verify:"
echo "   - Frontend vars start with VITE_"
echo "   - Backend vars have no prefix"
echo "   - All values are correct"
echo ""

