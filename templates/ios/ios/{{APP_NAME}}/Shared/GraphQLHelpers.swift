import Apollo
import ApolloAPI
import Foundation

enum GraphQLHelpers {
    /// Cache fully disabled: `.networkOnly` never reads the normalized store, and
    /// nothing in the app watches or reads it, which avoids a class of stale and
    /// normalization bugs. `requestTimeout` overrides the session's 60 s idle
    /// limit for a query that may legitimately keep the server silent longer.
    static func fetch<Q: GraphQLQuery>(
        _ client: ApolloClient,
        query: Q,
        requestTimeout: TimeInterval? = nil
    ) async throws -> Q.Data
    where Q.ResponseFormat == SingleResponseFormat {
        let response = try await calledOffWhenCancelled {
            try await client.fetch(
                query: query,
                cachePolicy: .networkOnly,
                requestConfiguration: requestTimeout.map { RequestConfiguration(requestTimeout: $0) }
            )
        }
        return try unwrap(response)
    }

    /// Every mutation goes through here, and posts the one change notice once the
    /// write landed, so no screen has to remember to.
    ///
    /// `changesData` is false for a mutation that changes nothing a list shows (a
    /// sign-in, an account deletion): every open screen refetches on the notice,
    /// so posting it for those costs requests for nothing. On by default: a new
    /// mutation that forgets to say stays correct, just dearer.
    ///
    /// `concerning` names the one object a mutation changed, sent as the notice's
    /// object: a list that knows what it has open can patch that row.
    static func perform<M: GraphQLMutation>(
        _ client: ApolloClient,
        concerning change: DataChange? = nil,
        mutation: M,
        requestTimeout: TimeInterval? = nil,
        changesData: Bool = true
    ) async throws -> M.Data
    where M.ResponseFormat == SingleResponseFormat {
        let response = try await calledOffWhenCancelled {
            try await client.perform(
                mutation: mutation,
                requestConfiguration: requestTimeout.map { RequestConfiguration(requestTimeout: $0) }
            )
        }
        let data = try unwrap(response)
        guard changesData else { return data }
        await MainActor.run {
            NotificationCenter.default.post(name: .dataDidChange, object: change)
        }
        return data
    }

    /// A request whose task was cancelled fails as a cancellation, whatever
    /// Apollo made of it: Apollo 2.x may report `noResults` before the outer
    /// stream closed on the cancellation.
    private static func calledOffWhenCancelled<Response>(
        _ request: () async throws -> Response
    ) async throws -> Response {
        do {
            return try await request()
        } catch ApolloClient.Error.noResults where Task.isCancelled {
            throw CancellationError()
        }
    }

    /// Turn a `GraphQLResponse` into its `Data`, surfacing GraphQL errors and
    /// missing data as `APIError`.
    private static func unwrap<O: GraphQLOperation>(_ response: GraphQLResponse<O>) throws -> O.Data {
        if let errors = response.errors, !errors.isEmpty {
            // The server names what went wrong in `extensions.code`: screens that
            // react to a specific outcome match on it.
            if let code = errors.compactMap({ $0.extensions?["code"] as? String }).first {
                throw APIError.domain(code: code, messages: errors.compactMap(\.message))
            }
            throw APIError.graphQL(messages: errors.compactMap(\.message))
        }
        guard let data = response.data else { throw APIError.invalidResponse }
        return data
    }

    /// Decode an ISO-8601 date string from a GraphQL DateTime scalar.
    static func parseISO8601(_ string: String) -> Date? {
        let withFraction = ISO8601DateFormatter()
        withFraction.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let withoutFraction = ISO8601DateFormatter()
        withoutFraction.formatOptions = [.withInternetDateTime]
        return withFraction.date(from: string) ?? withoutFraction.date(from: string)
    }

    /// An empty or blank optional string is absent (`.none`), never sent as `""`:
    /// branded server fields refuse an empty value.
    static func graphQLNullable(_ value: String?) -> GraphQLNullable<String> {
        guard let value, !value.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        else { return .none }
        return .some(value)
    }

    static func graphQLNullable<T>(_ value: T?) -> GraphQLNullable<T> {
        value.map { .some($0) } ?? .none
    }
}

enum APIError: LocalizedError {
    case invalidResponse
    case graphQL(messages: [String])
    /// A refusal the server named, e.g. `NOT_FOUND`. Carries the code so a screen
    /// can act on it rather than only show its message.
    case domain(code: String, messages: [String])

    var domainCode: String? {
        if case .domain(let code, _) = self { return code }
        return nil
    }

    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return String(localized: "Réponse invalide du serveur")
        case .graphQL(let messages), .domain(_, let messages):
            return messages.joined(separator: " · ")
        }
    }
}
