param()

$ErrorActionPreference = 'Stop'
$pgBin = 'C:\Program Files\PostgreSQL\18\bin'
$runId = [guid]::NewGuid().ToString('N')
$runDir = Join-Path $env:TEMP "seatwatch-browser-qa-$runId"
$dataDir = Join-Path $runDir 'cluster'
$passwordFile = Join-Path $runDir 'password.txt'
$pgCtl = Join-Path $pgBin 'pg_ctl.exe'
$started = $false

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
  $env:DATABASE_URL = "postgresql://seatwatch_test:$password@127.0.0.1:$port/$database"
  $env:JWT_SECRET = [guid]::NewGuid().ToString('N')
  $env:ADMIN_BOOTSTRAP_NAME = 'Synthetic QA Admin'
  $env:ADMIN_BOOTSTRAP_EMAIL = 'admin@seatwatch.test.invalid'
  $env:ADMIN_BOOTSTRAP_PASSWORD = [guid]::NewGuid().ToString('N') + '!Qa'
  & node migrations/runMigration.js
  if ($LASTEXITCODE -ne 0) { throw 'migrations failed' }
  & node scripts/seedAdmin.js
  if ($LASTEXITCODE -ne 0) { throw 'admin seed failed' }
  & node scripts/browserQa.mjs
  if ($LASTEXITCODE -ne 0) { throw 'browser QA failed' }
} finally {
  if ($started) { & $pgCtl -D $dataDir -m fast -w stop }
  Remove-Item Env:DATABASE_URL,Env:PGPASSWORD,Env:JWT_SECRET,Env:ADMIN_BOOTSTRAP_NAME,Env:ADMIN_BOOTSTRAP_EMAIL,Env:ADMIN_BOOTSTRAP_PASSWORD -ErrorAction SilentlyContinue
  Write-Host "Isolated browser QA cluster retained at $runDir"
}
