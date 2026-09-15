# Minimal static file server for local preview (no Node/Python required).
param([int]$Port = 8080)
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$mime = @{ '.html'='text/html; charset=utf-8'; '.css'='text/css'; '.js'='application/javascript'; '.json'='application/json';
  '.png'='image/png'; '.jpg'='image/jpeg'; '.jpeg'='image/jpeg'; '.gif'='image/gif'; '.svg'='image/svg+xml'; '.webp'='image/webp';
  '.ico'='image/x-icon'; '.woff'='font/woff'; '.woff2'='font/woff2'; '.ttf'='font/ttf'; '.mp4'='video/mp4'; '.txt'='text/plain' }
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Serving $root at http://localhost:$Port/"
while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath)
  if ($path -eq '/') { $path = '/index.html' }
  $file = Join-Path $root ($path -replace '/', '\')
  $res = $ctx.Response
  if ((Test-Path $file -PathType Leaf) -and $file.StartsWith($root)) {
    $ext = [IO.Path]::GetExtension($file).ToLower()
    $res.ContentType = if ($mime[$ext]) { $mime[$ext] } else { 'application/octet-stream' }
    $bytes = [IO.File]::ReadAllBytes($file)
    $res.ContentLength64 = $bytes.Length
    $res.OutputStream.Write($bytes, 0, $bytes.Length)
  } else {
    $res.StatusCode = 404
    $bytes = [Text.Encoding]::UTF8.GetBytes("404 Not Found: $path")
    $res.OutputStream.Write($bytes, 0, $bytes.Length)
  }
  Write-Host "$($res.StatusCode) $path"
  $res.Close()
}
