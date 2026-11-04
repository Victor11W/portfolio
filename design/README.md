# Modèles 3D du portfolio

Géométries originales générées depuis scene-models.js.

- processor.obj : carte, boîtier, broches et blocs de calcul.
- robot.obj : socle, articulations, deux segments et pince, dans la pose à t = 0.
- scene-materials.mtl : matériaux de base, à conserver à côté des OBJ.

Importer le fichier OBJ souhaité avec l’import OBJ de Blender. La géométrie est en Y-up, dans des unités arbitraires. Les faces sont orientées vers l’extérieur.

Ces fichiers reprennent la géométrie de base. Sur le site, le lettrage, les marquages de surface, les annotations et les signaux animés sont dessinés par le moteur Canvas. L’OBJ du bras est un maillage statique, sans rig ni animation Blender.

Pour les régénérer après modification :

~~~sh
npm run export-models
~~~

Les modèles n’ont pas été importés dans l’instance Blender de l’utilisateur pendant cette session.
