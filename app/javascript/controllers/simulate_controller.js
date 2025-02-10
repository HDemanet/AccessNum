import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static targets = ["iframe", "title", "description"];

  connect() {
    console.log("Simulate Controller connected!");
    this.activeFilter = null;
    document.getElementById("url-form").addEventListener("submit", this.updateURL.bind(this));
  }

  toggle(event) {
    const type = event.currentTarget.dataset.type;
    const iframe = this.iframeTarget;

    if (this.activeFilter === type) {
      this.resetFilter(iframe);
      return;
    }

    this.applyFilter(type, iframe);
  }

  applyFilter(type, iframe) {
    this.resetFilter(iframe);
    this.activeFilter = type;

    switch (type) {
      case "daltonisme":
        iframe.style.filter = "grayscale(100%) contrast(90%)";
        this.updateInfo("Daltonisme", "Le daltonisme altère la perception des couleurs.");
        break;
      case "dmla":
        iframe.style.filter = "blur(8px)";
        this.updateInfo("DMLA", "Vision floue, notamment au centre du champ de vision.");
        break;
      case "cataracte":
        iframe.style.filter = "brightness(50%) contrast(150%)";
        this.updateInfo("Cataracte", "Vision trouble et sensibilité accrue à la lumière.");
        break;
      case "cecité":
        iframe.style.visibility = "hidden";
        this.updateInfo("Cécité", "Une personne aveugle utilise un lecteur d'écran.");
        this.playScreenReader();
        break;
      case "moteur":
        iframe.style.pointerEvents = "none";
        this.updateInfo("Handicap moteur", "Difficultés à utiliser une souris, usage du clavier privilégié.");
        break;
      case "cognitif":
        iframe.style.filter = "saturate(150%)";
        this.updateInfo("Handicap cognitif", "Difficultés à traiter l’information, mise en page claire recommandée.");
        break;
      default:
        break;
    }
  }

  resetFilter(iframe) {
    this.activeFilter = null;
    iframe.style.filter = "";
    iframe.style.visibility = "visible";
    iframe.style.pointerEvents = "auto";
    this.updateInfo("Sélectionnez une simulation", "Cliquez sur un bouton pour voir les effets.");
  }

  updateInfo(title, description) {
    this.titleTarget.innerText = title;
    this.descriptionTarget.innerText = description;
  }

  playScreenReader() {
    const textToRead = "Cette page est maintenant simulée pour une personne aveugle.";
    let speech = new SpeechSynthesisUtterance(textToRead);
    speech.lang = "fr-FR";
    window.speechSynthesis.speak(speech);
  }

  updateURL(event) {
    event.preventDefault();
    const newURL = document.getElementById("site-url").value;
    if (newURL) {
      window.location.href = `?url=${encodeURIComponent(newURL)}`;
    }
  }
}
