# Cloudflare Workers Builds deployment

Eterna is currently connected through **Workers Builds** (the Git-connected Worker deployment flow), not the legacy Pages-only build flow. This is a good fit for the current static browser game and leaves room for Worker APIs later.

## Dashboard settings

- Git repository: Imperator-Infinatum/Eterna
- Production branch: main
- Build command: npm run build
- Deploy command: npx wrangler deploy
- Preview command: npx wrangler preview
- Enable Preview builds: On
- Root directory: /

## Vite / Wrangler configuration

Wrangler's automatic configuration detects Vite and installs the Cloudflare Vite adapter. It may open a GitHub pull request adding the Cloudflare plugin, Wrangler configuration and package scripts. Review and merge that Cloudflare-generated pull request if it appears; it is part of the expected first-time setup.

The Vite config must contain an explicit plugins array so Wrangler can add its adapter. This is already present in vite.config.ts:

    plugins: [],

Do not replace the deploy command with a Pages command. This project is being deployed as a Worker with static assets.

## Expected result

Cloudflare will assign the Worker a workers.dev hostname under the account's workers.dev subdomain. The exact hostname is confirmed in the Cloudflare dashboard after a successful deployment; it is not necessarily a pages.dev address.

## Validation

The GitHub Actions workflow runs npm install, npm run typecheck and npm run build on the production branch and on pull requests targeting main.