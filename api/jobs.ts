import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    return res.status(500).json({
      error: "Adzuna credentials are not configured.",
    });
  }

  const what =
    typeof req.query.what === "string"
      ? req.query.what
      : "Software Developer";

  const where =
    typeof req.query.where === "string"
      ? req.query.where
      : "India";

  const url = new URL(
    "https://api.adzuna.com/v1/api/jobs/in/search/1"
  );

  url.searchParams.set("app_id", appId);
  url.searchParams.set("app_key", appKey);
  url.searchParams.set("results_per_page", "50");
  url.searchParams.set("what", what);
  url.searchParams.set("where", where);
  url.searchParams.set("content-type", "application/json");

  try {
    const response = await fetch(url);
    const text = await response.text();

    return res
      .status(response.status)
      .setHeader("Content-Type", "application/json")
      .send(text);
  } catch (error) {
    console.error("Adzuna API error:", error);

    return res.status(500).json({
      error: "Failed to connect to Adzuna.",
    });
  }
}