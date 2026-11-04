# Comparaison de la proposition — 4 novembre 2026

Cette revue compare les évolutions à la référence `76c1d99` sur `codex/public-portfolio`. La version validée `bb85872`, conservée sur `codex/portfolio-review`, a ensuite été publiée manuellement sur VM01, à l’adresse https://victor.woelffel.com/. GitHub Actions vérifie et construit le site, sans le déployer.

## Parcours de lecture

- **Accueil :** faire défiler jusqu’aux projets. La navigation reste au début du document. Sur un écran de 390 px, le menu déplié repousse le titre sous ses liens.
- **CPU.** Ouvrir la fiche du processeur pour suivre le programme de l’équipe et consulter les instructions dans le rapport.
- **Neurones.** Dessiner un chiffre ou choisir un exemple pour examiner l’entrée, les cartes d’activation et les trois premiers scores du CNN. Le code NumPy et PyTorch se télécharge depuis la fiche.
- **OptiFrame :** la figure imprimable est un export sur des contours de démonstration. Le lecteur peut vérifier l’échelle avec le repère de 10 mm.
- **Q-learning.** Ouvrir la fiche de Chartichaud, retrouver le travail de l’équipe sur PettingZoo et télécharger son poster.
- **Emerton :** le graphique traduit la réduction de temps de 30 % en indice 100 → 70. Il ne publie ni temps absolu, ni données métier.

## Mesures de la première proposition (commit `d5fb883`)

| Mesure | Référence | Proposition |
| --- | ---: | ---: |
| Entrée : HTML, JS initial, CSS initial, préférences, favicon | 225 769 octets | 180 745 octets |
| Mêmes fichiers, estimation gzip par fichier | 69 138 octets | 57 601 octets |

Pour reproduire ces valeurs sur la révision mesurée, exécuter `npm run build` puis `node scripts/verify-build.mjs`. Seules les ressources du premier affichage entrent dans ce calcul. La compression réelle dépend du serveur. Le build contrôle la présence des pièces et impose un plafond de 68 Kio gzip pour cette entrée.

Un essai local a comparé le même mouvement du robot en WebGL sur une surface de **340 × 490 px**, avec un pointeur tactile simulé. Après chauffe, pendant 2,7 s par version, le navigateur a dessiné **162 images** sur la référence et **81** sur la proposition : la cadence tactile est désormais plafonnée à 30 images/s. Le temps médian dans le callback de dessin est passé de **5,9 à 2,5 ms**, et le 95ᵉ percentile de **9,7 à 3,9 ms**. Aucune image n’a été dessinée durant les 400 ms où une fiche recouvrait la nouvelle scène. Cet essai mesure le travail côté JavaScript dans ce navigateur ; il ne mesure ni les performances d’un téléphone physique ni la consommation de sa batterie.

Sur cette révision, les essais en HTTP local ont couvert les vues ordinateur et mobile, les deux langues et thèmes, la navigation au clavier, le retour du focus après Échap, les liens directs et l’atelier de dessin du CNN.

## Ajustements après la revue de Victor

Le bandeau dans le flux est conservé. Les fiches neurones et Q-learning retrouvent leur contenu et leur présentation précédents. Le portrait a été retiré des sources, du build et de l’hébergement public sur VM01.

La fiche CPU utilise la figure 2 originale et le listing 16 bits du rapport. Elle permet de partir de 0x20 (15 cycles) ou de l’entrée en 0x00 (94 cycles). Les entrées mémoire sont un jeu d’essai. La lecture s’arrête au branchement de 0x3A et affiche sa destination calculée en 0x2E. Les conventions d’interprétation sont décrites dans [PROCESSOR_DEMO.md](PROCESSOR_DEMO.md).

Les 34 tests passent. Les essais locaux ont vérifié les deux parcours, l’écriture de 12 en mémoire, les zooms du schéma, le clavier, les deux langues, la disposition mobile et la prédiction du chiffre 7 dans l’atelier restauré. Le poster de Chartichaud reste accessible dans sa fiche.

## Publication validée sur VM01

La révision `bb85872753eeea30907c713b0e235e88de8493a1` de `codex/portfolio-review` a été publiée le 4 novembre 2026 sur https://victor.woelffel.com/ via `victor@victor.woelffel.com`.

- Version active : `/var/www/victor.woelffel.com/releases/bb85872753eeea30907c713b0e235e88de8493a1-20261104T225003Z`.
- Version précédente, conservée pour le retour arrière : `/var/www/victor.woelffel.com/releases/76c1d99b77a3c009eebf8d915d4fbdba9f707296-20261104T174517Z`.
- Les sommes SHA-256 des 17 fichiers transférés concordent avec le build préparé. Les 16 ressources publiques ont été vérifiées en HTTPS.
- Les anciennes URL du portrait et du CV français répondent 404 ou 410. La redirection HTTP vers HTTPS répond 301.

Le runbook opérationnel reste hors de ce dépôt public, dans `operations/portfolio/runbook-vm01.md` du workspace CVs. Les anciens lanceurs ciblant Télécom Paris ne doivent pas être utilisés pour ce domaine.
