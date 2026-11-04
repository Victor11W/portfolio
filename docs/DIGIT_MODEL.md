# Démonstration locale de reconnaissance de chiffres

Adaptation du portfolio : 4 novembre 2026.

## Origine

Victor a fourni son dossier création_IA pour enrichir cette fiche. Les scripts de chiffres, le README et les poids ont été lus sans lancer l’entraînement ni modifier le dossier original.

- Prototype NumPy : reconnaissance_chiffre.py, architecture 784 → 32 → 32 → 10. Les dérivées écrites à la main sont exploratoires, sans validation de la rétropropagation.
- CNN PyTorch : reco_chiffre2.py, deux convolutions 3 × 3 (1 → 32 puis 32 → 64), ReLU et max-pooling 2 × 2 à chaque étape. Aplatissement 64 × 5 × 5, couche dense 128, sortie 10. Adam et CrossEntropyLoss dans le script d’entraînement.
- Checkpoint : mnist_cnn.pth, 225 034 paramètres. SHA-256 : 73cb1e6ac92051839d05fcfeb43d5edffd9375ca6b4229f63e3b955ffdad9a84.
- L’archive de téléchargement conserve les trois scripts de chiffres, le README, les dépendances et le checkpoint sans modification. Le dataset MNIST n’est pas distribué.

L’expérimentation de classification d’images de visages reste une mention de contexte. Aucune photo de visage, aucun dataset associé et aucun modèle de ce volet n’est embarqué.

## Adaptation web

Le modèle est chargé au moment d’ouvrir ce projet, depuis assets/digit-model.js. Aucun téléchargement de poids n’est demandé pour parcourir le reste du portfolio. Le script fournit des octets float32 little-endian ; l’export n’exécute pas de pickle et refuse une métadonnée de checkpoint inconnue. Aucun framework de machine learning n’est nécessaire à l’exécution web.

La version JavaScript conserve l’architecture et les poids. Le prétraitement du dessin est ajouté pour cette présentation : cadrage de l’encre dans un carré de 20 pixels, placement dans une grille 28 × 28, centrage du barycentre et normalisation vers [-1, 1]. Ce n’est pas une reproduction à l’identique du prétraitement de l’interface Pygame originale. Le pipeline d’entraînement original passe des tenseurs float à ToPILImage ; sa conversion n’est pas recopiée dans la démo.

Les quatre cartes affichées sont les canaux 0, 8, 16 et 24 de la première étape convolution / ReLU / max-pooling. Leur intensité est normalisée par carte pour la lisibilité. Elles représentent des activations calculées, et non des explications causales du classement.

Les trois scores sont un softmax des dix logits. Ils ne constituent ni une probabilité calibrée ni un taux de réussite de test. Les exemples 0, 2 et 7 sont des tracés vectoriels créés pour la présentation, sans images du dataset intégrées au site.

## Vérification

- Une référence indépendante en NumPy calcule les convolutions, pooling et couches denses de deux entrées synthétiques (rampe et sept).
- Les tests Node comparent les dix logits JavaScript à cette référence avec une tolérance absolue de 0,0001 et vérifient la normalisation des scores.
- Les dimensions du modèle, les entrées invalides, le dessin vide et le centrage des traits sont contrôlés.
- Un contrôle exploratoire sur 50 exemples du fichier MNIST fourni a servi uniquement à détecter des poids inutilisables. Cet échantillon n’est pas un jeu de test indépendant ; aucun score de précision n’est publié à partir de ce contrôle.

Pour réexporter le checkpoint connu, avec Python standard :

~~~sh
python scripts/export-digit-model.py <chemin-vers-mnist_cnn.pth> assets/digit-model.js
~~~

L’inférence et les tests Node sont sans dépendance npm. La régénération de la référence numérique utilise NumPy ; elle n’est pas nécessaire à l’ouverture du site.

## Vue du réseau dans l’accueil

La vue 2D utilise les mêmes poids et les mêmes trois tracés synthétiques que l’atelier. Elle représente six canaux de la première convolution, six de la seconde, huit neurones denses et les dix sorties. Les canaux sont résumés par la moyenne absolue de leurs activations ; les intensités sont normalisées par couche. Les liaisons reflètent des poids regroupés, et les points en mouvement illustrent le passage entre couches. Les réponses proviennent réellement du CNN ; le schéma ne représente pas ses 225 034 paramètres un par un.

La référence synthétique se régénère avec :

~~~sh
python scripts/verify-digit-reference.py <chemin-vers-mnist_cnn.pth>
~~~
