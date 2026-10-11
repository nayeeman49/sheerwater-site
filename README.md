# Sheerwater Consulting website

A static, multi-page website with no framework and no server. It works on GitHub Pages, Cloudflare Pages, Netlify and any other static host.

## Pages

| Page | File | What it does |
| --- | --- | --- |
| Home | `index.html` | Package finder: two questions, one recommended package |
| Services | `services.html` | Eight packages (incl. on-prem infrastructure and application development), audience filter |
| Private AI | `private-ai.html` | Pilot explainer, five-week plan, FAQ |
| About | `about.html` | Founder and how the studio works |
| Careers | `careers.html` | How hiring works, filterable roles with details |
| Apply | `apply.html` | Application form, with the role pre-selected from the Careers page |
| Start a project | `contact.html` | Enquiry form, with the package pre-filled |
| Privacy | `privacy.html` | Plain-language privacy notice |
| Not found | `404.html` | Shown for unknown addresses |

## Publish free on GitHub Pages

1. Create a new public repository on GitHub, for example `sheerwater-site`.
2. Upload everything in this folder to the repository root (drag and drop works: **Add file > Upload files**). The `.nojekyll` file must be included.
3. Go to **Settings > Pages**. Under **Build and deployment**, choose **Deploy from a branch**, pick `main` and `/ (root)`, then save.
4. After a minute the site is live at `https://YOUR-USERNAME.github.io/YOUR-REPO/`.

Pages on a free GitHub plan needs a public repository, so check GitHub's current plan terms if you want it private.

Free alternatives that also work with this folder as it is: Cloudflare Pages, Netlify and Vercel. Check each one's current free-tier terms.

## Make the forms deliver to your inbox

GitHub Pages cannot run server code, so the forms need one of two options:

- **Default (works immediately):** the form opens the visitor's email app with the answers filled in, addressed to the email in `assets/config.js`.
- **Better:** create a free form at a service such as Formspree or Web3Forms, paste its URL into `formEndpoint` in `assets/config.js`, and submissions arrive in your inbox with no email app needed. If the service gives an access key, paste it into `formAccessKey`. Check each service's current free limits.

`assets/config.js` can be edited directly on GitHub. No rebuild is needed.

## Edit the content

Everything you see is built from files in `_source/`:

- `_source/packages.json`: package names, timelines and deliverables, plus the text each audience button on the Services page shows (`views`). Changing it updates the home page list, the services page, the finder together (no prices are shown on the site). Every audience listed for a package needs its own view, or the build stops with an error.
- `_source/audiences.json`: the intro paragraph shown above the packages for each audience button.
- `_source/roles.json`: the roles on the Careers page and in the Apply form. Each role also gets its own page, `job-<slug>.html`, created by the build.
- `_source/pages/*.html`: the text of each page.
- `_source/site.json`: site address and navigation.

After editing, rebuild with Node.js 18 or newer (free from nodejs.org):

```
node _source/build.mjs
```

Then upload the changed files. You can also edit the built `.html` files directly for a small text fix, but a rebuild will overwrite those edits.

## Before you publish

- [ ] Set your site address in `_source/site.json` (`siteUrl`), rebuild, so the sitemap and canonical links are correct.
- [ ] Check the contact email in `assets/config.js`. It is currently the address from your CV, and it will be public.
- [ ] Read `privacy.html`. The retention periods (12 and 24 months) are suggestions, so set the ones you will actually follow.
- [ ] Check that nothing on the site draws on your employer's work, clients or information.
- [ ] Check your employment contract allows outside business activity.
- [ ] Once the business is a limited company, add its name, number and registered office to the footer (there is a comment marking the spot in `_source/layout.html`).
- [ ] Update the LinkedIn page overview so it matches this site.

## Branding and assets

The site uses the Sheerwater logo palette: navy `#001119`, cyan `#08FBFA`, green `#00BF63`, white. Colours are CSS variables at the top of `assets/style.css`.

The original logo is kept in `_source/brand/logo-original.png`. To regenerate the logo files, favicon, social share image (`og.png`) and hero pattern (`maze.svg`) in `assets/`, run:

    pip install Pillow
    python3 _source/tools/make-assets.py
