<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function respond(int $status, bool $success): void
{
    http_response_code($status);
    echo json_encode(['success' => $success]);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(405, false);
}

$allowedOrigins = ['https://luxiad.eu', 'https://www.luxiad.eu'];
if (!in_array($_SERVER['HTTP_ORIGIN'] ?? '', $allowedOrigins, true)) {
    respond(403, false);
}

$contentType = strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0]));
if ($contentType !== 'application/json') {
    respond(415, false);
}

$body = file_get_contents('php://input', false, null, 0, 12001);
if ($body === false || strlen($body) > 12000) {
    respond(413, false);
}

$data = json_decode($body, true, 8);
if (!is_array($data) || ($data['consentement'] ?? null) !== true) {
    respond(422, false);
}

$limits = [
    'entreprise_ou_projet' => 6000,
    'objectif' => 150,
    'domaines' => 250,
    'lancement_souhaite' => 500,
    'budget' => 150,
    'nom' => 200,
    'email' => 254,
    'telephone' => 100,
    'creneau_de_rendez_vous' => 100,
];
$fields = [];
foreach ($limits as $key => $maxBytes) {
    $value = $data[$key] ?? '';
    if (!is_string($value) || strlen($value) > $maxBytes || strpos($value, "\0") !== false) {
        respond(422, false);
    }
    $fields[$key] = trim($value);
}

$email = $fields['email'];
if ($fields['nom'] === '' || preg_match('/[\r\n]/', $email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(422, false);
}

// Keep only short-lived rate counters in the hosting account's private tmp directory.
$rateFile = dirname(__DIR__) . '/tmp/luxiad-contact-rate.json';
$rate = @fopen($rateFile, 'c+');
if ($rate === false || !flock($rate, LOCK_EX)) {
    respond(503, false);
}
@chmod($rateFile, 0600);
$now = time();
$ip = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . '|' . intdiv($now, 3600));
$counters = json_decode(stream_get_contents($rate) ?: '{}', true);
$counters = is_array($counters) ? $counters : [];
$counters = array_filter($counters, static function ($entry) use ($now) {
    return is_array($entry) && ($entry['until'] ?? 0) > $now;
});
$global = $counters['global'] ?? ['until' => $now + 600, 'count' => 0];
$source = $counters[$ip] ?? ['until' => (intdiv($now, 3600) + 1) * 3600, 'count' => 0];
if ($global['count'] >= 20 || $source['count'] >= 5) {
    fclose($rate);
    header('Retry-After: ' . max(1, ($global['count'] >= 20 ? $global['until'] : $source['until']) - $now));
    respond(429, false);
}
$global['count']++;
$source['count']++;
$counters['global'] = $global;
$counters[$ip] = $source;
$rateJson = json_encode($counters);
$saved = rewind($rate) && ftruncate($rate, 0) && fwrite($rate, $rateJson) === strlen($rateJson) && fflush($rate);
fclose($rate);
if (!$saved) {
    respond(503, false);
}

$labels = [
    'nom' => 'Nom',
    'email' => 'E-mail',
    'telephone' => 'Téléphone',
    'entreprise_ou_projet' => 'Entreprise ou projet',
    'objectif' => 'Objectif',
    'domaines' => 'Domaines',
    'lancement_souhaite' => 'Lancement souhaité',
    'budget' => 'Budget',
    'creneau_de_rendez_vous' => 'Créneau souhaité',
];
$message = ["Nouvelle demande depuis https://luxiad.eu/#contact", ''];
foreach ($labels as $key => $label) {
    $message[] = $label . ' : ' . ($fields[$key] === '' ? 'Non renseigné' : $fields[$key]);
}

$recipient = 'admin@luxiad.eu';
$headers = [
    'From: LUXIAD <' . $recipient . '>',
    'Reply-To: ' . $email,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: quoted-printable',
];
$sent = @mail($recipient, 'Nouveau projet Luxiad - formulaire du site', quoted_printable_encode(implode("\r\n", $message)), implode("\r\n", $headers));
respond($sent ? 200 : 502, $sent);
