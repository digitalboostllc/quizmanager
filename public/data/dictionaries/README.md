# Dictionary Files

This directory contains all the dictionary files used in the application. The files are served statically through Next.js public directory.

## Structure

Each dictionary file follows this format:
```json
{
  "metadata": {
    "language": "language_code",
    "wordCount": number,
    "lastUpdated": "YYYY-MM-DD",
    "version": "x.x.x"
  },
  "words": {
    "easy": Word[],
    "medium": Word[],
    "hard": Word[]
  }
}
```

## Current Dictionaries

- `fr.json` - French dictionary (v1.1.0)
<!-- Add new dictionaries here as they become available -->

## Adding New Dictionaries

1. Create a new JSON file named `[language_code].json`
2. Follow the structure above
3. Update the supported languages in the application
4. Add documentation here

## Usage

These dictionaries are accessed via the `useDictionary` hooks in the application. The files are served statically from the `/public` directory. 