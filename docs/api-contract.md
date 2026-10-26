# Data contract (proposal to WP2)

**Status: draft 0.1, for discussion with WP2.** The contract itself is [`packages/api-contract/openapi.yaml`](../packages/api-contract/openapi.yaml). This page explains the proposal, the reasons for it and the conventions it sets.

## The proposal in one sentence

Every component that provides data to an INNO-TREC tool describes its interface in **OpenAPI 3.1**, keeps that description in its repository, checks it automatically, and changes it only under versioning rules.

## Why a contract at all

The four tools (monitoring, PV performance, maintenance, energy credits) read data from the same infrastructure. The credit platform task asks for that link explicitly: "connected with the data management infrastructure (WP2), ensuring interoperability with the other tools".

Without a written contract, each tool learns the shape of each source by reading code or by trial, and integration problems appear at the end, when there is least time to fix them. A contract moves that work to the start: providers and tools agree on the shapes once and then build in parallel.

## Why OpenAPI

1. **It is the common standard for HTTP APIs.** OpenAPI is maintained by the OpenAPI Initiative, under the Linux Foundation, and is not tied to a vendor or a language. Version 3.1 uses JSON Schema (2020-12) for its data shapes, so the same schemas can validate data in any language.
2. **Providers rarely need to write it by hand.** Common frameworks generate it from code: FastAPI (Python) produces OpenAPI 3.1 by default, Spring uses springdoc, NestJS has a Swagger module, Django REST Framework has drf-spectacular. For many WP2 services the cost is a few annotations.
3. **Both sides can build in parallel.** The tools work against a simulated provider that follows the contract, as this template does today (`apps/web-starter/src/data/fakeServer.ts`). Each provider can then be developed and tested on its own schedule.
4. **Code comes from the contract, not from guesswork.** Types, clients and server stubs can be generated for TypeScript, Python, Java and others. In this template, `npm run api:types` generates the TypeScript types. When the first draft replaced the hand-written types, the compiler listed every screen that disagreed with the contract.
5. **Checks run automatically.** A linter validates the description (this template runs Redocly in CI). Breaking changes can be detected between two versions (for example with oasdiff), and contract tests can check that a running provider answers as described (for example with Schemathesis).
6. **Documentation comes for free.** Tools such as Redoc or Swagger UI turn the same file into readable reference pages for partners in other work packages.
7. **It outlives the project.** A machine-readable description of each interface makes the tools easier to maintain, audit and reuse after the project ends.

### What OpenAPI does not cover, and what to use instead

- **Events and live updates** (new readings, alerts as they happen). OpenAPI describes requests and responses. For message streams (MQTT, WebSocket, Kafka), the sibling standard **AsyncAPI** describes channels and messages, and it can reuse the same JSON Schemas. Until push is needed, the tools can poll (tracking item 8).
- **The blockchain ledger itself.** The ledger keeps its own interfaces. The contract describes the read models the tools need (balances, transactions, wallets) as the ECMS platform exposes them.
- **Bulk exports.** Large historical series may be better served as files (CSV or Parquet) with a described format. The contract can link to them.

## The compatibility rule

Proposed for every INNO-TREC data provider:

1. **Describe the interface in OpenAPI 3.1**, in the provider's repository, next to the code.
2. **Version it with semantic versioning.** A change that breaks existing clients needs a new major version (`/v2`) and a period in which both versions run.
3. **Check it in CI**: the description is valid, and generated code matches it.
4. **Follow the shared conventions** below, so the tools can treat every source the same way.
5. **Describe events in AsyncAPI**, with the same schemas, when a provider pushes data.

## Conventions

These are in the description of `openapi.yaml` as well.

- JSON in UTF-8, field names in camelCase.
- Instants are RFC 3339 strings in UTC with a `Z` suffix. Calendar days are `YYYY-MM-DD`.
- Every community has an IANA time zone (`Europe/Lisbon`). Periods and daily totals use it, and responses that contain times include it.
- Every quantity names its unit, in the field name (`pvKw`, `energyKwh`) or in a `unit` field.
- A missing value is `null`, never `0`.
- **The provider computes every figure** (totals, shares, indicators, statuses). The tools display them.
- Errors are RFC 9457 problem details (`application/problem+json`). Validation errors list one entry per field, with a stable `code` and a sentence for people.
- Texts meant for people (alert titles, suggestions) are written by the provider in the reader's language.
- Access uses a bearer token from the project's identity provider (below).

## Users and identity

Users and roles belong to the **community**, not to one tool. The same members and managers use all four tools, so separate lists would mean four accounts and roles that drift apart.

- **One identity provider** (OpenID Connect) signs people in for every tool and issues the tokens. Which product (for example Keycloak) is a WP2 decision (tracking D7).
- **The shared data API keeps one list** of users and their roles per community. The tools read it. The `/users` operations in the contract belong to that shared API, not to each tool.
- **One place manages users.** The template's Users page shows how that screen works; a tool that does not manage users removes it.

This keeps the template simple: it has no sign-in of its own, and it assumes a token and a role from the shared services.

## What the draft covers

| Area | Operations | Used by |
| --- | --- | --- |
| Energy | Readings, hourly or daily energy, totals | Monitoring |
| Performance | PR, availability, specific yield and efficiency per PV system, with references | PV performance |
| Data checks | Agreement between sources, per quantity | Monitoring |
| Alerts | List, acknowledge, resolve | Maintenance, PV performance |
| Assets | Assets with their open alerts | Maintenance |
| Users | Users, roles, invitations, changes | All tools (served once) |

**Not yet covered:** energy credits (they follow the ECMS Technical Specification, and their mapping is a next step), device control (tracking item 6) and events (AsyncAPI). The PV indicator definitions are still open (tracking D2).

## Working with the contract in this repository

```sh
npm run api:lint     # validate openapi.yaml (Redocly)
npm run api:types    # regenerate packages/api-contract/src/schema.d.ts
```

CI runs both and fails when the generated types do not match the contract. The starter imports the types from `@inno-trec/api-contract`; when the real provider replaces the simulated one, its client (`src/data/api.ts`) changes and `src/data/fakeServer.ts` is deleted; the pages stay as they are.
