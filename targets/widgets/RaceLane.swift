import SwiftUI

/**
 The race, small: the lane, each recent day as a bead, a typical day standing on
 its mark, and you. The same picture Home's card draws, with the same arithmetic
 (src/components/home/RaceTrack.tsx), so the widget and the app can't disagree
 about where the runner is.
 */
struct RaceLane: View {
  let race: WidgetState.Race
  var runnerHeight: CGFloat = 38

  /// where the pacer sits on the track, leaving room to run past it
  private static let pacerAt = 0.72
  private static let edge = 0.98
  private static let gentleHalfway = 80.0
  private static let laneHeight: CGFloat = 8
  private static let bead: CGFloat = 5

  private var gentle: Bool { race.gentle ?? false }
  private var showField: Bool { !race.ghosts.isEmpty && !gentle }

  private var trackMax: Double {
    max(Double(race.pacer) / RaceLane.pacerAt, Double(race.points) * 1.12, 1)
  }

  private func frac(_ points: Int) -> Double {
    max(0, min(RaceLane.edge, Double(points) / trackMax))
  }

  private var runnerFrac: Double {
    if showField { return frac(race.points) }
    if gentle {
      let p = Double(race.points)
      return max(0.04, min(RaceLane.edge, p / (p + RaceLane.gentleHalfway)))
    }
    return race.points > 0 ? 0.5 : 0.04
  }

  private var ahead: Bool { showField && race.points > 0 && race.points >= race.pacer }

  var body: some View {
    GeometryReader { geo in
      let w = geo.size.width
      let laneTop = geo.size.height - RaceLane.laneHeight
      let runnerWidth = 74 * runnerHeight / 98
      let runnerX = CGFloat(runnerFrac) * w
      let ghostHeight = runnerHeight * 0.74
      let ghostWidth = 74 * ghostHeight / 98

      ZStack(alignment: .topLeading) {
        Capsule()
          .fill(Palette.soft)
          .frame(width: w, height: RaceLane.laneHeight)
          .offset(y: laneTop)
        Capsule()
          .fill(Palette.accent)
          .frame(width: max(RaceLane.laneHeight, runnerX), height: RaceLane.laneHeight)
          .offset(y: laneTop)

        if showField {
          ForEach(Array(race.ghosts.enumerated()), id: \.offset) { _, ghost in
            let x = max(RaceLane.laneHeight / 2, min(w - RaceLane.laneHeight / 2, CGFloat(frac(ghost)) * w))
            Circle()
              .fill(race.points >= ghost ? Palette.onAccent : Palette.muted.opacity(0.55))
              .frame(width: RaceLane.bead, height: RaceLane.bead)
              .offset(x: x - RaceLane.bead / 2, y: laneTop + (RaceLane.laneHeight - RaceLane.bead) / 2)
          }

          let pacerX = CGFloat(frac(race.pacer)) * w
          Capsule()
            .fill(Palette.muted)
            .frame(width: 2, height: RaceLane.laneHeight + 10)
            .offset(x: pacerX - 1, y: laneTop - 5)
          Runner(pose: .idle, fill: Palette.accent, detail: Palette.onAccent, height: ghostHeight)
            .opacity(0.3)
            .offset(x: pacerX - ghostWidth / 2, y: laneTop - 4 - ghostHeight * 0.93)
        }

        Runner(
          pose: ahead ? .cheer : race.points > 0 ? .run : .idle,
          fill: Palette.accent, detail: Palette.onAccent, height: runnerHeight
        )
        // feet a little into the lane, so it stands on it
        .offset(
          x: max(0, min(w - runnerWidth, runnerX - runnerWidth / 2)),
          y: laneTop + 3 - runnerHeight * 0.93)
      }
    }
    .accessibilityHidden(true)
  }
}
