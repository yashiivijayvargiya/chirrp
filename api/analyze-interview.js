export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { question, answer, category } = req.body;

    if (!question || !answer) {
      return res.status(400).json({
        error: "Question and answer are required"
      });
    }

    const openaiRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content:
              "You are a kind but honest interview coach for students. Return only valid JSON. Do not use markdown."
          },
          {
            role: "user",
            content: `
Analyze this interview answer.

Category: ${category}
Question: ${question}

Student answer:
${answer}

Return JSON exactly like this:
{
  "score": 0,
  "summary": "",
  "strengths": ["", ""],
  "improvements": ["", ""],
  "better_answer": ""
}

Score should be from 0 to 100.
Keep the better_answer student-friendly and realistic.
`
          }
        ]
      })
    });

    const data = await openaiRes.json();

    if (!openaiRes.ok) {
      return res.status(500).json({
        error: "AI request failed",
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
