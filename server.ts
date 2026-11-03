import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(process.cwd(), "public")));

// Cache default env instance
let defaultGenAIClient: GoogleGenAI | null = null;

function getGenAIInstance(clientKey?: string): GoogleGenAI | null {
  const effectiveKey = (clientKey && clientKey.trim().length > 0)
    ? clientKey.trim()
    : process.env.GEMINI_API_KEY;

  if (!effectiveKey || effectiveKey === "MY_GEMINI_API_KEY") {
    return null;
  }

  // If a specific client key was passed, create a fresh client for it
  if (clientKey && clientKey.trim().length > 0) {
    return new GoogleGenAI({
      apiKey: clientKey.trim(),
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  // Otherwise reuse cached env instance
  if (!defaultGenAIClient) {
    defaultGenAIClient = new GoogleGenAI({
      apiKey: effectiveKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return defaultGenAIClient;
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasServerGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"),
  });
});

// Verify Gemini API Key
app.post("/api/gemini/verify-key", async (req, res) => {
  try {
    const rawKey = req.body?.apiKey;
    if (!rawKey || typeof rawKey !== "string" || rawKey.trim().length < 8) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid Gemini API key.",
      });
    }

    const testClient = new GoogleGenAI({
      apiKey: rawKey.trim(),
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    // Make a minimal test call with gemini-3.8-flash
    const testResponse = await testClient.models.generateContent({
      model: "gemini-3.8-flash",
      contents: "Reply with the single word: OK",
    });

    if (testResponse.text) {
      return res.json({
        success: true,
        message: "Gemini API key verified successfully! Online Grandmaster AI is now active.",
      });
    }

    return res.status(400).json({
      success: false,
      message: "API key responded but no text was returned.",
    });
  } catch (error: any) {
    console.error("Gemini key verification error:", error?.message || error);
    let msg = error?.message || "Verification failed. Please check that your key is correct.";
    try {
      const parsed = JSON.parse(msg);
      if (parsed?.error?.message) {
        msg = parsed.error.message;
      }
    } catch {
      // not json
    }
    return res.status(400).json({
      success: false,
      message: msg,
    });
  }
});

// Gemini Chess Coach Endpoint
app.post("/api/gemini/coach", async (req, res) => {
  try {
    const { mode, fen, move, pgn, context, userQuestion, gameSummary, apiKey: bodyKey } = req.body;
    const headerKey = req.headers["x-gemini-key"] as string | undefined;
    const clientKey = (typeof bodyKey === "string" && bodyKey.trim().length > 0)
      ? bodyKey
      : headerKey;

    const ai = getGenAIInstance(clientKey);

    if (!ai) {
      return res.status(200).json({
        success: false,
        fallbackToLocal: true,
        message: "Gemini API key not configured. Provide your Gemini key in the AI menu or use the offline tactical engine.",
      });
    }

    let prompt = "";
    if (mode === "why_move") {
      prompt = `You are a FIDE Grandmaster and friendly chess coach.
Current FEN: ${fen}
Proposed / Played Move: ${move}
Context: ${context || "Explain the strategic and tactical rationale for this move."}

Provide a concise, highly instructive explanation structured as follows:
1. Core Motive: (1 sentence)
2. Strategic Advantages: (2-3 bullet points explaining piece coordination, center control, or king safety)
3. Tactical Checks: (1 bullet point explaining whether any pieces are attacked, defended, or hanging)
4. What to look out for next: (1 bullet point)
Keep the tone encouraging, crystal-clear, and practical for an improving club player. Avoid overly long algebraic variations.`;
    } else if (mode === "blunder_analysis") {
      prompt = `You are an expert chess analyst.
FEN before move: ${fen}
Played Move: ${move}
Evaluation Change / Blunder Context: ${context || "A tactical inaccuracy or blunder occurred."}

Analyze why this move was a mistake or blunder:
1. The Flaw: Exactly what this move overlooked (e.g., hanging piece, pawn structure concession, tactical pin/fork).
2. The Opponent's Best Punishment: How the opponent can capitalize.
3. The Better Alternative: What should have been played instead and why.
4. Coach's Golden Rule: A short memorable tip (max 12 words) to avoid this mistake in future games.`;
    } else if (mode === "improvement_plan") {
      prompt = `You are a Grandmaster head coach creating a personalized improvement plan.
Player Profile & Performance Stats:
- Estimated Rating: ${gameSummary?.rating || "1200"}
- Recent Game Stats: ${JSON.stringify(gameSummary?.stats || {})}
- Common Blunder Patterns: ${JSON.stringify(gameSummary?.weaknesses || ["Tactical pins", "Endgame technique", "Hanging pieces"])}
- Player Query: ${userQuestion || "Create my targeted 3-stage training plan"}

Generate an actionable, inspiring, and concrete Improvement Plan:
1. Diagnostic Summary: Honest breakdown of current strengths and critical leaks.
2. Phase 1 (Next 2 Weeks - Tactical Hygiene): Concrete daily drills, specific puzzle patterns to master.
3. Phase 2 (Weeks 3-4 - Positional & Piece Harmony): Rules for piece development, king safety, and prophylaxis.
4. Phase 3 (Endgame & Conversion): Key endgame templates to study.
5. Personalized Mantra: A memorable rule to remember before each move.`;
    } else if (mode === "custom_question") {
      prompt = `You are an interactive Grandmaster chess coach.
Current FEN: ${fen || "Initial position"}
Recent PGN/Moves: ${pgn || "N/A"}
User Question: "${userQuestion}"

Answer the user's specific chess question thoroughly, accurately, and encouragingly. Reference the current board state and piece coordinates clearly.`;
    } else {
      prompt = `Provide a brief Grandmaster analysis of this position (FEN: ${fen}). Point out the key plans for both White and Black.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
    });

    const outputText = response.text || "Analysis complete.";
    return res.json({
      success: true,
      analysis: outputText,
    });
  } catch (error: any) {
    console.error("Gemini Coach error:", error);
    return res.status(200).json({
      success: false,
      fallbackToLocal: true,
      message: error?.message || "Error connecting to AI Coach. Switched to offline tactical engine.",
    });
  }
});

async function startServer() {
  // Vite middleware in dev
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Chess Bot server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
