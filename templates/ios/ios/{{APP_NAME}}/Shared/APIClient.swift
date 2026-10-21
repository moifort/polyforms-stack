import Foundation

/// Resolves the Cloud Function that hosts the GraphQL API. All HTTP transport
/// happens through GraphQLClient (Apollo iOS).
///
/// `serverURL` in the app's defaults overrides it, for a run against the local
/// server or the staging project:
/// `xcrun simctl spawn <udid> defaults write {{BUNDLE_ID}} serverURL http://localhost:3000`.
struct APIClient: Sendable {
    static let shared = APIClient()

    private static let serverURLKey = "serverURL"
    // The deployed Cloud Function, written here once the first deploy printed it.
    // A wrong value does not fail loudly: any *.a.run.app host resolves, so the
    // app reaches Google and gets a 404 that reads like a broken API.
    private static let defaultServerURL = "{{SERVER_URL}}"

    var baseURL: URL {
        let stored = UserDefaults.standard.string(forKey: Self.serverURLKey)
            ?? Self.defaultServerURL
        return URL(string: stored) ?? URL(string: Self.defaultServerURL)!
    }
}
