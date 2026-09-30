"use client";

import Link from "next/link";
import Navigation from "./components/Navigation";
import { useEffect, useState } from "react";

export default function HomePage() {

  const [stats, setStats] = useState({
    citizenRequests: 0,
    highCritical: 0,
    prioritySignals: 0,
    publicProjects: 0,
    investment: 0,
  });

    useEffect(() => {
    async function loadStats() {
      try {
        const [citizenResponse, projectResponse] =
          await Promise.all([
            fetch("/api/citizen-requests"),
            fetch("/api/public-projects"),
          ]);

        const citizenData = await citizenResponse.json();
        const projectData = await projectResponse.json();

        const projects = Array.isArray(projectData.projects)
          ? projectData.projects
          : [];

        const investment = projects.reduce(
          (total: number, project: any) =>
            total +
            (Number(project.investment_crore) || 0),
          0
        );

        setStats({
          citizenRequests:
            citizenData.total_requests || 0,

          highCritical:
            citizenData.high_critical || 0,

          prioritySignals:
            citizenData.priority_signals?.length || 0,

          publicProjects:
            projects.length,

          investment,
        });
      } catch (error) {
        console.error(
          "Failed to load homepage statistics:",
          error
        );
      }
    }

    loadStats();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50">
      <Navigation />


      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 py-20">

        <div className="max-w-3xl">

          <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
            AI for Digital Public Infrastructure & Governance
          </p>

          <h2 className="mt-4 max-w-3xl text-4xl font-bold leading-tight text-slate-900 md:text-5xl lg:text-6xl">
            Turning citizen voices into
            <span className="text-blue-600">
              {" "}development intelligence.
            </span>
          </h2>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
            JanSankalp AI analyses citizen development requests,
            infrastructure indicators and public investment data
            to help identify development signals across Indian
            communities.
          </p>


          {/* Buttons */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">

            <Link
              href="/dashboard"
              className="rounded-xl bg-blue-600 px-6 py-3 text-center font-semibold text-white transition hover:bg-blue-700"
            >
              Explore Dashboard →
            </Link>

            <a
              href="#how-it-works"
              className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-center font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              How It Works
            </a>

          </div>

        </div>

      </section>

      {/* Live Platform Statistics */}
      <section className="mx-auto max-w-7xl px-6 pb-16">

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

          <StatCard
            label="Citizen Requests"
            value={stats.citizenRequests.toLocaleString()}
          />

          <StatCard
            label="High / Critical"
            value={stats.highCritical.toLocaleString()}
          />

          <StatCard
            label="Priority Signals"
            value={stats.prioritySignals.toLocaleString()}
          />

          <StatCard
            label="Public Projects"
            value={stats.publicProjects.toLocaleString()}
          />

          <StatCard
            label="Investment"
            value={`₹${stats.investment.toLocaleString()} Cr`}
          />

        </div>

      </section>


      {/* Core flow */}
      <section
        id="how-it-works"
        className="border-y bg-white"
      >

        <div className="mx-auto max-w-7xl px-6 py-16">

          <div className="max-w-2xl">

            <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
              Platform Flow
            </p>

            <h3 className="mt-2 text-3xl font-bold text-slate-900">
              From citizen voice to development signals
            </h3>

            <p className="mt-3 text-slate-600">
              A prototype workflow combining citizen feedback,
              structured development data and Google Gemini AI.
            </p>

          </div>


          <div className="mt-10 grid gap-5 md:grid-cols-4">

            <FeatureCard
              number="01"
              title="Citizen Voice"
              description="Collect development requests through text and multilingual inputs."
            />

            <FeatureCard
              number="02"
              title="AI Analysis"
              description="Gemini analyses the request and identifies language, category, issue and urgency."
            />

            <FeatureCard
              number="03"
              title="Development Signals"
              description="Combine citizen demand with infrastructure and population indicators."
            />

            <FeatureCard
              number="04"
              title="AI Assessment"
              description="Generate an explainable prototype assessment for further human review."
            />

          </div>

        </div>

      </section>


      {/* India scale */}
      <section className="mx-auto max-w-7xl px-6 py-16">

        <div className="grid gap-6 md:grid-cols-3">

          <InfoCard
            title="Multilingual"
            description="Designed for citizen inputs across India's diverse linguistic regions."
          />

          <InfoCard
            title="Data-driven"
            description="Combines citizen requests with infrastructure, population and investment indicators."
          />

          <InfoCard
            title="Human-in-the-loop"
            description="AI outputs are presented as prototype assessments, not automatic government decisions."
          />

        </div>

      </section>


      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 pb-20">

        <div className="rounded-3xl bg-blue-600 p-8 text-white md:p-12">

          <p className="text-sm font-semibold uppercase tracking-wider text-blue-100">
            JanSankalp AI
          </p>

          <h3 className="mt-3 text-3xl font-bold md:text-4xl">
            Explore India's development signals
          </h3>

          <p className="mt-4 max-w-2xl leading-7 text-blue-100">
            Explore the prototype dashboard and see how citizen
            demand can be connected with development indicators.
          </p>

          <Link
            href="/dashboard"
            className="mt-7 inline-block rounded-xl bg-white px-6 py-3 font-semibold text-blue-700 transition hover:bg-blue-50"
          >
            Open Dashboard →
          </Link>

        </div>

      </section>


      {/* Footer */}
      <footer className="border-t bg-white py-6 text-center text-sm text-slate-500">
        JanSankalp AI — AI-assisted development intelligence for India 🇮🇳
      </footer>

    </main>
  );
}



function FeatureCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border bg-slate-50 p-6">

      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
        {number}
      </div>

      <h4 className="mt-5 text-lg font-bold text-slate-900">
        {title}
      </h4>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        {description}
      </p>

    </div>
  );
}


function InfoCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">

      <h4 className="text-lg font-bold text-slate-900">
        {title}
      </h4>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        {description}
      </p>

    </div>
  );
}


function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">

      <p className="text-xs font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-blue-600">
        Live prototype data
      </p>

    </div>
  );
}
