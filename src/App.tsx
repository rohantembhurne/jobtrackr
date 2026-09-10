import { useEffect, useState } from "react"
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth"
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
  type Timestamp,
} from "firebase/firestore"
import {
  DndContext,
  closestCenter,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { auth, db, googleProvider } from "./firebase"
import JobFeed from "./JobFeed"

type Application = {
  id: string
  companyName: string
  role: string
  status: string
  appDate: Timestamp | null
  notes: string
  url: string
}

const statuses = [
  "Applied",
  "Interview",
  "Offer",
  "Rejected",
]

function KanbanColumn({
  status,
  applications,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  status: string
  applications: Application[]
  onEdit: (app: Application) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  })

  return (
    <div
      ref={setNodeRef}
      className={
        isOver
          ? "min-h-72 rounded-xl border border-blue-500 bg-blue-950/30 p-4"
          : "min-h-72 rounded-xl border border-slate-800 bg-slate-900 p-4"
      }
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">{status}</h3>

        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
          {applications.length}
        </span>
      </div>

      <div className="space-y-3">
        {applications.map((app) => (
          <KanbanCard
            key={app.id}
            app={app}
            onEdit={onEdit}
            onDelete={onDelete}
            onStatusChange={onStatusChange}
          />
        ))}

        {applications.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-500">
            No applications
          </p>
        )}
      </div>
    </div>
  )
}

function KanbanCard({
  app,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  app: Application
  onEdit: (app: Application) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: app.id,
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    touchAction: "none",
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="rounded-lg border border-slate-700 bg-slate-950 p-4"
    >
      <h4 className="font-semibold">
        {app.role}
      </h4>

      <p className="mt-1 text-sm text-slate-400">
        {app.companyName}
      </p>

      {app.notes && (
        <p className="mt-3 text-sm text-slate-500">
          {app.notes}
        </p>
      )}

      <select
        value={app.status}
        onChange={(e) =>
          onStatusChange(
            app.id,
            e.target.value
          )
        }
        onPointerDown={(e) =>
          e.stopPropagation()
        }
        className="mt-3 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs"
      >
        {statuses.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>

      <div className="mt-3 flex gap-2">
        <button
          onClick={() => onEdit(app)}
          onPointerDown={(e) =>
            e.stopPropagation()
          }
          className="flex-1 rounded-lg bg-yellow-600 px-3 py-2 text-xs font-semibold hover:bg-yellow-700"
        >
          Edit
        </button>

        <button
          onClick={() => onDelete(app.id)}
          onPointerDown={(e) =>
            e.stopPropagation()
          }
          className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold hover:bg-red-700"
        >
          Delete
        </button>
      </div>

      {app.url && (
        <a
          href={app.url}
          target="_blank"
          rel="noreferrer"
          onPointerDown={(e) =>
            e.stopPropagation()
          }
          className="mt-3 inline-block text-xs text-blue-400 hover:underline"
        >
          View Job
        </a>
      )}
    </div>
  )
}

function App() {
  const [user, setUser] =
    useState<User | null>(null)

  const [applications, setApplications] =
    useState<Application[]>([])

  const [companyName, setCompanyName] =
    useState("")

  const [role, setRole] =
    useState("")

  const [status, setStatus] =
    useState("Applied")

  const [notes, setNotes] =
    useState("")

  const [url, setUrl] =
    useState("")

  const [showForm, setShowForm] =
    useState(false)

  const [editingId, setEditingId] =
    useState<string | null>(null)

  const [searchTerm, setSearchTerm] =
    useState("")

  const [statusFilter, setStatusFilter] =
    useState("All")

  // Authentication state
  const [email, setEmail] =
    useState("")

  const [password, setPassword] =
    useState("")

  const [authMode, setAuthMode] =
    useState<"login" | "signup">("login")

  const [authError, setAuthError] =
    useState("")

  const [authLoading, setAuthLoading] =
    useState(false)

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        (currentUser) => {
          setUser(currentUser)
        }
      )

    return unsubscribe
  }, [])

  useEffect(() => {
    if (!user) {
      setApplications([])
      return
    }

    const applicationsQuery =
      query(
        collection(db, "applications"),
        where(
          "userId",
          "==",
          user.uid
        )
      )

    const unsubscribe =
      onSnapshot(
        applicationsQuery,
        (snapshot) => {
          const data =
            snapshot.docs.map(
              (document) => ({
                id: document.id,
                ...document.data(),
              })
            ) as Application[]

          setApplications(data)
        }
      )

    return unsubscribe
  }, [user])

  const handleEmailAuth =
    async () => {
      if (!email.trim() || !password.trim()) {
        setAuthError(
          "Please enter email and password."
        )
        return
      }

      if (password.length < 6) {
        setAuthError(
          "Password must be at least 6 characters."
        )
        return
      }

      setAuthLoading(true)
      setAuthError("")

      try {
        if (authMode === "login") {
          await signInWithEmailAndPassword(
            auth,
            email,
            password
          )
        } else {
          await createUserWithEmailAndPassword(
            auth,
            email,
            password
          )
        }

        setEmail("")
        setPassword("")
      } catch (error) {
        console.error(error)

        const firebaseError =
          error as {
            code?: string
          }

        switch (firebaseError.code) {
          case "auth/invalid-credential":
            setAuthError(
              "Invalid email or password."
            )
            break

          case "auth/email-already-in-use":
            setAuthError(
              "This email is already registered. Please login."
            )
            break

          case "auth/invalid-email":
            setAuthError(
              "Please enter a valid email address."
            )
            break

          case "auth/weak-password":
            setAuthError(
              "Password should be at least 6 characters."
            )
            break

          case "auth/user-not-found":
            setAuthError(
              "No account found with this email."
            )
            break

          default:
            setAuthError(
              "Authentication failed. Please try again."
            )
        }
      } finally {
        setAuthLoading(false)
      }
    }

  const handleGoogleLogin =
    async () => {
      setAuthLoading(true)
      setAuthError("")

      try {
        await signInWithPopup(
          auth,
          googleProvider
        )
      } catch (error) {
        console.error(error)

        setAuthError(
          "Google login failed. Please try again."
        )
      } finally {
        setAuthLoading(false)
      }
    }

  const resetForm = () => {
    setCompanyName("")
    setRole("")
    setStatus("Applied")
    setNotes("")
    setUrl("")
    setEditingId(null)
    setShowForm(false)
  }

  const saveApplication =
    async () => {
      if (!user) return

      if (
        !companyName.trim() ||
        !role.trim()
      ) {
        alert(
          "Please enter Company Name and Job Role"
        )
        return
      }

      if (editingId) {
        await updateDoc(
          doc(
            db,
            "applications",
            editingId
          ),
          {
            companyName,
            role,
            status,
            notes,
            url,
          }
        )
      } else {
        await addDoc(
          collection(
            db,
            "applications"
          ),
          {
            userId: user.uid,
            companyName,
            role,
            status,
            appDate: new Date(),
            notes,
            url,
          }
        )
      }

      resetForm()
    }

  const startEdit = (
    app: Application
  ) => {
    setEditingId(app.id)
    setCompanyName(app.companyName)
    setRole(app.role)
    setStatus(app.status)
    setNotes(app.notes || "")
    setUrl(app.url || "")
    setShowForm(true)
  }

  const updateApplicationStatus =
    async (
      id: string,
      newStatus: string
    ) => {
      await updateDoc(
        doc(
          db,
          "applications",
          id
        ),
        {
          status: newStatus,
        }
      )
    }

  const handleDragEnd =
    async (
      event: DragEndEvent
    ) => {
      const {
        active,
        over,
      } = event

      if (!over) return

      const applicationId =
        String(active.id)

      const newStatus =
        String(over.id)

      if (
        !statuses.includes(
          newStatus
        )
      ) {
        return
      }

      const application =
        applications.find(
          (app) =>
            app.id ===
            applicationId
        )

      if (!application) return

      if (
        application.status ===
        newStatus
      ) {
        return
      }

      await updateApplicationStatus(
        applicationId,
        newStatus
      )
    }

  const deleteApplication =
    async (id: string) => {
      const confirmDelete =
        window.confirm(
          "Are you sure you want to delete this application?"
        )

      if (!confirmDelete) return

      await deleteDoc(
        doc(
          db,
          "applications",
          id
        )
      )
    }

  const handleLogout =
    async () => {
      await signOut(auth)
    }

  const filteredApplications =
    applications.filter(
      (app) => {
        const search =
          searchTerm
            .toLowerCase()
            .trim()

        const matchesSearch =
          !search ||
          app.companyName
            .toLowerCase()
            .includes(search) ||
          app.role
            .toLowerCase()
            .includes(search) ||
          app.notes
            .toLowerCase()
            .includes(search)

        const matchesStatus =
          statusFilter === "All" ||
          app.status ===
            statusFilter

        return (
          matchesSearch &&
          matchesStatus
        )
      }
    )

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">

          <div className="text-center">
            <h1 className="text-3xl font-bold">
              JobTrackr
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Track and manage your job applications
            </p>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold">
              {authMode === "login"
                ? "Welcome back 👋"
                : "Create your account"}
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              {authMode === "login"
                ? "Login to continue to JobTrackr."
                : "Create an account to start tracking jobs."}
            </p>
          </div>

          {authError && (
            <div className="mt-5 rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-300">
              {authError}
            </div>
          )}

          <div className="mt-6 space-y-4">

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="Email address"
              autoComplete="email"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 outline-none transition focus:border-blue-500"
            />

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleEmailAuth()
                }
              }}
              placeholder="Password"
              autoComplete={
                authMode === "login"
                  ? "current-password"
                  : "new-password"
              }
              className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 outline-none transition focus:border-blue-500"
            />

            <button
              onClick={handleEmailAuth}
              disabled={authLoading}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {authLoading
                ? "Please wait..."
                : authMode === "login"
                  ? "Login"
                  : "Create Account"}
            </button>

          </div>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-800" />

            <span className="text-xs text-slate-500">
              OR
            </span>

            <div className="h-px flex-1 bg-slate-800" />
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={authLoading}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 font-semibold transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue with Google
          </button>

          <div className="mt-6 text-center text-sm text-slate-400">
            {authMode === "login"
              ? "Don't have an account?"
              : "Already have an account?"}

            <button
              onClick={() => {
                setAuthMode(
                  authMode === "login"
                    ? "signup"
                    : "login"
                )
                setAuthError("")
              }}
              className="ml-2 font-semibold text-blue-400 hover:underline"
            >
              {authMode === "login"
                ? "Create Account"
                : "Login"}
            </button>
          </div>

        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
        <div>
          <h1 className="text-2xl font-bold">
            JobTrackr
          </h1>

          <p className="text-sm text-slate-400">
            Track and manage your job applications
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="rounded-lg bg-red-600 px-4 py-2 font-semibold hover:bg-red-700"
        >
          Logout
        </button>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">

        {/* Dashboard */}
        <h2 className="text-3xl font-bold">
          Dashboard 👋
        </h2>

        <p className="mt-2 text-slate-400">
          {user.email}
        </p>

        {/* Stats */}
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-slate-400">
              Total Applications
            </p>

            <p className="mt-2 text-3xl font-bold">
              {applications.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-slate-400">
              Applied
            </p>

            <p className="mt-2 text-3xl font-bold">
              {
                applications.filter(
                  (app) =>
                    app.status ===
                    "Applied"
                ).length
              }
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-slate-400">
              Interviews
            </p>

            <p className="mt-2 text-3xl font-bold">
              {
                applications.filter(
                  (app) =>
                    app.status ===
                    "Interview"
                ).length
              }
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-slate-400">
              Offers
            </p>

            <p className="mt-2 text-3xl font-bold">
              {
                applications.filter(
                  (app) =>
                    app.status ===
                    "Offer"
                ).length
              }
            </p>
          </div>

        </div>

        {/* Applications */}
        <section className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-6">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <h2 className="text-xl font-semibold">
              Recent Applications
            </h2>

            <button
              onClick={() => {
                if (showForm) {
                  resetForm()
                } else {
                  setShowForm(true)
                }
              }}
              className="rounded-lg bg-blue-600 px-4 py-2 font-semibold hover:bg-blue-700"
            >
              {showForm
                ? "Cancel"
                : "+ Add Application"}
            </button>

          </div>

          {/* Search */}
          <div className="mt-6 grid gap-4 md:grid-cols-2">

            <input
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(
                  e.target.value
                )
              }
              placeholder="🔎 Search company, role or notes..."
              className="rounded-lg border border-slate-700 bg-slate-950 p-3 outline-none focus:border-blue-500"
            />

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value
                )
              }
              className="rounded-lg border border-slate-700 bg-slate-950 p-3 outline-none"
            >
              <option value="All">
                All Statuses
              </option>

              {statuses.map(
                (status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {status}
                  </option>
                )
              )}
            </select>

          </div>

          {/* Result count */}
          {(searchTerm ||
            statusFilter !==
              "All") && (
            <p className="mt-3 text-sm text-slate-400">
              Showing{" "}
              {
                filteredApplications.length
              }{" "}
              of{" "}
              {
                applications.length
              }{" "}
              applications
            </p>
          )}

          {/* Add / Edit Form */}
          {showForm && (
            <div className="mt-6 rounded-lg border border-slate-700 bg-slate-950 p-5">

              <h3 className="mb-4 text-lg font-semibold">
                {editingId
                  ? "Edit Application"
                  : "Add New Application"}
              </h3>

              <div className="grid gap-4 md:grid-cols-2">

                <input
                  value={companyName}
                  onChange={(e) =>
                    setCompanyName(
                      e.target.value
                    )
                  }
                  placeholder="Company Name"
                  className="rounded-lg border border-slate-700 bg-slate-900 p-3 outline-none"
                />

                <input
                  value={role}
                  onChange={(e) =>
                    setRole(
                      e.target.value
                    )
                  }
                  placeholder="Job Role"
                  className="rounded-lg border border-slate-700 bg-slate-900 p-3 outline-none"
                />

                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(
                      e.target.value
                    )
                  }
                  className="rounded-lg border border-slate-700 bg-slate-900 p-3 outline-none"
                >
                  {statuses.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {status}
                      </option>
                    )
                  )}
                </select>

                <input
                  value={url}
                  onChange={(e) =>
                    setUrl(
                      e.target.value
                    )
                  }
                  placeholder="Job URL"
                  className="rounded-lg border border-slate-700 bg-slate-900 p-3 outline-none"
                />

              </div>

              <textarea
                value={notes}
                onChange={(e) =>
                  setNotes(
                    e.target.value
                  )
                }
                placeholder="Notes"
                rows={4}
                className="mt-4 w-full rounded-lg border border-slate-700 bg-slate-900 p-3 outline-none"
              />

              <div className="mt-4 flex gap-3">

                <button
                  onClick={
                    saveApplication
                  }
                  className="rounded-lg bg-green-600 px-5 py-3 font-semibold hover:bg-green-700"
                >
                  {editingId
                    ? "Update Application"
                    : "Save Application"}
                </button>

                <button
                  onClick={resetForm}
                  className="rounded-lg border border-slate-700 px-5 py-3 font-semibold"
                >
                  Cancel
                </button>

              </div>

            </div>
          )}

          {/* Kanban */}
          <div className="mt-8">

            <h2 className="mb-4 text-xl font-semibold">
              Kanban Board
            </h2>

            <DndContext
              collisionDetection={
                closestCenter
              }
              onDragEnd={
                handleDragEnd
              }
            >
              <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-4">

                {statuses.map(
                  (status) => (
                    <KanbanColumn
                      key={status}
                      status={status}
                      applications={filteredApplications.filter(
                        (app) =>
                          app.status ===
                          status
                      )}
                      onEdit={
                        startEdit
                      }
                      onDelete={
                        deleteApplication
                      }
                      onStatusChange={
                        updateApplicationStatus
                      }
                    />
                  )
                )}

              </div>
            </DndContext>

          </div>

        </section>

        {/* Live Job Feed */}
        <JobFeed />

      </main>
    </div>
  )
}

export default App
