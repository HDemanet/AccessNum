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
end
