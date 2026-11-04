# Démonstration du processeur

Modèle pédagogique ajouté au portfolio le 4 novembre 2026 à partir du rapport TP1 fourni par Victor, pages 16–24. Il ne s’agit pas d’une émulation exhaustive ni d’une preuve de fonctionnement du matériel physique.

- ISA personnalisée, instructions encodées sur 16 bits, PC + 2. Ne pas la confondre avec la partie d’étude RISC-V du rapport.
- Alias logiques selon la page 16 : r0 / zero, r1 / a0, r2 / a1, r3 / a2, r5 / v1, r15 / pc. Les champs binaires suivent la table 7 de la page 17 : zero = 1111, a0 = 1110, etc. Les indices logiques et codes de champs sont donc présentés séparément.
- Encodages MOVI, arithmétique et LOAD / STORE issus des tables 8–10. Pour STORE, le champ final désigne la base, et le champ précédent le registre de donnée.
- Programme de présentation : charger 7 et 5, additionner vers v1, écrire dans mémoire[0], relire vers a2. Mots : 0x807e, 0x805d, 0x0dea, 0x60af, 0x40fc.
- Les cinq instructions se recouvrent dans IF, ID et EX, puis le pipeline se vide. Le résultat final vaut 12.
- L’écriture EX peut alimenter le décodage dépendant du même cycle dans le modèle. Le forwarding est affiché pour les dépendances de a1 puis de v1. Il s’agit d’un séquencement pédagogique, sans délais électriques, prédiction de branchement ou preuve de timing.
- La mémoire de données est dans EX. Il n’y a pas d’étage MEM ou WB séparé dans cette vue.
- Les exemples restent de petits entiers ; le simulateur ne tranche pas la largeur générale des données du design. Les branchements, CALL, exceptions et mémoires à latence variable ne sont pas implémentés.

Les tests vérifient les mots d’instruction attendus, les champs, le PC, l’immuabilité de zero, le forwarding et le résultat final en registres et mémoire. Le même moteur alimente le pipeline de l’accueil et la fiche détaillée.
