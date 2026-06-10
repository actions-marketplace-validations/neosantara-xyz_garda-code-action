# Bring your own GitHub App

> **Most users don't need this.** The recommended setup is to install the official **[Garda Code app](https://github.com/apps/garda-code)** and grant `id-token: write` — Garda then mints its `garda-code[bot]` token automatically via Neosantara's hosted token exchange, with no private key to manage. See [`hosted-token-exchange.md`](hosted-token-exchange.md).

Use this guide only if you cannot install the official app (for example, org policy blocks third-party apps) and want comments to appear under your own bot identity instead of `github-actions[bot]`. You run the action with a GitHub App installation token you generate yourself.

## Required app permissions

Review-only mode:

- Metadata: read
- Contents: read
- Issues: read & write
- Pull requests: read & write
- Actions: read

Fix mode additionally needs:

- Contents: read & write

Do not grant `Workflows: write` unless you have a separate, audited use case.

## Repository variables and secrets

Add these in the target repository or organization:

- Variable: `GARDA_APP_CLIENT_ID`
- Secret: `GARDA_APP_PRIVATE_KEY`
- Secret: `NEOSANTARA_API_KEY`

`GARDA_APP_PRIVATE_KEY` is the full `.pem` content from the GitHub App settings.

## Get bot id for commits

`bot_id` is only needed for fix mode commits. You can get it in workflow with `gh api`:

```yaml
- name: Get Garda bot user id
  id: bot-user
  run: echo "id=$(gh api '/users/${{ steps.app-token.outputs.app-slug }}[bot]' --jq .id)" >> "$GITHUB_OUTPUT"
  env:
    GH_TOKEN: ${{ steps.app-token.outputs.token }}
```

Then pass:

```yaml
bot_id: ${{ steps.bot-user.outputs.id }}
bot_name: ${{ steps.app-token.outputs.app-slug }}[bot]
```
