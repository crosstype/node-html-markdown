import { getParenthesesRange, truthyStr } from './utilities';
import { defaultEscapes } from './config';


/* ****************************************************************************************************************** */
// region: Types
/* ****************************************************************************************************************** */

export type EscapeConfig = {
  /**
   * Array of simple patterns to match at the beginning of lines
   * Note: You do not need to add flags or ^, as compiled regex will account for leading whitespace, newline, and flags
   * @example
   * [ /\+\s/, /\-+/ ] // Compiles to /^\s*?(\+\s)|(\-+)/g
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

    /* Build start line pattern matcher */
    let patterns = '';
    const { startLinePatterns } = this.config;
    for (let i = 0; i < startLinePatterns.length; i++) {
      const { source } = startLinePatterns[i];
      const { start, close } = getParenthesesRange(source) || {};
      let matchExp = !close ? source : source.substr(start! + 1, (close - start!) - 1);
      let lookBehind = !close ? '' : source.substr(0, start);
      let lookAhead = close && (close < source.length -1) && source.substr(source.length - 1 - close!);

      patterns +=
        '\(?:' +
        `(?<=^${lookBehind})` +
        matchExp +
        truthyStr(lookAhead, `(?=${lookAhead})`) +
        '\)' +
        truthyStr(i < startLinePatterns.length - 1, '|');
    }

    (<any>this).startLinePatternMatcher = new RegExp(String.raw`(?<=^)${patterns}`, 'gm');
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
