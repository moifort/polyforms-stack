import Foundation
import Sentry

/// Reports an error to Sentry, unless it is a cancellation or a lost network,
/// and returns the sentence to show the user.
func reportError(_ error: Error) -> String {
    let nsError = error as NSError
    if !isCancellation(error) && !isConnectivityLoss(nsError) {
        SentrySDK.capture(error: error)
    }
    return error.localizedDescription
}

/// The request was called off rather than refused: its task was cancelled, the
/// user left the screen that asked. Nothing failed.
func isCancellation(_ error: Error) -> Bool {
    let nsError = error as NSError
    return error is CancellationError
        || (nsError.domain == NSURLErrorDomain && nsError.code == NSURLErrorCancelled)
}

/// The device lost its network, not the app its way. The user is told; Sentry
/// has nothing to fix. The URL error may come wrapped, as the Firebase token
/// fetch wraps its own network failure.
private func isConnectivityLoss(_ error: NSError) -> Bool {
    if error.domain == NSURLErrorDomain && [
        NSURLErrorTimedOut,
        NSURLErrorNetworkConnectionLost,
        NSURLErrorNotConnectedToInternet,
    ].contains(error.code) {
        return true
    }
    guard let underlying = error.userInfo[NSUnderlyingErrorKey] as? NSError else { return false }
    return isConnectivityLoss(underlying)
}
