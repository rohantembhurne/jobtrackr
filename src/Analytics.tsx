import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

type AnalyticsApplication = {
  status: string
}

type AnalyticsProps = {
  applications: AnalyticsApplication[]
}

function Analytics({ applications }: AnalyticsProps) {
  const total = applications.length

  const applied = applications.filter(
    (app) => app.status === "Applied"
  ).length

  const interviews = applications.filter(
    (app) => app.status === "Interview"
  ).length

  const offers = applications.filter(
    (app) => app.status === "Offer"
  ).length

  const rejected = applications.filter(
    (app) => app.status === "Rejected"
  ).length

  const responded = interviews + offers + rejected

  const responseRate =
    total > 0 ? Math.round((responded / total) * 100) : 0

  const offerRate =
    total > 0 ? Math.round((offers / total) * 100) : 0

  const chartData = [
    { name: "Applied", applications: applied },
    { name: "Interview", applications: interviews },
    { name: "Offer", applications: offers },
    { name: "Rejected", applications: rejected },
  ]

  return (
    <section className="mt-8 rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">
          Analytics
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Track your application progress and hiring outcomes.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
          <p className="text-sm text-slate-400">
            Total Applications
          </p>

          <p className="mt-2 text-3xl font-bold text-white">
            {total}
          </p>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
          <p className="text-sm text-slate-400">
            Response Rate
          </p>

          <p className="mt-2 text-3xl font-bold text-white">
            {responseRate}%
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Interview + Offer + Rejected
          </p>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
          <p className="text-sm text-slate-400">
            Offer Rate
          </p>

          <p className="mt-2 text-3xl font-bold text-white">
            {offerRate}%
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
        <h3 className="mb-4 text-lg font-semibold text-white">
          Application Status
        </h3>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis
                dataKey="name"
                tick={{ fill: "#94a3b8" }}
              />

              <YAxis
                allowDecimals={false}
                tick={{ fill: "#94a3b8" }}
              />

              <Tooltip />

              <Bar
                dataKey="applications"
                name="Applications"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  )
}

export default Analytics