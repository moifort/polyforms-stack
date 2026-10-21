import SwiftUI

struct LabeledInfoRow: View {
    let title: LocalizedStringKey
    let value: String
    let icon: String

    var body: some View {
        Label {
            LabeledContent {
                Text(value)
            } label: {
                Text(title)
            }
        } icon: {
            Image(systemName: icon)
                .foregroundStyle(.secondary)
        }
        // Every fact a sheet states can be taken elsewhere with a long press.
        .copyable(value)
    }
}

#Preview {
    List {
        LabeledInfoRow(title: "Prénom", value: "Ada", icon: "person")
        LabeledInfoRow(title: "Ville", value: "Lyon", icon: "map")
    }
}
