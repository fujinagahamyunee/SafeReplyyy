# SafeReply

SafeReply is a static, browser-based smishing safety checker. Open `index.html`
to use it; no application server or build step is required.

## Website links

- Local preview: `http://localhost:8000` (only accessible on the computer running the server)
- GitHub Pages website: `https://fujinagahamyunee.github.io/SafeReplyyy/`

The GitHub Pages address becomes available after the website files and deployment
workflow have been pushed to `main` and Pages is configured for GitHub Actions.

### Enable the permanent website link

1. Push the website files and `.github/workflows/deploy-pages.yml` to the `main`
   branch.
2. In the repository on GitHub, open **Settings → Pages**.
3. Under **Build and deployment**, choose **GitHub Actions** as the source.
4. Open **Actions** and wait for **Deploy SafeReply to GitHub Pages** to finish.
5. Open **Settings → Pages** to find the published URL. It should be
   `https://fujinagahamyunee.github.io/SafeReplyyy/`.

To preview the files locally, run `python3 -m http.server 8000` from the
repository directory and open `http://localhost:8000`. This is a local-only
temporary preview, not a public share link. After each push to `main`, the
workflow updates the permanent GitHub Pages website.