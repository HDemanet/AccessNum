# lib/tasks/check_cookies.rake
namespace :test do
  desc "Vérifie qu'aucun cookie n'est défini"
  task check_cookies: :environment do
    require 'action_dispatch/testing/integration'

    class CookieChecker < ActionDispatch::IntegrationTest
      def run_test
        paths = ["/", "/simulate"] # Ajoutez toutes vos routes principales

        puts "Vérification des cookies sur les routes principales..."
        paths.each do |path|
          get path
          if cookies.any?
            puts "⚠️  Des cookies ont été trouvés sur #{path}: #{cookies.to_h}"
          else
            puts "✅ Pas de cookies sur #{path}"
          end
        end
      end
    end

    checker = CookieChecker.new("test")
    checker.run_test
  end
end
