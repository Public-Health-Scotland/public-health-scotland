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

Two JSON files control the hand-picked sections. Edit them directly and push to `main`; the Actions workflow rebuilds and deploys automatically.

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

### Packages — `packages.json`

The "Packages" section lists PHS R and Python packages. Each entry:

```json
{
  "repo": "repository-name",
  "description": "One sentence describing what the package does.",
  "docs": true
}
```

- `repo`: exact GitHub repository name.
- `description`: plain-English description of the package.
- `docs`: set to `true` if a documentation site is deployed and reachable at `code.publichealthscotland.scot/<repo>/`; set to `false` to omit the documentation link from the card.

To add a package, append a new entry. To remove one, delete its entry. Entries are displayed in the order they appear in the file.

## Technical notes

**GitHub API:** all data is fetched client-side using the unauthenticated GitHub API (rate limit: 60 requests per IP per hour). No API token is stored or required. The stats strip, featured section, packages section, and repository grid all share paginated repo data fetched once at page load.

**Documentation links:** package documentation links use relative paths (`/<repo>/`) rather than absolute URLs. This works because all GitHub Pages sites under the `Public-Health-Scotland` organisation are served from the `code.publichealthscotland.scot` domain when the custom domain is active.

**Accessibility:** the site targets WCAG 2.2 AA compliance, aiming for AAA. Specifically: solid brand-colour backgrounds (no gradients), no all-capitals text, keyboard-navigable with visible 3px magenta focus rings, and dynamically chosen badge text colour to meet contrast requirements against all language colour backgrounds.

**Actions pinning:** all third-party GitHub Actions in the workflow are pinned to commit SHAs rather than mutable version tags, following supply-chain security best practice.
