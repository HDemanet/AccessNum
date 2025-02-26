class Rack::Attack
  # Bloquer les tentatives d'accès à des fichiers PHP
  blocklist('block php files') do |req|
    req.path.match(/\.php$/i)
  end

  # Bloquer les tentatives d'accès aux chemins sensibles
  blocklist('block suspicious paths') do |req|
    req.path.start_with?('/search/', '/caf/')
  end

  # Limiter le taux de requêtes par IP
  throttle('req/ip', limit: 300, period: 5.minutes) do |req|
    req.ip
  end
end
