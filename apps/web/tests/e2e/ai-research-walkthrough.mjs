#!/usr/bin/env node
// Prepared AI Research flow against owned API/Vite processes and isolated SQLite.
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRuntime } from "./runtime.mjs";

const allowed = new Set(["root", "bundle", "screenshots", "headed"]);
const args = Object.fromEntries(process.argv.slice(2).map(arg => {
  const match = /^--([^=]+)(?:=(.*))?$/.exec(arg);
  if (!match || !allowed.has(match[1])) throw new Error(`Unknown argument: ${arg}`);
  return [match[1], match[2] ?? "true"];
}));
const root = path.resolve(args.root ?? path.join(path.dirname(fileURLToPath(import.meta.url)), "../../../.."));
const screenshots = args.screenshots ? path.resolve(args.screenshots) : null;
const runtime = await createRuntime(root, { fixturePath: args.bundle ? path.resolve(args.bundle) : undefined });
const checks = [];
let current = "setup", browser, closing, exitCode = 0;
const held = [];
const errors = [];
const check = (value, message) => { if (!value) throw new Error(message); checks.push({ step: current, ok: true, message }); };
async function step(name, action) {
  current = name;
  try { await action(); console.log(`PASS  ${name}`); }
  catch (error) { checks.push({ step: name, ok: false, message: error.stack ?? String(error) }); throw error; }
}
const cleanup = () => closing ??= (async () => {
  for (const release of held) release();
  await browser?.close();
  await runtime.close();
})();
for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => { void cleanup().finally(() => process.exit(130)); });
const shot = async (page, name) => { if (screenshots) await page.screenshot({ path: path.join(screenshots, `ai-research-${name}.png`) }); };
try {
  if (screenshots) mkdirSync(screenshots, { recursive: true });
  const api = runtime.startApi(), web = runtime.startWeb();
  await runtime.waitHttp(`${runtime.apiUrl}/api/v1/health`, api);
  await runtime.waitHttp(runtime.webUrl, web);
  browser = await runtime.chromium.launch({ headless: args.headed !== "true" });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, acceptDownloads: true, reducedMotion: "reduce" });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`${runtime.webUrl}/#/dashboard/ai-research`);
  const research = page.locator('.air');
  const waitStage = async stage => { try { await page.waitForFunction(value => document.querySelector('.air')?.getAttribute('data-stage') === value, stage); } catch (error) { console.log('STAGE_DIAGNOSTIC', await page.evaluate(() => ({ stage: document.querySelector('.air')?.getAttribute('data-stage'), resting: document.querySelector('.ar-arena')?.getAttribute('data-resting'), hidden: document.hidden, status: document.querySelector('.air-status')?.textContent, hash: location.hash, dialog: document.querySelector('.air-dialog')?.open }))); await shot(page, 'failure'); throw error; } };
  const stage = () => research.getAttribute('data-stage');
  const dialog = page.locator('dialog.air-dialog');
  const closeSource = async () => { await page.keyboard.press('Escape'); await dialog.waitFor({ state: 'hidden' }); };
  const openView = async view => {
    await page.getByRole('navigation', { name: 'Views', exact: true }).getByRole('link', { name: view, exact: true }).click();
  };
  await step('entry, five agents and reduced motion', async () => {
    await page.getByRole('heading', { name: 'AI Research', exact: true }).waitFor();
    check(await stage() === 'idle', 'deep link opens the prepared case at idle');
    check(await research.locator('.ar-agent').count() === 5, 'five visual agent roles are present');
    check(await research.locator('.ar-agent').first().evaluate(el => getComputedStyle(el).animationName) === 'none', 'reduced motion disables agent movement');
    check(await research.locator('.air-footnote').innerText() === 'Prepared BASS-II case · choreographed agent activity · published values with source references.', 'choreography remains distinct from model execution');
    await shot(page, 'idle-desktop');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
  });
  await step('pause and hidden view preserve the current stage', async () => {
    await research.getByRole('button', { name: 'Start research' }).click();
    await waitStage('plan');
    check(await research.locator('.ar-agent').first().evaluate(el => getComputedStyle(el).animationPlayState) === 'running', 'agents animate during a running stage');
    await research.getByRole('button', { name: 'Pause', exact: true }).click();
    await page.waitForTimeout(3400);
    check(await stage() === 'plan', 'manual pause prevents the three-second plan from advancing');
    check(await research.locator('.ar-agent').first().evaluate(el => getComputedStyle(el).animationPlayState) === 'paused', 'manual pause freezes visual agents');
    await research.getByRole('button', { name: 'Resume', exact: true }).click();
    await openView('Overview');
    await page.locator('[data-view="overview"]').waitFor({ state: 'visible' });
    const hiddenStage = await stage();
    await page.waitForTimeout(3400);
    check(await stage() === hiddenStage, 'navigation away suspends the prepared sequence');
    check(await research.locator('.ar-agent').first().evaluate(el => getComputedStyle(el).animationPlayState) === 'paused', 'hidden agents are paused');
    await openView('AI Research');
    await research.waitFor({ state: 'visible' });
    await shot(page, 'agents-desktop');
  });
  await step('source dialog uses literal API records or explicit fallback', async () => {
    await research.getByRole('button', { name: 'Open BASS-II Table 5.1 source', exact: true }).click();
    await dialog.waitFor();
    check(await research.locator('.ar-agent').first().evaluate(el => getComputedStyle(el).animationPlayState) === 'paused', 'source inspection pauses the scene');
    const response = page.waitForResponse(r => r.url().includes('/api/v1/evidence/') && r.request().method() === 'GET');
    await dialog.getByRole('button', { name: 'Load active corpus record', exact: true }).click();
    const sourceResponse = await response;
    check(!new URL(sourceResponse.url()).searchParams.has('research_id'), 'source fetch targets active corpus, not an unrelated research snapshot');
    if (args.bundle) {
      check(sourceResponse.status() === 200, 'real bundle serves the selected source');
      const record = await sourceResponse.json();
      await dialog.locator('pre').waitFor();
      check(await dialog.locator('pre').textContent() === record.text, 'source text matches the API byte for byte');
      check(record.id === 'psi:PSI-25:M8:stage:2:table51', 'M8 source identity is retained');
    } else {
      check(sourceResponse.status() === 404, 'synthetic corpus cannot provide a NASA record');
      await dialog.getByRole('alert').waitFor();
      check(await dialog.getByRole('alert').innerText().then(t => t.includes('unavailable in the active corpus')), 'unavailable corpus record is explicit');
      check(await dialog.locator('pre').count() === 0, 'no synthetic response is substituted for NASA evidence');
    }
    const publication = dialog.getByRole('link', { name: 'Open original publication' });
    check((await publication.getAttribute('href')).includes('TM-20210011385.pdf#page=65'), 'publication points to the reported NASA PDF page');
    await shot(page, 'source-desktop');
    await closeSource();
    check(!(await dialog.isVisible()), 'Escape closes the source dialog');
  });
  await step('human review is a real gate with preserved scientific limits', async () => {
    await waitStage('review');
    const accept = research.getByRole('button', { name: 'Accept descriptive scope' });
    check(await accept.isDisabled(), 'acceptance requires all three acknowledgements');
    await page.waitForTimeout(1700);
    check(await stage() === 'review', 'review never advances on its own');
    check(await research.locator('.ar-agent').first().evaluate(el => getComputedStyle(el).animationPlayState) === 'paused', 'human review stops agent movement');
    const review = research.locator('.air-review');
    const reviewText = await review.innerText();
    check(['0.056 / 0.04 mm/s', '0.0557 / 0.0391 mm/s', '6 / 5 cm/s'].every(text => reviewText.includes(text)), 'M8 table and figure representations are distinct and intact');
    await shot(page, 'review-desktop');
    await page.setViewportSize({ width: 390, height: 844 });
    await shot(page, 'review-mobile');
    const bounds = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: innerWidth }));
    check(bounds.width <= bounds.viewport + 1, `mobile layout does not overflow (${bounds.width}/${bounds.viewport})`);
    await research.getByRole('button', { name: 'Open NASA report source', exact: true }).click();
    await dialog.waitFor();
    const sourceBox = await dialog.boundingBox();
    check(sourceBox.x >= -1 && sourceBox.x + sourceBox.width <= 391, 'source dialog fits mobile viewport');
    await shot(page, 'source-mobile');
    await closeSource();
    await page.setViewportSize({ width: 1440, height: 1100 });
    const boxes = review.getByRole('checkbox');
    check(await boxes.count() === 3, 'three review decisions are required');
    await boxes.nth(0).check(); await boxes.nth(1).check();
    check(await accept.isDisabled(), 'partial acknowledgement cannot bypass review');
    await boxes.nth(2).check();
    check(await accept.isEnabled(), 'all acknowledgements enable continuation');
    await review.getByRole('textbox', { name: 'Review note' }).fill('Keep M8 table and figure values separate; descriptive scope only.');
    await accept.click();
    await waitStage('write');
    check(await stage() === 'write', 'human action starts report assembly');
  });
  await step('complete case and downloaded report preserve provenance and counts', async () => {
    await waitStage('complete');
    check((await research.locator('.air-metrics').innerText()).includes('10') && (await research.locator('.air-metrics').innerText()).includes('7'), 'complete brief shows ten observations and seven samples');
    check(await research.locator('.air-table-scroll tbody tr').count() === 10, 'prepared table contains all ten observations');
    const download = page.waitForEvent('download');
    await research.getByRole('button', { name: 'Download prepared report' }).click();
    const file = await download;
    check(file.suggestedFilename() === 'BASS-II-prepared-research.md', 'download identifies the prepared case');
    const text = readFileSync(await file.path(), 'utf8');
    check(text.includes('Keep M8 table and figure values separate; descriptive scope only.'), 'human review note is preserved');
    check(text.includes('four and six published observations across seven identified samples'), 'report preserves correct counts');
    check(text.includes('M8|2|178m|6|0.056') && text.includes('M8|3|178m|5|0.04'), 'reported M8 table values and segments survive export');
    check(text.includes('0.0557') && text.includes('0.0391') && text.includes('https://ntrs.nasa.gov/'), 'report retains figure discrepancy and source link');
    check(text.includes('no model execution is claimed') && text.includes('does not validate the corpus'), 'report preserves prepared workflow and scientific scope');
    await shot(page, 'complete-desktop');
    await page.setViewportSize({ width: 390, height: 844 });
    await shot(page, 'complete-mobile');
    await page.setViewportSize({ width: 1440, height: 1100 });
  });
  await step('Reset discards a pending source response and review state', async () => {
    let release, arrived, finished;
    const gate = new Promise(resolve => { release = resolve; });
    const seen = new Promise(resolve => { arrived = resolve; });
    const done = new Promise(resolve => { finished = resolve; });
    held.push(release);
    const pattern = '**/api/v1/evidence/**';
    const handler = async route => {
      const response = await route.fetch(); arrived(); await gate;
      await route.fulfill({ response }); finished();
    };
    await page.route(pattern, handler, { times: 1 });
    await research.getByRole('button', { name: 'Open BASS-II Table 5.1 source', exact: true }).click();
    await dialog.getByRole('button', { name: 'Load active corpus record', exact: true }).click();
    await seen;
    await closeSource();
    await research.getByRole('button', { name: 'Reset case', exact: true }).click();
    await waitStage('idle');
    await research.getByRole('button', { name: 'Open NASA report source', exact: true }).click();
    release(); await done;
    await page.waitForTimeout(200);
    check(await stage() === 'idle', 'reset returns to idle while a delayed source response finishes');
    check(await dialog.getByRole('heading', { name: 'NASA technical memorandum', exact: true }).isVisible(), 'new source selection remains selected after stale response');
    check(await dialog.locator('pre').count() === 0 && await dialog.getByRole('alert').count() === 0, 'late source response cannot populate or fail the new selection');
    await closeSource();
    check(await research.locator('.air-review, .air-result').count() === 0, 'reset removes review decisions and final output');
    await page.unroute(pattern, handler);
  });
  await step('search opens the published M13 reference and its matching corpus record', async () => {
    let chatRequests = 0;
    const trackChat = request => {
      if (new URL(request.url()).pathname === '/api/v1/chat') chatRequests += 1;
    };
    page.on('request', trackChat);
    await page.getByRole('button', { name: /Search studies, trials and sections/ }).click();
    const search = page.getByRole('combobox', { name: 'Search studies, trials and sections' });
    await search.fill('What was the flame spread rate in each segment of BAS-II M13?');
    await search.press('Enter');
    const reference = page.getByRole('region', { name: 'M13 segment measurements' });
    await reference.waitFor();
    check((await reference.innerText()).includes('Published reference'), 'M13 is labelled as a published reference');
    const rows = await reference.locator('tbody tr').allTextContents();
    check(rows.length === 3 && ['0.047', '0.035', '0.033'].every((rate, index) => rows[index].includes(rate)), 'all three published rates appear in source order');
    check(chatRequests === 0, 'the prepared reference did not call the chat model');
    page.off('request', trackChat);

    const chat = page.getByRole('complementary', { name: 'Ask SI conversation' });
    await chat.getByText('Sources (3)', { exact: true }).click();
    const source = page.waitForResponse(response => decodeURIComponent(new URL(response.url()).pathname) === '/api/v1/evidence/psi:PSI-25:M13:stage:3:table51');
    await chat.getByRole('button', { name: /M13 · segment 3/ }).click();
    check((await source).status() === (args.bundle ? 200 : 404), 'M13 cites the right active-corpus record and respects fixture absence');
  });
  await step('no uncaught browser errors', async () => check(errors.length === 0, `browser errors: ${errors.join(' | ') || 'none'}`));
} catch (error) {
  exitCode = 1;
  if (!checks.some(item => !item.ok)) checks.push({ step: current, ok: false, message: error.stack ?? String(error) });
} finally {
  try { await cleanup(); } catch (error) { exitCode = 1; checks.push({ step: 'cleanup', ok: false, message: String(error) }); }
}
console.log('\n--- AI Research walkthrough ---');
console.log(`Corpus: ${args.bundle ? 'explicit real bundle' : 'synthetic fixture'}; prepared case is the same curated example in both.`);
console.log(`checks passed: ${checks.filter(item => item.ok).length} · failed: ${checks.filter(item => !item.ok).length}`);
for (const failure of checks.filter(item => !item.ok)) console.log(`FAIL [${failure.step}] ${failure.message}`);
process.exit(exitCode);
