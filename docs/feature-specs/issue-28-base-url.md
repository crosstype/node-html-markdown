# Feature Specification: Base URL for Links

**Issue:** [#28](https://github.com/crosstype/node-html-markdown/issues/28)
**Status:** Ready for Implementation
**Priority:** Medium
**Estimated Effort:** 6-8 hours

## Overview

Add a configuration option to prepend a base URL to relative links when converting HTML to Markdown. This enables proper URL resolution when the HTML content is extracted from a specific website or API endpoint.

### Value Proposition

- **URL Resolution**: Convert relative links to absolute links automatically during conversion
- **Content Portability**: Make markdown content self-contained with fully-qualified URLs
- **Web Scraping**: Essential for converting scraped HTML content where relative links need context
- **API Integration**: Useful when processing HTML from APIs that return relative URLs
- **Cross-Platform**: Generated markdown works correctly regardless of where it's viewed

## Current vs Desired Behavior

### Current Behavior

Relative URLs are preserved as-is in the markdown output:

**HTML Input:**
```html
<a href="/item-page.html">Item Name</a>
<a href="/docs/guide.html">Documentation</a>
<a href="../other/page.html">Other Page</a>
```

**Current Markdown Output:**
```markdown
[Item Name](/item-page.html)
[Documentation](/docs/guide.html)
[Other Page](../other/page.html)
```

**Problem:** These relative URLs only work in specific contexts and break when markdown is viewed elsewhere.

### Desired Behavior

With `hrefBaseUrl` set, relative URLs are resolved to absolute URLs:

**HTML Input (same as above):**
```html
<a href="/item-page.html">Item Name</a>
<a href="/docs/guide.html">Documentation</a>
<a href="../other/page.html">Other Page</a>
```

**Configuration:**
```typescript
new NodeHtmlMarkdown({ hrefBaseUrl: 'https://example.com' })
```

**Desired Markdown Output:**
```markdown
[Item Name](https://example.com/item-page.html)
[Documentation](https://example.com/docs/guide.html)
[Other Page](https://example.com/other/page.html)
```

**Benefit:** All links are fully-qualified and work anywhere the markdown is used.

## Design Specification

### Configuration

Add a new optional configuration property to control base URL prepending.

#### New Option Definition

**File:** `src/options.ts`

```typescript
export interface NodeHtmlMarkdownOptions {
  // ... existing options ...

  /**
   * Base URL to prepend to relative links
   *
   * When specified, relative URLs in href attributes will be resolved against this base URL.
   * Absolute URLs (starting with http://, https://, etc.) are not affected.
   *
   * @example
   * // HTML: <a href="/page.html">Link</a>
   * // With hrefBaseUrl: "https://example.com"
   * // Output: [Link](https://example.com/page.html)
   *
   * @example
   * // HTML: <a href="https://other.com/page">Link</a>
   * // With hrefBaseUrl: "https://example.com"
   * // Output: [Link](https://other.com/page)  // Absolute URL unchanged
   *
   * @default undefined
   */
  hrefBaseUrl?: string
}
```

#### Default Value

**File:** `src/config.ts`

No default value in the `defaultOptions` object (undefined by default):

```typescript
export const defaultOptions: Readonly<NodeHtmlMarkdownOptions> = Object.freeze({
  // ... existing options ...
  // hrefBaseUrl is intentionally not included (undefined by default)
});
```

### URL Resolution Behavior

#### 1. Relative URLs (Transform These)

**Root-relative paths** (start with `/`):
```typescript
// hrefBaseUrl: "https://example.com"
"/page.html"           → "https://example.com/page.html"
"/docs/guide.html"     → "https://example.com/docs/guide.html"
"/path/to/page"        → "https://example.com/path/to/page"
```

**Path-relative URLs** (no leading `/`):
```typescript
// hrefBaseUrl: "https://example.com/docs"
"guide.html"           → "https://example.com/docs/guide.html"
"../other/page.html"   → "https://example.com/other/page.html"
"./current/page.html"  → "https://example.com/docs/current/page.html"
```

**Parent directory references** (`..`):
```typescript
// hrefBaseUrl: "https://example.com/docs/v1"
"../v2/page.html"      → "https://example.com/docs/v2/page.html"
"../../other/page"     → "https://example.com/other/page"
```

#### 2. Absolute URLs (Do Not Transform)

URLs with explicit protocols should not be modified:

```typescript
"https://example.com/page"         → "https://example.com/page" (unchanged)
"http://example.com/page"          → "http://example.com/page" (unchanged)
"ftp://files.example.com/file"     → "ftp://files.example.com/file" (unchanged)
"mailto:user@example.com"          → "mailto:user@example.com" (unchanged)
"tel:+1234567890"                  → "tel:+1234567890" (unchanged)
```

#### 3. Protocol-Relative URLs (Do Not Transform)

URLs starting with `//` should not be modified:

```typescript
"//cdn.example.com/style.css"      → "//cdn.example.com/style.css" (unchanged)
"//images.example.com/img.png"     → "//images.example.com/img.png" (unchanged)
```

#### 4. Anchor Links (Do Not Transform)

Fragment-only URLs (hash links) should not be modified:

```typescript
"#section"                         → "#section" (unchanged)
"#top"                             → "#top" (unchanged)
```

#### 5. Query String & Fragment Handling

Relative URLs with query strings and fragments should be handled correctly:

```typescript
// hrefBaseUrl: "https://example.com"
"/page?id=123"                     → "https://example.com/page?id=123"
"/page#section"                    → "https://example.com/page#section"
"/page?id=123#section"             → "https://example.com/page?id=123#section"
```

#### 6. Empty or Missing href

Links without href or with empty href should be handled gracefully:

```typescript
""                                 → "" (unchanged, will be handled by existing logic)
undefined                          → Skip link (existing behavior)
```

### URL Resolution Algorithm

Use the browser's native URL resolution or a polyfill for Node.js:

```typescript
function resolveUrl(href: string, baseUrl: string): string {
  // Skip if no base URL configured
  if (!baseUrl) return href;

  // Skip if href is empty
  if (!href) return href;

  // Skip if href is already absolute (has protocol)
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(href)) return href;

  // Skip if href is protocol-relative (starts with //)
  if (href.startsWith('//')) return href;

  // Skip if href is anchor-only (starts with #)
  if (href.startsWith('#')) return href;

  try {
    // Use URL constructor for proper resolution
    const resolved = new URL(href, baseUrl);
    return resolved.href;
  } catch (e) {
    // If URL construction fails, return original href
    return href;
  }
}
```

**Note**: The `URL` constructor is available in:
- Modern browsers (all supported browsers)
- Node.js 10+ (which is the minimum version per package.json)

### Image URL Handling

The `hrefBaseUrl` option should **only** affect `<a>` tag href attributes, not `<img>` tag src attributes. If users need base URL resolution for images, that should be a separate option (e.g., `imgSrcBaseUrl`) in a future enhancement.

**Rationale**:
- Links and images often have different base URLs (e.g., CDN for images)
- Keeps the feature focused and simple
- Easy to extend later if needed

## Implementation Guide

### Files to Modify

1. **`src/options.ts`** - Add `hrefBaseUrl` option interface
2. **`src/config.ts`** - Modify the `a` translator to use base URL
3. **`test/options.test.ts`** - Add comprehensive tests for new option
4. **`README.md`** - Document the new option (optional)

### Implementation Steps

#### Step 1: Add Option Interface

**File:** `src/options.ts`

Add the new option to the interface (around line 113):

```typescript
export interface NodeHtmlMarkdownOptions {
  // ... existing options ...

  /**
   * Base URL to prepend to relative links
   *
   * When specified, relative URLs in href attributes will be resolved against this base URL.
   * Absolute URLs (starting with http://, https://, etc.) are not affected.
   *
   * @example
   * // HTML: <a href="/page.html">Link</a>
   * // With hrefBaseUrl: "https://example.com"
   * // Output: [Link](https://example.com/page.html)
   *
   * @example
   * // HTML: <a href="https://other.com/page">Link</a>
   * // With hrefBaseUrl: "https://example.com"
   * // Output: [Link](https://other.com/page)  // Absolute URL unchanged
   *
   * @default undefined
   */
  hrefBaseUrl?: string
}
```

#### Step 2: Create URL Resolution Utility

**File:** `src/utilities.ts` (add new function)

Add this helper function (placement suggestion: near other utility functions):

```typescript
/**
 * Resolve a potentially relative URL against a base URL
 * @param href The URL to resolve (may be relative or absolute)
 * @param baseUrl The base URL to resolve against
 * @returns The resolved absolute URL, or the original href if resolution is not needed/possible
 */
export function resolveUrl(href: string, baseUrl?: string): string {
  // Skip if no base URL configured
  if (!baseUrl) return href;

  // Skip if href is empty
  if (!href) return href;

  // Skip if href is already absolute (has protocol)
  // Matches: http:, https:, ftp:, mailto:, tel:, etc.
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(href)) return href;

  // Skip if href is protocol-relative (starts with //)
  if (href.startsWith('//')) return href;

  // Skip if href is anchor-only (starts with #)
  if (href.startsWith('#')) return href;

  try {
    // Use URL constructor for proper resolution
    // This handles:
    // - Root-relative: /page → https://example.com/page
    // - Path-relative: page → https://example.com/base/page
    // - Parent refs: ../page → https://example.com/page
    const resolved = new URL(href, baseUrl);
    return resolved.href;
  } catch (e) {
    // If URL construction fails, return original href
    // This shouldn't happen in practice, but provides a safe fallback
    return href;
  }
}
```

#### Step 3: Modify Link Translator

**File:** `src/config.ts`

**Current Code (lines 242-282):**
```typescript
'a': ({ node, options, visitor }) => {
  const href = node.getAttribute('href');
  if (!href) return {};

  // Encodes symbols that can cause problems in markdown
  let encodedHref = '';
  for (const chr of href) {
    switch (chr) {
      case '(':
        encodedHref += '%28';
        break;
      case ')':
        encodedHref += '%29';
        break;
      case '_':
        encodedHref += '%5F';
        break;
      case '*':
        encodedHref += '%2A';
        break;
      default:
        encodedHref += chr;
    }
  }

  const title = node.getAttribute('title');

  // Inline link, when possible
  if (node.textContent === href && options.useInlineLinks) return { content: `<${encodedHref}>` };

  return {
    postprocess: ({ content }) => content.replace(/(?:\r?\n)+/g, ' '),
    childTranslators: visitor.instance.aTagTranslators,
    prefix: '[',
    postfix: ']' + (!options.useLinkReferenceDefinitions
             ? `(${encodedHref}${title ? ` "${title}"` : ''})`
             : `[${visitor.addOrGetUrlDefinition(encodedHref)}]`)
  }
},
```

**Updated Code:**
```typescript
'a': ({ node, options, visitor }) => {
  const href = node.getAttribute('href');
  if (!href) return {};

  // Resolve relative URLs if base URL is configured
  const resolvedHref = resolveUrl(href, options.hrefBaseUrl);

  // Encodes symbols that can cause problems in markdown
  let encodedHref = '';
  for (const chr of resolvedHref) {
    switch (chr) {
      case '(':
        encodedHref += '%28';
        break;
      case ')':
        encodedHref += '%29';
        break;
      case '_':
        encodedHref += '%5F';
        break;
      case '*':
        encodedHref += '%2A';
        break;
      default:
        encodedHref += chr;
    }
  }

  const title = node.getAttribute('title');

  // Inline link, when possible
  // Note: Compare with resolved href to handle cases where base URL was applied
  if (node.textContent === resolvedHref && options.useInlineLinks) return { content: `<${encodedHref}>` };

  return {
    postprocess: ({ content }) => content.replace(/(?:\r?\n)+/g, ' '),
    childTranslators: visitor.instance.aTagTranslators,
    prefix: '[',
    postfix: ']' + (!options.useLinkReferenceDefinitions
             ? `(${encodedHref}${title ? ` "${title}"` : ''})`
             : `[${visitor.addOrGetUrlDefinition(encodedHref)}]`)
  }
},
```

**Key Changes:**
1. Added `resolveUrl()` call before encoding
2. Updated inline link comparison to use `resolvedHref`
3. All other logic remains the same

**Required Import:**
Add to imports at top of file:
```typescript
import { resolveUrl } from './utilities';
```

### Edge Cases to Handle

1. **Base URL with trailing slash**: Both `https://example.com` and `https://example.com/` should work
   - The URL constructor handles this automatically

2. **Base URL with path**: `https://example.com/docs/` should work correctly with relative URLs
   - The URL constructor handles this automatically

3. **Invalid base URL**: If base URL is malformed, fail gracefully
   - The try-catch in `resolveUrl` handles this

4. **Unicode in URLs**: URLs with Unicode characters should be handled correctly
   - The existing encoding logic handles this

5. **Special characters**: Already handled by existing encoding logic

6. **Reference links**: Base URL should work with `useLinkReferenceDefinitions`
   - Implementation handles this correctly

## Test Cases

### Test File: `test/options.test.ts`

Add comprehensive test suite for the new option:

```typescript
describe('hrefBaseUrl option', () => {
  test('Root-relative URLs', () => {
    const instance = new NodeHtmlMarkdown({ hrefBaseUrl: 'https://example.com' });
    const html = `
      <a href="/page.html">Page</a>
      <a href="/docs/guide.html">Guide</a>
      <a href="/path/to/resource">Resource</a>
    `;
    const res = instance.translate(html);
    expect(res).toBe(
      '[Page](https://example.com/page.html) ' +
      '[Guide](https://example.com/docs/guide.html) ' +
      '[Resource](https://example.com/path/to/resource)'
    );
  });

  test('Path-relative URLs', () => {
    const instance = new NodeHtmlMarkdown({ hrefBaseUrl: 'https://example.com/docs/' });
    const html = `
      <a href="guide.html">Guide</a>
      <a href="./current.html">Current</a>
    `;
    const res = instance.translate(html);
    expect(res).toBe(
      '[Guide](https://example.com/docs/guide.html) ' +
      '[Current](https://example.com/docs/current.html)'
    );
  });

  test('Parent directory references', () => {
    const instance = new NodeHtmlMarkdown({ hrefBaseUrl: 'https://example.com/docs/v1/' });
    const html = `
      <a href="../v2/page.html">V2 Page</a>
      <a href="../../other/page.html">Other</a>
    `;
    const res = instance.translate(html);
    expect(res).toBe(
      '[V2 Page](https://example.com/docs/v2/page.html) ' +
      '[Other](https://example.com/other/page.html)'
    );
  });

  test('Absolute URLs unchanged', () => {
    const instance = new NodeHtmlMarkdown({ hrefBaseUrl: 'https://example.com' });
    const html = `
      <a href="https://other.com/page">HTTPS</a>
      <a href="http://other.com/page">HTTP</a>
      <a href="ftp://files.com/file">FTP</a>
      <a href="mailto:user@example.com">Email</a>
      <a href="tel:+1234567890">Phone</a>
    `;
    const res = instance.translate(html);
    expect(res).toBe(
      '[HTTPS](https://other.com/page) ' +
      '[HTTP](http://other.com/page) ' +
      '[FTP](ftp://files.com/file) ' +
      '[Email](mailto:user@example.com) ' +
      '[Phone](tel:+1234567890)'
    );
  });

  test('Protocol-relative URLs unchanged', () => {
    const instance = new NodeHtmlMarkdown({ hrefBaseUrl: 'https://example.com' });
    const html = `
      <a href="//cdn.example.com/resource">CDN</a>
      <a href="//images.example.com/img.png">Image</a>
    `;
    const res = instance.translate(html);
    expect(res).toBe(
      '[CDN](//cdn.example.com/resource) ' +
      '[Image](//images.example.com/img.png)'
    );
  });

  test('Anchor links unchanged', () => {
    const instance = new NodeHtmlMarkdown({ hrefBaseUrl: 'https://example.com' });
    const html = `
      <a href="#section">Section</a>
      <a href="#top">Top</a>
    `;
    const res = instance.translate(html);
    expect(res).toBe('[Section](#section) [Top](#top)');
  });

  test('URLs with query strings and fragments', () => {
    const instance = new NodeHtmlMarkdown({ hrefBaseUrl: 'https://example.com' });
    const html = `
      <a href="/page?id=123">Query</a>
      <a href="/page#section">Fragment</a>
      <a href="/page?id=123#section">Both</a>
    `;
    const res = instance.translate(html);
    expect(res).toBe(
      '[Query](https://example.com/page?id=123) ' +
      '[Fragment](https://example.com/page#section) ' +
      '[Both](https://example.com/page?id=123#section)'
    );
  });

  test('Base URL with trailing slash', () => {
    const instance1 = new NodeHtmlMarkdown({ hrefBaseUrl: 'https://example.com' });
    const instance2 = new NodeHtmlMarkdown({ hrefBaseUrl: 'https://example.com/' });
    const html = `<a href="/page">Page</a>`;

    const res1 = instance1.translate(html);
    const res2 = instance2.translate(html);

    // Both should produce the same result
    expect(res1).toBe('[Page](https://example.com/page)');
    expect(res2).toBe('[Page](https://example.com/page)');
  });

  test('Base URL with path component', () => {
    const instance = new NodeHtmlMarkdown({ hrefBaseUrl: 'https://example.com/base/path/' });
    const html = `
      <a href="/page">Root</a>
      <a href="relative">Relative</a>
    `;
    const res = instance.translate(html);
    expect(res).toBe(
      '[Root](https://example.com/page) ' +
      '[Relative](https://example.com/base/path/relative)'
    );
  });

  test('Works with useLinkReferenceDefinitions', () => {
    const instance = new NodeHtmlMarkdown({
      hrefBaseUrl: 'https://example.com',
      useLinkReferenceDefinitions: true
    });
    const html = `
      <a href="/page1">Link 1</a>
      <a href="/page2">Link 2</a>
      <a href="/page1">Repeat</a>
    `;
    const res = instance.translate(html);
    expect(res).toBe(
      '[Link 1][1] [Link 2][2] [Repeat][1]\n\n' +
      '[1]: https://example.com/page1\n' +
      '[2]: https://example.com/page2'
    );
  });

  test('Works with useInlineLinks', () => {
    const instance = new NodeHtmlMarkdown({
      hrefBaseUrl: 'https://example.com',
      useInlineLinks: true
    });
    const html = `<a href="/page">https://example.com/page</a>`;
    const res = instance.translate(html);
    // Should use inline link style since text matches resolved URL
    expect(res).toBe('<https://example.com/page>');
  });

  test('No base URL - existing behavior unchanged', () => {
    const instance = new NodeHtmlMarkdown();
    const html = `
      <a href="/page">Relative</a>
      <a href="https://example.com">Absolute</a>
    `;
    const res = instance.translate(html);
    expect(res).toBe('[Relative](/page) [Absolute](https://example.com)');
  });

  test('Empty href handled gracefully', () => {
    const instance = new NodeHtmlMarkdown({ hrefBaseUrl: 'https://example.com' });
    const html = `<a href="">Empty</a>`;
    const res = instance.translate(html);
    expect(res).toBe('[Empty]()');
  });

  test('Special characters in URLs', () => {
    const instance = new NodeHtmlMarkdown({ hrefBaseUrl: 'https://example.com' });
    const html = `<a href="/page_(test)">Link</a>`;
    const res = instance.translate(html);
    // Should encode special characters
    expect(res).toBe('[Link](https://example.com/page_%28test%29)');
  });

  test('Images not affected by hrefBaseUrl', () => {
    const instance = new NodeHtmlMarkdown({ hrefBaseUrl: 'https://example.com' });
    const html = `<img src="/image.png" alt="Image"/>`;
    const res = instance.translate(html);
    // Image src should NOT be resolved
    expect(res).toBe('![Image](/image.png)');
  });
});
```

### Additional Edge Case Tests

```typescript
describe('hrefBaseUrl edge cases', () => {
  test('Invalid base URL handled gracefully', () => {
    // This should not throw, just use the invalid base as-is
    const instance = new NodeHtmlMarkdown({ hrefBaseUrl: 'not-a-valid-url' });
    const html = `<a href="/page">Link</a>`;

    // Should either resolve correctly or fall back to original href
    const res = instance.translate(html);
    expect(res).toMatch(/\[Link\]/);
  });

  test('Unicode in base URL', () => {
    const instance = new NodeHtmlMarkdown({ hrefBaseUrl: 'https://例え.jp' });
    const html = `<a href="/ページ">Link</a>`;
    const res = instance.translate(html);
    expect(res).toContain('[Link]');
  });

  test('Base URL without protocol', () => {
    // If someone passes a base URL without protocol, URL constructor will throw
    // Should fall back to original href
    const instance = new NodeHtmlMarkdown({ hrefBaseUrl: 'example.com' });
    const html = `<a href="/page">Link</a>`;
    const res = instance.translate(html);
    // Should either work or fall back gracefully
    expect(res).toMatch(/\[Link\]/);
  });

  test('Very long URLs', () => {
    const instance = new NodeHtmlMarkdown({ hrefBaseUrl: 'https://example.com' });
    const longPath = '/path/'.repeat(100) + 'page';
    const html = `<a href="${longPath}">Link</a>`;
    const res = instance.translate(html);
    expect(res).toContain('https://example.com/path/');
  });
});
```

## Acceptance Criteria

### Functional Requirements

- [ ] `hrefBaseUrl` option is defined in TypeScript interface
- [ ] Relative URLs (root-relative and path-relative) are resolved correctly
- [ ] Absolute URLs are not modified
- [ ] Protocol-relative URLs (`//...`) are not modified
- [ ] Anchor links (`#...`) are not modified
- [ ] Query strings and fragments are preserved during resolution
- [ ] Parent directory references (`../`) are resolved correctly
- [ ] Works correctly with `useLinkReferenceDefinitions` option
- [ ] Works correctly with `useInlineLinks` option
- [ ] Image `src` attributes are not affected by this option
- [ ] Invalid URLs fail gracefully without breaking conversion

### Non-Functional Requirements

- [ ] No performance degradation for users not using this option
- [ ] No breaking changes to existing behavior
- [ ] Uses standard URL resolution (URL constructor)
- [ ] Code follows existing patterns and style conventions
- [ ] TypeScript types are correct
- [ ] Works in both Node.js and browser environments

### Testing Requirements

- [ ] All test cases pass (see test cases section)
- [ ] All existing tests continue to pass
- [ ] Edge cases are covered
- [ ] Manual testing with real-world HTML content
- [ ] Verify no unintended side effects on images or other elements

### Documentation Requirements

- [ ] JSDoc comment is clear and includes examples
- [ ] Option is documented in README.md (see below)
- [ ] Examples demonstrate common use cases

## README.md Addition

Suggested addition to the README.md options section:

```markdown
### hrefBaseUrl

Type: `string`
Default: `undefined`

Base URL to prepend to relative links. When specified, relative URLs in `href` attributes will be resolved against this base URL. Absolute URLs are not affected.

**Example:**

```typescript
const NodeHtmlMarkdown = require('node-html-markdown');

const nhm = new NodeHtmlMarkdown({ hrefBaseUrl: 'https://example.com' });

const html = '<a href="/page.html">Link</a>';
const markdown = nhm.translate(html);
// Result: [Link](https://example.com/page.html)
```

This is particularly useful when:
- Converting scraped web content where URLs are relative
- Processing HTML from APIs that return relative URLs
- Making markdown content portable with fully-qualified URLs
```

## Implementation Checklist

- [ ] Add `hrefBaseUrl` option to `NodeHtmlMarkdownOptions` interface in `src/options.ts`
- [ ] Add `resolveUrl()` utility function to `src/utilities.ts`
- [ ] Export `resolveUrl` from `src/utilities.ts`
- [ ] Import `resolveUrl` in `src/config.ts`
- [ ] Modify `a` translator in `src/config.ts` to use `resolveUrl()`
- [ ] Add comprehensive test suite to `test/options.test.ts`
- [ ] Run full test suite and verify all tests pass
- [ ] Manual testing with various HTML inputs and base URLs
- [ ] Test with `useLinkReferenceDefinitions` enabled
- [ ] Test with `useInlineLinks` enabled
- [ ] Verify images are not affected
- [ ] Add documentation to README.md
- [ ] Create PR with clear description and examples

## Questions for Maintainers

1. **Image URLs**: Should images also respect a base URL? If yes, same option or separate `imgSrcBaseUrl`?
   - **Recommendation**: Start with links only. Add image support later if requested.

2. **Validation**: Should we validate that `hrefBaseUrl` is a valid absolute URL?
   - **Recommendation**: No strict validation. Let URL constructor handle it and fail gracefully.

3. **Trailing slash**: Should we normalize base URLs (add/remove trailing slash)?
   - **Recommendation**: No normalization. URL constructor handles it correctly.

4. **Error handling**: What should happen if URL resolution fails?
   - **Recommendation**: Fall back to original href (implemented in try-catch).

## Security Considerations

### URL Injection

While this feature doesn't introduce new security risks (it only affects markdown generation, not execution), implementers should be aware:

- **No validation is performed on `hrefBaseUrl`**: Users can pass any string
- **Resolved URLs are not sanitized**: The markdown output should be treated as untrusted
- **XSS concerns**: Not applicable (markdown is not executable)

**Recommendation**: Document that users should validate `hrefBaseUrl` if it comes from untrusted sources.

## Performance Considerations

- **URL constructor**: Very fast, negligible performance impact
- **Only applied when option is set**: No impact for users not using this feature
- **No additional loops**: Resolution happens in the existing link processing flow

**Expected impact**: < 1ms per link, negligible for typical documents.

## Resources

- **Original Issue**: https://github.com/crosstype/node-html-markdown/issues/28
- **URL API Spec**: https://url.spec.whatwg.org/
- **MDN URL Constructor**: https://developer.mozilla.org/en-US/docs/Web/API/URL/URL
- **Node.js URL Support**: https://nodejs.org/api/url.html
- **Test Runner**: `npm test` or `yarn test`

## Notes for Contributors

- Use the native `URL` constructor for URL resolution (supported in Node 10+)
- Follow existing code style and patterns
- Test thoroughly with various URL formats
- Include examples in PR description
- Consider real-world use cases (web scraping, CMS integration, etc.)
- If unsure about URL resolution behavior, test with the URL constructor in a Node REPL
- Don't forget to test interaction with other options (`useLinkReferenceDefinitions`, `useInlineLinks`)

## Future Enhancements

Potential follow-up features that could build on this:

1. **`imgSrcBaseUrl`**: Separate base URL for image sources
2. **`cssUrlBaseUrl`**: Base URL for CSS urls (if inline styles are ever supported)
3. **`resolveAllUrls`**: Boolean to apply base URL to all URL attributes
4. **Custom URL transformer**: Callback function for advanced URL manipulation

These are out of scope for this initial implementation.
