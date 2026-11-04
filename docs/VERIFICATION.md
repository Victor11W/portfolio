# Vérifications du portfolio

Date : 2026-11-04, Europe/Paris.

## Contrôles automatisés

- Contrôle syntaxique de tous les modules JavaScript et du bundle construit.
- 31 tests Node passent : contenu bilingue, identifiants, liens, recherche et filtres, variantes de présentation, illustrations, calcul du CNN contre une référence NumPy indépendante, encodage et exécution du pipeline, modèle IRQ, protocole Avalon, géométrie, cinématique, non-interpénétration des cubes et de la pince, réponses HTTP et protection des fichiers.
- Build propre de dist, avec contrôle du chemin de sortie et refus de remplacer une jonction ou un lien symbolique.
- Export des deux maillages OBJ et de leurs matériaux, y compris les cubes.
- Archive ZIP servie par le site comparée octet par octet au fichier local ; les deux PDF de projets sont identiques aux originaux fournis.
- Les deux CV existants ont repassé le validateur du dépôt lors de la livraison initiale. Ils n’ont pas été modifiés : une page A4 chacun, rendus inspectés. La copie française est désormais retirée du site pour respecter la restriction de publication ; le PDF anglais reste disponible.
- Aucune dépendance npm requise pour afficher, construire ou tester le site. NumPy sert uniquement à régénérer la référence de vérification du CNN.

## Vérification dans le navigateur

La version source en modules ES et le bundle construit ont été ouverts sur HTTP local. Le serveur temporaire des sources a ensuite été arrêté ; le serveur demandé reste ouvert sur 127.0.0.1:4173.

- Français / anglais et thèmes sombre / clair.
- Derniers contrôles des nouvelles fiches à 320 × 740 et 390 × 844, puis sur les vues natives de bureau 1280 × 720 et 1440 × 1000. Les contrôles initiaux incluaient aussi le format tablette.
- Aucun débordement horizontal du document ou des fiches contrôlées.
- Accueil ordinaire : CPU sélectionné, treize dossiers et absence de la bannière de stage. Le contact est centré sur les projets.
- focus=embedded : CPU et sept projets embarqués ; focus=ai : réseau 2D et six projets IA.
- Navigation masquée à la descente et rétablie à la remontée / au focus. Menu mobile, filtres, recherche, navigation entre fiches et fermeture avec Échap contrôlés.
- La visite guidée temporisée et ses éléments ont été retirés.
- CPU : pipeline affiché dans l’accueil ; fiche interactive amenée au cycle 5 (7 + 5 = 12 avec forwarding), puis au résultat final en mémoire et dans a2.
- Robot : observations sur plusieurs phases de prise et de dépôt ; rendu WebGL avec tampon de profondeur actif. Les trois dépôts et les contacts géométriques sont contrôlés par les tests.
- Réseau de neurones : vue 2D, calculs réels et pause ; atelier reconnaissant les exemples 0, 2 et 7, effacement et saisie à la souris contrôlés.
- STM32 : une séquence d’interruption bascule la LED une fois, acquitte les drapeaux et revient au programme principal.
- FPGA : un pixel cyan modifié en mémoire traverse le modèle Avalon / FIFO et apparaît à l’écran ; les états waitrequest et readdatavalid sont distingués.
- Rapport RISC-V et poster Q-learning téléchargés depuis leurs liens. Archive de code et libellé de téléchargement vérifiés.
- Audit DOM final de l’accueil : un h1, aucun identifiant dupliqué et aucun bouton vide non étiqueté.
- Aucun nouveau message JavaScript d’erreur ou d’avertissement observé pendant les derniers contrôles.

## Mise à jour contribution et portrait

- Contribution Emerton ajoutée en français et en anglais, avec résultat de −30 % confirmé directement par Victor. Les détails du projet et les documents internes restent exclus.
- Catalogue de treize dossiers ; OptiFrame reste immédiatement avant la fiche des réseaux de neurones. La nouvelle fiche est aussi accessible depuis le parcours Emerton.
- Nouveau portrait personnel fourni par Victor, remplaçant le premier à sa demande. Cadrage CSS sur le visage et le buste avec les chutes visibles, chargement à la demande et aucune donnée GPS EXIF.
- Fiche Emerton et portrait inspectés sur ordinateur 1280 × 720 et mobile 390 × 844 : pas de débordement horizontal observé. Traduction, lien du CV anglais et fermeture du dialogue contrôlés.
- Les tests HTTP incluent le portrait en JPEG et vérifient que le CV français retiré répond 404. Le serveur local prend maintenant en charge le type MIME JPEG.
- Archive de publication contrôlée : fichiers statiques seulement, portrait et CV anglais présents, aucun support interne, aucun CV français. Script distant passé par bash -n.
- Mise à jour publiée le 4 novembre 2026 par le lanceur SSH après accord explicite de Victor pour remplacer l’ancienne session. Archive outputs/deploy-Q6d5AB/portfolio.tar.gz, source ee14f39.
- Le lanceur a terminé avec le code 0 après les contrôles, les 31 tests et le build. Les 14 fichiers de la version ont été vérifiés sur disque ; les 13 fichiers publics ont été comparés en HTTPS par SHA-256. Le CV français retiré est absent du dossier public et répond 404/410, avec sauvegarde hors du dossier web.
- Contrôle public dans le navigateur : nouveau portrait correctement cadré dans « À propos », fiche Emerton à −30 %, site en français et aucun message JavaScript d’erreur ou d’avertissement. La session SSH de publication s’est terminée ; aucun mot de passe n’a été enregistré.

## Captures

- docs/preview.jpg : aperçu de l’accueil construit avec le CPU.
- outputs/desktop.jpg, outputs/mobile.jpg, outputs/robot-stack.jpg et outputs/about-nouvelle-photo.jpg et outputs/portrait-publie.jpg : captures locales ignorées par Git.
- outputs/riscv-design.png et outputs/poster-q-learning.png : rendus de lecture des documents de projets.
- outputs/CV_FR.png et outputs/CV_EN.png : rendus des CV existants.
- outputs/deployment-2026-11-04-T6cMbW/portfolio-publie.jpg : accueil du site public en français.

## Publication Télécom Paris

- Publication initiale effectuée le 4 novembre 2026 sur https://perso.telecom-paristech.fr/vwoelffel-23/, via SSH et la passerelle `ssh.enst.fr`.
- La page par défaut a été sauvegardée dans le dossier personnel du serveur avant remplacement. La configuration et les droits d’accès d’Apache sont conservés.
- Lors de la publication initiale, les 13 fichiers publics de cette version ont répondu en HTTPS avec le statut 200. Leur contenu a été comparé par SHA-256 à la version préparée, y compris les deux CV, les rapports, le ZIP et les poids du CNN.
- Le site public a été ouvert dans le navigateur. Lors de cette publication initiale, le passage français/anglais changeait aussi le lien du CV. Depuis la restriction de publication, les deux langues proposent explicitement le CV anglais. La fiche des réseaux de neurones charge son modèle et reconnaît l’exemple 7. L’accueil a ensuite été remis en français.
- L’URL canonique et les métadonnées Open Graph utilisent l’adresse publique vérifiée.
- La session SSH temporaire a été fermée proprement après publication. Aucun mot de passe n’a été enregistré.
- `Publier_Portfolio.cmd` et `npm run deploy` préparent les mises à jour. Leur mode `--dry-run` a repassé les contrôles, les 29 tests et le build, puis produit l’archive limitée à `dist/`. Le script distant généré a passé `bash -n`. Ce contrôle initial n’avait pas déclenché de publication réelle. Le lanceur a ensuite publié la mise à jour du portrait et de la contribution Emerton, décrite ci-dessus.

## Limites du contrôle

- L’ouverture file:// est interdite par le navigateur intégré ; le bundle classique a été testé sur HTTP et le lanceur Windows reste fourni.
- La réduction des mouvements est gérée sans modifier le réglage global de l’ordinateur. Les animations peuvent être arrêtées dans l’interface.
- Les vues mobiles utilisent des viewports de test ; aucun téléphone physique ni ensemble exhaustif de moteurs n’a été testé.
- Les schémas sont pédagogiques, sans exécution de firmware, HDL ou matériel connecté. Aucune précision historique du CNN ni performance physique de circuit n’est déduite de ces démonstrations.
- Aucun audit d’accessibilité ou de performance exhaustif n’est revendiqué.
- Les TP officiels fournis ont été lus ; les autres liens externes documentés n’ont pas tous été vérifiés.
- L’hébergement Télécom Paris existant est utilisé. Aucun dépôt GitHub distant n’a été créé. Le workflow CI est préparé et n’a pas été exécuté sur GitHub.
