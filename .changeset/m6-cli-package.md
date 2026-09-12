---
"@formaccurate/cli": minor
---

Implement developer and CI command-line interface (`@formaccurate/cli`).

- `fa lint`: Validate schema JSON definitions against FormAccurate specification with field path reporting
- `fa validate`: Validate form values JSON payloads against schemas offline without a server
- `fa scaffold`: Generate starter schema files and server integration code snippets
- Executable binaries `formaccurate` and `fa`
- Programmatic exports `lintSchema`, `validateValues`, `scaffoldSchema`, and `createCli`
