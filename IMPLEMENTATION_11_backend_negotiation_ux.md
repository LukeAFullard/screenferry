# Implementation 11 — Backend Negotiation & UX (v2)

**Goal:** let a consuming app offer "fast mode" without the end user needing
to know what a backend even is.

**Depends on:** Implementation 10.

## Steps

1. **Capability probe:** attempt to load/instantiate the Cimbar WASM
   module; if it fails (unsupported browser, blocked by CSP, low-end
   device) or a quick self-test decode fails, report "unavailable" rather
   than throwing — consumers need this to build a fallback UI.

2. **Header-frame convention.** There's no return channel (Stage 4's
   design), so sender and receiver need to agree on a backend without one.
   The sender always encodes a short, fixed, backend-identifying header
   frame *in plain QR* first, regardless of which backend it then switches
   to — QR decoders are universal, so this frame is always readable, and it
   tells the receiver which decoder to load for the rest of the transfer.

3. **Implement the header frame in `src/index.ts`'s top-level API.** This
   is a real protocol addition — give it a focused unit test: encode with
   backend X, confirm the header frame is always plain-QR-decodable
   regardless of X.

4. **Expose `preferredBackend: "auto" | "qr-lt" | "cimbar"`.** `"auto"` on
   the sender tries Cimbar if the capability probe succeeds, else falls
   back to `qr-lt`. The receiver always auto-detects from the header frame
   — it never needs to be told which backend is in use.

5. **UX guidance for consumers** (document only — this library has no UI):
   recommend surfacing backend choice as "Fast mode (needs a good camera)"
   vs. default, not as raw backend names. End users shouldn't need to know
   what Cimbar is.

6. **Test the negotiation path end-to-end** in the Stage 7-style loopback
   harness: sender set to `"auto"` with Cimbar capability mocked both
   available and unavailable, confirming the receiver correctly detects and
   switches in both cases.
