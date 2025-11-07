# Feature Specification: Image Reference Links

**Issue:** [#71](https://github.com/crosstype/node-html-markdown/issues/71)
**Status:** Ready for Implementation
**Priority:** Medium
**Estimated Effort:** 4-6 hours

## Overview

Enable images to use link reference definitions when `useLinkReferenceDefinitions` is enabled, eliminating URL duplication in markdown output when images appear inside links.

### Value Proposition

- **Cleaner Output**: Eliminates redundant URLs in markdown when images are used within links
- **Consistency**: Aligns image behavior with link behavior when reference definitions are enabled
- **Maintainability**: Easier to update URLs in generated markdown (single reference point)
- **Readability**: Produces more concise markdown that's easier to read and edit

## Current vs Desired Behavior

### Current Behavior

When `useLinkReferenceDefinitions: true` is set, links use reference definitions but images do not:

**HTML Input:**
```html
<a href="https://example.com/very-long-url"><img src="https://example.com/very-long-url"/></a>
```

**Current Markdown Output:**
```markdown
[![][](https://example.com/very-long-url)][1]

[1]: https://example.com/very-long-url
```

**Problem:** The URL appears twice - once inline in the image and once in the reference definition.

### Desired Behavior

**Same HTML Input:**
```html
<a href="https://example.com/very-long-url"><img src="https://example.com/very-long-url"/></a>
```

**Desired Markdown Output:**
```markdown
[![][1]][1]

[1]: https://example.com/very-long-url
```

**Benefit:** The URL appears only once in the reference definition.

## Design Specification

### Configuration

This feature is controlled by the existing `useLinkReferenceDefinitions` option. No new options are required.

**Existing Option (no changes needed):**
```typescript
interface NodeHtmlMarkdownOptions {
  /**
   * Place URLS at the bottom and format links using link reference definitions
   * When enabled, both links and images will use reference-style URLs
   *
   * @default false
   */
  useLinkReferenceDefinitions?: boolean
}
```

### Behavior Specification

#### 1. Standalone Images (No Change)

Standalone images should continue to use inline URLs even when `useLinkReferenceDefinitions` is enabled:

```html
<img src="https://example.com/image.png" alt="Logo">
```

**Output:**
```markdown
![Logo](https://example.com/image.png)
```

**Rationale:** Standalone images are already concise and readable. Reference links provide the most benefit when URLs are repeated or when images are within links.

#### 2. Images Within Links (Changed Behavior)

When `useLinkReferenceDefinitions: true`, images inside links should use reference-style URLs:

**Case 2a: Same URL for image and link**
```html
<a href="https://example.com/page"><img src="https://example.com/page"/></a>
```
```markdown
[![][1]][1]

[1]: https://example.com/page
```

**Case 2b: Different URLs for image and link**
```html
<a href="https://example.com/page"><img src="https://example.com/image.png"/></a>
```
```markdown
[![][1]][2]

[1]: https://example.com/image.png
[2]: https://example.com/page
```

**Case 2c: Image with alt text**
```html
<a href="https://example.com/page"><img src="https://example.com/image.png" alt="Logo"/></a>
```
```markdown
[![Logo][1]][2]

[1]: https://example.com/image.png
[2]: https://example.com/page
```

**Case 2d: Image with title**
```html
<a href="https://example.com/page"><img src="https://example.com/image.png" title="Click me"/></a>
```
```markdown
[![][1]][2]

[1]: https://example.com/image.png "Click me"
[2]: https://example.com/page
```

#### 3. Detection Logic

The image translator needs to detect if it's inside an `<a>` tag:

```typescript
// Pseudocode
if (useLinkReferenceDefinitions && isInsideAnchorTag(node)) {
  // Use reference-style URL
  return `![${alt}][${refId}]`;
} else {
  // Use inline URL (current behavior)
  return `![${alt}](${src}${title})`;
}
```

#### 4. URL Deduplication

The `Visitor.addOrGetUrlDefinition()` method already handles URL deduplication. The same URL should receive the same reference ID regardless of whether it's used in an image or link.

## Implementation Guide

### Files to Modify

1. **`src/config.ts`** - Modify the `img` translator
2. **`src/visitor.ts`** - No changes needed (existing methods support this)
3. **`test/default-tags.test.ts`** - Add tests for new behavior
4. **`test/options.test.ts`** - Update existing `useLinkReferenceDefinitions` test

### Implementation Steps

#### Step 1: Modify Image Translator in `src/config.ts`

**Current Code (lines 284-296):**
```typescript
'img': ({ node, options }) => {
  const src = node.getAttribute('src') || '';
  if (!src || (!options.keepDataImages && /^data:/i.test(src))) return { ignore: true };

  const alt = node.getAttribute('alt') || '';
  const title = node.getAttribute('title') || '';

  return {
    content: `![${alt}](${src}${title && ` "${title}"`})`,
    recurse: false
  }
},
```

**Updated Code:**
```typescript
'img': ({ node, options, parent, visitor }) => {
  const src = node.getAttribute('src') || '';
  if (!src || (!options.keepDataImages && /^data:/i.test(src))) return { ignore: true };

  const alt = node.getAttribute('alt') || '';
  const title = node.getAttribute('title') || '';

  // Encode special characters in src (same as link encoding)
  let encodedSrc = '';
  for (const chr of src) {
    switch (chr) {
      case '(':
        encodedSrc += '%28';
        break;
      case ')':
        encodedSrc += '%29';
        break;
      case '_':
        encodedSrc += '%5F';
        break;
      case '*':
        encodedSrc += '%2A';
        break;
      default:
        encodedSrc += chr;
    }
  }

  // Use reference-style if inside an anchor tag and useLinkReferenceDefinitions is enabled
  const isInsideAnchor = parent?.tagName === 'A';
  const useReference = options.useLinkReferenceDefinitions && isInsideAnchor;

  const content = useReference
    ? `![${alt}][${visitor.addOrGetUrlDefinition(encodedSrc + (title ? ` "${title}"` : ''))}]`
    : `![${alt}](${encodedSrc}${title ? ` "${title}"` : ''})`;

  return {
    content,
    recurse: false
  }
},
```

**Key Changes:**
1. Added `parent` and `visitor` to destructured parameters
2. Added URL encoding logic (matches link encoding)
3. Added detection for parent `<a>` tag
4. Conditional logic to use reference-style or inline-style based on context
5. When using references, include title in the URL definition (not in the image syntax)

#### Step 2: Handle Images in `aTagTranslatorConfig`

The `aTagTranslatorConfig` already includes the `img` translator:

**Current Code (line 364):**
```typescript
export const aTagTranslatorConfig: TranslatorConfigObject = {
  'br': { content: '\n', recurse: false },
  'hr': { content: '\n', recurse: false },
  'pre': defaultTranslators['pre'],
  'strong,b': defaultTranslators['strong,b'],
  'del,s,strike': defaultTranslators['del,s,strike'],
  'em,i': defaultTranslators['em,i'],
  'img': defaultTranslators['img']
}
```

**No changes needed** - The updated `defaultTranslators['img']` will automatically be used.

#### Step 3: Update Table Cell Translator Config

Images in table cells should also inherit the new behavior:

**Current Code (line 344):**
```typescript
export const tableCellTranslatorConfig: TranslatorConfigObject = {
  'a': defaultTranslators['a'],
  'strong,b': defaultTranslators['strong,b'],
  'del,s,strike': defaultTranslators['del,s,strike'],
  'em,i': defaultTranslators['em,i'],
  'img': defaultTranslators['img']
}
```

**No changes needed** - The updated `defaultTranslators['img']` will automatically be used.

### Edge Cases to Handle

1. **Data URIs**: Images with `data:` URIs should not use references (they're already handled by `keepDataImages` option)
2. **Missing src**: Already handled by returning `{ ignore: true }`
3. **Nested links**: Markdown doesn't support nested links, current behavior should continue
4. **Multiple images in one link**: Each image should get its own reference
5. **Empty alt text**: Should work fine (produces `![][1]` which is valid)

## Test Cases

### Test File: `test/default-tags.test.ts`

Add a new test for images with reference links:

```typescript
test(`Image with Link Reference Definitions`, () => {
  const instance = new NodeHtmlMarkdown({ useLinkReferenceDefinitions: true });
  const url = 'https://example.com/page';
  const imgUrl = 'https://example.com/image.png';

  // Case 1: Image in link with same URL
  const html1 = `<a href="${url}"><img src="${url}"/></a>`;
  const res1 = instance.translate(html1);
  expect(res1).toBe(`[![][1]][1]\n\n[1]: ${url}`);

  // Case 2: Image in link with different URLs
  const html2 = `<a href="${url}"><img src="${imgUrl}"/></a>`;
  const res2 = instance.translate(html2);
  expect(res2).toBe(`[![][1]][2]\n\n[1]: ${imgUrl}\n[2]: ${url}`);

  // Case 3: Image with alt text
  const html3 = `<a href="${url}"><img src="${imgUrl}" alt="Logo"/></a>`;
  const res3 = instance.translate(html3);
  expect(res3).toBe(`[![Logo][1]][2]\n\n[1]: ${imgUrl}\n[2]: ${url}`);

  // Case 4: Image with title
  const html4 = `<a href="${url}"><img src="${imgUrl}" title="Click me"/></a>`;
  const res4 = instance.translate(html4);
  expect(res4).toBe(`[![][1]][2]\n\n[1]: ${imgUrl} "Click me"\n[2]: ${url}`);

  // Case 5: Standalone image (should NOT use reference)
  const html5 = `<img src="${imgUrl}" alt="Logo"/>`;
  const res5 = instance.translate(html5);
  expect(res5).toBe(`![Logo](${imgUrl})`);

  // Case 6: Multiple images in same link
  const html6 = `<a href="${url}"><img src="${imgUrl}"/><img src="${imgUrl}2"/></a>`;
  const res6 = instance.translate(html6);
  expect(res6).toBe(`[![][1][![][2]][3]\n\n[1]: ${imgUrl}\n[2]: ${imgUrl}2\n[3]: ${url}`);
});
```

### Test File: `test/options.test.ts`

Update the existing `useLinkReferenceDefinitions` test to include image cases:

```typescript
test(`useLinkReferenceDefinitions`, () => {
  const originalUseLinkReferenceDefinitions = instance.options.useLinkReferenceDefinitions;

  const url = 'http://www.github.com/crosstype';
  const imgUrl = 'http://example.com/image.png';

  // Original test HTML + new image cases
  const html = `Hello:&nbsp;
      <a href="${url}">a<br><br>b<strong>c</strong></a>
      <a>a<strong>b</strong></a>
      <a href="${url}/other">link2</a>
      <a href="${url}">repeat link</a>
      <a href="${url}">${url}</a>
      <a href="${url}"><img src="${imgUrl}"/></a>
      <img src="${imgUrl}" alt="standalone"/>
      &nbsp;Goodbye!
  `;

  instance.options.useLinkReferenceDefinitions = false;
  let res = translate(html);
  expect(res).toBe(
    `Hello: [a b**c**](${url}) a**b** [link2](${url}/other) [repeat link](${url}) <${url}> ` +
    `[![](${imgUrl})](${url}) ![standalone](${imgUrl}) Goodbye!`
  );

  instance.options.useLinkReferenceDefinitions = true;
  res = translate(html);
  expect(res).toBe(
    `Hello: [a b**c**][1] a**b** [link2][2] [repeat link][1] <${url}> ` +
    `[![][3]][1] ![standalone](${imgUrl}) Goodbye!\n\n` +
    `[1]: ${url}\n[2]: ${url}/other\n[3]: ${imgUrl}`
  );

  instance.options.useLinkReferenceDefinitions = originalUseLinkReferenceDefinitions;
});
```

### Additional Test Cases

Create comprehensive tests in a new describe block:

```typescript
describe('Image Reference Links Edge Cases', () => {
  test('Image with encoded special characters', () => {
    const instance = new NodeHtmlMarkdown({ useLinkReferenceDefinitions: true });
    const url = 'https://example.com/image_(test).png';
    const html = `<a href="https://example.com"><img src="${url}"/></a>`;
    const res = instance.translate(html);
    // Verify encoding is applied
    expect(res).toContain('[1]: https://example.com/image_%28test%29.png');
  });

  test('Multiple links with same image URL', () => {
    const instance = new NodeHtmlMarkdown({ useLinkReferenceDefinitions: true });
    const imgUrl = 'https://example.com/logo.png';
    const html = `
      <a href="https://example.com/page1"><img src="${imgUrl}"/></a>
      <a href="https://example.com/page2"><img src="${imgUrl}"/></a>
    `;
    const res = instance.translate(html);
    // Should reuse the same reference ID for the image
    expect(res).toBe(`[![][1]][2] [![][1]][3]\n\n[1]: ${imgUrl}\n[2]: https://example.com/page1\n[3]: https://example.com/page2`);
  });

  test('Image in link with inline link text', () => {
    const instance = new NodeHtmlMarkdown({ useLinkReferenceDefinitions: true });
    const html = `<a href="https://example.com"><img src="https://example.com/logo.png"/> Text</a>`;
    const res = instance.translate(html);
    expect(res).toBe(`[![][1] Text][2]\n\n[1]: https://example.com/logo.png\n[2]: https://example.com`);
  });
});
```

## Acceptance Criteria

### Functional Requirements

- [ ] When `useLinkReferenceDefinitions: true`, images inside `<a>` tags use reference-style URLs
- [ ] Standalone images continue to use inline URLs regardless of `useLinkReferenceDefinitions` setting
- [ ] Image alt text is preserved in reference-style images
- [ ] Image title attribute is included in the URL definition (not in image syntax)
- [ ] URL encoding is applied to image sources (matching link encoding behavior)
- [ ] URL deduplication works correctly (same URL = same reference ID)
- [ ] The feature works with images that have both `alt` and `title` attributes
- [ ] Multiple images in the same link each get their own references

### Non-Functional Requirements

- [ ] No performance degradation (image processing should remain fast)
- [ ] No breaking changes to existing behavior when `useLinkReferenceDefinitions: false`
- [ ] Code follows existing patterns and style conventions
- [ ] TypeScript types are correct (no `any` types introduced)

### Testing Requirements

- [ ] All new test cases pass
- [ ] All existing tests continue to pass
- [ ] Edge cases are covered (see test cases section)
- [ ] Manual testing confirms markdown output is valid and renders correctly

### Documentation Requirements

- [ ] Update JSDoc comment for `useLinkReferenceDefinitions` option to mention images
- [ ] Consider adding an example to README.md demonstrating the feature (optional)

## Implementation Checklist

- [ ] Modify `img` translator in `src/config.ts`
- [ ] Add URL encoding logic to image sources
- [ ] Add parent detection logic
- [ ] Add reference-style conditional logic
- [ ] Add comprehensive tests to `test/default-tags.test.ts`
- [ ] Update existing test in `test/options.test.ts`
- [ ] Run full test suite and verify all tests pass
- [ ] Manual testing with various HTML inputs
- [ ] Update JSDoc comment in `src/options.ts`
- [ ] Create PR with clear description and examples

## Questions for Maintainers

1. **Standalone image behavior**: Should standalone images also use references when `useLinkReferenceDefinitions: true`?
   - **Recommendation**: No, keep current behavior for readability

2. **Image title placement**: Should title be in the image syntax `![alt][1] "title"` or in the definition?
   - **Recommendation**: In the definition (as specified above), matching how link titles work

3. **Backward compatibility**: This changes output format. Should we add a separate option like `useImageReferenceDefinitions`?
   - **Recommendation**: No, piggyback on existing option for consistency

## Resources

- **Original Issue**: https://github.com/crosstype/node-html-markdown/issues/71
- **Markdown Spec**: https://spec.commonmark.org/0.30/#images
- **Reference Links Spec**: https://spec.commonmark.org/0.30/#reference-link
- **Test Runner**: `npm test` or `yarn test`

## Notes for Contributors

- Follow the existing code style (use existing translators as reference)
- Test thoroughly with `npm test` before submitting PR
- Include examples in PR description showing before/after markdown output
- If unsure about any design decision, ask in the issue thread before implementing
- Consider running the benchmark suite to ensure no performance regression
