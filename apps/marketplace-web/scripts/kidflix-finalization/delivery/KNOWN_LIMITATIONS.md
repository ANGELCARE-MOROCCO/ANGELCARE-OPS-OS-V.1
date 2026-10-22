# Verification boundaries

All behavioral persistence, command and browser tests use explicitly labeled offline adapters. They exercise the actual final normalization, command-service, public and editor components but do not establish live database, production authentication, tenant/hostname resolution or deployed end-to-end success. No production database access, content publication or release operation was performed.

The responsive capture catalogue is intentionally empty. An isolated test-only published-resource fixture verifies retention of useful results and selected filters after an API failure; it is confined to the verification harness and is not included in production handlers or the public catalogue.

Next navigation is represented by a minimal local adapter in the browser harness. Real internal/programmatic navigation, page lifecycle, visibility, slow/error/retry/dismissal signals and the actual feedback components are exercised locally. This is not a deployed Next.js routing test. Media buffering uses the actual owned player with a valid local WAV fixture and dispatched native media events; production streaming and network buffering were not accessed.

All artwork is commissioned AI-generated illustration, not photography. The asset register includes individual prompts, rights/provenance notes, descriptions, focal points, dimensions, sizes and SHA-256 hashes. Optimized WebP deliverables are complete; generated working PNGs are retained locally and are not required for installation.

The source archives contained four malformed out-of-scope filenames with backslashes. They were quarantined from extraction and are listed in the archive audit. No contradictory duplicates were found. No applicable AGENTS.md files were present in the archive or checkout ancestor chain inspected.
