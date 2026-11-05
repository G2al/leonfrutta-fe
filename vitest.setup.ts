import { configure } from "@testing-library/react";

// La conferma arriva dopo l'animazione del pulsante (~0,7 s): attese più ampie
// del secondo predefinito evitano falsi fallimenti su macchine lente.
configure({ asyncUtilTimeout: 3000 });
