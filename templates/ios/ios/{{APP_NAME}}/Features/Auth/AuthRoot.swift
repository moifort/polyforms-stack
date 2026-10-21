import FirebaseCore
import SwiftUI

/// Top-level gate: the blocking update screen when the backend no longer supports
/// this build; otherwise the login when no Firebase user is signed in; once signed
/// in, the onboarding until it is completed, then the app.
struct AuthRoot: View {
    @State private var session = AuthSession()
    @State private var gate = OnboardingGate()
    @State private var supportGate = AppSupportGate()
    @Environment(\.scenePhase) private var scenePhase

    var body: some View {
        Group {
            if case .updateRequired(let appStoreURL) = supportGate.state {
                UpdateRequiredView(appStoreURL: appStoreURL)
            } else if isShowcase || session.user != nil {
                signedIn
            } else {
                LoginScreen()
            }
        }
        .environment(session)
        .environment(\.accountFirstName, gate.firstName)
        .task {
            guard !isShowcase else { return }
            await supportGate.check()
        }
        .onChange(of: scenePhase) { _, phase in
            if phase == .active, !isShowcase { Task { await supportGate.check() } }
        }
        .task(id: session.user?.uid) {
            if session.user != nil || isShowcase {
                await gate.refresh()
            } else {
                gate.reset()
            }
        }
    }

    /// The App Store captures: signed in as the showcase user, without Apple.
    private var isShowcase: Bool {
        #if DEBUG
        Showcase.isOn
        #else
        false
        #endif
    }

    @ViewBuilder
    private var signedIn: some View {
        switch gate.state {
        case .loading:
            StartupLoadingView()
        case .required:
            OnboardingScreen(onCompleted: { gate.markCompleted(firstName: $0) })
        case .ready:
            ContentView()
        case .failed(let message):
            ContentUnavailableView {
                Label("Connexion impossible", systemImage: "wifi.exclamationmark")
            } description: {
                Text(message)
            } actions: {
                AsyncButton("Réessayer") { await gate.refresh() }
            }
        }
    }
}

#Preview {
    if FirebaseApp.app() == nil { FirebaseApp.configure() }
    return AuthRoot()
}
