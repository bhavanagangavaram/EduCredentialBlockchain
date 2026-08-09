param(
    [string]$SourceFolder = "d:\FinalProj",
    [string]$DestinationFolder = "d:\FinalProj\_CD_Bundle"
)

Write-Host "Cleaning up old build..."
if (Test-Path $DestinationFolder) {
    Remove-Item -Path $DestinationFolder -Recurse -Force
}
New-Item -ItemType Directory -Path $DestinationFolder | Out-Null

$ExcludeList = @("node_modules", ".git", ".next", "__pycache__", "_CD_Bundle", ".cursor", ".agent", "dataset")

Write-Host "Copying project files (this may take a minute depending on size)..."
Get-ChildItem -Path $SourceFolder | Where-Object { $ExcludeList -notcontains $_.Name } | ForEach-Object {
    if ($_.PSIsContainer) {
        $dest = Join-Path $DestinationFolder $_.Name
        New-Item -ItemType Directory -Path $dest | Out-Null
        
        # Copy-Item with exclude is tricky, better to use robocopy for robust folder copying
        $roboArgs = @($_.FullName, $dest, "/E", "/XD", "node_modules", ".git", ".next", "__pycache__", ".cursor", ".agent", "dataset", "/NFL", "/NDL", "/NJH", "/NJS", "/nc", "/ns", "/np")
        & robocopy $roboArgs
    } else {
        Copy-Item -Path $_.FullName -Destination $DestinationFolder
    }
}

Write-Host "Creating CD README..."
$readmePath = Join-Path $DestinationFolder "README_EVALUATOR.md"
@"
# AI Integrated E-Voting System - Project Source

Welcome to the CD-ROM submission of our AI Integrated E-Voting Project.

## Prerequisites to Run from CD
Because CD-ROMs are Read-Only, you CANNOT run this project directly from the CD. The project databases and execution logs require write permissions.

### Setup Instructions:
1. **Copy the complete folder** from this CD to your local PC (e.g., your Desktop).
2. Ensure you have **Node.js** (v18+) and **Python 3.10+** installed on your system.
3. Open a terminal in the project root folder.
4. **Dependencies:**
   - **Frontend/Backend (Node):** Run `npm install` in the root folder.
   - **Python API:** The Python Virtual Environment (`venv`) is **already included** to save you setup time. 
5. Run the standard startup script:
   `.\start_services.bat`
6. The frontend will be available at http://localhost:3000

Enjoy reviewing the project!
"@ | Out-File -FilePath $readmePath -Encoding UTF8

Write-Host ""
Write-Host "================================================"
Write-Host "CD Bundle successfully created!"
Write-Host "Path: $DestinationFolder"
Write-Host "================================================"
Write-Host "You can now burn the contents of the '_CD_Bundle' folder directly to your CD."
