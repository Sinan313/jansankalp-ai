"use client";

import { useState } from "react";
import Navigation from "../components/Navigation";

type Analysis = {
  language: string;
  category: string;
  issue: string;
  urgency: string;
  summary: string;
};

export default function CitizenPage() {
  const [request, setRequest] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function analyzeRequest() {
  if (!request.trim()) {
    setError("Please enter your community request.");
    return;
  }

  setLoading(true);
  setError("");
  setAnalysis(null);

  try {
    // Step 1: Analyze the citizen request with Gemini
    const response = await fetch("/api/analyze-request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: request,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        result.error || "Unable to analyze the request."
      );
    }

    const aiAnalysis = result.analysis;

    // Show the AI analysis immediately
    setAnalysis(aiAnalysis);

    // Step 2: Save the analyzed request
    const saveResponse = await fetch("/api/save-request", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    ...aiAnalysis,
    state,
    district,
  }),
});

    const saveResult = await saveResponse.json();

    if (!saveResponse.ok || !saveResult.success) {
      console.error(
        "Request analysis succeeded, but saving failed:",
        saveResult.error
      );
    }
  } catch (error) {
    setError(
      error instanceof Error
        ? error.message
        : "AI analysis failed."
    );
  } finally {
    setLoading(false);
  }
}

  return (
    <main className="min-h-screen bg-slate-50">

    <Navigation />


      {/* Main */}
      <div className="mx-auto max-w-4xl px-6 py-12">

        {/* Introduction */}
        <div className="text-center">

          <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
            Citizen Voice
          </p>

          <h2 className="mt-3 text-4xl font-bold text-slate-900">
            Tell us what your community needs
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-slate-600">
            Share a development issue in your own language.
            JanSankalp AI uses Google Gemini to understand
            and classify the request.
          </p>

        </div>


        {/* Request box */}
        <section className="mt-10 rounded-2xl border bg-white p-6 shadow-sm">

          <label className="text-sm font-semibold text-slate-700">
            Community request
          </label>

          {/* Location */}
<div className="mt-6 grid gap-4 sm:grid-cols-2">

  {/* State */}
  <div>
    <label className="text-sm font-semibold text-slate-700">
      State
    </label>

    <select
      value={state}
      onChange={(e) => {
        setState(e.target.value);
        setDistrict("");
      }}
      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
    >
      <option value="">Select state</option>
      <option value="Andhra Pradesh">Andhra Pradesh</option>
      <option value="Arunachal Pradesh">Arunachal Pradesh</option>
      <option value="Assam">Assam</option>
      <option value="Bihar">Bihar</option>
      <option value="Chhattisgarh">Chhattisgarh</option>
      <option value="Goa">Goa</option>
      <option value="Gujarat">Gujarat</option>
      <option value="Haryana">Haryana</option>
      <option value="Himachal Pradesh">Himachal Pradesh</option>
      <option value="Jharkhand">Jharkhand</option>
      <option value="Karnataka">Karnataka</option>
      <option value="Kerala">Kerala</option>
      <option value="Madhya Pradesh">Madhya Pradesh</option>
      <option value="Maharashtra">Maharashtra</option>
      <option value="Manipur">Manipur</option>
      <option value="Meghalaya">Meghalaya</option>
      <option value="Mizoram">Mizoram</option>
      <option value="Nagaland">Nagaland</option>
      <option value="Odisha">Odisha</option>
      <option value="Punjab">Punjab</option>
      <option value="Rajasthan">Rajasthan</option>
      <option value="Sikkim">Sikkim</option>
      <option value="Tamil Nadu">Tamil Nadu</option>
      <option value="Telangana">Telangana</option>
      <option value="Tripura">Tripura</option>
      <option value="Uttar Pradesh">Uttar Pradesh</option>
      <option value="Uttarakhand">Uttarakhand</option>
      <option value="West Bengal">West Bengal</option>
      <option value="Delhi">Delhi</option>
      <option value="Jammu and Kashmir">Jammu and Kashmir</option>
      <option value="Ladakh">Ladakh</option>
    </select>
  </div>

  {/* District */}
  <div>
    <label className="text-sm font-semibold text-slate-700">
      District
    </label>

    <input
  id="district-input"
  name="district"
  type="text"
  value={district}
  onChange={(e) => setDistrict(e.target.value)}
  placeholder={
    state
      ? `Enter district in ${state}`
      : "Select state first"
  }
  disabled={!state}
  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
/>
  </div>

</div>

<textarea
  id="community-request"
  name="request"
  value={request}
  onChange={(e) => setRequest(e.target.value)}
  placeholder="Example: Our village does not have proper drinking water..."
  rows={7}
  className="mt-3 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
/>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <p className="text-xs text-slate-500">
              Supports English and Indian languages
            </p>

            <button
              onClick={analyzeRequest}
              disabled={loading}
              className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "🤖 Gemini is analyzing..."
                : "Analyze Request"}
            </button>

          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

        </section>


        {/* AI Analysis */}
        {analysis && (
          <section className="mt-8">

            <div className="mb-4">

              <h3 className="text-xl font-bold text-slate-900">
                AI Analysis
              </h3>

              <p className="text-sm text-slate-500">
                Analysed using Google Gemini
              </p>

            </div>


            <div className="grid gap-4 sm:grid-cols-2">

              <AnalysisCard
                title="Language"
                value={analysis.language}
              />

              <AnalysisCard
                title="Category"
                value={analysis.category}
              />

              <AnalysisCard
                title="Issue"
                value={analysis.issue}
              />

              <AnalysisCard
                title="Urgency"
                value={analysis.urgency}
              />

            </div>


            {/* Summary */}
            <div className="mt-4 rounded-2xl border bg-white p-6 shadow-sm">

              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                AI Summary
              </p>

              <p className="mt-3 text-sm leading-7 text-slate-700">
                {analysis.summary}
              </p>

            </div>


            {/* Disclaimer */}
            <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs leading-5 text-blue-800">
              ⚠️ AI-assisted prototype analysis. This
              classification supports development planning and
              should not be treated as an automatic government
              decision.
            </div>

          </section>
        )}

      </div>


      {/* Footer */}
      <footer className="border-t bg-white py-6 text-center text-sm text-slate-500">
        JanSankalp AI — Built for India 🇮🇳
      </footer>

    </main>
  );
}


function AnalysisCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">

      <p className="text-xs font-medium text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-base font-bold text-slate-900">
        {value}
      </p>

    </div>
  );
}