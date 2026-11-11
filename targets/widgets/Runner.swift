import SwiftUI

/**
 The companion, drawn to the same measurements as src/components/Sprite.tsx: a
 74 by 98 box, limbs that turn about their top like a shoulder or a hip, and the
 same angles for each pose. It stands still here. Nothing in a widget or a Live
 Activity can run a loop, and the app's own rule is that nothing should.
 */
struct Runner: View {
  enum Pose {
    case idle, run, cheer

    /// front leg, back leg, front arm, back arm, headband tail
    var angles: (legF: Double, legB: Double, armF: Double, armB: Double, band: Double) {
      switch self {
      case .idle: return (-5, 5, -11, 11, 16)
      case .run: return (-28, 30, -36, 38, 20)
      case .cheer: return (-13, 13, -150, 150, 16)
      }
    }
  }

  var pose: Pose = .idle
  /// the body
  var fill: Color
  /// headband, eyes and mouth
  var detail: Color
  /// how tall to draw it, in points
  var height: CGFloat

  private static let box = CGSize(width: 74, height: 98)

  var body: some View {
    let scale = height / Runner.box.height
    let a = pose.angles
    ZStack(alignment: .topLeading) {
      limb(11, 34, x: 22, y: 58, angle: a.legB).opacity(0.93)
      limb(11, 34, x: 40, y: 58, angle: a.legF)
      limb(9, 26, x: 20, y: 38, angle: a.armB).opacity(0.9)
      RoundedRectangle(cornerRadius: 13, style: .continuous)
        .fill(fill)
        .frame(width: 28, height: 32)
        .rotationEffect(.degrees(-6))
        .offset(x: 24, y: 34)
      limb(9, 25, x: 44, y: 36, angle: a.armF)
      head(band: a.band)
    }
    .frame(width: Runner.box.width, height: Runner.box.height, alignment: .topLeading)
    .scaleEffect(scale, anchor: .topLeading)
    .frame(width: Runner.box.width * scale, height: height, alignment: .topLeading)
    .accessibilityHidden(true)
  }

  private func limb(_ w: CGFloat, _ h: CGFloat, x: CGFloat, y: CGFloat, angle: Double) -> some View {
    RoundedRectangle(cornerRadius: w * 0.65, style: .continuous)
      .fill(fill)
      .frame(width: w, height: h)
      .rotationEffect(.degrees(angle), anchor: .top)
      .offset(x: x, y: y)
  }

  private func head(band: Double) -> some View {
    ZStack(alignment: .topLeading) {
      Circle().fill(fill).frame(width: 34, height: 34)
      Capsule().fill(detail).opacity(0.85).frame(width: 38, height: 6).offset(x: -2, y: 8)
      Capsule().fill(detail).opacity(0.8).frame(width: 11, height: 4)
        .rotationEffect(.degrees(band), anchor: .leading)
        .offset(x: 32, y: 7)
      Capsule().fill(detail).opacity(0.55).frame(width: 13, height: 4)
        .rotationEffect(.degrees(band), anchor: .leading)
        .offset(x: 31, y: 12)
      Circle().fill(detail).frame(width: 5, height: 5).offset(x: 12, y: 19)
      Circle().fill(detail).frame(width: 5, height: 5).offset(x: 21, y: 19)
      mouth.offset(x: 13, y: 25)
    }
    .frame(width: 34, height: 34, alignment: .topLeading)
    .offset(x: 21, y: 4)
  }

  @ViewBuilder private var mouth: some View {
    if pose == .cheer {
      RoundedRectangle(cornerRadius: 5, style: .continuous)
        .fill(detail)
        .frame(width: 11, height: 9)
    } else {
      // a smile: the lower half of a small ring
      Circle()
        .trim(from: 0, to: 0.5)
        .stroke(detail, style: StrokeStyle(lineWidth: 2, lineCap: .round))
        .frame(width: 9, height: 9)
        .offset(x: 1, y: -3)
    }
  }
}
