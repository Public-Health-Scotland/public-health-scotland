# Public Health Scotland — Code

Landing page for [code.publichealthscotland.scot](https://code.publichealthscotland.scot), the Public Health Scotland open-code hub.

## What the site does

A single-page Quarto website that:

- Shows live organisation statistics from the GitHub API (repositories, stars, followers)
- Displays curated featured projects
- Lists PHS R and Python packages with links to source and documentation
- Provides a searchable, filterable grid of all public repositories

Content is fetched from the GitHub API on the client side and does not require a build step to stay current.

## Local preview

Install [Quarto](https://quarto.org/docs/get-started/), then from the repository root:

```bash
quarto preview
```

The site opens at `http://localhost:4848` by default. The GitHub API is called live during preview, so repository data reflects the current state of the organisation.

## Deployment

Defined in `.github/workflows/deploy.yml`. Every push to `main` triggers a Quarto render and deploys the output to the `gh-pages` branch.

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
- Live metadata (stars, language, URL) is pulled from the GitHub API at page load.

## Packages section

The "Packages" section is fully automated — no file in this repository controls it. It reads directly from GitHub at page load.

**To add a package to the section:** open the repository on GitHub, go to the repository settings, and add the `r-package` topic. The repository will appear on the landing page automatically.

**To add a documentation link:** in the same repository settings page, set the "Website" field to the pkgdown (or other documentation) URL. If a Website URL is set, a "Documentation" button appears on the card linking directly to it.

**To remove a package from the section:** remove the `r-package` topic from the repository. Archived repositories are excluded automatically.

## Technical notes

**GitHub API:** all data is fetched client-side using the unauthenticated GitHub API (rate limit: 60 requests per IP per hour). The packages section is derived from the same organisation repo list as everything else — no separate search call is made. No API token is stored or required.

**Documentation links:** the "Documentation" button on package cards links directly to whatever URL is set in the repository's "Website" field on GitHub. These are typically pkgdown sites deployed at `code.publichealthscotland.scot/<repo>/` via GitHub Pages, but any URL works.

**Accessibility:** the site targets WCAG 2.2 AA compliance, aiming for AAA. Specifically: solid brand-colour backgrounds (no gradients), no all-capitals text, keyboard-navigable with visible 3px magenta focus rings, and dynamically chosen badge text colour to meet contrast requirements against all language colour backgrounds.

**Actions pinning:** all third-party GitHub Actions in the workflow are pinned to commit SHAs rather than mutable version tags, following supply-chain security best practice.
