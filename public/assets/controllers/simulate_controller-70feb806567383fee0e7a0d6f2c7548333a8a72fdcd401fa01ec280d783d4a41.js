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
    this.utterance = null;
    this.oscillator = null;
    this.mediaElements = [];
    this.originalUrl = null;
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
        `💡 Cette simulation montre le ${currentType.name}, cliquez à nouveau pour voir les autres types de daltonisme.`
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

    let screenReaderButton = document.createElement('button');
    screenReaderButton.id = 'play-screen-reader';
    screenReaderButton.className = 'btn btn-warning';
    screenReaderButton.innerHTML = '<i class="fas fa-play"></i> Démarrer le lecteur d\'écran';
    screenReaderButton.style.position = 'absolute';
    screenReaderButton.style.top = '50%';
    screenReaderButton.style.left = '50%';
    screenReaderButton.style.transform = 'translate(-50%, -50%)';
    screenReaderButton.style.zIndex = "10000";
    overlay.appendChild(screenReaderButton);

    let isPlaying = false;
    screenReaderButton.addEventListener('click', () => {
      if (isPlaying) {
        window.speechSynthesis.cancel();
        this.utterance = null;
        screenReaderButton.innerHTML = '<i class="fas fa-play"></i> Démarrer le lecteur d\'écran';
        screenReaderButton.classList.remove('btn-info');
        screenReaderButton.classList.add('btn-warning');
        isPlaying = false;
      } else {
        this.startScreenReader();
        screenReaderButton.innerHTML = '<i class="fas fa-pause"></i> Arrêter';
        screenReaderButton.classList.add('btn-info');
        screenReaderButton.classList.remove('btn-warning');
        isPlaying = true;
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
    }

    // Créer l'overlay avec le bouton centré
    let overlay = document.createElement('div');
    overlay.id = 'hearing-overlay';
    overlay.style.position = "absolute";
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = "100%";
    overlay.style.height = "12%";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.zIndex = "9999";

    let tinnitusButton = document.createElement('button');
    tinnitusButton.id = 'toggle-tinnitus';
    tinnitusButton.className = 'btn btn-warning';
    tinnitusButton.innerHTML = '<i class="fas fa-play"></i> Démarrer l\'acouphène';
    overlay.appendChild(tinnitusButton);

    iframe.parentElement.appendChild(overlay);

    let isPlaying = false;
    tinnitusButton.addEventListener('click', () => {
      if (isPlaying) {
        if (this.oscillator) {
          this.oscillator.stop();
          this.oscillator = null;
        }
        tinnitusButton.innerHTML = '<i class="fas fa-play"></i> Démarrer l\'acouphène';
        tinnitusButton.classList.remove('btn-info');
        tinnitusButton.classList.add('btn-warning');
        isPlaying = false;
      } else {
        this.oscillator = this.audioContext.createOscillator();
        this.oscillator.type = 'sine';
        this.oscillator.frequency.setValueAtTime(4000, this.audioContext.currentTime);
        this.oscillator.connect(this.audioContext.destination);
        this.oscillator.start();

        tinnitusButton.innerHTML = '<i class="fas fa-pause"></i> Arrêter l\'acouphène';
        tinnitusButton.classList.add('btn-info');
        tinnitusButton.classList.remove('btn-warning');
        isPlaying = true;
      }
    });

    this.updateInfo(
      "Surdité et acouphènes",
      "Simulation d'acouphènes : un sifflement constant que beaucoup de personnes malentendantes perçoivent en permanence.",
      [
        "Fournir des sous-titres pour tous les contenus audio (WCAG 2.1 - 1.2.2)",
        "Proposer des transcriptions textuelles",
        "Éviter les contenus qui ne fonctionnent qu'avec du son",
        "Fournir des alternatives visuelles aux signaux sonores"
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
    if (this.utterance) {
      window.speechSynthesis.cancel();
    }

    const textToRead = "Simulation du lecteur d'écran activée. Une personne aveugle utiliserait un véritable lecteur d'écran comme NVDA ou JAWS pour parcourir cette page.";
    this.utterance = new SpeechSynthesisUtterance(textToRead);
    this.utterance.lang = 'fr-FR';
    this.utterance.rate = 1.0;
    this.utterance.pitch = 1.0;

    window.speechSynthesis.speak(this.utterance);
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

    // Réinitialiser complètement l'iframe
    iframe.style = ""; // Réinitialise tous les styles
    iframe.style.position = "relative"; // Maintient uniquement le positionnement nécessaire

    // Nettoyage complet des overlays
    document.querySelectorAll('#cecite-overlay, #hearing-overlay, .simulation-overlay').forEach(overlay => {
      overlay.remove();
    });

    // Arrêter tous les sons
    if (this.oscillator) {
      this.oscillator.stop();
      this.oscillator = null;
    }
    if (this.utterance) {
      window.speechSynthesis.cancel();
      this.utterance = null;
    }

    // Réinitialiser l'audio
    if (this.audioContext) {
      if (this.gainNode) {
        this.gainNode.gain.value = 1.0;
      }
      // Ne pas fermer le contexte audio car il pourrait être réutilisé
    }

    // Réinitialiser le curseur
    cursor.classList.add('d-none');
    cursor.classList.remove('trembling');

    // Réinitialiser les états
    this.activeFilter = null;
    this.originalUrl = null;
    this.mediaElements = [];

    // Réinitialiser les informations
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
};
