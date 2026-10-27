# Diazepam Metabolism 3D Visualization

An interactive Three.js teaching schematic of diazepam biotransformation and elimination. Rotating spheres, rim lighting, directional arrows and flowing particles show the principal pathways. Select a sphere or use the compound selector for formation, further metabolism, elimination half-life and linked references.

## Metabolic pathways

| Precursor | Product | Transformation | Enzyme annotation |
| --- | --- | --- | --- |
| Diazepam | Nordiazepam (nordazepam; N-desmethyldiazepam) | N-demethylation | CYP2C19 and CYP3A4 |
| Diazepam | Temazepam | 3-hydroxylation | CYP3A4 |
| Nordiazepam | Oxazepam | 3-hydroxylation | CYP3A4, with other CYP contributions reported in vitro |
| Temazepam | Oxazepam | N-demethylation; minor route relative to direct conjugation | CYP3A4, with other CYP contributions reported in vitro |
| Temazepam | Temazepam glucuronide | Glucuronidation; predominant route | UGTs |
| Oxazepam | Oxazepam glucuronide | Glucuronidation | UGTs |

The glucuronides are inactive and undergo urinary excretion. The four unconjugated compounds shown are pharmacologically active. There is no direct diazepam → oxazepam edge in this schematic. The two oxazepam precursors represent alternative routes, not two molecules combining.

The [2023 FDA Valium label][fda] explicitly describes the two initial transformations and both downstream routes to oxazepam. [Current Valium labeling][valium] retains the CYP-dependent oxidation, conjugation, excretion and terminal half-life information. The CYP3A4 annotations on the downstream steps are supported by [human enzyme studies][cyp]; they are not claims of exclusive CYP3A4 activity.

### Formation versus elimination

UGTs conjugate temazepam and oxazepam; they do **not** form those compounds from their upstream precursors. Panels distinguish incoming formation reactions from outgoing metabolism and excretion.

The UGT details are qualified as in vitro findings, rather than an exhaustive list or an in vivo contribution estimate:

- [Oxazepam][oxa-ugt]: UGT2B15 conjugates the S-enantiomer; UGT2B7 and UGT1A9 conjugate the R-enantiomer.
- [Temazepam][tema-ugt]: UGT2B7/UGT1A9 and UGT1A6/UGT2B15 are implicated for R- and S-temazepam, respectively; exact in vivo shares are not established.

Temazepam's direct conjugation route is essential context. Its [product label][temazepam] describes predominantly the temazepam O-conjugate, with a minor N-desmethyl conjugate, and reports no active metabolites in the cited ADME study. The diagram retains the minor temazepam → oxazepam pathway from diazepam labeling without implying substantial circulating oxazepam after temazepam administration.

## Half-life values and interpretation

| Compound | Displayed elimination half-life | Source and context |
| --- | --- | --- |
| Diazepam | Up to 48 hours | Valium labeling; terminal elimination phase. Age, hepatic disease and interactions can prolong elimination beyond this value. |
| Nordiazepam | Up to 100 hours | Valium labeling; terminal elimination of the active metabolite. |
| Temazepam | 3.5–18.4 hours; mean 8.8 hours | Temazepam labeling; terminal half-life after temazepam administration; study population and method affect estimates. |
| Oxazepam | 5.7–10.9 hours; mean approximately 8.2 hours | Oxazepam labeling; single-dose study in 12 volunteers. This study range is not a universal clinical range. |

The glucuronides have no half-life assigned in this teaching model. Half-life describes plasma elimination, not duration of sedation. Values after directly administering temazepam or oxazepam do not predict their full concentration–time course when formed from diazepam. Patient factors and continued formation from longer-lived precursors matter.

Animation timing, node size, spacing, opacity and particle speed are illustrative and do not encode concentrations, branching fractions or reaction rates. Steps are revealed in dependency order for teaching; pathways can operate concurrently in vivo. Spheres represent compounds, not molecular structures or one molecule splitting into several products.

## Run and controls

Open `index.html` in a browser with WebGL support, or serve this directory with `python3 -m http.server 8000`. The 3D view loads pinned Three.js r128 from unpkg and requires network access to that CDN. The text pathways and compound selector remain available if the 3D library or WebGL cannot load.

- Drag to rotate; scroll to zoom; hover to highlight; click a sphere for information.
- Use the compound selector to read any panel, including before playback.
- **Start pathways** reveals the graph; **Replay pathways** starts a fresh presentation; **Reset** clears it even during playback.
- The pathway list and references are available under **Pathways, teaching notes & sources**. Close a compound panel with × or Escape.

On compact screens, enzyme and reaction annotations remain available in the panels and pathway list while the scene displays compound labels alone to avoid overlap.

## Validation and maintenance

`pharmacologyData` in `index.html` is the shared source for the 3D connections, text pathways and information panels. When changing a reaction, update its clinical source as well as its endpoints. The render loop owns presentation timing so reset/replay cannot leave delayed stage callbacks behind.

Run the clinical regression checks with Node.js 18 or newer:

```sh
node --test tests/pharmacology.test.cjs
```

For browser checks, install Playwright in your development environment and its Chromium browser, then run:

```sh
node tests/browser-smoke.cjs
```

The browser test checks staged formation, both oxazepam precursors, both conjugates, panel contents, reset/replay, direction and attachment of connections, camera interaction, small-screen access, and graceful failure without the CDN library. Optional environment variables: `PLAYWRIGHT_MODULE` (module path), `BROWSER_EXECUTABLE` (Chromium path), `THREE_JS_PATH` (local copy of the exact r128 CDN script), and `SCREENSHOT_DIR` (save diagnostic screenshots).

Pharmacology reviewed **October 26, 2026**, against upstream commit `fab20c2086f41e8a9b170b56059f462d6a86f488`. The audit corrected the direct oxazepam branch, ambiguous enzyme fields and unsupported generic half-life ranges in both the interface and this README. It did not establish whether the application is currently used for teaching.

## References

1. [FDA Valium prescribing information (2023), Clinical Pharmacology][fda].
2. [Valium prescribing information (2026), §12.3 Pharmacokinetics, DailyMed][valium].
3. [Temazepam prescribing information (updated November 6, 2025), Clinical Pharmacology, DailyMed][temazepam].
4. [Oxazepam prescribing information (updated July 11, 2025), Clinical Pharmacology, DailyMed][oxazepam].
5. [Ono et al. (1996), human CYP studies, *Xenobiotica*, 26:1155–1166][cyp]. DOI: 10.3109/00498259609050260.
6. [Court et al. (2002), oxazepam UGT stereoselectivity, *Drug Metabolism and Disposition*, 30:1257–1265][oxa-ugt]. DOI: 10.1124/dmd.30.11.1257.
7. [Bardhi et al. (2025), temazepam glucuronidation, *Drug Metabolism and Disposition*, 53:100104][tema-ugt]. DOI: 10.1016/j.dmd.2025.100104.

[fda]: https://www.accessdata.fda.gov/drugsatfda_docs/label/2023/013263Orig1s100lbl.pdf
[valium]: https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=260e2041-2bb3-482f-850e-b5d47a7bdbe6
[temazepam]: https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=bbb6e233-dc6b-43a7-8203-d91421d89921
[oxazepam]: https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=67f821fa-5663-4d69-82c9-5ee13a09f324
[cyp]: https://pubmed.ncbi.nlm.nih.gov/8948091/
[oxa-ugt]: https://pubmed.ncbi.nlm.nih.gov/12386133/
[tema-ugt]: https://pubmed.ncbi.nlm.nih.gov/40543327/
