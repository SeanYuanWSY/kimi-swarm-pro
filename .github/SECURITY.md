# Security Policy

## Supported versions

| Version | Supported |
| --- | --- |
| 0.7.x | yes |
| older | no |

## Reporting a vulnerability

Do not open a public issue for a security report, especially one involving the install scripts or API keys.

Use [GitHub Security Advisories](https://github.com/SeanYuanWSY/kimi-swarm-pro/security/advisories/new).

## What the scripts touch

- `install.sh` and `uninstall.sh` change files under `~/.kimi-code` and `~/.agents`. Read them before running them.
- The hook reads the prompt you submit and adds an instruction to the Kimi Code context. It does not send that prompt to another server.
- A fleet subagent uses credentials from your own configuration when it calls a provider. Check the endpoint and the model assignment before you start one.
