// app/javascript/controllers/accordion_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["content"]

  connect() {
    // S'assurer que le contenu est initialement masqué
    this.contentTarget.classList.add("collapsed")
  }

  toggle() {
    const isExpanded = this.element.getAttribute("aria-expanded") === "true"
    this.element.setAttribute("aria-expanded", !isExpanded)

    if (isExpanded) {
      this.contentTarget.classList.add("collapsed")
    } else {
      this.contentTarget.classList.remove("collapsed")
    }
  }
}
