import FirebaseAuth
import Observation
import Sentry

/// Single source of truth for the signed-in Firebase user. Lives at app scope;
/// views that react to sign-in and sign-out observe `user`.
@MainActor
@Observable
final class AuthSession {
    // Qualified: importing Sentry brings its own `User` into scope.
    private(set) var user: FirebaseAuth.User?
    @ObservationIgnored
    nonisolated(unsafe) private var handle: AuthStateDidChangeListenerHandle?
    /// The given name Apple handed over at sign-in. Apple sends it only on the
    /// very first authorization, so it is kept the moment it arrives.
    private var appleGivenName: String?

    /// The first name to propose in onboarding: Apple's given name when this
    /// sign-in carried one, else the one Firebase kept in the display name.
    var suggestedFirstName: String? {
        if let appleGivenName { return appleGivenName }
        guard let displayName = user?.displayName, !displayName.isEmpty else { return nil }
        let givenName = (try? PersonNameComponents(displayName, strategy: .name))?.givenName
        return givenName?.isEmpty == false ? givenName : nil
    }

    init() {
        user = Auth.auth().currentUser
        report(user)
        handle = Auth.auth().addStateDidChangeListener { [weak self] _, user in
            Task { @MainActor in
                guard let self else { return }
                // However the session ended (sign-out, account deleted, a dead
                // session dropped by the API client), the next user starts clean.
                if self.user != nil, user == nil { self.forgetAccount() }
                self.user = user
                self.report(user)
            }
        }
    }

    /// Names the account behind a crash report: the uid only, no email, no name.
    private func report(_ user: FirebaseAuth.User?) {
        SentrySDK.setUser(user.map { Sentry.User(userId: $0.uid) })
    }

    deinit {
        if let handle { Auth.auth().removeStateDidChangeListener(handle) }
    }

    func rememberAppleName(_ fullName: PersonNameComponents?) {
        let givenName = fullName?.givenName?.trimmingCharacters(in: .whitespacesAndNewlines)
        appleGivenName = givenName?.isEmpty == false ? givenName : nil
    }

    func signOut() throws {
        try Auth.auth().signOut()
    }

    /// Whoever signs in next must not open on this account's data: every cache
    /// the app keeps on disk is cleared here.
    private func forgetAccount() {
        appleGivenName = nil
        SnapshotCaches.clear()
    }

    /// Signs out when Firebase no longer knows the signed-in account (deleted,
    /// disabled): the ID token outlives the account by up to an hour. Returns
    /// whether it did.
    @discardableResult
    nonisolated static func dropSessionIfAccountIsGone() async -> Bool {
        guard let user = Auth.auth().currentUser else { return false }
        do {
            try await user.reload()
            return false
        } catch {
            let nsError = error as NSError
            guard nsError.domain == AuthErrorDomain,
                  let code = AuthErrorCode(rawValue: nsError.code),
                  [.userNotFound, .userDisabled, .userTokenExpired, .invalidUserToken].contains(code)
            else { return false }
            await MainActor.run { _ = try? Auth.auth().signOut() }
            return true
        }
    }
}
