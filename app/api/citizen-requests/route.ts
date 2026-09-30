import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(
      process.cwd(),
      "data",
      "citizen_requests.json"
    );

    if (!fs.existsSync(filePath)) {
      return Response.json({
        success: true,
        total_requests: 0,
        high_critical: 0,
        category_counts: {},
        location_counts: {},
        priority_signals: [],
        recent_requests: [],
      });
    }

    const file = fs.readFileSync(filePath, "utf-8");
    const requests = JSON.parse(file);

    /*
     * ---------------------------------------------------------
     * BASIC CITIZEN REQUEST STATISTICS
     * ---------------------------------------------------------
     */

    const highCritical = requests.filter(
      (item: { urgency?: string }) =>
        item.urgency === "High" ||
        item.urgency === "Critical"
    ).length;

    const categoryCounts: Record<string, number> = {};

    requests.forEach(
      (item: { category?: string }) => {
        const category = item.category || "Other";

        categoryCounts[category] =
          (categoryCounts[category] || 0) + 1;
      }
    );

    /*
     * ---------------------------------------------------------
     * LOCATION + CATEGORY SIGNALS
     * ---------------------------------------------------------
     */

    const locationCounts: Record<
      string,
      {
        state: string;
        district: string;
        total_requests: number;
        high_critical: number;
        categories: Record<string, number>;
        category_high_critical: Record<string, number>;
      }
    > = {};

    requests.forEach(
      (item: {
        state?: string;
        district?: string;
        category?: string;
        urgency?: string;
      }) => {
        if (!item.state || !item.district) {
          return;
        }

        const locationKey =
          `${item.state}|||${item.district}`;

        if (!locationCounts[locationKey]) {
          locationCounts[locationKey] = {
            state: item.state,
            district: item.district,
            total_requests: 0,
            high_critical: 0,
            categories: {},
            category_high_critical: {},
          };
        }

        const location = locationCounts[locationKey];

        location.total_requests += 1;

        const isHighCritical =
          item.urgency === "High" ||
          item.urgency === "Critical";

        if (isHighCritical) {
          location.high_critical += 1;
        }

        const category =
          item.category || "Other";

        /*
         * Total requests for this category
         */
        location.categories[category] =
          (location.categories[category] || 0) + 1;

        /*
         * High/Critical requests for this category
         */
        if (isHighCritical) {
          location.category_high_critical[category] =
            (location.category_high_critical[category] || 0) + 1;
        }
      }
    );

    /*
     * ---------------------------------------------------------
     * PRIORITY DEVELOPMENT SIGNALS
     * ---------------------------------------------------------
     *
     * Score:
     *
     *  - Request volume contributes to demand
     *  - High/Critical requests contribute more strongly
     *
     * This is a prototype analytical score, not an
     * official government priority ranking.
     */

    const prioritySignals: Array<{
      state: string;
      district: string;
      category: string;
      requests: number;
      high_critical: number;
      demand_share: number;
      priority_score: number;
      priority: string;
    }> = [];

    Object.values(locationCounts).forEach(
      (location) => {
        Object.entries(location.categories).forEach(
          ([category, requestCount]) => {
            const highCriticalCount =
              location.category_high_critical[
                category
              ] || 0;

            /*
             * Request volume score
             */
            const volumeScore =
              requestCount * 2;

            /*
             * Urgency score
             */
            const urgencyScore =
              highCriticalCount * 5;

            /*
             * Combined prototype score
             */
            const priorityScore =
              volumeScore + urgencyScore;

            /*
             * Percentage of this district's
             * citizen requests belonging to
             * this category.
             */
            const demandShare =
              location.total_requests > 0
                ? (requestCount /
                    location.total_requests) *
                  100
                : 0;

            let priority = "Low";

            if (priorityScore >= 40) {
              priority = "High";
            } else if (priorityScore >= 20) {
              priority = "Medium";
            }

            prioritySignals.push({
              state: location.state,
              district: location.district,
              category,
              requests: requestCount,
              high_critical: highCriticalCount,
              demand_share: Number(
                demandShare.toFixed(1)
              ),
              priority_score: priorityScore,
              priority,
            });
          }
        );
      }
    );

    /*
 * ---------------------------------------------------------
 * DEVELOPMENT GAP ANALYSIS
 * ---------------------------------------------------------
 *
 * Compare each citizen priority signal with an
 * existing public project using:
 *
 * State + District + Category
 *
 * This is a prototype comparison based only on the
 * projects available in public_projects.json.
 */

const projectsFilePath = path.join(
  process.cwd(),
  "data",
  "public_projects.json"
);

let publicProjects: Array<{
  project_id?: string;
  state?: string;
  district?: string;
  category?: string;
  project_name?: string;
  investment_crore?: number;
  status?: string;
}> = [];

if (fs.existsSync(projectsFilePath)) {
  const projectsFile = fs.readFileSync(
    projectsFilePath,
    "utf-8"
  );

  publicProjects = JSON.parse(projectsFile);
}

const developmentGapSignals =
  prioritySignals.map((signal) => {

    const matchingProjects =
      publicProjects.filter(
        (project) =>
          project.state === signal.state &&
          project.district === signal.district &&
          project.category === signal.category
      );

    const totalInvestment =
      matchingProjects.reduce(
        (total, project) =>
          total +
          (Number(project.investment_crore) || 0),
        0
      );

    const projectStatuses =
      matchingProjects.map(
        (project) => project.status || "Unknown"
      );

    let gapStatus = "No Matching Project";

    if (matchingProjects.length > 0) {
      gapStatus = "Project Exists";
    }

    return {
      ...signal,

      project_count:
        matchingProjects.length,

      investment_crore:
        totalInvestment,

      project_statuses:
        projectStatuses,

      projects:
        matchingProjects.map(
          (project) => ({
            project_id:
              project.project_id || "",

            project_name:
              project.project_name || "",

            investment_crore:
              Number(
                project.investment_crore
              ) || 0,

            status:
              project.status || "Unknown",
          })
        ),

      gap_status:
        gapStatus,
    };
  });

/*
 * Highest priority signals first
 */
developmentGapSignals.sort(
  (a, b) =>
    b.priority_score -
    a.priority_score
);
    /*
     * ---------------------------------------------------------
     * RECENT REQUESTS
     * ---------------------------------------------------------
     */

    const recentRequests = [...requests]
      .sort(
        (
          a: { createdAt?: string },
          b: { createdAt?: string }
        ) =>
          new Date(
            b.createdAt || 0
          ).getTime() -
          new Date(
            a.createdAt || 0
          ).getTime()
      )
      .slice(0, 5);

    /*
     * ---------------------------------------------------------
     * RESPONSE
     * ---------------------------------------------------------
     */

    return Response.json({
  success: true,

  total_requests: requests.length,

  high_critical: highCritical,

  category_counts: categoryCounts,

  location_counts: locationCounts,

  priority_signals: developmentGapSignals,

  recent_requests: recentRequests,

  requests: requests,
});
  } catch (error) {
    console.error(
      "CITIZEN REQUESTS ERROR:",
      error
    );

    return Response.json(
      {
        success: false,
        error:
          "Unable to load citizen requests.",
      },
      { status: 500 }
    );
  }
}