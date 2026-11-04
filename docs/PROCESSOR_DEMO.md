# Processeur 16 bits du TP

La fiche simule le chemin décrit par l’équipe dans son [rapport de conception](../assets/Rapport_RISCV_Architecture_Processeur.pdf#page=21). Le listing occupe la page 21 et l’annexe page 33, les tables 7 à 12 donnent les formats binaires et les figures des pages 23–24 décrivent le pipeline. La figure 2 est le schéma d’origine. Le moteur `report-cpu.js` représente son comportement architectural sur un jeu d’essai. Aucune netlist exécutable du circuit 16 bits n’accompagne le rapport.

## Deux points de départ

À l’entrée en 0x00, a0 et a1 contiennent les adresses des deux sources, a2 celle de la destination et a3 le nombre d’éléments. La démonstration fournit deux tableaux [7, 3] et [5, 9] aux adresses 0x100 et 0x140. La destination commence en 0x180. Chaque mot de données occupe quatre octets. Les instructions occupent deux octets.

Avec ces pointeurs valides, les trois premiers branchements sautent les chemins d’erreur. De 0x10 à 0x1E, le programme construit le masque de signe en 32 bits et teste la taille. Le départ rapide en 0x20 reprend l’état architectural obtenu après ces tests et remplit le pipeline à partir de ce point. Les deux départs aboutissent à la même écriture et à la même décision de branchement.

En 0x28 et 0x2A, les LOAD lisent 7 et 5. En 0x2C, ADD produit 12. En 0x2E, STORE écrit 12 à l’adresse 0x180. Les trois pointeurs avancent ensuite de quatre octets. IF lit les instructions, ID décode et résout les branchements, EX calcule et accède à la mémoire de données. Les valeurs d’EX peuvent alimenter ID pendant le même cycle. Le PC affiché est l’adresse de l’instruction effectivement lue en IF.

## Lecture des ambiguïtés du listing

- En 0x1A, le rapport imprime `0b111111100` sur neuf bits et indique explicitement un retour de deux instructions vers 0x16. Le modèle étend de signe cette valeur à dix bits pour représenter −4 dans le format SB de la table 11.
- En 0x3A, le champ imprimé `1111110100` contient bien dix bits. En complément à deux il vaut −12, ce qui donne 0x2E à partir de 0x3A. Le commentaire du listing décrit un retour de 0x12 octets (−18), qui mènerait à 0x28. La simulation suit les bits et marque un point d’arrêt juste après la décision en ID. IF affiche le STORE cible, qui n’est pas exécuté une seconde fois. Il n’y a donc pas de deuxième somme affichée.
- En 0x26, v1 reçoit l’adresse de fin. En 0x28, le LOAD réutilise ce même registre, puis en 0x2C v1 reçoit la somme. Le SUB de 0x38 soustrait donc 12 de 0x104 sur ce jeu d’essai.
- Les trois `JUMP` qui suivent les contrôles initiaux ont un opérande immédiat dans le listing. La table 12 ne spécifie qu’un registre pour JUMP. Leurs mots machine restent indéfinis. Ces trois lignes ne sont pas prises pour les entrées présentées.
- Les registres logiques suivent la table 6 (r0 / zero, r15 / pc). Les champs de l’instruction suivent la table 7 (zero = 1111, pc = 0000).

Les tests vérifient les mots du listing, la boucle du masque, le transfert EX → ID, les adresses et la mémoire écrite. L’illustration animée de l’accueil conserve son petit programme d’introduction dans `processor-engine.js`. Le bouton du CPU ouvre le programme du rapport.
