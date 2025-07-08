# 🆓 Free AI Setup Guide

Your AI Memory Coach now supports multiple **FREE** AI providers! No more quota issues.

## 🚀 Quick Setup (Recommended: Google Gemini)

### Option 1: Google Gemini (Best Free Option)

**✅ FREE: 15 requests/minute, 1 million tokens/month**

1. **Get API Key**:

   - Go to: https://makersuite.google.com/app/apikey
   - Sign in with Google account
   - Click "Create API Key"
   - Copy the key

2. **Configure**:

   ```bash
   # Edit backend/.env
   AI_PROVIDER=gemini
   GEMINI_API_KEY=your_actual_gemini_key_here
   ```

3. **Test**:
   ```bash
   cd backend
   npm run test-ai
   ```

### Option 2: Cohere (Coming Soon)

**✅ FREE: 5 million tokens/month**

- Get key: https://dashboard.cohere.ai/api-keys
- Set `AI_PROVIDER=cohere` in .env

### Option 3: Hugging Face (Coming Soon)

**✅ FREE: 30,000 characters/month**

- Get key: https://huggingface.co/settings/tokens
- Set `AI_PROVIDER=huggingface` in .env

### Option 4: OpenAI (If you have credits)

**💰 Paid after $5 free credits**

- Get key: https://platform.openai.com/api-keys
- Set `AI_PROVIDER=openai` in .env

## 🔧 Current Configuration

Your `.env` file should look like:

```env
# Choose your provider
AI_PROVIDER=gemini

# Add your chosen provider's key
GEMINI_API_KEY=your_actual_key_here
```

## 🧪 Testing

```bash
cd backend
npm run test-ai
```

## 📊 Provider Comparison

| Provider    | Free Limit      | Quality    | Speed  | Setup |
| ----------- | --------------- | ---------- | ------ | ----- |
| **Gemini**  | 1M tokens/month | ⭐⭐⭐⭐⭐ | Fast   | Easy  |
| Cohere      | 5M tokens/month | ⭐⭐⭐⭐   | Fast   | Easy  |
| HuggingFace | 30K chars/month | ⭐⭐⭐     | Medium | Easy  |
| OpenAI      | $5 one-time     | ⭐⭐⭐⭐⭐ | Fast   | Paid  |

## 🆘 Fallback Mode

Even without AI keys, the app works with:

- ✅ Basic text summaries
- ✅ Visit statistics
- ✅ Domain analysis
- ✅ Learning content tracking

## 🚀 Next Steps

1. **Get Gemini API key** (recommended)
2. **Update .env file**
3. **Test with `npm run test-ai`**
4. **Start server with `npm run dev`**
5. **Try AI features in extension**

## 💡 Pro Tips

- **Gemini** is best for most users (generous free tier)
- **Cohere** is great for pure text tasks
- **HuggingFace** is good for experimentation
- **Fallback mode** always works without any keys

## 🔗 Useful Links

- [Google AI Studio](https://makersuite.google.com/app/apikey) - Get Gemini key
- [Cohere Dashboard](https://dashboard.cohere.ai/api-keys) - Get Cohere key
- [Hugging Face Tokens](https://huggingface.co/settings/tokens) - Get HF key
- [OpenAI Platform](https://platform.openai.com/api-keys) - Get OpenAI key

---

**Need help?** The app works great even without AI keys - try the fallback summaries first!
