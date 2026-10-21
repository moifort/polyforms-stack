export default defineNitroConfig({
  compatibilityDate: '2026-09-14',
  experimental: { asyncContext: true },
  srcDir: 'server',
  ignore: ['**/*.test.ts'],
  preset: 'firebase',
  firebase: {
    gen: 2,
    nodeVersion: '22',
    httpsOptions: {
      region: 'europe-west3',
      memory: '512MiB',
      // Only `firebase deploy` reads this block. The deploy goes through
      // Terraform, so the ceiling that applies is `timeout_seconds` in
      // infra/function.tf; the two are kept equal so that neither misleads.
      timeoutSeconds: 60,
      concurrency: 80,
    },
  },
  // Rollup minifies the whole backend into one file. The maps are uploaded to
  // Sentry at deploy time and stay out of the deployed bundle.
  sourceMap: true,
  rollupConfig: {
    treeshake: {
      moduleSideEffects: (id) => id.includes('/graphql/') || id.includes('node_modules'),
    },
  },
  runtimeConfig: {
    adminToken: '',
    sentryDsn: '',
    // Baked in at build time by the deploy workflow (the git SHA), so Sentry can
    // tell which deploy an error comes from and pick the matching source maps.
    sentryRelease: process.env.SENTRY_RELEASE ?? '',
    devUserId: '',
    // The project the function runs in, set by Terraform.
    firebaseProjectId: '',
    // Dev only: the origin the simulator reaches this server at.
    publicBaseUrl: 'http://127.0.0.1:3000',
  },
})
