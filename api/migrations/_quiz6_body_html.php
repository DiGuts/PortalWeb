<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';
$db = get_db();

// Add body_html column if missing
$cols = $db->query('SHOW COLUMNS FROM quizzes')->fetchAll(PDO::FETCH_ASSOC);
if (!in_array('body_html', array_column($cols, 'Field'))) {
    $db->exec('ALTER TABLE quizzes ADD COLUMN body_html LONGTEXT NULL AFTER description');
    echo "✓ Added body_html column\n";
} else {
    echo "body_html already exists\n";
}

$body = <<<HTML
<p>La ciberseguretat és responsabilitat de tots. Cada any, milers d'empreses industrials a Europa pateixen atacs de phishing, ransomware o robatori de credencials que provoquen pèrdues milionàries i paralització de la producció. Aquesta formació t'equiparà amb les eines per reconèixer i evitar les amenaces més comunes.</p>

<h2>Què és el phishing?</h2>
<p>El phishing és un atac en el qual un ciberdelinqüent es fa passar per una entitat de confiança (el teu banc, un col·lega, la Seguretat Social, un proveïdor) per enganyar-te perquè facilitis les teves credencials, facis clic en un enllaç maliciós o descarreguis un fitxer infectat.</p>
<p>Les variants més habituals que rebem a TAVIL són:</p>
<ul>
  <li><strong>Spear phishing</strong> — correus personalitzats que mencionen el teu nom, departament o projectes reals.</li>
  <li><strong>Smishing</strong> — missatges SMS fraudulents que suplanten empreses de paqueteria o bancs.</li>
  <li><strong>Vishing</strong> — trucades telefòniques d'algú que diu ser de suport tècnic o d'RRHH.</li>
</ul>

<h2>Senyals d'alerta en un correu</h2>
<p>Tingues sempre sospita si un correu presenta alguna d'aquestes característiques:</p>
<ul>
  <li>Adreça del remitent lleugerament diferent a l'oficial (p. ex. <em>suport@tavil-net.com</em> en lloc de <em>suport@tavil.net</em>).</li>
  <li>Urgència exagerada: "El teu compte serà blocat en 24 hores", "Acció immediata requerida".</li>
  <li>Sol·licitud de contrasenya, número de compte o dades personals per correu o telèfon.</li>
  <li>Fitxers adjunts inesperats (.zip, .exe, macros d'Excel o Word).</li>
  <li>Enllaços que al passar el ratolí per sobre mostren una URL diferent de la que apareix al text.</li>
</ul>

<h2>Gestió segura de contrasenyes</h2>
<p>Una contrasenya robusta segueix les regles següents:</p>
<ul>
  <li>Mínim <strong>12 caràcters</strong>, combinant majúscules, minúscules, números i símbols.</li>
  <li><strong>Diferent</strong> per a cada servei — mai reutilitzar la mateixa contrasenya.</li>
  <li>Mai compartida per correu electrònic, Whatsapp o cap altra via.</li>
  <li>Canviada immediatament si sospites que ha pogut ser compromesa.</li>
</ul>
<p>TAVIL posa a disposició dels treballadors un gestor de contrasenyes corporatiu. Contacta amb IT per obtenir accés.</p>

<h2>Autenticació en dos factors (2FA)</h2>
<p>El 2FA afegeix una capa extra de seguretat. Fins i tot si algú roba la teva contrasenya, no podrà accedir als sistemes sense el segon factor (un codi al mòbil, una clau física, etc.). Tots els sistemes crítics de TAVIL el requereixen — mai el desactivis.</p>

<h2>Què fer si reps un correu sospitós</h2>
<ol>
  <li><strong>No facis clic</strong> a cap enllaç ni descarreguis cap fitxer adjunt.</li>
  <li><strong>No respondis</strong> al correu ni facilitis cap dada.</li>
  <li><strong>Reenvía'l</strong> al departament d'IT (it@tavil.net) amb l'assumpte "POSSIBLE PHISHING".</li>
  <li><strong>Elimina'l</strong> de la teva safata d'entrada.</li>
  <li>Si creus que ja has fet clic en un enllaç maliciós, <strong>avisa IT immediatament</strong> — cada minut compta.</li>
</ol>

<blockquote>
  El 91% dels ciberatacs comencen amb un correu de phishing. La teva vigilància és la primera i més important línia de defensa de TAVIL.
</blockquote>
HTML;

$db->prepare('UPDATE quizzes SET body_html=? WHERE id=6')->execute([$body]);
echo "✓ Updated quiz 6 (Seguretat Informàtica i Phishing) with body_html\n";
echo "Done.\n";
