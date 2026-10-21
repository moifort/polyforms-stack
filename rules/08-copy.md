# Copy

Applies to everything the person using the product sees: on-screen text, release notes, the
store listing, the site.

## Tone

Impersonal. Describe what is in place without addressing the reader. "The cellar size can now be
changed from Settings" rather than "You can now change your cellar size". Name where the feature
is, with the exact words of the interface. Give an example wherever it saves an explanation. Full
sentences, normal punctuation, to the point.

## Forbidden

- **Never an em dash or an en dash.** They read as a machine signature. Rephrase, or use a period,
  a comma, a colon.
- No filler: "at any time", "simply", "also", "well".
- No chopped sentences, no technical jargon, no file or service names.
- Never the word "unlimited" for a metered plan with an anti-abuse ceiling: "without counting".

## Localisation

The source language is `{{SOURCE_LANGUAGE}}`, the served languages `{{SERVED_LANGUAGES}}`. The tone
above holds in each, in the natural register of the language.

One list of supported languages in the whole system, shared by the client and the server. A
third-party service's output depends on the language asked: its cache is keyed by language.

The iOS model:

- Strings are written in the source language in the Swift code and are the catalogue keys
  (`sourceLanguage` = source). The development language of the target is English: the fallback for
  every phone in another language.
- With that setup, the catalogue compiler emits the source-language table only when **each key
  carries an explicit source-language unit**; a key without one falls back to English on a
  source-language phone.
- After any on-screen text change: build, then `{{STRINGS_CHECK_COMMAND}} --write` (fills the
  source unit, drops stale keys, lists what lacks English), fill the English, rerun without
  `--write` until it reports every string translated, commit the catalogue with the UI change. CI
  runs the same check without `--write`.
- The catalogue tool files strings by catalogue **file name**: a copy under another name marks
  every key stale.
- `Accept-Language` sends the app's language (`Bundle.main.preferredLocalizations.first`), not the
  phone's first one.
- A component property typed as a raw string that carries static copy is never extracted and stays
  in the source language: type it as a localised key, so a computed string is refused.

## README and store description

Same principles for the entry documentation: say what the project does, not how it is built; why
before how; numbered steps. Deep architecture has no place in a README, and a README embeds no
screenshot that ages.
