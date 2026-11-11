import SwiftUI

// Stands in for targets/widgets/Palette.swift, which reads an asset catalog that
// only exists inside the built extension. Same names, literal values from
// src/lib/colors.json, switched by `Palette.dark`.
enum Palette {
  static var dark = false

  private static func pick(_ light: UInt32, _ dark: UInt32) -> Color {
    let v = Palette.dark ? dark : light
    return Color(
      red: Double((v >> 16) & 255) / 255, green: Double((v >> 8) & 255) / 255, blue: Double(v & 255) / 255)
  }

  static var surface: Color { pick(0xffffff, 0x1e2226) }
  static var ink: Color { pick(0x1d2023, 0xe6e9ea) }
  static var muted: Color { pick(0x62686b, 0xa2aaae) }
  static var soft: Color { pick(0xe0e4e4, 0x30363b) }
  static var accent: Color { pick(0x456a90, 0x8fb4da) }
  static var onAccent: Color { pick(0xffffff, 0x10161c) }
  static var accentSoft: Color { pick(0xdde8f1, 0x25323e) }
}

enum Island {
  static let accent = Color(red: 0x8f / 255, green: 0xb4 / 255, blue: 0xda / 255)
  static let ink = Color(red: 0xe6 / 255, green: 0xe9 / 255, blue: 0xea / 255)
  static let muted = Color(red: 0xa2 / 255, green: 0xaa / 255, blue: 0xae / 255)
  static let soft = Color(red: 0x30 / 255, green: 0x36 / 255, blue: 0x3b / 255)
  static let onAccent = Color(red: 0x10 / 255, green: 0x16 / 255, blue: 0x1c / 255)
}
