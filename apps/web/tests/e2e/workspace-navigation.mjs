import assert from "node:assert/strict";
import path from "node:path";

const pages = { research: "Research", results: "Results", lab: "Lab", library: "Library", reports: "Reports" };
const labTabs = { bass: "BASS-II cases", ab: "A/B scenarios", query: "Hypotheses & queries" };

export async function assertScreen(page, screen) {
  await page.locator(`[data-screen="${screen}"]`).waitFor();
  assert.equal(await page.locator("[data-screen]:visible").count(), 1, "Exactly one workspace screen must be visible.");
  assert.equal(await page.getByRole("navigation", { name: "Workspace", exact: true }).getByRole("link", { name: pages[screen], exact: true }).getAttribute("aria-current"), "page");
}

export async function closeSource(page, method = "button") {
  const dialog = page.getByRole("dialog", { name: "Evidence source", exact: true });
  if (!(await dialog.isVisible())) return;
  if (method === "escape") await page.keyboard.press("Escape");
  else await dialog.getByRole("button", { name: "Close source", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
}

export async function go(page, screen) {
  await closeSource(page);
  await page.getByRole("navigation", { name: "Workspace", exact: true }).getByRole("link", { name: pages[screen], exact: true }).click();
  await page.waitForURL((url) => url.hash === `#${screen}`);
  await assertScreen(page, screen);
}

export async function openedResults(page) {
  await page.waitForURL((url) => url.hash === "#results");
  await assertScreen(page, "results");
}

export async function disclosure(locator) {
  await locator.waitFor();
  if (!(await locator.evaluate((element) => element.open))) await locator.locator(":scope > summary").click();
}

export async function brief(page, sections = []) {
  await go(page, "research");
  for (const section of sections) await disclosure(page.locator(`[data-brief-section="${section}"]`));
}

export async function labView(page, view = "ab") {
  await go(page, "lab");
  const tab = page.getByRole("tablist", { name: "Lab views", exact: true }).getByRole("tab", { name: labTabs[view], exact: true });
  await tab.click();
  assert.equal(await tab.getAttribute("aria-selected"), "true");
}

export async function libraryView(page, view = "Studies") {
  await go(page, "library");
  const button = page.getByRole("group", { name: "Library views", exact: true }).getByRole("button", { name: view, exact: true });
  await button.click();
  assert.equal(await button.getAttribute("aria-pressed"), "true");
}

export async function resultView(page, view = "Data") {
  await go(page, "results");
  await page.getByRole("group", { name: "Result views", exact: true }).getByRole("button", { name: view, exact: true }).click();
}

export async function verifyNavigation({ page, check }) {
  await brief(page, ["sampling"]);
  const question = page.getByRole("textbox", { name: /^Question/ });
  const before = await question.inputValue();
  const limits = page.getByRole("spinbutton", { name: /Max\. trials/ });
  const beforeLimit = await limits.inputValue();
  await question.fill("Draft preserved while moving between workspace screens.");
  await limits.fill("2");
  let posts = 0;
  const listen = (request) => { if (request.method() === "POST" && /\/api\/v1\/(research|scenarios\/compare)$/.test(new URL(request.url()).pathname)) posts++; };
  page.on("request", listen);
  try {
    await go(page, "library");
    await go(page, "reports");
    await page.goBack(); await page.waitForURL((url) => url.hash === "#library"); await assertScreen(page, "library");
    await page.goForward(); await page.waitForURL((url) => url.hash === "#reports"); await assertScreen(page, "reports");
    await go(page, "research");
    check(await question.inputValue() === "Draft preserved while moving between workspace screens." && await limits.inputValue() === "2", "draft and sampling survive navigation and browser back/forward");
    check(posts === 0, "changing screens does not run research or scenario calculations");
    check(await page.locator("[data-screen]").count() === 5, "all five screens remain mounted while only the selected screen is visible");
  } finally { page.off("request", listen); }
  await question.fill(before); await limits.fill(beforeLimit);
}

export async function verifyMobileNavigation({ page, check, screenshots }) {
  await page.setViewportSize({ width: 390, height: 844 });
  const shellIsStable = async (label) => {
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const shell = await page.locator(".topbar").evaluate((header) => {
      const bounds = header.getBoundingClientRect();
      return { top: bounds.top, bottom: bounds.bottom, viewport: innerHeight,
        document: [scrollY, document.documentElement.scrollTop, document.body.scrollTop, document.getElementById("root")?.scrollTop ?? 0] };
    });
    check(shell.top >= -1 && shell.bottom > 0 && shell.bottom < shell.viewport && shell.document.every((top) => top === 0),
      `${label}: header stays in the viewport and only workspace content scrolls (${JSON.stringify(shell)})`);
  };
  try {
    for (const screen of Object.keys(pages)) {
      await go(page, screen);
      await shellIsStable(`mobile ${screen}`);
      if (screenshots && ["lab", "library"].includes(screen)) {
        await page.screenshot({ path: path.join(screenshots, `workspace-${screen}-navigation-mobile.png`) });
      }
    }
    const direct = new URL(page.url()); direct.hash = "#lab";
    await page.goto(direct.href); await page.reload();
    await assertScreen(page, "lab");
    await shellIsStable("direct #lab load");
    await go(page, "library"); await go(page, "reports");
    await page.goBack(); await page.waitForURL((url) => url.hash === "#library"); await assertScreen(page, "library");
    await shellIsStable("mobile history back to Library");
    await page.goBack(); await page.waitForURL((url) => url.hash === "#lab"); await assertScreen(page, "lab");
    await shellIsStable("mobile history back to Lab");
    await page.goForward(); await page.waitForURL((url) => url.hash === "#library"); await assertScreen(page, "library");
    await shellIsStable("mobile history forward to Library");
  } finally { await page.setViewportSize({ width: 1440, height: 1000 }); }
  await go(page, "research");
}

export async function captureWorkspace({ page, check, screenshots }) {
  for (const [size, viewport] of [["desktop", { width: 1440, height: 1000 }], ["mobile", { width: 390, height: 844 }]]) {
    await page.setViewportSize(viewport);
    for (const screen of Object.keys(pages)) {
      await go(page, screen);
      const width = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, viewport: innerWidth }));
      check(width.page <= width.viewport + 1, `${screen} ${size}: no horizontal page overflow (${width.page}/${width.viewport})`);
      if (screenshots) await page.screenshot({ path: path.join(screenshots, `workspace-${screen}-${size}.png`) });
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
}
