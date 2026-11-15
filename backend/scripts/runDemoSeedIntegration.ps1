param()
$ErrorActionPreference = 'Stop'
$pgBin = 'C:\Program Files\PostgreSQL\18\bin'
$runDir = Join-Path $env:TEMP "seatwatch-demo-08d-$([guid]::NewGuid().ToString('N'))"
$dataDir = Join-Path $runDir 'cluster'
$passwordFile = Join-Path $runDir 'password.txt'
$pgCtl = Join-Path $pgBin 'pg_ctl.exe'
$started = $false
try {
  New-Item -ItemType Directory -Path $runDir -ErrorAction Stop | Out-Null
  $password = [guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N')
  [System.IO.File]::WriteAllText($passwordFile, $password)
  $env:PGPASSWORD = $password
  & (Join-Path $pgBin 'initdb.exe') -D $dataDir -U seatwatch_user -A scram-sha-256 --pwfile=$passwordFile --no-instructions | Out-Null
  if ($LASTEXITCODE -ne 0) { throw 'initdb failed' }
  $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 0)
  $listener.Start()
  $port = $listener.LocalEndpoint.Port
  $listener.Stop()
  & $pgCtl -D $dataDir -l (Join-Path $runDir 'postgres.log') -o "-h 127.0.0.1 -p $port" -w start
  if ($LASTEXITCODE -ne 0) { throw 'isolated PostgreSQL failed to start' }
  $started = $true
  & (Join-Path $pgBin 'createdb.exe') -h 127.0.0.1 -p $port -U seatwatch_user seatwatch_dev
  if ($LASTEXITCODE -ne 0) { throw 'isolated database creation failed' }
  $env:DATABASE_URL = "postgresql://seatwatch_user:$password@127.0.0.1:$port/seatwatch_dev"
  $env:NODE_ENV = 'development'
  $env:JWT_SECRET = [guid]::NewGuid().ToString('N')
  Write-Host 'Testing demo seed in a newly initialized isolated PostgreSQL cluster.'
  & node test/demoSeedIntegration.test.js
  if ($LASTEXITCODE -ne 0) { throw 'Demo seed integration tests failed' }
} finally {
  if ($started) { & $pgCtl -D $dataDir -m fast -w stop }
  Remove-Item Env:DATABASE_URL,Env:PGPASSWORD,Env:JWT_SECRET -ErrorAction SilentlyContinue
  Write-Host "Isolated cluster retained at $runDir"
}
