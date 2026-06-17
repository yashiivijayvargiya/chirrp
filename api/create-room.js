const https = require('https');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  const WHEREBY_API_KEY = process.env.WHEREBY_API_KEY;
  if (!WHEREBY_API_KEY) return res.status(500).json({ error: 'WHEREBY_API_KEY not set' });

  let roomName;
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    roomName = (body && body.roomName) ? body.roomName : ('chirrp-' + Date.now());
  } catch (e) {
    roomName = 'chirrp-' + Date.now();
  }

  // Whereby room expires in 4 hours
  const endDate = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();

  const payload = JSON.stringify({
    endDate,
    fields: ['hostRoomUrl']
  });

  const options = {
    hostname: 'api.whereby.dev',
    path: '/v1/meetings',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + WHEREBY_API_KEY,
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
          if (response.statusCode !== 201) {
            res.status(500).json({ error: parsed.error || 'Whereby API error', details: parsed });
          } else {
            res.status(200).json({ 
              url: parsed.roomUrl,
              hostUrl: parsed.hostRoomUrl,
              name: roomName
            });
          }
        } catch (e) {
          res.status(500).json({ error: 'Failed to parse response', raw: data });
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
