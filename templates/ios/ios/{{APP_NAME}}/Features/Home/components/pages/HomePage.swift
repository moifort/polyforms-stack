import SwiftUI

enum HomeAction {
    case openSettings
}

/// The first tab, pure: a greeting and, until the first feature exists, the empty
/// state. Settings sit behind the gear, top right.
struct HomePage: View {
    let firstName: String?
    let onAction: (HomeAction) -> Void

    var body: some View {
        EmptyState(
            systemImage: "sparkles",
            title: "Rien pour l'instant",
            message: "Ce qui arrive dans l'application s'affichera ici."
        )
        .navigationTitle(title)
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                ToolbarIconButton(title: "Réglages", systemImage: "gearshape") { onAction(.openSettings) }
                    .accessibilityIdentifier("home-settings")
            }
        }
    }

    private var title: String {
        if let firstName, !firstName.isEmpty { return String(localized: "Bonjour \(firstName)") }
        return String(localized: "Accueil")
    }
}

#Preview {
    NavigationStack { HomePage(firstName: "Ada") { _ in } }
}

#Preview("Without a name") {
    NavigationStack { HomePage(firstName: nil) { _ in } }
}
