import { useState } from "react"
import { addDoc, collection } from "firebase/firestore"
import { auth, db } from "./firebase"

type Job = {
  id: string | number
  title: string
  description?: string
  redirect_url: string
  company?: {
    display_name?: string
  }
  location?: {
    display_name?: string
  }
  salary_min?: number
  salary_max?: number
}

type AdzunaResponse = {
  results?: Job[]
}

function isFresherFriendly(job: Job) {
  const title = job.title.toLowerCase()

  const description = (job.description || "")
    .toLowerCase()
    .replace(/[–—−]/g, "-")
    .replace(/\s+/g, " ")

  const text = `${title} ${description}`

  // Reject clear 2+ year experience requirements
  const experiencedPatterns = [
    /\b2\s*-\s*3\s*years?\b/i,
    /\b2\s*to\s*3\s*years?\b/i,
    /\b2\s*-\s*4\s*years?\b/i,
    /\b2\s*to\s*4\s*years?\b/i,
    /\b3\s*-\s*5\s*years?\b/i,
    /\b3\s*to\s*5\s*years?\b/i,
    /\b4\s*-\s*6\s*years?\b/i,
    /\b4\s*to\s*6\s*years?\b/i,
    /\b5\s*-\s*10\s*years?\b/i,
    /\b5\s*to\s*10\s*years?\b/i,
    /\b6\s*-\s*10\s*years?\b/i,
    /\b6\s*to\s*10\s*years?\b/i,
    /\b7\s*-\s*10\s*years?\b/i,
    /\b7\s*to\s*10\s*years?\b/i,
    /\b8\s*-\s*15\s*years?\b/i,

    /\b[2-9]\+?\s*years?\s*(?:of\s*)?experience\b/i,
    /\b(?:minimum|at least)\s*[2-9]\+?\s*years?\b/i,
    /\brequires?\s*[2-9]\+?\s*years?\b/i,
    /\brequired\s*[2-9]\+?\s*years?\b/i,
  ]

  if (experiencedPatterns.some((pattern) => pattern.test(text))) {
    return false
  }

  // Reject clearly experienced job titles
  const experiencedTitles = [
    /\bsenior\b/i,
    /\blead\b/i,
    /\bprincipal\b/i,
    /\barchitect\b/i,
    /\bmanager\b/i,
  ]

  if (experiencedTitles.some((pattern) => pattern.test(title))) {
    return false
  }

  // Accept strong fresher signals
  const fresherPatterns = [
    /\bfresher\b/i,
    /\bfreshers\b/i,
    /\bentry[- ]level\b/i,
    /\b0\s*-\s*1\s*years?\b/i,
    /\b0\s*to\s*1\s*years?\b/i,
    /\b0\s*-\s*2\s*years?\b/i,
    /\b0\s*to\s*2\s*years?\b/i,
    /\b1\s*-\s*2\s*years?\b/i,
    /\b1\s*to\s*2\s*years?\b/i,
  ]

  if (fresherPatterns.some((pattern) => pattern.test(text))) {
    return true
  }

  // Junior / trainee / intern only when in the title
  if (
    /\bjunior\b/i.test(title) ||
    /\btrainee\b/i.test(title) ||
    /\bintern\b/i.test(title) ||
    /\binternship\b/i.test(title)
  ) {
    return true
  }

  return false
}

function JobFeed() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [searchTerm, setSearchTerm] = useState("React Developer")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [savingId, setSavingId] = useState<string | number | null>(null)

  const searchJobs = async () => {
    setLoading(true)
    setError("")
    setJobs([])

    try {
      const params = new URLSearchParams({
        what: searchTerm.trim() || "Software Developer",
        where: "India",
      })

      const response = await fetch(
        "/api/jobs?" + params.toString()
      )

      if (!response.ok) {
        throw new Error(
          "Job API request failed: " + response.status
        )
      }

      const data: AdzunaResponse = await response.json()

      const fresherJobs = (data.results || []).filter(
        isFresherFriendly
      )

      setJobs(fresherJobs)
    } catch (err) {
      console.error(err)

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load jobs."
      )
    } finally {
      setLoading(false)
    }
  }

  const saveJob = async (job: Job) => {
    if (!auth.currentUser) {
      setError("Please login first.")
      return
    }

    setSavingId(job.id)

    try {
      await addDoc(collection(db, "applications"), {
        userId: auth.currentUser.uid,
        companyName:
          job.company?.display_name || "Unknown Company",
        role: job.title,
        status: "Applied",
        appliedDate: new Date().toISOString().split("T")[0],
        notes: job.description || "",
        link: job.redirect_url,
      })

      alert("Job saved successfully!")
    } catch (err) {
      console.error(err)
      setError("Failed to save job.")
    } finally {
      setSavingId(null)
    }
  }

  return (
    <section className="mt-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          Fresher Job Feed
        </h2>

        <p className="mt-1 text-sm text-slate-600">
          Search real job listings and see fresher-friendly opportunities.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search jobs..."
          className="flex-1 rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
        />

        <button
          onClick={searchJobs}
          disabled={loading}
          className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Searching..." : "Search Fresher Jobs"}
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6 space-y-4">
        {jobs.map((job) => (
          <article
            key={job.id}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <div className="mb-2 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                  Fresher Friendly
                </div>

                <h3 className="text-lg font-bold text-slate-900">
                  {job.title}
                </h3>

                <p className="mt-1 font-medium text-slate-700">
                  {job.company?.display_name || "Unknown Company"}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {job.location?.display_name || "India"}
                </p>

                {(job.salary_min || job.salary_max) && (
                  <p className="mt-2 text-sm font-medium text-green-700">
                    {job.salary_min
                      ? "Rs. " + job.salary_min.toLocaleString()
                      : ""}
                    {job.salary_min && job.salary_max ? " - " : ""}
                    {job.salary_max
                      ? "Rs. " + job.salary_max.toLocaleString()
                      : ""}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <a
                  href={job.redirect_url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  View Job
                </a>

                <button
                  onClick={() => saveJob(job)}
                  disabled={savingId === job.id}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {savingId === job.id ? "Saving..." : "Save Job"}
                </button>
              </div>
            </div>

            {job.description && (
              <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">
                {job.description}
              </p>
            )}
          </article>
        ))}

        {!loading && jobs.length === 0 && !error && (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
            No fresher-friendly jobs found. Try another search.
          </div>
        )}
      </div>
    </section>
  )
}

export default JobFeed