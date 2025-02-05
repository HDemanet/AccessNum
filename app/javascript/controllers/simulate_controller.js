import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static targets = ["iframe", "title", "description"];

  connect() {
    console.log("Simulate Controller connected!");
    this.activeFilters = {}; // Stores active filters
  }

  toggle(event) {
    const type = event.currentTarget.dataset.type;
    const iframe = this.iframeTarget;

    if (this.activeFilters[type]) {
      this.removeFilter(type, iframe);
    } else {
      this.applyFilter(type, iframe);
    }
  }

  // Applies the selected filter
  applyFilter(type, iframe) {
    // Reset other filters
    this.activeFilters = {};
    this.activeFilters[type] = true;

    switch (type) {
      case "daltonisme":
        iframe.style.filter = "url(#daltonisme)"; // Custom filter for red/green confusion
        this.updateInfo("Daltonisme", "Simule la confusion des couleurs, principalement du vert et du rouge.");
        break;

      case "dmla":
        iframe.style.filter = "blur(5px)"; // Simulate DMLA with blurred vision
        this.updateInfo("DMLA", "Simule la dégénérescence maculaire liée à l'âge.");
        break;

      case "cataracte":
        iframe.style.filter = "brightness(50%) contrast(150%)"; // Simulate cataracts
        this.updateInfo("Cataracte", "Simule la vision trouble due à une cataracte.");
        break;

      case "cecité":
        iframe.style.visibility = "hidden"; // Simulate blindness (completely hide)
        this.updateInfo("Cécité", "Simule la cécité totale. Le site est invisible.");
        this.playScreenReader();
        break;

      case "moteur":
        iframe.style.pointerEvents = "none"; // Disable mouse pointer
        this.updateInfo("Handicap moteur", "Simule l'incapacité d'utiliser la souris. Utilisez uniquement la touche TAB.");
        break;

      case "cognitif":
        iframe.style.filter = "saturate(150%)"; // Simulate dyslexia by distorting text
        this.updateInfo("Handicap cognitif", "Simule la dyslexie en déformant légèrement le texte.");
        break;

      default:
        break;
    }
  }

  // Remove selected filter
  removeFilter(type, iframe) {
    this.activeFilters[type] = false;
    iframe.style.filter = "";
    iframe.style.visibility = "visible";
    iframe.style.pointerEvents = "auto"; // Re-enable pointer events
    this.updateInfo("Sélectionnez une simulation", "Cliquez sur un bouton pour voir les effets.");
  }

  // Update the title and description dynamically
  updateInfo(title, description) {
    this.titleTarget.innerText = title;
    this.descriptionTarget.innerText = description;
  }

  // Simulate what a screen reader would say (using an example of text-to-speech)
  playScreenReader() {
    const textToRead = "Cette page est maintenant simulée pour une personne aveugle.";
    let speech = new SpeechSynthesisUtterance(textToRead);
    speech.lang = "fr-FR";
    window.speechSynthesis.speak(speech);
  }
}
