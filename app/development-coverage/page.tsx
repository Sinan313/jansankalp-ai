"use client";

import { useEffect, useMemo, useState } from "react";
import Navigation from "../components/Navigation";

type Project = {
  project_id?: string;
  project_name?: string;
  investment_crore?: number;
  status?: string;
};

type CoverageSignal = {
  state: string;
  district: string;
  category: string;
  requests: number;
  high_critical: number;
  demand_share: number;
  priority_score: number;
  priority: string;
  project_count: number;
  investment_crore: number;
  projects: Project[];
  gap_status: string;
};

type ApiResponse = {
  success: boolean;
  priority_signals?: CoverageSignal[];
};

export default function DevelopmentCoveragePage() {
  const [signals, setSignals] = useState<CoverageSignal[]>([]);
  const [loading, setLoading] = useState(true);

  const [aiLoading, setAiLoading] = useState<string | null>(null);
const [aiResults, setAiResults] = useState<
  Record<string, string>
>({});
  const [search, setSearch] = useState("");
  const [state, setState] = useState("All");
  const [district, setDistrict] = useState("All");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch(
          "/api/citizen-requests"
        );

        const result: ApiResponse =
          await response.json();

        if (result.success) {
          setSignals(
            result.priority_signals || []
          );
        }
      } catch (error) {
        console.error(
          "Development coverage error:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const states = useMemo(
    () =>
      Array.from(
        new Set(
          signals
            .map((item) => item.state)
            .filter(Boolean)
        )
      ).sort(),
    [signals]
  );

  const districts = useMemo(
    () =>
      Array.from(
        new Set(
          signals
            .filter(
              (item) =>
                state === "All" ||
                item.state === state
            )
            .map((item) => item.district)
            .filter(Boolean)
        )
      ).sort(),
    [signals, state]
  );

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          signals
            .map((item) => item.category)
            .filter(Boolean)
        )
      ).sort(),
    [signals]
  );

  const filteredSignals = useMemo(() => {
    const query = search.toLowerCase().trim();

    return signals.filter((item) => {
      const matchesSearch =
        !query ||
        `${item.state} ${item.district} ${item.category}`
          .toLowerCase()
          .includes(query);

      const matchesState =
        state === "All" ||
        item.state === state;

      const matchesDistrict =
        district === "All" ||
        item.district === district;

      const matchesCategory =
        category === "All" ||
        item.category === category;

      return (
        matchesSearch &&
        matchesState &&
        matchesDistrict &&
        matchesCategory
      );
    });
  }, [
    signals,
    search,
    state,
    district,
    category,
  ]);

  async function getAiAssessment(
  signal: CoverageSignal
) {
  const key = `${signal.state}-${signal.district}-${signal.category}`;

  if (aiLoading === key) return;

  setAiLoading(key);

  try {
    const response = await fetch(
      "/api/development-recommendation",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          state: signal.state,
          district: signal.district,
          category: signal.category,
          requests: signal.requests,
          high_critical: signal.high_critical,
          demand_share: signal.demand_share,
          priority_score: signal.priority_score,
          priority: signal.priority,
          project_count: signal.project_count,
          investment_crore:
            signal.investment_crore,
          projects: signal.projects,
          gap_status: signal.gap_status,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.error ||
          "Unable to generate assessment."
      );
    }

    setAiResults((previous) => ({
      ...previous,
      [key]:
        result.assessment ||
        result.recommendation ||
        result.message ||
        "No assessment was returned.",
    }));
  } catch (error) {
    console.error(
      "AI assessment error:",
      error
    );

    setAiResults((previous) => ({
      ...previous,
      [key]:
        "AI assessment is temporarily unavailable. Please try again later.",
    }));
  } finally {
    setAiLoading(null);
  }
}

  const summary = useMemo(() => {
    async function getAiAssessment(
  signal: CoverageSignal
) {
  const key = `${signal.state}-${signal.district}-${signal.category}`;

  if (aiLoading === key) return;

  setAiLoading(key);

  try {
    const response = await fetch(
      "/api/development-recommendation",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          state: signal.state,
          district: signal.district,
          category: signal.category,
          requests: signal.requests,
          high_critical: signal.high_critical,
          demand_share: signal.demand_share,
          priority_score: signal.priority_score,
          priority: signal.priority,
          project_count: signal.project_count,
          investment_crore:
            signal.investment_crore,
          projects: signal.projects,
          gap_status: signal.gap_status,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.error ||
          "Unable to generate assessment."
      );
    }

    setAiResults((previous) => ({
      ...previous,
      [key]:
        result.assessment ||
        result.recommendation ||
        result.message ||
        "No assessment was returned.",
    }));
  } catch (error) {
    console.error(
      "AI assessment error:",
      error
    );

    setAiResults((previous) => ({
      ...previous,
      [key]:
        "AI assessment is temporarily unavailable. Please try again later.",
    }));
  } finally {
    setAiLoading(null);
  }
}
    return {
      requests: filteredSignals.reduce(
        (sum, item) => sum + item.requests,
        0
      ),
      highCritical: filteredSignals.reduce(
        (sum, item) => sum + item.high_critical,
        0
      ),
      projects: filteredSignals.reduce(
        (sum, item) => sum + item.project_count,
        0
      ),
      investment: filteredSignals.reduce(
        (sum, item) =>
          sum +
          (Number(item.investment_crore) || 0),
        0
      ),
      gaps: filteredSignals.filter(
        (item) =>
          item.gap_status ===
          "No Matching Project"
      ).length,
    };
  }, [filteredSignals]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <p className="text-sm text-slate-500">
          Loading development coverage...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
        <Navigation />

      <header className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6">

          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
            Development Intelligence
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Development Coverage Explorer
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Compare citizen demand with matching
            public development projects.
          </p>

        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-6">

        {/* Summary */}
        <div className="grid gap-4 md:grid-cols-5">

          <SummaryCard
            label="Citizen Requests"
            value={summary.requests}
          />

          <SummaryCard
            label="High / Critical"
            value={summary.highCritical}
          />

          <SummaryCard
            label="Public Projects"
            value={summary.projects}
          />

          <SummaryCard
            label="Investment"
            value={`₹${summary.investment.toLocaleString()} Cr`}
          />

          <SummaryCard
            label="Development Gaps"
            value={summary.gaps}
          />

        </div>

        {/* Filters */}
        <div className="mt-6 rounded-xl border bg-white p-5">

          <label
  htmlFor="development-coverage-search"
  className="text-xs font-medium text-slate-600"
>
  Search
</label>

<input
  id="development-coverage-search"
  name="search"
  type="text"
  value={search}
  onChange={(event) =>
    setSearch(event.target.value)
  }
  placeholder="Search state, district or category..."
  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
/>

          <div className="mt-4 grid gap-4 md:grid-cols-3">

            <Filter
              label="State"
              value={state}
              options={states}
              onChange={(value) => {
                setState(value);
                setDistrict("All");
              }}
            />

            <Filter
              label="District"
              value={district}
              options={districts}
              onChange={setDistrict}
            />

            <Filter
              label="Category"
              value={category}
              options={categories}
              onChange={setCategory}
            />

          </div>

        </div>

        {/* Results */}
        <div className="mt-6">

          <p className="text-sm font-semibold text-slate-800">
            Development Coverage
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {filteredSignals.length} matching signals
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">

            {filteredSignals.map((item) => {
              const hasProject =
                item.project_count > 0;

              return (
                <div
                  key={`${item.state}-${item.district}-${item.category}`}
                  className="rounded-xl border bg-white p-5"
                >

                  <div className="flex items-start justify-between gap-4">

                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        {item.category}
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        {item.district}, {item.state}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        hasProject
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {hasProject
                        ? "Project Exists"
                        : "No Matching Project"}
                    </span>

                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">

                    <InfoBox
                      label="Citizen Demand"
                      value={item.requests}
                    />

                    <InfoBox
                      label="High / Critical"
                      value={item.high_critical}
                    />

                    <InfoBox
                      label="Public Projects"
                      value={item.project_count}
                    />

                    <InfoBox
                      label="Investment"
                      value={`₹${Number(
                        item.investment_crore
                      ).toLocaleString()} Cr`}
                    />

                  </div>

                  <div className="mt-4 rounded-xl bg-slate-50 p-4">

                    <div className="flex justify-between">

                      <div>
                        <p className="text-xs text-slate-500">
                          Priority
                        </p>

                        <p className="mt-1 font-bold">
                          {item.priority}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">
                          Score
                        </p>

                        <p className="mt-1 font-bold">
                          {item.priority_score}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">
                          Demand Share
                        </p>

                        <p className="mt-1 font-bold">
                          {item.demand_share}%
                        </p>
                      </div>

                    </div>

                  </div>

                                    {hasProject &&
                    item.projects.length > 0 && (
                      <div className="mt-4">

                        <p className="text-xs font-semibold text-slate-700">
                          Matching Project
                        </p>

                        <div className="mt-2 rounded-lg border bg-slate-50 p-3">

                          <p className="text-sm font-semibold text-slate-900">
                            {item.projects[0]
                              .project_name ||
                              "Unnamed Project"}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {item.projects[0].status ||
                              "Unknown"}{" "}
                            · ₹
                            {Number(
                              item.projects[0]
                                .investment_crore
                            ).toLocaleString()}{" "}
                            Cr
                          </p>

                        </div>

                      </div>
                    )}

                  {/* AI Development Assessment */}
                  <div className="mt-4">

                    <button
                      onClick={() =>
                        getAiAssessment(item)
                      }
                      disabled={
                        aiLoading ===
                        `${item.state}-${item.district}-${item.category}`
                      }
                      className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {aiLoading ===
                      `${item.state}-${item.district}-${item.category}`
                        ? "🤖 Gemini is analyzing..."
                        : aiResults[
                            `${item.state}-${item.district}-${item.category}`
                          ]
                        ? "✓ Assessment Generated"
                        : "🤖 Get AI Development Assessment"}
                    </button>

                  </div>

                  {aiResults[
                    `${item.state}-${item.district}-${item.category}`
                  ] && (
                    <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4">

                      <p className="text-sm font-semibold text-blue-900">
                        🤖 AI Development Assessment
                      </p>

                      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
                        {
                          aiResults[
                            `${item.state}-${item.district}-${item.category}`
                          ]
                        }
                      </p>

                      <p className="mt-3 text-xs text-slate-500">
                        AI-assisted prototype assessment based
                        on the available dataset. This is not an
                        automatic government decision.
                      </p>

                    </div>
                  )}

                </div>
              );
            })}

          </div>

        </div>

      </div>

      <footer className="border-t bg-white py-6 text-center text-xs text-slate-500">
        JanSankalp AI — Development Coverage Explorer
      </footer>

    </main>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border bg-white p-5">
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-1 font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function Filter({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-600">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
      >
        <option value="All">
          All {label}s
        </option>

        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}