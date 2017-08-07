#requires -version 3.0
[CmdletBinding()]
param(
    # Blog post name
    [Parameter(Mandatory=$true)]
    [string]
    $Title
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Push-Location (Join-Path $PSScriptRoot src)

../hugo.exe new "posts/$(Get-Date -Format 'yyyy-MM-dd')-$Title.md"

Pop-Location
