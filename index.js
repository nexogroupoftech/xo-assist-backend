import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

const PORT = process.env.PORT || 8080;

/* Health check */
app.get("/", (req, res) => {
  res.send("XO Assist backend is running 🚀");
});

/* Ask AI */
app.post("/ask", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "No prompt provided" });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: "Missing GROQ_API_KEY" });
    }

    const groqResponse = await fetch(
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
                "Explain the text simply. If it is a word, give meaning and example."
            },
            {
              role: "user",
              content: prompt
            }
          ]
        })
      }
    );

    const data = await groqResponse.json();

    // SAFE CHECK (prevents server crash)
    if (!data.choices || !data.choices[0]) {
      console.error("Groq API error:", data);
      return res.status(500).json({
        error: "Groq API failed",
        details: data
      });
    }

    const answer = data.choices[0].message.content;

    res.json({ answer });

  } catch (err) {
    console.error("Backend crash:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log("Backend running on port", PORT);
});
