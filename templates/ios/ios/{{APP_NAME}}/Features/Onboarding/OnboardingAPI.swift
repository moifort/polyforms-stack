import Foundation

enum OnboardingAPI {
    static func launch() async throws -> LaunchState {
        #if DEBUG
        if Showcase.isOn {
            return LaunchState(firstName: Showcase.firstName, onboardingCompleted: true)
        }
        #endif
        let data = try await GraphQLHelpers.fetch(
            GraphQLClient.shared.apollo,
            query: {{APP_NAME}}GraphQL.LaunchQuery()
        )
        return LaunchState(
            firstName: data.me.firstName,
            onboardingCompleted: data.me.onboardingCompleted
        )
    }

    static func completeOnboarding(firstName: String) async throws {
        let input = {{APP_NAME}}GraphQL.CompleteOnboardingInput(firstName: firstName)
        _ = try await GraphQLHelpers.perform(
            GraphQLClient.shared.apollo,
            mutation: {{APP_NAME}}GraphQL.CompleteOnboardingMutation(input: input),
            changesData: false
        )
    }
}
