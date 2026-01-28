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

// Chat completion endpoint (streaming support with automatic fallback)
app.post('/ai/chat', async (req, res) => {
  try {
    const { messages, stream = false } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const apiKey = process.env.REACT_APP_API_KEY;
    const apiUrl = process.env.REACT_APP_API_URL;
    const primaryDeployment = 'gpt-4o-mini'; // Primary model
    const fallbackDeployment = 'gpt-4o'; // Fallback model

    if (!apiKey || !apiUrl) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Try primary model (GPT-4o-mini) first
    try {
      console.log('Attempting with GPT-4o-mini...');
      const response = await axios.post(
        `${apiUrl}/openai/deployments/${primaryDeployment}/chat/completions?api-version=2024-08-01-preview`,
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
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders(); // Send headers immediately
        response.data.pipe(res);
      } else {
        const reply = response.data.choices[0].message.content;
        res.json({ reply, model: primaryDeployment });
      }
      console.log('GPT-4o-mini succeeded');
      return;

    } catch (primaryError) {
      console.log('GPT-4o-mini failed, falling back to GPT-4o:', primaryError.message);
      
      // Fallback to GPT-4o
      try {
        const response = await axios.post(
          `${apiUrl}/openai/deployments/${fallbackDeployment}/chat/completions?api-version=2024-08-01-preview`,
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
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');
          res.flushHeaders();
          response.data.pipe(res);
        } else {
          const reply = response.data.choices[0].message.content;
          res.json({ reply, model: fallbackDeployment });
        }
        console.log('GPT-4o fallback succeeded');

      } catch (fallbackError) {
        console.error('Both models failed:', fallbackError.message);
        throw fallbackError;
      }
    }

  } catch (error) {
    console.error('Chat request failed:', error.message);
    res.status(500).json({ error: 'Chat request failed' });
  }
});

// Vision analysis endpoint (with automatic fallback)
app.post('/ai/vision', async (req, res) => {
  try {
    const { imageBase64, prompt } = req.body;

    if (!imageBase64 || !prompt) {
      return res.status(400).json({ error: 'Image and prompt are required' });
    }

    const apiKey = process.env.REACT_APP_API_KEY;
    const apiUrl = process.env.REACT_APP_API_URL;
    const primaryDeployment = 'gpt-4o-mini'; // Primary model
    const fallbackDeployment = 'gpt-4o'; // Fallback model

    if (!apiKey || !apiUrl) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const messagePayload = {
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
    };

    // Try primary model first
    try {
      console.log('Attempting vision with GPT-4o-mini...');
      const response = await axios.post(
        `${apiUrl}/openai/deployments/${primaryDeployment}/chat/completions?api-version=2024-08-01-preview`,
        messagePayload,
        {
          headers: {
            'Content-Type': 'application/json',
            'api-key': apiKey
          }
        }
      );

      const analysis = response.data.choices[0].message.content;
      res.json({ analysis, model: primaryDeployment });
      console.log('GPT-4o-mini vision succeeded');
      return;

    } catch (primaryError) {
      console.log('GPT-4o-mini vision failed, falling back to GPT-4o:', primaryError.message);
      
      // Fallback to GPT-4o
      const response = await axios.post(
        `${apiUrl}/openai/deployments/${fallbackDeployment}/chat/completions?api-version=2024-08-01-preview`,
        messagePayload,
        {
          headers: {
            'Content-Type': 'application/json',
            'api-key': apiKey
          }
        }
      );

      const analysis = response.data.choices[0].message.content;
      res.json({ analysis, model: fallbackDeployment });
      console.log('GPT-4o vision fallback succeeded');
    }

  } catch (error) {
    console.error('Vision analysis failed:', error.message);
    res.status(500).json({ error: 'Vision analysis failed' });
  }
});

// Get Azure Speech configuration
app.get('/config/speech', (req, res) => {
  const speechKey = process.env.REACT_APP_SPEECH_KEY;
  const speechRegion = process.env.REACT_APP_SPEECH_REGION;

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
