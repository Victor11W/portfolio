// Each object describes a documented engineering decision and a small piece of its evidence.
const shiftExcerpt = `0x22  ADD v3, a3, a3
0x24  ADD v3, v3, v3`;
const shiftReport = './assets/Rapport_RISCV_Architecture_Processeur.pdf#page=22';
const frameTemplate = './assets/optiframe-frame.svg';

export const projectNotes = {
  processor: {
    fr: {
      title: 'Un décalage, deux additions',
      role: 'Avec Antoine Heitzmann et Dieudonné Lissom, j’ai désassemblé un programme RISC-V pour retrouver ce qu’il calculait. Il additionnait deux tableaux, élément par élément.',
      decision: 'Nous avons ensuite conçu notre propre jeu d’instructions. Avec 16 registres, trois opérandes occupent déjà 12 des 16 bits d’une instruction arithmétique. Nous avons réservé les quatre bits restants au choix de l’opération.',
      result: 'Nous avons réécrit le programme avec ce jeu réduit et dessiné un pipeline à trois étages pour l’exécuter. Le décalage rencontré dans le programme RISC-V, par exemple, se traduit en deux additions.',
      exhibit: {
        label: 'Assembleur · ISA du groupe',
        body: shiftExcerpt,
        caption: 'La première ligne double la valeur de a3. La seconde double le résultat. On obtient ainsi le même effet qu’un décalage de deux bits vers la gauche.',
        reference: 'Lire la traduction dans le rapport, p. 22',
        href: shiftReport
      }
    },
    en: {
      title: 'One shift, two additions',
      role: 'Antoine Heitzmann, Dieudonné Lissom and I disassembled a RISC-V program to work out what it did. It added two arrays together, element by element.',
      decision: 'We then designed our own instruction set. Addressing 16 registers takes four bits per operand, so three operands use 12 of the 16 bits in an arithmetic instruction. We used the remaining four to select the operation.',
      result: 'We rewrote the program in this smaller instruction set and drew a three-stage pipeline to execute it. The shift in the RISC-V program, for instance, became two additions.',
      exhibit: {
        label: 'Assembly · our instruction set',
        body: shiftExcerpt,
        caption: 'The first line doubles the value in a3. The second doubles that result. Together they give the same result as shifting left by two bits.',
        reference: 'Read the translation on page 22 of the report',
        href: shiftReport
      }
    }
  },
  optiframe: {
    fr: {
      title: 'Essayer la monture sur papier',
      role: 'Au hackathon CodeML, notre équipe voulait réutiliser des verres correcteurs. J’ai travaillé sur le passage de la photo à des cotes en millimètres et sur l’export de la face de la monture à taille réelle.',
      decision: 'Une photo prise de biais déforme le contour apparent du verre. Les quatre coins d’une carte de dimensions connues, posée dans le même plan, permettent de redresser l’image et de retrouver son échelle.',
      result: 'J’ai repris la face du modèle 3D pour en faire un patron papier. On peut poser ses verres sur le tracé avant de lancer une impression 3D. Une barre de 10 mm permet de contrôler l’échelle à la règle.',
      exhibit: {
        label: 'Sortie OptiFrame · patron papier',
        body: 'SVG 1:1',
        image: frameTemplate,
        alt: 'Face d’une monture avec deux ouvertures reliées par un pont, et une barre de contrôle de 10 mm.',
        caption: 'Gabarit généré avec l’exporteur OptiFrame à partir de deux contours synthétiques. Pour l’essayer, imprimer le fichier à 100 % et mesurer la barre.',
        reference: 'Ouvrir le gabarit imprimable en SVG',
        href: frameTemplate
      }
    },
    en: {
      title: 'Try the frame on paper',
      role: 'At the CodeML hackathon, our team set out to reuse prescription lenses. I worked on converting photographs into measurements in millimetres and exporting the front of the frame at full scale.',
      decision: 'Taking a photo at an angle distorts the apparent shape of the lens. Placing a card of known dimensions in the same plane gives us four reference corners to correct the perspective and recover the scale.',
      result: 'I used the front face of the 3D model to make a paper template. You can place the lenses on the printout before starting a 3D print. A 10 mm bar lets you check the scale with a ruler.',
      exhibit: {
        label: 'OptiFrame output · paper template',
        body: '1:1 SVG',
        image: frameTemplate,
        alt: 'Front view of the frame with two lens openings, a bridge and a 10 mm scale bar.',
        caption: 'Generated with the OptiFrame exporter from two synthetic lens outlines. To try it, print the file at 100% and measure the bar.',
        reference: 'Open the printable SVG template',
        href: frameTemplate
      }
    }
  }
};
