import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

jest.mock("./firebase", () => ({
  auth: {},
  db: {},
  googleProvider: {},
}));

jest.mock("firebase/auth", () => ({
  onAuthStateChanged: jest.fn(() => jest.fn()),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  onSnapshot: jest.fn(() => jest.fn()),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
}));

jest.mock("./JobFeed", () => {
  return function MockJobFeed() {
    return <div>Job Feed</div>;
  };
});

jest.mock("./Analytics", () => {
  return function MockAnalytics() {
    return <div>Analytics</div>;
  };
});

jest.mock("@dnd-kit/core", () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  closestCenter: jest.fn(),
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
  }),
  useDroppable: () => ({
    setNodeRef: jest.fn(),
    isOver: false,
  }),
}));

jest.mock("@dnd-kit/utilities", () => ({
  CSS: {
    Translate: {
      toString: jest.fn(),
    },
  },
}));

import App from "./App";

describe("JobTrackr App", () => {
  test("shows JobTrackr login page", () => {
    render(<App />);
    expect(screen.getByText("JobTrackr")).toBeInTheDocument();
  });

  test("shows email and password fields", () => {
    render(<App />);

    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
  });

  test("shows login button", () => {
    render(<App />);

    expect(
      screen.getByRole("button", { name: /login/i })
    ).toBeInTheDocument();
  });

  test("shows validation when login is submitted empty", () => {
    render(<App />);

    fireEvent.click(
      screen.getByRole("button", { name: /login/i })
    );

    expect(
      screen.getByText(/please enter email and password/i)
    ).toBeInTheDocument();
  });
});
