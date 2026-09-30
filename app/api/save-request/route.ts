import fs from "fs";
import path from "path";

export async function POST(request: Request) {
  try {
    const analysis = await request.json();

    if (!analysis) {
      return Response.json(
        {
          success: false,
          error: "Analysis data is required.",
        },
        { status: 400 }
      );
    }

    const filePath = path.join(
      process.cwd(),
      "data",
      "citizen_requests.json"
    );

    let requests = [];

    if (fs.existsSync(filePath)) {
      const file = fs.readFileSync(filePath, "utf-8");
      requests = JSON.parse(file);
    }

    const newRequest = {
  id: `CR-${Date.now()}`,
  language: analysis.language || "Unknown",
  category: analysis.category || "Other",
  issue: analysis.issue || "",
  urgency: analysis.urgency || "Medium",
  summary: analysis.summary || "",
  state: analysis.state || "",
  district: analysis.district || "",
  source: "Citizen Voice",
  createdAt: new Date().toISOString(),
};

    requests.push(newRequest);

    fs.writeFileSync(
      filePath,
      JSON.stringify(requests, null, 2),
      "utf-8"
    );

    return Response.json({
      success: true,
      request: newRequest,
    });
  } catch (error) {
    console.error("SAVE REQUEST ERROR:", error);

    return Response.json(
      {
        success: false,
        error: "Unable to save citizen request.",
      },
      { status: 500 }
    );
  }
}