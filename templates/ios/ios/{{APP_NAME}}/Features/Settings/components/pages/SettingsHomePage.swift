import SwiftUI

/// Where a row of the settings leads, pushed by the screen.
enum SettingsDestination: Hashable {
    case profile
    case changelog
}

/// Everything the settings page can ask for, besides the rows it pushes.
enum SettingsHomeAction {
    case showFeedback
}

/// The settings: the account, and the app itself. A new section (a subscription,
/// notifications, a connected service) is added here as its feature ships.
struct SettingsHomePage: View {
    /// Who the account is, under "Profil".
    let profileSubtitle: String?
    let appVersion: String
    let buildNumber: String
    let onAction: (SettingsHomeAction) -> Void

    var body: some View {
        List {
            Section {
                NavigationLink(value: SettingsDestination.profile) {
                    SettingsRow(
                        icon: "person.crop.circle.fill",
                        title: "Profil",
                        subtitle: profileSubtitle,
                        tint: .blue
                    )
                }
                .accessibilityIdentifier("settings-profile")
            }

            Section("Application") {
                NavigationLink(value: SettingsDestination.changelog) {
                    SettingsRow(
                        icon: "doc.text.fill",
                        title: "Version et nouveautés",
                        subtitle: "v\(appVersion) (\(buildNumber))",
                        tint: .indigo
                    )
                }
                .accessibilityIdentifier("settings-changelog")
                Button {
                    onAction(.showFeedback)
                } label: {
                    SettingsRow(
                        icon: "envelope.fill",
                        title: "Nous écrire",
                        subtitle: String(localized: "Signaler un problème ou proposer une idée"),
                        tint: .pink
                    )
                }
                .buttonStyle(.plain)
                .accessibilityIdentifier("settings-feedback")
            }
        }
        .navigationTitle("Réglages")
        .navigationBarTitleDisplayMode(.inline)
    }
}

#Preview {
    NavigationStack {
        SettingsHomePage(profileSubtitle: "ada@example.com", appVersion: "1.0", buildNumber: "42") { _ in }
    }
}
