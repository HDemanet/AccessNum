import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static targets = ["iframe", "title", "description", "overlayContainer", "cursor", "recommendations"];

  static values = {
    currentDaltonismIndex: { type: Number, default: 0 },
    isReading: { type: Boolean, default: false }
  }

  connect() {
    this.activeFilter = null;
    this.setupKeyboardNavigation();
    this.setupCursorTracking();
    this.audioContext = null;
    this.gainNode = null;
  }

  setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      if (this.activeFilter === 'moteur') {
        setTimeout(() => this.handleKeyPress(e), 500);
      }
    });
  }

  setupCursorTracking() {
    document.addEventListener('mousemove', (e) => {
      if (this.activeFilter === 'moteur') {
        this.updateCustomCursor(e);
      }
    });
  }

  updateCustomCursor(e) {
    const cursor = this.cursorTarget;
    cursor.classList.remove('d-none');

    // Ajoute un tremblement et un délai
    setTimeout(() => {
      const randomX = Math.random() * 10 - 5;
      const randomY = Math.random() * 10 - 5;
      cursor.style.left = `${e.clientX + randomX}px`;
      cursor.style.top = `${e.clientY + randomY}px`;
    }, 100);
  }

  toggle(event) {
    const button = event.currentTarget;
    const type = button.dataset.type;

    // Toggle aria-pressed
    document.querySelectorAll('[aria-pressed="true"]').forEach(btn => {
      btn.setAttribute('aria-pressed', 'false');
    });

    if (this.activeFilter === type) {
      this.resetFilter();
      button.setAttribute('aria-pressed', 'false');
    } else {
      this.applyFilter(type);
      button.setAttribute('aria-pressed', 'true');
    }
  }

  applyFilter(type) {
    this.resetFilter();
    this.activeFilter = type;

    const iframe = this.iframeTarget;
    const container = this.overlayContainerTarget;

    switch (type) {
      case "daltonisme":
        this.simulateDaltonisme(iframe);
        break;
      case "dmla":
        this.simulateDMLA(container);
        break;
      case "cataracte":
        this.simulateCataracte(iframe);
        break;
      case "cecite":
        this.simulateCecite(iframe);
        break;
      case "surdite":
        this.simulateSurdite(iframe);
        break;
      case "moteur":
        this.simulateMotorImpairment();
        break;
      case "cognitif":
        this.simulateCognitiveImpairment(iframe);
        break;
    }
  }

  simulateDaltonisme(iframe) {
    const types = [
      { name: 'protanopia', label: 'protanopie (difficulté avec le rouge)' },
      { name: 'deuteranopia', label: 'deutéranopie (difficulté avec le vert)' },
      { name: 'tritanopia', label: 'tritanopie (difficulté avec le bleu)' }
    ];

    this.currentDaltonismIndexValue = (this.currentDaltonismIndexValue + 1) % types.length;
    const currentType = types[this.currentDaltonismIndexValue];

    iframe.style.filter = `url('#${currentType.name}')`;

    this.updateInfo(
      `Daltonisme - ${currentType.name}`,
      `Type de daltonisme : ${currentType.label}.`,
      [
        "Utilisez des contrastes élevés (WCAG 2.1 - 1.4.3)",
        "Ne pas utiliser la couleur seule pour transmettre l'information (WCAG 2.1 - 1.4.1)",
        "Fournir des alternatives textuelles pour les informations basées sur la couleur",
        `Tip : Cette simulation montre le ${currentType.name}, cliquez à nouveau pour voir les autres types`
      ]
    );
  }

  simulateDMLA(container) {
    const overlay = document.createElement('div');
    overlay.className = 'simulation-overlay dmla-overlay';
    container.appendChild(overlay);

    this.updateInfo(
      "DMLA - Dégénérescence Maculaire Liée à l'Âge",
      "La DMLA affecte la vision centrale, rendant difficile la lecture et la reconnaissance des détails.",
      [
        "Proposer des options de zoom (WCAG 2.1 - 1.4.4)",
        "Permettre le redimensionnement du texte jusqu'à 200%",
        "Assurer une navigation possible sans vision précise"
      ]
    );
  }

  simulateCataracte(iframe) {
    iframe.style.filter = "contrast(90%) blur(5px)";

    this.updateInfo(
      "Cataracte",
      "La cataracte rend la vision trouble et augmente la sensibilité à l'éblouissement.",
      [
        "Assurer un contraste suffisant (WCAG 2.1 - 1.4.3)",
        "Éviter les arrière-plans éblouissants",
        "Proposer des options de contraste élevé"
      ]
    );
  }

  simulateCecite(iframe) {
    let existingOverlay = document.getElementById('cecite-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }
    let overlay = document.createElement('div');
    overlay.id = 'cecite-overlay'; // Ajouter un identifiant unique à l'overlay
    overlay.style.position = "absolute";
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.backgroundColor = "black";
    overlay.style.opacity = "0.95";  // Opacité élevée pour simuler la cécité
    overlay.style.zIndex = "9999";   // S'assurer que l'overlay est au-dessus du contenu

    // Ajouter l'overlay à l'iframe
    iframe.style.position = "relative"; // Assurer que l'iframe est en position relative pour positionner l'overlay dessus
    iframe.parentElement.appendChild(overlay); // Ajouter l'overlay au parent de l'iframe

    // Vérifie si le bouton existe déjà, sinon le crée
    let screenReaderButton = document.getElementById('play-screen-reader');
    if (!screenReaderButton) {
        screenReaderButton = document.createElement('button');
        screenReaderButton.id = 'play-screen-reader';
        screenReaderButton.className = 'btn btn-primary';
        screenReaderButton.innerHTML = '<i class="fas fa-play"></i> Démarrer le lecteur d\'écran';
        screenReaderButton.style.position = 'absolute';
        screenReaderButton.style.top = '50%';
        screenReaderButton.style.left = '50%';
        screenReaderButton.style.transform = 'translate(-50%, -50%)'; // Centrer le bouton
        screenReaderButton.style.zIndex = "10000";  // Assurer qu'il est au-dessus de l'overlay
        overlay.appendChild(screenReaderButton); // Ajouter le bouton à l'overlay
    }

    // Ajouter l'événement pour démarrer le lecteur d'écran
    screenReaderButton.addEventListener('click', () => {
      if (window.speechSynthesis.speaking) {
          // Si la lecture est en cours, on met en pause
          window.speechSynthesis.pause();
          screenReaderButton.innerHTML = '<i class="fas fa-play"></i> Reprendre la lecture';
          screenReaderButton.classList.remove('btn-secondary');
          screenReaderButton.classList.add('btn-primary');
      } else if (window.speechSynthesis.paused) {
          // Si la lecture est en pause, on reprend
          window.speechSynthesis.resume();
          screenReaderButton.innerHTML = '<i class="fas fa-pause"></i> Pause';
          screenReaderButton.classList.add('btn-secondary');
          screenReaderButton.classList.remove('btn-primary');
      } else {
          // Si la lecture n'a pas encore commencé, on la lance
          this.startScreenReader();
          screenReaderButton.innerHTML = '<i class="fas fa-pause"></i> Pause';
          screenReaderButton.classList.add('btn-secondary');
          screenReaderButton.classList.remove('btn-primary');
      }
    });

    this.updateInfo(
      "Cécité",
      "Les personnes aveugles ou très malvoyantes utilisent des lecteurs d'écran pour naviguer sur leus smartphones, tablettes ou ordinateurs.",
      [
        "Fournir des alternatives textuelles pour les images (WCAG 2.1 - 1.1.1)",
        "Structurer le contenu avec des balises sémantiques",
        "Assurer une navigation complète au clavier",
        "Décrire les contenus complexes (graphiques, tableaux)"
      ]
    );
  }

  removeCeciteOverlay() {
    let overlay = document.getElementById('cecite-overlay');
    if (overlay) {
        overlay.remove();
    }
  }

  simulateSurdite(iframe) {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext)();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
    }
    this.gainNode.gain.value = 0.1; // Réduire le volume
    const captionsOverlay = document.createElement('div');
    captionsOverlay.id = 'captions-overlay';
    captionsOverlay.className = 'position-absolute bottom-0 w-100 text-center p-3 bg-dark text-white';
    captionsOverlay.style.zIndex = "9999";
    captionsOverlay.innerHTML = `
      <div class="captions-container">
        <p class="mb-0">⚠️ Les contenus audio de cette page ne sont pas accessibles sans sous-titres.</p>
        <small>Les personnes sourdes ou malentendantes ont besoin de sous-titres et de transcriptions.</small>
      </div>
    `;

    iframe.parentElement.appendChild(captionsOverlay);

    this.updateInfo(
      "Surdité",
      "Les personnes sourdes ou malentendantes ne peuvent pas accéder aux contenus audio sans alternatives textuelles.",
      [
        "Fournir des sous-titres pour tous les contenus audio (WCAG 2.1 - 1.2.2)",
        "Proposer des transcriptions textuelles",
        "Éviter les contenus qui ne fonctionnent qu'avec du son",
        "Permettre le contrôle du volume et la désactivation du son"
      ]
    );
  }

  simulateMotorImpairment() {
    this.cursorTarget.classList.add('trembling');
    const iframe = this.iframeTarget;
    iframe.style.pointerEvents = "none";

    this.updateInfo(
      "Handicap moteur",
      "Les personnes avec un handicap moteur peuvent avoir des difficultés à utiliser une souris avec précision.",
      [
        "Assurer une navigation complète au clavier (WCAG 2.1 - 2.1.1)",
        "Créer des zones cliquables suffisamment grandes",
        "Éviter les actions nécessitant des mouvements précis",
        "Proposer des raccourcis clavier"
      ]
    );
  }

  simulateCognitiveImpairment(iframe) {
    // Ajoute des distractions visuelles
    iframe.style.animation = "cognitive-distraction 2s infinite";

    // Ajoute des délais aléatoires pour les interactions
    iframe.style.transition = "all 0.5s ease-in-out";

    this.updateInfo(
      "Handicap cognitif",
      "Les troubles cognitifs peuvent affecter la concentration, la compréhension et la mémorisation.",
      [
        "Utiliser un langage clair et simple (WCAG 2.1 - 3.1.5)",
        "Structurer l'information de manière logique",
        "Éviter les distractions et animations non nécessaires",
        "Proposer des pictogrammes et des aides visuelles"
      ]
    );
  }

  startScreenReader() {
    if (window.speechSynthesis.speaking) {
        // Si la lecture est déjà en cours, ne rien faire
        return;
    }

    const textToRead = "Simulation du lecteur d'écran activée. Une personne aveugle utiliserait un véritable lecteur d'écran comme NVDA ou JAWS pour parcourir cette page.";
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'fr-FR';

    window.speechSynthesis.speak(utterance);
  }

  setupScreenReaderControls() {
    const playButton = document.getElementById('play-screen-reader');
    const pauseButton = document.getElementById('pause-screen-reader');
    const stopButton = document.getElementById('stop-screen-reader');

    playButton?.addEventListener('click', () => {
      this.startScreenReader();
      playButton.classList.add('d-none');
      pauseButton.classList.remove('d-none');
      stopButton.classList.remove('d-none');
    });

    pauseButton?.addEventListener('click', () => {
      window.speechSynthesis.pause();
      playButton.textContent = 'Reprendre';
      playButton.classList.remove('d-none');
      pauseButton.classList.add('d-none');
    });

    stopButton?.addEventListener('click', () => {
      window.speechSynthesis.cancel();
      playButton.textContent = 'Démarrer le lecteur d\'écran';
      playButton.classList.remove('d-none');
      pauseButton.classList.add('d-none');
      stopButton.classList.add('d-none');
    });
  }

  resetFilter() {
    const iframe = this.iframeTarget;
    const container = this.overlayContainerTarget;
    const cursor = this.cursorTarget;

    // Réinitialise tous les effets
    this.activeFilter = null;
    iframe.style.filter = "";
    iframe.style.opacity = "1";
    iframe.style.pointerEvents = "auto";
    iframe.style.animation = "";
    iframe.style.transition = "";

    // Nettoie les overlays
    container.querySelectorAll('.simulation-overlay').forEach(el => el.remove());
    this.removeCeciteOverlay();

    // Supprimer les contrôles du lecteur d'écran
    const screenReaderControls = document.getElementById('screen-reader-controls');
    screenReaderControls?.remove();

    // Supprimer l'overlay des sous-titres
    const captionsOverlay = document.getElementById('captions-overlay');
    captionsOverlay?.remove();

    // Réinitialiser l'audio
    if (this.audioContext) {
      this.gainNode.gain.value = 1;
    }

    // Réinitialise le curseur
    cursor.classList.add('d-none');
    cursor.classList.remove('trembling');

    // Arrête la synthèse vocale
    window.speechSynthesis.cancel();

    // Réinitialise les informations
    this.updateInfo(
      "Sélectionnez une simulation",
      "Cliquez sur un bouton pour voir les effets.",
      []
    );
  }

  updateInfo(title, description, recommendations = []) {
    this.titleTarget.textContent = title;
    this.descriptionTarget.textContent = description;

    const recommendationsTarget = this.recommendationsTarget;
    const recommendationsList = recommendationsTarget.querySelector('ul');

    if (recommendations.length > 0) {
      recommendationsList.innerHTML = recommendations
        .map(rec => `<li class="mb-2">• ${rec}</li>`)
        .join('');
      recommendationsTarget.classList.remove('d-none');
    } else {
      recommendationsList.innerHTML = '';
      recommendationsTarget.classList.add('d-none');
    }
  }

  handleKeyPress(e) {
    if (this.activeFilter === 'moteur') {
      // Simule un délai de réponse pour les interactions clavier
      e.preventDefault();
      setTimeout(() => {
        // Réexécute l'action après le délai
        const newEvent = new KeyboardEvent('keydown', {
          key: e.key,
          code: e.code,
          bubbles: true
        });
        e.target.dispatchEvent(newEvent);
      }, 500);
    }
  }
}
