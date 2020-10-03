import { getParenthesesRange, truthyStr } from './utilities';
import { defaultEscapes } from './config';


/* ****************************************************************************************************************** */
// region: Types
/* ****************************************************************************************************************** */

export type EscapeConfig = {
  /**
   * Simple patterns that will be compiled into line start patterns. To escape the whole match, just enter a pattern.
   * You do not need to add flags or ^\s* to the beginning. These are added during compilation.
   *
   * Note: To escape a character other than the beginning of the match, use a single capture group to denote what should
   * be escaped.
   *
   * @example
   * // Compiles to /(?<=^s*?)(?:-)|(?<=^s*?\d+)(?:\.\s)/gm
   * [
   *   /-/,            // Escape if line starts with - (example: \- hello)
   *   /\d+(\.\s)/     // Escape the dot if line starts with a number followed by dot (example: 1\. hello)
   * ]
   */
  startLinePatterns: RegExp[]
  /**
   * Single characters to escape, globally
   */
  singleCharacters: string[]
  /**
   * User-defined patterns (These do not get compiled and execute separately)
   */
  customPatterns?: [ pattern: RegExp, replacement: string ][]
}

// endregion


/* ****************************************************************************************************************** */
// region: EscapeText
/* ****************************************************************************************************************** */

export class EscapeText {
  public readonly singleCharMatcher!: RegExp;
  public readonly startLinePatternMatcher!: RegExp;
  public config: EscapeConfig;

  constructor(userConfig?: Partial<EscapeConfig>) {
    /* Setup config */
    let { startLinePatterns, singleCharacters } = { ...defaultEscapes };

    if (userConfig?.startLinePatterns) startLinePatterns = startLinePatterns.concat(userConfig?.startLinePatterns);
    if (userConfig?.singleCharacters) singleCharacters = singleCharacters.concat(userConfig?.singleCharacters);
    const customPatterns = userConfig?.customPatterns;

    this.config = { customPatterns, singleCharacters, startLinePatterns };

    /* Compile matchers */
    this.compile();
  }

  /**
   * Compile matchers from config items
   */
  public compile() {
    /* Build single char matcher */
    let chars = '';
    for (const c of this.config.singleCharacters) chars += c;

    (<any>this).singleCharMatcher = new RegExp(String.raw`(?<Match>[${chars}])`, 'g');

    /* Split up and group all start line patterns in config */
    let patterns = '';
    const { startLinePatterns } = this.config;
    const patternGroups = new Map<string, string[]>()
    for (let i = 0; i < startLinePatterns.length; ++i) {
      const { source } = startLinePatterns[i];
      const { start, close } = getParenthesesRange(source) || {};
      let matchExp = !close ? source : source.substr(start! + 1, (close - start!) - 1);
      let lookBehind = `(?<=^\\s*?${!close ? '' : source.substr(0, start)})`;
      let lookAhead = close && (close < source.length -1) && source.substr(source.length - 1 - close!);

      const cur = patternGroups.get(lookBehind);
      if (cur) cur.push(matchExp + truthyStr(lookAhead));
      else patternGroups.set(lookBehind, [ matchExp + truthyStr(lookAhead) ]);
    }

    /* Build start line patterns */
    const groups = [ ...patternGroups.entries() ];
    for (let i = 0; i < groups.length; ++i) {
      const [ lookBehind, expressions ] = groups[i];
      patterns += lookBehind + truthyStr(expressions.length > 1, '(?:');

      for (let x = 0; x < expressions.length; ++x)
        patterns += `(?:${expressions[x]})` + truthyStr(x < expressions.length - 1, '|');

      patterns += truthyStr(expressions.length > 1, ')') + truthyStr(i < groups.length - 1, '|');
    }

    (<any>this).startLinePatternMatcher = new RegExp(patterns, 'gm');
  }

  /**
   * @internal
   */
  public escape(s: string) {
    let res = s
      .replace(this.singleCharMatcher, '\\$<Match>')
      .replace(this.startLinePatternMatcher, '\\$&');

    if (!this.config.customPatterns) return res;

    /* If specified, apply custom patterns */
    for (const r of this.config.customPatterns) s = s.replace(r[0], r[1]);
    return s;
  }
}

// endregion
