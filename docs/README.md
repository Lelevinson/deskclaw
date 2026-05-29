# docs/

Supporting documentation. Root-level files stay small; everything operational or historical lives under `docs/`.

```text
docs/
  openclaw/
    setup.md      # OpenClaw install, config, commands, fixes — single source
  archive/
    PROPOSAL.md   # historical proposal/presentation snapshot (read-only)
```

Shared business facts and local runtime baseline data live in [`../data/`](../data/).
Shop backend notes live next to the code in [`../src/shop/README.md`](../src/shop/README.md).
For project scope, see [`../ARCHITECTURE.md`](../ARCHITECTURE.md). For contributor rules, see [`../AGENTS.md`](../AGENTS.md).
