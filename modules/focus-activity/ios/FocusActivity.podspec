Pod::Spec.new do |s|
  s.name           = 'FocusActivity'
  s.version        = '1.0.0'
  s.summary        = 'Starts, updates and ends the focus session Live Activity, and hands the widget its data.'
  s.description    = 'The app side of the Lock Screen Live Activity and the Home Screen widget. The views live in targets/widgets.'
  s.license        = 'MIT'
  s.author         = 'Hyperfocus'
  s.homepage       = 'https://github.com/deusalter/hyperfocus'
  s.platforms      = { :ios => '15.1' }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,swift}"
end
