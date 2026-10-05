# EEG Reading Room

An interactive EEG training app that works offline. It generates synthetic 20-channel tracings in your browser for 28 patterns (normal rhythms, benign variants, artifacts and classic abnormal patterns) and teaches them through three modes:

- **Quiz.** Practice mode explains each answer and adapts to the patterns you miss. Exam mode runs 10 distinct patterns and shows a review at the end.
- **Atlas.** Every pattern with teaching marks, what to look for, and what it is commonly confused with.
- **Dashboard.** Accuracy by category and by pattern, common mix-ups and a list of patterns to review.

You can change montage (double banana, average reference, transverse), sensitivity and filters on any tracing, and drag across it to measure time and frequency.

## Install

Open the live site in Chrome, Edge or Safari and use **Install app** (desktop and Android) or **Share, then Add to Home Screen** (iOS). After the first load the app is cached and runs without a connection. Progress is stored in your browser on that device only.

## Run locally

It is a static site with no build step. Serve the folder over HTTP (a service worker needs `localhost` or HTTPS):

```
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Updating

If you change any file, bump `CACHE_VERSION` in `sw.js` so installed copies pick up the new version.

## Notice

The tracings are computer-generated teaching models, not patient recordings. Real EEG is messier and more variable. Nothing here is for clinical interpretation. Few EEG patterns are strictly pathognomonic, and each abnormal example carries caveats about clinical context.

## Atlas sections (v2)

- **Rhythms**: infraslow, delta, theta, alpha, mu, sleep spindle, beta and gamma shown alone, stacked on one time base, as a "name that rhythm" quiz, and with a frequency dial.
- **Leads & montages**: interactive 10–20 map (what each electrode looks at), step-by-step placement and measurement, Input 1 / Input 2 for every channel in five montages, and a polarity lab for phase reversals.
- **Signal & filters**: measurement chain, differential amplification and impedance mismatch, low/high-frequency and notch filters with response curve, an RC circuit lab (time constant, corner frequency, integrator/differentiator) and a sampling/aliasing demo.

## ECG Reading Room (`/ecg/`)

A sister app for 12-lead ECG interpretation, installable and offline on its own at `ecg/`.

- **Quiz**: 58 synthetic patterns (normal and variants, rhythms, conduction, ischemia and STEMI equivalents, chamber and structure, electrolytes/drugs/temperature, mimics and technical errors). Diagnosis, measurement (rate, regularity, axis, PR, QRS, QTc) or mixed questions, with culprit-artery and management follow-ups, practice and 15-question exam modes.
- **Atlas**: pattern library with teaching marks and per-example measurements; a 10-step systematic read; leads and axis (hexaxial and horizontal-plane dials, positive/negative poles, placement, territories); rate and intervals (rate methods, anatomy of a beat, QTc formulas, side-by-side strips with ladder diagrams); signal and filters (monitor vs diagnostic mode, lead reversal lab, RC time constants).
- **Dashboard**: accuracy by category and measurement type, mix-ups, weak patterns, exam history.

Tracings come from a vector (dipole) model of the heart projected onto the standard leads; they are teaching models, not patient data.
