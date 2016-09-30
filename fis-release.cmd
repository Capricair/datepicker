@echo off
if not exist fis-conf.js echo fis.config.merge({project:{exclude:["*.sln","*.suo","*.config"],}}); > fis-conf.js
cd %cd%
::del /f /q "./dist"
cmd /c fis release -pod "./dist/min"
pause