// app/javascript/controllers/accordion_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["content", "button"]

  connect() {
    // S'assurer que le contenu est initialement masqué
    this.contentTarget.classList.add("collapsed")

    // Trouver le chevron dans le bouton
    this.chevron = this.element.querySelector('.toggle-icon')
  }

  toggle() {
    const button = this.element.querySelector('[data-accordion-target="button"]') || this.element
    const isExpanded = button.getAttribute("aria-expanded") === "true"

    // Mettre à jour l'attribut aria-expanded
    button.setAttribute("aria-expanded", !isExpanded)

    // Gérer la classe collapsed du contenu
    if (isExpanded) {
      this.contentTarget.classList.add("collapsed")
    } else {
      this.contentTarget.classList.remove("collapsed")
    }

    // Faire pivoter le chevron
    if (this.chevron) {
      if (isExpanded) {
        // Réinitialiser la rotation quand on replie
        this.chevron.style.transform = "rotate(0deg)"
      } else {
        // Faire pivoter de 180 degrés quand on déplie
        this.chevron.style.transform = "rotate(180deg)"
      }
    }
  }
}
