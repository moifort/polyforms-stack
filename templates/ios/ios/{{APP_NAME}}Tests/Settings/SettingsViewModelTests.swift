import Foundation
import Testing
@testable import {{APP_NAME}}

@MainActor
struct ProfileSettingsViewModelTests {
    @Test func deletionEndsTheSession() async {
        let ended = Flag()
        let viewModel = ProfileSettingsViewModel(client: .preview)

        await viewModel.deleteAccount { ended.isOn = true }

        #expect(ended.isOn)
        #expect(viewModel.errorMessage == nil)
    }

    @Test func lostAnswerOverAGoneAccountSaysNothing() async {
        var client = SettingsClient.preview
        client.deleteAccount = { throw Boom() }
        client.accountIsGone = { true }
        let viewModel = ProfileSettingsViewModel(client: client)

        await viewModel.deleteAccount {}

        #expect(viewModel.errorMessage == nil)
    }

    @Test func refusedDeletionSaysSoAndStops() async {
        let ended = Flag()
        var client = SettingsClient.preview
        client.deleteAccount = { throw Boom() }
        let viewModel = ProfileSettingsViewModel(client: client)

        await viewModel.deleteAccount { ended.isOn = true }

        #expect(ended.isOn == false)
        #expect(viewModel.errorMessage != nil)
        #expect(viewModel.isDeletingAccount == false)
    }
}

@MainActor
struct ChangelogViewModelTests {
    @Test func loadShowsTheEntries() async {
        let viewModel = ChangelogViewModel(client: .preview)

        await viewModel.load()

        #expect(viewModel.entries.map(\.version) == ["1.1", "1.0"])
        #expect(viewModel.isLoading == false)
    }

    @Test func failureIsSaid() async {
        var client = SettingsClient.preview
        client.changelog = { throw Boom() }
        let viewModel = ChangelogViewModel(client: client)

        await viewModel.load()

        #expect(viewModel.entries.isEmpty)
        #expect(viewModel.errorMessage != nil)
    }
}
