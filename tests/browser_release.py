#!/usr/bin/env python3
"""REL-01 regressions against the real local HTTP preview and browser storage.

Run with the pinned Python/Playwright dependencies and Chromium installed:
  python tests/browser_release.py --output test-results/browser-release
The rollback test reads the actual committed OPT-01 page using git show;
checkouts must include commit 80e86ad (CI uses fetch-depth: 0).
No app test hooks, replacement storage, remote resources or real player data.
Only the named failure tests inject browser API failures.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import unittest

from playwright.sync_api import Error, expect

import browser_lab as base
from browser_progression import ProgressionBrowser

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'test-results/browser-release'
LEGACY_COMMIT = '80e86ad49d2c8065f4460e9b5b4d49385c6bbfc0'
OBSERVATIONS = {}


class ReleaseBrowser(ProgressionBrowser):
    """Only test_release_* methods are selected by this file's runner."""

    def open(self, page=None):
        page = super().open(page)
        if page.evaluate('typeof WonderSave !== "undefined"'):
            expect(page.locator('body')).to_have_attribute('data-save-ready', 'true')
        return page

    def settled(self, page):
        if page.evaluate('typeof WonderSave !== "undefined"'):
            expect(page.locator('body')).to_have_attribute('data-save-ready', 'true')

    def tearDown(self):
        OBSERVATIONS.setdefault('ordinary_browser_events', {})[self._testMethodName] = {
            'local_requests': len(self.requests), 'errors': list(self.errors)}
        super().tearDown()

    def watch_context(self, context):
        def request_seen(request):
            self.requests.append(request.url)
            if not request.url.startswith(self.origin + '/'):
                self.errors.append('Unexpected request: ' + request.url)
        context.on('request', request_seen)
        context.on('requestfailed', lambda request: self.errors.append(
            'Failed request: ' + request.url + ': ' + str(request.failure)))
        return context

    def watch_page(self, page):
        page.set_default_timeout(5000)
        page.on('pageerror', lambda error: self.errors.append('Page error: ' + str(error)))
        page.on('console', lambda msg: self.errors.append('Console error: ' + msg.text)
                if msg.type == 'error' else None)
        page.on('websocket', lambda ws: self.errors.append('Unexpected WebSocket: ' + ws.url))
        return page

    def sibling(self, page=None):
        return self.open(self.watch_page((page or self.page).context.new_page()))

    def parent_controls(self, page=None):
        page = page or self.page
        self.activate(page.locator('#parents'))
        question = page.locator('label[for="gate-answer"]').inner_text()
        page.locator('#gate-answer').fill(str(sum(map(int, re.findall(r'\d+', question)))))
        self.activate(page.locator('#gate-form button'))

    def request_erase(self, page=None):
        page = page or self.page
        self.parent_controls(page)
        self.activate(page.locator('#erase'))
        page.locator('#confirm').click()

    def earn_review_and_goggles(self, page=None):
        page = page or self.page
        self.solve(0, page)
        self.notebook(page)
        self.activate(page.locator('[data-review="beam"]'))
        self.close_dialog(page)
        self.hub(page)
        self.activate(page.locator('[data-equip="goggles"]'))
        self.close_dialog(page)
        expect(page.locator('#spark-count')).to_have_text('30')

    def test_release_stale_tab_cannot_overwrite_earned_progress(self):
        first = self.open()
        stale = self.sibling(first)  # both pages loaded before any discoveries
        first.reload()  # allow a newer visit counter without rejecting the first action
        self.earn_review_and_goggles(first)
        stale.locator('#send-light').click()
        self.settled(stale)
        first.reload()
        after = self.data(first)
        OBSERVATIONS['stale_writer'] = {'points': self.points(first), 'data': after,
                                        'stale_status': stale.locator('#save-status').inner_text()}
        self.assertIn(0, after['solved'], 'A stale tab must not remove another tab\'s solve')
        self.assertIn('beam', after['progress']['reviews'])
        self.assertEqual(after['progress']['equipped']['cosmetic'], 'goggles')
        self.assertGreaterEqual(self.points(first), 30)
        # A rejected update must be visible; a successful merge retains its trace.
        initial_mask = 2  # puzzle 0 initial mirrors are backslash, slash
        if initial_mask not in after['progress']['traces'][0]:
            self.assertRegex(stale.locator('#save-status').inner_text().lower(),
                             r'another|newer|conflict|reload|refresh')

    def test_release_erasure_invalidates_stale_tab(self):
        first = self.open()
        self.earn_review_and_goggles(first)
        stale = self.sibling(first)
        self.request_erase(first)
        expect(first.locator('#spark-count')).to_have_text('0')
        stale.locator('#send-light').click()
        self.settled(stale)
        first.reload()
        OBSERVATIONS['erase_stale_writer'] = {'points': self.points(first), 'data': self.data(first),
                                             'stale_status': stale.locator('#save-status').inner_text()}
        self.assertEqual(self.data(first)['solved'], [], 'Erased discoveries must not return from an old tab')
        self.assertEqual(self.data(first)['progress']['reviews'], [])
        self.assertEqual(self.points(first), 0)
        self.assertEqual(first.locator('#robot-art').get_attribute('data-cosmetic'), 'classic')

    def test_release_two_tabs_keep_both_puzzle_discoveries(self):
        first = self.open()
        second = self.sibling(first)
        self.solve(0, first)
        self.solve(1, second)
        first.reload()
        self.assertEqual(self.data(first)['solved'], [0, 1])
        self.assertEqual(self.points(first), 54)
        second.reload()
        self.assertEqual(self.data(second)['solved'], [0, 1])
        self.assertEqual(self.points(second), 54)
        OBSERVATIONS['two_tab_discoveries'] = {'solved': [0, 1], 'points': 54}

    def test_release_conflicting_mirror_changes_refresh_and_can_retry(self):
        first = self.open()
        self.select(2, first)
        stale = self.sibling(first)
        first.locator('[data-mirror="0"]').click()
        self.settled(first)
        saved = self.data(first)['orientations'][2]
        stale.locator('[data-mirror="1"]').click()
        self.settled(stale)
        self.assertEqual(self.data(stale)['orientations'][2], saved)
        self.assertRegex(stale.locator('#save-status').inner_text().lower(), r'another tab|conflict')
        self.assertIn('not saved', stale.locator('#save-status').inner_text().lower())
        stale.screenshot(path=str(OUTPUT / 'tab-conflict.png'), full_page=True)
        stale.locator('[data-mirror="1"]').click()
        self.settled(stale)
        retried = self.data(stale)['orientations'][2]
        self.assertEqual(retried[0], saved[0])
        self.assertNotEqual(retried[1], saved[1])
        first.reload()
        self.assertEqual(self.data(first)['orientations'][2], retried)
        OBSERVATIONS['choice_conflict'] = {'rejected_visibly': True, 'retry_applied': True}

    def hold_native_save_lock(self, page):
        page.evaluate("""() => {
            navigator.locks.request('wonder-lab-adventures:progress', () =>
                new Promise(resolve => {window.releaseTestLock = resolve}));
        }""")
        page.wait_for_function('() => typeof window.releaseTestLock === "function"')

    def test_release_queued_native_lock_writers_keep_both_solves(self):
        first = self.open()
        self.align(0, first)
        second = self.sibling(first)
        self.select(1, second)
        self.align(1, second)
        self.hold_native_save_lock(first)
        try:
            # Queue both actual button actions behind a real browser Web Lock.
            first.locator('#send-light').click()
            expect(first.locator('body')).to_have_attribute('data-save-ready', 'false')
            expect(first.locator('main')).to_have_attribute('aria-busy', 'true')
            expect(first.locator('#send-light')).to_have_attribute('aria-disabled', 'true')
            expect(first.locator('#save-warning')).to_be_visible()
            expect(first.locator('#save-warning')).to_contain_text('Please wait a moment')
            self.assertEqual(first.evaluate('document.activeElement.id'), 'send-light')
            first.keyboard.press('Enter')  # pending action is visibly unavailable
            second.locator('#send-light').click()
            expect(second.locator('body')).to_have_attribute('data-save-ready', 'false')
            expect(second.locator('#send-light')).to_have_attribute('aria-disabled', 'true')
            first.screenshot(path=str(OUTPUT / 'save-waiting-for-lock.png'), full_page=True)
        finally:
            first.evaluate('window.releaseTestLock()')
        self.settled(first)
        self.settled(second)
        expect(first.locator('#send-light')).to_be_enabled()
        expect(second.locator('#send-light')).to_be_enabled()
        first.reload()
        self.assertEqual(self.data(first)['solved'], [0, 1])
        self.assertEqual(self.data(first)['attempts'], [1, 1, 0])
        self.assertEqual(self.points(first), 54)
        second.reload()
        self.assertEqual(self.data(second)['solved'], [0, 1])
        OBSERVATIONS['native_write_contention'] = {'queued_writes': 2, 'solved': [0, 1], 'points': 54}

    def test_release_queued_erase_invalidates_waiting_native_writer(self):
        first = self.open()
        self.earn_review_and_goggles(first)
        stale = self.sibling(first)
        self.parent_controls(first)
        first.locator('#erase').click()
        self.hold_native_save_lock(first)
        try:
            first.locator('#confirm').click()  # erase queued first
            expect(first.locator('#confirm')).to_be_disabled()
            stale.locator('#send-light').click()  # old-generation save queued second
            expect(stale.locator('body')).to_have_attribute('data-save-ready', 'false')
        finally:
            first.evaluate('window.releaseTestLock()')
        self.settled(stale)
        expect(first.locator('#spark-count')).to_have_text('0')
        first.reload()
        self.assertEqual(self.data(first)['solved'], [])
        self.assertEqual(self.points(first), 0)
        self.assertRegex(stale.locator('#save-status').inner_text().lower(), r'erased|another tab')
        OBSERVATIONS['native_erase_contention'] = {'waiting_old_writer_rejected': True, 'points': 0}

    def test_release_stale_trace_after_other_tab_selects_another_puzzle(self):
        first = self.open()
        second = self.sibling(first)
        self.select(1, second)
        first.locator('#send-light').click()
        self.settled(first)
        self.assertEqual(self.data(first)['puzzle'], 1)
        self.assertEqual(first.locator('#puzzle-title').inner_text(), base.NAMES[1])
        self.assertEqual(self.points(first), 2)
        self.assertEqual(self.data(first)['progress']['traces'][0], [2])
        self.assertEqual(first.locator('.light-goal.lit').count(), 0)
        self.assertEqual(first.locator('#ray path').count(), 0)
        OBSERVATIONS['stale_different_board_trace'] = {'current_puzzle': 1, 'earned_trace_puzzle': 0, 'points': 2}

    def test_release_backup_delete_failure_is_visible_and_retryable(self):
        page = self.open()
        self.earn_review_and_goggles(page)
        self.activate(page.locator('#send-light'))  # backup includes earned progress
        page.evaluate("""() => {
            const remove = Storage.prototype.removeItem;
            window.restoreRemoval = () => {Storage.prototype.removeItem = remove};
            Storage.prototype.removeItem = function (key) {
                if (key.endsWith('.backup')) throw new DOMException('Blocked', 'SecurityError');
                return remove.call(this, key);
            };
        }""")
        self.request_erase(page)
        expect(page.locator('[role="dialog"]')).to_contain_text(re.compile(r'could not|cannot|failed|unable', re.I))
        expect(page.locator('#cancel')).to_have_text('Close')
        expect(page.locator('#confirm')).to_have_text('Retry erasing')
        dialog_text = page.locator('[role="dialog"]').inner_text()
        OBSERVATIONS['failed_erase'] = {'dialog': dialog_text, 'points': self.points(page)}
        self.assertNotRegex(dialog_text.lower(), r'erased successfully|progress has been erased')
        page.screenshot(path=str(OUTPUT / 'erase-failure.png'))
        page.evaluate('window.restoreRemoval()')
        with page.expect_navigation(wait_until='load'):
            page.locator('#confirm').click()
        self.settled(page)
        expect(page.locator('#spark-count')).to_have_text('0')
        self.assertIsNone(page.evaluate('(key) => localStorage.getItem(key + ".backup")', base.KEY))
        page.reload()
        self.assertEqual(self.points(page), 0)
        self.assertEqual(self.data(page)['solved'], [])

    def test_release_rollback_round_trip_preserves_progression(self):
        page = self.open()
        self.earn_review_and_goggles(page)
        before = self.data(page)
        old = subprocess.check_output(['git', 'show', LEGACY_COMMIT + ':play/index.html'], cwd=ROOT)
        old_url = self.origin + '/rel01-legacy.html'
        page.route(old_url, lambda route: route.fulfill(status=200, content_type='text/html', body=old,
                                                       headers={'Cache-Control': 'no-store'}))
        response = page.goto(old_url)
        self.assertEqual(response.status, 200)
        # The actual old normalizer writes immediately and on interaction.
        self.assertEqual(page.locator('#spark-count').count(), 0)
        page.locator('#send-light').click()
        page.goto(self.origin + '/')
        self.settled(page)
        after = self.data(page)
        OBSERVATIONS['rollback'] = {'legacy_commit': LEGACY_COMMIT,
                                    'legacy_sha256': hashlib.sha256(old).hexdigest(),
                                    'before': before, 'after': after, 'points': self.points(page)}
        self.assertEqual(after['solved'], before['solved'])
        self.assertEqual(after['progress'], before['progress'])
        self.assertEqual(self.points(page), 30)
        self.assertEqual(page.locator('#robot-art').get_attribute('data-cosmetic'), 'goggles')

    def test_release_puzzle_keyboard_selection_keeps_focus_and_tab_order(self):
        page = self.open()
        page.locator('[data-puzzle="1"]').focus()
        page.keyboard.press('Enter')
        self.settled(page)
        self.assertEqual(page.evaluate('document.activeElement.dataset.puzzle'), '1')
        page.keyboard.press('Tab')
        self.assertEqual(page.locator(':focus').get_attribute('data-puzzle'), '2')
        page.keyboard.press('Space')
        self.settled(page)
        self.assertEqual(page.locator(':focus').get_attribute('data-puzzle'), '2')
        page.keyboard.press('Shift+Tab')
        self.assertEqual(page.locator(':focus').get_attribute('data-puzzle'), '1')
        OBSERVATIONS['keyboard_selection'] = {'focus': page.locator(':focus').get_attribute('data-puzzle'),
                                              'selected': self.data(page)['puzzle']}

    def test_release_persistent_browser_close_relaunch(self):
        with tempfile.TemporaryDirectory(prefix='wonder-release-profile-') as profile:
            options = {'headless': True, 'args': ['--no-sandbox'], 'reduced_motion': 'reduce'}
            if os.environ.get('CHROMIUM_EXECUTABLE'):
                options['executable_path'] = os.environ['CHROMIUM_EXECUTABLE']
            context = self.watch_context(self.playwright.chromium.launch_persistent_context(profile, **options))
            try:
                page = self.watch_page(context.pages[0])
                self.open(page)
                self.earn_review_and_goggles(page)
                before = self.data(page)
            finally:
                context.close()
            context = self.watch_context(self.playwright.chromium.launch_persistent_context(profile, **options))
            try:
                page = self.watch_page(context.pages[0])
                self.open(page)
                after = self.data(page)
                self.assertEqual(after['solved'], before['solved'])
                self.assertEqual(after['orientations'], before['orientations'])
                self.assertEqual(after['progress'], before['progress'])
                self.assertEqual(self.points(page), 30)
                self.assertTrue(page.locator('.light-goal.lit').is_visible())
                OBSERVATIONS['persistent_relaunch'] = {'before_points': 30, 'after_points': self.points(page),
                                                       'progress_equal': before['progress'] == after['progress']}
            finally:
                context.close()

    def test_release_page_close_during_unfinished_experiment_recovers_last_action(self):
        page = self.open()
        self.earn_review_and_goggles(page)
        self.select(2, page)
        self.activate(page.locator('[data-mirror="0"]'))
        before = self.data(page)
        context = page.context
        page.close()  # interrupt before sending the light; no completion invented
        reopened = self.watch_page(context.new_page())
        self.open(reopened)
        self.assertEqual(self.data(reopened)['orientations'], before['orientations'])
        self.assertEqual(self.data(reopened)['progress'], before['progress'])
        self.assertEqual(self.data(reopened)['solved'], [0])
        self.assertEqual(reopened.locator('.light-goal.lit').count(), 0)
        self.align(2, reopened)
        self.activate(reopened.locator('#send-light'))
        self.assertEqual(self.data(reopened)['solved'], [0, 2])
        OBSERVATIONS['interrupted_experiment'] = {'uncompleted_solve_not_invented': True,
                                                 'last_rotation_recovered': True}

    def test_release_renderer_crash_recovers_committed_progress(self):
        page = self.open()
        self.earn_review_and_goggles(page)
        before = self.data(page)
        # Debug-URL navigation can be disabled by the browser environment.
        # Send Page.crash through a separate non-flattened target session: the
        # outer command acknowledges delivery without awaiting the reply from
        # the renderer it just killed. Still require the real crash event.
        target_session = page.context.new_cdp_session(page)
        target_id = target_session.send('Target.getTargetInfo')['targetInfo']['targetId']
        target_session.detach()
        browser_session = self.browser.new_browser_cdp_session()
        try:
            attached = browser_session.send('Target.attachToTarget', {'targetId': target_id, 'flatten': False})
            with page.expect_event('crash', timeout=5000):
                browser_session.send('Target.sendMessageToTarget', {
                    'sessionId': attached['sessionId'],
                    'message': json.dumps({'id': 1, 'method': 'Page.crash'})})
        finally:
            browser_session.detach()
        recovered = self.watch_page(page.context.new_page())
        self.open(recovered)
        after = self.data(recovered)
        self.assertEqual(after['solved'], before['solved'])
        self.assertEqual(after['progress'], before['progress'])
        self.assertEqual(self.points(recovered), 30)
        OBSERVATIONS['renderer_crash'] = {'trigger': 'CDP Page.crash via non-flattened Target session',
                                          'crash_event_observed': True, 'committed_progress_recovered': True,
                                          'limit': 'Chromium renderer crash, not OS power loss or mobile process eviction'}

    def test_release_without_write_locks_is_explicitly_visit_only(self):
        page = self.page
        page.add_init_script("Object.defineProperty(navigator, 'locks', {value: undefined})")
        self.open(page)
        self.solve(0, page)
        self.assertEqual(self.points(page), 27)
        self.assertRegex(page.locator('#save-status').inner_text().lower(), r'visit only|this visit|cannot save')
        page.reload()
        expect(page.locator('#spark-count')).to_have_text('0')
        OBSERVATIONS['unsupported_lock_api'] = {'persistent_write': 'disabled', 'continued_play': 'passed'}

    def test_release_offline_continuation_and_cold_start_are_distinct(self):
        # Keep expected network failures out of the ordinary error-free contexts.
        context = self.browser.new_context(reduced_motion='reduce')
        page = context.new_page()
        try:
            self.open(page)
            context.set_offline(True)
            self.solve(0, page)
            self.assertEqual(self.points(page), 27)
            with self.assertRaises(Error) as failure:
                page.reload(wait_until='load', timeout=5000)
            self.assertIn('ERR_INTERNET_DISCONNECTED', str(failure.exception))
            reload_error = str(failure.exception).split('\n')[0]
        finally:
            context.close()
        context = self.browser.new_context(offline=True)
        try:
            page = context.new_page()
            with self.assertRaises(Error) as failure:
                page.goto(self.origin + '/', wait_until='load', timeout=5000)
            self.assertIn('ERR_INTERNET_DISCONNECTED', str(failure.exception))
            OBSERVATIONS['offline'] = {'continued_play': 'passed',
                                       'cold_reload': 'blocked: ' + reload_error,
                                       'fresh_context_start': 'blocked: ' + str(failure.exception).split('\n')[0]}
        finally:
            context.close()

    def test_release_phone_tablet_targets_and_reduced_motion(self):
        for width, height in [(320, 740), (390, 844), (844, 390), (768, 1024), (1024, 768)]:
            with self.subTest(viewport=f'{width}x{height}'):
                page = self.new_page(viewport={'width': width, 'height': height}, has_touch=True,
                                     reduced_motion='reduce')
                self.open(page)
                page.screenshot(path=str(OUTPUT / f'first-view-{width}x{height}.png'))
                self.solve(2, page, 'touch')
                self.assertLessEqual(page.evaluate('document.documentElement.scrollWidth'), width)
                for selector in ['#send-light', '#hint', '#reset-puzzle', '.mirror']:
                    for control in page.locator(selector).all():
                        control.scroll_into_view_if_needed()
                        rect = control.bounding_box()
                        self.assertGreaterEqual(rect['width'], 44)
                        self.assertGreaterEqual(rect['height'], 44)
                        self.assertTrue(control.evaluate('''el => {
                            const r = el.getBoundingClientRect();
                            const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
                            return hit === el || el.contains(hit);
                        }'''))
                self.assertEqual(page.locator('#ray path').evaluate('el => getComputedStyle(el).animationName'), 'none')
                self.assertIn('Lamp lit', page.locator('#path-description').inner_text())
                self.hub(page)
                dialog = page.locator('[role="dialog"]')
                self.assertLessEqual(dialog.evaluate('el => el.scrollWidth'), dialog.evaluate('el => el.clientWidth'))
                page.keyboard.press('Escape')
                self.assertEqual(page.locator(':focus').get_attribute('id'), 'open-goals')
                page.screenshot(path=str(OUTPUT / f'solved-{width}x{height}.png'), full_page=True)
        OBSERVATIONS['layouts'] = {'viewports': ['320x740', '390x844', '844x390', '768x1024', '1024x768'],
                                   'touch': 'emulated', 'motion_preference': 'reduce'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=OUTPUT)
    parser.add_argument('--root', type=Path, default=ROOT)
    parser.add_argument('--regressions-only', action='store_true', help='Run only the five pre-fix defects')
    args = parser.parse_args()
    ROOT, OUTPUT = args.root.resolve(), args.output.resolve()
    OUTPUT.mkdir(parents=True, exist_ok=True)
    base.ROOT, base.OUTPUT = ROOT, OUTPUT
    names = [name for name in unittest.defaultTestLoader.getTestCaseNames(ReleaseBrowser)
             if name.startswith('test_release_')]
    if args.regressions_only:
        names = [name for name in names if any(part in name for part in
                 ['stale_tab', 'backup_delete', 'rollback', 'puzzle_keyboard'])]
    suite = unittest.TestSuite(ReleaseBrowser(name) for name in names)
    result = unittest.TextTestRunner(verbosity=2, resultclass=base.JsonResult).run(suite)
    (OUTPUT / 'results.json').write_text(json.dumps({
        'browser': getattr(ReleaseBrowser, 'browser_version', 'unavailable'),
        'python': sys.version.split()[0], 'tests_run': result.testsRun,
        'failures': len(result.failures), 'errors': len(result.errors),
        'success': result.wasSuccessful(), 'results': result.records,
        'observations': OBSERVATIONS,
        'limits': 'Real HTTP origin and browser storage; headless desktop Chromium. Touch and viewports are emulated. No physical iOS/Android, child, learning-outcome or retention test. Cold HTTP offline startup remains unsupported.'
    }, indent=2) + '\n')
    sys.exit(0 if result.wasSuccessful() else 1)
