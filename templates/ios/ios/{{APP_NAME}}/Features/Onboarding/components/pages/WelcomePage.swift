import SwiftUI

struct WelcomePage: View {
    var onNext: () -> Void

    var body: some View {
        VStack(spacing: 24) {
            Spacer()
            Image(systemName: "sparkles")
                .font(.system(size: 72))
                .foregroundStyle(.tint)
            VStack(spacing: 12) {
                Text("Bienvenue dans {{APP_NAME}}")
                    .font(.largeTitle.bold())
                    .multilineTextAlignment(.center)
                Text("{{APP_TAGLINE}}")
                    .font(.body)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }
            .padding(.horizontal)
            Spacer()
            Button(action: onNext) {
                Text("Commencer")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
            .accessibilityIdentifier("onboarding-start")
        }
        .padding()
    }
}

#Preview {
    WelcomePage(onNext: {})
}
