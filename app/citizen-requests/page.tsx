"use client";

import { useEffect, useMemo, useState } from "react";
import Navigation from "../components/Navigation";

type CitizenRequest = {
  id?: string;
  language?: string;
  category?: string;
  issue?: string;
  urgency?: string;
  summary?: string;
  state?: string;
  district?: string;
  source?: string;
  createdAt?: string;
};

type CitizenRequestsResponse = {
  success: boolean;
  total_requests: number;
  high_critical: number;
  category_counts: Record<string, number>;
  requests: CitizenRequest[];
};

export default function CitizenRequestsPage() {
  const [data, setData] =
    useState<CitizenRequestsResponse | null>(null);

  const [loading, setLoading] = useState(true);

  const [selectedRequest, setSelectedRequest] =
    useState<CitizenRequest | null>(null);

  const [search, setSearch] = useState("");
  const [selectedState, setSelectedState] = useState("All");
  const [selectedDistrict, setSelectedDistrict] =
    useState("All");
  const [selectedCategory, setSelectedCategory] =
    useState("All");
  const [selectedUrgency, setSelectedUrgency] =
    useState("All");

  useEffect(() => {
    async function loadRequests() {
      try {
        const response = await fetch(
          "/api/citizen-requests"
        );

        const result = await response.json();

        if (result.success) {
          setData(result);
        }
      } catch (error) {
        console.error(
          "Failed to load citizen requests:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadRequests();
  }, []);

  const requests = data?.requests || [];

  const states = useMemo(() => {
    return Array.from(
      new Set(
        requests
          .map((request) => request.state)
          .filter(Boolean)
      )
    ).sort();
  }, [requests]);

  const districts = useMemo(() => {
    return Array.from(
      new Set(
        requests
          .filter(
            (request) =>
              selectedState === "All" ||
              request.state === selectedState
          )
          .map((request) => request.district)
          .filter(Boolean)
      )
    ).sort();
  }, [requests, selectedState]);

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        requests
          .map((request) => request.category)
          .filter(Boolean)
      )
    ).sort();
  }, [requests]);

  const urgencies = [
    "High",
    "Critical",
    "Medium",
    "Low",
  ];

  const filteredRequests = useMemo(() => {
    const query = search.toLowerCase().trim();

    return requests.filter((request) => {
      const searchMatch =
        !query ||
        [
          request.issue,
          request.summary,
          request.category,
          request.language,
          request.state,
          request.district,
        ]
          .filter(Boolean)
          .some((value) =>
            value!.toLowerCase().includes(query)
          );

      const stateMatch =
        selectedState === "All" ||
        request.state === selectedState;

      const districtMatch =
        selectedDistrict === "All" ||
        request.district === selectedDistrict;

      const categoryMatch =
        selectedCategory === "All" ||
        request.category === selectedCategory;

      const urgencyMatch =
        selectedUrgency === "All" ||
        request.urgency === selectedUrgency;

      return (
        searchMatch &&
        stateMatch &&
        districtMatch &&
        categoryMatch &&
        urgencyMatch
      );
    });
  }, [
    requests,
    search,
    selectedState,
    selectedDistrict,
    selectedCategory,
    selectedUrgency,
  ]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm text-slate-500">
            Loading citizen requests...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">

      <Navigation />

      {/* Header */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6">

          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
            Citizen Intelligence
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Citizen Request Explorer
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Explore citizen development requests analyzed
            through JanSankalp AI.
          </p>

        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6">

        {/* Summary */}
        <div className="grid gap-4 md:grid-cols-3">

          <div className="rounded-xl border bg-white p-5">
            <p className="text-xs text-slate-500">
              Total Requests
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {data?.total_requests.toLocaleString() || 0}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5">
            <p className="text-xs text-slate-500">
              High / Critical
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {data?.high_critical.toLocaleString() || 0}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5">
            <p className="text-xs text-slate-500">
              Showing
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {filteredRequests.length.toLocaleString()}
            </p>
          </div>

        </div>

        {/* Filters */}
        <div className="mt-6 rounded-xl border bg-white p-5">

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

{/* Search */}
<div className="lg:col-span-4">

  <label
    htmlFor="citizen-request-search"
    className="text-xs font-medium text-slate-600"
  >
    Search
  </label>

  <input
    id="citizen-request-search"
    name="search"
    type="text"
    value={search}
    onChange={(event) =>
      setSearch(event.target.value)
    }
    placeholder="Search issue, summary, category, district..."
    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
  />

</div>

            {/* State */}
            <div>
              <label className="text-xs font-medium text-slate-600">
                State
              </label>

              <select
                value={selectedState}
                onChange={(event) => {
                  setSelectedState(event.target.value);
                  setSelectedDistrict("All");
                }}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800"
              >
                <option value="All">
                  All States
                </option>

                {states.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>

            {/* District */}
            <div>
              <label className="text-xs font-medium text-slate-600">
                District
              </label>

              <select
                value={selectedDistrict}
                onChange={(event) =>
                  setSelectedDistrict(event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800"
              >
                <option value="All">
                  All Districts
                </option>

                {districts.map((district) => (
                  <option
                    key={district}
                    value={district}
                  >
                    {district}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-medium text-slate-600">
                Category
              </label>

              <select
                value={selectedCategory}
                onChange={(event) =>
                  setSelectedCategory(event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800"
              >
                <option value="All">
                  All Categories
                </option>

                {categories.map((category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Urgency */}
            <div>
              <label className="text-xs font-medium text-slate-600">
                Urgency
              </label>

              <select
                value={selectedUrgency}
                onChange={(event) =>
                  setSelectedUrgency(event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800"
              >
                <option value="All">
                  All Urgency
                </option>

                {urgencies.map((urgency) => (
                  <option
                    key={urgency}
                    value={urgency}
                  >
                    {urgency}
                  </option>
                ))}
              </select>
            </div>

          </div>

        </div>

        {/* Results */}
        <div className="mt-6">

          <div className="mb-3 flex items-center justify-between">

            <div>
              <p className="text-sm font-semibold text-slate-800">
                Citizen Requests
              </p>

              <p className="text-xs text-slate-500">
                {filteredRequests.length.toLocaleString()} matching requests
              </p>
            </div>

          </div>

          {filteredRequests.length === 0 ? (
            <div className="rounded-xl border bg-white p-8 text-center">
              <p className="font-semibold text-slate-800">
                No matching requests
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Try changing your search or filters.
              </p>
            </div>
          ) : (
            <div className="space-y-4">

              {filteredRequests.map(
                (request, index) => (
                  <div
                    key={
                      request.id ||
                      `${request.createdAt}-${index}`
                    }
                    className="rounded-xl border bg-white p-5"
                  >

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                      <div>

                        <div className="flex flex-wrap gap-2">

                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                            {request.language || "Unknown"}
                          </span>

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            {request.category || "Other"}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              request.urgency === "High" ||
                              request.urgency === "Critical"
                                ? "bg-red-50 text-red-700"
                                : request.urgency === "Medium"
                                ? "bg-orange-50 text-orange-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {request.urgency || "Unknown"}
                          </span>

                        </div>

                        <p className="mt-3 text-sm font-semibold text-slate-900">
                          {request.issue ||
                            "No issue description"}
                        </p>

                        {request.summary && (
                          <p className="mt-2 text-sm text-slate-600">
                            {request.summary}
                          </p>
                        )}

                      </div>

                      <div className="shrink-0 text-sm text-slate-500">

                        {request.district &&
                          request.state && (
                            <p className="font-medium text-slate-700">
                              {request.district},{" "}
                              {request.state}
                            </p>
                          )}

                        {request.createdAt && (
                          <p className="mt-1 text-xs">
                            {new Date(
                              request.createdAt
                            ).toLocaleString()}
                          </p>
                        )}

                      </div>

                    </div>

                    <div className="mt-4 border-t pt-3 text-xs text-slate-400">
                      Source:{" "}
                      {request.source ||
                        "Citizen Voice"}
                    </div>

                  </div>
                )
              )}

            </div>
          )}

        </div>

      </div>

      <footer className="border-t bg-white py-6 text-center text-xs text-slate-500">
        JanSankalp AI — Citizen Request Explorer
      </footer>

    </main>
  );
}