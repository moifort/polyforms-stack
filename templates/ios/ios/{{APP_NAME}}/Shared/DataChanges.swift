import Foundation

extension Notification.Name {
    /// Something changed on the server. Posted by `GraphQLHelpers.perform` after
    /// every mutation that came back, so a list left open on another tab redraws
    /// itself before the user gets back to it.
    ///
    /// One name for everything on purpose: lists are cheap to refetch, and naming
    /// what changed for each screen to decide whether it cares is where stale rows
    /// come from. Only screens listen; a page never subscribes.
    static let dataDidChange = Notification.Name("DataDidChange")
}

/// What a single write changed, when it changed one thing: a list that has that
/// row open patches it instead of reloading. A notice with no object may have
/// changed anything. Add a case per kind of object the app edits one at a time.
enum DataChange: Hashable, Sendable {
    case item(id: String)
}
