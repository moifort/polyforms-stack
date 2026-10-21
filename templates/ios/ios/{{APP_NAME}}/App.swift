import FirebaseCore
import Sentry
import SwiftUI

@main
struct App: SwiftUI.App {
    init() {
        FirebaseApp.configure()
        #if DEBUG
        // Points Auth at the local emulator and signs in, only when the UI test
        // launch arguments are there. A normal Debug run is untouched.
        UITestEnvironment.bootstrapIfNeeded()
        #endif
        startSentry()
    }

    var body: some Scene {
        WindowGroup {
            AuthRoot()
        }
    }

    private func startSentry() {
        #if DEBUG
        // Debug builds (Xcode, simulator) never start Sentry, so their noise stays
        // out of the production project. Archived builds report.
        #else
        let dsn = Secrets.sentryDsn
        if dsn.isEmpty { return }

        SentrySDK.start { options in
            options.dsn = dsn
            // Errors are never sampled, only performance traces are.
            options.tracesSampleRate = 0.1
            options.enableAutoSessionTracking = true
            options.enableTimeToFullDisplayTracing = true
            // MetricKit hands over the system's own diagnostics: hangs, and the
            // watchdog kills with the stack they happened on.
            options.enableMetricKit = true
            // Trace headers on our GraphQL calls only, so an app error and the
            // backend error that caused it land in one trace.
            options.tracePropagationTargets = [APIClient.shared.baseURL.absoluteString]
        }
        #endif
    }
}
