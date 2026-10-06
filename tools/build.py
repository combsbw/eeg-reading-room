#!/usr/bin/env python3
"""Build the EEG and ECG Reading Rooms from source.

  python3 tools/build.py                 -> both apps, PWA builds (index.html, ecg/index.html)
  python3 tools/build.py eeg|ecg|all MODE   MODE = pwa | standalone | artifact

Sources: eeg-src/ and ecg/src/ (app code, concatenated in file-name order) plus shared/ (inserted
just before each app's 99_wire.js). Standalone and artifact builds land in dist/.
"""
import sys, os, glob, re
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APPS = {
  'eeg': dict(src='eeg-src', out='index.html', title='EEG Room', sister_pwa='<p class="sister"><a href="ecg/">Open the ECG Reading Room →</a></p>',
              sister_abs='<p class="sister"><a href="https://combsbw.github.io/eeg-reading-room/ecg/" target="_blank" rel="noopener">Open the ECG Reading Room →</a></p>',
              standalone='EEG_Reading_Room.html', artifact='eeg_artifact.html'),
  'ecg': dict(src='ecg/src', out='ecg/index.html', title='ECG Room', sister_pwa='<p class="sister"><a href="../">Open the EEG Reading Room →</a></p>',
              sister_abs='<p class="sister"><a href="https://combsbw.github.io/eeg-reading-room/" target="_blank" rel="noopener">Open the EEG Reading Room →</a></p>',
              standalone='ECG_Reading_Room.html', artifact='ecg_artifact.html'),
}
def build(app, mode):
    a = APPS[app]; src = os.path.join(root, a['src'])
    shell = open(os.path.join(src, 'shell.html')).read()
    css = ''.join(open(f).read() for f in sorted(glob.glob(os.path.join(src, '*.css'))) + sorted(glob.glob(os.path.join(root, 'shared', '*.css'))))
    files = sorted(glob.glob(os.path.join(src, '*.js')))
    wire = [f for f in files if os.path.basename(f).startswith('99_')]
    body = [f for f in files if f not in wire]
    shared = sorted(glob.glob(os.path.join(root, 'shared', '*.js')))
    js = ''.join(open(f).read() for f in body + shared + wire)
    js = js.replace('__APP__', app)
    if mode == 'pwa':
        head = f'''<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" sizes="32x32" href="icons/favicon-32.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="{a['title']}">
<meta name="apple-mobile-web-app-status-bar-style" content="default">'''
        sw = '''<script>
if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(e){console.warn('Service worker not registered',e)})})}
</script>'''
        sister = a['sister_pwa']
    else:
        head = ''; sw = ''; sister = a['sister_abs']
    out = shell.replace('/*CSS*/', css).replace('/*JS*/', js).replace('<!--PWAHEAD-->', head).replace('<!--PWASW-->', sw).replace('<!--SISTER-->', sister)
    os.makedirs(os.path.join(root, 'dist'), exist_ok=True)
    if mode == 'pwa':
        path = os.path.join(root, a['out'])
    elif mode == 'standalone':
        path = os.path.join(root, 'dist', a['standalone'])
    else:
        title = re.search(r'<title>.*?</title>', out).group(0)
        style = out[out.index('<style>'):out.index('</style>') + 8]
        bodyh = out[out.index('<body>') + 6:out.index('</body>')]
        out = title + '\n' + style + '\n' + bodyh
        path = os.path.join(root, 'dist', a['artifact'])
    open(path, 'w').write(out)
    print(path, len(out))
which = sys.argv[1] if len(sys.argv) > 1 else 'all'
mode = sys.argv[2] if len(sys.argv) > 2 else 'pwa'
for app in (['eeg', 'ecg'] if which == 'all' else [which]):
    build(app, mode)
