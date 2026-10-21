import SwiftUI

struct FirstNamePage: View {
    @Binding var firstName: String
    var isSaving: Bool
    var onNext: () -> Void
    var onBack: () -> Void

    @FocusState private var focused: Bool

    private var trimmed: String {
        firstName.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 24) {
            VStack(alignment: .leading, spacing: 8) {
                Text("Comment vous appelez-vous ?")
                    .font(.title.bold())
                Text("Votre prénom sert à personnaliser l'application.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }

            TextField("Prénom", text: $firstName)
                .textContentType(.givenName)
                .textInputAutocapitalization(.words)
                .submitLabel(.next)
                .focused($focused)
                .onSubmit { if !trimmed.isEmpty { onNext() } }
                .padding()
                .background(Color(.systemGray6))
                .clipShape(RoundedRectangle(cornerRadius: 12))
                .accessibilityIdentifier("onboarding-firstname-field")

            Spacer()

            Button(action: onNext) {
                ZStack {
                    Text("Continuer").opacity(isSaving ? 0 : 1)
                    if isSaving { ProgressView() }
                }
                .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
            .disabled(trimmed.isEmpty || isSaving)
            .accessibilityIdentifier("onboarding-firstname-next")
        }
        .padding()
        .navigationTitle("Prénom")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                ToolbarIconButton(title: "Retour", systemImage: "chevron.left", action: onBack)
            }
        }
        .onAppear { focused = true }
    }
}

#Preview {
    NavigationStack {
        FirstNamePage(firstName: .constant("Ada"), isSaving: false, onNext: {}, onBack: {})
    }
}
