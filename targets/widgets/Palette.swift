import SwiftUI

/// The app's colours, as the asset catalog `expo prebuild` generates from
/// src/lib/colors.json (see expo-target.config.js). Each follows light and dark by
/// itself. Views use these names and never a literal, so scripts/widget-preview can
/// swap this one file for literal values and draw the same views on a Mac.
enum Palette {
  static var surface: Color { Color("surface") }
  static var ink: Color { Color("ink") }
  static var muted: Color { Color("muted") }
  static var soft: Color { Color("soft") }
  static var accent: Color { Color("accent") }
  static var onAccent: Color { Color("onAccent") }
  static var accentSoft: Color { Color("accentSoft") }
}

/// The Dynamic Island is always black, whatever the phone's appearance, so its
/// colours are fixed: the dark theme's values from src/lib/colors.json.
enum Island {
  static let accent = Color(red: 0x8f / 255, green: 0xb4 / 255, blue: 0xda / 255)
  static let ink = Color(red: 0xe6 / 255, green: 0xe9 / 255, blue: 0xea / 255)
  static let muted = Color(red: 0xa2 / 255, green: 0xaa / 255, blue: 0xae / 255)
  static let soft = Color(red: 0x30 / 255, green: 0x36 / 255, blue: 0x3b / 255)
  static let onAccent = Color(red: 0x10 / 255, green: 0x16 / 255, blue: 0x1c / 255)
}
