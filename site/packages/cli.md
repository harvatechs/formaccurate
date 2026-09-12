# @formaccurate/cli

Command-line tooling for form authors, developers, and CI pipelines to lint schemas, validate submissions standalone, and scaffold starter definitions.

## Installation

```bash
npm install -g @formaccurate/cli
# Or run with npx
npx @formaccurate/cli --help
```

## Commands

### `fa lint <schema-file>`

Lints an authored schema JSON against the standard FormAccurate specification.

```bash
fa lint ./schemas/business-permit.json
```

- Verifies snake_case field IDs, kebab-case form IDs, and required types.
- Exits with status `0` on success and `1` on error (ideal for GitHub Actions / pre-commit).

### `fa validate <schema-file> --values <values-file>`

Validates a JSON payload of form values against a schema offline without running a server.

```bash
fa validate ./schemas/business-permit.json --values ./payloads/submission.json
```

### `fa scaffold <form-id> [options]`

Generates a starter schema and server registration snippet.

```bash
fa scaffold permit-app --title "Commercial Permit Application" --out ./schemas/permit.json
```
