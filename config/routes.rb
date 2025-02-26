Rails.application.routes.draw do
  root to: "pages#home"
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Defines the root path route ("/")
  # root "posts#index"
  get 'simulate', to: 'pages#simulate'
  get 'about', to: 'pages#about'
  get 'me', to: 'pages#me'

  get 'plan-du-site', to: 'pages#plan_du_site'
  get 'accessibilite', to: 'pages#accessibilite'
  get 'mentions-legales', to: 'pages#mentions_legales'

  # Bloquer les chemins indésirables en renvoyant explicitement vers la page 404
  match "/search/*path", to: proc { [404, {}, ["Not Found"]] }, via: :all
  match "/caf/*path", to: proc { [404, {}, ["Not Found"]] }, via: :all

  # Capturer toutes les extensions .php et autres tentatives suspectes
  match "/*.php", to: proc { [404, {}, ["Not Found"]] }, via: :all
end
