import SwiftUI

extension EnvironmentValues {
    /// The first name the user gave at onboarding, set at the root from the launch
    /// request, so the profile settings show it without a request of their own.
    @Entry var accountFirstName: String? = nil
}
