# @formaccurate/cli

## 0.1.0

### Minor Changes

- 9ff1c01: Implement developer and CI command-line interface (`@formaccurate/cli`).

  - `fa lint`: Validate schema JSON definitions against FormAccurate specification with field path reporting
  - `fa validate`: Validate form values JSON payloads against schemas offline without a server
  - `fa scaffold`: Generate starter schema files and server integration code snippets
  - Executable binaries `formaccurate` and `fa`
  - Programmatic exports `lintSchema`, `validateValues`, `scaffoldSchema`, and `createCli`

### Patch Changes

- Updated dependencies [7b81bb6]
  - @formaccurate/core@0.1.0
