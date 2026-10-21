import Foundation

/// Everything the settings screens ask of the server, as closures: `.live` goes
/// through the API, `.preview` answers at once, a test builds the one it needs.
struct SettingsClient: Sendable {
    var changelog: @Sendable () async throws -> [ChangelogEntry]
    var deleteAccount: @Sendable () async throws -> Void
    /// After a deletion that seemed to fail: true when the account is gone all the
    /// same, and the session has been dropped.
    var accountIsGone: @Sendable () async -> Bool
}

extension SettingsClient {
    static let live = SettingsClient(
        changelog: { try await SettingsAPI.changelog() },
        deleteAccount: { try await SettingsAPI.deleteAccount() },
        accountIsGone: { await AuthSession.dropSessionIfAccountIsGone() }
    )

    static let preview = SettingsClient(
        changelog: { ChangelogEntry.previews },
        deleteAccount: {},
        accountIsGone: { false }
    )
}

extension ChangelogEntry {
    static let previews = [
        ChangelogEntry(
            version: "1.1",
            date: .now.addingTimeInterval(-86400 * 3),
            notes: ["Les listes s'ouvrent maintenant plus vite."]
        ),
        ChangelogEntry(
            version: "1.0",
            date: .now.addingTimeInterval(-86400 * 30),
            notes: ["Première version."]
        ),
    ]
}
