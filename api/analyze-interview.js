export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { question, answer } = req.body;

    if (!question || !answer) {
      return res.status(400).json({
        error: "Question and answer are required"
      });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content:
              "You are an interview coach. Analyze student interview answers clearly and kindly. Return only valid JSON."
          },
          {
            role: "user",
            content: `
Interview question:
${question}

Student answer:
${answer}

Return JSON in this exact format:
{
  "score": number from 0 to 100,
  "summary": "short overall feedback",
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "better_answer": "a stronger sample answer"
}
`
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        error: "OpenAI request failed",
        details: data
      });
    }

    const text = data.output_text;
    const analysis = JSON.parse(text);

    return res.status(200).json(analysis);
  } catch (error) {
    return res.status(500).json({
      error: "Could not analyze answer",
      details: error.message
    });
  }
}
