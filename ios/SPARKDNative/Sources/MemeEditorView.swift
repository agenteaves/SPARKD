import SwiftUI
import PhotosUI
import UIKit

struct MemeArtwork: View {
    let background: UIImage?
    let top: String
    let bottom: String

    var body: some View {
        GeometryReader { proxy in
            ZStack {
                Color(red: 0.06, green: 0.11, blue: 0.09)
                if let background {
                    Image(uiImage: background)
                        .resizable()
                        .scaledToFill()
                        .frame(width: proxy.size.width, height: proxy.size.height)
                        .clipped()
                }
                VStack(spacing: 0) {
                    caption(top)
                    Spacer()
                    caption(bottom)
                    Text("SPARKD  •  sparkdcoin.com")
                        .font(.system(size: proxy.size.width * 0.028, weight: .black))
                        .foregroundStyle(.white)
                        .shadow(color: .black, radius: 4)
                        .padding(10)
                }
                .padding(.horizontal, 12)
            }
        }
        .aspectRatio(1, contentMode: .fit)
        .clipped()
    }

    private func caption(_ text: String) -> some View {
        Text(text.uppercased())
            .font(.system(size: 35, weight: .black, design: .rounded))
            .minimumScaleFactor(0.35)
            .lineLimit(3)
            .multilineTextAlignment(.center)
            .foregroundStyle(.white)
            .shadow(color: .black, radius: 3, x: 2, y: 2)
            .padding(.top, 14)
    }
}

struct MemeEditorView: View {
    @State private var selectedPhoto: PhotosPickerItem?
    @State private var photo: UIImage?
    @State private var topText = ""
    @State private var bottomText = ""
    @State private var exportedPNG: URL?
    @State private var message: String?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    MemeArtwork(background: photo, top: topText, bottom: bottomText)
                        .accessibilityLabel("Meme preview")
                    PhotosPicker(selection: $selectedPhoto, matching: .images) {
                        Label("Choose photo", systemImage: "photo.on.rectangle")
                    }
                    .buttonStyle(.borderedProminent)
                    TextField("Top caption", text: $topText)
                        .textFieldStyle(.roundedBorder)
                    TextField("Bottom caption", text: $bottomText)
                        .textFieldStyle(.roundedBorder)
                    Button("Export PNG", action: exportPNG)
                        .buttonStyle(.borderedProminent)
                    if let exportedPNG {
                        ShareLink(item: exportedPNG, preview: SharePreview("SPARKD meme")) {
                            Label("Save or share PNG", systemImage: "square.and.arrow.up")
                        }
                    }
                    Divider()
                    Text("Meme of the Week")
                        .font(.title2.bold())
                    Text("Contest entry requires a verified 2,000 SPARKD burn. Native wallet signing and submission are being integrated. Do not send tokens or attempt a burn from this build.")
                        .font(.footnote)
                        .multilineTextAlignment(.center)
                    Button("Submit to contest") {}
                        .buttonStyle(.borderedProminent)
                        .disabled(true)
                    if let message { Text(message).foregroundStyle(.orange) }
                }
                .padding()
            }
            .navigationTitle("SPARKD Meme Forge")
            .tint(.green)
            .background(Color(red: 0.06, green: 0.11, blue: 0.09))
            .preferredColorScheme(.dark)
            .onChange(of: selectedPhoto) { _, item in
                Task {
                    guard let data = try? await item?.loadTransferable(type: Data.self),
                          let image = UIImage(data: data) else { return }
                    photo = image
                    exportedPNG = nil
                }
            }
            .onChange(of: topText) { _, _ in exportedPNG = nil }
            .onChange(of: bottomText) { _, _ in exportedPNG = nil }
        }
    }

    @MainActor private func exportPNG() {
        let artwork = MemeArtwork(background: photo, top: topText, bottom: bottomText)
            .frame(width: 1080, height: 1080)
        let renderer = ImageRenderer(content: artwork)
        renderer.scale = 1
        guard let image = renderer.uiImage, let data = image.pngData() else {
            message = "Unable to export this image."
            return
        }
        let destination = FileManager.default.temporaryDirectory
            .appendingPathComponent("SPARKD-Meme-\(UUID().uuidString).png")
        do {
            try data.write(to: destination, options: .atomic)
            exportedPNG = destination
            message = "PNG ready. Use Save or share PNG."
        } catch {
            message = "Unable to save this image."
        }
    }
}
