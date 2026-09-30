"use client";

import { useEffect, useMemo, useState } from "react";
import Navigation from "../components/Navigation";

type Hotspot = {
  district: string;
  state: string;
  category: string;
  request_count: number;
  high_urgency_requests: number;
  population: number;
  infrastructure_access: number;
  infrastructure_gap: number;
  demand_score: number;
  population_score: number;
  investment_crore: number;
  planned_projects: number;
  ongoing_projects: number;
  existing_investment: boolean;
  priority_score: number;
  priority: string;
};

type ApiResponse = {
  success: boolean;
  total_districts: number;
  total_requests: number;
  total_projects: number;
  hotspots: Hotspot[];
  data_note: string;
};

type CitizenRequest = {
  id: string;
  language: string;
  category: string;
  issue: string;
  urgency: string;
  summary: string;
  source: string;
  createdAt: string;
};

type CitizenLocation = {
  state: string;
  district: string;
  total_requests: number;
  high_critical: number;
  categories: Record<string, number>;
};

type CitizenPrioritySignal = {
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
  project_statuses: string[];

  projects: {
    project_id: string;
    project_name: string;
    investment_crore: number;
    status: string;
  }[];

  gap_status: string;
};

type CitizenRequestsResponse = {
  success: boolean;
  total_requests: number;
  high_critical: number;
  category_counts: Record<string, number>;
  location_counts: Record<string, CitizenLocation>;
  priority_signals: CitizenPrioritySignal[];
  recent_requests: CitizenRequest[];
};

export default function DashboardPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [citizenData, setCitizenData] =
  useState<CitizenRequestsResponse | null>(null);

const [category, setCategory] = useState("All");
const [state, setState] = useState("All");

const [selectedSignalState, setSelectedSignalState] =
  useState("All");

const [selectedSignalDistrict, setSelectedSignalDistrict] =
  useState("All");

useEffect(() => {
  async function loadDashboard() {
    try {
      const [hotspotResponse, citizenResponse] =
        await Promise.all([
          fetch("/api/hotspots"),
          fetch("/api/citizen-requests"),
        ]);

      if (!hotspotResponse.ok) {
        throw new Error(
          "Unable to load hotspot data."
        );
      }

      if (!citizenResponse.ok) {
        throw new Error(
          "Unable to load citizen request data."
        );
      }

      const result = await hotspotResponse.json();
      const citizenResult =
        await citizenResponse.json();

      if (!result.success) {
        throw new Error(
          result.error ||
            "Dashboard data failed."
        );
      }

      if (!citizenResult.success) {
        throw new Error(
          citizenResult.error ||
            "Citizen request data failed."
        );
      }

      setData(result);
      setCitizenData(citizenResult);

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  }

  loadDashboard();
}, []);

  const states = useMemo(() => {
    if (!data) return [];

    return [
      ...new Set(
        data.hotspots.map((item) => item.state)
      ),
    ].sort();
  }, [data]);

  const categories = useMemo(() => {
    if (!data) return [];

    return [
      ...new Set(
        data.hotspots.map((item) => item.category)
      ),
    ].sort();
  }, [data]);

  const citizenSignalStates = useMemo(() => {
  if (!citizenData) return [];

  return [
    ...new Set(
      Object.values(citizenData.location_counts).map(
        (location) => location.state
      )
    ),
  ].sort();
}, [citizenData]);

const citizenSignalDistricts = useMemo(() => {
  if (!citizenData) return [];

  return [
    ...new Set(
      Object.values(citizenData.location_counts)
        .filter(
          (location) =>
            selectedSignalState === "All" ||
            location.state === selectedSignalState
        )
        .map((location) => location.district)
    ),
  ].sort();
}, [citizenData, selectedSignalState]);

const filteredCitizenLocations = useMemo(() => {
  if (!citizenData) return [];

  return Object.values(citizenData.location_counts).filter(
    (location) => {
      const stateMatch =
        selectedSignalState === "All" ||
        location.state === selectedSignalState;

      const districtMatch =
        selectedSignalDistrict === "All" ||
        location.district === selectedSignalDistrict;

      return stateMatch && districtMatch;
    }
  );
}, [
  citizenData,
  selectedSignalState,
  selectedSignalDistrict,
]);

const filteredPrioritySignals = useMemo(() => {
  if (!citizenData) return [];

  return citizenData.priority_signals.filter((signal) => {
  const stateMatch =
    selectedSignalState === "All" ||
    signal.state === selectedSignalState;

  const districtMatch =
    selectedSignalDistrict === "All" ||
    signal.district === selectedSignalDistrict;

  return stateMatch && districtMatch;
});
}, [
  citizenData,
  selectedSignalState,
  selectedSignalDistrict,
]);

const filteredCitizenSummary = useMemo(() => {
  const totalRequests = filteredCitizenLocations.reduce(
    (sum, location) => sum + location.total_requests,
    0
  );

  const highCritical = filteredCitizenLocations.reduce(
    (sum, location) => sum + location.high_critical,
    0
  );

  const categorySet = new Set<string>();

  filteredCitizenLocations.forEach((location) => {
    Object.keys(location.categories).forEach((category) => {
      categorySet.add(category);
    });
  });

  return {
    totalRequests,
    highCritical,
    prioritySignals: filteredPrioritySignals.length,
    categories: categorySet.size,
  };
}, [
  filteredCitizenLocations,
  filteredPrioritySignals,
]);
const filteredHotspots = useMemo(() => {
    if (!data) return [];

    return data.hotspots.filter((item) => {
      const categoryMatch =
        category === "All" ||
        item.category === category;

      const stateMatch =
        state === "All" ||
        item.state === state;

      return categoryMatch && stateMatch;
    });
  }, [data, category, state]);

  const highPriorityCount = data
    ? data.hotspots.filter(
        (item) =>
          item.priority === "High" ||
          item.priority === "Critical"
      ).length
    : 0;

  const totalInvestment = data
    ? data.hotspots.reduce(
        (sum, item) =>
          sum + item.investment_crore,
        0
      )
    : 0;

    const stateSignals = useMemo(() => {
  if (!data) return [];

  const grouped = new Map<
    string,
    {
      state: string;
      signals: number;
      highPriority: number;
      averagePriority: number;
    }
  >();

  data.hotspots.forEach((item) => {
    const existing = grouped.get(item.state);

    if (existing) {
      existing.signals += 1;

      if (
        item.priority === "High" ||
        item.priority === "Critical"
      ) {
        existing.highPriority += 1;
      }

      existing.averagePriority += item.priority_score;
    } else {
      grouped.set(item.state, {
        state: item.state,
        signals: 1,
        highPriority:
          item.priority === "High" ||
          item.priority === "Critical"
            ? 1
            : 0,
        averagePriority: item.priority_score,
      });
    }
  });

  return Array.from(grouped.values())
    .map((item) => ({
      ...item,
      averagePriority: Math.round(
        item.averagePriority / item.signals
      ),
    }))
    .sort(
      (a, b) =>
        b.highPriority - a.highPriority ||
        b.averagePriority - a.averagePriority
    )
    .slice(0, 8);
}, [data]);

const categorySignals = useMemo(() => {
  if (!data) return [];

  const grouped = new Map<
    string,
    {
      category: string;
      signals: number;
      highPriority: number;
      totalPriority: number;
    }
  >();

  data.hotspots.forEach((item) => {
    const existing = grouped.get(item.category);

    if (existing) {
      existing.signals += 1;
      existing.totalPriority += item.priority_score;

      if (
        item.priority === "High" ||
        item.priority === "Critical"
      ) {
        existing.highPriority += 1;
      }
    } else {
      grouped.set(item.category, {
        category: item.category,
        signals: 1,
        highPriority:
          item.priority === "High" ||
          item.priority === "Critical"
            ? 1
            : 0,
        totalPriority: item.priority_score,
      });
    }
  });

  return Array.from(grouped.values())
    .map((item) => ({
      ...item,
      averagePriority: Math.round(
        item.totalPriority / item.signals
      ),
    }))
    .sort((a, b) => b.signals - a.signals);
}, [data]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          <p className="font-medium text-slate-700">
            Loading JanSankalp dashboard...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-lg rounded-2xl border border-red-200 bg-red-50 p-6">
          <h1 className="text-xl font-bold text-red-800">
            Dashboard Error
          </h1>

          <p className="mt-2 text-red-700">
            {error}
          </p>

          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  if (!data) return null;

  return (
    <main className="min-h-screen bg-slate-50">

        <Navigation />

      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Dashboard
            </h1>

            <p className="text-sm text-slate-500">
              Public Development Intelligence Dashboard
            </p>
          </div>

        </div>
      </header>

      {/* Main */}
      <div className="mx-auto max-w-7xl px-6 py-8">

        {/* Title */}
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Policymaker View
          </p>

          <h2 className="mt-2 text-3xl font-bold text-slate-900">
            Development Hotspots
          </h2>

          <p className="mt-2 max-w-3xl text-slate-600">
            AI-assisted analysis of citizen demand,
            infrastructure gaps, population impact and
            existing public investment.
          </p>
        </div>

        {/* Statistics */}
        <div className="mt-8 grid gap-4 md:grid-cols-4">

          <StatCard
  title="High / Critical Requests"
  value={
    citizenData
      ? filteredCitizenSummary.highCritical.toLocaleString()
      : "0"
  }
  description="Higher urgency signals"
/>
          <StatCard
            title="Districts"
            value={data.total_districts.toString()}
            description="Across multiple Indian states"
          />

          <StatCard
            title="Public Projects"
            value={data.total_projects.toString()}
            description="Prototype investment records"
          />

          <StatCard
            title="High/Critical Signals"
            value={highPriorityCount.toString()}
            description="District-category signals"
          />

        </div>
        
        {/* Development Intelligence Summary */}
{citizenData && (
  <div className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">

    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
          Development Intelligence
        </p>

        <h3 className="mt-1 text-xl font-bold text-slate-900">
          Development Intelligence Summary
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Live overview of citizen demand, urgency and priority development signals.
        </p>
      </div>

      <div className="rounded-full bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700">
        Live Analysis
      </div>

    </div>

    <p className="mb-3 text-xs text-slate-500">
  Filter: {selectedSignalState} → {selectedSignalDistrict}
</p>


    {/* Summary Metrics */}
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

      <div className="rounded-xl bg-slate-50 p-4">
        <p className="text-xs text-slate-500">
          Citizen Requests
        </p>

        <p className="mt-1 text-2xl font-bold text-slate-900">
          {filteredCitizenSummary.totalRequests.toLocaleString()}
           </p>

        <p className="mt-1 text-xs text-slate-400">
          Saved Citizen Voice requests
        </p>
      </div>


      <div className="rounded-xl bg-slate-50 p-4">
        <p className="text-xs text-slate-500">
          High / Critical Requests
        </p>

        <p className="mt-1 text-2xl font-bold text-slate-900">
          {filteredCitizenSummary.highCritical.toLocaleString()}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          Higher urgency signals
        </p>
      </div>


      <div className="rounded-xl bg-slate-50 p-4">
        <p className="text-xs text-slate-500">
          Priority Signals
        </p>

        <p className="mt-1 text-2xl font-bold text-slate-900">
          {filteredCitizenSummary.prioritySignals.toLocaleString()}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          Location-category signals
        </p>
      </div>


      <div className="rounded-xl bg-slate-50 p-4">
        <p className="text-xs text-slate-500">
          Categories Reported
        </p>

        <p className="mt-1 text-2xl font-bold text-slate-900">
          {filteredCitizenSummary.categories.toLocaleString()}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          Development categories
        </p>
      </div>

    </div>


   {/* Top Citizen Signal */}
{filteredPrioritySignals.length > 0 && (
  <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-5">

    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

      <div>

        <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
          Top Citizen Development Signal
        </p>

        <p className="mt-1 text-lg font-bold text-slate-900">
          {filteredPrioritySignals[0].category}
        </p>

        <p className="mt-1 text-sm text-slate-600">
          {filteredPrioritySignals[0].district},{" "}
          {filteredPrioritySignals[0].state}
        </p>

      </div>

      <span
        className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
          filteredPrioritySignals[0].priority === "High"
            ? "bg-red-100 text-red-700"
            : filteredPrioritySignals[0].priority === "Medium"
            ? "bg-orange-100 text-orange-700"
            : "bg-slate-100 text-slate-600"
        }`}
      >
        {filteredPrioritySignals[0].priority} Priority
      </span>

    </div>

    <div className="mt-4 grid gap-3 sm:grid-cols-3">

      <div className="rounded-lg bg-white p-3">
        <p className="text-xs text-slate-500">
          Requests
        </p>

        <p className="mt-1 text-lg font-bold text-slate-900">
          {filteredPrioritySignals[0].requests}
        </p>
      </div>

      <div className="rounded-lg bg-white p-3">
        <p className="text-xs text-slate-500">
          High / Critical
        </p>

        <p className="mt-1 text-lg font-bold text-slate-900">
          {filteredPrioritySignals[0].high_critical}
        </p>
      </div>

      <div className="rounded-lg bg-white p-3">
        <p className="text-xs text-slate-500">
          Demand Share
        </p>

        <p className="mt-1 text-lg font-bold text-slate-900">
          {filteredPrioritySignals[0].demand_share}%
        </p>
      </div>

    </div>

    <div className="mt-4 flex items-center justify-between">

      <span className="text-xs text-slate-500">
        Prototype Priority Score
      </span>

      <span className="text-sm font-bold text-slate-800">
        {filteredPrioritySignals[0].priority_score}
      </span>

    </div>

  </div>
)}

  </div>
)}


{/* Live Citizen Voice */}
<div className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">

  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

    <div>
      <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
        Citizen Voice
      </p>

      <h3 className="mt-1 text-xl font-bold text-slate-900">
        Live Citizen Development Requests
      </h3>

      <p className="mt-1 text-sm text-slate-500">
        Requests submitted through the JanSankalp AI Citizen Voice interface.
      </p>
    </div>

    <div className="rounded-full bg-green-50 px-4 py-2 text-xs font-semibold text-green-700">
      Live Data
    </div>

  </div>

  {citizenData && (
    <>

      {/* Citizen Statistics */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">

        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs text-slate-500">
            Total Citizen Requests
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
           {filteredCitizenSummary.totalRequests.toLocaleString()}
            </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs text-slate-500">
            High / Critical
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {citizenData.high_critical}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs text-slate-500">
            Categories Reported
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {Object.keys(
              citizenData.category_counts
            ).length}
          </p>
        </div>

      </div>


      {/* Latest Citizen Request */}
      {citizenData.recent_requests.length > 0 && (
        <div className="mt-6">

          <p className="mb-3 text-sm font-semibold text-slate-700">
            Latest Citizen Request
          </p>

          {(() => {
            const item =
              citizenData.recent_requests[0];

            return (
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">

                <div className="flex flex-wrap items-center gap-2">

                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700">
                    {item.language}
                  </span>

                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                    {item.category}
                  </span>

                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-orange-700">
                    {item.urgency}
                  </span>

                </div>

                <p className="mt-3 text-sm font-semibold text-slate-800">
                  {item.issue}
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {item.summary}
                </p>

                <p className="mt-3 text-xs text-slate-400">
                  Submitted through Citizen Voice
                </p>

              </div>
            );
          })()}

        </div>
      )}


{/* Citizen Development Signals */}
{Object.keys(citizenData.location_counts).length > 0 && (
  <div className="mt-6">

    {/* Signal Filters */}
<div className="mb-5 grid gap-4 rounded-xl border bg-slate-50 p-4 sm:grid-cols-2">

{/* State Filter */}
<div>
  <label
    htmlFor="signal-state-filter"
    className="text-xs font-semibold text-slate-600"
  >
    Signal State
  </label>

  <select
    id="signal-state-filter"
    name="signalState"
    value={selectedSignalState}
    onChange={(e) => {
      setSelectedSignalState(e.target.value);
      setSelectedSignalDistrict("All");
    }}
    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
  >
    <option value="All">
      All States
    </option>

    {citizenSignalStates.map((signalState) => (
      <option
        key={signalState}
        value={signalState}
      >
        {signalState}
      </option>
    ))}
  </select>
</div>


  {/* District Filter */}
<div>
  <label
    htmlFor="signal-district-filter"
    className="text-xs font-semibold text-slate-600"
  >
    Signal District
  </label>

  <select
    id="signal-district-filter"
    name="signalDistrict"
    value={selectedSignalDistrict}
    onChange={(e) =>
      setSelectedSignalDistrict(e.target.value)
    }
    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
  >
    <option value="All">
      All Districts
    </option>

    {citizenSignalDistricts.map((district) => (
      <option
        key={district}
        value={district}
      >
        {district}
      </option>
    ))}
  </select>
</div>

</div>

    <div className="mb-3">
      <p className="text-sm font-semibold text-slate-700">
        Citizen Development Signals
      </p>

      <p className="text-xs text-slate-500">
        Location-based signals generated from Citizen Voice requests.
      </p>
    </div>
<div className="max-h-[360px] overflow-y-auto pr-2">
  <div className="grid gap-4 md:grid-cols-2">

    {filteredCitizenLocations
  .slice()
  .sort(
    (a, b) =>
      b.total_requests - a.total_requests
  )
  .map((location) => (
          <div
            key={`${location.state}-${location.district}`}
            className="rounded-xl border bg-white p-5"
          >

            <div className="flex items-start justify-between gap-4">

              <div>
                <p className="text-lg font-bold text-slate-900">
                  {location.district}
                </p>

                <p className="text-sm text-slate-500">
                  {location.state}
                </p>
              </div>

              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {location.total_requests} requests
              </span>

            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">

              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">
                  High / Critical
                </p>

                <p className="mt-1 text-xl font-bold text-slate-900">
                  {location.high_critical}
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">
                  Categories
                </p>

                <p className="mt-1 text-xl font-bold text-slate-900">
                  {Object.keys(location.categories).length}
                </p>
              </div>

            </div>

            <div className="mt-4 flex flex-wrap gap-2">

              {Object.entries(location.categories).map(
                ([category, count]) => (
                  <span
                    key={category}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                  >
                    {category}: {count}
                  </span>
                )
              )}

            </div>

          </div>
        ))}

    </div>

  </div>

  </div>
)}

{/* Priority Development Signals */}
{filteredPrioritySignals.length > 0 && (
  <div className="mt-6">

<p className="mb-3 text-xs text-slate-500">
  Showing{" "}
  {
    Object.values(citizenData.location_counts).filter(
      (location) => {
        const stateMatch =
          selectedSignalState === "All" ||
          location.state === selectedSignalState;

        const districtMatch =
          selectedSignalDistrict === "All" ||
          location.district === selectedSignalDistrict;

        return stateMatch && districtMatch;
      }
    ).length
  } location signals
</p>

    <div className="mb-3">
      <p className="text-sm font-semibold text-slate-700">
        Priority Development Signals
      </p>

      <p className="text-xs text-slate-500">
        Areas showing stronger citizen demand based on request volume
        and High/Critical urgency.
      </p>
    </div>

    <div className="max-h-[420px] overflow-y-auto pr-2">
      <div className="grid gap-4 md:grid-cols-2">

        {filteredPrioritySignals.map((signal) => (
            <PrioritySignalCard
              key={`${signal.state}-${signal.district}-${signal.category}`}
              signal={signal}
            />
          ))}

      </div>
    </div>

  </div>
)}

{/* Development Gap Analysis */}
{filteredPrioritySignals.length > 0 && (
  <div className="mt-6">

    <div className="mb-4">
      <p className="text-sm font-semibold text-slate-700">
        Development Gap Analysis
      </p>

      <p className="mt-1 text-xs text-slate-500">
        Comparison between citizen development demand and matching
        public projects in the prototype dataset.
      </p>
    </div>

    <div className="grid gap-4 md:grid-cols-2">

      {filteredPrioritySignals
        .slice(0, 6)
        .map((signal) => (
          <div
            key={`gap-${signal.state}-${signal.district}-${signal.category}`}
            className="rounded-xl border bg-white p-5 shadow-sm"
          >

            {/* Header */}
            <div className="flex items-start justify-between gap-4">

              <div>
                <p className="text-lg font-bold text-slate-900">
                  {signal.category}
                </p>

                <p className="mt-1 text-sm font-medium text-slate-600">
                  📍 {signal.district}, {signal.state}
                </p>
              </div>

              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                  signal.gap_status === "Project Exists"
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {signal.gap_status}
              </span>

            </div>


            {/* Citizen Demand */}
            <div className="mt-5">

              <p className="mb-3 text-sm font-bold text-slate-800">
                🗣️ Citizen Demand
              </p>

              <div className="grid grid-cols-3 gap-3">

                <div className="rounded-lg bg-blue-50 p-3">
                  <p className="text-xs text-slate-500">
                    Requests
                  </p>

                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {signal.requests}
                  </p>
                </div>

                <div className="rounded-lg bg-orange-50 p-3">
                  <p className="text-xs text-slate-500">
                    High / Critical
                  </p>

                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {signal.high_critical}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">
                    Demand Share
                  </p>

                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {signal.demand_share}%
                  </p>
                </div>

              </div>

            </div>


            {/* Priority Signal */}
            <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-xs font-semibold text-blue-700">
                    Prototype Priority Signal
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Based on citizen demand and urgency.
                  </p>
                </div>

                <span className="text-xl font-bold text-blue-800">
                  {signal.priority_score}
                </span>

              </div>

            </div>


            {/* Public Intervention */}
            <div className="mt-5">

              <p className="mb-3 text-sm font-bold text-slate-800">
                🏗️ Public Intervention
              </p>

              <div className="grid grid-cols-2 gap-3">

                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">
                    Public Projects
                  </p>

                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {signal.project_count}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">
                    Investment
                  </p>

                  <p className="mt-1 text-xl font-bold text-slate-900">
                    ₹{signal.investment_crore} Cr
                  </p>
                </div>

              </div>

            </div>


            {/* Infrastructure Gap */}
            <div
              className={`mt-4 rounded-lg border p-4 ${
                signal.gap_status === "Project Exists"
                  ? "border-green-100 bg-green-50"
                  : "border-orange-100 bg-orange-50"
              }`}
            >

              <p
                className={`text-xs font-semibold ${
                  signal.gap_status === "Project Exists"
                    ? "text-green-800"
                    : "text-orange-800"
                }`}
              >
                Infrastructure Gap
              </p>

              <p
                className={`mt-1 text-sm font-semibold ${
                  signal.gap_status === "Project Exists"
                    ? "text-green-700"
                    : "text-orange-700"
                }`}
              >
                {signal.gap_status === "Project Exists"
                  ? "Matching public intervention exists for this citizen demand."
                  : "Citizen demand exists, but no matching public project was found."}
              </p>

            </div>


            {/* Matching Projects */}
            {signal.projects.length > 0 && (
              <div className="mt-4">

                <p className="text-xs font-semibold text-slate-600">
                  Matching Public Projects
                </p>

                <div className="mt-2 space-y-2">

                  {signal.projects.map((project) => (
                    <div
                      key={project.project_id}
                      className="rounded-lg border border-slate-100 bg-slate-50 p-3"
                    >

                      <p className="text-sm font-semibold text-slate-800">
                        {project.project_name}
                      </p>

                      <div className="mt-1 flex flex-wrap gap-2">

                        <span className="text-xs text-slate-500">
                          {project.status}
                        </span>

                        <span className="text-xs text-slate-500">
                          ₹{project.investment_crore} Cr
                        </span>

                      </div>

                    </div>
                  ))}

                </div>

              </div>
            )}


            {/* No Matching Project */}
            {signal.gap_status === "No Matching Project" && (
              <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 p-3">

                <p className="text-xs font-semibold text-orange-800">
                  ⚠️ Development Gap Signal
                </p>

                <p className="mt-1 text-xs leading-5 text-orange-700">
                  Citizen demand exists for this category, but no matching
                  public project was found in the current prototype dataset.
                </p>

              </div>
            )}

          </div>
        ))}

    </div>

  </div>
)}
      {/* Disclaimer */}
      <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs leading-5 text-blue-800">
        ℹ️ Citizen Voice data is collected through the JanSankalp AI
        prototype. AI classifications are intended for exploratory
        development analysis and are not official government statistics.
      </div>

    </>
  )}

</div>
        {/* Investment */}
        <div className="mt-4 rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Tracked Prototype Investment
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                ₹{totalInvestment} Cr
              </p>
            </div>

            <div className="rounded-xl bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
              Public Projects
            </div>
          </div>
        </div>


        {/* India Development Signals */}
<div className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">

  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

    <div>
      <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
        India View
      </p>

      <h3 className="mt-1 text-xl font-bold text-slate-900">
        Development Signals Across India
      </h3>

      <p className="mt-1 text-sm text-slate-500">
        Prototype signals grouped by state using citizen demand,
        infrastructure gaps and priority scores.
      </p>
    </div>

    <div className="rounded-full bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700">
      {stateSignals.length} states shown
    </div>

  </div>

  <div className="mt-6 grid gap-4 md:grid-cols-2">

    {stateSignals.map((item, index) => {

      const barWidth = Math.max(
        10,
        Math.min(
          100,
          (item.averagePriority / 100) * 100
        )
      );

      return (
        <div
          key={item.state}
          className="rounded-xl border border-slate-200 bg-slate-50 p-4"
        >

          <div className="flex items-center justify-between">

            <div className="flex items-center gap-3">

              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-600 shadow-sm">
                {index + 1}
              </div>

              <div>
                <p className="font-semibold text-slate-900">
                  {item.state}
                </p>

                <p className="text-xs text-slate-500">
                  {item.signals} development signals
                </p>
              </div>

            </div>

            <div className="text-right">
              <p className="text-lg font-bold text-slate-900">
                {item.averagePriority}
              </p>

              <p className="text-xs text-slate-500">
                avg. priority
              </p>
            </div>

          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">

            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{
                width: `${barWidth}%`,
              }}
            />

          </div>

          <div className="mt-3 flex justify-between text-xs">

            <span className="text-slate-500">
              High/Critical signals
            </span>

            <span className="font-semibold text-slate-800">
              {item.highPriority}
            </span>

          </div>

        </div>
      );
    })}

  </div>

  <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs leading-5 text-blue-800">
    ℹ️ This visualization uses synthetic demonstration data
    generated for the JanSankalp AI prototype. It is intended
    to demonstrate how citizen demand and infrastructure
    indicators could be explored across Indian states.
  </div>

</div>
{/* Category Demand Overview */}
<div className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">

  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

    <div>
      <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
        Demand Overview
      </p>

      <h3 className="mt-1 text-xl font-bold text-slate-900">
        Development Demand by Category
      </h3>

      <p className="mt-1 text-sm text-slate-500">
        Prototype signals grouped by development category.
      </p>
    </div>

    <div className="rounded-full bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700">
      {categorySignals.length} categories
    </div>

  </div>

  <div className="mt-6 space-y-4">

    {categorySignals.map((item) => {

      const maxSignals =
        categorySignals[0]?.signals || 1;

      const barWidth = Math.max(
        8,
        (item.signals / maxSignals) * 100
      );

      return (
        <div key={item.category}>

          <div className="mb-2 flex items-center justify-between">

            <div>
              <p className="text-sm font-semibold text-slate-800">
                {item.category}
              </p>

              <p className="text-xs text-slate-500">
                {item.highPriority} high/critical signals
              </p>
            </div>

            <div className="text-right">
              <p className="text-sm font-bold text-slate-900">
                {item.signals}
              </p>

              <p className="text-xs text-slate-500">
                signals
              </p>
            </div>

          </div>

          <div className="h-3 overflow-hidden rounded-full bg-slate-100">

            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{
                width: `${barWidth}%`,
              }}
            />

          </div>

          <div className="mt-1 text-right text-xs text-slate-400">
            Avg. priority: {item.averagePriority}/100
          </div>

        </div>
      );
    })}

  </div>

  <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs leading-5 text-blue-800">
    ℹ️ Category counts are calculated from the prototype's
    synthetic hotspot dataset and are intended for demonstration,
    not as official government statistics.
  </div>

</div>

        {/* Infrastructure Hotspot Filters */}
        <div className="mt-8 rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">

            <div className="flex-1">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                State
              </label>

              <select
                value={state}
                onChange={(e) =>
                  setState(e.target.value)
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="All">
                  All States
                </option>

                {states.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Infrastructure Hotspot Filters
              </label>

              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value)
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="All">
                  All Categories
                </option>

                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

          </div>
        </div>

{/* Hotspots */}
{/* Infrastructure Priority Hotspots */}
<div className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">

  <div className="mb-4 flex items-center justify-between">
    <div>
      <h3 className="text-xl font-bold text-slate-900">
        Infrastructure Priority Hotspots
      </h3>

      <p className="mt-1 text-sm text-slate-500">
        Ranked infrastructure signals based on the prototype priority model.
      </p>
    </div>

    <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
      {filteredHotspots.length} results
    </span>
  </div>

  {/* Scrollable hotspot area */}
  <div className="max-h-[500px] overflow-y-auto pr-2">

    <div className="grid gap-4 lg:grid-cols-2">

      {filteredHotspots
        .slice(0, 20)
        .map((item, index) => (
          <HotspotCard
            key={`${item.district}-${item.category}`}
            item={item}
            rank={index + 1}
          />
        ))}

    </div>

  </div>

</div>
        {/* Methodology */}
        <div className="mt-10 rounded-2xl border bg-white p-6 shadow-sm">

          <h3 className="text-lg font-bold text-slate-900">
            Prototype Methodology
          </h3>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

            <MethodCard
              title="Citizen Demand"
              value="35%"
            />

            <MethodCard
              title="Infrastructure Gap"
              value="35%"
            />

            <MethodCard
              title="Population Impact"
              value="15%"
            />

            <MethodCard
              title="Investment Gap"
              value="15%"
            />

          </div>

          <p className="mt-5 text-sm leading-6 text-slate-500">
            These weights are part of the prototype methodology
            and are not an official government prioritization
            formula. All current citizen, infrastructure and
            investment records are synthetic demonstration data.
          </p>

        </div>

      </div>

      {/* Footer */}
      <footer className="mt-10 border-t bg-white py-6 text-center text-sm text-slate-500">
        JanSankalp AI — AI-assisted development intelligence
        for India 🇮🇳
      </footer>

    </main>
  );
}

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">

      <p className="text-sm font-medium text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-3xl font-bold text-slate-900">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-500">
        {description}
      </p>

    </div>
  );
}

function HotspotCard({
  item,
  rank,
}: {
  item: Hotspot;
  rank: number;
}) {
  const [recommendation, setRecommendation] =
    useState("");

  const [loadingRecommendation, setLoadingRecommendation] =
    useState(false);

  const [recommendationError, setRecommendationError] =
    useState("");

  const [showRecommendation, setShowRecommendation] =
    useState(false);

  const priorityStyle =
    item.priority === "Critical"
      ? "bg-red-100 text-red-700"
      : item.priority === "High"
      ? "bg-orange-100 text-orange-700"
      : item.priority === "Medium"
      ? "bg-yellow-100 text-yellow-700"
      : "bg-green-100 text-green-700";

  async function getRecommendation() {
    if (recommendation || loadingRecommendation) {
      return;
    }

    setLoadingRecommendation(true);
    setRecommendationError("");
    setShowRecommendation(true);

    try {
      const response = await fetch(
        "/api/recommendation",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(item),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(
          result.error ||
            "Unable to generate recommendation."
        );
      }

      setRecommendation(result.recommendation);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "";

      if (
        message.includes("429") ||
        message.includes("RESOURCE_EXHAUSTED") ||
        message.includes("quota")
      ) {
        setRecommendationError(
          "AI service quota has temporarily been reached. Please try again later."
        );
      } else if (
        message.includes("503") ||
        message.includes("UNAVAILABLE") ||
        message.includes("high demand")
      ) {
        setRecommendationError(
          "Gemini is temporarily experiencing high demand. Please try again later."
        );
      } else {
        setRecommendationError(
          "The AI recommendation could not be generated. Please try again."
        );
      }
    } finally {
      setLoadingRecommendation(false);
    }
  }

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">

        <div className="flex gap-4">

          {/* Rank */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600">
            {rank}
          </div>

          {/* Location */}
          <div>
            <h4 className="font-bold text-slate-900">
              {item.district}
            </h4>

            <p className="mt-1 text-sm font-medium text-slate-600">
              📍 {item.state}
            </p>
          </div>

        </div>

        {/* Priority */}
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${priorityStyle}`}
        >
          {item.priority}
        </span>

      </div>

      {/* Category */}
      <div className="mt-5 rounded-xl bg-blue-50 p-4">

        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
          Development Category
        </p>

        <p className="mt-1 text-lg font-bold text-blue-800">
          {item.category}
        </p>

      </div>

      {/* Citizen Signals */}
      <div className="mt-4">

        <p className="mb-3 text-sm font-bold text-slate-800">
          🗣️ Citizen Signals
        </p>

        <div className="grid grid-cols-2 gap-3">

          <Metric
            label="Priority Score"
            value={item.priority_score}
          />

          <Metric
            label="Citizen Demand"
            value={item.demand_score}
          />

          <Metric
            label="High Urgency"
            value={item.high_urgency_requests}
          />

          <Metric
            label="Infrastructure Gap"
            value={item.infrastructure_gap}
          />

        </div>

      </div>

      {/* Infrastructure Status */}
      <div className="mt-5">

        <p className="mb-3 text-sm font-bold text-slate-800">
          🏗️ Infrastructure Status
        </p>

        <div className="grid grid-cols-2 gap-3">

          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-slate-500">
              Population
            </p>

            <p className="mt-1 font-bold text-slate-900">
              {item.population.toLocaleString()}
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-slate-500">
              Investment
            </p>

            <p className="mt-1 font-bold text-slate-900">
              ₹{item.investment_crore} Cr
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-slate-500">
              Planned Projects
            </p>

            <p className="mt-1 font-bold text-slate-900">
              {item.planned_projects}
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-slate-500">
              Ongoing Projects
            </p>

            <p className="mt-1 font-bold text-slate-900">
              {item.ongoing_projects}
            </p>
          </div>

        </div>

      </div>

      {/* Infrastructure Gap */}
      <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 p-4">

        <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">
          Infrastructure Gap
        </p>

        <div className="mt-1 flex items-center justify-between gap-3">

          <p className="text-sm font-semibold text-slate-800">
            Current gap score
          </p>

          <span className="text-lg font-bold text-orange-700">
            {item.infrastructure_gap}
          </span>

        </div>

      </div>

      {/* AI Recommendation Button */}
      <button
        onClick={getRecommendation}
        disabled={
          loadingRecommendation ||
          !!recommendation
        }
        className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loadingRecommendation
          ? "🤖 Gemini is analyzing..."
          : recommendation
          ? "✓ Recommendation Generated"
          : "🤖 Get AI Recommendation"}
      </button>

      {/* AI Recommendation */}
      {showRecommendation && (
        <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">

          <div className="flex items-center gap-2">

            <span className="text-lg">
              🤖
            </span>

            <h5 className="font-bold text-blue-900">
              AI Development Assessment
            </h5>

          </div>

          {loadingRecommendation && (
            <div className="mt-4">

              <div className="h-3 w-full animate-pulse rounded bg-blue-100" />

              <div className="mt-2 h-3 w-5/6 animate-pulse rounded bg-blue-100" />

              <div className="mt-2 h-3 w-4/6 animate-pulse rounded bg-blue-100" />

            </div>
          )}

          {recommendationError && (
            <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {recommendationError}
            </div>
          )}

          {recommendation && (
            <div className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-700">
              {recommendation}
            </div>
          )}

          <div className="mt-4 rounded-lg border border-blue-200 bg-white p-3 text-xs leading-5 text-slate-500">
            ⚠️ AI-assisted prototype recommendation based
            on synthetic demonstration data. It is not an
            automatic government decision.
          </div>

        </div>
      )}

    </div>
  );
}
function PrioritySignalCard({
  signal,
}: {
  signal: CitizenPrioritySignal;
}) {
  const [recommendation, setRecommendation] =
    useState("");

  const [loadingRecommendation, setLoadingRecommendation] =
    useState(false);

  const [recommendationError, setRecommendationError] =
    useState("");

  const [showRecommendation, setShowRecommendation] =
    useState(false);

  async function getDevelopmentAssessment() {
    if (recommendation || loadingRecommendation) {
      return;
    }

    setLoadingRecommendation(true);
    setRecommendationError("");
    setShowRecommendation(true);

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
            investment_crore: signal.investment_crore,
            projects: signal.projects,
            gap_status: signal.gap_status,
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(
          result.error ||
            "Unable to generate development assessment."
        );
      }

      setRecommendation(result.recommendation);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "";

      if (
        message.includes("429") ||
        message.includes("RESOURCE_EXHAUSTED") ||
        message.includes("quota")
      ) {
        setRecommendationError(
          "AI service quota has temporarily been reached. Please try again later."
        );
      } else if (
        message.includes("503") ||
        message.includes("UNAVAILABLE") ||
        message.includes("high demand")
      ) {
        setRecommendationError(
          "Gemini is temporarily experiencing high demand. Please try again later."
        );
      } else {
        setRecommendationError(
          "The AI development assessment could not be generated. Please try again."
        );
      }
    } finally {
      setLoadingRecommendation(false);
    }
  }

  return (
    <div className="rounded-xl border bg-white p-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-bold text-slate-900">
            {signal.category}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {signal.district}, {signal.state}
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            signal.priority === "High"
              ? "bg-red-50 text-red-700"
              : signal.priority === "Medium"
              ? "bg-orange-50 text-orange-700"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {signal.priority} Priority
        </span>
      </div>

      {/* Citizen Demand */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Requests</p>
          <p className="mt-1 text-xl font-bold text-slate-900">
            {signal.requests}
          </p>
        </div>

        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs text-slate-500">
            High / Critical
          </p>
          <p className="mt-1 text-xl font-bold text-slate-900">
            {signal.high_critical}
          </p>
        </div>

        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Demand</p>
          <p className="mt-1 text-xl font-bold text-slate-900">
            {signal.demand_share}%
          </p>
        </div>
      </div>

      {/* Priority Score */}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-slate-500">
          Prototype Priority Score
        </span>

        <span className="text-sm font-bold text-slate-800">
          {signal.priority_score}
        </span>
      </div>

      {/* Existing Public Projects */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs text-slate-500">
            Public Projects
          </p>
          <p className="mt-1 text-xl font-bold text-slate-900">
            {signal.project_count}
          </p>
        </div>

        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs text-slate-500">
            Investment
          </p>
          <p className="mt-1 text-xl font-bold text-slate-900">
            ₹{signal.investment_crore} Cr
          </p>
        </div>
      </div>

      {/* Gap Status */}
      <div className="mt-4 rounded-lg border bg-slate-50 p-3">
        <p className="text-xs font-semibold text-slate-600">
          Development Gap
        </p>
        <p className="mt-1 text-sm font-semibold text-slate-800">
          {signal.gap_status}
        </p>
      </div>

      {/* Existing Projects */}
      {signal.projects.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-slate-600">
            Matching Public Projects
          </p>

          <div className="mt-2 space-y-2">
            {signal.projects.map((project) => (
              <div
                key={project.project_id}
                className="rounded-lg border border-slate-100 bg-slate-50 p-3"
              >
                <p className="text-sm font-semibold text-slate-800">
                  {project.project_name}
                </p>

                <div className="mt-1 flex flex-wrap gap-2">
                  <span className="text-xs text-slate-500">
                    {project.status}
                  </span>

                  <span className="text-xs text-slate-500">
                    ₹{project.investment_crore} Cr
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Development Assessment Button */}
      <button
        onClick={getDevelopmentAssessment}
        disabled={
          loadingRecommendation ||
          !!recommendation
        }
        className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loadingRecommendation
          ? "🤖 Gemini is analyzing..."
          : recommendation
          ? "✓ Assessment Generated"
          : "🤖 Get AI Development Assessment"}
      </button>

      {/* AI Development Assessment */}
      {showRecommendation && (
        <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🤖</span>

            <h5 className="font-bold text-blue-900">
              AI Development Assessment
            </h5>
          </div>

          {loadingRecommendation && (
            <div className="mt-4">
              <div className="h-3 w-full animate-pulse rounded bg-blue-100" />
              <div className="mt-2 h-3 w-5/6 animate-pulse rounded bg-blue-100" />
              <div className="mt-2 h-3 w-4/6 animate-pulse rounded bg-blue-100" />
            </div>
          )}

          {recommendationError && (
            <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {recommendationError}
            </div>
          )}

          {recommendation && (
            <div className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-700">
              {recommendation}
            </div>
          )}

          <div className="mt-4 rounded-lg border border-blue-200 bg-white p-3 text-xs leading-5 text-slate-500">
            ⚠️ This AI assessment uses prototype citizen-request
            and public-project data. It is intended for exploratory
            development analysis and is not an official government
            assessment.
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div>
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-1 font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function MethodCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-sm text-slate-500">
        {title}
      </p>

      <p className="mt-1 text-xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}