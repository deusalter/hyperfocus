import CoreText
import SwiftUI

/// The app's two typefaces: Hanken Grotesk for words, Spline Sans Mono for numerals.
/// Without them a widget reads as the system's, not this app's.
enum Typeface {
  enum Weight: String {
    case semibold = "HankenGrotesk-SemiBold"
    case bold = "HankenGrotesk-Bold"
    case heavy = "HankenGrotesk-ExtraBold"
  }

  /// Fixed sizes, not Dynamic Type: a widget's box doesn't grow with its text, and
  /// the Lock Screen caps a Live Activity's height.
  static func ui(_ size: CGFloat, _ weight: Weight = .semibold) -> Font {
    .custom(weight.rawValue, fixedSize: size)
  }

  static func digits(_ size: CGFloat) -> Font {
    .custom("SplineSansMono-SemiBold", fixedSize: size)
  }

  /// Registers every font file in a folder. An extension has no UIAppFonts list
  /// worth trusting across build layouts, so this finds them wherever they landed.
  /// A font that doesn't load falls back to the system's, which still works.
  static func register(in folders: [URL]) {
    for folder in folders {
      let files = (try? FileManager.default.contentsOfDirectory(at: folder, includingPropertiesForKeys: nil)) ?? []
      for file in files where file.pathExtension.lowercased() == "ttf" {
        CTFontManagerRegisterFontsForURL(file as CFURL, .process, nil)
      }
    }
  }

  static func registerBundled() {
    guard let root = Bundle.main.resourceURL else { return }
    register(in: [root, root.appendingPathComponent("fonts")])
  }
}
