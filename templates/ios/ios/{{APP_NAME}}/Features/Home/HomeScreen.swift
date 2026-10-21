import SwiftUI

/// The first tab, connected: owns the settings sheet. The first feature of the
/// app replaces the page's empty state with what it shows.
struct HomeScreen: View {
    @Environment(\.accountFirstName) private var firstName
    @State private var settingsShown = false

    var body: some View {
        NavigationStack {
            HomePage(firstName: firstName) { action in
                switch action {
                case .openSettings: settingsShown = true
                }
            }
            .sheet(isPresented: $settingsShown) {
                SettingsHomeScreen()
            }
        }
    }
}
