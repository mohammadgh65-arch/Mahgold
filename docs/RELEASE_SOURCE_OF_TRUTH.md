# Mahgold release source of truth

## Canonical source (2026-11-25)
- Canonical branch: `mahgold-canonical-20261125`
- Pinned starting commit: `79faed5ae4a6870f9b975a6bb49acfd0b41e4825`
- Source PR: #18 (still unmerged; do not treat as production)
- Production: Cloudflare Worker/domain; never Netlify.
- This branch is a controlled integration baseline, not a declaration that production has been updated.

## Mandatory change protocol
1. Read the canonical branch head before every task. Do not start from `main`, an old ZIP, a prior chat artifact, or another feature branch unless the user explicitly asks.
2. Create one feature branch from the exact canonical head for one coherent change.
3. Keep changes scoped; do not replace whole files when a narrow patch is possible.
4. Record the base SHA, changed files, and purpose in the PR.
5. Run the lockfile-based install and production build; review errors and changed-file diff.
6. Verify desktop and mobile layouts plus regression checklist before merging.
7. Merge only the reviewed PR into the canonical branch; update this document's pinned SHA after integration.
8. Deploy only the exact reviewed canonical commit to Cloudflare staging first. Production is a separate deliberate release.
9. Keep each release SHA and rollback SHA recorded. Revert the release commit for rollback; do not reconstruct an older site from memory.

## Protected visual and behavior contracts
- Preserve the original green/gold Mahgold identity and original logo asset.
- No redesign or replacement of header, navigation, footer, product detail, touch zoom, offers, or mobile layout as a side effect of unrelated work.
- No live checkout/payment enablement, production database mutation, or secrets change as part of a visual feature.
- Changes to shared CSS must be component-scoped and accompanied by responsive regression review.

## Release checklist
- [ ] Base branch and SHA confirmed
- [ ] Diff limited to intended files
- [ ] Build passes
- [ ] No console/runtime errors
- [ ] Desktop and mobile reviewed
- [ ] Existing storefront flows regression-tested
- [ ] Staging deploy tied to the exact SHA
- [ ] Production release explicitly approved
- [ ] Rollback SHA recorded
