# Security Policy

## Supported Versions

Juxta is pre-1.0 and ships from `main`. Security fixes are applied to the latest released version and to `main`. Older tagged releases are not patched — please upgrade to the latest version.

| Version | Supported |
| ------- | --------- |
| latest (`main` / newest release) | ✅ |
| older releases | ❌ |

## Reporting a Vulnerability

Please report security issues **privately** — do not open a public issue for a vulnerability.

Use GitHub's private vulnerability reporting:
**https://github.com/pranavp1507/Juxta/security/advisories/new**

Include:

- A description of the issue and its impact
- Steps to reproduce (or a proof of concept)
- Affected version / commit and environment (browser, self-hosted vs. local)

You can expect an initial acknowledgement within **5 business days**, and we will keep you informed as we investigate and prepare a fix. Once a fix is released, we are happy to credit you in the advisory unless you prefer to remain anonymous.

## Scope notes

Juxta performs all diffing **client-side in the browser** — text you compare is never sent to a server. The self-hostable build is a thin SvelteKit (`adapter-node`) host that serves the static app; it does not store or transmit user content. Keep this context in mind when assessing impact: the most relevant areas are the server host configuration (e.g. `ORIGIN`/CSRF when run behind a proxy), dependency vulnerabilities, and client-side issues such as XSS in rendered diff content.
