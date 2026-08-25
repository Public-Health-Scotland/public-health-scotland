# Public Health Scotland — Code

Landing page for [code.publichealthscotland.scot](https://code.publichealthscotland.scot), the Public Health Scotland open-code hub.

## What the site does

A single-page Quarto website that:

- Shows organisation statistics from the GitHub API (repositories, stars, followers)
- Displays curated featured projects
- Lists PHS R and Python packages with links to source and documentation
- Provides a searchable, filterable grid of all public repositories

Repository content is read from a snapshot of the GitHub API taken when the site is built, so the page itself makes no API calls.

## Local preview

Install [Quarto](https://quarto.org/docs/get-started/) and [Node](https://nodejs.org/) 18 or later, then from the repository root:

```bash
quarto preview
```

The site opens at `http://localhost:4848` by default.

Rendering runs `scripts/fetch-github-data.mjs` first, which writes `github-data.json` — the organisation snapshot the page reads. The file is not committed. A snapshot less than six hours old is reused rather than refetched, so repeated previews do not call the API; delete the file or set `GITHUB_DATA_MAX_AGE_HOURS=0` to force a refresh.

## Deployment

Defined in `.github/workflows/deploy.yml`. Every push to `main` triggers a Quarto render and deploys the output to the `gh-pages` branch. The same workflow runs each morning at 06:00 UTC, and can be run on demand from the Actions tab, so the repository snapshot stays current without anyone pushing a commit.

**First-time setup:** after the first successful workflow run, open the repository **Settings → Pages** and set the source branch to `gh-pages`. The custom domain (`code.publichealthscotland.scot`) is written to the `CNAME` file and is applied automatically on each deploy.

## Updating curated content

One JSON file controls hand-picked content. Edit it directly and push to `main`; the Actions workflow rebuilds and deploys automatically.

### Featured projects — `featured.json`

The "Featured projects" section shows four curated cards. Each entry:

```json
{
  "repo": "repository-name",
  "description": "One or two sentences describing the project."
}
```

- `repo` must match the exact repository name in the `Public-Health-Scotland` GitHub organisation.
- `description` is displayed on the card and overrides the GitHub repository description — write it in plain language, consistent in tone with the other entries.
- Metadata (stars, language, URL) comes from the snapshot taken at build time.
- An entry naming a repository that no longer exists still renders, without metadata.

## Packages section

The "Packages" section is fully automated — no file in this repository controls it. It is derived from the snapshot taken at build time, so a change on GitHub appears after the next deploy or daily refresh.

**To add a package to the section:** open the repository on GitHub, go to the repository settings, and add the `r-package` topic. The repository will appear on the landing page automatically.

**To add a documentation link:** in the same repository settings page, set the "Website" field to the pkgdown (or other documentation) URL. If a Website URL is set, a "Documentation" button appears on the card linking directly to it.

**To remove a package from the section:** remove the `r-package` topic from the repository. Archived repositories are excluded automatically.

## Technical notes

**GitHub API:** `scripts/fetch-github-data.mjs` calls the API once per build, authenticated with the workflow's built-in `GITHUB_TOKEN`, and writes the fields the page needs to `github-data.json`. Visitors download that one file instead of making their own API calls, which is what the unauthenticated limit of 60 requests per IP per hour used to break on shared networks. If the API is unreachable during a build, an existing snapshot is kept and the deploy continues; with no snapshot at all the render fails rather than publishing an empty page.

**Third-party code:** the page runs on the Observable standard library that Quarto bundles into the site. Observable Inputs is deliberately not used, because it is loaded from a public CDN at page load and takes the repository grid with it on networks that block one.

**Documentation links:** the "Documentation" button on package cards links directly to whatever URL is set in the repository's "Website" field on GitHub. These are typically pkgdown sites deployed at `code.publichealthscotland.scot/<repo>/` via GitHub Pages, but any URL works.

**Accessibility:** the site targets WCAG 2.2 AA compliance, aiming for AAA. Specifically: solid brand-colour backgrounds (no gradients), no all-capitals text, keyboard-navigable with visible 3px magenta focus rings, and dynamically chosen badge text colour to meet contrast requirements against all language colour backgrounds.

**Actions pinning:** all third-party GitHub Actions in the workflow are pinned to commit SHAs rather than mutable version tags, following supply-chain security best practice.
