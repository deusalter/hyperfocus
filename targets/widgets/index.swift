import SwiftUI
import WidgetKit

@main
struct HyperfocusWidgets: WidgetBundle {
  init() {
    Typeface.registerBundled()
  }

  var body: some Widget {
    NextTaskWidget()
    FocusLiveActivity()
  }
}
