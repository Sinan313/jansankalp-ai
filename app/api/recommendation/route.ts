import { NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      district,
      state,
      category,
      request_count,
      high_urgency_requests,
      population,
      infrastructure_access,
      infrastructure_gap,
      demand_score,
      investment_crore,
      planned_projects,
      ongoing_projects,
      priority_score,
      priority,
    } = body;

    if (!district || !state || !category) {
      return Response.json(
        {
          success: false,
          error: "Missing hotspot information",
        },
        { status: 400 }
      );
    }

    const prompt = `
You are an AI development planning assistant for an Indian civic intelligence prototype called JanSankalp AI.

Analyze the following synthetic district-level data and provide a concise development recommendation.

IMPORTANT:
- This is prototype/synthetic data.
- Do NOT make an actual government decision.
- Do NOT claim that funding should definitely be approved.
- Provide an evidence-based recommendation for further assessment.
- Mention uncertainty where appropriate.
- Keep the response practical and concise.

District: ${district}
State: ${state}
Category: ${category}

Citizen requests: ${request_count}
High urgency requests: ${high_urgency_requests}
Population: ${population}

Infrastructure access: ${infrastructure_access}%
Infrastructure gap: ${infrastructure_gap}%

Citizen demand score: ${demand_score}/100

Existing investment: ₹${investment_crore} crore
Planned projects: ${planned_projects}
Ongoing projects: ${ongoing_projects}

Prototype priority score: ${priority_score}/100
Prototype priority level: ${priority}

Return exactly these sections:

RECOMMENDATION:
2-3 sentences.

WHY:
3 short bullet points.

SUGGESTED ACTION:
2 short practical actions.

DATA NOTE:
One sentence explaining that this is an AI-assisted prototype recommendation based on synthetic data.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
    });

    return Response.json({
      success: true,
      recommendation: response.text,
    });
  } catch (error) {
    console.error("RECOMMENDATION ERROR:", error);

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Gemini recommendation failed",
      },
      { status: 500 }
    );
  }
}