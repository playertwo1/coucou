; Uninstall hooks for the NSIS installer.
;
; Keep the legacy relay and runtime files beside existing settings and hooks.
;
; Claude Code's own settings.json is deliberately NOT touched here: it belongs to
; the user, it may contain hooks from other tools, and rewriting somebody's
; config from an uninstaller with no diff and no consent is exactly what the rest
; of this app goes out of its way not to do. A relay that is gone exits 0 without
; printing anything, so a leftover entry costs nothing beyond a dead path.

!macro NSIS_HOOK_PREUNINSTALL
  ReadRegStr $0 HKCU "Software\Classes\AppUserModelId\fr.louisraille.coucou" "CustomActivator"
  StrCmp $0 "{5A0C5EFA-C98F-4FA4-A337-012F9685BED3}" 0 +2
  DeleteRegKey HKCU "Software\Classes\AppUserModelId\fr.louisraille.coucou"
!macroend

!macro NSIS_HOOK_POSTINSTALL
  WriteRegStr HKCU "Software\Classes\AppUserModelId\fr.louisraille.coucou" "DisplayName" "Lumen"
  WriteRegStr HKCU "Software\Classes\AppUserModelId\fr.louisraille.coucou" "CustomActivator" "{5A0C5EFA-C98F-4FA4-A337-012F9685BED3}"
!macroend
