<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';
$db = get_db();

// 1. Add body_html column
$cols = $db->query('SHOW COLUMNS FROM quizzes')->fetchAll(PDO::FETCH_ASSOC);
if (!in_array('body_html', array_column($cols, 'Field'))) {
    $db->exec('ALTER TABLE quizzes ADD COLUMN body_html LONGTEXT NULL AFTER description');
    echo "✓ Added body_html column to quizzes\n";
} else {
    echo "body_html already exists\n";
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Formació d'idiomes (id=12) — body_html + questions
// ─────────────────────────────────────────────────────────────────────────────
$idiomes_body = <<<HTML
<p>TAVIL posa a disposició dels seus treballadors la possibilitat d'aprendre idiomes de manera subvencionada. Aquesta formació es realitza en modalitat online, amb horaris flexibles adaptats a la teva jornada laboral.</p>

<h2>Per què aprendre idiomes?</h2>
<p>En un entorn cada cop més globalitzat, dominar una segona llengua és una competència fonamental per al creixement professional. Millora la comunicació amb clients internacionals, amplia les teves oportunitats de carrera i desenvolupa habilitats interculturals.</p>

<h2>Idiomes disponibles</h2>
<ul>
  <li><strong>Anglès</strong> — Des del nivell A1 fins al C1. Ideal per a gestió de correus, reunions i presentacions.</li>
  <li><strong>Alemany</strong> — Nivells A1–B2. Especialment útil per a relacions amb proveïdors del sector automació.</li>
  <li><strong>Francès</strong> — Nivells A1–B1. Per a projectes amb clients francesos i belgues.</li>
</ul>

<h2>Metodologia</h2>
<p>La plataforma utilitza intel·ligència artificial per adaptar les lliçons al teu ritme i estil d'aprenentatge. Inclou exercicis de pronunciació, comprensió lectora i oral, i simulació de conversacions reals del sector industrial.</p>

<h2>Compromís de l'empresa</h2>
<p>TAVIL cobreix el <strong>100% del cost</strong> de la llicència per a tots els treballadors. L'únic requisit és completar un mínim de <strong>2 hores mensuals</strong> de formació activa per mantenir l'accés.</p>

<blockquote>
  "Invertir en formació lingüística és invertir en el futur de l'equip i de l'empresa." — Departament de RRHH
</blockquote>
HTML;

$db->prepare('UPDATE quizzes SET body_html=?, image=? WHERE id=12')->execute([
    $idiomes_body,
    '/uploads/idiomes_cover.jpg'
]);
echo "✓ Updated quiz 12 (idiomes) body_html\n";

// Questions for quiz 12
$db->prepare('DELETE FROM quiz_questions WHERE quiz_id=12')->execute();

$questions_idiomes = [
    [
        'type'        => 'single',
        'question'    => 'Quantes hores mensuals mínimes cal completar per mantenir l\'accés a la plataforma d\'idiomes?',
        'explanation' => 'TAVIL exigeix un mínim de 2 hores mensuals d\'activitat per garantir la continuïtat de la llicència.',
        'points'      => 10,
        'position'    => 1,
        'options'     => [
            ['text' => '1 hora', 'is_correct' => 0],
            ['text' => '2 hores', 'is_correct' => 1],
            ['text' => '5 hores', 'is_correct' => 0],
            ['text' => '10 hores', 'is_correct' => 0],
        ]
    ],
    [
        'type'        => 'single',
        'question'    => 'Quin percentatge del cost de la llicència cobreix TAVIL per als seus treballadors?',
        'explanation' => 'TAVIL finança el 100% del cost, per tant és completament gratuïta per al treballador.',
        'points'      => 10,
        'position'    => 2,
        'options'     => [
            ['text' => '50%', 'is_correct' => 0],
            ['text' => '75%', 'is_correct' => 0],
            ['text' => '100%', 'is_correct' => 1],
            ['text' => 'Depèn del departament', 'is_correct' => 0],
        ]
    ],
    [
        'type'        => 'single',
        'question'    => 'Quin idioma és especialment útil per a relacions amb proveïdors del sector automació?',
        'explanation' => 'L\'alemany és el llenguatge predominant en el sector de l\'automació i robòtica industrial europeu.',
        'points'      => 10,
        'position'    => 3,
        'options'     => [
            ['text' => 'Anglès', 'is_correct' => 0],
            ['text' => 'Francès', 'is_correct' => 0],
            ['text' => 'Alemany', 'is_correct' => 1],
            ['text' => 'Italià', 'is_correct' => 0],
        ]
    ],
    [
        'type'        => 'multiple',
        'question'    => 'Quins dels següents idiomes estan disponibles a la plataforma de TAVIL? (Selecciona tots els correctes)',
        'explanation' => 'La plataforma ofereix anglès, alemany i francès. L\'italià i el japonès no estan disponibles actualment.',
        'points'      => 15,
        'position'    => 4,
        'options'     => [
            ['text' => 'Anglès', 'is_correct' => 1],
            ['text' => 'Alemany', 'is_correct' => 1],
            ['text' => 'Italià', 'is_correct' => 0],
            ['text' => 'Francès', 'is_correct' => 1],
            ['text' => 'Japonès', 'is_correct' => 0],
        ]
    ],
    [
        'type'        => 'single',
        'question'    => 'La plataforma d\'idiomes de TAVIL utilitza quina tecnologia per adaptar les lliçons?',
        'explanation' => 'La IA analitza el teu ritme i estil d\'aprenentatge per personalitzar el contingut.',
        'points'      => 10,
        'position'    => 5,
        'options'     => [
            ['text' => 'Videoconferències amb professors natius', 'is_correct' => 0],
            ['text' => 'Intel·ligència artificial adaptativa', 'is_correct' => 1],
            ['text' => 'Llibres de text digitals fixes', 'is_correct' => 0],
            ['text' => 'Exercicis en paper escanejats', 'is_correct' => 0],
        ]
    ],
];

foreach ($questions_idiomes as $q) {
    $stmt = $db->prepare('INSERT INTO quiz_questions (quiz_id, type, question, explanation, points, position, media_url) VALUES (?,?,?,?,?,?,?)');
    $stmt->execute([12, $q['type'], $q['question'], $q['explanation'], $q['points'], $q['position'], '']);
    $qid = (int)$db->lastInsertId();
    foreach ($q['options'] as $pos => $o) {
        $db->prepare('INSERT INTO quiz_options (question_id, text, is_correct, position) VALUES (?,?,?,?)')->execute([$qid, $o['text'], $o['is_correct'], $pos + 1]);
    }
}
echo "✓ Added " . count($questions_idiomes) . " questions to quiz 12\n";

// Update quiz 12 passing score and time limit
$db->prepare('UPDATE quizzes SET passing_score=70, time_limit=10, category=\'Habilitats\' WHERE id=12')->execute();

// ─────────────────────────────────────────────────────────────────────────────
// 3. Normativa LGTBI (id=13) — body_html + questions
// ─────────────────────────────────────────────────────────────────────────────
$lgtbi_body = <<<HTML
<p>En compliment de la <strong>Llei 4/2023, de 28 de febrer</strong>, per a la igualtat real i efectiva de les persones trans i per a la garantia dels drets de les persones LGTBI, TAVIL ha actualitzat el seu protocol intern i posa a disposició dels treballadors aquesta formació obligatòria.</p>

<h2>Objectius de la formació</h2>
<p>Aquesta formació té com a objectiu principal assegurar que tots els treballadors i treballadores de TAVIL coneguin:</p>
<ul>
  <li>Els drets fonamentals de les persones LGTBI en l'entorn laboral.</li>
  <li>Les conductes que constitueixen discriminació o assetjament per orientació sexual o identitat de gènere.</li>
  <li>El protocol intern de TAVIL per reportar situacions de discriminació.</li>
  <li>El marc legal vigent i les obligacions de l'empresa.</li>
</ul>

<h2>Marc legal</h2>
<p>La Llei 4/2023 estableix l'obligació per part de les empreses amb 50 o més treballadors de:</p>
<ul>
  <li>Comptar amb un <strong>pla d'igualtat LGTBI</strong> negociat amb la representació sindical.</li>
  <li>Incloure mesures específiques en el conveni col·lectiu o acords d'empresa.</li>
  <li>Garantir un entorn laboral lliure de discriminació per raó d'identitat de gènere o orientació sexual.</li>
</ul>

<h2>Protocol intern TAVIL</h2>
<p>Si un treballador o treballadora identifica una situació de discriminació o assetjament, pot:</p>
<ol>
  <li>Posar-ho en coneixement del departament de <strong>Recursos Humans</strong> de forma confidencial.</li>
  <li>Contactar directament amb la <strong>persona designada</strong> com a responsable del protocol LGTBI.</li>
  <li>Utilitzar el <strong>canal de denúncies anònim</strong> disponible a l'intranet.</li>
</ol>

<blockquote>
  Tothom mereix treballar en un entorn de respecte, dignitat i igualtat d'oportunitats, independentment de la seva identitat de gènere o orientació sexual.
</blockquote>

<h2>Conseqüències de l'incompliment</h2>
<p>Les conductes discriminatòries o d'assetjament per raó de les circumstàncies protegides per la llei seran tractades com a <strong>faltes molt greus</strong> i podran comportar sancions disciplinàries fins a l'acomiadament.</p>
HTML;

$db->prepare('UPDATE quizzes SET body_html=?, image=? WHERE id=13')->execute([
    $lgtbi_body,
    '/uploads/lgtbi_cover.jpg'
]);
echo "✓ Updated quiz 13 (LGTBI) body_html\n";

// Questions for quiz 13
$db->prepare('DELETE FROM quiz_questions WHERE quiz_id=13')->execute();

$questions_lgtbi = [
    [
        'type'        => 'single',
        'question'    => 'Quina llei regula els drets de les persones LGTBI en l\'entorn laboral a Espanya?',
        'explanation' => 'La Llei 4/2023, de 28 de febrer, estableix les obligacions de les empreses per garantir la igualtat LGTBI.',
        'points'      => 10,
        'position'    => 1,
        'options'     => [
            ['text' => 'Llei 3/2007 d\'igualtat efectiva de dones i homes', 'is_correct' => 0],
            ['text' => 'Llei 4/2023 per a la igualtat real de les persones trans i LGTBI', 'is_correct' => 1],
            ['text' => 'Llei orgànica 10/1995 del Codi Penal', 'is_correct' => 0],
            ['text' => 'Real Decret 1/1995 de l\'Estatut dels Treballadors', 'is_correct' => 0],
        ]
    ],
    [
        'type'        => 'single',
        'question'    => 'A partir de quantes persones treballadores les empreses estan obligades a tenir un pla d\'igualtat LGTBI?',
        'explanation' => 'La Llei 4/2023 estableix l\'obligació per a empreses amb 50 o més treballadors.',
        'points'      => 10,
        'position'    => 2,
        'options'     => [
            ['text' => '10 treballadors', 'is_correct' => 0],
            ['text' => '25 treballadors', 'is_correct' => 0],
            ['text' => '50 treballadors', 'is_correct' => 1],
            ['text' => '100 treballadors', 'is_correct' => 0],
        ]
    ],
    [
        'type'        => 'multiple',
        'question'    => 'Quines de les següents són vies per reportar una situació de discriminació LGTBI a TAVIL? (Selecciona totes les correctes)',
        'explanation' => 'El protocol intern de TAVIL preveu tres vies: RRHH, la persona responsable del protocol i el canal anònim.',
        'points'      => 15,
        'position'    => 3,
        'options'     => [
            ['text' => 'Departament de Recursos Humans', 'is_correct' => 1],
            ['text' => 'Persona responsable del protocol LGTBI', 'is_correct' => 1],
            ['text' => 'Canal de denúncies anònim de l\'intranet', 'is_correct' => 1],
            ['text' => 'Publicar-ho a xarxes socials', 'is_correct' => 0],
            ['text' => 'Enviar un correu als companys', 'is_correct' => 0],
        ]
    ],
    [
        'type'        => 'single',
        'question'    => 'Quin tipus de falta laboral suposen les conductes discriminatòries per raó de la identitat de gènere o orientació sexual?',
        'explanation' => 'La normativa interna de TAVIL classifica aquestes conductes com a faltes molt greus, podent comportar l\'acomiadament.',
        'points'      => 10,
        'position'    => 4,
        'options'     => [
            ['text' => 'Falta lleu', 'is_correct' => 0],
            ['text' => 'Falta greu', 'is_correct' => 0],
            ['text' => 'Falta molt greu', 'is_correct' => 1],
            ['text' => 'No és una infracció laboral', 'is_correct' => 0],
        ]
    ],
    [
        'type'        => 'single',
        'question'    => 'Amb qui s\'ha de negociar el pla d\'igualtat LGTBI de l\'empresa?',
        'explanation' => 'La llei estableix que el pla ha de ser negociat amb la representació sindical dels treballadors.',
        'points'      => 10,
        'position'    => 5,
        'options'     => [
            ['text' => 'Amb la direcció de l\'empresa unilateralment', 'is_correct' => 0],
            ['text' => 'Amb la representació sindical', 'is_correct' => 1],
            ['text' => 'Amb el Ministeri d\'Igualtat', 'is_correct' => 0],
            ['text' => 'Amb cada treballador individualment', 'is_correct' => 0],
        ]
    ],
    [
        'type'        => 'single',
        'question'    => 'Quin és l\'objectiu principal del protocol intern LGTBI de TAVIL?',
        'explanation' => 'L\'objectiu és garantir un entorn de respecte i igualtat, amb mecanismes per actuar davant qualsevol situació discriminatòria.',
        'points'      => 10,
        'position'    => 6,
        'options'     => [
            ['text' => 'Sancionar els treballadors que no compleixin la formació', 'is_correct' => 0],
            ['text' => 'Garantir un entorn laboral lliure de discriminació i assetjament', 'is_correct' => 1],
            ['text' => 'Promoure polítiques de contractació exclusiva per a col·lectius LGTBI', 'is_correct' => 0],
            ['text' => 'Substituir el conveni col·lectiu vigent', 'is_correct' => 0],
        ]
    ],
];

foreach ($questions_lgtbi as $q) {
    $stmt = $db->prepare('INSERT INTO quiz_questions (quiz_id, type, question, explanation, points, position, media_url) VALUES (?,?,?,?,?,?,?)');
    $stmt->execute([13, $q['type'], $q['question'], $q['explanation'], $q['points'], $q['position'], '']);
    $qid = (int)$db->lastInsertId();
    foreach ($q['options'] as $pos => $o) {
        $db->prepare('INSERT INTO quiz_options (question_id, text, is_correct, position) VALUES (?,?,?,?)')->execute([$qid, $o['text'], $o['is_correct'], $pos + 1]);
    }
}
echo "✓ Added " . count($questions_lgtbi) . " questions to quiz 13\n";

$db->prepare('UPDATE quizzes SET passing_score=80, time_limit=12, mandatory=1, category=\'Compliment normatiu\' WHERE id=13')->execute();

echo "\nDone.\n";
