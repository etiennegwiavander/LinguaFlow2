#!/bin/bash

# Script to automatically set GEMINI_API_KEY for all Edge Functions
# Requires Supabase CLI to be installed and authenticated

echo "🔧 Setting up Edge Function Secrets"
echo "===================================="
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed"
    echo ""
    echo "📦 Install it with:"
    echo "   npm install -g supabase"
    echo "   or"
    echo "   brew install supabase/tap/supabase"
    echo ""
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Load environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | grep GEMINI_API_KEY | xargs)
else
    echo "❌ .env.local file not found"
    exit 1
fi

if [ -z "$GEMINI_API_KEY" ]; then
    echo "❌ GEMINI_API_KEY not found in .env.local"
    exit 1
fi

echo "✅ GEMINI_API_KEY loaded from .env.local"
echo "   Value: ${GEMINI_API_KEY:0:20}..."
echo ""

# Set the secret
echo "📋 Setting GEMINI_API_KEY secret..."
supabase secrets set GEMINI_API_KEY="$GEMINI_API_KEY"

if [ $? -eq 0 ]; then
    echo "✅ Secret set successfully"
else
    echo "❌ Failed to set secret"
    exit 1
fi

echo ""
echo "📋 Deploying Edge Functions..."
echo ""

# Deploy all AI-powered Edge Functions
FUNCTIONS=(
    "generate-lesson-plan"
    "generate-discussion-questions"
    "generate-vocabulary-words"
    "generate-interactive-material"
    "generate-topic-description"
)

for func in "${FUNCTIONS[@]}"; do
    echo "   Deploying $func..."
    supabase functions deploy "$func"
    
    if [ $? -eq 0 ]; then
        echo "   ✅ $func deployed"
    else
        echo "   ⚠️  $func deployment failed (may not exist)"
    fi
    echo ""
done

echo "===================================="
echo "✅ Setup complete!"
echo ""
echo "🧪 Test the fix with:"
echo "   node scripts/verify-ai-generation-fix.js"
echo ""
