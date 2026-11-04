# Processeur 16 bits du TP

La fiche simule le chemin décrit par l’équipe dans son [rapport de conception](../assets/Rapport_RISCV_Architecture_Processeur.pdf#page=21). Le listing occupe la page 21 et l’annexe page 33, les tables 7 à 12 donnent les formats binaires et les figures des pages 23–24 décrivent le pipeline. La figure 2 est le schéma d’origine. Le moteur `report-cpu.js` représente son comportement architectural sur un jeu d’essai. Aucune netlist exécutable du circuit 16 bits n’accompagne le rapport.

Le module `processor-diagram.js` redessine la figure 2 en SVG dans le style sombre du site. Il conserve les multiplexeurs, le comparateur, les signaux de contrôle et les retours de données. Les valeurs et les chemins actifs proviennent du moteur ; les traits pleins représentent les données, les pointillés les contrôles, et le retour EX → ID distingue le forwarding. Les zooms par étage et le défilement horizontal permettent de lire le schéma sur un petit écran. Les opérandes affichés côté EX sont ceux capturés pour l’instruction en exécution ; ils peuvent différer des valeurs lues en ID pendant ce même cycle.

## Deux points de départ

À l’entrée en 0x00, a0 et a1 contiennent les adresses des deux sources, a2 celle de la destination et a3 le nombre d’éléments. La démonstration fournit deux tableaux [7, 3] et [5, 9] aux adresses 0x100 et 0x140. La destination commence en 0x180. Chaque mot de données occupe quatre octets. Les instructions occupent deux octets.

Avec ces pointeurs valides, les trois premiers branchements sautent les chemins d’erreur. De 0x10 à 0x1E, le programme construit le masque de signe en 32 bits et teste la taille. Le départ rapide en 0x20 reprend l’état architectural obtenu après ces tests et remplit le pipeline à partir de ce point. Les deux départs aboutissent à la même écriture et à la même décision de branchement.

En 0x28 et 0x2A, les LOAD lisent 7 et 5. En 0x2C, ADD produit 12. En 0x2E, STORE écrit 12 à l’adresse 0x180. Les trois pointeurs avancent ensuite de quatre octets. IF lit les instructions, ID décode et résout les branchements, EX calcule et accède à la mémoire de données. Les valeurs d’EX peuvent alimenter ID pendant le même cycle. Le PC affiché est l’adresse de l’instruction effectivement lue en IF.

## Mode du rapport et variante pour observer les aléas

Le mode par défaut conserve la convention du rapport, page 24. Le forwarding transmet directement une valeur disponible en EX vers ID. Un branchement pris redirige IF pendant le même cycle. Le rapport explique explicitement que cette organisation n’a pas besoin de flush. Il mentionne les stalls comme une solution possible à des conflits structurels, sans définir de scénario ni de circuit de stall réalisé. Il serait donc incorrect de présenter un flush ou une attente mémoire comme des caractéristiques déjà implémentées dans le projet.

La variante pédagogique « aléas » conserve exactement les instructions, les entrées mémoire et le résultat du rapport, mais ajoute deux hypothèses de fonctionnement indiquées dans l’interface :

- **Stall de ressource.** La mémoire de données est indisponible pendant un cycle juste avant que le LOAD de 0x2A entre dans EX. Le PC, l’instruction en IF et le registre IF/ID restent figés. EX reçoit une bulle, sans écriture de registre ni de mémoire. Dès le cycle suivant, le LOAD s’exécute normalement. Cette attente représente une disponibilité de ressource simulée ; ce n’est pas une latence mesurée du circuit du rapport.
- **Lecture séquentielle anticipée et flush.** IF a lu l’instruction suivante avant de connaître la décision de branchement prise en ID. Si la destination diffère de cette lecture séquentielle, l’instruction anticipée est annulée avant ID et IF reste vide pour ce cycle. La cible est lue au cycle suivant. Cette hypothèse ajoute un créneau de remplissage par branchement pris. Elle sert à expliquer le flush, contrairement à la convention du rapport qui évite cette anticipation.

Dans le départ court, le cycle 8 montre le stall. Au cycle 9, le LOAD donne `v4 = 5`, transmis par forwarding à l’ADD en ID. Cet ADD consomme effectivement 7 et 5 au cycle 10, puis transmet 12 au STORE. Au cycle 16, BNEZ annule l’instruction anticipée en 0x3C (`ADD v1, lr, zero`) et choisit 0x2E. Au cycle 17, la cible apparaît en IF, puis la lecture s’arrête : ce STORE n’est toujours pas exécuté une seconde fois. L’instruction annulée n’atteint ni ID ni EX et ne peut donc pas remettre v1 à zéro.

Le mode du rapport prend 15 cycles depuis 0x20 et 94 depuis 0x00. La variante prend respectivement 17 et 121 cycles : un cycle de stall, plus un cycle par flush (un depuis 0x20, vingt-six depuis 0x00). Les séquences d’effets architecturaux et de décisions de branchement sont identiques entre les deux modes. Ces comptes décrivent les conventions de cette visualisation, pas des mesures de performances du processeur réalisé.

## Lecture des ambiguïtés du listing

- En 0x1A, le rapport imprime `0b111111100` sur neuf bits et indique explicitement un retour de deux instructions vers 0x16. Le modèle étend de signe cette valeur à dix bits pour représenter −4 dans le format SB de la table 11.
- En 0x3A, le champ imprimé `1111110100` contient bien dix bits. En complément à deux il vaut −12, ce qui donne 0x2E à partir de 0x3A. Le commentaire du listing décrit un retour de 0x12 octets (−18), qui mènerait à 0x28. La simulation suit les bits et marque un point d’arrêt juste après la décision en ID. IF affiche le STORE cible, qui n’est pas exécuté une seconde fois. Il n’y a donc pas de deuxième somme affichée.
- En 0x26, v1 reçoit l’adresse de fin. En 0x28, le LOAD réutilise ce même registre, puis en 0x2C v1 reçoit la somme. Le SUB de 0x38 soustrait donc 12 de 0x104 sur ce jeu d’essai.
- Les trois `JUMP` qui suivent les contrôles initiaux ont un opérande immédiat dans le listing. La table 12 ne spécifie qu’un registre pour JUMP. Leurs mots machine restent indéfinis. Ces trois lignes ne sont pas prises pour les entrées présentées.
- Les registres logiques suivent la table 6 (r0 / zero, r15 / pc). Les champs de l’instruction suivent la table 7 (zero = 1111, pc = 0000).

Les tests vérifient les mots du listing, la boucle du masque, le transfert EX → ID, les adresses et la mémoire écrite. Dans la variante, ils vérifient aussi le gel de PC/IF/ID, la bulle EX sans effet, la reprise du LOAD, la consommation de sa valeur par l’ADD, l’absence d’exécution de l’instruction annulée et l’égalité des effets architecturaux avec le mode du rapport. Chaque étape conserve les instantanés précédents. L’illustration animée de l’accueil conserve son petit programme d’introduction dans `processor-engine.js`. Le visuel du CPU ouvre le programme du rapport.
