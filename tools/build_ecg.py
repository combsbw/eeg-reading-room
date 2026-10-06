#!/usr/bin/env python3
"""Build the ECG Reading Room from ecg/src.

  python3 tools/build_ecg.py            -> ecg/index.html (PWA build)
  python3 tools/build_ecg.py standalone -> dist/ECG_Reading_Room.html (single file, absolute EEG link)
  python3 tools/build_ecg.py artifact   -> dist/ecg_artifact.html (no html/head/body wrapper)
"""
import sys, os, glob, re
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = os.path.join(root, 'ecg', 'src')
mode = sys.argv[1] if len(sys.argv) > 1 else 'pwa'
shell = open(os.path.join(src, 'shell.html')).read()
css = ''.join(open(f).read() for f in sorted(glob.glob(os.path.join(src, '*.css'))))
js = ''.join(open(f).read() for f in sorted(glob.glob(os.path.join(src, '*.js'))))
if mode == 'pwa':
    head = '''<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" sizes="32x32" href="icons/favicon-32.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="ECG Room">
<meta name="apple-mobile-web-app-status-bar-style" content="default">'''
    sw = '''<script>
if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(e){console.warn('Service worker not registered',e)})})}
</script>'''
    sister = '<p class="sister"><a href="../">Open the EEG Reading Room →</a></p>'
else:
    head = ''; sw = ''
    sister = '<p class="sister"><a href="https://combsbw.github.io/eeg-reading-room/" target="_blank" rel="noopener">Open the EEG Reading Room →</a></p>'
out = shell.replace('/*CSS*/', css).replace('/*JS*/', js).replace('<!--PWAHEAD-->', head).replace('<!--PWASW-->', sw).replace('<!--SISTER-->', sister)
os.makedirs(os.path.join(root, 'dist'), exist_ok=True)
if mode == 'pwa':
    path = os.path.join(root, 'ecg', 'index.html')
elif mode == 'standalone':
    path = os.path.join(root, 'dist', 'ECG_Reading_Room.html')
else:
    title = re.search(r'<title>.*?</title>', out).group(0)
    style = out[out.index('<style>'):out.index('</style>') + 8]
    body = out[out.index('<body>') + 6:out.index('</body>')]
    out = title + '\n' + style + '\n' + body
    path = os.path.join(root, 'dist', 'ecg_artifact.html')
open(path, 'w').write(out)
print(path, len(out))
