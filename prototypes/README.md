# `prototypes/` — spikes, kept as evidence

A prototype exists to answer one question with a run rather than with a reading. It is not
product code, it holds no claims, and nothing in `docs/` may point at it.

**It is not thrown away once it answers.** A spike whose answer is a sentence in a design
document is a sentence someone will doubt in six months; a spike that still runs is the
answer. Each one keeps a `README.md` saying what it asked and what it found, so the finding
survives even after the code stops building.

## What is and is not in the gate

- `vp check` covers these packages — they are formatted, linted, and type-checked like
  everything else. A spike that no longer compiles against the current dependency versions is
  itself a finding, and the gate is where you want to hear about it.
- `vp run -r test` does **not**. A spike's script is called `spike`, not `test`, because these
  runs stand up real emulators and are slower than the unit suite by an order of magnitude.
  Run one with `vp run --filter <package> spike`.

## What is here

| Spike                                                       | Question                                              | Answer                                |
| ----------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------- |
| [`alchemy-credentials-spike`](./alchemy-credentials-spike/) | Does an Alchemy test run need Cloudflare credentials? | required, never used — see its README |
