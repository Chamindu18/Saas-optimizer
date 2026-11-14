param()

$ErrorActionPreference = 'Stop'
$pgBin = 'C:\Program Files\PostgreSQL\18\bin'
$runId = [guid]::NewGuid().ToString('N')
$runDir = Join-Path $env:TEMP "seatwatch-task05-$runId"
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

  $fresh = "seatwatch_task05_fresh_$runId"
  $legacy = "seatwatch_task05_legacy_$runId"
  $failure = "seatwatch_task05_failure_$runId"
  foreach ($database in @($fresh, $legacy, $failure)) {
    & (Join-Path $pgBin 'createdb.exe') -h 127.0.0.1 -p $port -U seatwatch_test $database
    if ($LASTEXITCODE -ne 0) { throw "Could not create isolated test database $database" }
  }

  $env:SEATWATCH_TEST_PGDATA = $dataDir
  $env:SEATWATCH_TEST_FRESH = $fresh
  $env:SEATWATCH_TEST_LEGACY = $legacy
  $env:SEATWATCH_TEST_FAILURE = $failure
  $env:SEATWATCH_TEST_PORT = [string]$port
  $env:DATABASE_URL = "postgresql://seatwatch_test:$password@127.0.0.1:$port/$fresh"
  $env:JWT_SECRET = [guid]::NewGuid().ToString('N')
  Write-Host 'Running PostgreSQL integration tests in a newly initialized, isolated cluster.'
  & node test/postgresIntegration.test.js
  if ($LASTEXITCODE -ne 0) { throw 'PostgreSQL integration tests failed' }
  Write-Host 'PostgreSQL integration tests passed.'
} finally {
  if ($started) {
    & $pgCtl -D $dataDir -m fast -w stop
  }
  Remove-Item Env:DATABASE_URL,Env:PGPASSWORD,Env:JWT_SECRET,Env:SEATWATCH_TEST_PGDATA,Env:SEATWATCH_TEST_FRESH,Env:SEATWATCH_TEST_LEGACY,Env:SEATWATCH_TEST_FAILURE,Env:SEATWATCH_TEST_PORT -ErrorAction SilentlyContinue
  Write-Host "Isolated cluster files retained at $runDir; no database cleanup was performed."
}
