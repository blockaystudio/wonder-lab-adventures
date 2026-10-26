#!/usr/bin/env python3
"""Real-HTTP progression and artwork regressions using actual control actions.

Install tests/browser-requirements.txt and Playwright Chromium first. Run:
CHROMIUM_EXECUTABLE=/usr/bin/chromium python tests/browser_progression.py
The harness starts/stops a loopback preview. Successful progression uses real
localStorage. Only explicit failure and legacy-save tests inject storage setup.
No timing, player profiles, credentials, or application test hooks are used.
"""
import argparse
import json
from pathlib import Path
import re
import sys
import unittest

import browser_lab as base

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'test-results/browser-progression'
CARD_IDS = ['beam', 'mirror', 'relay', 'compare', 'angle', 'model']
REWARD_IDS = ['goggles', 'bot-mint', 'badge-orbit', 'bot-plum', 'moonlit', 'greenhouse', 'nova']
KEY = base.KEY


class ProgressionBrowser(base.BrowserLab):
    """Reuse HTTP/context/error helpers; the runner selects only new methods."""

    def points(self, page=None):
        self.idle(page)
        text = (page or self.page).locator('#spark-count').inner_text()
        self.assertRegex(text, r'\d+')
        return int(re.search(r'\d+', text).group())

    def close_dialog(self, page=None):
        page = page or self.page
        self.activate(page.get_by_role('button', name='Close dialog', exact=True))
        self.assertEqual(page.locator('[role="dialog"]').count(), 0)

    def hub(self, page=None):
        page = page or self.page
        self.activate(page.locator('#open-goals'))
        self.assertTrue(page.locator('.wonder-hub').is_visible())
        return page.locator('.wonder-hub')

    def notebook(self, page=None):
        page = page or self.page
        self.activate(page.locator('#discoveries'))
        self.assertEqual(page.locator('[data-card]').count(), 6)
        return page.locator('[role="dialog"]')

    def orient(self, puzzle, mask, page=None, mode='mouse'):
        page = page or self.page
        self.select(puzzle, page, mode)
        for index in range(4 if puzzle == 2 else 2):
            mirror = page.locator(f'[data-mirror="{index}"]')
            current = '\\' if 'backslash' in (mirror.get_attribute('class') or '') else '/'
            target = '/' if mask & (1 << index) else '\\'
            if current != target:
                self.activate(mirror, mode)

    def discover_everything(self, page=None):
        """Visit every finite arrangement through actual mirror controls."""
        page = page or self.page
        for puzzle, count in enumerate([4, 4, 16]):
            for mask in range(count):
                self.orient(puzzle, mask, page)
                self.activate(page.locator('#send-light'))
        self.notebook(page)
        self.assertEqual(page.locator('.discovery').count(), 6)
        for card in CARD_IDS:
            self.activate(page.locator(f'[data-review="{card}"]'))
        self.close_dialog(page)

    def test_progression_initial_collection_and_visible_goals(self):
        page = self.open()
        self.assertEqual(self.points(), 0)
        self.assertTrue(page.locator('#tier-name').inner_text().strip())
        hub = self.hub()
        for reward in REWARD_IDS:
            button = hub.locator(f'[data-equip="{reward}"]')
            self.assertTrue(button.is_visible())
            self.assertTrue(button.is_disabled(), reward + ' must start locked')
        self.assertGreaterEqual(hub.locator('[data-goal]').count(), 6)
        self.assertEqual(hub.locator('[data-reward] svg').count(), 7)
        self.assertIn('hint', hub.inner_text().lower())
        page.screenshot(path=str(OUTPUT / 'goals-initial-desktop.png'), full_page=True)
        self.close_dialog()
        self.notebook()
        self.assertEqual(page.locator('.discovery').count(), 0)
        self.assertEqual(page.locator('[data-card] svg').count(), 6)
        for card in CARD_IDS:
            self.assertTrue(page.locator(f'[data-card="{card}"]').is_visible())
            self.assertEqual(page.locator(f'[data-review="{card}"]:enabled').count(), 0)
        self.assertEqual(self.points(), 0)

    def test_progression_rewards_experimentation_without_hint_cost_or_farming(self):
        page = self.open()
        self.activate(page.locator('#send-light'))
        self.assertEqual(self.points(), 2, 'First distinct experiment earns two Sparks')
        self.activate(page.locator('#send-light'))
        self.assertEqual(self.points(), 2, 'Repeated identical traces earn no extra Sparks')
        for _ in range(3):
            self.activate(page.locator('#hint'))
        self.assertEqual(self.points(), 2, 'Hints are free')
        self.align(0)
        self.activate(page.locator('#send-light'))
        self.assertEqual(self.points(), 29, 'Two unique tests + first solve + first card')
        self.assertTrue(page.locator('#reward-notice').is_visible())
        self.assertGreaterEqual(page.locator('#reward-notice svg').count(), 1)
        self.assertIn('goggles', page.locator('#reward-notice').inner_text().lower())
        page.screenshot(path=str(OUTPUT / 'first-discovery-success.png'), full_page=True)
        self.activate(page.locator('#send-light'))
        self.assertEqual(self.points(), 29)
        self.notebook()
        self.activate(page.locator('[data-review="beam"]'))
        self.assertEqual(self.points(), 32)
        self.assertTrue(page.locator('[data-review="beam"]').is_disabled())
        self.close_dialog()
        self.notebook()
        self.assertTrue(page.locator('[data-review="beam"]').is_disabled())
        self.close_dialog()
        page.reload()
        self.assertEqual(self.points(), 32)
        other = self.new_page()
        self.open(other)
        self.activate(other.locator('#send-light'))
        self.align(0, other)
        self.activate(other.locator('#send-light'))
        self.assertEqual(self.points(other), 29, 'Using hints and discovering unaided receive equal rewards')
        self.assertEqual(self.data(other)['progress']['reviews'], [])

    def test_progression_replay_and_puzzle_reset_preserve_collection(self):
        page = self.open()
        self.solve(0)
        first = self.points()
        self.assertEqual(first, 27)
        self.activate(page.locator('#send-light'))
        self.assertEqual(self.points(), first)
        self.activate(page.locator('#reset-puzzle'))
        self.assertEqual(self.points(), first)
        self.assertEqual(self.data()['solved'], [0])
        self.align(0)
        self.activate(page.locator('#send-light'))
        self.assertEqual(self.points(), first + 4, 'A changed/reset known path earns one replay reward')
        self.assertEqual(self.data()['progress']['replays'], [0])
        self.activate(page.locator('#reset-puzzle'))
        self.align(0)
        self.activate(page.locator('#send-light'))
        self.assertEqual(self.points(), first + 4, 'Replays are finite collection goals, not endless currency')
        page.reload()
        self.assertEqual(self.points(), first + 4)
        self.assertEqual(self.data()['progress']['replays'], [0])

    def test_progression_all_cards_unlocks_equipment_and_reload(self):
        page = self.open()
        self.discover_everything()
        data = self.data()
        self.assertEqual(data['solved'], [0, 1, 2])
        self.assertEqual([len(traces) for traces in data['progress']['traces']], [4, 4, 16])
        self.assertEqual(set(data['progress']['reviews']), set(CARD_IDS))
        self.assertGreaterEqual(self.points(), 176)
        self.assertLessEqual(self.points(), 188)
        expected = 20 * 3 + 2 * 24 + 5 * 6 + 20 + 3 * 6 + 4 * len(data['progress']['replays'])
        self.assertEqual(self.points(), expected)
        self.hub()
        page.screenshot(path=str(OUTPUT / 'goals-complete-desktop.png'))
        for reward in REWARD_IDS:
            self.assertTrue(page.locator(f'[data-equip="{reward}"]').is_enabled(), reward)
        self.activate(page.locator('[data-equip="bot-plum"]'))
        self.activate(page.locator('[data-equip="greenhouse"]'))
        self.activate(page.locator('[data-equip="nova"]'))
        self.assertEqual(page.locator('body').get_attribute('data-theme'), 'greenhouse')
        self.assertEqual(page.locator('#robot-art').get_attribute('data-cosmetic'), 'bot-plum')
        self.assertEqual(page.locator('#robot-art').get_attribute('data-companion'), 'nova')
        page.screenshot(path=str(OUTPUT / 'collection-complete-desktop.png'))
        self.close_dialog()
        self.notebook()
        self.assertEqual(page.locator('.discovery').count(), 6)
        self.assertEqual(page.locator('[data-review]:disabled').count(), 6)
        page.locator('[role="dialog"]').evaluate('(el) => {el.scrollTop = 0}')
        page.screenshot(path=str(OUTPUT / 'discovery-book-complete.png'))
        self.close_dialog()
        points = self.points()
        page.reload()
        self.assertEqual(self.points(), points)
        self.assertEqual(page.locator('body').get_attribute('data-theme'), 'greenhouse')
        self.assertEqual(page.locator('#robot-art').get_attribute('data-cosmetic'), 'bot-plum')
        self.assertEqual(page.locator('#robot-art').get_attribute('data-companion'), 'nova')
        self.assertEqual(self.data()['progress']['equipped'], {
            'cosmetic': 'bot-plum', 'theme': 'greenhouse', 'companion': 'nova'})
        self.hub()
        self.activate(page.locator('[data-equip="moonlit"]'))
        self.close_dialog()
        page.reload()
        self.assertEqual(page.locator('body').get_attribute('data-theme'), 'moonlit')
        fresh = self.new_page()
        self.open(fresh)
        self.assertEqual(self.points(fresh), 0)
        self.assertEqual(self.data(fresh)['progress']['reviews'], [])

    def test_progression_legacy_save_migrates_without_losing_discoveries(self):
        page = self.open()
        legacy = {'schema': 1, 'game': 'wonder-lab-adventures', 'data': {
            'puzzle': 1, 'solved': [0, 1], 'attempts': [4, 2, 0], 'visits': 8,
            'orientations': [['/', '/'], ['\\', '\\'], ['/', '\\', '/', '\\']],
            'reducedMotion': True}}
        page.evaluate('([key, save]) => {localStorage.clear();localStorage.setItem(key,JSON.stringify(save))}', [KEY, legacy])
        page.reload()
        migrated = self.data()
        self.assertEqual(migrated['puzzle'], 1)
        self.assertEqual(migrated['solved'], [0, 1])
        self.assertEqual(migrated['attempts'], [4, 2, 0])
        self.assertEqual(migrated['orientations'], legacy['data']['orientations'])
        self.assertEqual(migrated['progress']['traces'], [[], [], []])
        self.assertEqual(self.points(), 50, 'Existing solves receive their solve and card rewards once')
        self.assertTrue(page.locator('.light-goal.lit').is_visible())
        self.notebook()
        self.assertEqual(page.locator('.discovery').count(), 2)
        self.close_dialog()
        page.reload()
        self.assertEqual(self.points(), 50, 'Migration does not issue rewards repeatedly')

    def test_progression_malformed_save_cannot_grant_unknown_unlocks(self):
        page = self.open()
        malformed = {'schema': 1, 'game': 'wonder-lab-adventures', 'data': {
            'solved': [], 'progress': {
                'version': 999, 'points': 10**9, 'unlockedIds': ['nova', 'not-real'],
                'traces': [[-1, 99, '1', {}, None], [], []],
                'reviews': ['beam', '<script>', 'beam'], 'replays': [99, -1],
                'equipped': {'cosmetic': 'bot-plum', 'theme': 'greenhouse', 'companion': 'nova'}}}}
        page.evaluate('([key, save]) => {localStorage.clear();localStorage.setItem(key,JSON.stringify(save))}', [KEY, malformed])
        page.reload()
        self.assertEqual(self.points(), 0)
        self.assertEqual(self.data()['progress']['equipped'], {
            'cosmetic': 'classic', 'theme': 'classic', 'companion': 'classic'})
        self.assertEqual(page.locator('body').get_attribute('data-theme'), 'classic')
        self.hub()
        self.assertTrue(page.locator('[data-equip="nova"]').is_disabled())
        self.close_dialog()
        self.solve(0)
        self.assertEqual(self.points(), 27)

    def test_progression_backup_recovers_rewards_and_equipment(self):
        page = self.open()
        self.solve(0)
        self.hub()
        self.activate(page.locator('[data-equip="goggles"]'))
        self.close_dialog()
        self.activate(page.locator('#send-light'))  # both save copies now include equipped goggles
        saved_points = self.points()
        page.evaluate('(key) => localStorage.setItem(key,"{broken")', KEY)
        page.reload()
        self.assertEqual(self.points(), saved_points)
        self.assertEqual(page.locator('#robot-art').get_attribute('data-cosmetic'), 'goggles')
        self.assertIn('Recovered', page.locator('#save-status').inner_text())

    def test_progression_unavailable_storage_still_rewards_this_visit(self):
        page = self.page
        page.add_init_script("Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError')}})")
        self.open()
        self.solve(0)
        self.assertEqual(self.points(), 27)
        self.hub()
        self.activate(page.locator('[data-equip="goggles"]'))
        self.close_dialog()
        self.assertEqual(page.locator('#robot-art').get_attribute('data-cosmetic'), 'goggles')
        self.assertIn('visit only', page.locator('#save-status').inner_text())
        page.reload()
        self.assertEqual(self.points(), 0)
        self.assertEqual(page.locator('#robot-art').get_attribute('data-cosmetic'), 'classic')

    def test_progression_storage_failures_show_visit_only_review_and_equipment(self):
        failures = [
            ('denied', "Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError')}})", 'visit only'),
            ('quota', "Storage.prototype.setItem=function(){throw new DOMException('Full','QuotaExceededError')}", 'cannot save'),
        ]
        for name, script, warning in failures:
            with self.subTest(storage=name):
                page = self.new_page()
                page.add_init_script(script)
                self.open(page)
                self.solve(0, page)
                self.assertEqual(self.points(page), 27)
                self.notebook(page)
                self.assertIn(warning, page.locator('.wonder-book .warning').inner_text())
                self.activate(page.locator('[data-review="beam"]'))
                self.assertEqual(self.points(page), 30)
                self.assertEqual(page.locator('[data-review="beam"]').inner_text(), 'Reviewed · this visit')
                feedback = page.locator('#book-feedback').inner_text()
                self.assertIn(warning, feedback)
                self.assertNotIn('Saved on this browser', feedback)
                self.close_dialog(page)
                self.notebook(page)
                self.assertEqual(page.locator('[data-review="beam"]').inner_text(), 'Reviewed · this visit')
                self.close_dialog(page)
                self.hub(page)
                self.assertIn(warning, page.locator('.wonder-hub .warning').inner_text())
                self.activate(page.locator('[data-equip="goggles"]'))
                equipment_feedback = page.locator('#equip-feedback').inner_text()
                self.assertIn('ready for this visit', equipment_feedback)
                self.assertIn(warning, equipment_feedback)
                self.assertNotIn('Saved on this browser', equipment_feedback)
                self.assertEqual(page.locator('#robot-art').get_attribute('data-cosmetic'), 'goggles')
                self.close_dialog(page)
                page.reload()
                self.assertEqual(self.points(page), 0)
                self.assertEqual(page.locator('#robot-art').get_attribute('data-cosmetic'), 'classic')
                self.notebook(page)
                self.assertEqual(page.locator('.discovery').count(), 0)
                self.assertIn(warning, page.locator('.wonder-book .warning').inner_text())
                self.close_dialog(page)

    def test_progression_offline_points_and_collection_work_after_load(self):
        page = self.open()
        page.context.set_offline(True)
        self.solve(0)
        self.notebook()
        self.activate(page.locator('[data-review="beam"]'))
        self.close_dialog()
        self.assertEqual(self.points(), 30)
        self.hub()
        self.activate(page.locator('[data-equip="goggles"]'))
        self.close_dialog()
        self.assertEqual(page.locator('#robot-art').get_attribute('data-cosmetic'), 'goggles')

    def test_progression_review_keyboard_focus_stays_in_book(self):
        page = self.open()
        self.solve(0)
        self.notebook()
        page.locator('[data-review="beam"]').focus()
        page.keyboard.press('Enter')
        self.idle(page)
        self.assertEqual(self.points(), 30)
        self.assertTrue(page.locator('[role="dialog"]').evaluate(
            '(el) => el.contains(document.activeElement) && !document.activeElement.disabled'),
            'Reviewing must move focus away from the newly disabled button inside the book')
        for key in ['Tab', 'Shift+Tab']:
            page.keyboard.press(key)
            self.idle(page)
            self.assertTrue(page.locator('[role="dialog"]').evaluate(
                '(el) => el.contains(document.activeElement)'), 'Keyboard focus must remain in the book')
        page.keyboard.press('Escape')
        self.idle(page)
        self.assertEqual(page.locator('[role="dialog"]').count(), 0)
        self.assertEqual(page.locator(':focus').get_attribute('id'), 'discoveries')

    def test_progression_mobile_goals_and_keyboard_access(self):
        for width, height in [(320, 740), (390, 844), (768, 1024), (1024, 768)]:
            with self.subTest(viewport=f'{width}x{height}'):
                page = self.new_page(viewport={'width': width, 'height': height}, has_touch=True)
                self.open(page)
                self.assertLessEqual(page.evaluate('document.documentElement.scrollWidth'), width)
                page.locator('#open-goals').focus()
                page.keyboard.press('Enter')
                self.idle(page)
                self.assertTrue(page.locator('.wonder-hub').is_visible())
                page.keyboard.press('Shift+Tab')
                self.idle(page)
                self.assertEqual(page.locator(':focus').get_attribute('id'), 'hub-open-book')
                page.keyboard.press('Tab')
                self.idle(page)
                self.assertEqual(page.locator(':focus').get_attribute('aria-label'), 'Close dialog')
                dialog = page.locator('[role="dialog"]')
                self.assertLessEqual(dialog.evaluate('(el) => el.scrollWidth'), dialog.evaluate('(el) => el.clientWidth'))
                for button in dialog.locator('button:enabled').all():
                    button.scroll_into_view_if_needed()
                    bounds = button.bounding_box()
                    self.assertGreaterEqual(bounds['width'], 44)
                    self.assertGreaterEqual(bounds['height'], 44)
                dialog.evaluate('(el) => {el.scrollTop = 0}')
                page.screenshot(path=str(OUTPUT / f'goals-{width}x{height}.png'))
                page.keyboard.press('Escape')
                self.idle(page)
                self.assertEqual(page.locator('[role="dialog"]').count(), 0)
                self.assertEqual(page.locator(':focus').get_attribute('id'), 'open-goals')
                self.solve(0, page, 'touch')
                page.locator('#discoveries').tap()
                self.assertEqual(page.locator('.discovery').count(), 1)
                self.assertLessEqual(page.locator('[role="dialog"]').evaluate('(el) => el.scrollWidth'),
                                     page.locator('[role="dialog"]').evaluate('(el) => el.clientWidth'))
                page.locator('[data-review="beam"]').tap()
                page.keyboard.press('Escape')
                self.idle(page)
                self.assertEqual(self.points(page), 30)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=OUTPUT)
    parser.add_argument('--root', type=Path, default=ROOT)
    args = parser.parse_args()
    ROOT = args.root.resolve()
    OUTPUT = args.output.resolve()
    OUTPUT.mkdir(parents=True, exist_ok=True)
    base.ROOT, base.OUTPUT = ROOT, OUTPUT
    # The common helper includes legacy test methods; run those separately with
    # browser_lab.py so this result counts only new progression scenarios.
    names = [name for name in unittest.defaultTestLoader.getTestCaseNames(ProgressionBrowser)
             if name.startswith('test_progression_')]
    suite = unittest.TestSuite(ProgressionBrowser(name) for name in names)
    result = unittest.TextTestRunner(verbosity=2, resultclass=base.JsonResult).run(suite)
    (OUTPUT / 'results.json').write_text(json.dumps({
        'browser': getattr(ProgressionBrowser, 'browser_version', 'unavailable'),
        'python': sys.version.split()[0], 'tests_run': result.testsRun,
        'failures': len(result.failures), 'errors': len(result.errors),
        'success': result.wasSuccessful(), 'results': result.records,
        'limits': 'Real HTTP browser storage and headless Chromium; touch is emulated. No physical-device, child-usability or demonstrated-retention testing.'
    }, indent=2) + '\n')
    sys.exit(0 if result.wasSuccessful() else 1)
