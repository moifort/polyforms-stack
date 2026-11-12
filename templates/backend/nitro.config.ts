/** The packages a production build keeps as files rather than bundling in. */
const BUNDLED_AS_FILES =
  /firebase-functions|firebase-admin|@google-cloud\/|google-auth-library|google-gax|gaxios|gcp-metadata|gtoken|@grpc\/|protobufjs|proto3-json-serializer|@sentry\//

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
      // Only `firebase deploy` reads this block, and the deploy goes through
      // Terraform: what runs is `service_config` in infra/function.tf. The values
      // below mirror it so that neither misleads; change both together.
      memory: '1GiB',
      cpu: 1,
      timeoutSeconds: 60,
      // Bounded by the memory: see `max_instance_request_concurrency`.
      concurrency: 16,
    },
  },
  // Rollup minifies the whole backend into one file. The maps are uploaded to
  // Sentry at deploy time and stay out of the deployed bundle.
  sourceMap: true,
  // A cold start spent 3.6 s of its 4.3 s loading dependencies before the first
  // line of the bundle (measured on Shiori, 89 instances): the firebase preset
  // leaves them as about 3,200 files in node_modules, and Cloud Run pays every
  // one of them. Bundling them in cut the load by 41 %. The Firebase and gRPC
  // stack stays on disk: google-gax reads its .proto files through `__dirname`,
  // which has no meaning inside an ES module, and firebase-admin requires
  // @google-cloud/firestore by deep path. Sentry stays whole: its injection
  // package locates its module hook by its own package name, and bundled in,
  // the outgoing HTTP spans silently stop being recorded.
  externals: {
    external: [BUNDLED_AS_FILES],
    inline: [(id) => !BUNDLED_AS_FILES.test(id)],
  },
  // jws does `require('stream')` and expects the Stream constructor, not the
  // module namespace rollup hands a bare require of a builtin.
  commonJS: { requireReturnsDefault: 'preferred' },
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
