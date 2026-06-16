export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  const DAILY_API_KEY = process.env.DAILY_API_KEY;
  if (!DAILY_API_KEY) return res.status(500).json({ error: 'DAILY_API_KEY not set' });

  // parse body — handles both parsed and unparsed
  let roomName;
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    roomName = body?.roomName || ('chirrp-' + Math.random().toString(36).substring(2, 8));
  } catch (e) {
    roomName = 'chirrp-' + Math.random().toString(36).substring(2, 8);
  }

  try {
    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DAILY_API_KEY}`
      },
      body: JSON.stringify({
        name: roomName,
        properties: {
          max_participants: 2,
          enable_chat: false,
          enable_screenshare: false,
          start_video_off: true,
          start_audio_off: false,
          exp: Math.round(Date.now() / 1000) + 3600
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Daily API error:', data);
      return res.status(500).json({ error: data.error || 'Daily API failed', details: data });
    }

    return res.status(200).json({ url: data.url, name: data.name });
  } catch (err) {
    console.error('Function error:', err);
    return res.status(500).json({ error: err.message });
  }
}
