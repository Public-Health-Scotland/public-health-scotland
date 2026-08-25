// Writes github-data.json: a snapshot of the organisation's public repositories
// for the site to read at build time. Runs as a Quarto pre-render step, so the
// rendered page makes no GitHub API calls of its own.
//
// Requires Node 18 or later. Set GITHUB_TOKEN to raise the API rate limit from
// 60 to 5,000 requests per hour. An existing snapshot younger than
// GITHUB_DATA_MAX_AGE_HOURS (default 6) is reused instead of being refetched.

import { readFile, writeFile } from "node:fs/promises";

const ORG = "Public-Health-Scotland";
const API = process.env.GITHUB_API_URL || "https://api.github.com";
const OUTPUT = new URL("../github-data.json", import.meta.url);
const MAX_AGE_HOURS = Number(process.env.GITHUB_DATA_MAX_AGE_HOURS ?? 6);
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";

const headers = {
  "Accept": "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": `${ORG}-site-build`,
  ...(TOKEN ? { "Authorization": `Bearer ${TOKEN}` } : {})
};

async function getJson(url) {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} from ${url}`);
  }
  return { body: await response.json(), link: response.headers.get("link") || "" };
}

// Follows the API's own Link header rather than guessing how many pages exist.
function nextPage(link) {
  const match = link.match(/<([^>]+)>;\s*rel="next"/);
  return match ? match[1] : null;
}

async function getRepos() {
  const repos = [];
  let url = `${API}/orgs/${ORG}/repos?per_page=100&type=public`;
  while (url) {
    const { body, link } = await getJson(url);
    if (!Array.isArray(body)) throw new Error("unexpected repository response");
    repos.push(...body);
    url = nextPage(link);
  }
  return repos;
}

// Only the fields the page renders, to keep the file the browser downloads small.
const trim = (repo) => ({
  name: repo.name,
  description: repo.description,
  html_url: repo.html_url,
  homepage: repo.homepage,
  language: repo.language,
  stargazers_count: repo.stargazers_count,
  pushed_at: repo.pushed_at,
  topics: repo.topics || [],
  archived: repo.archived,
  fork: repo.fork
});

async function readSnapshot() {
  try {
    const snapshot = JSON.parse(await readFile(OUTPUT, "utf8"));
    return snapshot?.repos?.length ? snapshot : null;
  } catch {
    return null;
  }
}

const existing = await readSnapshot();

if (existing && MAX_AGE_HOURS > 0) {
  const ageHours = (Date.now() - Date.parse(existing.generated)) / 3_600_000;
  if (Number.isFinite(ageHours) && ageHours >= 0 && ageHours < MAX_AGE_HOURS) {
    console.log(`github-data.json is ${ageHours.toFixed(1)}h old, reusing it.`);
    process.exit(0);
  }
}

try {
  const [{ body: org }, repos] = await Promise.all([
    getJson(`${API}/orgs/${ORG}`),
    getRepos()
  ]);
  if (!repos.length) throw new Error("no repositories returned");

  const data = {
    generated: new Date().toISOString(),
    org: {
      public_repos: org.public_repos,
      followers: org.followers
    },
    repos: repos
      .map(trim)
      .sort((a, b) => Date.parse(b.pushed_at) - Date.parse(a.pushed_at))
  };

  await writeFile(OUTPUT, `${JSON.stringify(data)}\n`);
  console.log(`Wrote github-data.json (${data.repos.length} repositories).`);
} catch (error) {
  if (existing) {
    console.warn(`GitHub API request failed (${error.message}), keeping the existing github-data.json.`);
    process.exit(0);
  }
  console.error(`GitHub API request failed: ${error.message}`);
  process.exit(1);
}
