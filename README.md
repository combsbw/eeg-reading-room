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
