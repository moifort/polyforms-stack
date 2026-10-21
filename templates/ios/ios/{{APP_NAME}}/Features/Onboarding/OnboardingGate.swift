import Observation

/// Decides, once a user is signed in, whether to show the onboarding or the app.
/// Reads `me` at launch; `onboardingCompleted` drives the choice. Lives at
/// `AuthRoot` scope and is refreshed on sign-in and account switch.
@MainActor
@Observable
final class OnboardingGate {
    enum State: Equatable {
        case loading
        case required
        case ready
        case failed(String)
    }

    private(set) var state: State = .loading
    /// The user's first name, riding the same launch request: the profile settings
    /// draw it from here rather than asking the server again.
    private(set) var firstName: String?

    private let client: OnboardingClient

    init(client: OnboardingClient = .live) {
        self.client = client
    }

    func refresh() async {
        state = .loading
        do {
            let launch = try await client.launch()
            firstName = launch.firstName
            state = launch.onboardingCompleted ? .ready : .required
        } catch {
            state = .failed(reportError(error))
        }
    }

    /// Called by the onboarding on success, to enter the app without a re-fetch.
    func markCompleted(firstName: String) {
        self.firstName = firstName
        state = .ready
    }

    /// Clears the resolved state on sign-out, so the next account never sees the
    /// previous one's state for a frame.
    func reset() {
        state = .loading
        firstName = nil
    }
}
