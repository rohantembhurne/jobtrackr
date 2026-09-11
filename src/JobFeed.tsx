import { useEffect, useState } from "react"
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
  const title = (job.title || "").toLowerCase()

  const description = (job.description || "")
    .toLowerCase()
    .replace(/[–—−]/g, "-")
    .replace(/\s+/g, " ")

  const text = `${title} ${description}`

  const seniorPatterns = [
    /\bsenior\b/i,
    /\bsr\.?\b/i,
    /\blead\b/i,
    /\bprincipal\b/i,
    /\barchitect\b/i,
    /\bmanager\b/i,
    /\bdirector\b/i,
    /\bhead\s+of\b/i,
    /\bstaff\b/i,
    /\bmid[- ]level\b/i,
    /\bmid[- ]to[- ]senior\b/i,
    /\bmid\s+to\s+senior\b/i,
    /\bexperienced\b/i,
    /\bstrong\s+experience\b/i,
    /\bsound\s+experience\b/i,
    /\bextensive\s+experience\b/i,
    /\bproven\s+experience\b/i,
    /\bsde\s*[2-9]\b/i,
    /\bsde[- ]*[2-9]\b/i,
  ]

  if (seniorPatterns.some((pattern) => pattern.test(text))) {
    return false
  }

  const experiencePatterns = [
    /\b([2-9]|[1-9]\d+)\s*\+\s*(?:years?|yrs?)\b/i,
    /\b([2-9]|[1-9]\d*)\s*(?:years?|yrs?)\s+of\s+experience\b/i,
    /\bminimum\s+(?:of\s+)?([2-9]|[1-9]\d*)\s*(?:years?|yrs?)\b/i,
    /\bat\s+least\s+([2-9]|[1-9]\d*)\s*(?:years?|yrs?)\b/i,
    /\brequires?\s+([2-9]|[1-9]\d*)\s*(?:years?|yrs?)\b/i,
    /\brequired\s+([2-9]|[1-9]\d*)\s*(?:years?|yrs?)\b/i,
  ]

  if (experiencePatterns.some((pattern) => pattern.test(text))) {
    return false
  }

  const oneYearPatterns = [
    /\b1\s*\+\s*(?:years?|yrs?)\b/i,
    /\b1\s*(?:year|yr)\s+of\s+experience\b/i,
    /\bat\s+least\s+a\s+year\b/i,
    /\bat\s+least\s+one\s+year\b/i,
    /\bminimum\s+(?:of\s+)?a\s+year\b/i,
    /\bminimum\s+(?:of\s+)?one\s+year\b/i,
    /\bminimum\s+1\s+(?:year|yr)\b/i,
    /\brequires?\s+1\s+(?:year|yr)\b/i,
    /\brequired\s+1\s+(?:year|yr)\b/i,
  ]

  if (oneYearPatterns.some((pattern) => pattern.test(text))) {
    return false
  }

  const fresherPatterns = [
    /\bfresher\b/i,
    /\bfreshers\b/i,
    /\bentry[- ]level\b/i,
    /\b0\s*-\s*1\s*(?:years?|yrs?)\b/i,
    /\b0\s*to\s*1\s*(?:years?|yrs?)\b/i,
    /\b0\s*-\s*2\s*(?:years?|yrs?)\b/i,
    /\b0\s*to\s*2\s*(?:years?|yrs?)\b/i,
    /\bno\s+experience\b/i,
    /\bwithout\s+experience\b/i,
  ]

  if (fresherPatterns.some((pattern) => pattern.test(text))) {
    return true
  }

  if (
    /\bjunior\b/i.test(title) ||
    /\btrainee\b/i.test(title) ||
    /\bintern\b/i.test(title) ||
    /\binternship\b/i.test(title)
  ) {
    return true
  }

  return true
}

function JobFeed() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [searchTerm, setSearchTerm] = useState("React Developer")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [savingId, setSavingId] = useState<string | number | null>(null)

  const searchJobs = async (term = searchTerm) => {
    setLoading(true)
    setError("")
    setJobs([])

    try {
      const params = new URLSearchParams({
        what: term.trim() || "Software Developer",
        where: "India",
      })

      const response = await fetch("/api/jobs?" + params.toString())

      if (!response.ok) {
        throw new Error("Job API request failed: " + response.status)
      }

      const data: AdzunaResponse = await response.json()

      const fresherJobs = (data.results || []).filter(isFresherFriendly)

      setJobs(fresherJobs)
    } catch (err) {
      console.error(err)

      setError(
        err instanceof Error ? err.message : "Failed to load jobs."
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void searchJobs("React Developer")
  }, [])

  const saveJob = async (job: Job) => {
    if (!auth.currentUser) {
      setError("Please login first.")
      return
    }

    setSavingId(job.id)

    try {
      await addDoc(collection(db, "applications"), {
        userId: auth.currentUser.uid,
        companyName: job.company?.display_name || "Unknown Company",
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
          onClick={() => void searchJobs()}
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
                  onClick={() => void saveJob(job)}
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

        {loading && (
          <div className="rounded-xl border border-slate-200 p-8 text-center text-slate-500">
            Loading fresher jobs...
          </div>
        )}

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