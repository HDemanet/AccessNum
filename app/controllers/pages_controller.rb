class PagesController < ApplicationController
  def home
  end

  def simulate
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
  end

  def about
  end

  def me
  end

  def plan_du_site
  end

  def mentions_legales
  end

  def accessibilite
  end
end
