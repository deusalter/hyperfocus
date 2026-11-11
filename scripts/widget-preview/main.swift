import AppKit
import SwiftUI

// Draws the widget extension's views to PNG files on a Mac, with no Xcode and no
// simulator. See scripts/widget-preview.sh.

let args = CommandLine.arguments
let out = URL(fileURLWithPath: args.count > 1 ? args[1] : "widget-preview-out")
let fonts = URL(fileURLWithPath: args.count > 2 ? args[2] : "targets/widgets/fonts")
try? FileManager.default.createDirectory(at: out, withIntermediateDirectories: true)
Typeface.register(in: [fonts])

/// `build` runs after the theme is chosen, since the palette is read as each view
/// is made.
@MainActor
func save<V: View>(_ name: String, dark: Bool = false, @ViewBuilder _ build: () -> V) {
  Palette.dark = dark
  let renderer = ImageRenderer(
    content: build().environment(\.colorScheme, dark ? .dark : .light))
  renderer.scale = 2
  guard
    let image = renderer.nsImage,
    let tiff = image.tiffRepresentation,
    let rep = NSBitmapImageRep(data: tiff),
    let png = rep.representation(using: .png, properties: [:])
  else {
    print("could not draw \(name)")
    return
  }
  try? png.write(to: out.appendingPathComponent("\(name)\(dark ? "-dark" : "").png"))
}

/// A widget's box, as the Home Screen draws it on a 6.3-inch iPhone.
@MainActor
func widget<V: View>(_ size: CGSize, _ view: V) -> some View {
  view
    .padding(16)
    .frame(width: size.width, height: size.height)
    .background(Palette.surface)
    .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
    .padding(12)
    .background(Color(white: Palette.dark ? 0.08 : 0.85))
}

/// The Lock Screen's card for a Live Activity.
@MainActor
func activity<V: View>(_ view: V) -> some View {
  view
    .frame(width: 370)
    .background(Palette.surface)
    .clipShape(RoundedRectangle(cornerRadius: 26, style: .continuous))
    .padding(12)
    .background(Color(white: Palette.dark ? 0.08 : 0.85))
}

MainActor.assumeIsolated {
  drawEverything()
}
