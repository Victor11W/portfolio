# Publication automatique sur VM01

Le workflow `.github/workflows/verify.yml` vérifie les branches et les pull requests. Il publie sur <https://victor.woelffel.com/> uniquement après un push sur `codex/public-portfolio`, ou un lancement manuel sur cette même branche.

## Chaîne de publication

1. GitHub récupère le commit exact avec des actions officielles figées par SHA, puis utilise Node.js 24.
2. Les contrôles JavaScript, les tests du site et les tests Linux de déploiement passent avant le build.
3. `scripts/ci/package.mjs` adapte les métadonnées du HTML généré à l’URL publique. Il refuse les fichiers inattendus et les liens symboliques. L’artefact contient uniquement une archive de `dist/` et son manifeste SHA-256.
4. Le job de production récupère cet artefact et utilise le secret d’environnement `VM01_DEPLOY_KEY`.
5. Une clé SSH dédiée peut uniquement appeler le point d’entrée restreint `ops/vm01_deploy.py`. Elle ne donne ni shell interactif, ni transfert de ports, ni accès sudo. Le programme refuse les liens, traversées de chemins, fichiers cachés hors `.nojekyll`, archives excessives et écrasements de versions existantes.
6. Les fichiers sont reçus dans une nouvelle version sous `/var/www/victor.woelffel.com/releases/`. Le client compare la liste exacte, les tailles et les SHA-256 au manifeste local.
7. Le serveur prend le verrou `.deploy.lock`, revérifie la version reçue et remplace atomiquement le lien `current`. Tous les fichiers publics sont comparés en HTTPS et la redirection HTTP vers HTTPS est contrôlée.
8. En cas d’échec, le lien précédent est restauré. En cas d’interruption brutale, l’état `.deploy-pending.json` permet une récupération au prochain déploiement ou avec la commande `recover`. Une version actuelle inattendue bloque cette récupération au lieu d’être remplacée.

Les publications ne sont pas annulées lorsqu’un nouveau push arrive. GitHub conserve un travail en cours et gère les publications en attente avec sa règle de concurrence. Le verrou serveur reste commun aux opérations manuelles et à la CI. Aucune ancienne version n’est supprimée automatiquement.

## Configuration GitHub

Dans le dépôt `Victor11W/portfolio`, créer l’environnement **vm01-production** :

- Branches autorisées : branche exacte `codex/public-portfolio`, sans règle de tags.
- Secret **VM01_DEPLOY_KEY** : clé privée de la paire dédiée à GitHub Actions.
- Aucun approbateur ni délai obligatoire si la publication doit être entièrement automatique.

Les secrets ne sont disponibles que dans le job de production. Les pull requests exécutent les vérifications et produisent un artefact, sans déployer.

La clé d’hôte de VM01 est figée dans `ops/vm01_known_hosts`. Son empreinte ECDSA confirmée est `SHA256:O+EFNNbz2H0Hk8iSp0vAg9JJhRK6zzeVNwAMUXrfp0Y`. Une rotation doit être confirmée auprès de l’administrateur avant de modifier ce fichier.

## Installation serveur avec le compte personnel

Le programme serveur se met en place une fois avec l’accès personnel `victor@victor.woelffel.com`, sans sudo :

```bash
ssh victor@victor.woelffel.com 'install -d -m 700 /home/victor/.local/libexec'
scp ops/vm01_deploy.py victor@victor.woelffel.com:/home/victor/.local/libexec/portfolio-vm01-deploy.py
ssh victor@victor.woelffel.com 'chmod 700 /home/victor/.local/libexec/portfolio-vm01-deploy.py'
```

Ajouter uniquement la clé publique CI à `/home/victor/.ssh/authorized_keys`, avec cette restriction avant la clé :

```text
restrict,command="/usr/bin/python3 /home/victor/.local/libexec/portfolio-vm01-deploy.py" ssh-ed25519 <CLE_PUBLIQUE_CI> github-actions-portfolio-vm01
```

La clé personnelle reste sur le poste de Victor. La clé CI ne doit figurer ni dans le dépôt, ni dans un artefact. Le runner la reçoit du secret GitHub dans un fichier temporaire en mode 600, puis le supprime à la fin de l’étape.

Le client vérifie aussi le SHA-256 du programme installé. Un changement de `ops/vm01_deploy.py` nécessite donc une installation serveur avec le compte personnel avant l’activation de cette nouvelle révision.

## Diagnostic et récupération

Avec la clé CI, seules ces commandes sont reconnues : `status`, `upload <version> <sha256> <taille>`, `activate <version>` et `recover`. Les commandes de shell et SFTP sont refusées.

Avec le compte personnel, contrôler l’état ou récupérer une publication interrompue :

```bash
ssh victor@victor.woelffel.com 'SSH_ORIGINAL_COMMAND=status /usr/bin/python3 /home/victor/.local/libexec/portfolio-vm01-deploy.py'
ssh victor@victor.woelffel.com 'SSH_ORIGINAL_COMMAND=recover /usr/bin/python3 /home/victor/.local/libexec/portfolio-vm01-deploy.py'
```

Pour revenir après une publication réussie à la version précédente, suivre la procédure manuelle du runbook VM01 : prendre `.deploy.lock`, vérifier le chemin enregistré dans `.previous-release`, créer un lien temporaire dans la racine de ce site et le renommer sur `current`. Ne modifier ni nginx, ni les certificats, ni les autres vhosts.

Les tests de restauration emploient des répertoires temporaires et des réponses HTTP simulées. Ils couvrent notamment un contenu HTTPS incorrect, une mauvaise redirection, une panne réseau, une interruption après bascule, la récupération d’une transaction inachevée et le verrou entre deux éditeurs. Le statut d’une exécution GitHub réussie reste nécessaire pour confirmer la chaîne depuis un runner hébergé.

## Mise à jour du portfolio

Publier les modifications voulues sur la seule branche publique `codex/public-portfolio`. La CI publie le commit reçu et indique les versions active et précédente dans le résumé du job. L’ancien lanceur destiné à Télécom n’est pas utilisé par cette chaîne.
