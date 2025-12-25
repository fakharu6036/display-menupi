#!/bin/bash

# MENUPI Environment Variables Formatter
# Formats .env.local with correct VITE_ prefixes

set -e

ENV_FILE=".env.local"
BACKUP_FILE="${ENV_FILE}.backup.$(date +%Y%m%d_%H%M%S)"

echo "🔧 MENUPI Environment Variables Formatter"
echo "=========================================="
echo ""

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ .env.local not found!"
    exit 1
fi

# Create backup
cp "$ENV_FILE" "$BACKUP_FILE"
echo "✅ Backup created: $BACKUP_FILE"
echo ""

# Create formatted output
TEMP_FILE=$(mktemp)
CHANGES=0

echo "📝 Processing variables..."
echo ""

# Process each line
while IFS= read -r line || [ -n "$line" ]; do
    # Skip empty lines
    if [[ -z "$line" ]] || [[ "$line" =~ ^[[:space:]]*$ ]]; then
        echo "" >> "$TEMP_FILE"
        continue
    fi
    
    # Keep comments as-is
    if [[ "$line" =~ ^[[:space:]]*# ]]; then
        echo "$line" >> "$TEMP_FILE"
        continue
    fi
    
    # Process variable assignments
    if [[ "$line" =~ ^[[:space:]]*([^=]+)=(.*)$ ]]; then
        KEY="${BASH_REMATCH[1]}"
        VALUE="${BASH_REMATCH[2]}"
        
        # Trim whitespace
        KEY=$(echo "$KEY" | xargs)
        VALUE=$(echo "$VALUE" | xargs)
        
        # Convert to uppercase
        KEY_UPPER=$(echo "$KEY" | tr '[:lower:]' '[:upper:]' | tr '-' '_')
        
        # Determine if it needs VITE_ prefix (frontend variables)
        NEEDS_VITE=false
        
        # Frontend variables that need VITE_ prefix
        if [[ "$KEY_UPPER" =~ ^(API_BASE_URL|API_URL|PORT|GEMINI_API_KEY)$ ]] && [[ ! "$KEY_UPPER" =~ ^VITE_ ]]; then
            NEEDS_VITE=true
        fi
        
        # Backend variables that should NOT have VITE_ prefix
        if [[ "$KEY_UPPER" =~ ^(DB_|JWT_|NODE_|API_|PROTOCOL|DOMAIN|PORT)$ ]] || [[ "$KEY_UPPER" =~ ^(DB_HOST|DB_USER|DB_PASSWORD|DB_NAME|JWT_SECRET|API_URL|PROTOCOL|DOMAIN|NODE_ENV)$ ]]; then
            NEEDS_VITE=false
            # Remove VITE_ if present
            KEY_UPPER=$(echo "$KEY_UPPER" | sed 's/^VITE_//')
        fi
        
        # Add VITE_ prefix if needed
        if [ "$NEEDS_VITE" = true ]; then
            KEY_UPPER="VITE_$KEY_UPPER"
            if [ "$KEY" != "$KEY_UPPER" ]; then
                echo "  ✅ Fixed: $KEY → $KEY_UPPER"
                CHANGES=$((CHANGES + 1))
            fi
        fi
        
        # Write formatted line
        echo "$KEY_UPPER=$VALUE" >> "$TEMP_FILE"
    else
        # Keep line as-is if it doesn't match pattern
        echo "$line" >> "$TEMP_FILE"
    fi
done < "$ENV_FILE"

# Replace original file
mv "$TEMP_FILE" "$ENV_FILE"

echo ""
if [ $CHANGES -gt 0 ]; then
    echo "✅ Formatting complete! Fixed $CHANGES variable(s)"
else
    echo "✅ Formatting complete! No changes needed"
fi
echo ""
echo "📋 Summary:"
echo "   - Frontend variables now have VITE_ prefix"
echo "   - Backend variables have no prefix"
echo "   - All keys are uppercase"
echo "   - Backup saved to: $BACKUP_FILE"
echo ""
echo "🔍 Review your .env.local file to verify:"
echo "   - VITE_API_BASE_URL (frontend)"
echo "   - DB_HOST, DB_USER, etc. (backend, no VITE_)"
echo ""

