import Apollo
import Foundation

/// Sends the language the app is shown in as `Accept-Language` on every GraphQL
/// request. The backend uses it to write what it writes in the user's language. The app's language rather
/// than the device's first one: a user whose iPhone is in German sees the app
/// in English, and reads its summaries in English too. Runs at the HTTP layer
/// where the request is a plain `URLRequest`.
struct AcceptLanguageInterceptor: HTTPInterceptor {
    func intercept(
        request: URLRequest,
        next: NextHTTPInterceptorFunction
    ) async throws -> HTTPResponse {
        var request = request
        if let preferred = Bundle.main.preferredLocalizations.first ?? Locale.preferredLanguages.first {
            request.setValue(preferred, forHTTPHeaderField: "Accept-Language")
        }
        return try await next(request)
    }
}
