# Dependency review

Reviewed on **9 October 2026**, using the committed npm lockfile.

## Findings

`npm audit --json` reports **five high-severity affected package entries**, all arising from one underlying advisory: [GHSA-vfj7-8cjw-p6xm / CVE-2026-93687](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). Deeply nested brace patterns can exhaust the JavaScript stack and cause a denial of service.

The installed dependency path is:

```text
eslint-config-next@16.4.0
└── @next/eslint-plugin-next@16.4.0
    └── fast-glob@3.3.1
        └── micromatch@4.0.8
            └── braces@3.0.3
```

The affected `braces` range is `<=3.0.3`. The advisory lists no patched release; the registry's latest `braces` and `micromatch` versions are the versions already installed. npm proposes a major downgrade of `eslint-config-next` to 14.2.35. That is inappropriate for this Next.js 16 application and has not been applied. No force fix or framework downgrade was used.

`npm audit --omit=dev --json` reports **zero vulnerabilities** in the production dependency set, including the browser PDF library. This is the result of this audit, not a guarantee that the application has no security defects.

## Practical exposure and follow-up

The affected chain belongs to ESLint development tooling. It is installed on developer machines and during builds that install development dependencies. A malicious deeply nested glob supplied to affected tooling can interrupt linting or CI. Development-only classification does not make that risk irrelevant.

The Next ESLint plugin uses `fast-glob` when resolving a configured `settings.next.rootDir` pattern. This project's ESLint configuration does not set that option. Customer inputs, invoice notes and transaction URL filters do not become ESLint patterns, and this chain is not part of the browser payment service. This narrows the observed exposure but does not establish that every tooling entry point is safe.

Review untrusted configuration changes before running tooling, avoid feeding untrusted glob patterns into lint/build tools, and recheck the advisory when compatible patched dependencies become available. Retain the lockfile and rerun both audit commands after dependency changes.

## Reproduce

```bash
npm audit --json
npm audit --omit=dev --json
npm ls eslint-config-next @next/eslint-plugin-next fast-glob micromatch braces
```

The full audit currently exits nonzero because these advisories remain unresolved. A successful application build does not clear that finding.
