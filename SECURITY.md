# Security Policy

skillforge is local-first and does not intentionally send skill contents to a network service.

## Reporting vulnerabilities

Open a private security advisory on GitHub or email the maintainer if a private channel is available. Please include reproduction steps, affected versions, and impact.

## Safety model

The linter flags risky instructions such as force pushes, publish commands, `sudo`, destructive deletion, and curl-piped shell snippets. These are warnings, not a sandbox. Review rendered skills before installing them into an agent host.
