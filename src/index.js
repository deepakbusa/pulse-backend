const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Chat completion endpoint (streaming support)
app.post('/ai/chat', async (req, res) => {
  try {
    const { messages, stream = false } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const apiKey = process.env.AZURE_API_KEY;
    const apiUrl = process.env.AZURE_API_URL;
    const deploymentId = process.env.AZURE_DEPLOYMENT_ID;

    if (!apiKey || !apiUrl || !deploymentId) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const response = await axios.post(
      `${apiUrl}/openai/deployments/${deploymentId}/chat/completions?api-version=2024-08-01-preview`,
      {
        messages,
        max_tokens: 2000,
        temperature: 0.7,
        stream
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey
        },
        responseType: stream ? 'stream' : 'json'
      }
    );

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      response.data.pipe(res);
    } else {
      const reply = response.data.choices[0].message.content;
      res.json({ reply });
    }

  } catch (error) {
    console.error('Chat request failed:', error.message);
    res.status(500).json({ error: 'Chat request failed' });
  }
});

// Vision analysis endpoint
app.post('/ai/vision', async (req, res) => {
  try {
    const { imageBase64, prompt } = req.body;

    if (!imageBase64 || !prompt) {
      return res.status(400).json({ error: 'Image and prompt are required' });
    }

    const apiKey = process.env.AZURE_API_KEY;
    const apiUrl = process.env.AZURE_API_URL;
    const deploymentId = process.env.AZURE_DEPLOYMENT_ID;

    if (!apiKey || !apiUrl || !deploymentId) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const response = await axios.post(
      `${apiUrl}/openai/deployments/${deploymentId}/chat/completions?api-version=2024-08-01-preview`,
      {
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: `data:image/png;base64,${imageBase64}` } }
            ]
          }
        ],
        max_tokens: 2000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey
        }
      }
    );

    const analysis = response.data.choices[0].message.content;
    res.json({ analysis });

  } catch (error) {
    console.error('Vision analysis failed:', error.message);
    res.status(500).json({ error: 'Vision analysis failed' });
  }
});

// Get Azure Speech configuration
app.get('/config/speech', (req, res) => {
  const speechKey = process.env.AZURE_SPEECH_KEY;
  const speechRegion = process.env.AZURE_SPEECH_REGION;

  if (!speechKey || !speechRegion) {
    return res.status(500).json({ error: 'Speech configuration not available' });
  }

  res.json({ 
    key: speechKey, 
    region: speechRegion 
  });
});

// Get MongoDB URI (for client connection)
app.get('/config/mongodb', (req, res) => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    return res.status(500).json({ error: 'MongoDB configuration not available' });
  }

  res.json({ uri: mongoUri });
});

// Proxy endpoint for any external API calls
app.post('/proxy', async (req, res) => {
  try {
    const { url, method = 'POST', headers = {}, data } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const response = await axios({
      method,
      url,
      headers,
      data
    });

    res.json(response.data);

  } catch (error) {
    console.error('Proxy request failed:', error.message);
    res.status(500).json({ error: 'Proxy request failed' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
