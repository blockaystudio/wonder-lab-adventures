#!/usr/bin/env python3
"""Create dependency-free browser prototypes. No package manager or network needed."""
from pathlib import Path
import hashlib,json
import xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parent
GAMES={'lab': ('wonder-lab-adventures', 'Wonder Lab Adventures')}
def read(p):return (ROOT/p).read_text(encoding='utf-8')
(ROOT/'play').mkdir(parents=True, exist_ok=True)
for key,(slug,title) in GAMES.items():
    css=read('shared/style.css')+'\n'+read(f'games/{key}.css')
    reward_art={}
    for asset in sorted((ROOT/'art/rewards').glob('*.svg')):
        raw=asset.read_text(encoding='utf-8')
        tree=ET.fromstring(raw)
        for node in tree.iter():
            if node.tag.split('}')[-1] in ('script','foreignObject','image'):
                raise ValueError(f'Unsupported active/external SVG content: {asset.name}')
            for attr,value in node.attrib.items():
                if attr.lower().startswith('on') or ('href' in attr and not value.startswith('#')):
                    raise ValueError(f'Unsupported SVG reference: {asset.name}')
        reward_art[asset.stem]=raw
    required={'spark','mission','progression-hero','beam','mirror','relay','compare','angle','model','goggles','bot-mint','badge-orbit','bot-plum','moonlit','greenhouse','nova'}
    if required - reward_art.keys():
        raise ValueError('Missing reward artwork: '+', '.join(sorted(required-reward_art.keys())))
    art_js='globalThis.WonderRewardArt='+json.dumps(reward_art).replace('</script','<\\/script')+';'
    js='\n'.join([read('shared/core.js'),read('shared/art.js'),read('shared/ui.js'),art_js,read('games/progression.js'),read('games/save.js'),read(f'games/{key}.js')])
    html=f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="color-scheme" content="light dark"><meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; base-uri 'none'; form-action 'none'"><title>{title} — Play Prototype 01</title><style>{css}</style></head><body>{read(f'games/{key}.body.html')}<noscript><p>This prototype needs JavaScript enabled.</p></noscript><script>{js}</script></body></html>'''
    (ROOT/'play'/f'{slug}.html').write_text(html,encoding='utf-8')
print('Built Wonder Lab Adventures standalone prototype.')

(ROOT/"play/index.html").write_text((ROOT/"play/wonder-lab-adventures.html").read_text(), encoding="utf-8")
