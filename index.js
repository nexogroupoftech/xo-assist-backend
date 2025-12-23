import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// ✅ Health check (optional)
app.get("/", (req, res) => {
  res.send("XO Assist backend is running");
});

// ✅ MAIN AI ROUTE
app.post("/ask", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "No prompt provided" });
  }

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content:
                "Explain the text simply. If it is a word, give meaning and a short example. Keep it clear and short."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.4
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        error: "Groq API error",
        details: data
      });
    }

    res.json({
      answer: data.choices[0].message.content
    });

  } catch (err) {
    res.status(500).json({
      error: "AI failed",
      details: err.message
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
