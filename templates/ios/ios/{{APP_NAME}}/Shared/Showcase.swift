#if DEBUG
import Foundation

/// The App Store captures: launched with `-showcase`, the app skips the Apple
/// sign-in and every read the captured screens make answers from fixtures here
/// rather than from the server. Debug-only by construction: the Release archive
/// compiles none of it. Grows with the app: each captured screen's data is added
/// here, derived from one list so no screen contradicts another.
enum Showcase {
    static let isOn = ProcessInfo.processInfo.arguments.contains("-showcase")
    static let firstName = "Ada"
}
#endif
