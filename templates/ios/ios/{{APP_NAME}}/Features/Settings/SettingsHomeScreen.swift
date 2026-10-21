import SwiftUI

/// The settings, connected: the account from the auth session, and every sheet
/// and push of `SettingsHomePage`.
struct SettingsHomeScreen: View {
    var client: SettingsClient = .live

    @Environment(AuthSession.self) private var authSession
    @Environment(\.dismiss) private var dismiss
    @State private var feedbackShown = false

    var body: some View {
        NavigationStack {
            SettingsHomePage(
                profileSubtitle: authSession.user?.displayName ?? authSession.user?.email,
                appVersion: Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "?",
                buildNumber: Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "?"
            ) { action in
                switch action {
                case .showFeedback: feedbackShown = true
                }
            }
            .navigationDestination(for: SettingsDestination.self) { destination in
                switch destination {
                case .profile: ProfileSettingsScreen(client: client)
                case .changelog: ChangelogScreen(client: client)
                }
            }
            .sheet(isPresented: $feedbackShown) {
                FeedbackSheet(onSend: sendFeedback)
            }
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    ToolbarIconButton(title: "Fermer", systemImage: "xmark", role: .cancel) { dismiss() }
                }
            }
        }
    }
}
