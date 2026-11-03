'use strict';
// Rechtstexte. Stand und Versionskennung werden bei jeder Bestellung gespeichert.
// Diese Texte sind sorgfältig erstellte Entwürfe und vor dem Start anwaltlich zu prüfen.
const { html, raw } = require('./util');

const LEGAL_VERSION = '2026-11-03';

const CONSENT_TEXTS = {
  terms: 'Ich habe die AGB gelesen und akzeptiere sie.',
  earlyStart: 'Ich verlange ausdrücklich, dass ihr vor Ablauf der Widerrufsfrist mit der Bereitstellung der digitalen Inhalte beginnt.',
  earlyKnowledge: 'Mir ist bekannt, dass ich durch diese Zustimmung mit Beginn der Bereitstellung mein Widerrufsrecht verliere.',
};

function address(b) {
  return html`${b.legal_name}<br>${b.owner_name !== b.legal_name ? html`Inhaber/in: ${b.owner_name}<br>` : ''}${b.street}<br>${b.zip} ${b.city}<br>${b.country}`;
}

function impressum(b) {
  return html`
<h1>Impressum</h1>
<h2>Angaben gemäß § 5 DDG</h2>
<p>${address(b)}</p>
<h2>Kontakt</h2>
<p>Telefon: ${b.phone}<br>E-Mail: <a href="mailto:${b.email}">${b.email}</a></p>
${b.vat_id ? html`<h2>Umsatzsteuer-Identifikationsnummer</h2><p>gemäß § 27a Umsatzsteuergesetz: ${b.vat_id}</p>` : ''}
${b.wid ? html`<h2>Wirtschafts-Identifikationsnummer</h2><p>${b.wid}</p>` : ''}
${b.register ? html`<h2>Registereintrag</h2><p>${b.register}</p>` : ''}
${b.trade_note ? html`<h2>Angaben zur Berufs- bzw. Gewerbeausübung</h2><p>${b.trade_note}</p>` : ''}
<h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
<p>${b.content_responsible}<br>Anschrift wie oben</p>
<h2>Verbraucherstreitbeilegung</h2>
<p>Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
<h2>Hinweis</h2>
<p>Die Inhalte dieser Website und unserer Produkte dienen der allgemeinen Information und Organisation. Sie stellen keine Steuer- oder Rechtsberatung dar.</p>`;
}

function datenschutz(b, cfg) {
  const hosting = b.hosting_provider || '[[BITTE ERGÄNZEN: Hosting-Anbieter mit Anschrift]]';
  const mail = b.email_provider || '[[BITTE ERGÄNZEN: E-Mail-Versanddienstleister mit Anschrift]]';
  return html`
<h1>Datenschutzerklärung</h1>
<p>Stand: 03.11.2026</p>
<h2>1. Verantwortlicher</h2>
<p>${address(b)}<br>E-Mail: <a href="mailto:${b.email}">${b.email}</a> · Telefon: ${b.phone}</p>
<p>Ein Datenschutzbeauftragter ist nicht benannt, da die gesetzlichen Voraussetzungen (§ 38 BDSG) nicht vorliegen.</p>

<h2>2. Grundsätze</h2>
<p>Wir verarbeiten personenbezogene Daten nur, soweit es für den Betrieb dieser Website, die Abwicklung von Bestellungen oder aufgrund Ihrer Einwilligung erforderlich ist. Unsere Produkte (Excel-Arbeitsmappen) laufen vollständig auf Ihrem Gerät; die darin eingegebenen Daten erhalten wir nicht.</p>

<h2>3. Hosting und Server-Logfiles</h2>
<p>Diese Website wird gehostet bei: ${hosting}. Mit dem Anbieter besteht ein Vertrag zur Auftragsverarbeitung (Art. 28 DSGVO). Beim Aufruf der Website verarbeitet der Server technisch notwendige Daten (IP-Adresse, Datum und Uhrzeit, aufgerufene Seite, übertragene Datenmenge, Browser-Kennung). Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO; unser berechtigtes Interesse liegt im sicheren und stabilen Betrieb. Logfiles werden nach spätestens 7 Tagen gelöscht, sofern sie nicht zur Aufklärung eines Sicherheitsvorfalls benötigt werden.</p>

<h2>4. Reichweitenmessung ohne Cookies</h2>
<p>Wir zählen serverseitig, wie oft einzelne Seiten pro Tag aufgerufen werden. Dabei werden keine Cookies gesetzt, keine IP-Adressen gespeichert und keine Nutzerprofile gebildet; gespeichert wird nur die Summe je Seite und Tag. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (Interesse an der Verbesserung unseres Angebots).</p>

<h2>5. Bestellung und Vertragsabwicklung</h2>
<p>Für eine Bestellung verarbeiten wir Ihre E-Mail-Adresse, die gewählte Edition, Preis, Zeitpunkt der Bestellung, Ihre im Bestellprozess abgegebenen Erklärungen (AGB, Zustimmung zur vorzeitigen Bereitstellung), Zahlungsstatus, Rechnungsnummer, das Land Ihrer Rechnungsadresse (für die umsatzsteuerliche Behandlung) sowie Zeitpunkte von Downloads. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Vertrag) und Art. 6 Abs. 1 lit. c DSGVO (steuer- und handelsrechtliche Aufbewahrungspflichten). Bestell- und Rechnungsdaten bewahren wir für die gesetzlichen Fristen (bis zu 10 Jahre, § 147 AO, § 257 HGB) auf. Nicht abgeschlossene Bestellungen löschen wir nach 30 Tagen.</p>

<h2>6. Zahlungsabwicklung über Stripe</h2>
<p>Zahlungen wickeln wir über Stripe ab: Stripe Payments Europe, Ltd., 1 Grand Canal Street Lower, Grand Canal Dock, Dublin, D02 H210, Irland. Wenn Sie auf „Zahlungspflichtig bestellen“ klicken, werden Sie auf eine Bezahlseite von Stripe weitergeleitet. Stripe verarbeitet dort Ihre Zahlungsdaten (z. B. Kartendaten, Name, Rechnungsadresse, E-Mail) und Daten zur Betrugsprävention. Wir erhalten keine vollständigen Karten- oder Kontodaten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO sowie Art. 6 Abs. 1 lit. f DSGVO (Betrugsprävention). Stripe kann Daten auch an die Stripe, Inc. in den USA übermitteln; Stripe ist nach dem EU-U.S. Data Privacy Framework zertifiziert und setzt zusätzlich Standardvertragsklauseln ein. Für bestimmte Verarbeitungen ist Stripe selbst verantwortlich. Details: <a href="https://stripe.com/de/privacy" rel="noopener">stripe.com/de/privacy</a>. Wählen Sie bei Stripe PayPal als Zahlungsart, verarbeitet zusätzlich PayPal (Europe) S.à r.l. et Cie, S.C.A., 22–24 Boulevard Royal, L-2449 Luxemburg, Ihre Daten: <a href="https://www.paypal.com/de/legalhub/privacy-full" rel="noopener">PayPal-Datenschutzerklärung</a>.</p>

<h2>7. E-Mail-Versand</h2>
<p>Bestellbestätigungen, Download-Links, Rechnungen und Eingangsbestätigungen versenden wir über: ${mail}. Mit dem Anbieter besteht ein Vertrag zur Auftragsverarbeitung. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b bzw. lit. c DSGVO.</p>

<h2>8. Kontaktformular und E-Mail-Kontakt</h2>
<p>Wenn Sie uns schreiben, verarbeiten wir Name, E-Mail-Adresse und Nachricht, um Ihre Anfrage zu beantworten (Art. 6 Abs. 1 lit. b DSGVO bei vertragsbezogenen Anfragen, sonst lit. f). Nachrichten aus dem Kontaktformular löschen wir 6 Monate nach Eingang, sofern keine gesetzlichen Aufbewahrungspflichten bestehen.</p>

<h2>9. Widerrufsfunktion</h2>
<p>Wenn Sie über „Vertrag widerrufen“ einen Widerruf erklären, verarbeiten wir Ihren Namen, Ihre E-Mail-Adresse, die Bestellnummer und den Zeitpunkt des Eingangs, um den Widerruf zu bearbeiten und Ihnen den Eingang zu bestätigen (Art. 6 Abs. 1 lit. c DSGVO). Die Daten werden mit den Bestelldaten aufbewahrt.</p>

<h2>10. Newsletter</h2>
<p>Unseren Newsletter erhalten Sie nur mit Ihrer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO) im Double-Opt-in-Verfahren: Nach der Anmeldung senden wir eine E-Mail mit einem Bestätigungslink. Wir speichern E-Mail-Adresse, Zeitpunkt der Anmeldung und der Bestätigung sowie die Version des Einwilligungstextes als Nachweis. Sie können die Einwilligung jederzeit über den Abmeldelink in jeder E-Mail widerrufen. Nach der Abmeldung speichern wir Ihre Adresse nur noch zum Nachweis der früheren Einwilligung bzw. zur Beachtung des Widerspruchs, längstens 3 Jahre.</p>

<h2>11. Cookies und lokale Speicherung</h2>
<p>Diese Website setzt standardmäßig keine Cookies. ${cfg.tiktokPixelId ? 'Ihre Auswahl im Einwilligungsbanner speichern wir im lokalen Speicher Ihres Browsers; dies ist zur Bereitstellung der von Ihnen gewünschten Funktion unbedingt erforderlich (§ 25 Abs. 2 Nr. 2 TDDDG).' : ''}</p>
${cfg.tiktokPixelId ? html`
<h2>12. TikTok Pixel (nur mit Einwilligung)</h2>
<p>Nur wenn Sie im Einwilligungsbanner auf „Akzeptieren“ klicken, laden wir das TikTok Pixel der TikTok Technology Limited, 10 Earlsfort Terrace, Dublin, D02 T380, Irland. Es dient der Messung, ob unsere Werbeanzeigen auf TikTok zu Seitenaufrufen und Käufen führen, und ermöglicht TikTok Werbung an ähnliche Zielgruppen auszuspielen. Dabei werden Informationen auf Ihrem Gerät gespeichert bzw. ausgelesen und Daten (z. B. IP-Adresse, Geräteinformationen, besuchte Seiten, Kaufereignis mit Betrag) an TikTok übermittelt; eine Übermittlung in Drittländer (z. B. USA, Singapur, China) ist möglich. Rechtsgrundlage sind § 25 Abs. 1 TDDDG und Art. 6 Abs. 1 lit. a DSGVO. Für die Erhebung und Übermittlung sind wir mit TikTok gemeinsam verantwortlich (Art. 26 DSGVO). Sie können Ihre Einwilligung jederzeit über „Cookie-Einstellungen“ im Fußbereich widerrufen. Details: <a href="https://www.tiktok.com/legal/privacy-policy-eea" rel="noopener">TikTok-Datenschutzrichtlinie</a>.</p>` : ''}

<h2>${cfg.tiktokPixelId ? '13' : '12'}. Ihre Rechte</h2>
<p>Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch gegen Verarbeitungen auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO (Art. 21). Eine erteilte Einwilligung können Sie jederzeit mit Wirkung für die Zukunft widerrufen. Sie haben außerdem das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren, insbesondere in dem Bundesland Ihres Wohnorts oder unseres Sitzes.</p>
<p>Eine Pflicht zur Bereitstellung Ihrer Daten besteht nicht; ohne E-Mail-Adresse können wir jedoch keine Bestellung ausliefern. Eine automatisierte Entscheidungsfindung im Sinne von Art. 22 DSGVO findet nicht statt.</p>`;
}

function widerrufsbelehrung(b, cfg) {
  return html`
<h1>Widerrufsbelehrung</h1>
<p>Verbraucherinnen und Verbrauchern steht ein Widerrufsrecht nach folgender Maßgabe zu. Verbraucher ist jede natürliche Person, die ein Rechtsgeschäft zu Zwecken abschließt, die überwiegend weder ihrer gewerblichen noch ihrer selbständigen beruflichen Tätigkeit zugerechnet werden können (§ 13 BGB).</p>
<h2>Widerrufsrecht</h2>
<p>Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.</p>
<p>Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsabschlusses.</p>
<p>Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (${b.legal_name}, ${b.street}, ${b.zip} ${b.city}, ${b.country}, Telefon: ${b.phone}, E-Mail: ${b.email}) mittels einer eindeutigen Erklärung (z. B. ein mit der Post versandter Brief oder E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können dafür das beigefügte Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist. Sie können Ihren Widerruf auch über die Widerrufsfunktion auf unserer Website erklären: <a href="${cfg.baseUrl}/vertrag-widerrufen">${cfg.baseUrl}/vertrag-widerrufen</a> („Vertrag widerrufen“). Den Eingang eines solchen Widerrufs bestätigen wir Ihnen unverzüglich per E-Mail.</p>
<p>Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.</p>
<h2>Folgen des Widerrufs</h2>
<p>Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart; in keinem Fall werden Ihnen wegen dieser Rückzahlung Entgelte berechnet.</p>
<h2>Besonderer Hinweis zum vorzeitigen Erlöschen</h2>
<p>Ihr Widerrufsrecht erlischt bei einem Vertrag über die Bereitstellung von nicht auf einem körperlichen Datenträger befindlichen digitalen Inhalten, wenn wir mit der Ausführung des Vertrags begonnen haben, nachdem Sie ausdrücklich zugestimmt haben, dass wir mit der Ausführung des Vertrags vor Ablauf der Widerrufsfrist beginnen, Sie Ihre Kenntnis davon bestätigt haben, dass durch Ihre Zustimmung mit Beginn der Ausführung des Vertrags Ihr Widerrufsrecht erlischt, und wir Ihnen eine Bestätigung des Vertrags auf einem dauerhaften Datenträger (E-Mail) zur Verfügung gestellt haben (§ 356 Abs. 5 BGB).</p>
<p>Ob Sie diese Zustimmung erteilen, entscheiden Sie im Bestellprozess selbst. Ohne Zustimmung bleibt Ihr Widerrufsrecht bestehen; den Download stellen wir Ihnen dann nach Ablauf der Widerrufsfrist bereit.</p>
<h2>Muster-Widerrufsformular</h2>
<p>(Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses Formular aus und senden Sie es zurück.)</p>
<div class="form-sample">
<p>– An ${b.legal_name}, ${b.street}, ${b.zip} ${b.city}, ${b.country}, E-Mail: ${b.email}:</p>
<p>– Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über den Kauf der folgenden Waren (*)/die Erbringung der folgenden Dienstleistung (*)/die Bereitstellung der folgenden digitalen Inhalte (*)</p>
<p>– Bestellt am (*)/erhalten am (*)</p>
<p>– Name des/der Verbraucher(s)</p>
<p>– Anschrift des/der Verbraucher(s)</p>
<p>– Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier)</p>
<p>– Datum</p>
<p>(*) Unzutreffendes streichen.</p>
</div>`;
}

function agb(b, cfg) {
  const vat = b.vat_mode === 'regel'
    ? 'Alle Preise sind Endpreise und enthalten die gesetzliche Umsatzsteuer.'
    : 'Alle Preise sind Endpreise. Gemäß § 19 UStG erheben wir keine Umsatzsteuer und weisen diese daher auch nicht aus.';
  return html`
<h1>Allgemeine Geschäftsbedingungen</h1>
<p>Stand: 03.11.2026</p>
<h2>§ 1 Geltungsbereich</h2>
<p>(1) Diese AGB gelten für alle Verträge über digitale Produkte, die Sie über die Website ${cfg.baseUrl} mit ${b.legal_name}, ${b.street}, ${b.zip} ${b.city} („wir“) schließen.</p>
<p>(2) Verbraucher ist jede natürliche Person, die ein Rechtsgeschäft zu Zwecken abschließt, die überwiegend weder ihrer gewerblichen noch ihrer selbständigen beruflichen Tätigkeit zugerechnet werden können (§ 13 BGB). Unternehmer ist jede natürliche oder juristische Person oder rechtsfähige Personengesellschaft, die bei Abschluss eines Rechtsgeschäfts in Ausübung ihrer gewerblichen oder selbständigen beruflichen Tätigkeit handelt (§ 14 BGB).</p>
<p>(3) Abweichende Bedingungen von Kundinnen und Kunden gelten nicht, es sei denn, wir stimmen ihnen ausdrücklich zu.</p>
<h2>§ 2 Vertragsgegenstand</h2>
<p>(1) Wir verkaufen digitale Inhalte zum Download, insbesondere Tabellenkalkulations-Arbeitsmappen (Dateiformat .xlsx), PDF-Dokumente und Kalenderdateien. Der Leistungsumfang ergibt sich aus der Produktbeschreibung zum Zeitpunkt der Bestellung.</p>
<p>(2) Zur Nutzung benötigen Sie ein Tabellenkalkulationsprogramm, das .xlsx-Dateien verarbeitet (z. B. Microsoft Excel ab Version 2016, LibreOffice Calc ab Version 7 oder Google Sheets), sowie ein Programm zum Öffnen von PDF-Dateien.</p>
<p>(3) Die Produkte sind Werkzeuge zur eigenen Organisation und Schätzung. Sie stellen keine Steuer- oder Rechtsberatung dar und ersetzen keine Steuererklärung. Berechnungen beruhen auf Ihren Eingaben und den in Handbuch und Produktbeschreibung genannten vereinfachenden Annahmen. Diese Annahmen sind Teil der vereinbarten Beschaffenheit.</p>
<h2>§ 3 Vertragsschluss</h2>
<p>(1) Die Darstellung der Produkte auf der Website ist kein rechtlich bindendes Angebot, sondern eine Aufforderung zur Bestellung.</p>
<p>(2) Im Bestellprozess wählen Sie eine Edition, geben Ihre E-Mail-Adresse ein und können Ihre Eingaben bis zum Absenden über die Eingabefelder prüfen und korrigieren. Mit Klick auf die Schaltfläche „Zahlungspflichtig bestellen“ geben Sie ein verbindliches Angebot zum Abschluss eines Kaufvertrags ab. Anschließend werden Sie zur Zahlung an unseren Zahlungsdienstleister Stripe weitergeleitet.</p>
<p>(3) Wir nehmen Ihr Angebot an, indem wir Ihnen nach Eingang der Zahlung eine Bestellbestätigung per E-Mail senden. Wird die Zahlung nicht innerhalb von 24 Stunden nach Absenden der Bestellung abgeschlossen, sind Sie an Ihr Angebot nicht mehr gebunden und die Bestellung verfällt.</p>
<p>(4) Vertragssprache ist Deutsch. Wir speichern den Vertragstext. Die AGB und die Widerrufsbelehrung senden wir Ihnen mit der Bestellbestätigung per E-Mail; sie sind außerdem jederzeit auf dieser Website abrufbar.</p>
<h2>§ 4 Preise und Zahlung</h2>
<p>(1) ${vat} Versandkosten fallen nicht an.</p>
<p>(2) Die Zahlung erfolgt über Stripe mit den im Bestellprozess angezeigten Zahlungsarten (z. B. Kredit- oder Debitkarte, Apple Pay, Google Pay, PayPal). Der Kaufpreis ist mit Abschluss der Bestellung sofort fällig.</p>
<p>(3) Sie erhalten eine Rechnung im Format einer Kleinbetragsrechnung bzw. Rechnung nach § 14 UStG über den Link in der Bestellbestätigung.</p>
<h2>§ 5 Bereitstellung</h2>
<p>(1) Wir stellen die digitalen Inhalte über einen persönlichen, zeitlich begrenzten Download-Link bereit, den wir per E-Mail versenden. Einen neuen Link können Sie jederzeit unter „Meine Downloads“ mit Ihrer Bestell-E-Mail-Adresse anfordern. Bitte speichern Sie die Dateien nach dem Download dauerhaft.</p>
<p>(2) Haben Sie als Verbraucher im Bestellprozess ausdrücklich zugestimmt, dass wir vor Ablauf der Widerrufsfrist mit der Bereitstellung beginnen, und Ihre Kenntnis vom Verlust des Widerrufsrechts bestätigt, erfolgt die Bereitstellung unmittelbar nach Zahlungseingang. Andernfalls stellen wir die Inhalte nach Ablauf der Widerrufsfrist bereit.</p>
<h2>§ 6 Nutzungsrechte</h2>
<p>(1) Mit vollständiger Zahlung erhalten Sie ein einfaches, zeitlich unbeschränktes, nicht übertragbares Recht, die Inhalte für eigene Zwecke einer Person bzw. eines Unternehmens zu nutzen, zu speichern, auszudrucken und für die eigene Nutzung anzupassen.</p>
<p>(2) Nicht gestattet ist es, die Inhalte ganz oder teilweise – auch in veränderter Form – weiterzuverkaufen, zu verschenken, öffentlich zugänglich zu machen, als Vorlage in eigenen Produkten zu vertreiben oder Dritten zur Verfügung zu stellen. Steuerberaterinnen und Steuerberater sowie Dienstleister dürfen die Dateien eines Kunden zur Bearbeitung für diesen Kunden verwenden. Für die Nutzung in mehreren Unternehmen ist je Unternehmen eine Lizenz erforderlich.</p>
<h2>§ 7 Widerrufsrecht</h2>
<p>Verbraucherinnen und Verbrauchern steht ein Widerrufsrecht nach Maßgabe der <a href="/widerrufsbelehrung">Widerrufsbelehrung</a> zu. Der Widerruf kann auch über die Funktion „Vertrag widerrufen“ auf dieser Website erklärt werden.</p>
<h2>§ 8 Mängelrechte und Aktualisierungen</h2>
<p>(1) Es gelten die gesetzlichen Mängelrechte, für Verbraucher insbesondere die §§ 327 ff. BGB. Wir stellen Aktualisierungen bereit, die zum Erhalt der Vertragsmäßigkeit erforderlich sind, und informieren Sie darüber per E-Mail.</p>
<p>(2) Steuerliche Werte eines Veranlagungsjahres (z. B. Tarif 2026) bleiben für dieses Jahr gültig. Die Anpassung an Rechtsänderungen künftiger Jahre ist nicht geschuldet. Hierfür bieten wir neue Jahresausgaben an.</p>
<h2>§ 9 Haftung</h2>
<p>(1) Wir haften unbeschränkt bei Vorsatz und grober Fahrlässigkeit, bei der Verletzung von Leben, Körper oder Gesundheit, nach dem Produkthaftungsgesetz sowie im Umfang einer übernommenen Garantie.</p>
<p>(2) Bei leicht fahrlässiger Verletzung einer wesentlichen Vertragspflicht, deren Erfüllung die ordnungsgemäße Durchführung des Vertrags überhaupt erst ermöglicht und auf deren Einhaltung Sie regelmäßig vertrauen dürfen, ist die Haftung auf den vertragstypischen, vorhersehbaren Schaden begrenzt. Im Übrigen ist die Haftung für leichte Fahrlässigkeit ausgeschlossen.</p>
<p>(3) Die vorstehenden Beschränkungen gelten auch zugunsten unserer Erfüllungsgehilfen.</p>
<h2>§ 10 Streitbeilegung</h2>
<p>Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
<h2>§ 11 Schlussbestimmungen</h2>
<p>(1) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts. Bei Verbrauchern gilt diese Rechtswahl nur, soweit nicht der Schutz durch zwingende Bestimmungen des Rechts des Staates, in dem sie ihren gewöhnlichen Aufenthalt haben, entzogen wird.</p>
<p>(2) Sind Sie Kaufmann, juristische Person des öffentlichen Rechts oder öffentlich-rechtliches Sondervermögen, ist Gerichtsstand für alle Streitigkeiten unser Geschäftssitz.</p>
<p>(3) Sollte eine Bestimmung dieser AGB unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.</p>`;
}

function zahlungLieferung(b, cfg) {
  return html`
<h1>Zahlung und Lieferung</h1>
<h2>Zahlungsarten</h2>
<p>Die Zahlung erfolgt sicher über unseren Zahlungsdienstleister Stripe. Welche Zahlungsarten verfügbar sind (z. B. Kredit- und Debitkarte, Apple Pay, Google Pay, PayPal), sehen Sie auf der Bezahlseite. Ihre Karten- und Kontodaten werden ausschließlich von Stripe verarbeitet.</p>
<h2>Preise</h2>
<p>${b.vat_mode === 'regel' ? 'Alle Preise sind Endpreise inklusive der gesetzlichen Umsatzsteuer.' : 'Alle Preise sind Endpreise. Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.'}</p>
<h2>Lieferung</h2>
<p>Unsere Produkte sind digitale Inhalte. Es gibt keinen Versand und keine Versandkosten.</p>
<ul>
<li><strong>Mit Zustimmung zur sofortigen Bereitstellung:</strong> Sie erhalten den Download-Link per E-Mail in der Regel innerhalb weniger Minuten nach Zahlungseingang.</li>
<li><strong>Ohne Zustimmung:</strong> Ihr Widerrufsrecht bleibt bestehen. Wir senden Ihnen den Download-Link nach Ablauf der 14-tägigen Widerrufsfrist.</li>
<li><strong>Zahlungsarten mit verzögerter Bestätigung</strong> (z. B. Lastschrift) werden erst nach Bestätigung durch Stripe ausgeliefert.</li>
</ul>
<p>Der Download-Link ist ${cfg.downloadLinkDays} Tage gültig. Einen neuen Link erhalten Sie jederzeit unter <a href="/meine-downloads">Meine Downloads</a>.</p>
<h2>Rechnung</h2>
<p>Ihre Rechnung können Sie über den Link in der Bestellbestätigung aufrufen und als PDF speichern oder drucken.</p>`;
}

function htmlToText(h) {
  return String(h)
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<\/(p|h1|h2|h3|li|div)>/g, '\n')
    .replace(/<li>/g, '• ')
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([^<]*)<\/a>/g, (m, href, txt) => (txt.includes(href.replace(/^mailto:/, '')) ? txt : `${txt} (${href})`))
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

module.exports = { LEGAL_VERSION, CONSENT_TEXTS, impressum, datenschutz, widerrufsbelehrung, agb, zahlungLieferung, htmlToText, raw };
