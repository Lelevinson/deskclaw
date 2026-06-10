# docs/

Supporting documentation. Root-level files stay small; everything operational or historical lives under `docs/`.

```text
docs/
  openclaw/
    setup.md      # OpenClaw install, config, commands, fixes — single source
  persona.md      # the agent's voice (canonical SOUL.md/IDENTITY.md — machine-local at runtime)
  assets/         # README images: logo, storefront/admin screenshots
  planning/
    skill-roadmap.md       # which skills to build, in what order — research/brainstorm handoff
    storefront-roadmap.md  # the storefront build plan + reuse-layer contract
  archive/
    PROPOSAL.md   # historical proposal/presentation snapshot (read-only)
```

Shared business facts and local runtime baseline data live in [`../data/`](../data/).
Shop backend notes live next to the code in [`../src/shop/README.md`](../src/shop/README.md).
For project scope, see [`../ARCHITECTURE.md`](../ARCHITECTURE.md). For contributor rules, see [`../AGENTS.md`](../AGENTS.md).
