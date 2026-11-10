# Cloudflare Pages deployment

1. Open Cloudflare Dashboard → Workers & Pages.
2. Choose Create application → Pages → Connect to Git.
3. Authorise GitHub and select Imperator-Infinatum/Eterna.
4. Set:
   - Project name: eterna (or another available name)
   - Production branch: main
   - Framework preset: Vite
   - Build command: npm run build
   - Build output directory: dist
   - Root directory: /
5. Save and deploy.
6. Enable preview deployments for branches such as dev.

Cloudflare will confirm the available pages.dev subdomain. Keep main as production and use branch previews to review experimental builds.