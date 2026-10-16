@echo off
setlocal
rem ---------------------------------------------------------------------------
rem Lets your phone, TV or laptop neighbour reach JAMFLEX over the wifi.
rem Windows blocks incoming connections by default, and only an administrator
rem may unblock one - so this file asks Windows for permission once.
rem Click "Yes" on the blue prompt it pops up, then close that window.
rem ---------------------------------------------------------------------------

net session >nul 2>&1
if %errorlevel%==0 goto :add

echo Asking Windows for administrator permission...
set "SELF=%~f0"
powershell -NoProfile -Command "Start-Process -FilePath $env:SELF -Verb RunAs"
echo If Windows showed a prompt, approve it - the rule is added in that other window.
pause
exit /b

:add
netsh advfirewall firewall add rule name="JAMFLEX preview" dir=in action=allow protocol=TCP localport=4321,4322 profile=any
echo.
echo Rule added. Your phone can now load the address run-tv.cmd prints.
echo.
echo To undo this later (needs an administrator prompt):
echo   netsh advfirewall firewall delete rule name="JAMFLEX preview"
echo.
pause
