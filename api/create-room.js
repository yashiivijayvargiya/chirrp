export default async function handler(req, res) {
  // only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method not allowed' });
  }

  const DAILY_API_KEY = process.env.DAILY_API_KEY;
  if (!DAILY_API_KEY) {
    return res.status(500).json({ error: 'Daily API key not configured' });
  }

  const { roomName } = req.body;

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
          start_video_off: true,   // audio only — no video
          start_audio_off: false,
          exp: Math.round(Date.now() / 1000) + 3600  // expires in 1 hour
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: data.error || 'failed to create room' });
    }

    return res.status(200).json({ url: data.url, name: data.name });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
