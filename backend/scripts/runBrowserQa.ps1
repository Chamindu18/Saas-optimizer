param()
$ErrorActionPreference = 'Stop'
$pgBin = 'C:\Program Files\PostgreSQL\18\bin'
$runId = [guid]::NewGuid().ToString('N')
$runDir = Join-Path $env:TEMP "seatwatch-task07a-$runId"
$dataDir = Join-Path $runDir 'cluster'
$passwordFile = Join-Path $runDir 'password.txt'
$pgCtl = Join-Path $pgBin 'pg_ctl.exe'
$started = $false
try {
  New-Item -ItemType Directory -Path $runDir -ErrorAction Stop | Out-Null
  $password = [guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N')
  [System.IO.File]::WriteAllText($passwordFile, $password)
  $env:PGPASSWORD = $password
  & (Join-Path $pgBin 'initdb.exe') -D $dataDir -U seatwatch_qa -A scram-sha-256 --pwfile=$passwordFile --no-instructions | Out-Null
  if ($LASTEXITCODE -ne 0) { throw 'initdb failed' }
  $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 0)
  $listener.Start(); $port = $listener.LocalEndpoint.Port; $listener.Stop()
  & $pgCtl -D $dataDir -l (Join-Path $runDir 'postgres.log') -o "-h 127.0.0.1 -p $port" -w start
  if ($LASTEXITCODE -ne 0) { throw 'isolated PostgreSQL failed to start' }
  $started = $true
  $dbName = "seatwatch_task07a_$runId"
  & (Join-Path $pgBin 'createdb.exe') -h 127.0.0.1 -p $port -U seatwatch_qa $dbName
  if ($LASTEXITCODE -ne 0) { throw 'isolated database creation failed' }
  $identity = & (Join-Path $pgBin 'psql.exe') -h 127.0.0.1 -p $port -U seatwatch_qa -d $dbName -At -c 'SELECT current_database(), current_user, inet_server_addr(), inet_server_port(), count(*) FROM information_schema.tables WHERE table_schema = ''public'''
  $expected = "$dbName|seatwatch_qa|127.0.0.1|$port|0"
  if ($LASTEXITCODE -ne 0 -or $identity.Trim() -ne $expected) { throw "Isolated database identity check failed: $identity" }
  Write-Host "Verified empty isolated database $dbName on 127.0.0.1:$port"
  $env:DATABASE_URL = "postgresql://seatwatch_qa:$password@127.0.0.1:$port/$dbName"
  $env:JWT_SECRET = [guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N')
  $env:ADMIN_BOOTSTRAP_NAME = 'Synthetic QA Admin'
  $env:ADMIN_BOOTSTRAP_EMAIL = 'admin@seatwatch.test.invalid'
  $env:ADMIN_BOOTSTRAP_PASSWORD = [guid]::NewGuid().ToString('N')
  & node migrations/runMigration.js
  if ($LASTEXITCODE -ne 0) { throw 'migration failed' }
  & node scripts/seedAdmin.js
  if ($LASTEXITCODE -ne 0) { throw 'admin bootstrap failed' }
  & node scripts/browserQa.mjs
  if ($LASTEXITCODE -ne 0) { throw 'browser QA failed' }
} finally {
  if ($started) { & $pgCtl -D $dataDir -m fast -w stop }
  Remove-Item Env:DATABASE_URL,Env:PGPASSWORD,Env:JWT_SECRET,Env:ADMIN_BOOTSTRAP_NAME,Env:ADMIN_BOOTSTRAP_EMAIL,Env:ADMIN_BOOTSTRAP_PASSWORD -ErrorAction SilentlyContinue
  Write-Host "Isolated cluster retained at $runDir; no database cleanup was performed."
}
