let langueActuelle = localStorage.getItem("langEleve") || "";
let codeEleveActuel = localStorage.getItem("codeEleve") || "";
let modeSevereActif = false;

let assignationsMap = {};
let assignationActive = null;
let devoirSourcePourEntrainement = null;

let scoreInteractif = 0;
let erreursInteractif = 0;
let reponsesValideesInteractif = {};
let fautesInteractif = [];

let indexSlideCoursActif = 0;

function t(cle) {
    const lang = langueActuelle || 'fr';
    return (i18n[lang] && i18n[lang][cle]) ? i18n[lang][cle] : (i18n['fr'][cle] || cle);
}

function appliquerLangue() {
    const lang = langueActuelle || 'fr';
    const d = i18n[lang] || i18n.fr;

    const setTxt = (id, txt) => { 
        const el = document.getElementById(id); 
        if (el) el.textContent = txt; 
    };

    setTxt('txt-select-lang', d.select_lang);
    setTxt('txt-login-title', d.login_title);
    setTxt('txt-login-desc', d.login_desc);
    setTxt('btn-login', d.login_btn);
    setTxt('txt-welcome-heading', d.welcome_heading);
    setTxt('txt-severe-mode', d.severe_mode);
    setTxt('btn-continue-welcome', d.continue_btn);
    setTxt('txt-logged-as', d.logged_as);
    setTxt('btn-logout', d.logout_btn);
    setTxt('txt-tab-afaire', d.tab_afaire);
    setTxt('txt-tab-faits', d.tab_faits);
    setTxt('txt-score-label', d.score_label);
    setTxt('txt-errors-label', d.errors_label);
    setTxt('btn-submit-interactif', d.btn_submit);
    setTxt('txt-retour-devoirs', d.retourDevoirs);
    setTxt('emma-description', d.descriptionEmma);
    setTxt('txt-terminer-emma', d.btnTerminerEmma);

    const inp = document.getElementById('code-input');
    if (inp) inp.placeholder = "EX: LUCAS01";
}

window.choisirLangue = function(lang) {
    langueActuelle = lang;
    try { localStorage.setItem("langEleve", lang); } catch(e) {}
    appliquerLangue();
    verifierSession();
};

window.retourChoixLangue = function() {
    document.getElementById('ecran-langue').style.display = 'block';
    document.getElementById('ecran-login').style.display = 'none';
    document.getElementById('ecran-bienvenue').style.display = 'none';
    document.getElementById('header-eleve').style.display = 'none';
    document.getElementById('ecran-tableau-de-bord').style.display = 'none';
    document.getElementById('vue-emma-ia').style.display = 'none';
    document.getElementById('vue-exo-interactif').style.display = 'none';
    document.getElementById('vue-chapitre-blocs').style.display = 'none';
    document.getElementById('vue-contenu-bloc-chapitre').style.display = 'none';
};

window.verifierSession = function() {
    if (!langueActuelle) return retourChoixLangue();
    appliquerLangue();
    document.getElementById('ecran-langue').style.display = 'none';

    if (!codeEleveActuel) {
        document.getElementById('ecran-login').style.display = 'block';
        document.getElementById('ecran-bienvenue').style.display = 'none';
        document.getElementById('header-eleve').style.display = 'none';
        document.getElementById('ecran-tableau-de-bord').style.display = 'none';
        return;
    }

    document.getElementById('ecran-login').style.display = 'none';
    document.getElementById('header-eleve').style.display = 'flex';
    document.getElementById('affichage-code-eleve').textContent = codeEleveActuel;
    document.getElementById('ecran-tableau-de-bord').style.display = 'block';
    ecouterAssignations();
};

window.seConnecter = function() {
    const input = document.getElementById('code-input');
    const saisie = input ? input.value.trim().toUpperCase() : "";
    if (!saisie) return alert("Veuillez entrer votre code élève.");

    codeEleveActuel = saisie;
    try { localStorage.setItem("codeEleve", codeEleveActuel); } catch(e) {}

    document.getElementById('ecran-login').style.display = 'none';
    document.getElementById('bienvenue-nom-user').textContent = codeEleveActuel;
    
    modeSevereActif = false;
    const check = document.getElementById('check-severe-mode');
    if (check) check.checked = false;
    
    document.getElementById('ecran-bienvenue').style.display = 'block';
};

window.toggleSevereMode = function() {
    const check = document.getElementById('check-severe-mode');
    if (check) check.checked = !check.checked;
};

window.validerBienvenue = function() {
    const check = document.getElementById('check-severe-mode');
    modeSevereActif = check ? check.checked : false;

    document.getElementById('ecran-bienvenue').style.display = 'none';
    verifierSession();
};

window.deconnexion = function() {
    if (confirm("Changer de compte ?")) {
        try { localStorage.removeItem("codeEleve"); } catch(e) {}
        codeEleveActuel = "";
        verifierSession();
    }
};

window.changerOnglet = function(tab) {
    document.getElementById('btn-tab-afaire').classList.toggle('active', tab === 'afaire');
    document.getElementById('btn-tab-faits').classList.toggle('active', tab === 'faits');
    document.getElementById('panel-afaire').classList.toggle('active', tab === 'afaire');
    document.getElementById('panel-faits').classList.toggle('active', tab === 'faits');
};

function ecouterAssignations() {
    if (!db) return;
    db.collection("assignations").onSnapshot(snapshot => {
        const tous = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        assignationsMap = {};
        tous.forEach(d => { assignationsMap[d.id] = d; });

        const mesDevoirs = tous.filter(d => d.eleveCode && d.eleveCode.toUpperCase() === codeEleveActuel.toUpperCase());
        const aFaire = mesDevoirs.filter(d => d.statut !== 'termine');
        const faits = mesDevoirs.filter(d => d.statut === 'termine');

        document.getElementById('badge-nb-afaire').textContent = aFaire.length;
        document.getElementById('badge-nb-faits').textContent = faits.length;

        const renderCard = (d, estFait) => {
            let badge = "";
            let boutonPrincipal = "";

            if (d.typeDevoir === "emma") {
                badge = `<span class="badge-type" style="background:#fae8ff; color:#86198f;">🤖 Emma IA</span> ${d.modeDelf ? '<span class="badge-delf">🎓 DELF</span>' : ''}`;
                boutonPrincipal = `<button type="button" class="btn btn-purple" onclick="ouvrirDevoirEmma('${d.id}')">${t('btnParlerEmma')}</button>`;
            } else if (d.typeDevoir === "chapitre_cours") {
                badge = `<span class="badge-type" style="background:#e0e7ff; color:#3730a3;">📖 Cours & Quiz</span>`;
                boutonPrincipal = `<button type="button" class="btn btn-purple" onclick="ouvrirMenuChapitreBlocs('${d.id}')">${t('btnOuvrirCours')}</button>`;
            } else {
                const estAuto = d.estAutoEntrainement ? "✨ Entraînement" : "⚡ Devoir";
                badge = `<span class="badge-type" style="background:#fef3c7; color:#92400e;">${estAuto}</span>`;
                boutonPrincipal = `<button type="button" class="btn" onclick="ouvrirDevoirInteractif('${d.id}')">${t('btnCommencer')}</button>`;
            }

            let btnEntrainementHtml = "";
            if (!d.estAutoEntrainement) {
                btnEntrainementHtml = `<button type="button" class="btn btn-secondary btn-sm" onclick="ouvrirModalEntrainement('${d.id}')">${t('btnEntrainement')}</button>`;
            }

            return `
                <div class="devoir-card ${estFait ? 'fait' : ''}">
                    <div>
                        <h3 style="margin:0 0 6px 0; color:var(--primary);">${d.devoirTitre}</h3>
                        <div>${badge}</div>
                    </div>
                    <div style="display:flex; gap:8px; flex-wrap:wrap;">
                        ${btnEntrainementHtml}
                        ${boutonPrincipal}
                    </div>
                </div>
            `;
        };

        const cAFaire = document.getElementById('conteneur-afaire');
        cAFaire.innerHTML = (aFaire.length === 0) 
            ? `<div style="background:white; padding:35px; text-align:center; border-radius:12px; color:#64748b;">${t('aucunDevoir')}</div>` 
            : aFaire.map(d => renderCard(d, false)).join('');

        const cFaits = document.getElementById('conteneur-faits');
        cFaits.innerHTML = (faits.length === 0) 
            ? `<div style="background:white; padding:35px; text-align:center; border-radius:12px; color:#64748b;">Aucun devoir terminé pour l'instant.</div>` 
            : faits.map(d => renderCard(d, true)).join('');
    });
}

// MODULE CHAPITRE
window.ouvrirMenuChapitreBlocs = function(id) {
    const d = assignationsMap[id];
    if (!d) return;

    assignationActive = d;
    document.getElementById('ecran-tableau-de-bord').style.display = 'none';
    document.getElementById('vue-chapitre-blocs').style.display = 'block';
    document.getElementById('chapitre-titre').textContent = d.devoirTitre;

    const conteneur = document.getElementById('chapitre-liste-blocs');
    conteneur.innerHTML = "";

    const slides = (d.bloc_cours && d.bloc_cours.slides) ? d.bloc_cours.slides : [];
    const cardCours = document.createElement('div');
    cardCours.className = "bloc-nav-card";
    cardCours.innerHTML = `
        <div>
            <strong style="font-size:1.15em; color:var(--primary);">${t('moduleCours')}</strong>
            <div style="color:#64748b; font-size:0.9em;">Explications théoriques détaillées (${slides.length} fiches)</div>
        </div>
        <button type="button" class="btn btn-purple" onclick="afficherBlocCours()">Lire le cours ▶</button>
    `;
    conteneur.appendChild(cardCours);

    const points = d.points_importants || {};
    const lang = (langueActuelle || 'fr').toLowerCase();
    const listeCles = points[lang] || points['fr'] || [];
    if (listeCles.length > 0) {
        const cardPoints = document.createElement('div');
        cardPoints.className = "points-cles-box";
        cardPoints.innerHTML = `
            <h3>${t('modulePointsCles')}</h3>
            <ul>${listeCles.map(pt => `<li>${pt}</li>`).join('')}</ul>
        `;
        conteneur.appendChild(cardPoints);
    }

    if (d.quiz_theorique && (d.quiz_theorique.questions || []).length > 0) {
        const cardQuiz = document.createElement('div');
        cardQuiz.className = "bloc-nav-card";
        cardQuiz.innerHTML = `
            <div>
                <strong style="font-size:1.15em; color:var(--primary);">${t('moduleQuizTheorique')}</strong>
                <div style="color:#64748b; font-size:0.9em;">Validez votre compréhension avant de faire les exercices</div>
            </div>
            <button type="button" class="btn btn-success" onclick="afficherBlocQuizTheorique()">Faire le quiz ▶</button>
        `;
        conteneur.appendChild(cardQuiz);
    }

    (d.blocs_exercices || []).forEach((b, idx) => {
        const cardExo = document.createElement('div');
        cardExo.className = "bloc-nav-card";
        cardExo.innerHTML = `
            <div>
                <strong style="font-size:1.15em; color:var(--primary);">${b.titre || `Exercice ${idx + 1}`}</strong>
                <div style="color:#64748b; font-size:0.9em;">Pratique d'application : ${(b.questions || []).length} questions</div>
            </div>
            <button type="button" class="btn" onclick="afficherBlocExercice(${idx})">Commencer ▶</button>
        `;
        conteneur.appendChild(cardExo);
    });
};

window.retourMenuBlocs = function() {
    document.getElementById('vue-contenu-bloc-chapitre').style.display = 'none';
    document.getElementById('vue-chapitre-blocs').style.display = 'block';
};

window.afficherBlocCours = function() {
    document.getElementById('vue-chapitre-blocs').style.display = 'none';
    document.getElementById('vue-contenu-bloc-chapitre').style.display = 'block';
    document.getElementById('chapitre-zone-cours').style.display = 'block';
    document.getElementById('chapitre-zone-quiz-theorique').style.display = 'none';
    document.getElementById('chapitre-zone-exercice').style.display = 'none';

    document.getElementById('chapitre-bloc-actif-titre').textContent = t('moduleCours');

    indexSlideCoursActif = 0;
    afficherFicheCoursCourante();
};

function afficherFicheCoursCourante() {
    const slides = (assignationActive.bloc_cours && assignationActive.bloc_cours.slides) ? assignationActive.bloc_cours.slides : [];
    if (slides.length === 0) {
        document.getElementById('cours-slide-contenu').innerHTML = "<p>Aucune fiche disponible.</p>";
        return;
    }

    if (indexSlideCoursActif < 0) indexSlideCoursActif = 0;
    if (indexSlideCoursActif >= slides.length) indexSlideCoursActif = slides.length - 1;

    const s = slides[indexSlideCoursActif];
    const lang = (langueActuelle || 'fr').toLowerCase();

    let texte = s.contenu_fr || "";
    if (lang === 'ko' && s.contenu_ko) texte = s.contenu_ko;
    else if (lang === 'en' && s.contenu_en) texte = s.contenu_en;

    document.getElementById('cours-slide-titre').textContent = s.titre || `Fiche ${indexSlideCoursActif + 1}`;
    document.getElementById('cours-slide-compteur').textContent = `Fiche ${indexSlideCoursActif + 1} / ${slides.length}`;
    document.getElementById('cours-slide-contenu').textContent = texte;

    const btnPrec = document.getElementById('btn-slide-prec');
    btnPrec.style.display = (indexSlideCoursActif === 0) ? 'none' : 'inline-block';

    const btnSuiv = document.getElementById('btn-slide-suiv');
    btnSuiv.style.display = (indexSlideCoursActif === slides.length - 1) ? 'none' : 'inline-block';
}

window.naviguerSlideCours = function(delta) {
    indexSlideCoursActif += delta;
    afficherFicheCoursCourante();
};

window.validerLectureCours = function() {
    alert("✅ Cours validé !");
    retourMenuBlocs();
};

window.afficherBlocQuizTheorique = function() {
    document.getElementById('vue-chapitre-blocs').style.display = 'none';
    document.getElementById('vue-contenu-bloc-chapitre').style.display = 'block';
    document.getElementById('chapitre-zone-cours').style.display = 'none';
    document.getElementById('chapitre-zone-quiz-theorique').style.display = 'block';
    document.getElementById('chapitre-zone-exercice').style.display = 'none';

    document.getElementById('chapitre-bloc-actif-titre').textContent = t('moduleQuizTheorique');

    const quiz = assignationActive.quiz_theorique || {};
    const questions = quiz.questions || [];
    const lang = (langueActuelle || 'fr').toLowerCase();
    const conteneur = document.getElementById('quiz-theorique-conteneur');
    conteneur.innerHTML = "";

    questions.forEach((q, qIdx) => {
        const div = document.createElement('div');
        div.className = "quiz-item-card";

        const intitule = (q.question && q.question[lang]) ? q.question[lang] : (q.question ? q.question.fr : "Question");
        const opts = (q.options && q.options[lang]) ? q.options[lang] : (q.options ? q.options.fr : []);

        let optionsHtml = opts.map((opt, optIdx) => `
            <button type="button" class="quiz-option-btn" id="qbtn-${qIdx}-${optIdx}" onclick="validerOptionQuiz(${qIdx}, ${optIdx})">
                ${String.fromCharCode(65 + optIdx)}. ${opt}
            </button>
        `).join('');

        div.innerHTML = `
            <div class="quiz-question-txt">${qIdx + 1}. ${intitule}</div>
            <div>${optionsHtml}</div>
            <div id="quiz-explic-${qIdx}" class="quiz-explication-box" style="display:none;"></div>
        `;
        conteneur.appendChild(div);
    });
};

window.validerOptionQuiz = function(qIdx, optIdx) {
    const quiz = assignationActive.quiz_theorique || {};
    const q = (quiz.questions || [])[qIdx];
    if (!q) return;

    const lang = (langueActuelle || 'fr').toLowerCase();
    const estCorrect = (optIdx === q.reponse_correcte_index);

    const opts = (q.options && q.options[lang]) ? q.options[lang] : (q.options ? q.options.fr : []);
    opts.forEach((_, idx) => {
        const btn = document.getElementById(`qbtn-${qIdx}-${idx}`);
        if (btn) btn.disabled = true;
    });

    const btnChoisi = document.getElementById(`qbtn-${qIdx}-${optIdx}`);
    const btnVrai = document.getElementById(`qbtn-${qIdx}-${q.reponse_correcte_index}`);

    if (btnVrai) btnVrai.className = "quiz-option-btn correct";
    if (!estCorrect && btnChoisi) btnChoisi.className = "quiz-option-btn incorrect";

    const zoneExp = document.getElementById(`quiz-explic-${qIdx}`);
    const texteExp = (q.explication && q.explication[lang]) ? q.explication[lang] : (q.explication ? q.explication.fr : "");

    zoneExp.innerHTML = `
        <strong>${estCorrect ? '✅ ' + t('quizBravo') : '❌ ' + t('quizErreur')}</strong><br>
        ${texteExp}
    `;
    zoneExp.style.display = "block";
};

// EXERCICES D'APPLICATION
window.blocExerciceIndexActif = 0;

window.afficherBlocExercice = function(blocIdx) {
    window.blocExerciceIndexActif = blocIdx;
    document.getElementById('vue-chapitre-blocs').style.display = 'none';
    document.getElementById('vue-contenu-bloc-chapitre').style.display = 'block';
    document.getElementById('chapitre-zone-cours').style.display = 'none';
    document.getElementById('chapitre-zone-quiz-theorique').style.display = 'none';
    document.getElementById('chapitre-zone-exercice').style.display = 'block';

    const bloc = assignationActive.blocs_exercices[blocIdx];
    document.getElementById('chapitre-bloc-actif-titre').textContent = bloc.titre || `Exercice ${blocIdx + 1}`;

    const conteneur = document.getElementById('chapitre-questions-conteneur');
    conteneur.innerHTML = "";

    if (bloc.consigne) {
        const pConsigne = document.createElement('p');
        pConsigne.style.color = "#64748b";
        pConsigne.style.fontStyle = "italic";
        pConsigne.style.marginBottom = "20px";
        pConsigne.textContent = bloc.consigne;
        conteneur.appendChild(pConsigne);
    }

    const suivi = assignationActive.suiviBlocs || {};
    const reponses = (suivi[bloc.id] && suivi[bloc.id].reponses) ? suivi[bloc.id].reponses : {};

    (bloc.questions || []).forEach((qItem, idx) => {
        const item = document.createElement('div');
        item.className = "phrase-item";

        const texteQuestion = qItem.q || "";

        if (/_{2,}/.test(texteQuestion)) {
            const parts = texteQuestion.split(/_{2,}/);
            let html = `<span>${idx + 1}.</span> `;
            for (let i = 0; i < parts.length; i++) {
                html += parts[i];
                if (i < parts.length - 1) {
                    const cleTrou = `${idx}_trou_${i}`;
                    const val = reponses[cleTrou] || "";
                    html += ` <input type="text" class="input-calme" id="champ-trou-${idx}-${i}" value="${val}" placeholder="..." oninput="noterReponseExercice('${bloc.id}', '${cleTrou}', this.value)"> `;
                }
            }
            html += ` <button type="button" class="btn btn-sm btn-secondary" id="btn-save-ligne-${idx}" onclick="sauvegarderLigneUnique('${bloc.id}', ${idx})" style="margin-left:8px;">💾 Sauvegarder</button>`;
            item.innerHTML = html;
        } else {
            const cleLibre = `${idx}_reponse_libre`;
            const valLibre = reponses[cleLibre] || "";

            item.innerHTML = `
                <div style="font-weight:bold; color:var(--primary); font-size:1.05em; margin-bottom:8px;">
                    ${idx + 1}. ${texteQuestion}
                </div>
                <div style="display:flex; gap:10px; align-items:flex-end;">
                    <textarea class="input-calme" id="champ-libre-${idx}" style="flex:1; box-sizing:border-box; font-family:inherit; min-height:65px; line-height:1.6;" placeholder="Tapez votre réponse en français..." oninput="noterReponseExercice('${bloc.id}', '${cleLibre}', this.value)">${valLibre}</textarea>
                    <button type="button" class="btn btn-sm btn-secondary" id="btn-save-ligne-${idx}" onclick="sauvegarderLigneUnique('${bloc.id}', ${idx})" style="height:42px;">💾 Sauvegarder</button>
                </div>
            `;
        }

        conteneur.appendChild(item);
    });

    const barActions = document.createElement('div');
    barActions.style.display = "flex";
    barActions.style.justifyContent = "space-between";
    barActions.style.alignItems = "center";
    barActions.style.marginTop = "30px";
    barActions.style.paddingTop = "20px";
    barActions.style.borderTop = "1px solid #e2e8f0";
    barActions.style.flexWrap = "wrap";
    barActions.style.gap = "10px";

    barActions.innerHTML = `
        <button type="button" class="btn btn-warning" onclick="sauvegarderProgressionExercice(false)">💾 Sauvegarder tout le bloc</button>
        <button type="button" class="btn btn-success" onclick="sauvegarderProgressionExercice(true)">✅ Marquer cet exercice comme terminé</button>
    `;
    conteneur.appendChild(barActions);
};

window.noterReponseExercice = function(blocId, cle, valeur) {
    if (!assignationActive) return;
    if (!assignationActive.suiviBlocs) assignationActive.suiviBlocs = {};
    if (!assignationActive.suiviBlocs[blocId]) assignationActive.suiviBlocs[blocId] = { statut: "en_cours", reponses: {} };
    if (!assignationActive.suiviBlocs[blocId].reponses) assignationActive.suiviBlocs[blocId] = { reponses: {} };

    assignationActive.suiviBlocs[blocId].reponses[cle] = valeur;
};

window.sauvegarderLigneUnique = async function(blocId, idx) {
    if (!assignationActive) return;
    const btn = document.getElementById(`btn-save-ligne-${idx}`);

    try {
        await db.collection("assignations").doc(assignationActive.id).update({
            suiviBlocs: assignationActive.suiviBlocs || {}
        });

        if (btn) {
            const txtOriginal = btn.innerHTML;
            btn.innerHTML = "✓ Enregistré !";
            btn.className = "btn btn-sm btn-success";
            setTimeout(() => {
                btn.innerHTML = txtOriginal;
                btn.className = "btn btn-sm btn-secondary";
            }, 1500);
        }
    } catch(e) {
        alert("Erreur de sauvegarde : " + e.message);
    }
};

window.sauvegarderProgressionExercice = async function(marquerTermine) {
    if (!assignationActive) return;
    const bloc = assignationActive.blocs_exercices[window.blocExerciceIndexActif];
    if (!bloc) return;

    const suivi = assignationActive.suiviBlocs || {};
    if (!suivi[bloc.id]) suivi[bloc.id] = { reponses: {} };
    suivi[bloc.id].statut = marquerTermine ? "fait" : "en_cours";

    await db.collection("assignations").doc(assignationActive.id).update({
        suiviBlocs: suivi
    });

    alert(marquerTermine ? "✅ Exercice marqué comme terminé !" : "💾 Vos réponses ont été sauvegardées !");
    retourMenuBlocs();
};

// CRÉATION D'ENTRAÎNEMENT
window.ouvrirModalEntrainement = function(assignationId) {
    devoirSourcePourEntrainement = assignationsMap[assignationId];
    if (!devoirSourcePourEntrainement) return;

    document.getElementById('nom-devoir-source').textContent = devoirSourcePourEntrainement.devoirTitre;
    document.getElementById('modal-generer-entrainement').classList.add('ouverte');
};

window.fermerModalEntrainement = function() {
    devoirSourcePourEntrainement = null;
    document.getElementById('modal-generer-entrainement').classList.remove('ouverte');
};

window.lancerCreationEntrainement = async function() {
    if (!devoirSourcePourEntrainement) return;

    const format = document.querySelector('input[name="format-entrainement"]:checked').value;
    const nbPhrases = document.querySelector('input[name="nb-phrases-entrainement"]:checked').value;

    const btn = document.getElementById('btn-lancer-entrainement');
    btn.disabled = true;
    btn.textContent = "⏳ Génération des exercices...";

    try {
        const contexte = devoirSourcePourEntrainement.questions || (devoirSourcePourEntrainement.phrases || []).map(p => p.q);

        const res = await fetch(`${urlBackendRender}/api/generer-entrainement`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                titreSource: devoirSourcePourEntrainement.devoirTitre,
                contexteExemples: contexte,
                format: format,
                nbPhrases: nbPhrases
            })
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error);

        await db.collection("assignations").add({
            eleveCode: codeEleveActuel,
            devoirTitre: data.titre || `Entraînement : ${devoirSourcePourEntrainement.devoirTitre}`,
            typeDevoir: "interactif",
            estAutoEntrainement: true,
            sourceDevoirTitre: devoirSourcePourEntrainement.devoirTitre,
            phrases: data.phrases || [],
            statut: "non_commence",
            score: 0,
            totalQuestions: (data.phrases || []).length,
            totalErreurs: 0,
            fautesDetails: [],
            reponsesValidees: {},
            dateAssignation: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert("✅ Vos exercices supplémentaires sont prêts ! Ils ont été ajoutés à votre liste de devoirs.");
        fermerModalEntrainement();

    } catch(err) {
        alert("Erreur lors de la génération : " + err.message);
    } finally {
        btn.disabled = false;
        btn.textContent = "🚀 Créer mes exercices";
    }
};

// EXERCICE INTERACTIF
window.ouvrirDevoirInteractif = function(id) {
    const d = assignationsMap[id];
    if (!d) return;

    assignationActive = d;
    scoreInteractif = d.score || 0;
    erreursInteractif = d.totalErreurs || 0;
    reponsesValideesInteractif = d.reponsesValidees || {};
    fautesInteractif = d.fautesDetails || [];

    document.getElementById('ecran-tableau-de-bord').style.display = 'none';
    document.getElementById('vue-exo-interactif').style.display = 'block';

    document.getElementById('interactif-titre').textContent = d.devoirTitre;
    document.getElementById('interactif-score').textContent = scoreInteractif;
    document.getElementById('interactif-total').textContent = (d.phrases || []).length;
    document.getElementById('interactif-erreurs').textContent = erreursInteractif;

    const conteneur = document.getElementById('interactif-phrases-conteneur');
    conteneur.innerHTML = "";

    (d.phrases || []).forEach((p, idx) => {
        const div = document.createElement('div');
        div.className = "phrase-box-interactif";
        
        const parts = /_{2,}/.test(p.q) ? p.q.split(/_{2,}/) : [p.q];
        const dejaValide = reponsesValideesInteractif.hasOwnProperty(idx.toString());
        const repSauvegardee = dejaValide ? (reponsesValideesInteractif[idx.toString()].saisie || reponsesValideesInteractif[idx.toString()]) : "";

        if (p.type === 'select') {
            let optionsHtml = `<option value="">---</option>` + (p.options || []).map(o => {
                const sel = (dejaValide && o === repSauvegardee) ? 'selected' : '';
                return `<option value="${o}" ${sel}>${o}</option>`;
            }).join('');

            div.innerHTML = `<span>${idx + 1}.</span> ${parts[0]}
                <select class="input-calme ${dejaValide ? 'correct-input' : ''}" id="input-interactif-${idx}" onchange="verifierLigneInteractif(${idx})" ${dejaValide ? 'disabled' : ''}>
                    ${optionsHtml}
                </select> ${parts[1] || ""}`;
        } else {
            div.innerHTML = `<span>${idx + 1}.</span> ${parts[0]}
                <input type="text" class="input-calme ${dejaValide ? 'correct-input' : ''}" id="input-interactif-${idx}" value="${repSauvegardee}" placeholder="..." ${dejaValide ? 'disabled' : ''}>
                <button type="button" class="btn btn-sm" id="btn-interactif-${idx}" onclick="verifierLigneInteractif(${idx})" ${dejaValide ? 'disabled' : ''}>Vérifier</button>
                ${parts[1] || ""}`;
        }
        conteneur.appendChild(div);

        if (p.type === 'text' && !dejaValide) {
            setTimeout(() => {
                const el = document.getElementById(`input-interactif-${idx}`);
                if (el) el.addEventListener('keypress', (e) => { if (e.key === 'Enter') verifierLigneInteractif(idx); });
            }, 0);
        }
    });
};

window.verifierLigneInteractif = async function(idx) {
    const p = assignationActive.phrases[idx];
    const input = document.getElementById(`input-interactif-${idx}`);
    const btn = document.getElementById(`btn-interactif-${idx}`);

    if (input.disabled) return;
    const saisie = input.value.trim().toLowerCase();
    if (!saisie) return;

    const bonnesReponses = (p.a || []).map(a => a.trim().toLowerCase());

    if (bonnesReponses.includes(saisie)) {
        input.classList.remove('incorrect-input');
        input.classList.add('correct-input');
        input.disabled = true;
        if (btn) btn.disabled = true;

        reponsesValideesInteractif[idx.toString()] = { saisie: saisie, correct: true };
        scoreInteractif = Object.values(reponsesValideesInteractif).filter(v => v.correct || typeof v === 'string').length;
        document.getElementById('interactif-score').textContent = scoreInteractif;

        await db.collection("assignations").doc(assignationActive.id).update({
            score: scoreInteractif,
            reponsesValidees: reponsesValideesInteractif,
            statut: "en_cours"
        });
    } else {
        erreursInteractif++;
        document.getElementById('interactif-erreurs').textContent = erreursInteractif;
        input.classList.add('incorrect-input');

        fautesInteractif.push({
            phrase: p.q,
            reponseEleve: saisie,
            attendu: (p.a || []).join(' / ')
        });

        await db.collection("assignations").doc(assignationActive.id).update({
            totalErreurs: erreursInteractif,
            fautesDetails: fautesInteractif
        });

        declencherErreurNotification();
        input.focus();
    }
};

function declencherErreurNotification() {
    const lang = (langueActuelle || 'fr').toLowerCase();

    if (modeSevereActif) {
        const overlay = document.getElementById('punition-overlay');
        const text = document.getElementById('punition-text');
        const sub = document.getElementById('punition-sub');

        if (lang === 'en') {
            let index = Math.min(erreursInteractif - 1, insultesAnglaises.length - 1);
            if (index < 0) index = 0;
            const d = insultesAnglaises[index];
            text.textContent = d.en;
            sub.textContent = `${d.fr} (Mistake #${erreursInteractif})`;
        } else {
            let index = Math.min(erreursInteractif - 1, insultesOriginales.length - 1);
            if (index < 0) index = 0;
            const d = insultesOriginales[index];
            text.textContent = d.kr;
            sub.textContent = `${d.fr} (${t('mistake_count_sub')}${erreursInteractif})`;
        }

        overlay.classList.add('show');
        setTimeout(() => overlay.classList.remove('show'), 1200);
        return;
    }

    const toast = document.getElementById('soft-encouragement-toast');
    const toastTxt = document.getElementById('soft-toast-text');
    
    const randItem = encouragementsDoux[Math.floor(Math.random() * encouragementsDoux.length)];
    toastTxt.textContent = randItem[lang] || randItem.fr;

    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2200);
}

window.terminerDevoirInteractif = async function() {
    if (!assignationActive) return;
    await db.collection("assignations").doc(assignationActive.id).update({
        statut: "termine",
        score: scoreInteractif,
        totalErreurs: erreursInteractif,
        fautesDetails: fautesInteractif
    });
    alert(`✅ Devoir terminé ! Score : ${scoreInteractif} / ${(assignationActive.phrases || []).length}`);
    retourTableauPrincipal();
};

// EXERCICE EMMA IA
window.ouvrirDevoirEmma = function(id) {
    const d = assignationsMap[id];
    if (!d) return;

    assignationActive = d;
    document.getElementById('ecran-tableau-de-bord').style.display = 'none';
    document.getElementById('vue-emma-ia').style.display = 'block';
    document.getElementById('emma-titre').textContent = d.devoirTitre;

    const conteneur = document.getElementById('emma-questions-conteneur');
    conteneur.innerHTML = "";

    const retours = d.retoursEmma || {};

    (d.questions || []).forEach((q, idx) => {
        const item = document.createElement('div');
        item.className = "emma-chat-item";
        const reponsePrecedente = retours[idx] ? retours[idx].phrase_eleve : "";

        item.innerHTML = `
            <div class="bulle-emma">💬 Emma : « ${q} »</div>
            <div style="display:flex; gap:10px; margin-top:10px;">
                <input type="text" class="input-eleve-emma" id="input-emma-${idx}" value="${reponsePrecedente}" placeholder="${t('placeholderEmma')}">
                <button type="button" class="btn btn-purple" id="btn-emma-${idx}" onclick="verifierAvecEmma(${idx})">${t('btnVerifierEmma')}</button>
            </div>
            <div id="coin-prof-emma-${idx}"></div>
        `;
        conteneur.appendChild(item);

        if (retours[idx]) {
            afficherBlocCoinDuProf(idx, retours[idx]);
        }
    });
};

window.verifierAvecEmma = async function(idx) {
    const input = document.getElementById(`input-emma-${idx}`);
    const btn = document.getElementById(`btn-emma-${idx}`);
    const saisie = input.value.trim();
    const question = assignationActive.questions[idx];

    if (!saisie) return alert("Écris une réponse avant de vérifier !");

    btn.disabled = true;
    btn.textContent = "⏳...";

    try {
        const res = await fetch(`${urlBackendRender}/api/corriger-emma`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                question: question,
                reponseEleve: saisie,
                langue: langueActuelle || 'fr',
                modeDelf: assignationActive.modeDelf || false
            })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        data.phrase_eleve = saisie;
        afficherBlocCoinDuProf(idx, data);

        if (!assignationActive.retoursEmma) assignationActive.retoursEmma = {};
        assignationActive.retoursEmma[idx] = data;

        await db.collection("assignations").doc(assignationActive.id).update({
            retoursEmma: assignationActive.retoursEmma,
            statut: "en_cours"
        });

    } catch(e) {
        alert("Erreur de connexion avec Emma : " + e.message);
    } finally {
        btn.disabled = false;
        btn.textContent = t('btnVerifierEmma');
    }
};

function afficherBlocCoinDuProf(idx, data) {
    const zone = document.getElementById(`coin-prof-emma-${idx}`);
    
    let tradReponse = "";
    if (data.traduction_reponse) tradReponse = `<div class="traduction-texte">🌐 ${data.traduction_reponse}</div>`;

    let tradPhraseCorrigee = "";
    if (data.traduction_phrase_corrigee) tradPhraseCorrigee = `<div class="traduction-texte">🌐 ${data.traduction_phrase_corrigee}</div>`;

    let blocDelfDialectiqueHtml = "";
    if (data.argument_pour || data.argument_contre) {
        let itemPour = "";
        if (data.argument_pour) {
            let trad = data.traduction_argument_pour ? `<div class="traduction-texte">🌐 ${data.traduction_argument_pour}</div>` : "";
            itemPour = `
                <div style="margin-bottom:10px;">
                    <strong style="color:#059669;">➕ Pour enrichir ton idée :</strong>
                    <div style="color:#065f46; font-weight:600; margin-top:2px;">"${data.argument_pour}"</div>
                    ${trad}
                </div>
            `;
        }

        let itemContre = "";
        if (data.argument_contre) {
            let trad = data.traduction_argument_contre ? `<div class="traduction-texte">🌐 ${data.traduction_argument_contre}</div>` : "";
            itemContre = `
                <div>
                    <strong style="color:#b45309;">⚖️ Pour nuancer / débattre :</strong>
                    <div style="color:#92400e; font-weight:600; margin-top:2px;">"${data.argument_contre}"</div>
                    ${trad}
                </div>
            `;
        }

        blocDelfDialectiqueHtml = `
            <div style="margin-top:15px; background:#fdf4ff; border:2px solid #e879f9; border-radius:10px; padding:14px; font-size:0.95em;">
                <div style="font-weight:bold; color:#86198f; font-size:1.05em; margin-bottom:8px; border-bottom:1px dashed #f0abfc; padding-bottom:5px;">
                    🎓 Structure d'argumentation DELF B1/B2
                </div>
                ${itemPour}
                ${itemContre}
            </div>
        `;
    }

    zone.innerHTML = `
        <div style="margin-top:15px; background:#faf5ff; border-radius:8px; padding:12px; font-weight:600; color:#581c87;">
            💬 Emma : "${data.reponse_amicale}"
            ${tradReponse}
        </div>
        
        <div class="coin-du-prof-box">
            <div style="font-weight:bold; color:#1e40af; border-bottom:1px solid #cbd5e0; padding-bottom:5px; margin-bottom:8px;">
                ${t('coinDuProf')}
            </div>
            <div>👀 <strong>${t('phraseDeToi')}</strong> : "${data.phrase_eleve}"</div>
            <div>✅ <strong>${t('ceQuiEstBien')}</strong> : ${data.ce_qui_est_bien}</div>
            <div>❌ <strong>${t('lesFautes')}</strong> : <span style="color:var(--danger); font-weight:600;">${data.les_fautes}</span></div>
            <div>➡️ <strong>${t('phraseCorrigee')}</strong> : <strong style="color:var(--success); font-size:1.05em;">"${data.phrase_corrigee}"</strong>
                ${tradPhraseCorrigee}
            </div>
            <div>💡 <strong>${t('ameliorations')}</strong> : ${data.ameliorations}</div>
            ${blocDelfDialectiqueHtml}
        </div>
    `;
}

window.marquerEmmaTermine = async function() {
    if (!assignationActive) return;
    await db.collection("assignations").doc(assignationActive.id).update({ statut: "termine" });
    alert("🎉 Bravo ! Ton échange avec Emma est validé et transmis à ton professeur.");
    retourTableauPrincipal();
};

window.retourTableauPrincipal = function() {
    document.getElementById('vue-emma-ia').style.display = 'none';
    document.getElementById('vue-exo-interactif').style.display = 'none';
    document.getElementById('vue-chapitre-blocs').style.display = 'none';
    document.getElementById('vue-contenu-bloc-chapitre').style.display = 'none';
    document.getElementById('ecran-tableau-de-bord').style.display = 'block';
};

document.addEventListener('DOMContentLoaded', () => {
    if (langueActuelle) appliquerLangue();
    verifierSession();
});
