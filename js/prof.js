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
    } ca
