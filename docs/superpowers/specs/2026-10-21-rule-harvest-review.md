# Relecture des règles avant la 1.0.0

Date : 2026-10-21
Statut : document de travail, à annoter, en français parce qu'il sert à décider. Il est supprimé
une fois les règles écrites. La conception est dans
[2026-10-21-stack-design.md](2026-10-21-stack-design.md).

## Comment lire et annoter

Les règles sont extraites de Shiori d'abord (`CLAUDE.md`, `docs/ios-guide.md`,
`docs/api-evolution.md`, `renovate.json`, les onze workflows, `infra/`, `scripts/`), puis des 45
mémoires privées de Claude sur Shiori, puis de `dev-playbook`, des `CLAUDE.md` de Vinarium, Shuhari
et Bazar, du `CLAUDE.md` global de la machine, des skills `commit`, `ddd-architecture`,
`graphql-pothos`, `feature-dev-workflow` et du hook `shutdown-simulators-after-push`.

Chaque point porte un identifiant (`D-xx` décision de cadre, `R-xx` règle, `K-xx` mémoire à
reclasser). Pour annoter : répondre avec l'identifiant et la correction, par exemple « R-18 : non, on
garde les captures à chaque push ». Tout ce qui n'est pas contesté est considéré accepté.

Verdicts : **Garder** (Shiori le fait, on l'écrit tel quel), **Compléter** (Shiori le fait, une
autre source ajoute quelque chose), **Trancher** (deux sources se contredisent, décision humaine),
**Obsolète** (une source le dit, Shiori a cessé).

## D. Décisions de cadre

- **D-01 Projet de référence.** Shiori gagne les conflits, Vinarium ensuite, Shuhari et Bazar en
  dernier. `dev-playbook` disait l'inverse. **Trancher**, proposition : oui.
- **D-02 Langue.** Tout le paquet en anglais. **Garder.**
- **D-03 Nom du paquet.** `@polyforms/stack` demande une organisation npm ; `@moifort/stack` tient
  dans le scope existant. Le nom du dépôt est `polyforms-stack` dans les deux cas. **Trancher.**
- **D-04 Les formes longues sont des skills.** Les annexes de `dev-playbook` (créer un domaine,
  GraphQL, feature iOS, captures) et les skills globaux `ddd-architecture` (381 lignes) et
  `graphql-pothos` (301 lignes) disent la même chose à deux endroits avec des divergences (le skill
  cite un `events.ts` et un `server/test/` que Shiori n'a pas). Une seule source : les skills livrés
  par le paquet, copiés dans `.claude/skills/` ; les skills globaux de la machine sont supprimés.
  **Trancher**, proposition : oui.
- **D-05 Où va un retour.** Shuhari et Bazar : « une correction donnée en conversation est codifiée
  dans la doc dans la même tâche, pas de mémoire locale ». Shiori : 45 mémoires privées, invisibles
  du dépôt. Règle proposée dans `00-collaboration` : un retour **générique** va dans le paquet
  (commit, montée de version, migration si du code est touché) dans la même tâche ; un **fait** de
  projet va dans `project-context.md` ; la mémoire privée ne garde ni l'un ni l'autre. **Garder.**
- **D-06 Renovate et les majeures.** `renovate.json` de Shiori fusionne tout automatiquement,
  majeures comprises, et aucune routine planifiée ne relit les PR Renovate (seules `sentry-autofix-6h`
  et `shiori-daily-health` existent). `dev-playbook` disait « jamais une majeure seule ». La
  conception suppose une routine de revue. Deux lectures : tout en automerge et la CI est le filet,
  ou bien créer la routine et retirer l'automerge des majeures. **Trancher.**
- **D-07 Worktrees.** Bazar interdit `git worktree` ; Shiori les tolère pour construire HEAD quand
  l'arbre est sale, et l'app en crée sous `.claude/worktrees/`. Proposition : développer dans le
  checkout principal ; worktree accepté pour un build ou une capture, en copiant les fichiers ignorés
  (`Secrets.swift`, `GoogleService-Info.plist`, `Package.resolved`, code Apollo généré).
  **Trancher.**
- **D-08 Sessions parallèles.** Shiori est développé par plusieurs sessions à la fois sur un même
  checkout. Quatre mémoires n'existent que pour ça et aucune source écrite ne les porte : commit par
  pathspec explicite, jamais `git add -A` ; jamais d'amend sans relire HEAD dans la même commande ;
  re-vérifier son propre commit après ceux des autres ; ne jamais découper les hunks d'un fichier
  généré. Section « Plusieurs sessions sur un checkout » dans `02-commits`. **Garder.**

## R. Les règles, par fichier cible

### 00-collaboration

- **R-01 Réponses courtes.** Résultat et blocage en quelques lignes, pas de récapitulatif.
  **Garder.**
- **R-02 Avis critique.** Shiori, 28 septembre : revue en ingénieur infra senior, nommer les modes
  de défaillance, ne jamais céder parce que l'utilisateur insiste, changer d'avis seulement sur un
  meilleur argument et dire lequel. Grille : que se passe-t-il si un évènement est perdu, qu'est-ce
  que ça apporte au lecteur, est-ce une infrastructure pour un seul consommateur, existe-t-il un
  design moins cher ; mener avec le verdict. **Garder.**
- **R-03 Autonomie.** Exécuter un plan jusqu'au résultat final sans point d'arrêt ; les captures de
  validation sont montrées à la fin ; ne jamais demander la permission de committer. **Garder.**
- **R-04 Exécuter soi-même.** Toute ligne de commande est lancée par Claude ; seuls `sudo`, un mot
  de passe, la connexion Apple ou brancher l'iPhone sont à l'humain, et on le dit. **Garder.**
- **R-05 Jamais de subagent, jamais de plan mode.** Exploration, revue, débogage, planification
  inline. Shiori refuse `EnterPlanMode` par configuration. **Garder.**
- **R-06 Langues.** Code, commits, commentaires, docs en anglais ; seule la copy utilisateur dans la
  langue produit ; jamais deux langues dans un commit ou un commentaire ; conversation dans la langue
  de l'humain. **Garder.**
- **R-07 Design n'est pas un go.** Shuhari et Bazar : « je veux faire X » est une intention, on
  implémente sur « vas-y ». Pas écrit sur Shiori mais pratiqué (superpowers brainstorming).
  **Compléter.**

### 01-workflow

- **R-08 La chaîne.** Brainstorming quand l'intention n'est pas évidente, spec dans
  `docs/superpowers/specs/AAAA-MM-JJ-<sujet>-design.md`, plan, exécution inline sans point d'arrêt,
  vérification, revue, commit. **Garder.**
- **R-09 Contenu d'un plan.** Ouvre sur « en clair » (aujourd'hui, après, mécanismes, ce qui ne
  bouge pas, pourquoi cet ordre) ; Shuhari et Bazar ajoutent un bloc « Domaines impactés : créés,
  modifiés, supprimés ». **Compléter.**
- **R-10 Vérification avant commit.** Typecheck (`nitro prepare` d'abord si les routes ont bougé),
  les trois familles de tests lancées **séparément** (un `mock.module` fuit d'un fichier à l'autre
  sous un seul `bun test`, la CI les lance à part), linter, `schema:check` si le schéma a bougé,
  contrôle du catalogue de chaînes iOS après tout changement de texte, build iOS si l'app est
  touchée. Une affirmation de succès sans sortie de commande n'a pas de valeur. **Garder.**
- **R-11 Capture après tout changement d'interface.** La règle la plus répétée (24 et 28
  septembre, 1er octobre) : toute demande d'interface se termine par une capture envoyée, puis
  attente de validation. « Le simulateur s'arrête à la connexion » n'est jamais une excuse : la page
  reçoit ses fixtures de preview par un argument de lancement temporaire jamais committé, derived
  data propre à la session, harnais reverti avant le commit ; on commit avant validation, on
  n'installe pas sur l'iPhone avant. **Garder**, et c'est la migration la plus importante pour
  Vinarium, Shuhari et Bazar.
- **R-12 Compétences.** Ne jamais citer une compétence absente de la machine. Satisfait par
  construction : le paquet livre les siennes (D-04). **Garder.**

### 02-commits

- **R-13 Format.** Commits conventionnels, anglais, minuscule, scope déduit des chemins (domaine
  métier), trailer `Co-Authored-By`, corps pour le pourquoi. **Garder.**
- **R-14 Jamais demander.** Ni le message ni le découpage (« tu es bien meilleur que moi »).
  **Garder.**
- **R-15 Amend.** Préférer un nouveau commit ; amend seulement avec `git log -1` relu dans la même
  commande (un amend a avalé douze fichiers d'une autre session le 20 septembre). Le skill `commit`
  dit « amend si fix d'un commit existant ». **Obsolète** côté skill.
- **R-16 Branche.** Direct sur `main`, pas de PR. Shiori, Shuhari, Bazar, Vinarium. **Garder**,
  avec D-07.
- **R-17 Pousser.** Jamais de sa propre initiative. Exception nommée : une routine planifiée que
  l'humain a autorisée (triage Sentry) pousse sur `main` et vérifie la CI comme un push ordinaire.
  **Garder.**

### 03-code-review

- **R-18 Grille.** Correction, cas limites, sécurité, coût, cohérence, dette, tests, documentation,
  sur le diff relu pas sur le souvenir ; une remarque de revue se vérifie avant de s'appliquer.
  **Garder.**
- **R-19 Clôture d'une tâche.** Shuhari et Bazar : surfaces touchées (base, backend, app) puis
  taille du diff ; « un refactor qui n'ajoute que des lignes a oublié d'en retirer ». Pas pratiqué
  sur Shiori. **Trancher.**

### 04-push

- **R-20 Avant.** Linter en écriture, code généré régénéré et committé, préflight vert, fichiers
  générés exclus du linter, changelogs intouchés. **Garder.**
- **R-21 Captures à chaque push.** `dev-playbook` : « si une interface a changé, régénérer les
  captures ». Shiori ne le fait qu'à la release. **Trancher**, proposition : release seulement, le
  README n'embarque pas de capture qui vieillit.
- **R-22 Après.** Suivre **chaque** run jusqu'à la fin, Deploy compris, corriger en avant, re-suivre,
  rapporter le résultat final par workflow. Pièges : `gh run list --commit` ne renvoie rien (filtrer
  sur `headSha`) ; zsh ne découpe pas une variable non quotée dans un `for` ; `gh run view --log`
  relit un cache local après suppression des logs. **Garder.**
- **R-23 Simulateurs éteints.** Le hook éteint les simulateurs et quitte Simulator.app après un
  push réussi ; on ne les relance pas sans demande. Livré par le paquet. **Garder.**
- **R-24 Pas de CI pour la prose.** `paths-ignore` sur `site/`, `docs/`, `screenshots/`,
  `README.md`, `CLAUDE.md` pour Deploy, Schema et les tests ; `[skip ci]` pour la prose hors de ces
  chemins ; jamais `[skip ci]` sur un commit du site (Pages s'arrêterait) ; jamais les changelogs
  servis dans `paths-ignore`. **Garder.**

### 05-release

- **R-25 Ordre.** `bun run deprecations` (ce qu'un build en vente depuis deux semaines ne demande
  plus : un commit retire ces champs et relève le plancher de build, jamais à la main), notes dans
  les deux langues, note française affichée, validation, commit, push de `main` (déploie le backend
  qui sert les notes), tag `ios-v*`. **Garder.**
- **R-26 Le tag.** Dès que les notes sont validées, le tag se pose immédiatement, on ne l'attend
  pas pour une CI en panne. Jamais avant la validation (1.0 annulée le 4 octobre). **Garder.**
- **R-27 Gate de bout en bout.** `dev-playbook` conditionne la release à des scénarios de bout en
  bout. Shiori n'en a pas (pas d'émulateur Firebase sur la machine, `ShioriUITests` ne sert qu'aux
  captures). **Trancher** : stack optionnelle `e2e`, ou retirée tant qu'aucun projet ne la pratique.
- **R-28 Versionnement.** Version commerciale manuelle, numéro de build dérivé du run, jamais à la
  main ; la clé de comparaison du plancher est le build entier. **Garder.**

### 06-changelog

- **R-29 Deux fichiers.** Anglais source, français traduction, en lockstep ; en-tête
  `## 1.0 (2026.10.01)` ; écrits à la release seulement, jamais de section `Unreleased`, pas même en
  attente. **Garder.**
- **R-30 Quoi écrire.** Le conséquent, vu du lecteur ; une correction est une phrase courte sans
  cause, fréquence, modèle ni API ; jamais le nom de l'app ; jamais de ligne sur les langues
  disponibles. **Garder.**

### 07-appstore

- **R-31 Toolchain et signing.** Dernier Xcode final, jamais beta ni dépassé ; signing manuel ;
  date d'expiration du certificat dans le contexte projet ; empreinte de machine beta corrigée dans
  l'archive. **Garder.**
- **R-32 Captures et panneaux.** Produits localement et committés, la CI téléverse ce que le dépôt
  contient ; fixtures de vitrine dans l'app (`-showcase`, Debug seulement) plutôt qu'un serveur semé
  ; panneaux envoyés avant la soumission ; un panneau par image générée ; l'interface, les légendes
  et l'appareil ne passent jamais par le modèle d'image ; décors en cache et committés ; `simctl
  addmedia` bloque tant que Photos n'a pas été lancé ; en-tête 16:9 hors du dossier des panneaux ;
  couvertures par l'API iTunes Search. **Garder.**
- **R-33 TestFlight.** Groupe interne « Nightly » qui reçoit tout, groupe externe « Public » ; le
  job de notes ajoute chaque build au public et le soumet à la Beta App Review ; un testeur existant
  d'un autre groupe se crée avec la relation de groupe, pas par ajout. **Garder.**
- **R-34 Ce que la release ne fait pas.** Prix de l'app et réponses de confidentialité sans API,
  saisis une fois dans le navigateur ; un nom anglais déjà pris renvoie 409, prévoir un nom composé
  ; mots-clés plafonnés à 100 caractères ; la première soumission d'un abonnement doit partir avec
  une version et seule la séquence page du groupe puis page de chaque abonnement fonctionne (douze
  jours perdus). Skill `appstore`. **Garder.**
- **R-35 Fiche dans le dépôt.** Métadonnées, traductions et réponses de confidentialité dans
  `infra/fastlane/metadata/`, poussées par script ; site, politique de confidentialité et changelog
  servis depuis `site/` par Pages. **Garder.**

### 08-copy

- **R-36 Ton.** Impersonnel, mots exacts de l'interface, exemples, jamais de tiret cadratin ni
  demi-cadratin, pas de remplissage. **Garder.**
- **R-37 Modèle de localisation iOS.** Chaînes écrites en français dans le code et clés du
  catalogue (`sourceLanguage: fr`) ; langue de développement anglais, repli de tout iPhone non
  francophone ; chaque clé a une unité `fr` explicite sinon un iPhone français affiche l'anglais ;
  `check-strings.ts --write` après tout changement de texte, CI sans `--write` ; `Accept-Language`
  envoie la langue de l'app. Script livré par le paquet. **Garder.**
- **R-38 Une seule liste de langues** partagée client et serveur ; le cache d'un service tiers est
  indexé par langue. **Garder.**

### 09-backend

- **R-39 Architecture.** Un dossier par domaine (`types`, `primitives`, `command`, `query`,
  `business-rules`, `use-case`, `infrastructure/{repository, graphql/}`) ; repository privé en
  fonctions nues ; commandes et requêtes en namespaces ; style fonctionnel, unions discriminées ;
  aucun primitif nu, brands avec constructeur Zod et scalaire ; issues en valeur littérale,
  `match().exhaustive()` à l'exposition, `throw` pour l'impossible ; le nom porte le concept métier.
  **Garder.**
- **R-40 Collections plates.** Jamais de sous-collection ; chaque document nomme son propriétaire
  dans `userId` ; comptes dans `users/{userId}` ; le faux Firestore de test n'en a pas non plus.
  **Garder.**
- **R-41 Champs anticipés.** Un booléen ajouté à des enregistrements en production coûte une
  migration : on pose le champ avant la fonctionnalité quand elle est certaine. **Garder**, mineur.
- **R-42 Lectures.** Aucun champ imbriqué ne lit un document par ligne parente ; chargeurs groupés
  par requête ou dénormalisation assumée (l'appartenance à une série est portée par le livre) ;
  pagination au stockage ; seul cache serveur : par requête entrante. **Garder.**
- **R-43 Observabilité.** Jamais `console.*` ; logger nommé ; chaque `warn` et `error` part à
  Sentry, donc un échec rattrapé est loggé jamais avalé ; message constant et contexte à part pour
  que Sentry regroupe ; Sentry seulement dans un bundle construit avec le DSN. **Garder.**
- **R-44 Tests.** Trois suffixes, un workflow chacun ; stockage simulé par `mock.module` ; budgets
  de lecture avec `docReads` et `queryReads` séparés, jamais le total ; `toMatchObject` tient deux
  dates pour égales sous Bun, on affirme une date avec `toEqual` sur le champ ; co-localisés.
  **Garder.**
- **R-45 Développement local.** Contournement d'auth et bouchon d'IA gardés par `import.meta.dev`
  et éliminés du bundle ; `.env.example` à jour à chaque variable. **Garder.**

### 10-ios

- **R-46 Le guide iOS de Shiori est la règle.** Pure ou connectée, le nom le dit (`Screen`
  connecté, `Page` pure, jamais `View`) ; un seul `onAction` par page sur un `enum`, `switch`
  exhaustif ; client en struct de closures (`.live`, `.preview`), pas de protocole ; atomes et
  molécules seulement dans `Shared/`, organismes et pages dans leur domaine ; un composant par
  fichier ; `check-ios-components.ts` casse le build quand un composant pur appelle le réseau ;
  chargement visible sauf rafraîchissement par-dessus du contenu ; un échec par-dessus du contenu ne
  dit rien, `EmptyState.failure` sur un écran vide, tout écran chargé est tirable, une annulation
  n'est pas un échec ; instantanés de première page par écran (versionnés, effacés à la
  déconnexion, jamais pour une donnée sans valeur périmée) ; pagination par curseur avec jeton de
  génération, préchargement avant la fin, rechargement à profondeur constante, patch d'une ligne ;
  avis de changement unique après chaque mutation, écouté par les écrans seuls ; preview pour tout,
  fixtures `static let preview` ; tests des ViewModels avec un client inline, jamais d'un `body`.
  Écrit depuis `docs/ios-guide.md`, neutralisé. **Garder.**
- **R-47 Conventions de design.** Icônes alignées en haut à côté d'un titre et d'une description ;
  jamais de hint sous une section ; actions de barre en icônes seules, annuler à gauche confirmer à
  droite ; date à venir orange, disponible verte ; icône d'un bouton destructif rouge aussi ; ligne
  tappable sur toute sa largeur, jamais `onTapGesture` ; les écrans d'un même objet se composent des
  mêmes parties. **Garder.**
- **R-48 Cache client.** `dev-playbook` : « pas de cache côté client ». Shiori : pas de cache
  normalisé, mais instantanés et couvertures sur disque avec les contraintes de R-46. **Obsolète**
  côté `dev-playbook`.
- **R-49 Build.** Jamais purger le cache de build ; derived data propre par session de capture avec
  `SWIFT_ENABLE_EXPLICIT_MODULES=NO` ; `DEVELOPER_DIR` quand `xcode-select` pointe sur les Command
  Line Tools ; un worktree neuf n'a pas les fichiers ignorés. **Garder.**
- **R-50 Appareil physique.** On installe quand l'humain le dit, jamais avant la validation de la
  capture ; arbre propre en place, arbre sale depuis un worktree ; codegen Apollo d'abord ; sortie
  brute des outils relayée. `dev-playbook` et Shuhari « proposent l'installation à chaque tâche ».
  **Trancher**, proposition : sur demande seulement.

### 11-ops

- **R-51 Migrations.** Forward-only, séquentielles, suivies en base, lancées par le workflow Deploy
  après `terraform apply`, jamais depuis un poste ; on vérifie la ligne de log de l'étape ; migrer
  pour renommer, restructurer, changer un jeu de valeurs, purger ; pas pour un champ optionnel, une
  collection, une requête. **Garder.**
- **R-52 Jamais de déploiement local.** Jamais `terraform apply` ni déploiement depuis le Mac ; si
  la production semble en retard, `gh run list --workflow deploy` d'abord, on répare le pipeline.
  **Garder.**
- **R-53 Pas d'instance chaude.** Jamais `min_instance_count` ; le passage à zéro est voulu ; un
  p95 tiré par les démarrages à froid n'est pas une action. **Garder.**
- **R-54 Sentry.** Triage par l'API avec le jeton local jamais affiché ; corriger la cause ; test
  qui échoue avant le correctif pour un bug sérieux ; résoudre en `resolvedInNextRelease` après push
  et CI verte ; le contexte du logger est sous `.context`. **Garder.**
- **R-55 Secrets.** `.env` ignoré avec `.env.example` ; secret GitHub → Terraform → Secret Manager
  → fonction ; chaque emplacement de réplication listé dans le contexte projet ; une clé locale
  distincte de la production, comparées par empreinte. **Garder.**
- **R-56 Sauvegardes.** Protection contre la suppression, PITR sept jours, pas de copie hors base ;
  suivre le runbook de récupération avant d'agir ; jamais restaurer toute la base par-dessus des
  écritures. Présent mot pour mot dans les quatre projets. **Garder.**

### 12-ci

- **R-57 Un workflow par préoccupation.** `test-unit`, `test-int`, `test-feat`, `schema`
  (compatibilité contre `origin/main`, suppression refusée sans dépréciation), `build-ios` (avec
  `check-strings` et `check-ios-components`), `deploy` (build, `terraform apply`, migration,
  `paths-ignore`), `testflight-ios` à chaque push, `release-ios` sur tag, `pages`, `renovate`
  auto-hébergé le soir. Modèles livrés. **Garder.**
- **R-58 Renovate.** `config:recommended`, non-majeures groupées, lockfile maintenance
  hebdomadaire, chaque borne de version porte sa raison dans `description`, règle dédiée au paquet du
  socle sans automerge. Majeures : D-06. **Compléter.**
- **R-59 Jeton `gh` sans scope `workflow`.** Pousser par SSH quand `.github/workflows` change, ou
  `gh auth refresh -s workflow` une fois (interactif, à l'humain). Piège de machine, dans
  `15-tooling`. **Garder.**

### 13-ai

- **R-60 Chiffrer avant de construire.** Toute fonctionnalité qui appelle une API payante chiffre
  son coût avant : appels au premier passage, par jour, par mois, lignes × formats × langues ×
  recherches par appel ; le chiffre va dans la spec et le commit ; une passe de fond est dimensionnée
  à ce qu'un lecteur voit, jamais au jeu de données (526 appels, 25 € en quatre heures pour douze
  livres). **Garder.**
- **R-61 Gemini.** Un appel groundé facture environ quatre recherches, le compteur loggé
  sous-estime ; 5 000 recherches gratuites par mois par projet GCP ; au-delà, basculer les étapes
  groundées sur Claude Haiku avec recherche web plafonnée à deux ; une clé par projet GCP sur un
  compte prépayé, 402 solde vide et 429 plafond mensuel, le log dit lequel ; facture lue dans
  BigQuery plutôt qu'estimée. **Garder.**
- **R-62 Choix de modèle.** Sonnet pour une recommandation éditoriale (test en aveugle du 12
  octobre) ; Gemini Flash-Lite pour l'extraction structurée (Shuhari, Bazar) ; Google Books et Open
  Library écartés pour les éditions (bench du 20 octobre). **Garder.**

### 14-infra

- **R-63 Terraform.** Projet GCP `<app>-polyforms`, région unique, Firestore `eur3` ; état
  distant ; `bootstrap.sh` et `teardown.sh` ; Workload Identity pour la CI ; secrets, planificateur,
  compte observateur en lecture avec sa propre config `gcloud` pour les routines ; modèles `.tf`
  livrés. **Garder.**

### 15-tooling

- **R-64 Simulateurs.** Jamais télécharger un runtime ou une plateforme sans demander (plusieurs
  Go) ; seules les versions du SDK installé ; en ligne de commande, un téléchargement à la fois ; sur
  une connexion partagée d'iPhone macOS les suspend sans rien dire. **Garder.**
- **R-65 Navigateur.** Toujours le navigateur intégré de l'app, jamais Claude in Chrome ; laisser
  l'humain se connecter dedans. **Garder.**
- **R-66 Remote Control.** Un processus CLI par projet avec sa propre connexion. **Garder.**

### 16-routines

- **R-67 Ce qu'une routine peut faire.** Triage Sentry toutes les six heures, push direct ; santé
  quotidienne (coûts, performances, monitoring) par le compte observateur, démarrages à froid
  rapportés pas corrigés ; revue des PR Renovate si D-06 le décide. Chaque routine : fréquence,
  dépôts, autorisations, ce qu'elle ne fait jamais. **Garder.**

### Templates

- **R-68 CLAUDE.md de projet.** Sous 80 lignes : import des règles, commandes, spécificités,
  modèle de données (privé ou partagé), pièges du projet. Les sections « Paid API calls » et « API
  evolution » de Shiori remontent au paquet. **Garder.**
- **R-69 project-context.md.** Environnements, comptes, appareils, certificats et expirations,
  emplacements des secrets, décisions propres, travaux en attente. **Garder.**

## K. Les 45 mémoires de Shiori, reclassées

| Destination | Mémoires |
|---|---|
| Paquet, processus | check-ci-after-push, no-commit-message-approval, never-amend-without-rechecking-head, commit-with-explicit-pathspec, recheck-own-commit-after-parallel-commits, never-split-schema-hunks, run-commands-myself, execute-plans-inline-no-checkpoints, senior-critical-review, changelog-plain-words, changelog-only-on-release, changelog-review-before-release, skip-ci-for-docs, deploy-only-through-ci, sentry-autofix-push, no-min-instances |
| Paquet, iOS | ui-change-screenshot-validation, verify-screens-with-preview-fixtures, ios-icons-top-no-section-hints, ui-consistency-book-pages (généralisée), ios-localization-french-source, ios-strings-catalogue-check, xcodebuild-fresh-derived-data, simulator-verification-limits (le harnais), install-iphone-from-clean-worktree (le worktree) |
| Paquet, backend et tests | run-test-suffixes-separately, bun-tomatchobject-ignores-dates, cost-estimate-paid-api-features |
| Paquet, `13-ai` | gemini-key-and-billing (402/429, clé locale), gemini-spend-investigation (la recette), google-books-rejected, pour-vous-model-test |
| Paquet, outillage et App Store | gh-run-list-commit-filter, gh-run-log-local-cache, push-workflow-files-over-ssh, appstore-captures-pipeline (les pièges), first-subscription-submission (la séquence), appstore-english-listing (les contraintes) |
| `project-context.md` de Shiori | asc-api-key, admin-dashboard-data-sources, observer-service-account (l'identité), local-gemini-key (les empreintes), sentry-triage-token, remote-control-shiori, install-iphone-from-clean-worktree (l'appareil), appstore-english-listing (nom, prix), first-subscription-submission (identifiants) |
| Supprimées une fois le paquet à jour | toutes |

## Hors de cette relecture

- Le contenu exact des modèles exécutables (workflows, `.tf`, scripts) : copiés de Shiori dans une
  spec à part.
- `dev-playbook`, `nitro-ios-stack-template`, `nitro-backend-conventions` : remplacés par ce paquet,
  proposition de les archiver une fois la 1.0.0 publiée.
