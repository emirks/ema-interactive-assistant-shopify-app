# 🚀 Shopify App Deployment Guide

## 📐 Architecture Overview

```
┌─────────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│   Shopify App       │    │   Main Server        │    │   Shopify Store     │
│  (Frontend Admin)   │    │  (Voice Backend)     │    │    (Widget)         │
│                     │    │                      │    │                     │
│  • Admin interface  │    │  • WebSocket server  │    │  • Voice chat UI    │
│  • App settings     │    │  • Audio processing  │    │  • Customer facing  │
│  • Theme editor     │    │  • AI conversation   │    │  • Store frontend   │
└─────────────────────┘    └──────────────────────┘    └─────────────────────┘
         │                           ▲                           │
         └───────────────────────────┼───────────────────────────┘
                                     │
                              WebSocket Connection
```

## 🎯 **Step 1: Deploy Main Server (Voice Backend)**

**Repository**: `main-server/` directory  
**Purpose**: Handles voice processing, AI conversations, WebSocket connections  

### Deploy to Railway/Render/Vercel:
1. Create new project from `main-server/` directory
2. Set environment variables:
   ```bash
   # AI/Voice Processing
   OPENAI_API_KEY=your_openai_key
   DEEPGRAM_API_KEY=your_deepgram_key
   ELEVENLABS_API_KEY=your_elevenlabs_key
   
   # Shopify Integration
   SHOPIFY_SHOP_URL=your_shop_url
   SHOPIFY_API_VERSION=2025-01
   SHOPIFY_ACCESS_TOKEN=your_access_token
   
   # Database
   DATABASE_URL=your_database_url
   ```

3. **Your main server URL will be**: `https://YOUR_MAIN_SERVER_DOMAIN.railway.app`

## 🏪 **Step 2: Deploy Shopify App (Frontend)**

**Repository**: `ema-interactive-assistant/` directory  
**Purpose**: Shopify admin interface, app settings, theme editor integration  

### Deploy to Vercel (RECOMMENDED):
1. **Go to [vercel.com](https://vercel.com)** and import from GitHub
2. **Vercel automatically detects Remix** - no configuration needed!
3. Set environment variables:
   ```bash
   # Shopify App Credentials
   SHOPIFY_API_KEY=564256729c36fe4740cf7a84befaa490
   SHOPIFY_API_SECRET=your_shopify_api_secret
   SCOPES=write_products
   
   # Database
   DATABASE_URL=your_database_url
   ```

4. **Your Shopify app URL will be**: `https://YOUR_SHOPIFY_APP_DOMAIN.vercel.app`

### Deploy to Railway (ALTERNATIVE):
1. Create new project from `ema-interactive-assistant/` directory
2. Railway will use the existing `railway.json` configuration
3. Set the same environment variables as above

## 🔧 **Step 3: Update Configuration Files**

### A. Update `shopify.app.toml`:
```toml
# Replace YOUR_SHOPIFY_APP_DOMAIN with your actual Shopify app deployment URL
application_url = "https://YOUR_SHOPIFY_APP_DOMAIN.vercel.app"

[auth]
redirect_urls = [
  "https://YOUR_SHOPIFY_APP_DOMAIN.vercel.app/auth/callback",
  "https://YOUR_SHOPIFY_APP_DOMAIN.vercel.app/auth/shopify/callback", 
  "https://YOUR_SHOPIFY_APP_DOMAIN.vercel.app/api/auth/callback"
]
```

### B. Update widget default URL in `app_embed.liquid`:
```liquid
<!-- Replace YOUR_MAIN_SERVER_DOMAIN with your actual main server deployment URL -->
data-api-url="{{ block.settings.api_url | default: 'wss://YOUR_MAIN_SERVER_DOMAIN.railway.app/user-audio-input' }}"
```

## 🏬 **Step 4: Shopify Partner Dashboard**

1. **Go to**: [partners.shopify.com](https://partners.shopify.com)
2. **Find your app**: "ema-interactive-assistant" 
3. **Update App Setup**:
   - **App URL**: `https://YOUR_SHOPIFY_APP_DOMAIN.vercel.app`
   - **Allowed redirection URLs**: 
     ```
     https://YOUR_SHOPIFY_APP_DOMAIN.vercel.app/auth/callback
     https://YOUR_SHOPIFY_APP_DOMAIN.vercel.app/auth/shopify/callback
     https://YOUR_SHOPIFY_APP_DOMAIN.vercel.app/api/auth/callback
     ```

## 🛍️ **Step 5: Install & Configure in Shopify Store**

1. **Install app** in your development store
2. **Go to**: Online Store → Themes → Customize
3. **Add app block**: "Voice Chat Widget"
4. **Configure**: Set "Voice Backend URL" to `wss://YOUR_MAIN_SERVER_DOMAIN.railway.app/user-audio-input`
5. **Save theme**

## 📝 **URL Replacement Checklist**

### ✅ Replace in Files:
- [ ] `shopify.app.toml` → `YOUR_SHOPIFY_APP_DOMAIN`
- [ ] `app_embed.liquid` → `YOUR_MAIN_SERVER_DOMAIN`

### ✅ Replace in Shopify Partner Dashboard:
- [ ] App URL → `YOUR_SHOPIFY_APP_DOMAIN`
- [ ] Redirect URLs → `YOUR_SHOPIFY_APP_DOMAIN`

### ✅ Replace in Store Theme:
- [ ] Widget settings → `YOUR_MAIN_SERVER_DOMAIN`

## 🎉 **Final Architecture**

```
🏪 Shopify Store Customer
        ↓ (clicks voice widget)
🎯 Voice Chat Widget (in store theme)
        ↓ (WebSocket connection)
🖥️ Main Server (voice backend)
        ↓ (processes AI, returns audio)
🎯 Voice Chat Widget (plays response)
        ↓ (admin configuration)
📊 Shopify App (admin interface)
```

## 🔍 **Testing Your Deployment**

1. **Test Shopify App**: Visit your Shopify app URL directly
2. **Test Widget**: Visit your store and click the voice widget
3. **Check Logs**: Monitor both deployments for errors
4. **Test Audio**: Speak into the widget and verify responses

## 🆘 **Troubleshooting**

- **Widget not appearing**: Check theme customization settings
- **No audio response**: Verify main server WebSocket URL
- **Connection errors**: Check CORS settings and WebSocket protocols (wss://)
- **Authentication issues**: Verify Shopify Partner Dashboard URLs match deployment URLs

## 📚 **Platform-Specific Notes**

### Vercel (Recommended for Shopify App):
- ✅ **Zero configuration** - Vercel automatically detects Remix
- ✅ **No vercel.json needed** - Works out of the box
- ✅ **Excellent Remix support** with streaming and SSR

### Railway (Good for both projects):
- ✅ **Uses railway.json** configuration file
- ✅ **Simple environment variable management**
- ✅ **Good for full-stack applications** 