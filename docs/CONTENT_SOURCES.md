# Sources du contenu

État au 2026-11-04, fuseau Europe/Paris.

## Références factuelles

- `profil/bdd_fr.md` et `profil/bdd_en.md` du dépôt personnel CVs : identité, coordonnées, études, expériences, projets, compétences et intérêts.
- Le dépôt Git existant confirme le compte GitHub Victor11W via son URL distante. L’URL du projet OptiFrame est également renseignée dans les deux bases.
- Aucun contenu LinkedIn n’a été extrait : la page n’était pas accessible par l’outil de lecture. Le site n’utilise aucune photo ni image issue de LinkedIn.
- Les deux sites de référence ont été consultés pour la direction visuelle. Aucun code, texte de présentation ou image n’en a été copié.

## Correspondance des dossiers

| ID | Source personnelle |
| --- | --- |
| optiframe | §6.11, réalisation en équipe, hackathon CodeML, octobre 2026 |
| b-reality | §4.2, stage Capgemini Engineering et publication IEEE |
| processor | §6.1 et rapport TP1 fourni, décembre 2024, encodage personnalisé 16 bits |
| stm32-c | §6.2 |
| stm32-rust | §6.3 |
| emerton-optimization | §4.1, contribution personnelle et résultat de −30 % confirmés directement par Victor le 4 novembre 2026 |
| fpga | §6.4 |
| alarm | §6.5 |
| q-learning | §6.6 et poster PROJ104 AIstrat2, Chartichaud / PettingZoo |
| neural-networks | §6.7 et code local fourni, prototype NumPy, CNN MNIST et expérimentation de classification d’images |
| whatsapp | §6.8 |
| robot-simulator | §6.9 |
| raspberry-car | §6.10 |

Le catalogue compte treize dossiers : onze entrées de projets de la base, une fiche de recherche professionnelle et une fiche limitée à la contribution de Victor en optimisation chez Emerton Data. L’entrée réseaux de neurones regroupe deux réalisations. Ce décompte ne désigne pas treize projets indépendants attribués à Victor seul.

## Limites préservées

- Pas de niveau avancé revendiqué en C.
- OptiFrame reste une réalisation d’équipe. Aucun classement ni prix n’est mentionné.
- Aucun chiffre de précision métrologique OptiFrame n’est repris ; les essais préliminaires du README n’ont pas été vérifiés indépendamment.
- Les architectures RISC-V étudiées et le processeur à encodage d’instructions personnalisé 16 bits ne sont pas confondus.
- Le Q-learning n’est pas présenté comme un agent fondé sur un LLM.
- Aucun résultat chiffré inventé pour les projets académiques.
- Le résultat EEG est donné comme allant jusqu’à environ 95 %, avec une inférence sous 10 ms par cycle dans le contexte expérimental documenté.
- Les dates de Capgemini suivent les informations générales concordantes des deux bases : septembre 2025 à février 2026.
- Les courbes, circuits, trajectoires et volumes sont des illustrations de principe. Ce ne sont pas des captures de logiciels, des mesures ni des rendus de matériel réellement fabriqué.
- L’anglais est indiqué B2.2 et le français natif/C2.

## CV téléchargeable

Le PDF anglais est une copie exacte du document existant `candidatures/Huawei/CV_Huawei_Adaptive_CPU_Memory_8379765_EN.pdf`, dérivé de `templates/Template.tex`. Il a repassé le validateur du dépôt lors de son intégration initiale : une page A4, avec rendu inspecté. Il s’agit d’une sélection préparée auparavant pour un poste lié à l’architecture matérielle, pas d’un nouveau CV générique.

La copie publique française a été retirée le 4 novembre 2026 pour respecter la restriction de publication précisée par Victor. Son original privé est conservé. Les deux langues du site proposent explicitement le PDF anglais. Le déploiement retire aussi l’ancienne copie française du dossier web, avec sauvegarde hors de l’espace public.

Un essai antérieur de génération de CV génériques n’avait pas passé la compilation MiKTeX. Aucun PDF issu de cet essai n’est livré ; ses brouillons restent hors du portfolio. Aucun CV n’a été régénéré pour cette mise à jour.

## Liens externes

Les URL LinkedIn, GitHub/OptiFrame, démo et DOI proviennent des données documentées. Leur disponibilité publique n’a pas pu être confirmée par l’outil web utilisé pendant la session. Aucun accès public au code OptiFrame n’est affirmé. Un contrôle dans le compte habituel de Victor sera utile avant publication.

## Données locales

Aucune base de candidatures, offre d’emploi, conversation WhatsApp ou donnée de santé n’est incluse dans le portfolio. Le CV téléchargeable comporte les coordonnées professionnelles fournies par Victor. Seuls les fichiers statiques de dist/ sont destinés à l’hébergement autorisé.

## Scènes 3D de l’introduction

Deux scènes originales remplacent les volumes abstraits. La scène matérielle est un schéma générique de processeur sur une carte, avec 32 broches dans le modèle illustratif. Elle ne représente pas un processeur physiquement fabriqué par Victor.

La seconde scène représente un bras robotisé avec deux segments rigides, trois articulations et une pince qui s’ouvre. La cinématique inverse détermine les angles pour saisir et déposer les cubes ; les positions des articulations sont ensuite calculées à partir de ces angles. Les longueurs des segments restent constantes. La pince, le support et les cubes ne s’interpénètrent pas dans le cycle contrôlé par les tests. Il s’agit d’une illustration du domaine de la robotique, sans revendication de réalisation matérielle de ce bras dans le CV.

La géométrie est définie dans scene-models.js et projetée en perspective dans scene.js. Les fichiers OBJ et MTL de design/ sont générés par scripts/export-scene-models.mjs. Aucun modèle 3D tiers n’est intégré.

Des ressources CC0 ont été consultées pour préparer la direction, dont [les processeurs de Wenrexa sur OpenGameArt](https://opengameart.org/content/free-3d-models-cpu) et [le processeur de Grab3D](https://grab3d.com/models/electronics/cpu/).

## Documents de projets fournis par Victor

- **Rapport RISC-V** : copie exacte de « TP1 (6).pdf », 33 pages. Rapport de décembre 2024, cosigné par Victor Woelffel, Antoine Heitzmann et Dieudonné Lissom. Python, désassemblage RISC-V, comparaison C / GNU et pipeline RISC-V à cinq étages ; conception distincte d’une ISA à instructions de 16 bits et d’un schéma à trois étages. Le rapport ne prouve pas la fabrication d’un processeur. Les contributions sont présentées collectivement.
- **Poster Q-learning** : copie exacte de « Daniel fait joujou (3).pdf », une page A1, « IA pour jeu de stratégie (AIstrat2) », PROJ104. Auteurs : Benjamin Dupuis, Daniel Hua, Giuseppe Spriano, Laura Kubler, Paul Moreau et Victor Woelffel ; encadrement Nils Holzenberger. Chartichaud, PettingZoo, Python, PyTorch et Gym. La courbe du poster concerne Pong. L’état d’avancement ne démontre aucun taux de victoire final sur Chartichaud.

Ces deux documents sont accessibles par des liens de téléchargement dans les fiches correspondantes. Leur mise à disposition locale a été demandée par Victor. Les bases française et anglaise ont reçu les mêmes précisions factuelles.

## Code du projet de réseaux de neurones

Le dossier création_IA a été fourni par Victor pour cette fiche uniquement. L’inspection des sources a confirmé un prototype NumPy de chiffres, un CNN PyTorch MNIST, ses poids sauvegardés et une interface Pygame. Une autre expérimentation de classification d’images de visages est mentionnée dans le contexte ; ses images, ses données et son modèle ne sont pas intégrés.

Le CNN de chiffres a été adapté pour l’inférence locale du portfolio le 4 novembre 2026. Cette adaptation ne doit pas être attribuée rétrospectivement au projet original. Le code de chiffres téléchargeable est copié sans modification, avec des notes sur ses limites et sans le dataset MNIST. La documentation du README original indique MIT pour ce projet ; le portfolio ne modifie pas cette déclaration et n’accorde pas de nouvelle licence générale.

Voir DIGIT_MODEL.md pour la provenance exacte des poids et les vérifications. Aucun score de précision historique, date de réalisation ou validation de la rétropropagation NumPy n’est inventé.

## Supports de TP identifiés par Victor

- STM32 : [support 4SE03](https://4se03.telecom-paris.fr/tp/) et [chapitre GPIO+IRQ](https://4se03.telecom-paris.fr/tp/irq/gpio.html). La visualisation reprend le trajet B2 / PC13 → EXTI13 → NVIC → handler → LED, sous forme d’un modèle logique ralenti.
- FPGA : [chapitre fourni par Victor](https://hdl.telecom-paris.fr/4se04/ctrl_video_chap0/#1-premiere-modification-du-code-de-top), [mémoire d’image et FIFO](https://hdl.telecom-paris.fr/4se04/ctrl_video_chap2/) et [partage Avalon](https://hdl.telecom-paris.fr/4se04/ctrl_video_chap3/). Le modèle montre une lecture unitaire, l’attente de la requête, la réponse puis le passage vers l’affichage. La grille 4 × 4 et les quatre cases de FIFO sont des choix pédagogiques propres au portfolio.

Ces supports expliquent les mécanismes illustrés. Ils ne suffisent pas à attribuer à Victor toutes les étapes ou fonctionnalités du cours ; les descriptions de ses réalisations restent celles des bases personnelles. Les mêmes références ont été consignées en français et en anglais.

## Pipeline interactif du processeur

Le programme ajouté au portfolio est un exemple pédagogique, distinct du programme complet du rapport. Il utilise MOVI, ADD, STORE et LOAD, avec un pipeline IF / ID / EX, une mémoire de données traitée dans EX et un PC incrémenté de deux octets. Les alias logiques suivent la page 16 ; les codes de registres binaires suivent la table 7, page 17. Les branchements et CALL ne sont pas simulés. Voir PROCESSOR_DEMO.md.

## Objectif de présentation

À la demande de Victor, le site est désormais centré sur la conservation et la présentation des projets. La bannière de recherche de stage et cette recherche dans le contact ont été retirées. Cela ne modifie pas les faits d’emploi ou de disponibilité de la base privée. L’accueil ouvre le CPU ; les paramètres focus=embedded et focus=ai choisissent seulement la première visualisation et le filtre initial.

## Contribution Emerton et confidentialité

Victor a confirmé personnellement le 4 novembre 2026 une réduction de 30 % du temps de calcul grâce à ses simplifications et optimisations. La fiche présente uniquement cette contribution : formulation, contraintes, coût de résolution. L’illustration est un schéma abstrait original ; elle ne révèle pas l’architecture réelle du système.

Le nom, le contexte, le domaine d’application et le fonctionnement du projet sous-jacent ne sont pas publiés. Aucun support interne n’est copié, lié ou inclus dans le build. Les trois missions du stage restent distinctes : analyse de données, agents IA pour des protocoles techniques, optimisation mathématique.

## Portrait

Photographie personnelle fournie directement par Victor le 4 novembre 2026, utilisée avec son accord dans « À propos ». Elle remplace le premier portrait à sa demande. Le fichier JPEG d’origine (1600 × 1200, environ 217 ko) est conservé sans retouche ; le cadrage CSS resserre la vue sur le visage et le buste tout en gardant les chutes en arrière-plan. L’image ne comporte pas de position GPS dans ses données EXIF. Aucun portrait provenant de LinkedIn n’est utilisé.
