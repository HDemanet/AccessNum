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

    // Vérifier si l'écran est tactile (mobile/tablette)
    this.isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    // Ajuster l'interface pour les appareils mobiles
    if (this.isTouchDevice) {
      this.setupMobileInterface();
    }

    // Écouter les changements de taille d'écran
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  setupMobileInterface() {
    // Ajustements spécifiques pour l'interface mobile
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
      button.setAttribute('aria-label', button.getAttribute('aria-label') + ' (touchez pour activer)');
    });
  }

  handleResize() {
    // Réinitialiser les filtres si l'écran change significativement de taille
    if (this.activeFilter) {
      // Attendre que le redimensionnement soit terminé
      clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(() => {
        // Réappliquer le filtre actif pour l'adapter à la nouvelle taille
        const currentFilter = this.activeFilter;
        this.resetFilter();
        this.applyFilter(currentFilter);
      }, 250);
    }
  }

  setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      // Pour les simulations de handicap moteur
      if (this.activeFilter === 'moteur') {
        setTimeout(() => this.handleKeyPress(e), 500);
      }

      // Ajout: navigation par clavier entre les boutons de simulation
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
    // Suivre les événements tactiles pour la simulation de handicap moteur sur mobile
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

    // Ajoute un tremblement et un délai
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

    // Ajoute un tremblement et un délai pour le tactile
    setTimeout(() => {
      const randomX = Math.random() * 12 - 6; // Légèrement plus prononcé pour le tactile
      const randomY = Math.random() * 12 - 6;
      cursor.style.left = `${touch.clientX + randomX}px`;
      cursor.style.top = `${touch.clientY + randomY}px`;
    }, 100);
  }

  toggle(event) {
    const button = event.currentTarget;
    const type = button.dataset.type;

    // Toggle aria-selected (remplace aria-pressed pour meilleure compatibilité avec le rôle tab)
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

  // Modifier la fonction simulateDaltonisme pour utiliser des filtres CSS au lieu de SVG sur mobile
  simulateDaltonisme(iframe) {
    const types = [
      {
        name: 'protanopia',
        label: 'protanopie (difficulté avec le rouge)',
        cssFilter: 'grayscale(0) sepia(0) saturate(1.4) hue-rotate(350deg) brightness(0.88) contrast(0.92)'
      },
      {
        name: 'deuteranopia',
        label: 'deutéranopie (difficulté avec le vert)',
        cssFilter: 'grayscale(0) sepia(0) saturate(1.1) hue-rotate(205deg) brightness(0.92) contrast(1)'
      },
      {
        name: 'tritanopia',
        label: 'tritanopie (difficulté avec le bleu)',
        cssFilter: 'grayscale(0) sepia(0.2) saturate(0.8) hue-rotate(175deg) brightness(1.1) contrast(1.1)'
      }
    ];

    this.currentDaltonismIndexValue = (this.currentDaltonismIndexValue + 1) % types.length;
    const currentType = types[this.currentDaltonismIndexValue];

    // Utiliser des filtres CSS sur mobile et SVG sur desktop
    if (this.isTouchDevice) {
      iframe.style.filter = currentType.cssFilter;
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

  // Amélioration de la simulation de surdité pour les appareils mobiles
  simulateSurdite(iframe) {
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
    overlay.setAttribute('aria-hidden', 'true');

    let tinnitusButton = document.createElement('button');
    tinnitusButton.id = 'toggle-tinnitus';
    tinnitusButton.className = 'btn btn-warning';
    tinnitusButton.setAttribute('aria-label', 'Démarrer la simulation d\'acouphène');
    tinnitusButton.innerHTML = '<i class="fas fa-play" aria-hidden="true"></i> <span>Démarrer l\'acouphène</span>';
    overlay.appendChild(tinnitusButton);

    iframe.parentElement.appendChild(overlay);

    // Ajouter des informations sur les contraintes mobiles si nécessaire
    if (this.isTouchDevice) {
      const mobileNote = document.createElement('div');
      mobileNote.style.color = 'white';
      mobileNote.style.fontSize = '12px';
      mobileNote.style.marginTop = '5px';
      mobileNote.style.textAlign = 'center';
      mobileNote.style.padding = '0 10px';
      mobileNote.innerHTML = '<i class="fas fa-info-circle"></i> Sur mobile : touchez pour activer le son.';
      overlay.appendChild(mobileNote);
    }

    let isPlaying = false;

    // Son prédéfini pour les acouphènes (alternative aux oscillateurs pour meilleure compatibilité)
    let audioElement = null;

    tinnitusButton.addEventListener('click', () => {
      if (isPlaying) {
        if (audioElement) {
          audioElement.pause();
          audioElement.currentTime = 0;
        } else if (this.oscillator) {
          try {
            this.oscillator.stop();
            this.oscillator = null;
          } catch(e) {
            console.log("Erreur lors de l'arrêt de l'oscillateur:", e);
          }
        }

        tinnitusButton.innerHTML = '<i class="fas fa-play" aria-hidden="true"></i> <span>Démarrer l\'acouphène</span>';
        tinnitusButton.classList.remove('btn-info');
        tinnitusButton.classList.add('btn-warning');
        isPlaying = false;
      } else {
        // Approche 1: Utiliser un élément audio pour les appareils mobiles (plus fiable)
        if (this.isTouchDevice) {
          if (!audioElement) {
            audioElement = document.createElement('audio');
            audioElement.id = 'tinnitus-audio';

            // Utiliser une source alternative pour les acouphènes via un fichier audio en ligne ou base64
            // Note: Il faudrait héberger ce fichier sur votre serveur en production
            audioElement.src = 'https://example.com/tinnitus-sound.mp3';

            // Solution alternative : utiliser un signal audio encodé en base64
            // Cette ligne est un exemple, vous auriez besoin de créer ou d'obtenir ce son encodé
            audioElement.src = 'data:audio/mp3;base64,SUQzAwAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tAwAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADmAD///////////////////////////////////////////8AAAA...';

            audioElement.loop = true;
            audioElement.volume = 0.3;
            document.body.appendChild(audioElement);
          }

          audioElement.play()
            .then(() => {
              console.log("Lecture audio démarrée avec succès");
            })
            .catch(e => {
              console.error("Erreur de lecture audio:", e);
              tinnitusButton.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Touchez à nouveau';
              setTimeout(() => {
                tinnitusButton.innerHTML = '<i class="fas fa-play" aria-hidden="true"></i> <span>Démarrer l\'acouphène</span>';
              }, 2000);
              return;
            });
        }
        // Approche 2: Oscillateur pour desktop
        else if (!this.audioContext) {
          try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
          } catch (e) {
            console.error("Impossible d'initialiser l'AudioContext:", e);
            tinnitusButton.innerHTML = "Audio non supporté";
            tinnitusButton.disabled = true;
            return;
          }
        }

        // Si nous sommes sur desktop ou si l'audio a démarré sur mobile
        try {
          if (!this.isTouchDevice && this.audioContext) {
            // Méthode original de l'oscillateur pour desktop
            if (this.audioContext.state === 'suspended') {
              this.audioContext.resume();
            }

            this.oscillator = this.audioContext.createOscillator();
            this.oscillator.type = 'sine';
            this.oscillator.frequency.setValueAtTime(4000, this.audioContext.currentTime);

            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = 0.3;

            this.oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            this.oscillator.start();
          }

          tinnitusButton.innerHTML = '<i class="fas fa-pause" aria-hidden="true"></i> <span>Arrêter l\'acouphène</span>';
          tinnitusButton.classList.add('btn-info');
          tinnitusButton.classList.remove('btn-warning');
          isPlaying = true;
        } catch (e) {
          console.error("Erreur lors de la génération de l'acouphène:", e);
          tinnitusButton.innerHTML = "Audio non supporté";
          tinnitusButton.disabled = true;
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

  // Modification de resetFilter pour nettoyer l'audio
  resetFilter() {
    // Code existant...

    // Nettoyer les éléments audio
    const audioElement = document.getElementById('tinnitus-audio');
    if (audioElement) {
      audioElement.pause();
      audioElement.remove();
    }

    // Reste du code existant...
  }

  // Amélioration de la simulation du handicap moteur pour mobile
  simulateMotorImpairment() {
    const iframe = this.iframeTarget;

    // Pour les appareils tactiles (mobiles)
    if (this.isTouchDevice) {
      // Ajouter un overlay pour simuler la "difficulté d'interaction"
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

      // Faire trembler l'iframe plutôt que juste le curseur
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

      // Ajouter un message d'explication spécifique au mobile
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
      mobileInstruction.textContent = 'Essayez d\'interagir avec l\'écran. Les touches sont difficiles à atteindre et l\'écran tremble.';
      overlay.appendChild(mobileInstruction);

      // Ajouter des zones d'interaction "difficiles" qui suivent le doigt avec délai
      overlay.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        this.createTouchArea(touch.clientX, touch.clientY, overlay);
      });

      overlay.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
          const touch = e.touches[0];
          setTimeout(() => {
            this.createTouchArea(touch.clientX, touch.clientY, overlay);
          }, 300); // Délai de suivi
        }
      });

      this.overlayContainerTarget.appendChild(overlay);
    } else {
      // Comportement existant pour desktop avec curseur qui tremble
      this.cursorTarget.classList.remove('d-none');
      this.cursorTarget.classList.add('trembling');
      iframe.style.pointerEvents = "none";
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

  // Nouvelle méthode pour créer des zones tactiles "difficiles"
  createTouchArea(x, y, parent) {
    const touchArea = document.createElement('div');
    touchArea.className = 'touch-area';
    touchArea.style.width = '40px';
    touchArea.style.height = '40px';
    touchArea.style.left = (x - 20) + 'px';
    touchArea.style.top = (y - 20) + 'px';

    parent.appendChild(touchArea);

    // Supprimer après animation
    setTimeout(() => {
      touchArea.remove();
    }, 1500);
  }

  simulateCognitiveImpairment(iframe) {
    // Ajoute des distractions visuelles
    iframe.style.animation = "cognitive-distraction 2s infinite";

    // Ajoute des délais aléatoires pour les interactions
    iframe.style.transition = "all 0.5s ease-in-out";

    // Perturbation supplémentaire : ajoute un léger flou
    iframe.style.filter = "blur(1px)";

    // Sur mobile, simuler les distractions par des notifications
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

  // Dans la fonction simulateMobileDistractions()
simulateMobileDistractions() {
  // Crée des "notifications" perturbantes pour simuler les distractions sur mobile
  const distract = () => {
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.top = '10px';
    notification.style.right = '10px';
    notification.style.padding = '10px';
    notification.style.backgroundColor = 'rgba(0,0,0,0.8)';
    notification.style.color = 'white';
    notification.style.borderRadius = '5px';
    notification.style.zIndex = '100000'; // Z-index beaucoup plus élevé
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.3s ease-in-out';
    notification.style.fontSize = '16px'; // Taille de police explicite
    notification.textContent = 'Nouvelle notification!';
    notification.style.boxShadow = '0 0 10px rgba(255,255,255,0.5)'; // Ajout d'une ombre pour attirer l'attention

    // Ajouter directement au body pour éviter les problèmes de z-index
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

  // Afficher des distractions plus fréquemment sur mobile
  this.distractionInterval = setInterval(() => {
    if (this.activeFilter === 'cognitif') {
      distract();
    } else {
      clearInterval(this.distractionInterval);
    }
  }, Math.random() * 3000 + 3000); // Entre 3 et 6 secondes sur mobile

  // Première distraction immédiate
  distract();
}

  startScreenReader() {
    if (this.utterance) {
      window.speechSynthesis.cancel();
    }

    const textToRead = "Simulation du lecteur d'écran activée. Une personne aveugle utiliserait un véritable lecteur d'écran comme NVDA, JAWS ou VoiceOver pour parcourir cette page. Ces outils permettent de naviguer avec le clavier et d'entendre la description des éléments. Les images sans texte alternatif, les formulaires sans étiquettes et les structures complexes sans balisage sémantique sont inaccessibles.";

    this.utterance = new SpeechSynthesisUtterance(textToRead);

    // Paramètres de synthèse vocale
    this.utterance.lang = 'fr-FR';
    this.utterance.rate = 1.0;
    this.utterance.pitch = 1.0;

    // Sur mobile, utiliser une voix plus lente et plus forte si possible
    if (this.isTouchDevice) {
      this.utterance.rate = 0.9;
      this.utterance.volume = 1.0;
    }

    window.speechSynthesis.speak(this.utterance);
  }

  resetFilter() {
    const iframe = this.iframeTarget;
    const container = this.overlayContainerTarget;
    const cursor = this.cursorTarget;

      // Supprimer les styles spécifiques au handicap moteur
      const motorStyle = document.getElementById('motor-impairment-style');
      if (motorStyle) {
        motorStyle.remove();
      }

      // Supprimer toutes les zones tactiles
      document.querySelectorAll('.touch-area').forEach(area => area.remove());

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
    cursor.style.width = "";
    cursor.style.height = "";

    // Arrêter les intervalles de distraction
    if (this.distractionInterval) {
      clearInterval(this.distractionInterval);
      this.distractionInterval = null;
    }

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
