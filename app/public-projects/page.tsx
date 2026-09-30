"use client";

import { useEffect, useMemo, useState } from "react";
import Navigation from "../components/Navigation";

type PublicProject = {
  project_id?: string;
  state?: string;
  district?: string;
  category?: string;
  project_name?: string;
  investment_crore?: number;
  status?: string;
};

export default function PublicProjectsPage() {
  const [projects, setProjects] = useState<PublicProject[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [selectedState, setSelectedState] = useState("All");
  const [selectedDistrict, setSelectedDistrict] =
    useState("All");
  const [selectedCategory, setSelectedCategory] =
    useState("All");
  const [selectedStatus, setSelectedStatus] =
    useState("All");

  useEffect(() => {
    async function loadProjects() {
      try {
        const response = await fetch(
  "/api/public-projects"
);

       const result = await response.json();

setProjects(
  result.success && Array.isArray(result.projects)
    ? result.projects
    : []
);
      } catch (error) {
        console.error(
          "Failed to load public projects:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, []);

  const states = useMemo(() => {
    return Array.from(
      new Set(
        projects
          .map((project) => project.state)
          .filter(Boolean)
      )
    ).sort();
  }, [projects]);

  const districts = useMemo(() => {
    return Array.from(
      new Set(
        projects
          .filter(
            (project) =>
              selectedState === "All" ||
              project.state === selectedState
          )
          .map((project) => project.district)
          .filter(Boolean)
      )
    ).sort();
  }, [projects, selectedState]);

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        projects
          .map((project) => project.category)
          .filter(Boolean)
      )
    ).sort();
  }, [projects]);

  const statuses = useMemo(() => {
    return Array.from(
      new Set(
        projects
          .map((project) => project.status)
          .filter(Boolean)
      )
    ).sort();
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const query = search.toLowerCase().trim();

    return projects.filter((project) => {
      const searchMatch =
        !query ||
        [
          project.project_name,
          project.category,
          project.state,
          project.district,
          project.status,
        ]
          .filter(Boolean)
          .some((value) =>
            value!.toLowerCase().includes(query)
          );

      const stateMatch =
        selectedState === "All" ||
        project.state === selectedState;

      const districtMatch =
        selectedDistrict === "All" ||
        project.district === selectedDistrict;

      const categoryMatch =
        selectedCategory === "All" ||
        project.category === selectedCategory;

      const statusMatch =
        selectedStatus === "All" ||
        project.status === selectedStatus;

      return (
        searchMatch &&
        stateMatch &&
        districtMatch &&
        categoryMatch &&
        statusMatch
      );
    });
  }, [
    projects,
    search,
    selectedState,
    selectedDistrict,
    selectedCategory,
    selectedStatus,
  ]);

  const totalInvestment = useMemo(() => {
    return filteredProjects.reduce(
      (total, project) =>
        total +
        (Number(project.investment_crore) || 0),
      0
    );
  }, [filteredProjects]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm text-slate-500">
            Loading public projects...
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
            Public Development Intelligence
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Public Project Explorer
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Explore public development projects in the
            JanSankalp AI prototype dataset.
          </p>

        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6">

        {/* Summary */}
        <div className="grid gap-4 md:grid-cols-3">

          <div className="rounded-xl border bg-white p-5">
            <p className="text-xs text-slate-500">
              Projects
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {filteredProjects.length.toLocaleString()}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5">
            <p className="text-xs text-slate-500">
              Investment
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              ₹{totalInvestment.toLocaleString()} Cr
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5">
            <p className="text-xs text-slate-500">
              Locations
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {
                new Set(
                  filteredProjects.map(
                    (project) =>
                      `${project.state}-${project.district}`
                  )
                ).size
              }
            </p>
          </div>

        </div>

        {/* Filters */}
        <div className="mt-6 rounded-xl border bg-white p-5">

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

            <div className="lg:col-span-4">
              <label
  htmlFor="public-project-search"
  className="text-xs font-medium text-slate-600"
>
  Search Projects
</label>

<input
  id="public-project-search"
  name="search"
  type="text"
  value={search}
  onChange={(event) =>
    setSearch(event.target.value)
  }
  placeholder="Search project, category, district..."
  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
/>
            </div>

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
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
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

            <div>
              <label className="text-xs font-medium text-slate-600">
                District
              </label>

              <select
                value={selectedDistrict}
                onChange={(event) =>
                  setSelectedDistrict(event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
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

            <div>
              <label className="text-xs font-medium text-slate-600">
                Category
              </label>

              <select
                value={selectedCategory}
                onChange={(event) =>
                  setSelectedCategory(event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
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

            <div>
              <label className="text-xs font-medium text-slate-600">
                Status
              </label>

              <select
                value={selectedStatus}
                onChange={(event) =>
                  setSelectedStatus(event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
              >
                <option value="All">
                  All Statuses
                </option>

                {statuses.map((status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {status}
                  </option>
                ))}
              </select>
            </div>

          </div>

        </div>

        {/* Projects */}
        <div className="mt-6">

          <div className="mb-3">
            <p className="text-sm font-semibold text-slate-800">
              Public Projects
            </p>

            <p className="text-xs text-slate-500">
              {filteredProjects.length.toLocaleString()} matching projects
            </p>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="rounded-xl border bg-white p-8 text-center">
              <p className="font-semibold text-slate-800">
                No matching projects
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Try changing your filters.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">

              {filteredProjects.map(
                (project, index) => (
                  <div
                    key={
                      project.project_id ||
                      `${project.project_name}-${index}`
                    }
                    className="rounded-xl border bg-white p-5"
                  >

                    <div className="flex items-start justify-between gap-4">

                      <div>

                        <p className="text-lg font-bold text-slate-900">
                          {project.project_name ||
                            "Unnamed Project"}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {project.district},{" "}
                          {project.state}
                        </p>

                      </div>

                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        {project.status ||
                          "Unknown"}
                      </span>

                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">

                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">
                          Category
                        </p>

                        <p className="mt-1 font-semibold text-slate-900">
                          {project.category ||
                            "Other"}
                        </p>
                      </div>

                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">
                          Investment
                        </p>

                        <p className="mt-1 font-semibold text-slate-900">
                          ₹
                          {Number(
                            project.investment_crore
                          ).toLocaleString()}{" "}
                          Cr
                        </p>
                      </div>

                    </div>

                    {project.project_id && (
                      <div className="mt-4 border-t pt-3 text-xs text-slate-400">
                        Project ID:{" "}
                        {project.project_id}
                      </div>
                    )}

                  </div>
                )
              )}

            </div>
          )}

        </div>

      </div>

      <footer className="border-t bg-white py-6 text-center text-xs text-slate-500">
        JanSankalp AI — Public Project Explorer
      </footer>

    </main>
  );
}