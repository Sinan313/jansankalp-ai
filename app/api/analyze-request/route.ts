import { GoogleGenAI } from "@google/genai";

function isTemporaryGeminiError(error: unknown) {
  const message =
    error instanceof Error ? error.message : String(error);

  return (
    message.includes("503") ||
    message.includes("UNAVAILABLE") ||
    message.includes("high demand") ||
    message.includes("429") ||
    message.includes("RESOURCE_EXHAUSTED")
  );
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateWithRetry(
  ai: GoogleGenAI,
  model: string,
  prompt: string
) {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          temperature: 0,
          maxOutputTokens: 500,
        },
      });
    } catch (error) {
      console.error(
        `Gemini ${model} attempt ${attempt} failed:`,
        error
      );

      if (
        !isTemporaryGeminiError(error) ||
        attempt === maxAttempts
      ) {
        throw error;
      }

      // 1s → 2s → 4s
      await sleep(1000 * Math.pow(2, attempt - 1));
    }
  }

  throw new Error("Gemini request failed.");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const text = body?.text;

    if (!text || typeof text !== "string") {
      return Response.json(
        {
          success: false,
          error: "Citizen request is required.",
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return Response.json(
        {
          success: false,
          error: "Gemini API key is missing.",
        },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey,
    });

    const prompt = `
You are JanSankalp AI, a citizen development intelligence
assistant for India.

Analyze the citizen's development request.

IMPORTANT:
- The citizen may write in Malayalam, English, Hindi, Tamil,
  Kannada, Telugu, or another Indian language.
- Detect the original language.
- Understand the meaning without changing the citizen's intent.
- Do not invent facts.
- Return ONLY valid JSON.
- Do not use markdown.
- Do not wrap the JSON in code blocks.

Citizen request:
${JSON.stringify(text)}

Return exactly this structure:

{
  "language": "",
  "category": "",
  "issue": "",
  "urgency": "",
  "summary": ""
}

Allowed categories:

Water
Roads
Healthcare
Education
Transport
Sanitation
Electricity
Digital Connectivity
Housing
Agriculture
Other

Urgency must be exactly one of:

Low
Medium
High
Critical

Rules:

1. language = detected language of the citizen request.
2. category = one of the allowed categories.
3. issue = short description of the actual problem.
4. urgency = based only on information provided.
5. summary = short clear explanation of the request.
6. Do not invent locations, numbers, departments, causes,
   or other facts.
`;

    let response;

    try {
      // Primary model
      response = await generateWithRetry(
        ai,
        "gemini-3.5-flash-lite",
        prompt
      );
    } catch (primaryError) {
      console.warn(
        "Primary Gemini model failed. Trying fallback model..."
      );

      // Fallback model
      response = await generateWithRetry(
        ai,
        "gemini-3.8-flash",
        prompt
      );
    }

    let result = response.text ?? "";

    result = result
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    if (!result) {
      return Response.json(
        {
          success: false,
          error: "Gemini returned an empty response.",
        },
        { status: 502 }
      );
    }

    let analysis;

    try {
      analysis = JSON.parse(result);
    } catch {
      console.error(
        "INVALID GEMINI JSON:",
        result
      );

      return Response.json(
        {
          success: false,
          error:
            "Gemini returned an invalid analysis response.",
        },
        { status: 502 }
      );
    }

    return Response.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error(
      "ANALYSIS ERROR:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : String(error);

    if (
      message.includes("503") ||
      message.includes("UNAVAILABLE") ||
      message.includes("high demand")
    ) {
      return Response.json(
        {
          success: false,
          error:
            "Gemini is temporarily unavailable. Please try again shortly.",
        },
        { status: 503 }
      );
    }

    if (
      message.includes("429") ||
      message.includes("RESOURCE_EXHAUSTED") ||
      message.toLowerCase().includes("quota")
    ) {
      return Response.json(
        {
          success: false,
          error:
            "Gemini API quota has been reached. Please try again later.",
        },
        { status: 429 }
      );
    }

    return Response.json(
      {
        success: false,
        error:
          "Unable to analyze the citizen request.",
      },
      { status: 500 }
    );
  }
}