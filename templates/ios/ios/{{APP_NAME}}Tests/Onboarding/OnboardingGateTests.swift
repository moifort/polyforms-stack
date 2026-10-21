import Foundation
import Testing
@testable import {{APP_NAME}}

@MainActor
struct OnboardingGateTests {
    @Test func aFreshAccountIsSentToOnboarding() async {
        var client = OnboardingClient.preview
        client.launch = { LaunchState(firstName: nil, onboardingCompleted: false) }
        let gate = OnboardingGate(client: client)

        await gate.refresh()

        #expect(gate.state == .required)
    }

    @Test func anOnboardedAccountOpensTheAppWithItsName() async {
        let gate = OnboardingGate(client: .preview)

        await gate.refresh()

        #expect(gate.state == .ready)
        #expect(gate.firstName == "Ada")
    }

    @Test func aFailedLaunchIsSaidAndCanBeRetried() async {
        var client = OnboardingClient.preview
        client.launch = { throw Boom() }
        let gate = OnboardingGate(client: client)

        await gate.refresh()

        guard case .failed = gate.state else {
            Issue.record("expected a failure, got \(gate.state)")
            return
        }
    }
}
