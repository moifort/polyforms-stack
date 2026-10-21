import FirebaseCore
import SwiftUI

/// Shown once, before the app: a welcome that says what the app is for, then the
/// first name, the one thing it asks.
struct OnboardingScreen: View {
    /// Handed the first name the user gave, so the app knows it without asking.
    var onCompleted: (String) -> Void
    var client: OnboardingClient = .live

    @Environment(AuthSession.self) private var session
    @State private var step: Step = .welcome
    @State private var firstName = ""
    @State private var isSaving = false
    @State private var errorMessage: String?

    private enum Step {
        case welcome
        case firstName
    }

    var body: some View {
        NavigationStack {
            switch step {
            case .welcome:
                WelcomePage(onNext: { withAnimation { step = .firstName } })
            case .firstName:
                FirstNamePage(
                    firstName: $firstName,
                    isSaving: isSaving,
                    onNext: { Task { await complete() } },
                    onBack: { withAnimation { step = .welcome } }
                )
            }
        }
        .alert(
            "Impossible de terminer",
            isPresented: .init(get: { errorMessage != nil }, set: { if !$0 { errorMessage = nil } })
        ) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(errorMessage ?? "")
        }
        .onAppear {
            // Proposed, not imposed: the field stays editable.
            if firstName.isEmpty, let suggested = session.suggestedFirstName {
                firstName = suggested
            }
        }
    }

    private func complete() async {
        let name = firstName.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !name.isEmpty else { return }
        isSaving = true
        defer { isSaving = false }
        do {
            try await client.complete(name)
            onCompleted(name)
        } catch {
            errorMessage = reportError(error)
        }
    }
}

#Preview {
    if FirebaseApp.app() == nil { FirebaseApp.configure() }
    return OnboardingScreen(onCompleted: { _ in }, client: .preview).environment(AuthSession())
}
