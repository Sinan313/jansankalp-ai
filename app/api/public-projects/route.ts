import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(
      process.cwd(),
      "data",
      "public_projects.json"
    );

    if (!fs.existsSync(filePath)) {
      return Response.json({
        success: true,
        projects: [],
      });
    }

    const file = fs.readFileSync(
      filePath,
      "utf-8"
    );

    const projects = JSON.parse(file);

    return Response.json({
      success: true,
      projects: Array.isArray(projects)
        ? projects
        : [],
    });
  } catch (error) {
    console.error(
      "PUBLIC PROJECTS ERROR:",
      error
    );

    return Response.json(
      {
        success: false,
        projects: [],
        error:
          "Unable to load public projects.",
      },
      { status: 500 }
    );
  }
}