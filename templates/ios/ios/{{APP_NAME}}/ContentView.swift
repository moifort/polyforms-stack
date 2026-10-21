import SwiftUI

/// The app once signed in and onboarded: the tabs. Each tab is a feature's
/// Screen; a new feature adds its tab here.
struct ContentView: View {
    var body: some View {
        TabView {
            Tab("Accueil", systemImage: "house") {
                HomeScreen()
            }
        }
    }
}

#Preview {
    ContentView()
}
