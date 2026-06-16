!define APPNAME "E-Pics"
!define DESCRIPTION "A personal photo and video vault for privacy from casual users."
!define COMPANYNAME "SHOPOTH"
!define VERSION "1.0.0"
!define PRODUCT_EXE "E-Pics.exe"
!define INSTALLER_NAME "E-Pics-Setup.exe"

!include "MUI2.nsh"

Name "${APPNAME}"
OutFile "dist\\${INSTALLER_NAME}"
InstallDir "$PROGRAMFILES\\${APPNAME}"
InstallDirRegKey HKLM "Software\\${COMPANYNAME}\\${APPNAME}" "Install_Dir"
RequestExecutionLevel admin

!define MUI_ABORTWARNING
!insertmacro MUI_PAGE_COMPONENTS
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

Section "Install ${APPNAME}" SecInstallApp
  SetOutPath "$INSTDIR"
  File /r "dist\\${APPNAME}-win32-x64\\*"
  WriteRegStr HKLM "Software\\${COMPANYNAME}\\${APPNAME}" "Install_Dir" "$INSTDIR"
  WriteUninstaller "$INSTDIR\\Uninstall.exe"
SectionEnd

Section "Create Desktop Shortcut" SecDesktop
  CreateShortCut "$DESKTOP\\${APPNAME}.lnk" "$INSTDIR\\${PRODUCT_EXE}"
SectionEnd

Section "Create Start Menu Shortcut" SecStartMenu
  CreateDirectory "$SMPROGRAMS\\${APPNAME}"
  CreateShortCut "$SMPROGRAMS\\${APPNAME}\\${APPNAME}.lnk" "$INSTDIR\\${PRODUCT_EXE}"
SectionEnd

Section "Uninstall"
  Delete "$SMPROGRAMS\\${APPNAME}\\${APPNAME}.lnk"
  Delete "$DESKTOP\\${APPNAME}.lnk"
  Delete "$INSTDIR\\Uninstall.exe"
  RMDir /r "$INSTDIR"
  DeleteRegKey HKLM "Software\\${COMPANYNAME}\\${APPNAME}"
SectionEnd
