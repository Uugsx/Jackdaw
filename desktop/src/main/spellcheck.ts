import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const macSpellcheckCache = new Map<string, string[]>()

const kMacSpellcheckScript = [
  'ObjC.import("AppKit");',
  'ObjC.import("Foundation");',
  'const args = $.NSProcessInfo.processInfo.arguments;',
  'const word = ObjC.unwrap(args.objectAtIndex(args.count - 2));',
  'const language = ObjC.unwrap(args.objectAtIndex(args.count - 1));',
  'const string = $.NSString.stringWithString(word);',
  'const checker = $.NSSpellChecker.sharedSpellChecker;',
  'const range = { location: 0, length: string.length };',
  'const raw = checker.guessesForWordRangeInStringLanguageInSpellDocumentWithTag(range, string, language, 0);',
  'let suggestions = [];',
  'if (raw) { for (let i = 0; i < raw.count; i++) suggestions.push(ObjC.unwrap(raw.objectAtIndex(i))); }',
  'const output = $.NSString.stringWithString(JSON.stringify(suggestions));',
  '$.NSFileHandle.fileHandleWithStandardOutput.writeData(output.dataUsingEncoding($.NSUTF8StringEncoding));'
].join(' ')

function uniqueSuggestions(suggestions: readonly string[] | undefined, word: string): string[] {
  return [
    ...new Set(
      (suggestions ?? [])
        .filter((suggestion) => typeof suggestion == 'string')
        .map((suggestion) => suggestion.trim())
        .filter((suggestion) => suggestion && suggestion != word)
    )
  ]
}

function macSpellcheckLanguage(word: string): string {
  return /[\u0400-\u04ff]/u.test(word) ? 'ru_RU' : 'en_US'
}

async function getMacSpellcheckSuggestions(word: string): Promise<string[]> {
  const language = macSpellcheckLanguage(word)
  const cacheKey = `${language}:${word}`
  const cached = macSpellcheckCache.get(cacheKey)
  if (cached) {
    return cached
  }
  try {
    const { stdout } = await execFileAsync(
      '/usr/bin/osascript',
      ['-l', 'JavaScript', '-e', kMacSpellcheckScript, '--', word, language],
      { encoding: 'utf8', timeout: 1000, maxBuffer: 64 * 1024 }
    )
    const parsed: unknown = JSON.parse(stdout.trim())
    const suggestions = uniqueSuggestions(Array.isArray(parsed) ? (parsed as string[]) : [], word)
    macSpellcheckCache.set(cacheKey, suggestions)
    return suggestions
  } catch {
    macSpellcheckCache.set(cacheKey, [])
    return []
  }
}

export async function getSpellcheckSuggestions(
  word: string,
  dictionarySuggestions: readonly string[] | undefined
): Promise<string[]> {
  const suggestions = uniqueSuggestions(dictionarySuggestions, word)
  if (suggestions.length || process.platform != 'darwin') {
    return suggestions
  }
  return getMacSpellcheckSuggestions(word)
}
