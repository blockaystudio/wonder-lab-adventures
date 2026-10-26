#!/usr/bin/env python3
"""Real HTTP-origin regression tests; no substitute storage or app test hooks.

Install: python -m pip install -r tests/browser-requirements.txt
Browser: python -m playwright install chromium
Run: python tests/browser_lab.py
Or use CHROMIUM_EXECUTABLE=/usr/bin/chromium for an installed browser.
The preview is loopback-only, started and stopped by this script. Screenshots
and JSON results go to --output (default test-results/browser-lab).
"""
import argparse
import json
import os
from pathlib import Path
import socket
import subprocess
import sys
import time
import unittest
from urllib.request import urlopen

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
KEY = 'kidslab.v1.wonder-lab-adventures'
SOLUTIONS = [['/', '/'], ['\\', '\\'], ['\\', '/', '\\', '/']]
NAMES = ['A little reflection', 'Take the lower path', 'The long way around']
OUTPUT = ROOT / 'test-results/browser-lab'


class BrowserLab(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        OUTPUT.mkdir(parents=True, exist_ok=True)
        with socket.socket() as sock:
            sock.bind(('127.0.0.1', 0))
            port = sock.getsockname()[1]
        cls.origin = f'http://127.0.0.1:{port}'
        cls.server = subprocess.Popen(
            [sys.executable, 'server/serve_preview.py', '--port', str(port)],
            cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
        try:
            deadline = time.monotonic() + 10
            while True:
                try:
                    with urlopen(cls.origin, timeout=1) as response:
                        if response.status == 200:
                            break
                except OSError:
                    if cls.server.poll() is not None or time.monotonic() > deadline:
                        raise RuntimeError('Local HTTP preview did not start')
                    time.sleep(.05)
            cls.playwright = sync_playwright().start()
            launch = {'headless': True, 'args': ['--no-sandbox']}
            if os.environ.get('CHROMIUM_EXECUTABLE'):
                launch['executable_path'] = os.environ['CHROMIUM_EXECUTABLE']
            cls.browser = cls.playwright.chromium.launch(**launch)
            cls.browser_version = cls.browser.version
            print(f'Chromium {cls.browser_version}; real HTTP preview; Python {sys.version.split()[0]}')
        except BaseException:
            cls.server.terminate()
            cls.server.wait(timeout=5)
            raise

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()
        cls.server.terminate()
        cls.server.wait(timeout=5)
        cls.server.stderr.close()

    def setUp(self):
        self.contexts = []
        self.errors = []
        self.requests = []
        self.page = self.new_page()

    def new_page(self, **options):
        context = self.browser.new_context(
            viewport=options.pop('viewport', {'width': 1280, 'height': 900}),
            reduced_motion=options.pop('reduced_motion', 'reduce'), **options)
        self.contexts.append(context)

        def request_seen(request):
            self.requests.append(request.url)
            if not request.url.startswith(self.origin + '/'):
                self.errors.append('Unexpected request: ' + request.url)

        context.on('request', request_seen)
        context.on('requestfailed', lambda request: self.errors.append(
            'Failed request: ' + request.url + ': ' + str(request.failure)))
        page = context.new_page()
        page.set_default_timeout(3000)
        page.on('pageerror', lambda error: self.errors.append('Page error: ' + str(error)))
        page.on('console', lambda msg: self.errors.append('Console error: ' + msg.text)
                if msg.type == 'error' else None)
        page.on('websocket', lambda ws: self.errors.append('Unexpected WebSocket: ' + ws.url))
        return page

    def tearDown(self):
        for context in self.contexts:
            context.close()
        self.assertEqual(self.errors, [], '\n'.join(self.errors))

    def open(self, page=None):
        page = page or self.page
        response = page.goto(self.origin + '/', wait_until='load')
        self.assertEqual(response.status, 200)
        self.assertTrue(page.locator('#send-light').is_visible())
        self.idle(page)
        self.assertIn("connect-src 'none'", page.locator('meta[http-equiv="Content-Security-Policy"]').get_attribute('content'))
        return page

    def idle(self, page=None):
        page = page or self.page
        if page.evaluate("typeof WonderSave !== 'undefined'"):
            page.wait_for_selector('body[data-save-ready="true"]')

    def data(self, page=None):
        self.idle(page)
        return (page or self.page).evaluate('(key) => JSON.parse(localStorage.getItem(key)).data', KEY)

    def activate(self, locator, mode='mouse'):
        if mode == 'touch':
            locator.tap()
        elif mode == 'keyboard':
            locator.focus()
            locator.press('Enter')
        else:
            locator.click()
        self.idle(locator.page)

    def select(self, index, page=None, mode='mouse'):
        self.activate((page or self.page).locator(f'[data-puzzle="{index}"]'), mode)

    def align(self, index, page=None, mode='mouse'):
        page = page or self.page
        for mirror, expected in enumerate(SOLUTIONS[index]):
            locator = page.locator(f'[data-mirror="{mirror}"]')
            actual = '\\' if 'backslash' in (locator.get_attribute('class') or '') else '/'
            if actual != expected:
                self.activate(locator, mode)

    def solve(self, index, page=None, mode='mouse'):
        page = page or self.page
        self.select(index, page, mode)
        self.align(index, page, mode)
        self.activate(page.locator('#send-light'), mode)
        self.assertTrue(page.locator('.light-goal.lit').is_visible())
        self.assertIn('Aha!', page.locator('#lab-message').inner_text())

    def complete_loop(self, mode, viewport):
        page = self.new_page(viewport=viewport, has_touch=mode == 'touch', is_mobile=mode == 'touch')
        self.open(page)
        for index in range(3):
            with self.subTest(puzzle=index + 1, input=mode):
                self.select(index, page, mode)
                self.activate(page.locator('#send-light'), mode)
                self.assertEqual(page.locator('.light-goal.lit').count(), 0)
                self.assertEqual(self.data(page)['solved'], list(range(index)))
                self.assertTrue(page.locator('#ray path').is_visible())
                self.align(index, page, mode)
                self.activate(page.locator('#send-light'), mode)
                self.assertTrue(page.locator('.light-goal.lit').is_visible())
                self.assertEqual(self.data(page)['orientations'][index], SOLUTIONS[index])
                self.assertEqual(self.data(page)['solved'], list(range(index + 1)))
                attempts = self.data(page)['attempts'][index]
                self.activate(page.locator('#discoveries'), mode)
                self.assertEqual(page.locator('.discovery').count(), index + 1)
                self.assertIn(NAMES[index], page.locator('.modal').inner_text())
                self.activate(page.get_by_role('button', name='Close dialog'), mode)
                page.reload(wait_until='load')
                self.assertEqual(self.data(page)['puzzle'], index)
                self.assertEqual(self.data(page)['orientations'][index], SOLUTIONS[index])
                self.assertEqual(self.data(page)['solved'], list(range(index + 1)))
                self.assertEqual(self.data(page)['attempts'][index], attempts)
                self.assertTrue(page.locator('.light-goal.lit').is_visible(), 'Recovered solved board should show its traced path')
                self.assertTrue(page.locator('#ray path').is_visible())
                self.activate(page.locator('#send-light'), mode)
                self.assertEqual(self.data(page)['solved'].count(index), 1)
                self.assertEqual(self.data(page)['attempts'][index], attempts + 1)
        page.screenshot(path=str(OUTPUT / f'loop-{mode}.png'), full_page=True)

    def test_loop_mouse_all_three_puzzles(self):
        self.complete_loop('mouse', {'width': 1280, 'height': 900})

    def test_loop_touch_all_three_puzzles(self):
        self.complete_loop('touch', {'width': 390, 'height': 844})

    def test_loop_keyboard_all_three_puzzles(self):
        self.complete_loop('keyboard', {'width': 1024, 'height': 768})

    def test_keyboard_space_and_focus_survive_repeated_rotations(self):
        page = self.open()
        mirror = page.locator('[data-mirror="0"]')
        initial = self.data()['orientations'][0]
        mirror.focus()
        for _ in range(10):
            page.keyboard.press('Space')
            self.idle(page)
            self.assertEqual(page.locator(':focus').get_attribute('data-mirror'), '0')
        self.assertEqual(self.data()['orientations'][0], initial)
        page.keyboard.press('Tab')
        self.idle(page)
        self.assertEqual(page.locator(':focus').get_attribute('id'), 'send-light')
        page.keyboard.press('Shift+Tab')
        self.idle(page)
        self.assertEqual(page.locator(':focus').get_attribute('data-mirror'), '0')
        page.locator('[data-mirror="1"]').focus()
        page.keyboard.press('Enter')
        self.idle(page)
        self.assertNotEqual(self.data()['orientations'][0], initial)
        self.activate(page.locator('#send-light'))
        self.assertEqual(page.locator('.light-goal.lit').count(), 0)

    def test_local_attempt_hint_and_reset(self):
        page = self.open()
        self.activate(page.locator('#send-light'))
        self.assertEqual(page.locator('.mirror.hint').count(), 0)
        self.activate(page.locator('#send-light'))
        self.assertEqual(page.locator('.mirror.hint').get_attribute('data-mirror'), '0')
        self.assertIn('mirror A', page.locator('#robot-note').inner_text())
        old_hint = page.locator('#robot-note').inner_text()
        page.reload()
        self.assertEqual(self.data()['attempts'][0], 2)
        self.activate(page.locator('#reset-puzzle'))
        self.assertEqual(self.data()['attempts'][0], 0)
        self.assertEqual(page.locator('.mirror.hint').count(), 0)
        self.assertNotEqual(page.locator('#robot-note').inner_text(), old_hint)
        self.activate(page.locator('#send-light'))
        self.assertEqual(page.locator('.mirror.hint').count(), 0)

    def test_hint_text_clears_on_reset(self):
        page = self.open()
        self.activate(page.locator('#hint'))
        hint = page.locator('#robot-note').inner_text()
        self.activate(page.locator('#reset-puzzle'))
        self.assertNotEqual(page.locator('#robot-note').inner_text(), hint)

    def test_hint_text_matches_current_puzzle_and_rotation(self):
        page = self.open()
        self.select(2)
        for index in range(3):
            self.activate(page.locator(f'[data-mirror="{index}"]'))
        self.activate(page.locator('#hint'))
        self.assertIn('mirror D', page.locator('#robot-note').inner_text())
        self.assertEqual(page.locator('.mirror.hint').get_attribute('data-mirror'), '3')
        self.select(0)
        self.assertNotIn('mirror D', page.locator('#robot-note').inner_text())
        self.activate(page.locator('#hint'))
        self.assertIn('mirror A', page.locator('#robot-note').inner_text())
        self.activate(page.locator('[data-mirror="0"]'))
        self.assertNotIn('turn it once', page.locator('#robot-note').inner_text().lower())
        self.assertEqual(page.locator('.mirror.hint').count(), 0)

    def test_rotation_clears_stale_win_but_keeps_discovery(self):
        page = self.open()
        self.solve(0)
        self.activate(page.locator('[data-mirror="0"]'))
        self.assertEqual(page.locator('.light-goal.lit').count(), 0)
        self.assertEqual(page.locator('#ray path').count(), 0)
        self.assertNotIn('Aha!', page.locator('#lab-message').inner_text())
        self.assertNotIn('You found a path!', page.locator('#robot-note').inner_text())
        self.assertFalse(page.locator('#next-puzzle').is_visible())
        self.assertEqual(self.data()['solved'], [0])
        page.reload()
        self.assertEqual(page.locator('.light-goal.lit').count(), 0)
        self.assertEqual(self.data()['solved'], [0])

    def test_next_puzzle_resets_feedback(self):
        page = self.open()
        self.solve(0)
        message = page.locator('#robot-note').inner_text()
        self.activate(page.locator('#next-puzzle'))
        self.assertEqual(page.locator('#puzzle-title').inner_text(), NAMES[1])
        self.assertNotEqual(page.locator('#robot-note').inner_text(), message)
        self.assertEqual(page.locator('#ray path').count(), 0)

    def test_noncolor_path_description_and_reduced_motion(self):
        page = self.open()
        self.assertTrue(page.locator('#path-description').is_visible())
        self.activate(page.locator('#send-light'))
        description = page.locator('#path-description').inner_text().lower()
        self.assertIn('source', description)
        self.assertIn('mirror a', description)
        self.assertIn('bottom board edge', description)
        self.assertIn('lamp not lit', description)
        self.solve(2)
        description = page.locator('#path-description').inner_text().lower()
        self.assertIn('lamp', description)
        for letter in 'abcd':
            self.assertIn('mirror ' + letter, description)
        self.assertEqual(page.locator('#ray path').first.evaluate('(el) => getComputedStyle(el).animationName'), 'none')
        self.assertEqual(page.locator('#robot-note').get_attribute('aria-live'), 'polite')
        page.screenshot(path=str(OUTPUT / 'path-description.png'), full_page=True)

    def test_phone_tablet_layout_and_controls(self):
        for width, height in [(320, 740), (390, 844), (768, 1024), (1024, 768)]:
            with self.subTest(viewport=f'{width}x{height}'):
                page = self.new_page(viewport={'width': width, 'height': height}, has_touch=True)
                self.open(page)
                self.solve(2, page, 'touch')
                self.assertLessEqual(page.evaluate('document.documentElement.scrollWidth'), width)
                for selector in ['#send-light', '#hint', '#reset-puzzle', '.mirror']:
                    for locator in page.locator(selector).all():
                        locator.scroll_into_view_if_needed()
                        bounds = locator.bounding_box()
                        self.assertTrue(locator.evaluate('el => {const r=el.getBoundingClientRect();const top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return top===el || el.contains(top)}'), 'Control center must be reachable without overlap')
                        self.assertGreaterEqual(bounds['width'], 44)
                        self.assertGreaterEqual(bounds['height'], 44)
                        self.assertTrue(locator.get_attribute('aria-label') or locator.inner_text())
                self.assertGreaterEqual(page.locator('#lab-message').evaluate('(el) => parseFloat(getComputedStyle(el).fontSize)'), 12)
                page.screenshot(path=str(OUTPUT / f'layout-{width}x{height}.png'), full_page=True)

    def test_fresh_context_has_no_saved_profile(self):
        self.open()
        self.solve(0)
        second = self.new_page()
        self.open(second)
        self.assertEqual(self.data(second)['solved'], [])
        self.assertEqual(self.data()['solved'], [0])

    def test_malformed_unknown_and_invalid_saves(self):
        page = self.open()
        values = ['{broken', json.dumps({'schema': 99, 'game': 'wonder-lab-adventures', 'data': {}}),
                  json.dumps({'schema': 1, 'game': 'wonder-lab-adventures', 'data': {
                      'puzzle': 999, 'orientations': ['garbage'], 'attempts': [-20, 'bad'],
                      'solved': [0, 0, -1, 90, '1'], 'visits': -1}})]
        for index, raw in enumerate(values):
            with self.subTest(save=index):
                page.evaluate('([key, raw]) => {localStorage.clear();localStorage.setItem(key, raw)}', [KEY, raw])
                page.reload()
                self.assertTrue(page.locator('#send-light').is_visible())
                data = self.data()
                self.assertIn(data['puzzle'], [0, 1, 2])
                self.assertEqual(data['attempts'], [0, 0, 0])
                self.assertEqual(data['solved'], [0] if index == 2 else [])
                self.activate(page.locator('#send-light'))
                self.assertEqual(page.locator('.light-goal.lit').count(), 0)

    def test_valid_backup_recovers_discovery(self):
        page = self.open()
        self.solve(0)
        self.activate(page.locator('#send-light'))  # both primary and backup now contain discovery
        page.evaluate('(key) => localStorage.setItem(key, "{broken")', KEY)
        page.reload()
        self.assertEqual(self.data()['solved'], [0])
        self.assertIn('Recovered', page.locator('#save-status').inner_text())
        self.activate(page.locator('#discoveries'))
        self.assertEqual(page.locator('.discovery').count(), 1)

    def test_unavailable_storage_remains_playable(self):
        page = self.page
        page.add_init_script("Object.defineProperty(window, 'localStorage', {get(){throw new DOMException('Blocked', 'SecurityError')}})")
        self.open()
        self.assertIn('visit only', page.locator('#save-status').inner_text())
        self.solve(0)
        self.activate(page.locator('#discoveries'))
        self.assertEqual(page.locator('.discovery').count(), 1)
        self.activate(page.get_by_role('button', name='Close dialog'))
        page.reload()
        self.assertIn('0/6', page.locator('#discoveries').inner_text())

    def test_storage_quota_failure_remains_playable(self):
        page = self.page
        page.add_init_script("Storage.prototype.setItem = function(){throw new DOMException('Full', 'QuotaExceededError')}")
        self.open()
        self.assertIn('cannot save', page.locator('#save-status').inner_text())
        self.solve(1)
        self.activate(page.locator('#discoveries'))
        self.assertEqual(page.locator('.discovery').count(), 1)

    def test_play_continues_when_browser_is_offline(self):
        page = self.open()
        page.context.set_offline(True)
        for index in range(3):
            self.solve(index)
        self.assertEqual(self.data()['solved'], [0, 1, 2])
        self.activate(page.locator('#discoveries'))
        self.assertEqual(page.locator('.discovery').count(), 3)


class JsonResult(unittest.TextTestResult):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.records = []

    def addSuccess(self, test):
        super().addSuccess(test)
        self.records.append({'test': test.id(), 'status': 'passed'})

    def addFailure(self, test, err):
        super().addFailure(test, err)
        self.records.append({'test': test.id(), 'status': 'failed', 'detail': self._exc_info_to_string(err, test)})

    def addError(self, test, err):
        super().addError(test, err)
        self.records.append({'test': test.id(), 'status': 'error', 'detail': self._exc_info_to_string(err, test)})

    def addSubTest(self, test, subtest, err):
        super().addSubTest(test, subtest, err)
        if err is not None:
            self.records.append({'test': subtest.id(), 'status': 'failed', 'detail': self._exc_info_to_string(err, subtest)})


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=OUTPUT)
    parser.add_argument('--root', type=Path, default=ROOT, help='Source checkout whose play/ is served')
    args = parser.parse_args()
    ROOT = args.root.resolve()
    OUTPUT = args.output.resolve()
    OUTPUT.mkdir(parents=True, exist_ok=True)
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(BrowserLab)
    result = unittest.TextTestRunner(verbosity=2, resultclass=JsonResult).run(suite)
    (OUTPUT / 'results.json').write_text(json.dumps({
        'browser': getattr(BrowserLab, 'browser_version', 'unavailable'),
        'python': sys.version.split()[0], 'tests_run': result.testsRun,
        'failures': len(result.failures), 'errors': len(result.errors),
        'success': result.wasSuccessful(), 'results': result.records,
        'limits': 'Desktop headless Chromium and emulated touch only. No physical device, child usability or learning-outcome testing.'
    }, indent=2) + '\n')
    sys.exit(0 if result.wasSuccessful() else 1)
