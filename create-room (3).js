const https = require('https');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  const DAILY_API_KEY = process.env.DAILY_API_KEY || '8e80009a8a7aa965ec1a39f86cd7f8e2f502e755b112431fafb4fc33340e6680';

  let roomName;
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    roomName = (body && body.roomName) ? body.roomName : ('chirrp-' + Date.now());
  } catch (e) {
    roomName = 'chirrp-' + Date.now();
  }

  const payload = JSON.stringify({
    name: roomName,
    properties: {
      max_participants: 2,
      enable_chat: false,
      enable_screenshare: false,
      start_video_off: true,
      start_audio_off: false,
      exp: Math.round(Date.now() / 1000) + 3600
    }
  });

  const options = {
    hostname: 'api.daily.co',
    path: '/v1/rooms',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + DAILY_API_KEY,
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  return new Promise((resolve) => {
    const request = https.request(options, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (response.statusCode !== 200) {
            res.status(500).json({ error: parsed.error || 'Daily API error', details: parsed });
          } else {
            res.status(200).json({ url: parsed.url, name: parsed.name });
          }
        } catch (e) {
          res.status(500).json({ error: 'Failed to parse Daily response', raw: data });
        }
        resolve();
      });
    });

    request.on('error', (e) => {
      res.status(500).json({ error: e.message });
      resolve();
    });

    request.write(payload);
    request.end();
  });
};
