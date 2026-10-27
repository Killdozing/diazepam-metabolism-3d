const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const url = pathToFileURL(path.join(__dirname, '../index.html')).href;
const cdn = 'https://unpkg.com/three@0.128.0/build/three.min.js';

async function capture(page, name) {
    if (!process.env.SCREENSHOT_DIR) return;
    fs.mkdirSync(process.env.SCREENSHOT_DIR, { recursive: true });
    await page.screenshot({ path: path.join(process.env.SCREENSHOT_DIR, name + '.png') });
}

async function advance(page, milliseconds) {
    // Exercise the application's actual render-loop timing without waiting for every fade.
    await page.evaluate(ms => {
        animationStart = performance.now() - ms;
        updateMetabolism(performance.now());
        updateConnections(Date.now() * 0.001);
    }, milliseconds);
}

async function visibleCompounds(page) {
    return page.evaluate(() => [...nodes].filter(([, node]) => node.visible).map(([name]) => name).sort());
}

(async () => {
    const browser = await chromium.launch({
        headless: true,
        executablePath: process.env.BROWSER_EXECUTABLE || undefined,
        args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
    });
    try {
        const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
        if (process.env.THREE_JS_PATH) {
            await page.route(cdn, route => route.fulfill({ path: process.env.THREE_JS_PATH, contentType: 'application/javascript' }));
        }
        await page.goto(url);
        await page.waitForFunction(() => typeof renderer !== 'undefined' && renderer && renderer.getContext());
        assert.deepEqual(await visibleCompounds(page), ['Diazepam']);

        await page.click('#startBtn');
        assert.equal(await page.locator('#startBtn').isDisabled(), true);
        await advance(page, 1800);
        assert.deepEqual(await visibleCompounds(page), ['Diazepam', 'Nordiazepam', 'Temazepam']);
        assert.deepEqual(await page.evaluate(() => connections.filter(c => c.opacity > 0).map(c => [c.path.from, c.path.to])), [
            ['Diazepam', 'Nordiazepam'], ['Diazepam', 'Temazepam']
        ]);
        await advance(page, 4300);
        assert.deepEqual(await visibleCompounds(page), ['Diazepam', 'Nordiazepam', 'Oxazepam', 'Temazepam', 'Temazepam glucuronide']);
        await advance(page, 7600);
        assert.equal((await visibleCompounds(page)).length, 6);
        assert.equal(await page.locator('#startBtn').textContent(), 'Replay pathways');

        const graph = await page.evaluate(() => connections.map(c => {
            const position = c.line.geometry.attributes.position;
            const start = new THREE.Vector3().fromBufferAttribute(position, 0);
            const end = new THREE.Vector3().fromBufferAttribute(position, 1);
            const direction = c.target.position.clone().sub(c.source.position).normalize();
            const arrowDirection = new THREE.Vector3(0, 1, 0).applyQuaternion(c.arrow.quaternion);
            return {
                from: c.path.from, to: c.path.to,
                startDistance: start.distanceTo(c.source.position), sourceRadius: c.source.geometry.parameters.radius,
                endDistance: end.distanceTo(c.target.position), targetRadius: c.target.geometry.parameters.radius,
                directionMatch: direction.dot(arrowDirection), visible: c.arrow.visible
            };
        }));
        assert.deepEqual(graph.map(g => [g.from, g.to]), [
            ['Diazepam', 'Nordiazepam'], ['Diazepam', 'Temazepam'],
            ['Nordiazepam', 'Oxazepam'], ['Temazepam', 'Oxazepam'],
            ['Temazepam', 'Temazepam glucuronide'], ['Oxazepam', 'Oxazepam glucuronide']
        ]);
        for (const edge of graph) {
            assert.ok(Math.abs(edge.startDistance - edge.sourceRadius) < 0.01);
            assert.ok(Math.abs(edge.endDistance - edge.targetRadius - 0.15) < 0.01);
            assert.ok(edge.directionMatch > 0.999 && edge.visible);
        }
        await capture(page, 'desktop-pathways');

        await page.selectOption('#compoundSelect', 'Temazepam');
        assert.match(await page.locator('#formation').textContent(), /Diazepam → Temazepam: 3-hydroxylation \(CYP3A4\)/);
        assert.match(await page.locator('#elimination').textContent(), /Glucuronidation \(major route\) \(UGTs\)/);
        assert.match(await page.locator('#halfLife').textContent(), /3.5–18.4/);
        assert.equal(await page.locator('#drugSources a').count(), 4);
        await capture(page, 'temazepam-information');
        await page.selectOption('#compoundSelect', 'Oxazepam');
        const formation = await page.locator('#formation').textContent();
        assert.match(formation, /Nordiazepam → Oxazepam/);
        assert.match(formation, /Temazepam → Oxazepam/);
        assert.doesNotMatch(formation, /UGT/);
        await page.selectOption('#compoundSelect', 'Oxazepam glucuronide');
        assert.match(await page.locator('#isActive').textContent(), /^No/);
        assert.match(await page.locator('#elimination').textContent(), /Urinary excretion/);
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('#infoPanel').isVisible(), false);

        // Raycasting still opens a panel, and a drag does not masquerade as a click.
        const point = await page.evaluate(() => {
            const p = nodes.get('Oxazepam').position.clone().project(camera);
            return { x: (p.x + 1) * innerWidth / 2, y: (1 - p.y) * innerHeight / 2 };
        });
        await page.mouse.move(point.x, point.y);
        await page.mouse.move(point.x + 1, point.y + 1);
        assert.equal(await page.evaluate(() => hoveredObject && hoveredObject.drugName), 'Oxazepam');
        await page.mouse.click(point.x, point.y);
        assert.equal(await page.locator('#drugName').textContent(), 'Oxazepam');
        await page.keyboard.press('Escape');
        const beforeRotation = await page.evaluate(() => camera.position.toArray());
        await page.mouse.move(800, 850);
        await page.mouse.down();
        await page.mouse.move(900, 820, { steps: 8 });
        await page.mouse.up();
        assert.notDeepEqual(await page.evaluate(() => camera.position.toArray()), beforeRotation);
        assert.equal(await page.locator('#infoPanel').isVisible(), false);
        const beforeZoom = await page.evaluate(() => camera.position.length());
        await page.mouse.wheel(0, -100);
        await page.waitForFunction(radius => camera.position.length() < radius, beforeZoom);

        // Replay and reset at each stage cannot duplicate or resurrect graph elements.
        for (const time of [1800, 4300, 6800]) {
            await page.click('#resetBtn');
            await page.click('#startBtn');
            await advance(page, time);
            await page.click('#resetBtn');
            assert.deepEqual(await visibleCompounds(page), ['Diazepam']);
            assert.equal(await page.evaluate(() => connections.length), 0);
            assert.equal(await page.locator('#labelsContainer .label').count(), 1);
        }
        await page.waitForTimeout(8000);
        assert.deepEqual(await visibleCompounds(page), ['Diazepam']);
        for (let i = 0; i < 2; i++) {
            await page.click('#startBtn');
            await advance(page, 7600);
            assert.equal(await page.evaluate(() => connections.length), 6);
            assert.equal(await page.locator('#labelsContainer .label').count(), 12);
        }

        // A fresh small-screen view and a resized view both retain usable text access.
        await page.setViewportSize({ width: 390, height: 844 });
        await page.reload();
        await page.click('#startBtn');
        await advance(page, 7600);
        await page.waitForTimeout(100);
        const boxes = await page.locator('.label:not(.reaction-label)').evaluateAll(labels => labels.map(label => {
            const r = label.getBoundingClientRect();
            return { x: r.x, y: r.y, right: r.right, bottom: r.bottom };
        }));
        assert.equal(boxes.length, 6);
        for (const box of boxes) assert.ok(box.x >= 0 && box.right <= 390 && box.y >= 0 && box.bottom < 780);
        for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
            const a = boxes[i], b = boxes[j];
            assert.ok(a.right <= b.x || b.right <= a.x || a.bottom <= b.y || b.bottom <= a.y, 'compound labels must not overlap on mobile');
        }
        await capture(page, 'mobile-pathways');
        await page.selectOption('#compoundSelect', 'Oxazepam');
        assert.equal(await page.locator('#infoPanel').isVisible(), true);
        await capture(page, 'mobile-information');
        await page.click('#closeInfo');
        await page.locator('#pathwayDetails summary').click();
        assert.equal(await page.locator('#pathwayList li').count(), 6);
        assert.equal(await page.locator('#sourceList a').count(), 7);
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.waitForFunction(() => Math.round(camera.aspect * 100) === 160);
        assert.equal(await page.evaluate(() => Math.round(camera.aspect * 100)), 160);
        assert.deepEqual(errors, []);

        const fallback = await browser.newPage();
        const fallbackErrors = [];
        fallback.on('pageerror', error => fallbackErrors.push(error.message));
        await fallback.route(cdn, route => route.abort());
        await fallback.goto(url);
        assert.match(await fallback.locator('#status').textContent(), /3D library unavailable/);
        await fallback.selectOption('#compoundSelect', 'Temazepam');
        assert.match(await fallback.locator('#formation').textContent(), /CYP3A4/);
        assert.equal(await fallback.locator('#startBtn').isDisabled(), true);
        assert.deepEqual(fallbackErrors, []);
        console.log('PASS: clinical graph rendering, stage order, arrows, panels, reset/replay, hover/click, rotation/zoom, mobile layout, references, and CDN fallback; no application errors.');
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
