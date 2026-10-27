const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const data = JSON.parse(html.match(/<script id="pharmacologyData" type="application\/json">([\s\S]*?)<\/script>/)[1]);
const { compounds, pathways, sources } = data;
const products = precursor => pathways.filter(p => p.from === precursor).map(p => p.to).sort();

test('diazepam first forms only nordiazepam or temazepam, each leading to oxazepam', () => {
    assert.deepEqual(products('Diazepam'), ['Nordiazepam', 'Temazepam']);
    assert.deepEqual(pathways.filter(p => p.to === 'Oxazepam').map(p => p.from).sort(), ['Nordiazepam', 'Temazepam']);
    assert.equal(pathways.find(p => p.from === 'Diazepam' && p.to === 'Nordiazepam').enzyme, 'CYP2C19 + CYP3A4');
    assert.equal(pathways.find(p => p.from === 'Diazepam' && p.to === 'Temazepam').enzyme, 'CYP3A4');
    assert.match(pathways.find(p => p.from === 'Nordiazepam').reaction, /3-hydroxylation/);
    assert.match(pathways.find(p => p.from === 'Temazepam' && p.to === 'Oxazepam').reaction, /N-demethylation.*minor/);
});

test('both hydroxy metabolites have distinct inactive glucuronides for urinary excretion', () => {
    for (const name of ['Temazepam', 'Oxazepam']) {
        assert.ok(products(name).includes(`${name} glucuronide`));
        const conjugation = pathways.find(p => p.from === name && p.to === `${name} glucuronide`);
        assert.equal(conjugation.phase, 'II');
        assert.equal(conjugation.enzyme, 'UGTs');
        assert.equal(compounds[conjugation.to].active, false);
        assert.match(compounds[conjugation.to].excretion, /Urinary excretion/);
        assert.match(compounds[conjugation.to].halfLife, /Not displayed/);
    }
    for (const name of ['Diazepam', 'Nordiazepam', 'Temazepam', 'Oxazepam']) assert.equal(compounds[name].active, true);
    assert.match(compounds.Temazepam.note, /Direct glucuronidation predominates/);
});

test('stages preserve precursor order without forcing temazepam through oxazepam', () => {
    for (const p of pathways) {
        assert.ok(compounds[p.from] && compounds[p.to]);
        assert.ok(compounds[p.from].stage < compounds[p.to].stage, `${p.from} precedes ${p.to}`);
        if (p.phase === 'I') assert.doesNotMatch(p.enzyme, /UGT/);
    }
    assert.equal(compounds['Temazepam glucuronide'].stage, compounds.Oxazepam.stage);
});

test('label-derived half-lives retain study context rather than generic uncited ranges', () => {
    assert.match(compounds.Diazepam.halfLife, /Up to 48 hours/);
    assert.match(compounds.Nordiazepam.halfLife, /Up to 100 hours/);
    assert.match(compounds.Temazepam.halfLife, /3.5–18.4 hours; mean 8.8/);
    assert.match(compounds.Oxazepam.halfLife, /5.7–10.9 hours; mean approximately 8.2/);
    assert.match(compounds.Oxazepam.halfLifeNote, /12 volunteers/);
    assert.match(compounds.Diazepam.halfLifeNote, /not a maximum/);
    const readme = fs.readFileSync(path.join(__dirname, '../README.md'), 'utf8');
    assert.doesNotMatch(html + readme, /20-100 hours|50-120 hours|8-22 hours|6-25 hours/);
});

test('all clinical nodes and pathways cite resolvable source IDs', () => {
    for (const item of [...Object.values(compounds), ...pathways]) {
        assert.ok(item.sources.length);
        for (const id of item.sources) assert.match(sources[id].url, /^https:\/\//);
    }
    assert.ok(sources.fda2023.url.endsWith('013263Orig1s100lbl.pdf'));
    assert.ok(compounds.Temazepam.sources.includes('temazepam'));
    assert.ok(compounds.Oxazepam.sources.includes('oxazepam'));
});

test('all inline application JavaScript parses', () => {
    const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
    assert.doesNotThrow(() => new vm.Script(scripts.at(-1)[1]));
});
