# CyberEnsō hashing

CyberEnsō turns text into a visual gesture without sending the text to a
server. The browser performs the complete transformation:

```text
text → UTF-8 bytes → BLAKE2b-256 digest → decimal digits → 60 arc paths
```

## BLAKE2b-256

The implementation lives in [`assets/app.js`](../assets/app.js). It is a
compact browser implementation of BLAKE2b configured for a 32-byte
(256-bit) digest.

The algorithm:

1. Encodes the editor text with `TextEncoder`, producing UTF-8 bytes.
2. Initializes the eight-word BLAKE2b state from the standard IV constants.
3. Applies the BLAKE2b output-length parameter for a 32-byte result.
4. Splits the input into 128-byte blocks and pads the final block.
5. Runs twelve compression rounds using the BLAKE2b sigma schedule and
   64-bit mixing operations.
6. Serializes the final state into 32 digest bytes and exposes the hexadecimal
   digest for the editor status line.

The digest is one-way: the generated mark does not provide a practical way to
recover the original text.

## Decimal digit stream

The renderer preserves the original generator's input conversion. Digest
bytes are converted to their decimal representations, joined together, and
split into individual digits. Those digits are then used cyclically to drive
the 60 layers.

The original generator also removes a small random number of zero digits at
the start of the stream. CyberEnsō preserves that zero-retention behavior so
the readable implementation follows the original visual logic.

## From digits to geometry

Each of the first 60 usable digits influences one layered path. The original
direction formulas determine the start and end angles, with separate formulas
for normal and reverse direction. Small endpoint variations provide the
slightly organic brush quality of the original.

The live renderer samples those angles into points on a centered circular
track instead of relying on a single SVG `A` command. This avoids an SVG arc
center ambiguity at the large presentation radius while preserving the
original angle relationships and 60-layer structure.

The result is an SVG containing:

- one paper-colored background rectangle;
- 60 rounded, ink-colored paths;
- optional corner attribution text;
- a fixed `2048 × 2048` view box for crisp SVG and PNG exports.

## Privacy and limitations

Hashing happens locally in the browser. Text is not sent to an API, and saved
marks use only `localStorage` on the current browser. Because the original
process includes random zero retention and endpoint variation, two renders
with the same text can have the same digest but slightly different organic
details.

For the broader runtime and deployment design, see
[`ARCHITECTURE.md`](./ARCHITECTURE.md).
