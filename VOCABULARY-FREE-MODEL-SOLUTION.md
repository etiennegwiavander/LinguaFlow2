# Vocabulary Generation - Free Model Configuration

## Issue Identified

The 402 Payment Required error was occurring because:

1. **Wrong Model**: We were using `deepseek/deepseek-chat` (paid model)
2. **Free Model Requires Configuration**: Free models like `deepseek/deepseek-chat-v3.1:free` require OpenRouter account privacy settings to be configured

## Available Free DeepSeek Models

```
- deepseek/deepseek-chat-v3.1:free
- deepseek/deepseek-r1:free
- deepseek/deepseek-r1-0528:free
- deepseek/deepseek-chat-v3-0324:free
- deepseek/deepseek-r1-distill-llama-70b:free
```

## Solution Options

### Option 1: Enable Free Models (Recommended)

1. Go to https://openrouter.ai/settings/privacy
2. Enable "Free model publication" in your data policy settings
3. Update Edge Function to use: `deepseek/deepseek-chat-v3.1:free`

### Option 2: Use Paid Model (Current - Very Low Cost)

Currently using `deepseek/deepseek-chat` which costs:
- Prompt: $0.0000003 per token
- Completion: $0.0000012 per token

**Cost per vocabulary generation request:**
- ~500 prompt tokens = $0.00015
- ~2000 completion tokens = $0.0024
- **Total: ~$0.0025 per request** (less than 1/4 cent)

For 1000 vocabulary generations: ~$2.50

## Current Status

✅ Using `deepseek/deepseek-chat` (paid but extremely cheap)
- Model is working correctly
- Cost is negligible for typical usage
- No configuration changes needed

## To Switch to Free Model

If you want to use the completely free model:

1. Configure OpenRouter privacy settings (link above)
2. Update `supabase/functions/generate-vocabulary-words/index.ts`:
   ```typescript
   model: "deepseek/deepseek-chat-v3.1:free"
   ```
3. Redeploy: `supabase functions deploy generate-vocabulary-words`

## Testing Commands

```bash
# List all available models
node scripts/list-openrouter-models.js

# Test specific model
node scripts/test-free-model.js

# Test vocabulary generation
node scripts/test-vocabulary-direct-api.js
```
