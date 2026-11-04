# Validation

This document distinguishes automated local checks from real-client results.

The original minimal CodexProbe loaded in the real Lasthavens client through a DevTools startup overlay. That established the underlying file-overlay mechanism, not full installed-extension compatibility.

Version 0.2.0 checks: formatting; ZIP binary roundtrip, multi-addon and embedded-library import; unsafe-path rejection; immutable library update behavior; complete locale key/placeholder parity; browser UI and worker fixtures. Actual command results are recorded in the delivered validation summary.

Pending real-client checks: installation of this exact extension package; local-addon startup in the current client build; same-size updates against existing OPFS entries; third-party-addon Lua/UI compatibility; multi-tab changes. No claim of Chrome Web Store acceptance or publication is made.
