namespace :sitemap do
  desc "Generate sitemap and ping search engines"
  task generate: :environment do
    SitemapGenerator::Sitemap.verbose = true
    SitemapGenerator::Sitemap.default_host = "https://www.accessnum.com"
    SitemapGenerator::Sitemap.create
    SitemapGenerator::Sitemap.ping_search_engines
  end
end
