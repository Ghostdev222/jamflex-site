@echo off
setlocal
cd /d "%~dp0"

rem Same preview, but open to your whole network so a phone or TV can load it.
rem Windows may ask you to allow this app on the network the first time.
set "HOST=0.0.0.0"
call run.cmd
