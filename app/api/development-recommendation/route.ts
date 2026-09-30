import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const {
      state,
      district,
      category,
      requests,
      high_critical,
      demand_share,
      priority_score,
      priority,
      project_count,
      investment_crore,
      projects,
      gap_status,
    } = data;

    if (
      !state ||
      !district ||
      !category
    ) {
      return Response.json(
        {
          success: false,
          error:
            "Missing development signal information.",
        },
        { status: 400 }
      );
    }

    const prompt = `
You are an AI development analysis assistant
for the JanSankalp AI prototype.

Analyze the following citizen development signal.

Location:
State: ${state}
District: ${district}

Development Category:
${category}

Citizen Demand:
Total requests: ${requests}
High/Critical requests: ${high_critical}
Demand share: ${demand_share}%

Prototype priority:
Priority: ${priority}
Priority score: ${priority_score}

Existing public projects:
Project count: ${project_count}
Investment: ₹${investment_crore} crore
Gap status: ${gap_status}

Projects:
${JSON.stringify(projects || [], null, 2)}

Generate a concise development assessment.

Your response must contain exactly these sections:

Development Assessment:
Explain what the available citizen-request data indicates.

Evidence:
Mention the request volume, High/Critical requests,
and existing project information.

Existing Intervention:
Describe existing public projects if any.
If there are none, say that no matching project
was found in the prototype dataset.

Development Consideration:
Suggest what type of development consideration
could be examined based on the available evidence.
Do not claim that a project must be built.

Data Limitation:
State that this is a prototype analysis based on
synthetic citizen and public-project data and is
not an official government assessment.

Do not invent projects, budgets, population figures,
government schemes, or statistics.
`;

    const response =
      await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: prompt,
      });

    const recommendation =
      response.text?.trim();

    if (!recommendation) {
      return Response.json(
        {
          success: false,
          error:
            "Gemini returned an empty recommendation.",
        },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      recommendation,
    });
  } catch (error) {
    console.error(
      "DEVELOPMENT RECOMMENDATION ERROR:",
      error
    );

    return Response.json(
      {
        success: false,
        error:
          "Unable to generate development recommendation.",
      },
      { status: 500 }
    );
  }
}