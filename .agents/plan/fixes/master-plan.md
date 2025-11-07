# Master Execution Plan: Issue & PR Cleanup

**Created:** 2025-11-07
**Repository:** node-html-markdown
**Base Branch:** `claude/agent-issues-cleanup-011CUsYjWB7NMJYAHfjx8RPr`
**Total Items:** 29 (25 issues, 4 PRs)

---

## Executive Summary

This plan orchestrates the systematic resolution of all 29 open items through a phased approach with parallel subagents. Each agent works in its own branch, creating PRs that can be reviewed and merged sequentially or in parallel based on dependencies.

**Key Principles:**
- Sequential where dependencies exist
- Parallel where possible for speed
- Each agent gets own branch + PR
- All tests must pass (no shortcuts)
- Branching tree structure for dependencies

---

## Orchestration Strategy

### Role of Main Coordinator (This Session)
- Launch subagents with detailed prompts
- Monitor progress and results
- Handle branch management and PR creation
- Resolve conflicts and dependencies
- Consolidate learnings across agents
- Make strategic decisions (e.g., PR #43)

### Subagent Responsibilities
- Investigate assigned issues/PRs
- Create/checkout designated branch
- Implement fixes with full test coverage
- Commit changes with conventional commits
- Report back with results and status
- Flag blockers for coordinator intervention

---

## Branching Strategy

```
claude/agent-issues-cleanup-011CUsYjWB7NMJYAHfjx8RPr (base)
│
├── fixes/agent-00-deps (SEQUENTIAL - Foundation)
│   └── fixes/agent-01-critical-build (SEQUENTIAL - Blockers)
│       ├── fixes/agent-02-pr-merges (PARALLEL GROUP 1)
│       ├── fixes/agent-03-critical-parsing (PARALLEL GROUP 1)
│       ├── fixes/agent-04-whitespace (PARALLEL GROUP 1)
│       ├── fixes/agent-05-lists (PARALLEL GROUP 1)
│       ├── fixes/agent-06-tables (PARALLEL GROUP 1)
│       ├── fixes/agent-07-code-blocks (PARALLEL GROUP 1)
│       ├── fixes/agent-08-edge-cases (PARALLEL GROUP 1)
│       └── fixes/agent-09-newlines (PARALLEL GROUP 1)
│           └── fixes/agent-10-pr43-review (SEQUENTIAL - Post-fixes)
│               ├── fixes/agent-11-feature-specs (PARALLEL GROUP 2)
│               └── fixes/agent-12-triage-cleanup (PARALLEL GROUP 2)
```

**Branch Naming Convention:** `fixes/agent-{NN}-{description}`
**PR Naming Convention:** `fix/feat/docs: {description} (Agent {NN})`

---

## Phase Breakdown

### Phase 0: Foundation (SEQUENTIAL)
**Agent 00: Dependency Updates**
- **Branch:** `fixes/agent-00-deps`
- **Parent:** Base branch
- **Goal:** Update all dependencies to latest CJS-compatible versions
- **Why First:** Ensures clean foundation, avoids version conflicts
- **Blocks:** All other agents

### Phase 1: Critical Blockers (SEQUENTIAL)
**Agent 01: Critical Build Issues**
- **Branch:** `fixes/agent-01-critical-build`
- **Parent:** `fixes/agent-00-deps`
- **Items:** #74 (circular dependency), #58 (perf functions), #63 (mixed-case tags)
- **Why Sequential:** Build must work before fixing other bugs
- **Blocks:** All parallel fix agents

### Phase 2: Parallel Fix Execution (PARALLEL)
All agents in this phase branch from `fixes/agent-01-critical-build` and can run simultaneously:

**Agent 02: PR Merge Validation**
- **Branch:** `fixes/agent-02-pr-merges`
- **Items:** PR #53 (docs typo), PR #47 (table empty cells)
- **Goal:** Final validation, merge if clean
- **Why:** Low risk, unblocks table issue #38

**Agent 03: Critical HTML Parsing**
- **Branch:** `fixes/agent-03-critical-parsing`
- **Items:** #63 (mixed-case tags) - if not in Phase 1
- **Goal:** Fix data-loss parsing bug
- **Note:** May merge with Agent 01

**Agent 04: Whitespace Handling**
- **Branch:** `fixes/agent-04-whitespace`
- **Items:** #61 (space before bold), #34 (space before em)
- **Goal:** Unified fix for whitespace before inline formatting
- **Related:** Share root cause

**Agent 05: List Formatting**
- **Branch:** `fixes/agent-05-lists`
- **Items:** #57 (nested list indents)
- **Goal:** Fix indent calculation
- **Note:** Maintainer already committed to this

**Agent 06: Table Parsing**
- **Branch:** `fixes/agent-06-tables`
- **Items:** #60 (tables in lists), #68 (nested tables)
- **Goal:** Comprehensive table parsing fixes
- **Note:** Related issues, may share solutions

**Agent 07: Code Block Formatting**
- **Branch:** `fixes/agent-07-code-blocks`
- **Items:** #52 (preserveWhitespace), #24 (newlines in pre)
- **Goal:** Fix code block whitespace handling
- **Related:** May share root cause

**Agent 08: HTML Edge Cases**
- **Branch:** `fixes/agent-08-edge-cases`
- **Items:** #65 (escape chars), #48 (link slash), #46 (heading in link), #49 (ignore option)
- **Goal:** Individual fixes for parsing edge cases
- **Note:** Unrelated issues, but can be handled together

**Agent 09: Newline Handling**
- **Branch:** `fixes/agent-09-newlines`
- **Items:** #69 (extra newlines)
- **Goal:** Fix or document newline behavior
- **Related:** #66 (by design - may close/document)

### Phase 3: Strategic Review (SEQUENTIAL)
**Agent 10: PR #43 Comprehensive Review**
- **Branch:** `fixes/agent-10-pr43-review`
- **Parent:** `fixes/agent-09-newlines` (or whichever parallel agent finishes last)
- **Items:** PR #43 (ESM/browser/CJS builds), PR #62 (Cloudflare fix)
- **Goal:** Deep review, testing, merge decision
- **Why Sequential:** Needs clean codebase, affects 4+ issues
- **Decision:** Merge #43 OR merge #62 + close #43

### Phase 4: Polish & Planning (PARALLEL)
All agents branch from `fixes/agent-10-pr43-review`:

**Agent 11: Feature Request Specs**
- **Branch:** `fixes/agent-11-feature-specs`
- **Items:** #71 (image refs), #28 (base URL)
- **Goal:** Create implementation specs for community PRs
- **Output:** Detailed specs, no implementation

**Agent 12: Triage & Cleanup**
- **Branch:** `fixes/agent-12-triage-cleanup`
- **Items:** #59 (perf - vague), #72 (figure - unclear), #66 (by design), #3 (testing), #5 (rollup)
- **Goal:** Close, clarify, or document remaining items
- **Output:** Close rationales, clarification requests

---

## Detailed Agent Assignments

### Agent 00: Dependency Updates
**Type:** Implementation
**Effort:** 2-4 hours
**Risk:** Low-Medium

**Tasks:**
1. Check all dependencies in package.json
2. Update to latest CJS-compatible versions (NO ESM-only deps)
3. Run `npm update` and `npm audit fix`
4. Test build and test suite
5. Commit: `chore: update dependencies to latest CJS versions`
6. Push branch and create PR

**Success Criteria:**
- All deps updated
- No ESM-only dependencies introduced
- All tests pass
- Build succeeds
- No security vulnerabilities

---

### Agent 01: Critical Build Issues
**Type:** Implementation
**Effort:** 4-8 hours
**Risk:** High (core fixes)

**Items:**
- #74: Circular dependency (dist/config.js ↔ dist/utilities.js)
- #58: perf* functions in build (breaks browsers)
- #63: Mixed-case HTML tags (data loss)

**Tasks:**
1. Fix circular dependency in build structure
2. Fix transformer.js to properly remove perf functions
3. Fix HTML parser to handle mixed-case tags
4. Add tests for all three fixes
5. Commit each fix separately with conventional commits
6. Push branch and create PR

**Success Criteria:**
- No circular dependencies
- Browser builds clean (no perf functions)
- Mixed-case tags parse correctly
- All existing tests pass
- New tests added and passing

---

### Agent 02: PR Merge Validation
**Type:** Review & Merge
**Effort:** 2-3 hours
**Risk:** Very Low

**Items:**
- PR #53: README typo fix
- PR #47: Table empty cells fix

**Tasks:**
1. Checkout PR #53, review changes, merge to agent branch
2. Checkout PR #47, review changes, verify tests
3. Run full test suite
4. Merge both PRs into single branch
5. Commit: `fix: merge PR #53 and PR #47 - docs and table fixes`
6. Close issues #38 (solved by PR #47)
7. Push branch and create PR

**Success Criteria:**
- Both PRs cleanly merged
- All tests pass
- Issue #38 referenced for closure

---

### Agent 03: Critical HTML Parsing
**Type:** Implementation
**Effort:** 3-5 hours
**Risk:** Medium

**Items:**
- #63: Partially capitalized HTML tags cause translation to stop

**Tasks:**
1. Investigate tag matching logic
2. Make tag matching case-insensitive
3. Add tests for mixed-case tags (<Br>, <DIV>, <pArAgRaPh>)
4. Verify no regressions
5. Commit: `fix: handle mixed-case HTML tags correctly`
6. Push branch and create PR

**Success Criteria:**
- Mixed-case tags parse correctly
- No data loss
- Tests cover edge cases
- All tests pass

---

### Agent 04: Whitespace Handling
**Type:** Implementation
**Effort:** 4-6 hours
**Risk:** Medium

**Items:**
- #61: Space is omitted before bold text
- #34: Handling newlines before `<em>` tags

**Tasks:**
1. Investigate whitespace normalization logic
2. Find shared root cause for both issues
3. Implement unified fix in translator
4. Add tests for newline + `<b>` and newline + `<em>`
5. Test edge cases (multiple newlines, spaces, etc.)
6. Commit: `fix: preserve whitespace before inline formatting elements`
7. Push branch and create PR

**Success Criteria:**
- Both issues resolved with single fix
- Newlines before inline elements convert to spaces
- Comprehensive test coverage
- All tests pass

---

### Agent 05: List Formatting
**Type:** Implementation
**Effort:** 3-5 hours
**Risk:** Medium

**Items:**
- #57: [Bug] Nested lists have invalid indents

**Tasks:**
1. Investigate list indent calculation logic
2. Fix indent to use 2 spaces (not 3)
3. Fix multiplicative compounding for nested lists
4. Add tests for 2-level and 3-level nesting
5. Commit: `fix: correct nested list indentation to 2 spaces`
6. Push branch and create PR

**Success Criteria:**
- Nested lists use 2-space indents
- No multiplicative compounding
- Tests cover multiple nesting levels
- All tests pass
- Addresses maintainer commitment from Oct 2023

---

### Agent 06: Table Parsing
**Type:** Implementation
**Effort:** 6-10 hours
**Risk:** High (complex logic)

**Items:**
- #60: Tables contained inside of lists are not parsed correctly
- #68: Nested tables cause incorrect formatting

**Tasks:**
1. Investigate table parsing in list contexts
2. Fix backslash escape issue for tables in lists
3. Investigate nested table handling
4. Implement fixes or document workarounds
5. Add comprehensive table tests (lists, nesting, edge cases)
6. Commit: `fix: improve table parsing in lists and nested contexts`
7. Push branch and create PR

**Success Criteria:**
- Tables in lists parse without extra backslashes
- Nested tables handled correctly or documented
- Comprehensive test suite
- All tests pass

---

### Agent 07: Code Block Formatting
**Type:** Implementation
**Effort:** 4-6 hours
**Risk:** Medium

**Items:**
- #52: preserveWhitespace not working for code block
- #24: Formatting for newlines in preformatted code blocks not clean

**Tasks:**
1. Investigate code block whitespace handling
2. Fix preserveWhitespace option for `<pre>` blocks
3. Improve newline handling in code blocks
4. Add tests for code block formatting
5. Commit: `fix: preserve whitespace and newlines in code blocks`
6. Push branch and create PR

**Success Criteria:**
- preserveWhitespace option works correctly
- Code blocks maintain formatting
- Tests cover various code block scenarios
- All tests pass

---

### Agent 08: HTML Edge Cases
**Type:** Implementation
**Effort:** 6-8 hours
**Risk:** Medium

**Items:**
- #65: Inserting unexpected escape characters
- #48: Link Text doesn't work with ending slash if quotes omitted
- #46: [Bug] The issue with the Heading wrapped inside a link
- #49: Ignore option not working as expected

**Tasks:**
1. Fix escape character issue (likely float parsing)
2. Fix link parsing for unquoted href with trailing slash
3. Fix heading preservation inside links
4. Fix ignore option processing order
5. Add tests for each issue
6. Commit each fix separately
7. Push branch and create PR

**Success Criteria:**
- All 4 edge cases resolved
- Individual tests for each issue
- All tests pass
- No regressions

---

### Agent 09: Newline Handling
**Type:** Implementation or Documentation
**Effort:** 2-4 hours
**Risk:** Low

**Items:**
- #69: Extra newlines added
- #66: Multiple newlines are converted to single newline (by design)

**Tasks:**
1. Investigate relationship between #69 and #66
2. Determine if #69 is a bug or expected behavior
3. Either fix #69 or document as intended
4. Close #66 with documentation improvement
5. Update docs for maxConsecutiveNewlines option
6. Commit: `fix/docs: clarify newline handling behavior`
7. Push branch and create PR

**Success Criteria:**
- Clear understanding of newline behavior
- #69 fixed or documented
- #66 closed with docs
- All tests pass

---

### Agent 10: PR #43 Comprehensive Review
**Type:** Review & Decision
**Effort:** 8-12 hours
**Risk:** High (major decision)

**Items:**
- PR #43: feat: bundles for browser, esm, cjs (addresses #35, #42, #5, #3)
- PR #62: Fix errors with process/document not being defined

**Tasks:**
1. Deep review of PR #43 code changes
2. Test all 3 build targets (browser, ESM, CJS)
3. Verify e2e tests
4. Assess risk and breaking changes
5. Compare with PR #62 (simpler alternative)
6. Make recommendation: Merge #43, OR merge #62 + defer #43
7. If merge #43: thorough testing, update docs
8. If merge #62: document why #43 deferred
9. Create implementation plan
10. Commit and push decision + implementation

**Success Criteria:**
- Clear decision made with rationale
- If merged: all tests pass, all 3 builds work
- Issues #35, #42, (possibly #5, #3) resolved or plan documented
- Risk assessment completed

---

### Agent 11: Feature Request Specs
**Type:** Planning
**Effort:** 4-6 hours
**Risk:** Low

**Items:**
- #71: Request: Add image URLs to link reference definitions
- #28: Feature: Base url for links

**Tasks:**
1. Analyze each feature request in detail
2. Design implementation approach
3. Create detailed spec for community PRs
4. Document API, config options, behavior
5. Create example usage and test cases
6. Commit: `docs: add implementation specs for approved features`
7. Push branch and create PR

**Success Criteria:**
- Detailed specs for both features
- Clear enough for community to implement
- Examples and test cases included
- No implementation (specs only)

---

### Agent 12: Triage & Cleanup
**Type:** Triage & Documentation
**Effort:** 3-5 hours
**Risk:** Low

**Items:**
- #59: Performance and resolution issues (vague)
- #72: how to markdown figure image (unclear)
- #66: Multiple newlines converted to single (by design)
- #3: Add test using js-dom (may be resolved by #43)
- #5: Add rollup builds (may be resolved by #43)

**Tasks:**
1. Review each issue for closure/clarification
2. #59: Request reproduction or close as insufficient info
3. #72: Request clarification on expected behavior
4. #66: Close as by-design with config documentation
5. #3, #5: Close if PR #43 merged, otherwise keep open
6. Document rationales for all decisions
7. Commit: `docs: triage and close resolved/unclear issues`
8. Push branch and create PR

**Success Criteria:**
- Clear action for each issue
- Close rationales documented
- Clarification requests prepared
- Issue tracker cleaned up

---

## Execution Flow

### Sequential Phases

**Phase 0 → Phase 1 (Sequential)**
```
Agent 00 (deps) COMPLETES
    ↓
Agent 01 (critical) STARTS
    ↓
Agent 01 COMPLETES
    ↓
Phase 2 begins
```

**Phase 2 (Parallel Launch)**
```
Agents 02-09 ALL START simultaneously
All work independently
All report back when complete
```

**Phase 2 → Phase 3 (Synchronization)**
```
ALL Agents 02-09 COMPLETE
    ↓
Agent 10 (PR #43) STARTS
    ↓
Agent 10 COMPLETES
    ↓
Phase 4 begins
```

**Phase 4 (Parallel Finish)**
```
Agents 11-12 START simultaneously
Both work independently
Both report back when complete
```

---

## Progress Tracking

### Metrics to Monitor
- Agents launched / completed
- Branches created / merged
- PRs opened / merged
- Issues closed
- Tests passing
- Build status

### Success Indicators
- All 12 agents complete successfully
- All tests passing in all branches
- All 29 items addressed (fixed, merged, closed, or documented)
- Clean merge path to main/master
- No regressions introduced

---

## Risk Mitigation

### High-Risk Items
1. **Agent 01 (critical build)** - Core infrastructure changes
   - Mitigation: Thorough testing, rollback plan
2. **Agent 06 (tables)** - Complex parsing logic
   - Mitigation: Comprehensive test suite, incremental approach
3. **Agent 10 (PR #43)** - Major refactor decision
   - Mitigation: Deep review, community feedback, beta testing

### Fallback Plans
- If agent gets stuck: Flag for coordinator intervention
- If tests fail: Additional investigative agent deployed
- If conflicts arise: Manual resolution by coordinator
- If approach fails: Pivot to alternative solution

---

## Final State

### Expected Outcomes
- **All 29 items resolved:**
  - Bugs fixed: 15+
  - PRs merged: 2-4
  - Issues closed: 5+
  - Specs created: 2
  - Triaged: 5+

- **12 PRs created:**
  - Each agent produces 1 PR
  - Can be reviewed independently
  - Can be merged sequentially or in batches
  - Clean git history with conventional commits

- **Codebase improved:**
  - All critical bugs fixed
  - Build system working
  - Comprehensive test coverage
  - Updated dependencies
  - Clean issue tracker

---

## Coordinator Responsibilities

### Before Launch
- ✅ Create master plan
- ✅ Generate all agent prompts
- ✅ Review and validate approach
- ⏳ Get user confirmation

### During Execution
- Launch agents per phasing
- Monitor progress
- Handle blockers and questions
- Resolve conflicts
- Coordinate branch merging

### After Completion
- Review all PRs
- Consolidate learnings
- Create final summary
- Merge or close all PRs
- Close all issues
- Celebrate! 🎉

---

**END OF MASTER PLAN**
