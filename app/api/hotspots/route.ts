import fs from "fs";
import path from "path";

type District = {
  district: string;
  state: string;
  population: number;
  water_access: number;
  healthcare_access: number;
  education_access: number;
  road_quality: number;
  digital_connectivity: number;
  transport_access: number;
  sanitation_access: number;
  electricity_access: number;
};

type CitizenRequest = {
  request_id: string;
  state: string;
  district: string;
  language: string;
  category: string;
  request_text: string;
  urgency: "Low" | "Medium" | "High";
};

type PublicProject = {
  project_id: string;
  state: string;
  district: string;
  category: string;
  project_name: string;
  investment_crore: number;
  status: "Planned" | "Ongoing" | "Completed";
};

const categoryAccessField: Record<string, keyof District> = {
  Water: "water_access",
  Roads: "road_quality",
  Healthcare: "healthcare_access",
  Education: "education_access",
  "Digital Connectivity": "digital_connectivity",
  Transport: "transport_access",
  Sanitation: "sanitation_access",
  Electricity: "electricity_access",
};

function loadData() {
  const districtsPath = path.join(
    process.cwd(),
    "data",
    "districts.json"
  );

  const requestsPath = path.join(
    process.cwd(),
    "data",
    "citizen_requests.json"
  );

  const projectsPath = path.join(
    process.cwd(),
    "data",
    "public_projects.json"
  );

  const districts: District[] = JSON.parse(
    fs.readFileSync(districtsPath, "utf-8")
  );

  const requests: CitizenRequest[] = JSON.parse(
    fs.readFileSync(requestsPath, "utf-8")
  );

  const projects: PublicProject[] = JSON.parse(
    fs.readFileSync(projectsPath, "utf-8")
  );

  return {
    districts,
    requests,
    projects,
  };
}

function urgencyValue(
  urgency: CitizenRequest["urgency"]
) {
  switch (urgency) {
    case "High":
      return 100;

    case "Medium":
      return 60;

    case "Low":
      return 30;

    default:
      return 30;
  }
}

export async function GET() {
  try {
    const {
      districts,
      requests,
      projects,
    } = loadData();

    const maxPopulation = Math.max(
      ...districts.map(
        (district) => district.population
      )
    );

    const results = [];

    for (const district of districts) {
      const districtRequests = requests.filter(
        (request) =>
          request.district === district.district &&
          request.state === district.state
      );

      const categories = [
        ...new Set(
          districtRequests.map(
            (request) => request.category
          )
        ),
      ];

      for (const category of categories) {
        const categoryRequests =
          districtRequests.filter(
            (request) =>
              request.category === category
          );

        if (categoryRequests.length === 0) {
          continue;
        }

        // -----------------------------
        // 1. Citizen Demand
        // -----------------------------

        const urgencyTotal =
          categoryRequests.reduce(
            (sum, request) =>
              sum + urgencyValue(request.urgency),
            0
          );

        const demandScore =
          urgencyTotal /
          categoryRequests.length;

        // -----------------------------
        // 2. Infrastructure Gap
        // -----------------------------

        const accessField =
          categoryAccessField[category];

        let infrastructureAccess = 50;

        if (accessField) {
          infrastructureAccess =
            Number(district[accessField]);
        }

        const infrastructureGap =
          100 - infrastructureAccess;

        // -----------------------------
        // 3. Population Impact
        // -----------------------------

        const populationScore =
          (district.population /
            maxPopulation) *
          100;

        // -----------------------------
        // 4. Public Investment
        // -----------------------------

        const matchingProjects =
          projects.filter(
            (project) =>
              project.district ===
                district.district &&
              project.state === district.state &&
              project.category === category
          );

        const totalInvestment =
          matchingProjects.reduce(
            (sum, project) =>
              sum +
              Number(project.investment_crore),
            0
          );

        const ongoingProjects =
          matchingProjects.filter(
            (project) =>
              project.status === "Ongoing"
          ).length;

        const plannedProjects =
          matchingProjects.filter(
            (project) =>
              project.status === "Planned"
          ).length;

        // -----------------------------
        // 5. Investment Coverage
        // -----------------------------

        let investmentCoverage = 0;

        if (totalInvestment >= 50) {
          investmentCoverage = 100;
        } else if (totalInvestment >= 25) {
          investmentCoverage = 70;
        } else if (totalInvestment >= 10) {
          investmentCoverage = 40;
        } else if (totalInvestment > 0) {
          investmentCoverage = 20;
        }

        // -----------------------------
        // 6. Final Priority Score
        // -----------------------------

        const priorityScore =
          demandScore * 0.35 +
          infrastructureGap * 0.35 +
          populationScore * 0.15 +
          (100 - investmentCoverage) * 0.15;

        let priority = "Low";

        if (priorityScore >= 75) {
          priority = "Critical";
        } else if (priorityScore >= 60) {
          priority = "High";
        } else if (priorityScore >= 40) {
          priority = "Medium";
        }

        results.push({
          district: district.district,
          state: district.state,
          category,

          request_count:
            categoryRequests.length,

          high_urgency_requests:
            categoryRequests.filter(
              (request) =>
                request.urgency === "High"
            ).length,

          population:
            district.population,

          infrastructure_access:
            Math.round(
              infrastructureAccess
            ),

          infrastructure_gap:
            Math.round(
              infrastructureGap
            ),

          demand_score:
            Math.round(demandScore),

          population_score:
            Math.round(populationScore),

          investment_crore:
            totalInvestment,

          planned_projects:
            plannedProjects,

          ongoing_projects:
            ongoingProjects,

          existing_investment:
            matchingProjects.length > 0,

          priority_score:
            Math.round(priorityScore),

          priority,
        });
      }
    }

    results.sort(
      (a, b) =>
        b.priority_score -
        a.priority_score
    );

    return Response.json({
      success: true,

      methodology: {
        citizen_demand: "35%",
        infrastructure_gap: "35%",
        population_impact: "15%",
        investment_gap: "15%",
      },

      data_note:
        "Citizen requests, infrastructure indicators and public projects are synthetic demonstration data created for this prototype. They are not official government prioritization decisions.",

      total_districts:
        districts.length,

      total_requests:
        requests.length,

      total_projects:
        projects.length,

      hotspots: results,
    });
  } catch (error) {
    console.error(
      "HOTSPOT ERROR:",
      error
    );

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  }
}