# Crackmate Backend

Production Node.js backend for Crackmate Electron app.

## Deployment on Render

1. Push this `backend/` folder to a Git repository
2. Create a new Web Service on Render
3. Connect your repository
4. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment Variables:**
     - `AZURE_API_KEY` = your Azure OpenAI key
     - `AZURE_API_URL` = your Azure endpoint URL
     - `AZURE_DEPLOYMENT_ID` = your deployment ID
     - `AZURE_SPEECH_KEY` = your Azure Speech key
     - `AZURE_SPEECH_REGION` = your Azure Speech region
     - `MONGODB_URI` = your MongoDB connection string

## API Endpoints

### POST /ai/chat
Send messages to AI for chat completion.

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "Your question here" }
  ],
  "stream": false
}
```

**Response:**
```json
{
  "reply": "AI response here"
}
```

### POST /ai/vision
Analyze an image with AI vision.

**Request:**
```json
{
  "imageBase64": "base64_encoded_image",
  "prompt": "What's in this image?"
}
```

**Response:**
```json
{
  "analysis": "Image analysis here"
}
```

### GET /config/speech
Get Azure Speech SDK configuration.

**Response:**
```json
{
  "key": "your_speech_key",
  "region": "your_region"
}
```

### GET /config/mongodb
Get MongoDB connection URI.

**Response:**
```json
{
  "uri": "your_mongodb_uri"
}
```

### POST /proxy
Proxy any external API call.

**Request:**
```json
{
  "url": "https://api.example.com/endpoint",
  "method": "POST",
  "headers": {},
  "data": {}
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "ok"
}
```

## Electron App Integration

Update your Electron app to use the backend URL:

```javascript
const BACKEND_URL = 'https://your-app.onrender.com';

// Chat completion
const response = await fetch(`${BACKEND_URL}/ai/chat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Hello' }]
  })
});

// Vision analysis
const visionResponse = await fetch(`${BACKEND_URL}/ai/vision`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    imageBase64: base64Image,
    prompt: 'Analyze this'
  })
});

// Get Speech config
const speechConfig = await fetch(`${BACKEND_URL}/config/speech`).then(r => r.json());

// Get MongoDB URI
const mongoConfig = await fetch(`${BACKEND_URL}/config/mongodb`).then(r => r.json());
```

## Local Development (Optional)

Create a `.env` file:
```
PORT=3000
AZURE_API_KEY=your_key
AZURE_API_URL=your_url
AZURE_DEPLOYMENT_ID=your_id
AZURE_SPEECH_KEY=your_speech_key
AZURE_SPEECH_REGION=your_region
MONGODB_URI=your_mongodb_uri
```

Run:
```bash
npm install
npm start
```

**Never commit `.env` to Git.**
