#!/bin/bash

# Script to update Supabase secrets with new OpenRouter API key
# This script reads from .env.local and updates Supabase

echo "🔐 Updating Supabase Secrets..."
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ Error: .env.local file not found!"
    echo "Please create .env.local with your API keys first."
    exit 1
fi

# Load environment variables from .env.local
source .env.local

# Check if OPENROUTER_API_KEY is set
if [ -z "$OPENROUTER_API_KEY" ]; then
    echo "❌ Error: OPENROUTER_API_KEY not found in .env.local"
    exit 1
fi

echo "✅ Found OPENROUTER_API_KEY in .env.local"
echo ""

# Update Supabase secret
echo "📤 Updating Supabase secret..."
supabase secrets set OPENROUTER_API_KEY="$OPENROUTER_API_KEY"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully updated Supabase secret!"
    echo ""
    echo "📋 Current secrets:"
    supabase secrets list
    echo ""
    echo "🧪 Test your Edge Functions with:"
    echo "   node test-lesson-generation.js"
    echo "   node test-deepseek-api.js"
else
    echo ""
    echo "❌ Failed to update Supabase secret"
    echo "Please make sure you're logged in: supabase login"
    exit 1
fi
