# TODO 03 – Shareable Strategy Link (Small)

Goals:
- Encode the saved strategies into a compact string (base64 of trimmed JSON) with no PII.
- Load strategies from `?s=` query param on page load.
- Provide a UI button to copy a shareable/bookmarkable URL (only when strategies exist).
- Keep generated URLs short and safe for GitHub Pages (use `import.meta.env.BASE_URL`).
- Handle clipboard failures gracefully and surface a status message to the user.
