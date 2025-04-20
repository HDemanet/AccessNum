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
    this.setupTouchEventsForMobile();
    this.audioContext = null;
    this.gainNode = null;
    this.utterance = null;
    this.oscillator = null;
    this.mediaElements = [];
    this.originalUrl = null;
    this.isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    if (this.isTouchDevice) {
      this.setupMobileInterface();
    }

    window.addEventListener('resize', this.handleResize.bind(this));
  }

  setupMobileInterface() {
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
      button.setAttribute('aria-label', button.getAttribute('aria-label') + ' (touchez pour activer)');
    });
  }

  handleResize() {
    if (this.activeFilter) {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(() => {
        const currentFilter = this.activeFilter;
        this.resetFilter();
        this.applyFilter(currentFilter);
      }, 250);
    }
  }

  setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      if (this.activeFilter === 'moteur') {
        setTimeout(() => this.handleKeyPress(e), 500);
      }

      if (e.key === 'Escape' && this.activeFilter) {
        e.preventDefault();
        this.resetFilter();
        document.querySelectorAll('[aria-selected="true"]').forEach(btn => {
          btn.setAttribute('aria-selected', 'false');
        });
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

  setupTouchEventsForMobile() {
    document.addEventListener('touchmove', (e) => {
      if (this.activeFilter === 'moteur' && e.touches.length > 0) {
        const touch = e.touches[0];
        this.updateCustomCursorForTouch(touch);
      }
    }, { passive: false });

    document.addEventListener('touchstart', (e) => {
      if (this.activeFilter === 'moteur' && e.touches.length > 0) {
        const touch = e.touches[0];
        this.updateCustomCursorForTouch(touch);
      }
    }, { passive: false });
  }

  updateCustomCursor(e) {
    const cursor = this.cursorTarget;
    cursor.classList.remove('d-none');

    setTimeout(() => {
      const randomX = Math.random() * 10 - 5;
      const randomY = Math.random() * 10 - 5;
      cursor.style.left = `${e.clientX + randomX}px`;
      cursor.style.top = `${e.clientY + randomY}px`;
    }, 100);
  }

  updateCustomCursorForTouch(touch) {
    const cursor = this.cursorTarget;
    cursor.classList.remove('d-none');

    setTimeout(() => {
      const randomX = Math.random() * 12 - 6;
      const randomY = Math.random() * 12 - 6;
      cursor.style.left = `${touch.clientX + randomX}px`;
      cursor.style.top = `${touch.clientY + randomY}px`;
    }, 100);
  }

  toggle(event) {
    const button = event.currentTarget;
    const type = button.dataset.type;

    document.querySelectorAll('[aria-selected="true"]').forEach(btn => {
      btn.setAttribute('aria-selected', 'false');
    });

    if (this.activeFilter === type) {
      this.resetFilter();
      button.setAttribute('aria-selected', 'false');
    } else {
      this.applyFilter(type);
      button.setAttribute('aria-selected', 'true');
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
      {
        name: 'protanopia',
        label: 'protanopie (difficulté avec le rouge)'
      },
      {
        name: 'deuteranopia',
        label: 'deutéranopie (difficulté avec le vert)'
      },
      {
        name: 'tritanopia',
        label: 'tritanopie (difficulté avec le bleu)'
      }
    ];

    this.currentDaltonismIndexValue = (this.currentDaltonismIndexValue + 1) % types.length;
    const currentType = types[this.currentDaltonismIndexValue];

    iframe.style.filter = `url('#${currentType.name}')`;

    if (this.isTouchDevice) {
      const existingOverlay = document.querySelector('.daltonism-overlay');
      if (existingOverlay) existingOverlay.remove();

      let mobileFilter = '';
      switch(currentType.name) {
        case 'protanopia':
          mobileFilter = 'saturate(0.6) hue-rotate(-20deg) brightness(0.9)';
          break;
        case 'deuteranopia':
          mobileFilter = 'saturate(0.8) hue-rotate(20deg) brightness(0.95)';
          break;
        case 'tritanopia':
          mobileFilter = 'saturate(0.7) hue-rotate(200deg) brightness(0.85)';
          break;
      }

      iframe.style.filter = mobileFilter;

    } else {
      iframe.style.filter = `url('#${currentType.name}')`;
    }

    this.updateInfo(
      `Daltonisme - ${currentType.name}`,
      `Type de daltonisme : ${currentType.label}.`,
      [
        "Utiliser des contrastes élevés (WCAG 2.2 - 1.4.3, 1.4.11)",
        "Ne pas utiliser la couleur seule pour transmettre l'information (WCAG 2.2 - 1.4.1)",
        "Fournir des alternatives textuelles pour les informations basées sur la couleur (EAA)",
        "S'assurer que les éléments d'interface ont un ratio de contraste d'au moins 3:1 (WCAG 2.2 - 1.4.11)",
        `💡 Cette simulation montre le ${currentType.name}, cliquez à nouveau pour voir les autres types de daltonisme.`
      ]
    );
  }

  simulateDMLA(container) {
    const overlay = document.createElement('div');
    overlay.className = 'simulation-overlay dmla-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    container.appendChild(overlay);

    this.updateInfo(
      "DMLA - Dégénérescence Maculaire Liée à l'Âge",
      "La DMLA affecte la vision centrale, rendant difficile la lecture et la reconnaissance des détails.",
      [
        "Proposer des options de zoom (WCAG 2.2 - 1.4.4, 1.4.10)",
        "Permettre le redimensionnement du texte jusqu'à 200% sans perte de contenu ou fonctionnalité",
        "Assurer une navigation possible sans vision précise (EAA)",
        "Concevoir pour la saisie adaptative (WCAG 2.2 - 2.5.8 nouveau critère)"
      ]
    );
  }

  simulateCataracte(iframe) {
    iframe.style.filter = "contrast(90%) blur(5px)";

    this.updateInfo(
      "Cataracte",
      "La cataracte rend la vision trouble et augmente la sensibilité à l'éblouissement.",
      [
        "Assurer un contraste suffisant (WCAG 2.2 - 1.4.3)",
        "Éviter les arrière-plans éblouissants (WCAG 2.2 - 1.4.11)",
        "Proposer des options de contraste élevé (conforme à l'EAA)",
        "Optimiser l'espacement des caractères (WCAG 2.2 - 1.4.12)"
      ]
    );
  }

  simulateCecite(iframe) {
    let existingOverlay = document.getElementById('cecite-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }
    let overlay = document.createElement('div');
    overlay.id = 'cecite-overlay';
    overlay.style.position = "absolute";
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.backgroundColor = "black";
    overlay.style.opacity = "0.95";
    overlay.style.zIndex = "9999";
    overlay.setAttribute('aria-hidden', 'true');

    iframe.style.position = "relative";
    iframe.parentElement.appendChild(overlay);

    let screenReaderButton = document.createElement('button');
    screenReaderButton.id = 'play-screen-reader';
    screenReaderButton.className = 'btn btn-warning';
    screenReaderButton.setAttribute('aria-label', 'Démarrer la simulation du lecteur d\'écran');
    screenReaderButton.innerHTML = '<i class="fas fa-play" aria-hidden="true"></i> <span>Démarrer le lecteur d\'écran</span>';
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
        screenReaderButton.innerHTML = '<i class="fas fa-play" aria-hidden="true"></i> <span>Démarrer le lecteur d\'écran</span>';
        screenReaderButton.classList.remove('btn-info');
        screenReaderButton.classList.add('btn-warning');
        isPlaying = false;
      } else {
        this.startScreenReader();
        screenReaderButton.innerHTML = '<i class="fas fa-pause" aria-hidden="true"></i> <span>Arrêter</span>';
        screenReaderButton.classList.add('btn-info');
        screenReaderButton.classList.remove('btn-warning');
        isPlaying = true;
      }
    });

    this.updateInfo(
      "Cécité",
      "Les personnes aveugles ou très malvoyantes utilisent des lecteurs d'écran pour naviguer sur leurs smartphones, tablettes ou ordinateurs.",
      [
        "Fournir des alternatives textuelles pour les images (WCAG 2.2 - 1.1.1)",
        "Structurer le contenu avec des balises sémantiques (WCAG 2.2 - 1.3.1, 4.1.1)",
        "Assurer une navigation complète au clavier (WCAG 2.2 - 2.1.1, 2.1.2, 2.1.4)",
        "Utiliser des étiquettes consistantes (WCAG 2.2 - 2.4.6, 2.5.3)",
        "S'assurer que les noms accessibles correspondent aux étiquettes visibles (WCAG 2.2 - 2.5.3)",
        "Rendre tous les contenus disponibles via un lecteur d'écran (EAA)"
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
    // Créer un overlay avec positionnement amélioré
    let overlay = document.createElement('div');
    overlay.id = 'hearing-overlay';
    overlay.style.position = "absolute";
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = "100%";
    overlay.style.height = "15%";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    overlay.style.display = "flex";
    overlay.style.flexDirection = "column";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.zIndex = "9999";
    overlay.setAttribute('aria-hidden', 'true');

    // Création du bouton principal
    let tinnitusButton = document.createElement('button');
    tinnitusButton.id = 'toggle-tinnitus';
    tinnitusButton.className = 'btn btn-warning';
    tinnitusButton.setAttribute('aria-label', 'Démarrer la simulation d\'acouphène');
    tinnitusButton.innerHTML = '<i class="fas fa-play" aria-hidden="true"></i> <span>Démarrer l\'acouphène</span>';
    tinnitusButton.style.padding = "8px 16px";
    tinnitusButton.style.margin = "5px";
    overlay.appendChild(tinnitusButton);

    // Message explicatif
    const infoNote = document.createElement('div');
    infoNote.style.color = 'white';
    infoNote.style.fontSize = '12px';
    infoNote.style.marginTop = '6px';
    infoNote.style.textAlign = 'center';
    infoNote.style.padding = '0 10px';

    if (this.isTouchDevice) {
      infoNote.innerHTML = '<i class="fas fa-volume-up"></i> Cette simulation ne montre pas le son sur mobile. Imaginez un sifflement continu dans les oreilles.';
    } else {
      infoNote.innerHTML = '<i class="fas fa-volume-up"></i> Cliquez pour activer la simulation d\'acouphène';
    }

    overlay.appendChild(infoNote);
    iframe.parentElement.appendChild(overlay);

    // Variables d'état
    let isPlaying = false;
    let audioElement = null;

    tinnitusButton.addEventListener('click', () => {
      if (this.isTouchDevice) {
        // Sur mobile, on se contente de simuler visuellement sans le son
        if (isPlaying) {
          tinnitusButton.innerHTML = '<i class="fas fa-play" aria-hidden="true"></i> <span>Démarrer l\'acouphène</span>';
          tinnitusButton.classList.remove('btn-info');
          tinnitusButton.classList.add('btn-warning');
          isPlaying = false;
          infoNote.innerHTML = '<i class="fas fa-volume-up"></i> Cette simulation ne montre pas le son sur mobile. Imaginez un sifflement continu dans les oreilles.';
        } else {
          tinnitusButton.innerHTML = '<i class="fas fa-pause" aria-hidden="true"></i> <span>Arrêter l\'acouphène</span>';
          tinnitusButton.classList.add('btn-info');
          tinnitusButton.classList.remove('btn-warning');
          isPlaying = true;
          infoNote.innerHTML = '<i class="fas fa-volume-up"></i> Simulation active! Imaginez un sifflement aigu et continu dans vos oreilles';
        }
      } else {
        // Sur desktop, on utilise l'oscillateur comme avant
        if (isPlaying) {
          if (this.tinnitusSound) {
            this.tinnitusSound.stop();
            this.tinnitusSound = null;
          }

          tinnitusButton.innerHTML = '<i class="fas fa-play" aria-hidden="true"></i> <span>Démarrer l\'acouphène</span>';
          tinnitusButton.classList.remove('btn-info');
          tinnitusButton.classList.add('btn-warning');
          isPlaying = false;
          infoNote.innerHTML = '<i class="fas fa-volume-up"></i> Cliquez pour activer la simulation d\'acouphène';
        } else {
          try {
            // Créer un oscillateur pour simuler l'acouphène
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.value = 4000; // Fréquence typique d'un acouphène
            gainNode.gain.value = 0.2; // Volume modéré

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.start();

            this.tinnitusSound = {
              audioCtx: audioCtx,
              oscillator: oscillator,
              gainNode: gainNode,
              stop: function() {
                try {
                  this.oscillator.stop();
                  this.gainNode.disconnect();
                } catch(e) {
                  console.log("Erreur arrêt oscillateur:", e);
                }
              }
            };

            tinnitusButton.innerHTML = '<i class="fas fa-pause" aria-hidden="true"></i> <span>Arrêter l\'acouphène</span>';
            tinnitusButton.classList.add('btn-info');
            tinnitusButton.classList.remove('btn-warning');
            isPlaying = true;
            infoNote.innerHTML = '<i class="fas fa-volume-up"></i> Acouphène activé - un sifflement aigu constant';
          } catch (e) {
            console.error("Erreur audio:", e);
            infoNote.innerHTML = '<i class="fas fa-exclamation-circle"></i> Erreur audio: ' + e.message;
          }
        }
      }
    });

    this.updateInfo(
      "Surdité et acouphènes",
      "Simulation d'acouphènes : un sifflement constant que beaucoup de personnes malentendantes perçoivent en permanence.",
      [
        "Fournir des sous-titres pour tous les contenus audio (WCAG 2.2 - 1.2.2)",
        "Proposer des transcriptions textuelles (WCAG 2.2 - 1.2.1)",
        "Éviter les contenus qui ne fonctionnent qu'avec du son (EAA)",
        "S'assurer que les médias temporels sont clairement identifiés (WCAG 2.2 - 1.4.2)"
      ]
    );
  }

  resetFilter() {
    const iframe = this.iframeTarget;
    const container = this.overlayContainerTarget;
    const cursor = this.cursorTarget;

    const motorStyle = document.getElementById('motor-impairment-style');
    if (motorStyle) {
      motorStyle.remove();
    }

    document.querySelectorAll('.touch-area').forEach(area => area.remove());

    iframe.style = "";
    iframe.style.position = "relative";

    document.querySelectorAll('#cecite-overlay, #hearing-overlay, .simulation-overlay').forEach(overlay => {
      overlay.remove();
    });

    if (this.oscillator) {
      this.oscillator.stop();
      this.oscillator = null;
    }

    // Ajout de la gestion du tinnitusSound pour la nouvelle implémentation d'acouphène
    if (this.tinnitusSound) {
      this.tinnitusSound.stop();
      this.tinnitusSound = null;
    }

    if (this.utterance) {
      window.speechSynthesis.cancel();
      this.utterance = null;
    }

    if (this.audioContext) {
      if (this.gainNode) {
        this.gainNode.gain.value = 1.0;
      }
    }

    const audioElement = document.getElementById('tinnitus-audio');
    if (audioElement) {
      audioElement.pause();
      audioElement.remove();
    }

    cursor.classList.add('d-none');
    cursor.classList.remove('trembling');
    cursor.style.width = "";
    cursor.style.height = "";

    if (this.distractionInterval) {
      clearInterval(this.distractionInterval);
      this.distractionInterval = null;
    }

    this.activeFilter = null;
    this.originalUrl = null;
    this.mediaElements = [];

    this.updateInfo(
      "Sélectionnez une simulation",
      "Cliquez sur un bouton pour voir les effets.",
      []
    );
  }

  simulateMotorImpairment() {
    const iframe = this.iframeTarget;

    // Animation de tremblement pour tous les appareils
    iframe.style.animation = 'shake 0.5s infinite';

    // Ajouter une animation de tremblement au style
    const style = document.createElement('style');
    style.id = 'motor-impairment-style';
    style.textContent = `
      @keyframes shake {
        0% { transform: translate(0, 0) rotate(0deg); }
        25% { transform: translate(-2px, 1px) rotate(-0.5deg); }
        50% { transform: translate(1px, 2px) rotate(0.5deg); }
        75% { transform: translate(-1px, -1px) rotate(-0.5deg); }
        100% { transform: translate(2px, 0) rotate(0deg); }
      }

      /* Style pour indiquer les zones d'interaction difficiles */
      .touch-area {
        position: absolute;
        background-color: rgba(255, 0, 0, 0.2);
        border: 2px solid rgba(255, 0, 0, 0.4);
        border-radius: 50%;
        pointer-events: none;
        z-index: 10000;
        animation: pulse 1.5s infinite;
      }

      @keyframes pulse {
        0% { transform: scale(1); opacity: 0.7; }
        50% { transform: scale(1.2); opacity: 0.4; }
        100% { transform: scale(1); opacity: 0.7; }
      }
    `;
    document.head.appendChild(style);

    // Comportement spécifique aux appareils tactiles
    if (this.isTouchDevice) {
      // On ne montre pas le curseur sur mobile
      this.cursorTarget.classList.add('d-none');

      const overlay = document.createElement('div');
      overlay.className = 'simulation-overlay motor-overlay';
      overlay.setAttribute('aria-hidden', 'true');
      overlay.style.position = 'absolute';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.backgroundColor = 'transparent';
      overlay.style.zIndex = '9999';

      const mobileInstruction = document.createElement('div');
      mobileInstruction.style.position = 'absolute';
      mobileInstruction.style.bottom = '10px';
      mobileInstruction.style.left = '50%';
      mobileInstruction.style.transform = 'translateX(-50%)';
      mobileInstruction.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      mobileInstruction.style.color = 'white';
      mobileInstruction.style.padding = '10px';
      mobileInstruction.style.borderRadius = '5px';
      mobileInstruction.style.zIndex = '10001';
      mobileInstruction.style.textAlign = 'center';
      mobileInstruction.style.maxWidth = '90%';
      mobileInstruction.textContent = 'L\'écran tremble, rendant la précision difficile.';
      overlay.appendChild(mobileInstruction);

      // On garde les zones d'interaction "difficiles" qui suivent le doigt
      overlay.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) {
          const touch = e.touches[0];
          this.createTouchArea(touch.clientX, touch.clientY, overlay);
        }
      });

      overlay.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
          const touch = e.touches[0];
          setTimeout(() => {
            this.createTouchArea(touch.clientX, touch.clientY, overlay);
          }, 300);
        }
      });

      this.overlayContainerTarget.appendChild(overlay);
    } else {
      // Comportement pour desktop amélioré pour le suivi du curseur
      const cursor = this.cursorTarget;
      cursor.classList.remove('d-none');
      cursor.classList.add('trembling');

      // Modifications importantes ici : désactiver pointer-events sur l'iframe
      // et ajouter un overlay transparent qui capturera les événements de souris
      iframe.style.pointerEvents = "none";

      const overlay = document.createElement('div');
      overlay.className = 'simulation-overlay motor-overlay-desktop';
      overlay.setAttribute('aria-hidden', 'true');
      overlay.style.position = 'absolute';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.backgroundColor = 'transparent';
      overlay.style.zIndex = '9999';
      overlay.style.pointerEvents = "auto"; // S'assurer que l'overlay capte les événements

      // Message d'explication pour desktop
      const desktopInstruction = document.createElement('div');
      desktopInstruction.style.position = 'absolute';
      desktopInstruction.style.bottom = '10px';
      desktopInstruction.style.left = '50%';
      desktopInstruction.style.transform = 'translateX(-50%)';
      desktopInstruction.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      desktopInstruction.style.color = 'white';
      desktopInstruction.style.padding = '10px';
      desktopInstruction.style.borderRadius = '5px';
      desktopInstruction.style.zIndex = '10001';
      desktopInstruction.style.textAlign = 'center';
      desktopInstruction.style.maxWidth = '90%';
      desktopInstruction.textContent = 'Le curseur tremble et l\'écran bouge, rendant la précision difficile.';
      overlay.appendChild(desktopInstruction);

      // Utiliser l'événement mousemove sur l'overlay pour suivre le curseur
      overlay.addEventListener('mousemove', (e) => {
        this.updateCustomCursor(e);

        // Créer des zones d'interaction avec moins de fréquence
        if (Math.random() > 0.97) {
          this.createTouchArea(e.clientX, e.clientY, overlay);
        }
      });

      this.overlayContainerTarget.appendChild(overlay);
    }

    this.updateInfo(
      "Handicap moteur",
      "Les personnes avec un handicap moteur peuvent avoir des difficultés à utiliser une souris ou un écran tactile avec précision.",
      [
        "Assurer une navigation complète au clavier (WCAG 2.2 - 2.1.1)",
        "Créer des zones cliquables suffisamment grandes (WCAG 2.2 - 2.5.5)",
        "Éviter les actions nécessitant des mouvements précis ou des gestes complexes (WCAG 2.2 - 2.5.1)",
        "Fournir des mécanismes d'annulation des actions (WCAG 2.2 - 3.3.4)",
        "Offrir des entrées alternatives (WCAG 2.2 - 2.5.7 nouveau critère)",
        "Implémenter des délais suffisants (WCAG 2.2 - 2.2.1, 2.2.6 nouveau critère)"
      ]
    );
  }

  createTouchArea(x, y, parent) {
    const touchArea = document.createElement('div');
    touchArea.className = 'touch-area';
    touchArea.style.width = '40px';
    touchArea.style.height = '40px';
    touchArea.style.left = (x - 20) + 'px';
    touchArea.style.top = (y - 20) + 'px';

    parent.appendChild(touchArea);

    setTimeout(() => {
      touchArea.remove();
    }, 1500);
  }

  simulateCognitiveImpairment(iframe) {
    iframe.style.animation = "cognitive-distraction 2s infinite";
    iframe.style.transition = "all 0.5s ease-in-out";
    iframe.style.filter = "blur(1px)";

    if (this.isTouchDevice) {
      this.simulateMobileDistractions();
    }

    this.updateInfo(
      "Handicap cognitif",
      "Les troubles cognitifs peuvent affecter la concentration, la compréhension et la mémorisation.",
      [
        "Utiliser un langage clair et simple (WCAG 2.2 - 3.1.5)",
        "Structurer l'information de manière logique (WCAG 2.2 - 2.4.6)",
        "Éviter les distractions et animations non nécessaires (WCAG 2.2 - 2.2.2)",
        "Proposer des pictogrammes et des aides visuelles (EAA)",
        "Offrir des options permettant d'éviter le clignotement (WCAG 2.2 - 2.3.1)",
        "Proposer des mécanismes d'aide à la saisie (WCAG 2.2 - 3.3.1, 3.3.2, 3.3.5)",
        "Utiliser des interactions prévisibles (WCAG 2.2 - 3.2.1, 3.2.2)"
      ]
    );
  }

  simulateMobileDistractions() {
    const distract = () => {
      const notification = document.createElement('div');
      notification.style.position = 'fixed';
      notification.style.top = '10px';
      notification.style.right = '10px';
      notification.style.padding = '10px';
      notification.style.backgroundColor = 'rgba(0,0,0,0.8)';
      notification.style.color = 'white';
      notification.style.borderRadius = '5px';
      notification.style.zIndex = '100000';
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.3s ease-in-out';
      notification.style.fontSize = '16px';
      notification.textContent = 'Nouvelle notification !';
      notification.style.boxShadow = '0 0 10px rgba(255,255,255,0.5)';

      document.body.appendChild(notification);

      setTimeout(() => {
        notification.style.opacity = '1';
      }, 100);

      setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
          notification.remove();
        }, 300);
      }, 2000);
    };

    this.distractionInterval = setInterval(() => {
      if (this.activeFilter === 'cognitif') {
        distract();
      } else {
        clearInterval(this.distractionInterval);
      }
    }, Math.random() * 3000 + 3000);

    distract();
  }

  startScreenReader() {
    if (this.utterance) {
      window.speechSynthesis.cancel();
    }

    const textToRead = "Simulation du lecteur d'écran activée. Une personne aveugle utiliserait un véritable lecteur d'écran comme NVDA, JAWS ou VoiceOver pour parcourir cette page. Ces outils permettent de naviguer avec le clavier et d'entendre la description des éléments. Les images sans texte alternatif, les formulaires sans étiquettes et les structures complexes sans balisage sémantique sont inaccessibles.";

    this.utterance = new SpeechSynthesisUtterance(textToRead);

    this.utterance.lang = 'fr-FR';
    this.utterance.rate = 1.0;
    this.utterance.pitch = 1.0;

    if (this.isTouchDevice) {
      this.utterance.rate = 0.9;
      this.utterance.volume = 1.0;
    }

    window.speechSynthesis.speak(this.utterance);
  }

  updateInfo(title, description, recommendations = []) {
    this.titleTarget.textContent = title;
    this.descriptionTarget.textContent = description;

    const recommendationsTarget = this.recommendationsTarget;
    const recommendationsList = recommendationsTarget.querySelector('ul');

    if (recommendations.length > 0) {
      recommendationsList.innerHTML = recommendations
        .map(rec => `<li class="mb-2">${rec}</li>`)
        .join('');
      recommendationsTarget.classList.remove('d-none');
    } else {
      recommendationsList.innerHTML = '';
      recommendationsTarget.classList.add('d-none');
    }
  }

  handleKeyPress(e) {
    if (this.activeFilter === 'moteur') {
      e.preventDefault();
      setTimeout(() => {
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
