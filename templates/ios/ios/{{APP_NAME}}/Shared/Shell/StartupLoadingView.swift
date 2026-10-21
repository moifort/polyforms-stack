import SwiftUI

/// The launch wait, centred in all available space. Every other wait (a screen
/// loading, a list refreshing, a button working) takes the system `ProgressView`
/// where it happens, never this.
struct StartupLoadingView: View {
    var label: LocalizedStringKey = "Chargement…"

    var body: some View {
        VStack(spacing: 16) {
            ProgressView()
                .controlSize(.large)
            Text(label)
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

#Preview {
    StartupLoadingView()
}
