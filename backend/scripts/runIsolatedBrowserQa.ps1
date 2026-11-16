param()

$ErrorActionPreference = 'Stop'
$pgBin = 'C:\Program Files\PostgreSQL\18\bin'
$runId = [guid]::NewGuid().ToString('N')
$runDir = Join-Path $env:TEMP "seatwatch-browser-qa-$runId"
$dataDir = Join-Path $runDir 'cluster'
$passwordFile = Join-Path $runDir 'password.txt'
$pgCtl = Join-Path $pgBin 'pg_ctl.exe'
$started = $false

& npm.cmd --prefix (Join-Path $PSScriptRoot '..\..\frontend') run build
if ($LASTEXITCODE -ne 0) { throw 'frontend build failed' }

try {
  New-Item -ItemType Directory -Path $runDir -ErrorAction Stop | Out-Null
  $password = [guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N')
  [System.IO.File]::WriteAllText($passwordFile, $password)
  $env:PGPASSWORD = $password
  & (Join-Path $pgBin 'initdb.exe') -D $dataDir -U seatwatch_test -A scram-sha-256 --pwfile=$passwordFile --no-instructions | Out-Null
  if ($LASTEXITCODE -ne 0) { throw 'initdb failed' }
  $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 0)
  $listener.Start()
  $port = $listener.LocalEndpoint.Port
  $listener.Stop()
  & $pgCtl -D $dataDir -l (Join-Path $runDir 'postgres.log') -o "-h 127.0.0.1 -p $port" -w start
  if ($LASTEXITCODE -ne 0) { throw 'isolated PostgreSQL failed to start' }
  $started = $true
  $database = "seatwatch_browser_qa_$runId"
  & (Join-Path $pgBin 'createdb.exe') -h 127.0.0.1 -p $port -U seatwatch_test $database
  if ($LASTEXITCODE -ne 0) { throw 'database creation failed' }
  $identity = & (Join-Path $pgBin 'psql.exe') -h 127.0.0.1 -p $port -U seatwatch_test -d $database -At -c "SELECT current_database(), current_user, inet_server_addr(), inet_server_port(), current_setting('data_directory'), count(*) FROM information_schema.tables WHERE table_schema = 'public'"
  $fields = $identity.Trim() -split '\|'
  $actualDataDir = if ($fields.Count -eq 6) { [System.IO.Path]::GetFullPath($fields[4]).Replace('\', '/').TrimEnd('/').ToLowerInvariant() } else { '' }
  $expectedDataDir = [System.IO.Path]::GetFullPath($dataDir).Replace('\', '/').TrimEnd('/').ToLowerInvariant()
  if ($LASTEXITCODE -ne 0 -or $fields.Count -ne 6 -or $fields[0] -ne $database -or $fields[1] -ne 'seatwatch_test' -or $fields[2] -ne '127.0.0.1' -or $fields[3] -ne [string]$port -or $actualDataDir -ne $expectedDataDir -or $fields[5] -ne '0') { throw 'Isolated database identity check failed' }
  Write-Host "Verified empty isolated database $database on 127.0.0.1:$port"
  $env:DATABASE_URL = "postgresql://seatwatch_test:$password@127.0.0.1:$port/$database"
  $env:JWT_SECRET = [guid]::NewGuid().ToString('N')
  $env:ADMIN_BOOTSTRAP_NAME = 'Synthetic QA Admin'
  $env:ADMIN_BOOTSTRAP_EMAIL = 'admin@seatwatch.test.invalid'
  $env:ADMIN_BOOTSTRAP_PASSWORD = [guid]::NewGuid().ToString('N') + '!Qa'
  $env:SEATWATCH_QA_SCREENSHOTS_DIR = Join-Path $runDir 'screenshots'
  & node migrations/runMigration.js
  if ($LASTEXITCODE -ne 0) { throw 'migrations failed' }
  & node scripts/seedAdmin.js
  if ($LASTEXITCODE -ne 0) { throw 'admin seed failed' }
  & node scripts/browserQa.mjs
  if ($LASTEXITCODE -ne 0) { throw 'browser QA failed' }
  Push-Location (Join-Path $PSScriptRoot '..\..\frontend')
  try {
    & node scripts/landingQa.mjs
    if ($LASTEXITCODE -ne 0) { throw 'landing QA failed' }
    & node scripts/authQa.mjs
    if ($LASTEXITCODE -ne 0) { throw 'auth QA failed' }
  } finally { Pop-Location }
} finally {
  if ($started) { & $pgCtl -D $dataDir -m fast -w stop }
  Remove-Item Env:DATABASE_URL,Env:PGPASSWORD,Env:JWT_SECRET,Env:ADMIN_BOOTSTRAP_NAME,Env:ADMIN_BOOTSTRAP_EMAIL,Env:ADMIN_BOOTSTRAP_PASSWORD,Env:SEATWATCH_QA_SCREENSHOTS_DIR -ErrorAction SilentlyContinue
  Write-Host "Isolated browser QA cluster retained at $runDir"
}
