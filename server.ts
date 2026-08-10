import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "10mb" }));

// Helper to initialize GenAI lazily when requested by an AI endpoint
let genAIClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured on the server. Please configure GEMINI_API_KEY in environment variables."
    );
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAIClient;
}

// Build persona system prompt based on user context
function buildSystemPrompt(context: {
  role?: string;
  educationLevel?: string;
  grade?: string;
  name?: string;
  subjects?: string[];
  goal?: string;
  learningGoal?: string;
  language?: string;
  preferredLanguage?: string;
}) {
  const role = context.role || "student";
  const level = context.educationLevel || context.grade || "high_school";
  const userName = context.name || "Learner";
  const subjects = (context.subjects && context.subjects.length > 0) ? context.subjects.join(", ") : "general topics";
  const goal = context.learningGoal || context.goal || "Improve understanding and skills";
  const lang = context.preferredLanguage || context.language || "English";

  if (role === "teacher") {
    return `You are CULTURE AI, an intelligent, empathetic educational co-pilot for teachers.
You are interacting with ${userName}, a professional teacher who teaches: ${subjects}.
Grade/Level Taught: ${level}.
Teaching Goal: ${goal}.
Preferred Output Language: ${lang}.

CORE DIRECTIVE FOR TEACHERS:
1. Speak as a supportive professional peer to the teacher (never treat them like a student).
2. Focus on practical, classroom-ready pedagogy: lesson plans, differentiated learning strategies, Bloom's Taxonomy aligned assessments, 20-mark quizzes, rubrics, misconception analysis, and student engagement ideas.
3. Keep structures clean with bold section headers, bullet points, time allocations, and clear rubrics.
4. If asked an educational question, provide both the concept answer AND hints on how to explain it effectively to Grade ${level} students.
5. If user asks non-educational topics, politely steer back to educational and teaching applications.
6. Respond in ${lang}.`;
  }

  // Student personas based on education level
  let levelGuidance = "";
  switch (level) {
    case "primary":
      levelGuidance = `
- AUDIENCE: Primary School student (ages ~5-11).
- TONE: Super friendly, warm, encouraging, playful, and easy to understand!
- LANGUAGE: Very simple vocabulary, short sentences, fun analogies, and friendly emojis 🌟!
- STRATEGY: Use relatable stories (e.g. comparing atoms to LEGO blocks or gravity to a magnet). Avoid complex math or heavy jargon unless requested, and always explain big words immediately.`;
      break;
    case "middle":
      levelGuidance = `
- AUDIENCE: Middle School student (ages ~11-14).
- TONE: Engaging, supportive, curious, and clear.
- LANGUAGE: Clear everyday language with relatable real-world examples (e.g. sports, daily life, video games).
- STRATEGY: Guide problem-solving step-by-step. Encourage curiosity with light follow-up questions. Include short mini-quizzes or quick checks for understanding.`;
      break;
    case "high_school":
      levelGuidance = `
- AUDIENCE: High School student (ages ~14-18).
- TONE: Structured, focused, academically thorough, and motivating.
- LANGUAGE: Standard academic terminology with clear definitions.
- STRATEGY: Focus on conceptual mastery, exam preparation, step-by-step problem solving, and practice questions. Break down complex formulas or essays into manageable components.`;
      break;
    case "university":
    default:
      levelGuidance = `
- AUDIENCE: University / Higher Education student.
- TONE: Rigorous, analytical, scholarly, and articulate.
- LANGUAGE: Advanced academic terminology, formal research context, and precise terminology.
- STRATEGY: Provide deep conceptual analysis, reference relevant literature or historical context, foster critical thinking, assist with academic writing/critique, and handle multi-step proofs or research design.`;
      break;
  }

  return `You are CULTURE AI, an adaptive personalized AI tutor.
User Profile:
- Name: ${userName}
- Role: Student
- Education Stage: ${level}
- Main Subjects: ${subjects}
- Learning Goal: ${goal}
- Preferred Language: ${lang}

ADAPTATION DIRECTIVE:
${levelGuidance}

GENERAL DIRECTIVES:
1. Respond in ${lang}.
2. Stay strictly within educational scope. If asked off-topic questions (e.g. sports gossip, video game cheats), politely steer back to learning and academic skills.
3. Structure answers cleanly using Markdown headers, bullet points, and code/math formatting.
4. Offer 1-2 quick follow-up prompt ideas at the end (e.g., "Would you like a 3-question quiz on this?" or "Should we try an example problem?").`;
}

// Format conversation history ensuring strict user/model alternating roles
function formatContents(
  message: string,
  history?: Array<{ role: string; text?: string; content?: string }>
) {
  const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];

  if (Array.isArray(history)) {
    for (const h of history) {
      const text = h.text || h.content;
      if (!text || !text.trim()) continue;

      const role: "user" | "model" = h.role === "user" ? "user" : "model";

      // Gemini requires starting with "user"
      if (contents.length === 0 && role !== "user") {
        continue;
      }

      // If consecutive messages have the same role, combine them
      if (contents.length > 0 && contents[contents.length - 1].role === role) {
        contents[contents.length - 1].parts[0].text += "\n\n" + text.trim();
      } else {
        contents.push({
          role,
          parts: [{ text: text.trim() }],
        });
      }
    }
  }

  const trimmedMessage = message.trim();

  if (contents.length === 0) {
    contents.push({
      role: "user",
      parts: [{ text: trimmedMessage }],
    });
  } else {
    const lastTurn = contents[contents.length - 1];
    if (lastTurn.role === "user") {
      if (lastTurn.parts[0].text !== trimmedMessage) {
        lastTurn.parts[0].text = trimmedMessage;
      }
    } else {
      contents.push({
        role: "user",
        parts: [{ text: trimmedMessage }],
      });
    }
  }

  return contents;
}

// API: Health Check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "CULTURE AI API" });
});

// API: Adaptive Chat
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history, context } = req.body;
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    const ai = getGenAI();
    const systemPrompt = buildSystemPrompt(context || {});

    const contents = formatContents(message, history);

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    const replyText = response.text || "I was unable to generate a response. Please try asking again.";
    res.json({ text: replyText });
  } catch (error: any) {
    console.error("Chat API error:", error);
    const errorMessage = error?.message || "Failed to generate AI response";
    res.status(500).json({ error: errorMessage });
  }
});

// API: Generate Interactive Quiz
app.post("/api/tools/quiz", async (req, res) => {
  try {
    const { topic, context, questionCount = 4 } = req.body;
    const ai = getGenAI();
    const level = context?.educationLevel || context?.grade || "high_school";

    const prompt = `Generate an interactive ${questionCount}-question multiple-choice quiz about "${topic || "General Science"}".
Target audience stage: ${level} level.
Make questions, options, and explanations appropriate for this level.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: `You are a quiz generator. Output ONLY a valid JSON object matching this schema:
{
  "title": "Quiz title",
  "level": "${level}",
  "questions": [
    {
      "id": 1,
      "question": "Question text?",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "explanation": "Clear explanation of why this option is correct."
    }
  ]
}`,
        responseMimeType: "application/json",
      },
    });

    const jsonStr = response.text || "{}";
    const quizData = JSON.parse(jsonStr);
    res.json({ quiz: quizData });
  } catch (error: any) {
    console.error("Quiz error:", error);
    res.status(500).json({ error: error?.message || "Failed to generate quiz" });
  }
});

// API: Level Comparison (Displays how CULTURE adapts 1 topic across all 4 levels)
app.post("/api/tools/compare-levels", async (req, res) => {
  try {
    const { topic } = req.body;
    const ai = getGenAI();
    const targetTopic = topic || "Gravity";

    const prompt = `Explain the concept "${targetTopic}" across four distinct educational stages so a user can see how CULTURE adapts its teaching style.
Output a JSON object with four keys:
- primary: simple story, fun analogy, ages 5-11
- middle: clear explanation with everyday examples, ages 11-14
- high_school: academic detail with formulas/principles where applicable, ages 14-18
- university: rigorous academic explanation, deep theory or higher math/physics framing`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an educational comparative adapter. Output JSON only.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            adaptations: {
              type: Type.OBJECT,
              properties: {
                primary: { type: Type.STRING },
                middle: { type: Type.STRING },
                high_school: { type: Type.STRING },
                university: { type: Type.STRING },
              },
              required: ["primary", "middle", "high_school", "university"],
            },
          },
          required: ["topic", "adaptations"],
        },
      },
    });

    const jsonStr = response.text || "{}";
    const data = JSON.parse(jsonStr);
    res.json(data);
  } catch (error: any) {
    console.error("Compare error:", error);
    res.status(500).json({ error: error?.message || "Failed to compare levels" });
  }
});

// API: Generate Lesson Plan (Teacher Tool)
app.post("/api/tools/lesson-plan", async (req, res) => {
  try {
    const { topic, gradeLevel, duration = "45 mins", context } = req.body;
    const ai = getGenAI();

    const prompt = `Create a structured, highly actionable lesson plan for a teacher.
Topic: "${topic || "Introduction to Algebra"}"
Target Grade/Level: "${gradeLevel || "Grade 9"}"
Class Duration: "${duration}"
Teacher Name: "${context?.name || "Educator"}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: `You are an expert curriculum design assistant. Output a JSON object matching this schema:
{
  "topic": "string",
  "gradeLevel": "string",
  "duration": "string",
  "objectives": ["objective 1", "objective 2"],
  "starter": "Starter hook activity (time)",
  "mainActivities": ["Activity 1", "Activity 2"],
  "differentiation": {
    "support": "Scaffolding for struggling students",
    "extension": "Extension task for advanced learners"
  },
  "assessment": "Formative/summative assessment idea",
  "homework": "Follow-up task"
}`,
        responseMimeType: "application/json",
      },
    });

    const jsonStr = response.text || "{}";
    const plan = JSON.parse(jsonStr);
    res.json({ lessonPlan: plan });
  } catch (error: any) {
    console.error("Lesson plan error:", error);
    res.status(500).json({ error: error?.message || "Failed to generate lesson plan" });
  }
});

// API: Flashcard Generator
app.post("/api/tools/flashcards", async (req, res) => {
  try {
    const { topic, context, count = 5 } = req.body;
    const ai = getGenAI();
    const level = context?.educationLevel || context?.grade || "high_school";

    const prompt = `Create ${count} study flashcards on "${topic || "Biology"}".
Target level: ${level}.
Output JSON only with array of objects having "front" and "back".`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: 'You are a flashcard generator. Output JSON only: {"flashcards": [{"front": "...", "back": "..."}]}',
        responseMimeType: "application/json",
      },
    });

    const jsonStr = response.text || "{}";
    const data = JSON.parse(jsonStr);
    res.json(data);
  } catch (error: any) {
    console.error("Flashcards error:", error);
    res.status(500).json({ error: error?.message || "Failed to generate flashcards" });
  }
});

async function startServer() {
  // Vite middleware for dev
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CULTURE AI server listening on http://localhost:${PORT}`);
  });
}

startServer();
