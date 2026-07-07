-- Template CDD DOUKE Growth and Funding (company_id = 1)
-- Basé EXACTEMENT sur le texte du template CCI PARTNERS (id=422, contrat_cdd)
-- Seuls ajouts par rapport au texte source CCI :
--   1) En-tête réelle (header_image_url) au lieu du logo CCI
--   2) Téléphone / IFU du salarié dans le bloc "L'Employé(e)"
--   3) periode_essai_phrase (Art.2), missions_bloc (Art.3), periode_essai_fin (Art.13)
INSERT INTO document_templates (company_id, template_type, template_name, template_html, created_by)
VALUES (
    1,
    'contrat_cdd',
    'Contrat CDD — DOUKE Growth and Funding',
    $TEMPLATE$
<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;font-size:11.5pt;color:#1a1a1a;margin:0;padding:20px 25px}
@media print{@page{margin:15mm 20mm;size:A4}.pb{page-break-before:always}.no-break{page-break-inside:avoid}}
.header-banner{margin-bottom:18px;border-radius:6px;overflow:hidden;border:1px solid #1a3a5c}
.header-title{background:#1a3a5c;color:#fff;text-align:center;padding:10px 14px}
.header-title h1{font-size:14pt;margin:0;letter-spacing:1px;text-transform:uppercase}
.header-title h2{font-size:12pt;margin:2px 0 0 0}
.header-title p{font-size:9pt;margin:4px 0 0 0;color:#cfe0f0}
.pblock{background:#f5f7fa;border-left:4px solid #1a3a5c;padding:8px 14px;margin:8px 0;border-radius:4px}
.pblock h3{font-size:10pt;color:#1a3a5c;margin:0 0 5px 0;text-transform:uppercase}
.pblock p{margin:3px 0;font-size:11pt;line-height:1.5}
.sep{text-align:center;font-weight:bold;color:#1a3a5c;margin:6px 0;font-size:11pt}
.intro{text-align:center;margin:8px 0;font-size:11pt}
.art{margin:10px 0}
.art h4{font-size:11pt;color:#1a3a5c;text-transform:uppercase;border-bottom:1px solid #dde;padding-bottom:3px;margin:0 0 5px 0}
.art p{margin:4px 0;line-height:1.6;text-align:justify;font-size:11pt}
.art ul{margin:4px 0;padding-left:18px}
.art ul li{margin:3px 0;line-height:1.5;font-size:11pt}
.art ul.missions{margin:6px 0;padding-left:18px}
.hl{background:#fff3cd;padding:1px 4px;border-radius:3px;font-weight:bold}
.sigs{display:flex;justify-content:space-between;margin-top:40px}
.sig{text-align:center;width:45%}
.sig-line{border-top:1px solid #333;margin-top:50px;padding-top:6px;font-size:10pt}
.legal{font-size:8pt;color:#aaa;text-align:center;margin-top:14px;border-top:1px solid #eee;padding-top:6px}</style></head><body>

<!-- ========== PAGE 1 : En-tête réelle + Parties + Art.1-3 ========== -->
<div class="header-banner no-break">
  <img src="{{header_image_url}}" alt="{{nom_entreprise}}" style="width:100%;display:block"/>
  <div class="header-title">
    <h1>CONTRAT DE TRAVAIL</h1>
    <h2>À DURÉE DÉTERMINÉE (CDD)</h2>
    <p>Ref : {{reference_contrat}} &nbsp;|&nbsp; Fait à {{lieu_signature}}, le {{date_signature}}</p>
  </div>
</div>

<p class="intro no-break"><strong>ENTRE</strong></p>

<div class="pblock no-break">
  <h3>L'Employeur</h3>
  <p>Raison Sociale : <strong>{{nom_entreprise}}</strong></p>
  <p>Représentée par : <strong>{{representant_entreprise}}</strong> &nbsp; Siège Social / Adresse : <strong>{{adresse_entreprise}}</strong></p>
  <p style="margin-top:5px;font-style:italic">Ci-après désigné <strong>« Employeur »</strong></p>
</div>

<p class="sep">D'UNE PART,<br>Et</p>

<div class="pblock no-break">
  <h3>L'Employé(e)</h3>
  <p>Madame / Monsieur : <strong>{{nom}}</strong></p>
  <p>Date et lieu de Naissance : <strong>{{date_naissance}}</strong> &nbsp;&nbsp; Nationalité : <strong>{{nationalite}}</strong></p>
  <p>Résident(e) habituellement à : <strong>{{adresse_salarie}}</strong></p>
  <p>Situation Matrimoniale : <strong>{{situation_matrimoniale}}</strong></p>
  <p>Téléphone : <strong>{{telephone_salarie}}</strong> &nbsp;&nbsp; N° IFU : <strong>{{ifu_salarie}}</strong></p>
  <p style="margin-top:5px;font-style:italic">Ci-après désigné <strong>« Employé »</strong></p>
</div>

<p class="sep">D'AUTRE PART</p>
<p class="intro">L'employeur et l'employé sont collectivement appelés les <strong>« Parties »</strong> et individuellement une <strong>« Partie »</strong>.</p>
<p class="intro"><strong>Il a été convenu de ce qui suit :</strong></p>

<div class="art no-break">
  <h4>Article 1 : Objet du contrat</h4>
  <p>Le présent contrat de travail à durée déterminée a pour objet de déterminer les conditions et modalités selon lesquelles l'employé accepte de mettre à la disposition de <strong>{{nom_entreprise}}</strong>, son savoir-faire, son temps, et sa loyauté en tant que <span class="hl">{{poste}}</span> pour atteindre des objectifs moyennant une rémunération convenue.</p>
</div>

<div class="art no-break">
  <h4>Article 2 : Durée du Contrat</h4>
  <p>Le présent contrat est conclu pour une durée déterminée de <span class="hl">{{duree_contrat}}</span> allant du <span class="hl">{{date_debut}}</span> au <span class="hl">{{date_fin}}</span>, sous réserve de son interruption anticipée selon les conditions prévues à l'article 13 ci-dessous.</p>
  <p>Il prend fin de plein droit à l'échéance du terme ci-dessus indiqué et peut être transformé en contrat à durée indéterminée sur accord des parties.{{periode_essai_phrase}}</p>
</div>

<div class="art no-break">
  <h4>Article 3 : Fonctions de l'Employé</h4>
  <p>L'employé se met à la disposition de l'entreprise en qualité de <span class="hl">{{poste}}</span>.</p>
  <p>Toutefois, en cas de nécessité, l'employé pourra être amené à exercer toutes autres attributions à lui confiées par l'entreprise dans la mesure de ses qualifications.</p>
  {{missions_bloc}}
</div>

<!-- ========== PAGE 2 : Art.4-8 ========== -->
<div class="pb"></div>

<div class="art no-break">
  <h4>Article 4 : Engagement de l'Employé</h4>
  <p>L'employé déclare être libre de tous engagements professionnels et s'engage à :</p>
  <ul>
    <li>Exercer ses attributions sous l'autorité de ses supérieurs hiérarchiques et à se soumettre aux règles applicables dans l'entreprise et notamment aux règles de discipline, s'acquitter avec loyauté, responsabilité et fidélité des travaux ou missions qui lui seront confiés ;</li>
    <li>Effectuer les déplacements nécessaires et se rendre en tous lieux où l'entreprise aura besoin de ses services dans les limites des accords ;</li>
    <li>Informer son employeur sans délai de tout changement qui interviendrait dans sa situation professionnelle comme personnelle, notamment en cas de changement d'adresse ou de situation matrimoniale ;</li>
    <li>S'abstenir de toute attitude de nature à jeter le discrédit sur l'activité de l'entreprise ou les supérieurs hiérarchiques dont il relève ;</li>
    <li>Assister aux formations organisées par les partenaires avec un accord de son supérieur ;</li>
    <li>Aviser son employeur de tout incident affectant l'exécution de son travail, dans un délai de 24h maximum, en vue de la prise des dispositions auprès la Caisse Nationale de Sécurité Sociale (CNSS) ;</li>
    <li>Restituer à l'expiration du contrat quel qu'en soit la cause, tout matériel à lui confié par l'employeur.</li>
  </ul>
</div>

<div class="art no-break">
  <h4>Article 5 : Actions d'accompagnement et de formation, tuteur et référent</h4>
  <p>L'employé s'engage à suivre toutes les actions d'accompagnement, de formation, de tutorat et de validation des acquis prévues et concourant à son évolution professionnelle.</p>
  <p>À ce titre, il bénéficie d'un accompagnement par les référents désignés par <strong>{{nom_entreprise}}</strong> et chargés d'assurer le suivi de son parcours professionnel.</p>
</div>

<div class="art no-break">
  <h4>Article 6 : Lieu et horaire de travail</h4>
  <p>Les horaires de travail de l'employé sont ceux de l'entreprise, non contraires aux dispositions légales en vigueur en République du Bénin.</p>
  <p>Les horaires de <strong>{{nom_entreprise}}</strong> sont de <span class="hl">{{heures_mensuelles}}</span> heures par mois réparties suivant le calendrier des rotations mensuelles.</p>
  <p>Le lieu de travail est le siège de <strong>{{nom_entreprise}}</strong> et tout autre endroit désigné par l'employeur.</p>
</div>

<div class="art no-break">
  <h4>Article 7 : Rémunération</h4>
  <p>L'employé percevra une rémunération nette mensuelle de <span class="hl">{{salaire_net}} FCFA</span>.</p>
  <p>Cette rémunération sera versée mensuellement à l'employé par virement bancaire, chèque ou tout autre moyen de paiement légal. Il est versé au plus tard le <span class="hl">{{jour_paiement}}</span> du mois suivant. En cas de difficulté financière, l'employeur doit informer l'employé et convenir avec lui d'une prochaine échéance.</p>
</div>

<div class="art no-break">
  <h4>Article 8 : Frais de mission</h4>
  <p>En cas de mission hors du lieu d'exercice habituel de ses fonctions, des frais de missions relatifs à l'hébergement, la restauration et au déplacement sont accordés à l'employé conformément aux règles applicables au sein de l'entreprise.</p>
</div>

<!-- ========== PAGE 3 : Art.9-12 ========== -->
<div class="pb"></div>

<div class="art no-break">
  <h4>Article 9 : Avantages sociaux</h4>
  <p>L'affiliation de l'employé à la Caisse Nationale de Sécurité Sociale (CNSS) en vue de lui permettre de bénéficier des avantages sociaux reconnus par la réglementation en vigueur au Bénin, sera faite par l'entreprise dès confirmation de sa période d'essai.</p>
</div>

<div class="art no-break">
  <h4>Article 10 : Congés</h4>
  <p>L'employé a droit à deux (02) jours ouvrables de congés par mois de service effectif soit vingt-quatre (24) jours de travail ouvrables par an. La jouissance de ses congés sera planifiée en accord avec l'employeur et est valable dès la fin de la première année.</p>
  <p>En cas d'arrêt pour cause de maladie, l'employé devra présenter à l'entreprise sans délai un certificat émis par un médecin agréé.</p>
</div>

<div class="art no-break">
  <h4>Article 11 : Clause d'exclusivité</h4>
  <p>L'employé s'interdit d'exercer pendant la durée de son contrat même en dehors des heures de travail, une activité à caractère professionnel susceptible de concurrencer son employeur dans ses activités professionnelles ou de nuire à l'exécution normale des services convenus.</p>
  <p>L'employé s'interdit d'utiliser les outils de travail (ordinateur ; téléphone ; imprimante ; connexion et tout autre outil) à des fins personnelles.</p>
</div>

<div class="art no-break">
  <h4>Article 12 : Clause de confidentialité</h4>
  <p>L'employé s'interdit totalement de divulguer, pendant ou après son emploi, tous renseignements de nature confidentielle qu'il aurait pu recueillir.</p>
  <p>L'employé considérera comme strictement confidentiel et s'interdit de divulguer toutes informations, documents, données dont il pourra avoir connaissance à l'occasion de l'exécution du présent contrat. En conséquence, il s'interdit notamment de :</p>
  <ul>
    <li>Divulguer tout renseignement de nature confidentielle qu'il aurait pu recueillir dans le cadre de l'exercice de ses fonctions ou lié à celle-ci ;</li>
    <li>Utiliser les informations confidentielles dont il a eu connaissance au cours de ses missions et à l'occasion des travaux réalisés.</li>
  </ul>
  <p>Toutefois, l'employé ne serait tenu pour responsable d'aucune divulgation si les éléments étaient dans le domaine public à date de la divulgation, ou s'il en avait connaissance ou les obtient de tiers par des moyens légitimes.</p>
  <p>L'employé ne doit pas prendre de position qui altérerait l'exercice indépendant et impartial de ses fonctions. Ce devoir de réserve se prolonge au-delà de l'exercice des fonctions. Il doit également éviter tout conflit d'intérêt.</p>
  <p>Il est entendu par conflit d'intérêts toute situation d'interférence entre un intérêt public ou privé qui peut perturber l'exécution indépendante, impartiale et objective des services convenus.</p>
</div>

<!-- ========== PAGE 4 : Art.13-16 + Signatures ========== -->
<div class="pb"></div>

<div class="art no-break">
  <h4>Article 13 : Résiliation</h4>
  <p>Ce contrat de travail cesse de plein droit au terme des <span class="hl">{{duree_contrat}}</span> prévus au contrat et peut être systématiquement renouvelé. À la fin de ce contrat de travail, s'il n'est pas renouvelé, l'employé perd la qualité d'employé de l'Entreprise.</p>
  <p>Ce contrat de travail peut prendre fin avant son terme :</p>
  <ul>
    <li>Sur accord écrit des deux Parties ;</li>
    <li>À tout moment, hors période d'essai, par la volonté de l'une des Parties sous réserve d'un préavis d'<strong>un (1) mois</strong>{{periode_essai_fin}} ;</li>
    <li>Sur démission, abandon de poste ou absence injustifiée de l'employé à son poste pendant une durée de quarante-huit (48) heures ;</li>
    <li>En cas de mauvaise performance de l'employé rendant impossible son maintien au sein de la structure ;</li>
    <li>En cas de décès de l'employé ;</li>
    <li>En cas de force majeure dûment justifiée par écrit dans les sept (07) jours suivant sa constatation par la Partie qui s'en prévaut ;</li>
    <li>Sans préavis en cas de faute lourde de l'employé dûment notifiée à celui-ci, sous réserve de l'appréciation de la juridiction compétente en ce qui concerne la gravité de la faute ;</li>
    <li>En cas de violation délibérée dûment constatée des clauses du présent contrat par l'une des Parties.</li>
  </ul>
  <p>Il est notamment précisé qu'est considérée comme faute lourde, toute fausse déclaration constatée dans le curriculum vitae ou autre document produit par l'employé ou toute rétention d'informations utiles et déterminantes pour la conclusion du présent contrat.</p>
  <p>En cas de résiliation du présent contrat, l'ensemble des matériels et toutes autres pièces confiés ou remis à l'employé, ou tout document ou somme d'argent qu'il détiendrait par devers lui, doit être restitué à l'entreprise sans délai.</p>
</div>

<div class="art no-break">
  <h4>Article 14 : Attribution de juridiction</h4>
  <p>Tout litige relatif à la conclusion, à l'exécution du présent contrat, à défaut de règlement amiable dans un délai de trente (30) jours à compter de la notification du litige par une partie, sera porté devant les juridictions sociales compétentes.</p>
</div>

<div class="art no-break">
  <h4>Article 15 : Dispositions diverses</h4>
  <p>Pour ce qui n'est pas précisé au présent contrat, les Parties s'en remettent aux dispositions du Code du Travail fixant les modalités de sa mise en œuvre, des accords du travail ainsi que toutes autres dispositions législatives et réglementaires en République du Bénin.</p>
</div>

<div class="art no-break">
  <h4>Article 16 : Enregistrement</h4>
  <p>Le présent contrat est enregistré dès sa signature pour servir et valoir ce que de droit.</p>
</div>

<p class="intro no-break" style="margin-top:16px"><strong>Fait à <span class="hl">{{lieu_signature}}</span> en trois exemplaires, le <span class="hl">{{date_signature}}</span></strong></p>

<div class="sigs no-break">
  <div class="sig">
    <p><strong>Le Manager</strong></p>
    <p style="font-size:10pt">{{representant_entreprise}}</p>
    <div class="sig-line">Signature et cachet</div>
  </div>
  <div class="sig">
    <p><strong>L'Employé(e)</strong></p>
    <p style="font-size:10pt">{{nom}}</p>
    <div class="sig-line">Signature</div>
  </div>
</div>

<div class="legal">Contrat conforme — Code du Travail Bénin Loi n° 98-004 | CNSS affiliée dès confirmation période d'essai | OHADA</div>
</body></html>
$TEMPLATE$,
    NULL
)
ON CONFLICT (company_id, template_type)
DO UPDATE SET
    template_html = EXCLUDED.template_html,
    template_name = EXCLUDED.template_name,
    updated_at    = NOW();
