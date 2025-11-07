# Issue & PR Comprehensive Report: node-html-markdown
**Generated:** 2025-11-07
**Repository:** crosstype/node-html-markdown
**Branch:** fixes-wip
**Total Open Items:** 29 (25 issues, 4 PRs)

---

## Executive Summary

### Quick Stats
- **Critical Bugs:** 3 (circular dependency, perf functions, mixed-case tags)
- **Confirmed Bugs:** 15 with reproduction steps
- **Bugs Needing Investigation:** 2 (vague/unclear)
- **Feature Requests:** 5 (3 maintainer-approved)
- **Open PRs:** 4 (2 ready to merge, 2 need decisions)
- **Duplicate Groups:** 5 clusters of related issues
- **Stale Items:** 8 issues/PRs over 2+ years old

### Key Insights
- **PR #43 blocks 4 issues** (#35, #42, #5, #3) but has no recent activity - needs decision
- **PR #47 approved 2+ years ago** by maintainer, still not merged - should merge
- **3 critical bugs** require immediate attention (#74, #58, #63)
- **Whitespace/formatting issues** are most common (7 issues)
- **Table parsing** has multiple related bugs (3 issues)

---

# PART 1: OPEN PULL REQUESTS

## Summary
- **Total PRs:** 4
- **Ready to Merge:** 2 (PRs #53, #47)
- **Needs Decision:** 1 (PR #43)
- **Conflicts:** PRs #62 and #43 overlap on Issue #42

---

## PR #53: README: Fix strike delimiter comment
**Status:** ✅ **READY TO MERGE**
**Author:** @Tobbe
**Age:** Unknown
**Files:** 1 (README.md)
**Changes:** +1/-1

**What it does:** Fixes documentation typo on line 158 - changes "Strong delimiter" to "Strike delimiter" for `strikeDelimiter` property.

**Issues solved:** None (docs only)

**Tests:** N/A

**Blockers:** None

**Recommendation:** **MERGE IMMEDIATELY** - Zero risk, trivial fix

---

## PR #47: Fixed table parsing issue for empty cells
**Status:** ✅ **READY TO MERGE** (maintainer committed)
**Author:** @smervs
**Age:** 2+ years (April 2023)
**Files:** 2 (src/config.ts, test/table.test.ts)
**Changes:** +19/-1

**What it does:** Fixes bug where first empty cell in table row gets dropped, causing column misalignment.

**Issues solved:** #38 (Table parsing bug)

**Technical changes:**
- Updated regex at src/config.ts:194 to handle empty cells properly
- Added `preserveIfEmpty: true` for td/th elements at src/config.ts:242-244
- Includes comprehensive test case

**Tests:** ✅ Yes - "Empty Cells" test included

**Blockers:** Maintainer said "get it merged + other issues sorted tomorrow" on Nov 4, 2025 - still not merged

**Recommendation:** **MERGE NOW** - Has tests, approved by maintainer, fixes real bug

---

## PR #62: Fix errors with process / document not being defined
**Status:** ⚠️ **CONFLICTS WITH PR #43**
**Author:** @TranquilMarmot
**Age:** 1.8 years (Feb 2024)
**Files:** 2 (src/utilities.ts, transformer.js)
**Changes:** +7/-3

**What it does:** Adds defensive checks for `process` and `document` globals to enable Cloudflare Workers and browser usage.

**Issues solved:** #42 (Cloudflare Support)

**Technical changes:**
- Added `if (!document) return void 0;` check in utilities
- Added `if (process && process.env && ...)` guards in perfStart/perfStop
- Updated transformer.js CI check

**Tests:** ❌ No tests (author tested in production Cloudflare Worker)

**Blockers:**
- Overlaps with PR #43 which also fixes this issue
- Community created "node-html-markdown-cloudflare" fork as workaround
- 6 positive reactions from users

**Recommendation:**
- **IF PR #43 NOT merging soon:** Merge this as quick fix
- **IF PR #43 IS merging:** Close as duplicate
- Decision depends on PR #43 timeline

---

## PR #43: feat: bundles for browser, esm, cjs
**Status:** ⚠️ **MAJOR REFACTOR - NEEDS DECISION**
**Author:** @SettingDust
**Age:** Unknown
**Files:** 18+ files
**Commits:** 18

**What it does:** Complete build system migration to esbuild with separate outputs for Browser, ESM, and CommonJS.

**Issues solved:**
- #35 (ESM Support)
- #42 (Cloudflare Support) - overlaps with PR #62
- #3 (jsdom browser testing)
- #5 (Browser rollup builds)

**Technical changes:**
- Migrated from current build to esbuild
- Three separate build outputs (browser/ESM/CJS)
- Browser bundle excludes node-html-parser
- Added e2e tests for each target
- Fixed DOMParser compatibility
- Pinned Yarn to 1.22.1

**Tests:** ✅ Partial - e2e tests added per maintainer request

**Blockers:**
- Very large change, high risk
- No recent activity
- Makes PR #62 redundant if merged
- Blocks 4 open issues from being addressed

**Recommendation:** **MAINTAINER DECISION REQUIRED**
- Addresses 4 issues vs PR #62's 1 issue
- More comprehensive but riskier
- Should prioritize review OR close to unblock #62

---

# PART 2: OPEN ISSUES

## Summary by Category

| Category | Count | Notes |
|----------|-------|-------|
| Confirmed Bugs | 15 | Have reproduction steps |
| Critical/High Severity | 3 | Build-breaking or data loss |
| Bugs Needing Investigation | 2 | Vague or unclear |
| Feature Requests | 5 | 3 pre-approved by maintainer |
| Enhancements | 2 | Lower priority improvements |
| By Design (Not Bug) | 1 | #66 - should document/close |

---

## CRITICAL / HIGH SEVERITY BUGS

### #74: Circular dependency
**Severity:** 🔴 **CRITICAL** (Build Issue)
**Created:** June 2025
**Status:** No activity

**Problem:** Circular dependency between `dist/config.js` and `dist/utilities.js` causes module resolution failure.

**Impact:** Build system broken

**Reproducibility:** ✅ Confirmed (structural)

**Related PRs:** None

**Recommendation:** **IMMEDIATE FIX REQUIRED**

---

### #63: Partially capitalized HTML tags cause translation to stop
**Severity:** 🔴 **HIGH** (Data Loss)
**Created:** March 2024
**Status:** No activity

**Problem:** Mixed-case tags like `<Br>` halt processing - all content after is lost.

**Example:** `'Foo<Br>Bar'` → `'Foo '` (should be `'Foo \nBar'`)

**Impact:** Silent data loss

**Reproducibility:** ✅ Confirmed with repro code

**Related PRs:** None

**Recommendation:** **IMMEDIATE FIX** - likely simple case-insensitive tag matching

---

### #58: perf* functions are back in v1.30.0
**Severity:** 🔴 **HIGH** (Browser Breaking)
**Created:** Nov 2023
**Status:** 1 comment, no resolution

**Problem:** Performance debugging functions not removed in production build, breaking browser compatibility.

**Root cause:** Build config or CI environment detection issue

**Impact:** Library unusable in browsers

**Reproducibility:** ✅ Confirmed (1 thumbs-up from affected user)

**Related PRs:** PR #62 partially addresses this

**Recommendation:** **IMMEDIATE FIX** - check transformer.js process.env.CI logic

---

## CONFIRMED BUGS - MEDIUM SEVERITY

### #69: Extra newlines added
**Created:** Nov 2024 | **Comments:** 0

**Problem:** Paragraph conversion adds excessive newlines.

**Example:** `<p>Hello</p><p>1</p>` produces extra spacing

**Reproducibility:** ✅ Confirmed with repro

**Related:** #66 (similar but #66 is by design)

---

### #68: Nested tables cause incorrect formatting
**Created:** Aug 2024 | **Comments:** 1

**Problem:** Outer container tables processed instead of inner content tables.

**Workaround:** User provided custom translator with `recurse: false`

**Reproducibility:** ✅ Confirmed (Danish legal site example)

**Related:** #38, #60 (table issues)

---

### #65: Inserting unexpected escape characters
**Created:** June 2024 | **Comments:** 1

**Problem:** Pattern `"9. "` becomes `"9\\."` instead of `"9. "`

**Suspected cause:** Float number parsing logic

**Reproducibility:** ✅ Confirmed with repro code

---

### #61: Space is omitted before bold text
**Created:** Jan 2024 | **Comments:** 0

**Problem:** Newline followed by `<b>` doesn't convert to space.

**Example:** `'1\n<b>2</b>'` → `'1**2**'` (should be `'1 **2**'`)

**Reproducibility:** ✅ Confirmed

**Related:** #34 (same with `<em>`)

**Recommendation:** Fix both #61 and #34 together with shared solution

---

### #60: Tables contained inside of lists are not parsed correctly
**Created:** Dec 2023 | **Comments:** 0

**Problem:** Tables in list items get backslash escapes, breaking table syntax.

**Output:** `* foo\\\n | foo | bar |\\` (backslashes corrupt table)

**Reproducibility:** ✅ Confirmed with detailed repro

**Related:** #38, #68 (table parsing)

---

### #57: [Bug] Nested lists have invalid indents
**Created:** Oct 2023 | **Comments:** 2
**Status:** ⚠️ **MAINTAINER COMMITTED TO FIX** (Oct 2023)

**Problem:** Uses 3 spaces instead of 2; compounds multiplicatively (9 spaces for level 3).

**Reproducibility:** ✅ Confirmed with clear repro

**Notes:** Follow-up requested July 2024, still not fixed

**Recommendation:** **HIGH PRIORITY** - maintainer already promised fix

---

### #52: preserveWhitespace not working for code block
**Created:** May 2023 | **Comments:** 0

**Problem:** Code blocks lose whitespace/indentation on new lines.

**Example:** TypeScript code loses proper formatting

**Reproducibility:** ✅ Confirmed with example

**Related:** #24 (code block formatting)

---

### #49: Ignore option not working as expected
**Created:** Apr 2023 | **Comments:** 4

**Problem:** `{ ignore: ["nav"] }` doesn't exclude nav elements.

**Root cause:** Block elements processed after ignore elements, overwriting config

**Workaround:** Reorder translator setup with patch tools

**Reproducibility:** ✅ Confirmed, workaround provided

**Note:** Discussion about uppercase tag names (NAV vs nav)

---

### #48: Link text doesn't work with ending slash if quotes are omitted
**Created:** Apr 2023 | **Comments:** 0

**Problem:** `<a href=https://foo.bar/>Text</a>` → `[](https://foo.bar)Text`

**Context:** iCal HTML, unquoted attributes with trailing slash

**Reproducibility:** ✅ Confirmed with specific cases

---

### #46: [Bug] Heading wrapped inside link loses heading format
**Created:** Feb 2023 | **Comments:** 4
**Labels:** bug
**Status:** ⚠️ **MAINTAINER ACKNOWLEDGED AS SUBOPTIMAL**

**Problem:** `<a href="/post"><h2>Title</h2></a>` → `[Title](/post)` (should be `## [Title](/post)`)

**Reproducibility:** ✅ Confirmed

**Note:** Secondary code formatting issue discussed and resolved

---

### #38: [Bug] Table parsing issue - empty cells
**Created:** June 2022 | **Comments:** 3
**Labels:** bug, help wanted
**Status:** ✅ **PR #47 EXISTS** (April 2023)

**Problem:** First empty cell missing from rawRows array.

**Expected:** `['', 'Purpose', 'Region']`

**Reproducibility:** ✅ Confirmed with screenshots

**Related:** #60, #68 (table parsing)

**Recommendation:** **MERGE PR #47**

---

### #34: Handling newlines before `<em>` tags
**Created:** Apr 2022 | **Comments:** 1
**Labels:** bug, help wanted
**Status:** ⚠️ **MAINTAINER APPROVED FOR PR**

**Problem:** Newline before `<em>` not converted to space.

**Example:** `unknown and\n<em>may contain</em>` → `unknown and_may contain_` (missing space)

**Context:** Found in @types/node documentation

**Reproducibility:** ✅ Confirmed

**Related:** #61 (same with `<b>`)

**Recommendation:** Fix with #61 as shared solution

---

## BUGS NEEDING INVESTIGATION

### #59: Performance and resolution issues
**Created:** Dec 2023 | **Comments:** 0
**Priority:** 🟡 LOW (Vague)

**Problem:** 20-second parse time + character anomalies on Chinese Minecraft Wiki URL.

**Details:** Minimal information, URL-encoded Chinese text

**Reproducibility:** ❌ Vague - needs investigation with specific URL

**Recommendation:** Request more details or close as insufficient info

---

### #72: how to markdown figure image
**Created:** Feb 2025 | **Comments:** 0
**Priority:** 🟡 UNCLEAR

**Problem:** May be usage question or missing feature for `<figure>` elements.

**Details:** User asks how to convert `<figure>` with nested `<picture>` and `<img>`

**Reproducibility:** ❌ Unclear if bug or usage question

**Recommendation:** Request clarification on expected behavior

---

## FEATURE REQUESTS

### #71: Add image URLs to link reference definitions
**Created:** Feb 2025 | **Comments:** 2
**Status:** ✅ **MAINTAINER APPROVED** (Feb 2025)

**Request:** Allow images to use link refs to avoid URL duplication.

**Current:** `[![][](LONG_URL)][1]\n[1]: LONG_URL`
**Desired:** `[![][1]][1]\n[1]: LONG_URL`

**Priority:** Low

**Recommendation:** Open to community PR

---

### #42: [Feature] Add Cloudflare Support
**Created:** Oct 2022 | **Comments:** 10
**Labels:** Feature Request
**Status:** ⚠️ **ACTIVE - MULTIPLE PRs**

**Request:** Remove `process` references for Cloudflare Workers compatibility.

**Current solutions:**
- PR #62: Quick fix with defensive checks
- PR #43: Comprehensive build refactor
- Temp package: `node-html-markdown-cloudflare`

**Priority:** Medium (high community interest)

**Recommendation:** Decide on PR #43 vs #62

---

### #35: [Feature] ESM Support
**Created:** Apr 2022 | **Comments:** 1
**Labels:** Feature Request, help wanted
**Status:** ✅ **MAINTAINER APPROVED** (Aug 2022), **PR #43 EXISTS**

**Request:** Build as both CommonJS and ES Module for tree-shaking.

**Priority:** Medium

**Recommendation:** Review/merge PR #43

---

### #28: Feature: Base URL for links
**Created:** Dec 2021 | **Comments:** 1
**Labels:** Feature Request, help wanted
**Status:** ✅ **MAINTAINER APPROVED** (Dec 2021)

**Request:** Option to prepend base URL to relative links (e.g., `hrefBaseUrl`).

**Example:** `/item.html` → `http://example.com/item.html`

**Priority:** Low (3 thumbs-up)

**Recommendation:** Open to community PR

---

### #5: Add rollup builds for single file browser js
**Created:** Nov 2020 | **Comments:** 0
**Labels:** enhancement, help wanted, good first issue
**Status:** **PR #43 EXISTS**

**Request:** Create bundled JS for browser (with/without node-html-parser).

**Priority:** Low

**Related:** #35, #42, #3

**Recommendation:** Addressed by PR #43

---

## ENHANCEMENTS / LOW PRIORITY

### #24: Formatting for newlines in preformatted code blocks not clean
**Created:** July 2021 | **Comments:** 0
**Labels:** enhancement
**Created by:** Maintainer (nonara)

**Issue:** Newline handling in `<pre>` blocks, especially in lists.

**Priority:** Low-Medium (3 thumbs-up)

**Related:** #52

---

### #3: Add test using js-dom for browser simulation
**Created:** Nov 2020 | **Comments:** 0
**Labels:** enhancement, good first issue, help wanted
**Status:** **PR #43 REFERENCED**

**Request:** Add browser simulation testing with js-dom.

**Priority:** Low

---

## BY DESIGN (NOT A BUG)

### #66: Multiple newlines are converted to single newline
**Created:** July 2024 | **Comments:** 1
**Status:** ⚠️ **MAINTAINER: BY DESIGN**

**Report:** Consecutive `<br>` tags treated as single newline.

**Maintainer response:** Intentional for readability/file size. Use `maxConsecutiveNewlines` config option.

**Related:** #69 (similar issue)

**Recommendation:** Close with documentation improvement

---

# PART 3: PATTERNS & DUPLICATES

## Duplicate/Related Issue Groups

### Group A: Whitespace Before Inline Formatting ⚡ QUICK WIN
- **#61:** Space omitted before `<b>` (bug)
- **#34:** Space omitted before `<em>` (bug)
- **Recommendation:** Fix both with single shared solution

### Group B: Newline Handling
- **#69:** Extra newlines added (bug)
- **#66:** Multiple newlines to single (by design)
- **Recommendation:** Clarify in docs, close #66 as working as intended

### Group C: Table Parsing Issues
- **#38:** Empty cells missing (has PR #47) ✅
- **#60:** Tables in lists get backslashes
- **#68:** Nested tables issue (has workaround)
- **Recommendation:** Merge PR #47, then address #60 and #68

### Group D: Code Block Formatting
- **#52:** preserveWhitespace not working
- **#24:** General code block newline formatting
- **Recommendation:** Review holistically

### Group E: Build/Distribution (PR #43 Critical)
- **#35:** ESM support (approved) ✅
- **#42:** Cloudflare support (active) ✅
- **#5:** Rollup builds ✅
- **#3:** Browser testing ✅
- **Recommendation:** PR #43 addresses all 4 - prioritize decision

---

## Common Themes

### By Topic (Issue Count)
1. **Whitespace/Formatting:** 7 issues (#69, #66, #61, #34, #52, #24, #65)
2. **Table Parsing:** 3 issues (#38, #60, #68)
3. **Build/Distribution:** 4 issues (#35, #42, #5, #58)
4. **HTML Parsing Edge Cases:** 3 issues (#63, #48, #46)

### By Age
**Stale (2+ years old):**
- #3 (Nov 2020 - 4+ years)
- #5 (Nov 2020 - 4+ years)
- #24 (July 2021 - 3+ years)
- #28 (Dec 2021 - 3+ years)
- #34 (Apr 2022 - 2+ years)
- #38 (June 2022 - 2+ years)
- #42 (Oct 2022 - 2+ years)
- PR #47 (Apr 2023 - 2+ years)

**Recent (2024-2025):**
- #74 (June 2025) - Newest
- #72 (Feb 2025)
- #71 (Feb 2025)
- #69 (Nov 2024)
- #68 (Aug 2024)

---

# PART 4: ACTION PLAN RECOMMENDATIONS

## Phase 1: Immediate (Critical Bugs)
**Timeline:** Days
**Effort:** Low-Medium

1. **#74: Circular dependency** - CRITICAL, build broken
2. **#58: perf functions in build** - CRITICAL, breaks browsers
3. **#63: Mixed-case HTML tags** - HIGH, data loss bug

**Expected outcome:** Library functional in all environments

---

## Phase 2: Quick Wins (Ready to Merge)
**Timeline:** Days
**Effort:** Minimal (review only)

1. **Merge PR #53** - Docs typo fix (zero risk)
2. **Merge PR #47** - Table empty cells (maintainer approved, has tests)
3. **Fix #57** - Nested list indents (maintainer committed Oct 2023)
4. **Fix #61 + #34 together** - Whitespace before inline formatting

**Expected outcome:** 2 PRs merged, 3 bugs fixed, community confidence restored

---

## Phase 3: Strategic Decision (PR #43)
**Timeline:** Week
**Effort:** High (thorough review)

**Decision required:** Merge, reject, or request changes for PR #43

**If MERGE #43:**
- Closes 4 issues (#35, #42, #5, #3)
- Close PR #62 as duplicate
- Requires thorough testing

**If REJECT/DEFER #43:**
- Merge PR #62 as quick Cloudflare fix
- Keep issues #35, #5, #3 open
- Less risk, less benefit

**Expected outcome:** Clear path forward for build/distribution issues

---

## Phase 4: Confirmed Bugs (Medium Priority)
**Timeline:** Weeks
**Effort:** Medium per bug

Tackle in order:
1. **#60:** Tables in lists (backslash escapes)
2. **#65:** Unexpected escape characters (float parsing)
3. **#48:** Unquoted href with trailing slash
4. **#46:** Heading wrapped in link
5. **#49:** Ignore option order issue
6. **#69:** Extra newlines (or document as related to #66)
7. **#68:** Nested tables (may need custom solution)
8. **#52:** preserveWhitespace for code blocks

**Expected outcome:** All confirmed bugs resolved

---

## Phase 5: Feature Requests (Approved)
**Timeline:** Ongoing
**Effort:** Varies

Open to community PRs (maintainer pre-approved):
1. **#71:** Image ref definitions (low effort)
2. **#28:** Base URL option (medium effort)

**Expected outcome:** Enhanced functionality via community contributions

---

## Phase 6: Cleanup & Clarification
**Timeline:** Ongoing
**Effort:** Low

1. **Close #66** - Mark as "by design" with config docs
2. **#59:** Request more details or close (insufficient info)
3. **#72:** Request clarification or close (usage question)
4. **#24:** Enhancement - keep open or plan solution

**Expected outcome:** Clean issue tracker

---

# PART 5: FILES NEEDING ATTENTION

## Critical Files for Fixes

### Build System
- `transformer.js:5` - process.env.CI check (related to #58, PR #62)
- `dist/config.js` + `dist/utilities.js` - Circular dependency (#74)

### Core Parsing
- `src/config.ts:194` - Table regex (PR #47 fixes #38)
- `src/config.ts:242-244` - preserveIfEmpty config (PR #47)
- Tag parsing (case-insensitive matching needed for #63)

### Utilities
- `src/utilities.ts:214, 218` - perfStart/perfStop (PR #62, #58)
- `src/utilities.ts` - document check (PR #62)

### Tests
- `test/table.test.ts` - Empty cells test (PR #47)
- Need tests for most bugs

### Documentation
- `README.md:158` - Strike delimiter (PR #53)
- Document `maxConsecutiveNewlines` option (#66)

---

# SUMMARY METRICS

## Coverage
- **Issues with PRs:** 5 out of 25 (20%)
- **Maintainer-approved issues:** 6 (ready for PRs)
- **Critical bugs:** 3 (require immediate attention)
- **Confirmed bugs with repro:** 15 (can be fixed)
- **Stale items:** 8 (over 2 years old)

## Effort Estimate
- **Immediate fixes (Phase 1):** 1-2 days
- **Quick wins (Phase 2):** 1 day (mostly review)
- **PR #43 decision (Phase 3):** 3-5 days (thorough review)
- **Medium bugs (Phase 4):** 2-3 weeks
- **Full cleanup:** 4-6 weeks total

## Impact Potential
- **Merging PR #53 + #47:** 2 PRs closed, 1 bug fixed
- **Fixing Phase 1 critical bugs:** Library functional everywhere
- **Merging/deciding PR #43:** 5-6 issues resolved
- **Completing Phase 4:** All confirmed bugs fixed
- **Full execution:** All 29 items closed or resolved

---

# APPENDIX: MAINTAINER COMMITMENTS

Issues where maintainer already indicated action:

1. **#57** - Promised fix (Oct 2023) - still open 1+ year later
2. **PR #47** - Committed to merge (Nov 4, 2025) - still not merged
3. **#71** - Approved for PR (Feb 2025)
4. **#46** - Acknowledged as suboptimal
5. **#34** - Acknowledged as bug, open to PR
6. **#35** - Approved feature (Aug 2022)
7. **#28** - Approved feature (Dec 2021)

**Recommendation:** Prioritize these to honor maintainer commitments and build community trust.

---

**END OF REPORT**

*For detailed issue/PR discussions, see GitHub issue tracker. For full PR diffs, see GitHub PR pages.*