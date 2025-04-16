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

    // Approche hybride : utiliser des filtres CSS sur mobile et SVG sur desktop
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

  simulateSurdite(iframe) {
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

    // Message spécifique pour mobile
    if (this.isTouchDevice) {
      const mobileNote = document.createElement('div');
      mobileNote.style.color = 'white';
      mobileNote.style.fontSize = '12px';
      mobileNote.style.marginTop = '5px';
      mobileNote.style.textAlign = 'center';
      mobileNote.style.padding = '0 10px';
      mobileNote.innerHTML = '<i class="fas fa-info-circle"></i> Sur mobile : touchez pour activer le son. Touchez une seconde fois si nécessaire.';
      overlay.appendChild(mobileNote);
    }

    let isPlaying = false;
    let audioElement = null;

    tinnitusButton.addEventListener('click', () => {
      if (isPlaying) {
        // Arrêter l'audio
        if (audioElement) {
          audioElement.pause();
          audioElement.currentTime = 0;
        } else if (this.oscillator) {
          try {
            this.oscillator.stop();
            this.oscillator = null;
            if (this.gainNode) {
              this.gainNode.disconnect();
              this.gainNode = null;
            }
          } catch(e) {
            console.log("Erreur lors de l'arrêt de l'oscillateur:", e);
          }
        }

        tinnitusButton.innerHTML = '<i class="fas fa-play" aria-hidden="true"></i> <span>Démarrer l\'acouphène</span>';
        tinnitusButton.classList.remove('btn-info');
        tinnitusButton.classList.add('btn-warning');
        isPlaying = false;
      } else {
        // Démarrer l'audio
        if (!audioElement) {
          audioElement = document.createElement('audio');
          audioElement.id = 'tinnitus-audio';
          audioElement.loop = true;

          if (this.isTouchDevice) {
            // Utiliser une approche plus directe pour mobile en utilisant un son préenregistré encodé en base64
            const tinnitusToneBase64 = "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjIwLjEwMAAAAAAAAAAAAAAA//tAwAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAAFygCenp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6e//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjM1AAAAAAAAAAAAAAAAJAYyAAAAAAAABcrocG/OAAAAAAD/+xDEAAPMAAGkAAAAIAAANIAAAARMQU1FMy4xMDAEkgABzAAABEgQlEJQCBAEAh/9zbCYDAMBgMBgQDHEHDvkHf/IOHBBEB+f//oIOHfBA7/5cEDu5h3/+XwQH8E8oQqmIAwwTcM/+RP5L5cMrMUJkYAJIZbZZEiSYsYQphMEoDkOiIRjAlBTfFg59qJ0xSxYzYv4zqDxTSkdJRYjYjSxxUEg47JHqWOidM0aeWGpYyZ1jpnw6Sq2a1q5YaFa57UaZWWrFU8mCl8MLFQZgpNDCrIsZFjVLFUsdQyxkTqHROqdQ0K1TKy1MrPSxqGhTEFNRTMuOTguMqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq";
            audioElement.src = tinnitusToneBase64;
          } else {
            // Pour desktop, utiliser la méthode d'oscillateur qui fonctionne bien
            try {
              const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
              const oscillator = audioCtx.createOscillator();
              const gainNode = audioCtx.createGain();

              oscillator.type = 'sine';
              oscillator.frequency.value = 4000;
              gainNode.gain.value = 0.3;

              oscillator.connect(gainNode);
              gainNode.connect(audioCtx.destination);

              oscillator.start();
              this.oscillator = oscillator; // Garder une référence pour l'arrêt

              const destination = audioCtx.createMediaStreamDestination();
              gainNode.connect(destination);

              const mediaRecorder = new MediaRecorder(destination.stream);
              const chunks = [];

              mediaRecorder.ondataavailable = (evt) => {
                chunks.push(evt.data);
              };

              mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { 'type' : 'audio/ogg; codecs=opus' });
                audioElement.src = URL.createObjectURL(blob);
                document.body.appendChild(audioElement);

                audioElement.play()
                  .then(() => {
                    console.log("Lecture audio démarrée avec succès");
                    tinnitusButton.innerHTML = '<i class="fas fa-pause" aria-hidden="true"></i> <span>Arrêter l\'acouphène</span>';
                    tinnitusButton.classList.add('btn-info');
                    tinnitusButton.classList.remove('btn-warning');
                    isPlaying = true;
                    oscillator.stop(); // Arrêter l'oscillateur une fois que nous avons l'audio enregistré
                  })
                  .catch(e => {
                    console.error("Erreur de lecture audio:", e);
                    tinnitusButton.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Touchez à nouveau';
                    setTimeout(() => {
                      tinnitusButton.innerHTML = '<i class="fas fa-play" aria-hidden="true"></i> <span>Démarrer l\'acouphène</span>';
                    }, 2000);
                  });
              };

              mediaRecorder.start();
              setTimeout(() => {
                mediaRecorder.stop();
              }, 2000);

              return; // Sortir de la fonction pour attendre l'enregistrement
            } catch (error) {
              console.error("Erreur WebAudio:", error);
              // Fallback vers la méthode simple en cas d'erreur
              const tinnitusToneBase64 = "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjIwLjEwMAAAAAAAAAAAAAAA//tAwAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAAFygCenp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6e//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjM1AAAAAAAAAAAAAAAAJAYyAAAAAAAABcrocG/OAAAAAAD/+xDEAAPMAAGkAAAAIAAANIAAAARMQU1FMy4xMDAEkgABzAAABEgQlEJQCBAEAh/9zbCYDAMBgMBgQDHEHDvkHf/IOHBBEB+f//oIOHfBA7/5cEDu5h3/+XwQH8E8oQqmIAwwTcM/+RP5L5cMrMUJkYAJIZbZZEiSYsYQphMEoDkOiIRjAlBTfFg59qJ0xSxYzYv4zqDxTSkdJRYjYjSxxUEg47JHqWOidM0aeWGpYyZ1jpnw6Sq2a1q5YaFa57UaZWWrFU8mCl8MLFQZgpNDCrIsZFjVLFUsdQyxkTqHROqdQ0K1TKy1MrPSxqGhTEFNRTMuOTguMqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq";
              audioElement.src = tinnitusToneBase64;
            }
          }

          document.body.appendChild(audioElement);
        }

        // Lire l'audio (ceci s'exécute pour mobile et si desktop a déjà créé l'audioElement)
        if (audioElement.src) {
          audioElement.play()
            .then(() => {
              console.log("Lecture audio démarrée avec succès");
              tinnitusButton.innerHTML = '<i class="fas fa-pause" aria-hidden="true"></i> <span>Arrêter l\'acouphène</span>';
              tinnitusButton.classList.add('btn-info');
              tinnitusButton.classList.remove('btn-warning');
              isPlaying = true;
            })
            .catch(e => {
              console.error("Erreur de lecture audio:", e);
              // Sur mobile, insister sur la nécessité d'une interaction utilisateur
              tinnitusButton.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Touchez à nouveau';
              setTimeout(() => {
                tinnitusButton.innerHTML = '<i class="fas fa-play" aria-hidden="true"></i> <span>Démarrer l\'acouphène</span>';
              }, 2000);
            });
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
