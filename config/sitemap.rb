# Set the host name for URL creation
SitemapGenerator::Sitemap.default_host = "https://www.accessnum.com"

SitemapGenerator::Sitemap.create do
  # Page d'accueil
  add '/', changefreq: 'daily', priority: 1.0

  # Pages principales
  add '/me', changefreq: 'weekly', priority: 0.8
  add '/simulate', changefreq: 'weekly', priority: 0.8
  add '/about', changefreq: 'monthly', priority: 0.7

  # Pages légales et informatives
  add '/plan-du-site', changefreq: 'monthly', priority: 0.5
  add '/accessibilite', changefreq: 'monthly', priority: 0.5
  add '/mentions-legales', changefreq: 'monthly', priority: 0.5
end
