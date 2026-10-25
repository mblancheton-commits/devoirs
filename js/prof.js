const questionsBanqueEmmaStandard = [
    "Bonjour ! Quel est ton MBTI ?",
    "Bonjour ! Qu'est-ce que tu vas faire ce week-end ?",
    "Bonjour ! Quel est ton plat préféré ? 🍝",
    "Bonjour ! À quelle heure tu t'es réveillé ce matin ? ⏰",
    "Bonjour ! Quelle est ta ville préférée en Corée ? 🇰🇷",
    "Bonjour ! Quel est le dernier film que tu as vu ? 🎬",
    "Bonjour ! Quel est ton groupe de K-Pop préféré ? 🎵",
    "Bonjour ! Qu'est-ce que tu as mangé ce midi ? 🍱",
    "Bonjour ! Quelle est ta couleur préférée ? 🎨",
    "Bonjour ! Tu préfères l'été ou l'hiver ? ☀️/❄️",
    "Bonjour ! Si tu gagnais au loto, qu'est-ce que tu achèterais ? 💰",
    "Bonjour ! Tu préfères les chats 🐱 ou les chiens 🐶 ?",
    "Bonjour ! Quelle tâche ménagère détestes-tu faire ? 🧹",
    "Bonjour ! Tu bois du café ou du thé ? ☕",
    "Bonjour ! Quelle est ton application préférée sur ton téléphone ? 📱",
    "Bonjour ! Est-ce que tu as des frères et sœurs ? 👨‍👩‍👧‍👦",
    "Bonjour ! Tu te lèves tôt ou tard ? 🦉",
    "Bonjour ! Tu préfères la mer 🌊 ou la montagne 🏔️ ?",
    "Bonjour ! Quel est le dernier livre que tu as lu ? 📖",
    "Bonjour ! Quel temps fait-il aujourd'hui ? ☁️",
    "Bonjour ! Quel est ton dessert préféré ? 🍰",
    "Bonjour ! Qu'est-ce que tu as acheté récemment ? 🛍️",
    "Bonjour ! À quoi penses-tu quand je dis 'France' ? 🇫🇷",
    "Bonjour ! Quel est ton parfum de glace préféré ? 🍦",
    "Bonjour ! Quel est le meilleur quartier à Séoul ? 🏙️",
    "Bonjour ! Quel est ton fruit préféré ? 🍓",
    "Bonjour ! Quelle série regardes-tu en ce moment ? 📺",
    "Bonjour ! Tu préfères McDonald's ou Burger King ? 🍔",
    "Bonjour ! Tu as peur des moustiques ? 🦟",
    "Bonjour ! Quelle est ta spécialité en cuisine ? 👨‍🍳"
];

const sujetsDelfB1B2 = [
    "Que penses-tu de l'impact des réseaux sociaux sur les jeunes aujourd'hui ?",
    "Penses-tu que le télétravail est une bonne chose pour la vie de famille ?",
    "Faut-il interdire les téléphones portables dans les écoles d'après toi ?",
    "Crois-tu que l'intelligence artificielle représente une menace pour l'emploi ?",
    "Est-il nécessaire de voyager loin pour passer de bonnes vacances ?",
    "Penses-tu que les fast-foods devraient être davantage taxés pour la santé publique ?",
    "La protection de l'environnement est-elle l'affaire des citoyens ou des gouvernements ?",
    "Préfères-tu vivre dans une grande métropole ou dans un village à la campagne ?",
    "Penses-tu que les notes à l'école sont utiles pour motiver les élèves ?",
    "Faut-il encourager les gens à acheter des produits locaux même s'ils sont plus chers ?"
];

let listeEleves = [];
let listeDevoirs = [];
let listeAssignations = [];
let devoirsMap = {};
let assignationsMap = {};
let eleveSelectionne = null;
let donneesIAPret = null;
let coursEnEditionId = null;
let coursApercuModal = null;
let langueApercuActive = 'fr';
let modeEditionManuelActif = false;

let devoirAAssigner = null;
let pageActuelleEleves = 1;
const parPage = 10;
let elevesFiltres = [];

let filtreTypeBanqueActif = 'tous';
let texteRechercheBanque = '';
let donneesExoGenereParPrompt = null;

// Titre initial du document pour restauration après impression
const titreDocumentOriginal = document.title || "Espace Professeur - Gestion";

window.basculerOnglet = function(tabId, btn) {
    document.querySelectorAll('.tab-pane').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    const cible = document.getElementById(tabId);
    if (cible) cible.style.display = 'block';
    if (btn) btn.classList.add('active');
    if (tabId === 'tab-eleves') fermerFicheEleve();
};

window.filtrerEleves = function() {
    const input = document.getElementById('input-recherche-eleve');
    const texte = (input ? input.value : '').trim().toLowerCase();
    elevesFiltres = listeEleves.filter(e => (e.code || '').toLowerCase().includes(texte));
    pageActuelleEleves = 1;
    afficherTableauEleves();
};

window.changerPage = function(delta) {
    const totalPages = Math.ceil(elevesFiltres.length / parPage) || 1;
    const nouv = pageActuelleEleves + delta;
    if (nouv >= 1 && nouv <= totalPages) {
        pageActuelleEleves = nouv;
        afficherTableauEleves();
    }
};

function afficherTableauEleves() {
    const tbody = document.getElementById('table-eleves-corps');
    if (!tbody) return;
    tbody.innerHTML = "";

    const totalPages = Math.ceil(elevesFiltres.length / parPage) || 1;
    const info = document.getElementById('info-pagination');
    if (info) info.textContent = `Page ${pageActuelleEleves} sur ${totalPages} (${elevesFiltres.length} élèves)`;

    const btnP = document.getElementById('btn-page-prec');
    const btnS = document.getElementById('btn-page-suiv');
    if (btnP) btnP.disabled = (pageActuelleEleves <= 1);
    if (btnS) btnS.disabled = (pageActuelleEleves >= totalPages);

    const debut = (pageActuelleEleves - 1) * parPage;
    const pageItems = elevesFiltres.slice(debut, debut + parPage);

    if (pageItems.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#64748b;">Aucun élève trouvé.</td></tr>`;
        return;
    }

    pageItems.forEach(e => {
        const nbDevoirs = listeAssignations.filter(a => a.eleveCode && a.eleveCode.toUpperCase() === (e.code || '').toUpperCase()).length;
        const tr = document.createElement('tr');
        tr.className = "ligne-cliquable";
        tr.onclick = (evt) => {
            if (evt.target.tagName !== 'BUTTON') ouvrirFicheEleve(e.id);
        };
        tr.innerHTML = `
            <td><strong style="color:var(--accent); font-size:1.05em;">👤 ${e.code}</strong></td>
            <td><code>${e.cleApiPerso ? "● Clé personnalisée" : "(Clé par défaut)"}</code></td>
            <td><strong>${nbDevoirs}</strong> devoir(s)</td>
            <td><button type="button" class="btn btn-sm btn-purple" onclick="ouvrirFicheEleve('${e.id}')">⚙️ Gérer</button></td>
        `;
        tbody.appendChild(tr);
    });
}

window.ouvrirFicheEleve = function(eleveId) {
    eleveSelectionne = listeEleves.find(e => e.id === eleveId);
    if (!eleveSelectionne) return;

    document.getElementById('vue-liste-eleves').style.display = 'none';
    document.getElementById('vue-fiche-eleve').style.display = 'block';

    document.getElementById('fiche-titre-code').textContent = eleveSelectionne.code;
    document.getElementById('fiche-edit-code').value = eleveSelectionne.code;
    document.getElementById('fiche-edit-cle').value = eleveSelectionne.cleApiPerso || "";

    afficherDevoirsFicheEleve();
};

window.fermerFicheEleve = function() {
    eleveSelectionne = null;
    const fiche = document.getElementById('vue-fiche-eleve');
    const liste = document.getElementById('vue-liste-eleves');
    if (fiche) fiche.style.display = 'none';
    if (liste) liste.style.display = 'block';
};

window.sauvegarderNouveauCodeEleve = async function() {
    if (!eleveSelectionne) return;
    const ancienCode = eleveSelectionne.code;
    const nouvCode = document.getElementById('fiche-edit-code').value.trim().toUpperCase();

    if (!nouvCode) return alert("Le code ne peut pas être vide.");
    if (nouvCode === ancienCode) return alert("Aucun changement détecté.");

    if (confirm(`Renommer l'élève "${ancienCode}" en "${nouvCode}" ?\nTous ses devoirs seront mis à jour.`)) {
        await db.collection("eleves").doc(eleveSelectionne.id).update({ code: nouvCode });

        const snap = await db.collection("assignations").where("eleveCode", "==", ancienCode).get();
        const batch = db.batch();
        snap.forEach(doc => batch.update(doc.ref, { eleveCode: nouvCode }));
        await batch.commit();

        eleveSelectionne.code = nouvCode;
        document.getElementById('fiche-titre-code').textContent = nouvCode;
        alert(`✅ Élève renommé en ${nouvCode} !`);
    }
};

window.sauvegarderCleEleve = async function() {
    if (!eleveSelectionne) return;
    const cle = document.getElementById('fiche-edit-cle').value.trim();
    await db.collection("eleves").doc(eleveSelectionne.id).update({ cleApiPerso: cle || null });
    eleveSelectionne.cleApiPerso = cle || null;
    alert("✅ Clé API mise à jour !");
};

window.supprimerEleveActif = async function() {
    if (!eleveSelectionne) return;
    const code = eleveSelectionne.code;

    if (confirm(`Supprimer définitivement l'élève ${code} et tous ses devoirs associés ?`)) {
        await db.collection("eleves").doc(eleveSelectionne.id).delete();
        const snap = await db.collection("assignations").where("eleveCode", "==", code).get();
        const batch = db.batch();
        snap.forEach(doc => batch.delete(doc.ref));
        await batch.commit();

        alert(`✅ L'élève ${code} a été supprimé.`);
        fermerFicheEleve();
    }
};

function afficherDevoirsFicheEleve() {
    if (!eleveSelectionne) return;
    const tbody = document.getElementById('table-fiche-assignations-corps');
    if (!tbody) return;
    tbody.innerHTML = "";

    const sesAssignations = listeAssignations.filter(a => a.eleveCode && a.eleveCode.toUpperCase() === eleveSelectionne.code.toUpperCase());

    if (sesAssignations.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#64748b;">Aucun devoir assigné.</td></tr>`;
        return;
    }

    sesAssignations.forEach(a => {
        const tr = document.createElement('tr');
        let badgeType = "";
        let prog = "";
        let btnAction = "";

        if (a.typeDevoir === "emma") {
            badgeType = `<span class="badge-emma">🤖 Emma IA</span> ${a.modeDelf ? '<span class="badge-delf">🎓 DELF</span>' : ''}`;
            const nb = Object.keys(a.retoursEmma || {}).length;
            const tot = (a.questions || []).length;
            prog = `${nb} / ${tot} questions répondues`;
            btnAction = `<button type="button" class="btn btn-sm btn-purple" onclick="voirRetoursEmmaProf('${a.id}')">🔍 Corrections</button>`;
        } else if (a.typeDevoir === "interactif") {
            badgeType = a.estAutoEntrainement 
                ? `<span class="badge-auto">✨ Auto-entraînement</span>` 
                : `<span class="badge-interactif">⚡ Interactif</span>`;
            prog = `Score : <strong>${a.score || 0} / ${a.totalQuestions || 0}</strong>`;
        } else {
            badgeType = `<span class="badge-chapitre">📖 Cours + Quiz</span>`;
            prog = `Suivi par blocs`;
            btnAction = `<button type="button" class="btn btn-sm btn-purple" onclick="ouvrirCopiePDFProf('${a.id}')">📄 Voir la Copie PDF</button>`;
        }

        tr.innerHTML = `
            <td><strong>${a.devoirTitre}</strong></td>
            <td>${badgeType}</td>
            <td>${prog}</td>
            <td style="display:flex; gap:8px;">
                ${btnAction}
                <button type="button" class="btn btn-sm btn-danger" onclick="supprimerAssignation('${a.id}')">🗑️ Retirer</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ASSIGNATION DIRECTE DEPUIS LA FICHE ÉLÈVE
window.ouvrirModalAssignerADirectionEleve = function() {
    if (!eleveSelectionne) return;

    document.getElementById('assign-eleve-nom-titre').textContent = eleveSelectionne.code;
    document.getElementById('recherche-assign-devoirs-input').value = "";
    genererListeCochesDevoirs(listeDevoirs);
    document.getElementById('modal-assignation-directe-eleve').classList.add('ouverte');
};

function genererListeCochesDevoirs(devoirs) {
    const conteneur = document.getElementById('conteneur-coches-devoirs-eleve');
    if (!conteneur) return;
    conteneur.innerHTML = "";

    if (devoirs.length === 0) {
        conteneur.innerHTML = `<div style="color:#64748b; padding:10px; text-align:center;">Aucun devoir disponible.</div>`;
        return;
    }

    devoirs.forEach(d => {
        const div = document.createElement('div');
        div.className = "item-coche-eleve";
        let typeBadge = (d.typeDevoir === 'emma') ? (d.modeDelf ? '🎓 Emma DELF' : '🤖 Emma') : (d.typeDevoir === 'interactif' ? '⚡ Interactif' : '📖 Cours');
        div.innerHTML = `
            <input type="checkbox" id="chk-devoir-${d.id}" value="${d.id}" class="chk-assign-devoir-item">
            <label for="chk-devoir-${d.id}">
                <strong>${d.titre}</strong> <span style="font-size:0.85em; color:#64748b;">(${typeBadge})</span>
            </label>
        `;
        conteneur.appendChild(div);
    });
}

window.filtrerCochesDevoirsAssignation = function() {
    const txt = (document.getElementById('recherche-assign-devoirs-input').value || '').trim().toLowerCase();
    const filtrés = listeDevoirs.filter(d => (d.titre || '').toLowerCase().includes(txt));
    genererListeCochesDevoirs(filtrés);
};

window.basculerToutesLesCochesDevoirs = function() {
    const checkboxes = document.querySelectorAll('.chk-assign-devoir-item');
    const tousCoches = Array.from(checkboxes).every(c => c.checked);
    checkboxes.forEach(c => c.checked = !tousCoches);
};

window.confirmerAssignationDirecteEleve = async function() {
    if (!eleveSelectionne) return;

    const selectionnes = Array.from(document.querySelectorAll('.chk-assign-devoir-item:checked')).map(c => c.value);
    if (selectionnes.length === 0) return alert("Veuillez cocher au moins un devoir !");

    const btn = document.getElementById('btn-valider-assignation-directe');
    btn.disabled = true;
    btn.textContent = "⏳ Assignation...";

    try {
        const batch = db.batch();
        selectionnes.forEach(devoirId => {
            const d = devoirsMap[devoirId];
            if (!d) return;

            const nouvRef = db.collection("assignations").doc();
            if (d.typeDevoir === "emma") {
                batch.set(nouvRef, {
                    eleveCode: eleveSelectionne.code,
                    devoirId: d.id,
                    devoirTitre: d.titre,
                    typeDevoir: "emma",
                    modeDelf: d.modeDelf || false,
                    questions: d.questions || [],
                    statut: "non_commence",
                    retoursEmma: {},
                    dateAssignation: firebase.firestore.FieldValue.serverTimestamp()
                });
            } else if (d.typeDevoir === "interactif") {
                batch.set(nouvRef, {
                    eleveCode: eleveSelectionne.code,
                    devoirId: d.id,
                    devoirTitre: d.titre,
                    typeDevoir: "interactif",
                    phrases: d.phrases || [],
                    statut: "non_commence",
                    score: 0,
                    totalQuestions: (d.phrases || []).length,
                    totalErreurs: 0,
                    fautesDetails: [],
                    reponsesValidees: {},
                    dateAssignation: firebase.firestore.FieldValue.serverTimestamp()
                });
            } else {
                const suiviBlocs = { cours: { statut: "non_lu" } };
                (d.blocs_exercices || []).forEach(b => { suiviBlocs[b.id] = { statut: "non_fait", reponses: {} }; });
                batch.set(nouvRef, {
                    eleveCode: eleveSelectionne.code,
                    devoirId: d.id,
                    devoirTitre: d.titre,
                    typeDevoir: "chapitre_cours",
                    points_importants: d.points_importants || null,
                    quiz_theorique: d.quiz_theorique || null,
                    bloc_cours: d.bloc_cours || null,
                    blocs_exercices: d.blocs_exercices || [],
                    suiviBlocs: suiviBlocs,
                    dateAssignation: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        });

        await batch.commit();
        alert(`✅ ${selectionnes.length} devoir(s) assigné(s) à ${eleveSelectionne.code} !`);
        document.getElementById('modal-assignation-directe-eleve').classList.remove('ouverte');
    } catch(e) {
        alert("Erreur lors de l'assignation : " + e.message);
    } finally {
        btn.disabled = false;
        btn.textContent = "✅ Valider l'assignation";
    }
};

// =========================================================================
// COPIE PDF DE L'ÉLÈVE (SANS LE COURS, MULTI-PAGES & NOM PRÉ-REMPLI)
// =========================================================================
let nomFichierPdfPrevu = "copie_eleve";

window.ouvrirCopiePDFProf = function(assignationId) {
    const a = assignationsMap[assignationId];
    if (!a) return;

    // Définir le nom prérempli du fichier PDF : CODE-NOM_DU_COURS
    nomFichierPdfPrevu = `${a.eleveCode}-${a.devoirTitre}`.replace(/[\/\\?%*:|"<>]/g, '_');

    document.getElementById('pdf-titre').textContent = a.devoirTitre || "Copie de devoirs";
    document.getElementById('pdf-eleve').textContent = a.eleveCode;
    document.getElementById('pdf-date').textContent = new Date().toLocaleDateString('fr-FR');

    const zone = document.getElementById('pdf-contenu-exercices');
    zone.innerHTML = "";
    const suivi = a.suiviBlocs || {};

    // Note : Le cours théorique est volontairement omis ici pour n'imprimer que les réponses de l'élève.

    // Reconstitution des exercices avec surbrillance jaune fluo
    const blocs = a.blocs_exercices || [];
    if (blocs.length === 0) {
        zone.innerHTML = "<p style='color:#64748b;'>Aucun exercice dans ce devoir.</p>";
    }

    blocs.forEach((b) => {
        const reponses = (suivi[b.id] && suivi[b.id].reponses) ? suivi[b.id].reponses : {};
        zone.innerHTML += `<h3 style="margin-top:20px; color:#1e293b; border-bottom:2px solid #e2e8f0; padding-bottom:6px;">${b.titre}</h3>`;
        if (b.consigne) zone.innerHTML += `<p style="font-style:italic; color:#64748b; margin-top:4px;">${b.consigne}</p>`;
        
        const ol = document.createElement('ol');
        ol.style.lineHeight = "2.2";
        ol.style.marginTop = "10px";

        (b.questions || []).forEach((q, qIdx) => {
            const li = document.createElement('li');
            const texteQ = q.q || "";

            // Cas 1 : Trous
            if (/_{2,}/.test(texteQ)) {
                const parts = texteQ.split(/_{2,}/);
                let texteLigne = "";
                for (let i = 0; i < parts.length; i++) {
                    texteLigne += parts[i];
                    if (i < parts.length - 1) {
                        const cleTrou = `${qIdx}_trou_${i}`;
                        const rep = reponses[cleTrou] ? `<span class="surbrillance">${reponses[cleTrou]}</span>` : `<span style="color:#aaa;">(non rempli)</span>`;
                        texteLigne += ` ${rep} `;
                    }
                }
                li.innerHTML = texteLigne;
            } 
            // Cas 2 : Réponses libres
            else {
                const cleLibre = `${qIdx}_reponse_libre`;
                const rep = reponses[cleLibre] ? `<span class="surbrillance">${reponses[cleLibre]}</span>` : `<span style="color:#aaa;">(non rempli)</span>`;
                li.innerHTML = `<strong>${texteQ}</strong><br>➔ Réponse de l'élève : ${rep}`;
            }
            ol.appendChild(li);
        });
        zone.appendChild(ol);
    });

    document.getElementById('modal-export-pdf-prof').classList.add('ouverte');
};

// IMPRESSION AVEC NOM DU FICHIER PRÉ-REMPLI
window.imprimerCopiePdfEleve = function() {
    // Modifier temporairement le titre de la page web pour que le navigateur préremplisse le nom du fichier PDF
    document.title = nomFichierPdfPrevu;
    window.print();
    // Restaurer le titre original après impression
    setTimeout(() => {
        document.title = titreDocumentOriginal;
    }, 1000);
};

function afficherDerniersDevoirsGlobaux() {
    const tbody = document.getElementById('table-derniers-devoirs-corps');
    if (!tbody) return;
    tbody.innerHTML = "";

    const copies = [...listeAssignations].filter(a => a.statut === "termine" || a.statut === "en_cours");
    const dixDerniers = copies.slice(0, 10);

    if (dixDerniers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#64748b;">Aucun devoir récent.</td></tr>`;
        return;
    }

    dixDerniers.forEach(a => {
        const tr = document.createElement('tr');
        let badgeType = "";
        let statutInfo = "";
        let actionBtn = "";

        if (a.typeDevoir === "emma") {
            badgeType = `<span class="badge-emma">🤖 Emma IA</span> ${a.modeDelf ? '<span class="badge-delf">🎓 DELF</span>' : ''}`;
            statutInfo = (a.statut === "termine") ? `<span style="color:var(--success); font-weight:bold;">✅ Terminé</span>` : `<span style="color:var(--accent);">💬 En cours</span>`;
            actionBtn = `<button type="button" class="btn btn-sm btn-purple" onclick="voirRetoursEmmaProf('${a.id}')">🔍 Voir l'échange</button>`;
        } else if (a.typeDevoir === "interactif") {
            badgeType = a.estAutoEntrainement ? `<span class="badge-auto">✨ Entraînement</span>` : `<span class="badge-interactif">⚡ Interactif</span>`;
            statutInfo = `Score : <strong>${a.score || 0} / ${a.totalQuestions || 0}</strong>`;
        } else {
            badgeType = `<span class="badge-chapitre">📖 Cours + Quiz</span>`;
            statutInfo = `Actif`;
            actionBtn = `<button type="button" class="btn btn-sm btn-purple" onclick="ouvrirCopiePDFProf('${a.id}')">📄 Copie PDF</button>`;
        }

        tr.innerHTML = `
            <td><strong style="color:var(--accent); cursor:pointer;" onclick="ouvrirFicheEleveParCode('${a.eleveCode}')">👤 ${a.eleveCode}</strong></td>
            <td><strong>${a.devoirTitre}</strong></td>
            <td>${badgeType}</td>
            <td>${statutInfo}</td>
            <td>${actionBtn}</td>
        `;
        tbody.appendChild(tr);
    });
}

window.ouvrirFicheEleveParCode = function(code) {
    const e = listeEleves.find(x => (x.code || '').toUpperCase() === (code || '').toUpperCase());
    if (e) {
        basculerOnglet('tab-eleves', document.getElementById('btn-tab-eleves'));
        ouvrirFicheEleve(e.id);
    }
};

// ASSIGNATION MODAL GÉNÉRALE
window.ouvrirModalAssignation = function(devoirId) {
    devoirAAssigner = devoirsMap[devoirId];
    if (!devoirAAssigner) return;

    if (listeEleves.length === 0) {
        return alert("Aucun élève enregistré. Ajoutez au moins un élève avant d'assigner.");
    }

    document.getElementById('assign-titre-devoir').textContent = devoirAAssigner.titre;
    document.getElementById('recherche-assign-eleve').value = "";
    
    genererListeCochesEleves(listeEleves);
    document.getElementById('modal-assignation').classList.add('ouverte');
};

function genererListeCochesEleves(eleves) {
    const conteneur = document.getElementById('conteneur-coches-eleves');
    if (!conteneur) return;
    conteneur.innerHTML = "";

    if (eleves.length === 0) {
        conteneur.innerHTML = `<div style="color:#64748b; padding:10px; text-align:center;">Aucun élève ne correspond.</div>`;
        return;
    }

    eleves.forEach(e => {
        const div = document.createElement('div');
        div.className = "item-coche-eleve";
        div.innerHTML = `
            <input type="checkbox" id="chk-eleve-${e.id}" value="${e.code}" class="chk-assign-eleve">
            <label for="chk-eleve-${e.id}">👤 <strong>${e.code}</strong></label>
        `;
        conteneur.appendChild(div);
    });
}

window.filtrerCochesAssignation = function() {
    const txt = (document.getElementById('recherche-assign-eleve').value || '').trim().toLowerCase();
    const filtrés = listeEleves.filter(e => (e.code || '').toLowerCase().includes(txt));
    genererListeCochesEleves(filtrés);
};

window.basculerToutesLesCoches = function() {
    const checkboxes = document.querySelectorAll('.chk-assign-eleve');
    const tousCoches = Array.from(checkboxes).every(c => c.checked);
    checkboxes.forEach(c => c.checked = !tousCoches);
};

window.fermerModalAssignation = function() {
    devoirAAssigner = null;
    document.getElementById('modal-assignation').classList.remove('ouverte');
};

window.confirmerAssignationGroupee = async function() {
    if (!devoirAAssigner) return;

    const selectionnes = Array.from(document.querySelectorAll('.chk-assign-eleve:checked')).map(c => c.value);
    if (selectionnes.length === 0) return alert("Veuillez cocher au moins un élève !");

    const btn = document.getElementById('btn-valider-assignation');
    btn.disabled = true;
    btn.textContent = "⏳ Assignation...";

    try {
        const batch = db.batch();
        selectionnes.forEach(codeEleve => {
            const nouvRef = db.collection("assignations").doc();
            if (devoirAAssigner.typeDevoir === "emma") {
                batch.set(nouvRef, {
                    eleveCode: codeEleve,
                    devoirId: devoirAAssigner.id,
                    devoirTitre: devoirAAssigner.titre,
                    typeDevoir: "emma",
                    modeDelf: devoirAAssigner.modeDelf || false,
                    questions: devoirAAssigner.questions || [],
                    statut: "non_commence",
                    retoursEmma: {},
                    dateAssignation: firebase.firestore.FieldValue.serverTimestamp()
                });
            } else if (devoirAAssigner.typeDevoir === "interactif") {
                batch.set(nouvRef, {
                    eleveCode: codeEleve,
                    devoirId: devoirAAssigner.id,
                    devoirTitre: devoirAAssigner.titre,
                    typeDevoir: "interactif",
                    phrases: devoirAAssigner.phrases || [],
                    statut: "non_commence",
                    score: 0,
                    totalQuestions: (devoirAAssigner.phrases || []).length,
                    totalErreurs: 0,
                    fautesDetails: [],
                    reponsesValidees: {},
                    dateAssignation: firebase.firestore.FieldValue.serverTimestamp()
                });
            } else {
                const suiviBlocs = { cours: { statut: "non_lu" } };
                (devoirAAssigner.blocs_exercices || []).forEach(b => { suiviBlocs[b.id] = { statut: "non_fait", reponses: {} }; });
                batch.set(nouvRef, {
                    eleveCode: codeEleve,
                    devoirId: devoirAAssigner.id,
                    devoirTitre: devoirAAssigner.titre,
                    typeDevoir: "chapitre_cours",
                    points_importants: devoirAAssigner.points_importants || null,
                    quiz_theorique: devoirAAssigner.quiz_theorique || null,
                    bloc_cours: devoirAAssigner.bloc_cours || null,
                    blocs_exercices: devoirAAssigner.blocs_exercices || [],
                    suiviBlocs: suiviBlocs,
                    dateAssignation: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        });

        await batch.commit();
        alert(`✅ Assigné avec succès à ${selectionnes.length} élève(s) !`);
        fermerModalAssignation();
    } catch(err) {
        alert("Erreur : " + err.message);
    } finally {
        btn.disabled = false;
        btn.textContent = "✅ Assigner aux élèves cochés";
    }
};

window.creerEleve = async function() {
    const input = document.getElementById('nouvel-eleve-code');
    const code = input ? input.value.trim().toUpperCase() : "";
    const cle = document.getElementById('nouvel-eleve-cle').value.trim();
    if (!code) return alert("Indiquez le code élève (ex: Lucas01).");

    await db.collection("eleves").add({
        code: code,
        cleApiPerso: cle || null,
        dateCreation: firebase.firestore.FieldValue.serverTimestamp()
    });
    input.value = "";
    document.getElementById('nouvel-eleve-cle').value = "";
    alert(`✅ Élève ${code} enregistré !`);
};

window.supprimerAssignation = async function(id) {
    if (confirm("Retirer ce devoir à l'élève ?")) {
        await db.collection("assignations").doc(id).delete();
    }
};

window.supprimerDevoir = async function(id) {
    if (confirm("Supprimer ce devoir de la banque et chez tous les élèves ?")) {
        await db.collection("devoirs").doc(id).delete();
        const snap = await db.collection("assignations").where("devoirId", "==", id).get();
        const batch = db.batch();
        snap.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
    }
};

window.piocherQuestionsEmma = function() {
    const melange = [...questionsBanqueEmmaStandard].sort(() => 0.5 - Math.random());
    document.getElementById('questions-emma-texte').value = melange.slice(0, 10).join('\n');
    document.getElementById('check-mode-delf').checked = false;
};

window.piocherQuestionsDelf = function() {
    const melange = [...sujetsDelfB1B2].sort(() => 0.5 - Math.random());
    document.getElementById('questions-emma-texte').value = melange.slice(0, 10).join('\n');
    document.getElementById('check-mode-delf').checked = true;
};

window.enregistrerDevoirEmma = async function() {
    const titre = document.getElementById('titre-emma').value.trim();
    const lignes = document.getElementById('questions-emma-texte').value.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const estModeDelf = document.getElementById('check-mode-delf').checked;

    if (!titre || lignes.length === 0) return alert("Indiquez un titre et des questions.");

    await db.collection("devoirs").add({
        titre: titre,
        typeDevoir: "emma",
        modeDelf: estModeDelf,
        questions: lignes,
        dateCreation: firebase.firestore.FieldValue.serverTimestamp()
    });

    alert(`✅ Exercice IA avec Emma (${estModeDelf ? 'Mode DELF B1/B2' : 'Standard'}) enregistré !`);
    document.getElementById('titre-emma').value = "";
    document.getElementById('questions-emma-texte').value = "";
    document.getElementById('check-mode-delf').checked = false;
    basculerOnglet('tab-devoirs', document.getElementById('btn-tab-devoirs'));
};

window.ajusterFormulairePromptProf = function() {
    const type = document.querySelector('input[name="type-exo-prompt"]:checked').value;
    const boxOptions = document.getElementById('box-options-identiques-prompt');
    if (boxOptions) {
        boxOptions.style.display = (type === 'select-identique') ? 'block' : 'none';
    }
};

window.genererExerciceParPromptIA = async function() {
    const promptProf = document.getElementById('input-prompt-exercice').value.trim();
    const titre = document.getElementById('input-prompt-titre').value.trim() || "Exercice de grammaire";
    const typeExo = document.querySelector('input[name="type-exo-prompt"]:checked').value;
    const optionsCommunes = document.getElementById('input-options-communes-prompt').value.trim();
    const nbPhrases = document.getElementById('select-nb-phrases-prompt').value;
    const modelChoisi = document.getElementById('select-ia-model-prompt').value;

    const urlApi = document.getElementById('api-url').value.trim();
    const cleNano = document.getElementById('nanogpt-key-input').value.trim();

    if (!promptProf) return alert("Veuillez entrer une consigne pour l'IA.");

    const btn = document.getElementById('btn-lancer-prompt-exo');
    btn.disabled = true;
    btn.textContent = "⏳ Génération en cours...";

    try {
        const res = await fetch(urlApi.replace(/\/$/, "") + "/api/generer-exercice-prof", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-model-choice": modelChoisi,
                "x-nanogpt-key": cleNano
            },
            body: JSON.stringify({
                promptProf: promptProf,
                typeExo: typeExo,
                optionsCommunes: optionsCommunes,
                nbPhrases: nbPhrases,
                titre: titre
            })
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error);

        donneesExoGenereParPrompt = data;
        afficherApercuExoGenerePrompt();
        document.getElementById('card-apercu-exo-prompt').style.display = "block";
        alert("✅ Exercice généré avec succès !");

    } catch(e) {
        alert("Erreur lors de la génération : " + e.message);
    } finally {
        btn.disabled = false;
        btn.textContent = "🪄 Générer les phrases d'exercice";
    }
};

function afficherApercuExoGenerePrompt() {
    if (!donneesExoGenereParPrompt) return;
    const conteneur = document.getElementById('conteneur-lignes-exo-prompt');
    conteneur.innerHTML = "";

    const phrases = donneesExoGenereParPrompt.phrases || [];
    phrases.forEach((p, idx) => {
        const div = document.createElement('div');
        div.className = "edit-box-item";

        let detailsHtml = "";
        if (p.type === 'select') {
            detailsHtml = `<div>Options : <code>${(p.options || []).join(', ')}</code> | Bonne réponse : <strong style="color:var(--success);">${(p.a || []).join(' / ')}</strong></div>`;
        } else {
            detailsHtml = `<div>Réponse attendue : <strong style="color:var(--success);">${(p.a || []).join(' / ')}</strong></div>`;
        }

        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <strong style="color:var(--primary);">Phrase ${idx + 1}</strong>
                <button type="button" class="btn btn-sm btn-danger" onclick="supprimerPhraseExoPrompt(${idx})">🗑️ Supprimer</button>
            </div>
            <input type="text" value="${p.q || ''}" oninput="donneesExoGenereParPrompt.phrases[${idx}].q = this.value" style="margin-bottom:8px;">
            ${detailsHtml}
        `;
        conteneur.appendChild(div);
    });
}

window.supprimerPhraseExoPrompt = function(idx) {
    if (!donneesExoGenereParPrompt) return;
    donneesExoGenereParPrompt.phrases.splice(idx, 1);
    afficherApercuExoGenerePrompt();
};

window.sauvegarderExoPromptDansBanque = async function() {
    if (!donneesExoGenereParPrompt || (donneesExoGenereParPrompt.phrases || []).length === 0) {
        return alert("Aucune phrase à enregistrer.");
    }

    const titreFinal = document.getElementById('input-prompt-titre').value.trim() || donneesExoGenereParPrompt.titre;

    await db.collection("devoirs").add({
        titre: titreFinal,
        typeDevoir: "interactif",
        phrases: donneesExoGenereParPrompt.phrases,
        dateCreation: firebase.firestore.FieldValue.serverTimestamp()
    });

    alert(`✅ "${titreFinal}" a été enregistré dans votre Banque de devoirs !`);
    document.getElementById('card-apercu-exo-prompt').style.display = "none";
    document.getElementById('input-prompt-exercice').value = "";
    basculerOnglet('tab-devoirs', document.getElementById('btn-tab-devoirs'));
};

window.ajusterFormulaireManuel = function() {
    const type = document.querySelector('input[name="type-exo-manuel"]:checked').value;
    document.getElementById('box-options-identiques').style.display = (type === 'select-identique') ? 'block' : 'none';
};

window.enregistrerDevoirManuel = async function() {
    const titre = document.getElementById('titre-devoir-manuel').value.trim();
    const type = document.querySelector('input[name="type-exo-manuel"]:checked').value;
    const lignes = document.getElementById('texte-brut-manuel').value.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (!titre || lignes.length === 0) return alert("Remplissez le titre et les phrases.");

    const phrases = [];
    lignes.forEach(l => {
        const p = l.split(';').map(x => x.trim());
        if (p.length < 2) return;
        if (type === 'select-identique') {
            const opts = document.getElementById('options-globales').value.split(',').map(o => o.trim());
            phrases.push({ q: p[0], type: 'select', options: opts, a: [p[1]] });
        } else if (type === 'select-variable') {
            const rep = p[p.length - 1];
            const opts = p.slice(1, p.length - 1);
            if (!opts.includes(rep)) opts.push(rep);
            phrases.push({ q: p[0], type: 'select', options: opts, a: [rep] });
        } else {
            phrases.push({ q: p[0], type: 'text', a: p[1].split('|').map(v => v.trim()) });
        }
    });

    await db.collection("devoirs").add({
        titre: titre,
        typeDevoir: "interactif",
        phrases: phrases,
        dateCreation: firebase.firestore.FieldValue.serverTimestamp()
    });
    alert("✅ Devoir interactif enregistré !");
    basculerOnglet('tab-devoirs', document.getElementById('btn-tab-devoirs'));
};

// ACTUALISER MODÈLES NANOGPT
window.actualiserModelesNanoGPT = async function() {
    const urlApi = document.getElementById('api-url').value.trim();
    const cleNano = document.getElementById('nanogpt-key-input').value.trim();
    if (!cleNano) return alert("Veuillez renseigner votre clé API NanoGPT ci-dessous pour lister vos modèles.");

    const btn = document.getElementById('btn-refresh-models');
    btn.disabled = true;
    btn.textContent = "⏳...";

    try {
        const res = await fetch(urlApi.replace(/\/$/, "") + "/api/nanogpt-models", {
            method: "GET",
            headers: { "x-nanogpt-key": cleNano }
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        const selects = [document.getElementById('select-ia-model'), document.getElementById('select-ia-model-prompt')];
        selects.forEach(select => {
            if (!select) return;
            select.innerHTML = "";

            const optGroupe = document.createElement('optgroup');
            optGroupe.label = "⭐ Modèles Recommandés";

            const modelesStars = [
                "deepseek/deepseek-v4.1-flash:thinking",
                "qwen/qwen3-235b-a22b-thinking-2507",
                "gemini-3.8-flash"
            ];

            modelesStars.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m;
                opt.textContent = m;
                optGroupe.appendChild(opt);
            });
            select.appendChild(optGroupe);

            const optAutres = document.createElement('optgroup');
            optAutres.label = `🌐 Tous les modèles NanoGPT (${data.models.length})`;

            data.models.forEach(m => {
                if (!modelesStars.includes(m)) {
                    const opt = document.createElement('option');
                    opt.value = m;
                    opt.textContent = m;
                    optAutres.appendChild(opt);
                }
            });
            select.appendChild(optAutres);
        });

        alert(`✅ ${data.models.length} modèles NanoGPT récupérés avec succès !`);

    } catch(e) {
        alert("Erreur lors de la récupération des modèles : " + e.message);
    } finally {
        btn.disabled = false;
        btn.textContent = "🔄";
    }
};

window.analyserPDFAvecIA = async function() {
    const urlApi = document.getElementById('api-url').value.trim();
    const fileInput = document.getElementById('pdf-file-input');
    const modelChoisi = document.getElementById('select-ia-model').value;
    const cleNano = document.getElementById('nanogpt-key-input').value.trim();

    if (!urlApi || !fileInput.files[0]) return alert("Indiquez l'URL Render et le fichier PDF.");
    if (cleNano) localStorage.setItem("nanoGptKey", cleNano);

    const btn = document.getElementById('btn-analyser-pdf');
    btn.disabled = true;
    btn.textContent = `⏳ Analyse avec ${modelChoisi}...`;

    const formData = new FormData();
    formData.append("pdf", fileInput.files[0]);

    try {
        const res = await fetch(urlApi.replace(/\/$/, "") + "/api/analyser-pdf", {
            method: "POST",
            headers: { 
                "x-model-choice": modelChoisi,
                "x-nanogpt-key": cleNano
            },
            body: formData
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        donneesIAPret = data;
        coursEnEditionId = null;
        document.getElementById('ia-titre').value = data.titre || "Chapitre de cours";
        
        modeEditionManuelActif = false;
        mettreAJourBoutonModeEdition();
        changerLangueApercu('fr', document.getElementById('subtab-btn-fr'));
        document.getElementById('card-resultat-ia').style.display = "block";
        alert(`✅ Analyse réussie avec ${modelChoisi} !`);

    } catch(e) {
        alert("Erreur lors de l'analyse : " + e.message);
    } finally {
        btn.disabled = false;
        btn.textContent = "🚀 Lancer l'analyse du cours";
    }
};

window.appliquerRetoucheIA = async function() {
    if (!donneesIAPret) return alert("Aucun cours n'est actuellement en cours d'analyse.");

    const instruction = document.getElementById('instruction-retouche-texte').value.trim();
    if (!instruction) return alert("Veuillez formuler votre demande de modification à l'IA.");

    const urlApi = document.getElementById('api-url').value.trim();
    const modelChoisi = document.getElementById('select-ia-model').value;
    const cleNano = document.getElementById('nanogpt-key-input').value.trim();

    const btn = document.getElementById('btn-appliquer-retouche');
    btn.disabled = true;
    btn.textContent = "⏳ L'IA retouche le cours complet...";

    try {
        const res = await fetch(urlApi.replace(/\/$/, "") + "/api/ajuster-contenu", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "x-model-choice": modelChoisi,
                "x-nanogpt-key": cleNano
            },
            body: JSON.stringify({
                contenuActuel: donneesIAPret,
                instruction: instruction
            })
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error);

        donneesIAPret = data;
        document.getElementById('ia-titre').value = data.titre || document.getElementById('ia-titre').value;

        rendreApercuTrilingue(langueApercuActive);
        document.getElementById('instruction-retouche-texte').value = "";
        alert("✅ Modifications appliquées avec succès !");

    } catch(e) {
        alert("Erreur lors de la retouche IA : " + e.message);
    } finally {
        btn.disabled = false;
        btn.textContent = "✨ Appliquer les modifications";
    }
};

window.basculerModeEditionManuel = function() {
    modeEditionManuelActif = !modeEditionManuelActif;
    mettreAJourBoutonModeEdition();
    rendreApercuTrilingue(langueApercuActive);
};

function mettreAJourBoutonModeEdition() {
    const btn = document.getElementById('btn-toggle-edit-mode');
    if (!btn) return;
    if (modeEditionManuelActif) {
        btn.textContent = "👁️ Passer en Mode Aperçu";
        btn.className = "btn btn-secondary";
    } else {
        btn.textContent = "✏️ Mode Édition manuelle";
        btn.className = "btn btn-purple";
    }
}

window.changerLangueApercu = function(lang, btn) {
    langueApercuActive = lang;
    document.querySelectorAll('.subtabs-lang .subtab-lang-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    rendreApercuTrilingue(lang);
};

function rendreApercuTrilingue(lang) {
    const conteneur = document.getElementById('zone-apercu-dynamique');
    if (modeEditionManuelActif) {
        conteneur.innerHTML = construireFormulaireEditionManuel(donneesIAPret, lang);
    } else {
        conteneur.innerHTML = construireHtmlContenuCours(donneesIAPret, lang);
    }
}

function construireHtmlContenuCours(data, lang) {
    if (!data) return "<p>Aucune donnée disponible.</p>";

    const slides = (data.bloc_cours && data.bloc_cours.slides) ? data.bloc_cours.slides : [];
    const htmlCours = slides.map(s => {
        let texte = s.contenu_fr || "";
        if (lang === 'ko' && s.contenu_ko) texte = s.contenu_ko;
        else if (lang === 'en' && s.contenu_en) texte = s.contenu_en;

        return `
            <div style="border-bottom:1px solid #e2e8f0; padding-bottom:12px; margin-bottom:14px;">
                <h4 style="margin:0 0 6px 0; color:var(--accent); font-size:1.1em;">${s.titre || `Fiche ${s.numero}`}</h4>
                <p style="margin:0; white-space:pre-wrap; line-height:1.7;">${texte}</p>
            </div>
        `;
    }).join('') || "<p style='color:#64748b;'>Aucune fiche de cours.</p>";

    const points = (data.points_importants && data.points_importants[lang]) ? data.points_importants[lang] : (data.points_importants ? (data.points_importants.fr || []) : []);
    const htmlPoints = points.map(pt => `<li>${pt}</li>`).join('');

    const questions = (data.quiz_theorique && data.quiz_theorique.questions) ? data.quiz_theorique.questions : [];
    let htmlQuiz = "";
    if (questions.length === 0) {
        htmlQuiz = "<p style='color:#64748b;'>Aucun quiz généré.</p>";
    } else {
        htmlQuiz = questions.map((q, idx) => {
            const intitule = (q.question && q.question[lang]) ? q.question[lang] : (q.question ? q.question.fr : "Question");
            const opts = (q.options && q.options[lang]) ? q.options[lang] : (q.options ? q.options.fr : []);
            const explic = (q.explication && q.explication[lang]) ? q.explication[lang] : (q.explication ? q.explication.fr : "");

            const optsHtml = opts.map((opt, oIdx) => {
                const estBonne = (oIdx === q.reponse_correcte_index);
                return `
                    <div style="padding:6px 10px; margin:4px 0; border-radius:6px; background:${estBonne ? '#ecfdf5' : '#f8fafc'}; border:1px solid ${estBonne ? '#10b981' : '#e2e8f0'}; font-weight:${estBonne ? 'bold' : 'normal'}; color:${estBonne ? '#065f46' : 'inherit'};">
                        ${String.fromCharCode(65 + oIdx)}. ${opt} ${estBonne ? '✅ (Bonne réponse)' : ''}
                    </div>
                `;
            }).join('');

            return `
                <div class="quiz-item-apercu">
                    <strong style="color:var(--primary); font-size:1.05em;">Question ${idx + 1} :</strong> ${intitule}
                    <div style="margin:10px 0;">${optsHtml}</div>
                    <div style="background:#f1f5f9; padding:8px 12px; border-radius:6px; font-size:0.9em; color:#334155;">
                        💡 <strong>Explication :</strong> ${explic}
                    </div>
                </div>
            `;
        }).join('');
    }

    const exos = data.blocs_exercices || [];
    const htmlExos = exos.map((b, bIdx) => `
        <div style="background:white; border:1px solid #cbd5e0; border-radius:8px; padding:14px; margin-bottom:12px;">
            <h4 style="margin:0 0 6px 0; color:var(--primary);">${b.titre || `Exercice ${bIdx + 1}`} - <span style="font-weight:normal; font-size:0.9em; color:#64748b;">${b.consigne || ''}</span></h4>
            <ol style="margin:8px 0 0 20px; line-height:1.8;">
                ${(b.questions || []).map(q => `<li>${q.q}</li>`).join('')}
            </ol>
        </div>
    `).join('') || "<p style='color:#64748b;'>Aucun bloc d'exercices.</p>";

    return `
        <div class="apercu-section" style="border-left: 6px solid #8b5cf6;">
            <h3>📖 1. Fiches de Cours Théorique</h3>
            ${htmlCours}
        </div>

        <div class="apercu-section" style="border-left: 6px solid #3b82f6;">
            <h3>💡 2. Points Importants de la Leçon (Synthèse)</h3>
            <ul style="margin:6px 0 0 20px; line-height:1.8;">
                ${htmlPoints}
            </ul>
        </div>

        <div class="apercu-section" style="border-left: 6px solid #10b981;">
            <h3>🧠 3. Quiz Théorique Intermédiaire (${questions.length} questions)</h3>
            ${htmlQuiz}
        </div>

        <div class="apercu-section" style="border-left: 6px solid #f59e0b;">
            <h3>✍️ 4. Blocs d'Exercices Pratiques (${exos.length} blocs)</h3>
            ${htmlExos}
        </div>
    `;
}

function construireFormulaireEditionManuel(data, lang) {
    if (!data) return "<p>Aucune donnée.</p>";

    const slides = (data.bloc_cours && data.bloc_cours.slides) ? data.bloc_cours.slides : [];
    const htmlCours = slides.map((s, idx) => {
        const champContenu = (lang === 'ko') ? 'contenu_ko' : (lang === 'en' ? 'contenu_en' : 'contenu_fr');
        const valTexte = s[champContenu] || "";
        return `
            <div class="edit-box-item">
                <label>Titre Fiche ${idx + 1} :</label>
                <input type="text" value="${s.titre || ''}" oninput="donneesIAPret.bloc_cours.slides[${idx}].titre = this.value">
                <label style="margin-top:8px;">Texte d'explication (${lang.toUpperCase()}) :</label>
                <textarea rows="4" oninput="donneesIAPret.bloc_cours.slides[${idx}]['${champContenu}'] = this.value">${valTexte}</textarea>
            </div>
        `;
    }).join('');

    const points = (data.points_importants && data.points_importants[lang]) ? data.points_importants[lang] : [];
    const textePoints = points.join('\n');

    const questions = (data.quiz_theorique && data.quiz_theorique.questions) ? data.quiz_theorique.questions : [];
    const htmlQuiz = questions.map((q, qIdx) => {
        const qTxt = (q.question && q.question[lang]) ? q.question[lang] : "";
        const expTxt = (q.explication && q.explication[lang]) ? q.explication[lang] : "";
        const opts = (q.options && q.options[lang]) ? q.options[lang] : [];

        const optsInputs = opts.map((opt, oIdx) => `
            <div style="display:flex; align-items:center; gap:8px; margin-top:6px;">
                <input type="radio" name="bonnerep_${qIdx}" value="${oIdx}" ${oIdx === q.reponse_correcte_index ? 'checked' : ''} onchange="donneesIAPret.quiz_theorique.questions[${qIdx}].reponse_correcte_index = ${oIdx}">
                <input type="text" value="${opt}" oninput="donneesIAPret.quiz_theorique.questions[${qIdx}].options['${lang}'][${oIdx}] = this.value" placeholder="Option ${String.fromCharCode(65 + oIdx)}">
            </div>
        `).join('');

        return `
            <div class="edit-box-item">
                <label>Question ${qIdx + 1} (${lang.toUpperCase()}) :</label>
                <input type="text" value="${qTxt}" oninput="donneesIAPret.quiz_theorique.questions[${qIdx}].question['${lang}'] = this.value">
                <label style="margin-top:8px;">Options de réponse (Cochez la bonne) :</label>
                ${optsInputs}
                <label style="margin-top:8px;">Explication (${lang.toUpperCase()}) :</label>
                <textarea rows="2" oninput="donneesIAPret.quiz_theorique.questions[${qIdx}].explication['${lang}'] = this.value">${expTxt}</textarea>
            </div>
        `;
    }).join('');

    const exos = data.blocs_exercices || [];
    const htmlExos = exos.map((b, bIdx) => {
        const phrasesTexte = (b.questions || []).map(q => q.q).join('\n');
        return `
            <div class="edit-box-item">
                <label>Titre de l'exercice :</label>
                <input type="text" value="${b.titre || ''}" oninput="donneesIAPret.blocs_exercices[${bIdx}].titre = this.value">
                <label style="margin-top:8px;">Consigne :</label>
                <input type="text" value="${b.consigne || ''}" oninput="donneesIAPret.blocs_exercices[${bIdx}].consigne = this.value">
                <label style="margin-top:8px;">Questions / Phrases de l'exercice (une par ligne) :</label>
                <textarea rows="6" oninput="donneesIAPret.blocs_exercices[${bIdx}].questions = this.value.split('\\n').filter(l=>l.trim().length>0).map(l=>({q: l.trim()}))">${phrasesTexte}</textarea>
            </div>
        `;
    }).join('');

    return `
        <div style="background:#eff6ff; border:2px solid #93c5fd; padding:12px 18px; border-radius:8px; margin-bottom:15px; font-weight:600; color:#1e40af;">
            ✏️ Mode Édition actif (${lang.toUpperCase()}) : modifiez directement les textes au clavier.
        </div>

        <div class="apercu-section" style="border-left: 6px solid #8b5cf6;">
            <h3>📖 1. Fiches de Cours Théorique</h3>
            ${htmlCours}
        </div>

        <div class="apercu-section" style="border-left: 6px solid #3b82f6;">
            <h3>💡 2. Points Importants de la Leçon (Une puce par ligne)</h3>
            <textarea rows="5" oninput="donneesIAPret.points_importants['${lang}'] = this.value.split('\\n').filter(l=>l.trim().length>0)">${textePoints}</textarea>
        </div>

        <div class="apercu-section" style="border-left: 6px solid #10b981;">
            <h3>🧠 3. Quiz Théorique Intermédiaire</h3>
            ${htmlQuiz}
        </div>

        <div class="apercu-section" style="border-left: 6px solid #f59e0b;">
            <h3>✍️ 4. Blocs d'Exercices Pratiques</h3>
            ${htmlExos}
        </div>
    `;
}

window.sauvegarderDevoirIA = async function() {
    if (!donneesIAPret) return;

    const titreFinal = document.getElementById('ia-titre').value.trim() || donneesIAPret.titre;

    const objetSauvegarde = {
        titre: titreFinal,
        typeDevoir: "chapitre_cours",
        points_importants: donneesIAPret.points_importants || null,
        quiz_theorique: donneesIAPret.quiz_theorique || null,
        bloc_cours: donneesIAPret.bloc_cours || null,
        blocs_exercices: donneesIAPret.blocs_exercices || [],
        dateCreation: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (coursEnEditionId) {
        await db.collection("devoirs").doc(coursEnEditionId).update(objetSauvegarde);

        const snap = await db.collection("assignations").where("devoirId", "==", coursEnEditionId).get();
        const batch = db.batch();
        snap.forEach(doc => {
            batch.update(doc.ref, {
                devoirTitre: titreFinal,
                points_importants: objetSauvegarde.points_importants,
                quiz_theorique: objetSauvegarde.quiz_theorique,
                bloc_cours: objetSauvegarde.bloc_cours,
                blocs_exercices: objetSauvegarde.blocs_exercices
            });
        });
        await batch.commit();

        alert("✅ Cours existant mis à jour dans la banque et chez les élèves !");
    } else {
        await db.collection("devoirs").add(objetSauvegarde);
        alert("✅ Chapitre complet enregistré dans la banque !");
    }

    document.getElementById('card-resultat-ia').style.display = "none";
    basculerOnglet('tab-devoirs', document.getElementById('btn-tab-devoirs'));
};

window.editerCoursDepuisBanque = function(devoirId) {
    const d = devoirsMap[devoirId];
    if (!d) return;

    coursEnEditionId = devoirId;
    donneesIAPret = JSON.parse(JSON.stringify(d));
    document.getElementById('ia-titre').value = d.titre || "";

    modeEditionManuelActif = true;
    mettreAJourBoutonModeEdition();

    basculerOnglet('tab-pdf', document.getElementById('btn-tab-pdf'));
    changerLangueApercu('fr', document.getElementById('subtab-btn-fr'));
    document.getElementById('card-resultat-ia').style.display = "block";
};

window.ouvrirApercuCoursDepuisBanque = function(devoirId) {
    coursApercuModal = devoirsMap[devoirId];
    if (!coursApercuModal) return;

    document.getElementById('modal-apercu-titre').textContent = coursApercuModal.titre;
    changerLangueModalApercu('fr');
    document.getElementById('modal-apercu-cours').classList.add('ouverte');
};

window.changerLangueModalApercu = function(lang) {
    document.getElementById('btn-modal-fr').className = "subtab-lang-btn" + (lang === 'fr' ? ' active' : '');
    document.getElementById('btn-modal-en').className = "subtab-lang-btn" + (lang === 'en' ? ' active' : '');
    document.getElementById('btn-modal-ko').className = "subtab-lang-btn" + (lang === 'ko' ? ' active' : '');
    document.getElementById('modal-apercu-contenu').innerHTML = construireHtmlContenuCours(coursApercuModal, lang);
};

window.voirRetoursEmmaProf = function(assignationId) {
    const a = assignationsMap[assignationId];
    if (!a) return;

    const modal = document.getElementById('modal-fautes');
    document.getElementById('modal-titre').textContent = `Corrections Emma - ${a.eleveCode}`;

    const retours = a.retoursEmma || {};
    let html = `<div style="line-height:1.7;">`;

    (a.questions || []).forEach((q, idx) => {
        const r = retours[idx];
        html += `<div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:15px; margin-bottom:15px;">
            <strong style="color:var(--primary);">Q${idx+1} : ${q}</strong><br>`;
        if (r) {
            html += `👀 <strong>Ta phrase</strong> : "${r.phrase_eleve}"<br>
                     💬 <strong>Emma</strong> : ${r.reponse_amicale}<br>`;
            if (r.traduction_reponse) html += `🌐 <em>Traduction Emma</em> : ${r.traduction_reponse}<br>`;
            html += `✅ <strong>Ce qui est bien</strong> : ${r.ce_qui_est_bien}<br>
                     ❌ <strong>Fautes</strong> : ${r.les_fautes}<br>
                     ➡️ <strong>Corrigé</strong> : <strong style="color:var(--success);">${r.phrase_corrigee}</strong><br>`;
            if (r.traduction_phrase_corrigee) html += `🌐 <em>Traduction corrigé</em> : ${r.traduction_phrase_corrigee}<br>`;
            html += `💡 <strong>Améliorations</strong> : ${r.ameliorations}`;

            if (r.argument_pour || r.argument_contre) {
                html += `
                    <div style="margin-top:10px; background:#faf5ff; border:1px solid #c084fc; border-radius:6px; padding:10px;">
                        <strong style="color:#6b21a8;">🎓 Suggestions d'arguments DELF B1/B2 :</strong><br>
                        ${r.argument_pour ? `➕ <strong>Pour :</strong> ${r.argument_pour}<br>` : ''}
                        ${r.argument_contre ? `⚖️ <strong>Contre :</strong> ${r.argument_contre}<br>` : ''}
                    </div>
                `;
            }
        } else {
            html += `<span style="color:#aaa;">(Pas encore répondu)</span>`;
        }
        html += `</div>`;
    });
    html += `</div>`;
    document.getElementById('modal-contenu').innerHTML = html;
    modal.classList.add('ouverte');
};

window.filtrerBanqueDevoirs = function() {
    const input = document.getElementById('input-recherche-banque');
    texteRechercheBanque = (input ? input.value : '').trim().toLowerCase();
    afficherTableauBanqueDevoirs();
};

window.changerFiltreTypeBanque = function(type, btn) {
    filtreTypeBanqueActif = type;
    document.querySelectorAll('.btn-filtre-banque').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    afficherTableauBanqueDevoirs();
};

function afficherTableauBanqueDevoirs() {
    const tbody = document.getElementById('table-devoirs-corps');
    if (!tbody) return;
    tbody.innerHTML = "";

    let devoirsAffiches = listeDevoirs.filter(d => {
        const matchType = (filtreTypeBanqueActif === 'tous') || (d.typeDevoir === filtreTypeBanqueActif);
        const matchTexte = !texteRechercheBanque || (d.titre || '').toLowerCase().includes(texteRechercheBanque);
        return matchType && matchTexte;
    });

    const nbTous = listeDevoirs.length;
    const nbCours = listeDevoirs.filter(d => d.typeDevoir === 'chapitre_cours').length;
    const nbEmma = listeDevoirs.filter(d => d.typeDevoir === 'emma').length;
    const nbInteractifs = listeDevoirs.filter(d => d.typeDevoir === 'interactif').length;

    const elTous = document.getElementById('compteur-filtre-tous');
    const elCours = document.getElementById('compteur-filtre-cours');
    const elEmma = document.getElementById('compteur-filtre-emma');
    const elInteractifs = document.getElementById('compteur-filtre-interactifs');

    if (elTous) elTous.textContent = `(${nbTous})`;
    if (elCours) elCours.textContent = `(${nbCours})`;
    if (elEmma) elEmma.textContent = `(${nbEmma})`;
    if (elInteractifs) elInteractifs.textContent = `(${nbInteractifs})`;

    if (devoirsAffiches.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#64748b; padding:25px;">Aucun devoir ne correspond à votre recherche.</td></tr>`;
        return;
    }

    devoirsAffiches.forEach(d => {
        const tr = document.createElement('tr');
        let badge = "";
        let info = "";
        let boutonsHtml = "";

        if (d.typeDevoir === "emma") {
            badge = `<span class="badge-emma">🤖 Emma IA</span> ${d.modeDelf ? '<span class="badge-delf">🎓 DELF</span>' : ''}`;
            info = `${(d.questions || []).length} questions ${d.modeDelf ? 'd\'argumentation' : 'conversationnelles'}`;
            boutonsHtml = `
                <button type="button" class="btn btn-sm btn-success" onclick="ouvrirModalAssignation('${d.id}')">➕ Assigner</button>
                <button type="button" class="btn btn-sm btn-danger" onclick="supprimerDevoir('${d.id}')">🗑️</button>
            `;
        } else if (d.typeDevoir === "interactif") {
            badge = `<span class="badge-interactif">⚡ Interactif</span>`;
            info = `${(d.phrases || []).length} phrases d'exercices`;
            boutonsHtml = `
                <button type="button" class="btn btn-sm btn-success" onclick="ouvrirModalAssignation('${d.id}')">➕ Assigner</button>
                <button type="button" class="btn btn-sm btn-danger" onclick="supprimerDevoir('${d.id}')">🗑️</button>
            `;
        } else {
            badge = `<span class="badge-chapitre">📖 Cours + Quiz</span>`;
            info = `Fiches de cours + Quiz + ${(d.blocs_exercices || []).length} blocs`;
            boutonsHtml = `
                <button type="button" class="btn btn-sm btn-purple" onclick="editerCoursDepuisBanque('${d.id}')">✏️ Éditer</button>
                <button type="button" class="btn btn-sm btn-secondary" onclick="ouvrirApercuCoursDepuisBanque('${d.id}')">👁️ Aperçu</button>
                <button type="button" class="btn btn-sm btn-success" onclick="ouvrirModalAssignation('${d.id}')">➕ Assigner</button>
                <button type="button" class="btn btn-sm btn-danger" onclick="supprimerDevoir('${d.id}')">🗑️</button>
            `;
        }

        tr.innerHTML = `
            <td><strong style="color:var(--primary); font-size:1.05em;">${d.titre}</strong></td>
            <td>${badge}</td>
            <td>${info}</td>
            <td style="display:flex; gap:6px; flex-wrap:wrap;">
                ${boutonsHtml}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const cleStockee = localStorage.getItem("nanoGptKey");
    if (cleStockee && document.getElementById('nanogpt-key-input')) {
        document.getElementById('nanogpt-key-input').value = cleStockee;
    }

    if (!db) return;

    db.collection("eleves").orderBy("dateCreation", "desc").onSnapshot(snap => {
        listeEleves = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        filtrerEleves();
    });

    db.collection("devoirs").orderBy("dateCreation", "desc").onSnapshot(snap => {
        listeDevoirs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        devoirsMap = {};
        listeDevoirs.forEach(d => { devoirsMap[d.id] = d; });
        afficherTableauBanqueDevoirs();
    });

    db.collection("assignations").orderBy("dateAssignation", "desc").onSnapshot(snap => {
        listeAssignations = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        assignationsMap = {};
        listeAssignations.forEach(a => { assignationsMap[a.id] = a; });

        afficherTableauEleves();
        afficherDerniersDevoirsGlobaux();
        if (eleveSelectionne) afficherDevoirsFicheEleve();
    });
});
