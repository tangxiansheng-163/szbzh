Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
pyScript = fso.BuildPath(scriptDir, "start_server.py")

' 用绝对路径运行 start_server.py（脚本内会 chdir 到原型目录）
WshShell.Run "cmd /k python """ & pyScript & """", 1, False

WScript.Sleep 2500
WshShell.Run "http://localhost:8080/main.html", 1, False
