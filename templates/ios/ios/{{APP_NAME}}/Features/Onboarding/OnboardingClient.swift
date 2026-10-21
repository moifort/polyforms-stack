import Foundation

/// What a signed-in launch reads, in one request.
struct LaunchState: Sendable {
    let firstName: String?
    let onboardingCompleted: Bool
}

/// What the onboarding asks of the server, as closures: `.live` goes through the
/// API, `.preview` answers at once, a test builds the one it needs inline.
struct OnboardingClient: Sendable {
    var launch: @Sendable () async throws -> LaunchState
    var complete: @Sendable (_ firstName: String) async throws -> Void
}

extension OnboardingClient {
    static let live = OnboardingClient(
        launch: { try await OnboardingAPI.launch() },
        complete: { try await OnboardingAPI.completeOnboarding(firstName: $0) }
    )

    static let preview = OnboardingClient(
        launch: { LaunchState(firstName: "Ada", onboardingCompleted: true) },
        complete: { _ in }
    )
}
