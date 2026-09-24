// Blog content: genuinely useful, non-thin articles tied to real search
// intent around specific tools, each linking back to the tool it covers.
// This is on-page SEO content, not filler — every article answers a
// question people actually search for.
export const BLOG_POSTS = [
  {
    slug: 'reduce-pdf-file-size-without-losing-quality',
    title: 'How to Reduce PDF File Size Without Losing Quality',
    description:
      'Why PDFs get bloated, what actually shrinks them, and how to compress a PDF online without wrecking the text or images inside it.',
    date: '2026-09-20',
    readingMinutes: 5,
    toolSlug: 'pdf-compress',
    toolLabel: 'PDF Compress',
    html: `
<p>A PDF that should be 2MB somehow ends up at 40MB, and email or a form upload rejects it. This happens for a few predictable reasons, and once you know them, shrinking the file is usually quick — without turning your text blurry or your charts into mush.</p>

<h2>Why PDFs get so large in the first place</h2>
<p>Almost always, it's the images. A PDF built from scanned pages or screenshots embeds each page as a full-resolution image — often far higher resolution than a screen or printer actually needs. A single 300 DPI scanned page can be several megabytes on its own; multiply that by 40 pages and you get an unworkable file. Other common culprits: embedded fonts (especially full font families instead of just the characters used), uncompressed vector graphics, and duplicate objects left behind by repeated edits in Word or Google Docs before exporting.</p>

<h2>What compression actually does</h2>
<p>PDF compression works mainly by re-encoding embedded images at a lower resolution or with a more efficient codec (JPEG instead of raw bitmap data, for instance), and by removing redundant internal structure the PDF format allows to accumulate. Good compression is selective: it targets the images and bloat, not the text layer, so words stay sharp and remain selectable and searchable — only the pixels in photos and scans get resampled.</p>

<h2>The quality trade-off, and how to control it</h2>
<p>There's no free lunch: pushing image resolution down far enough will eventually show. The practical approach is to match compression to the PDF's purpose:</p>
<ul>
<li><b>For screen reading or email</b> — aggressive compression is safe. Nobody is zooming into a report on a laptop screen past what 150 DPI images can show.</li>
<li><b>For printing</b> — stay conservative. Print reveals resolution loss that a screen hides, especially in photos.</li>
<li><b>For scanned text documents</b> — compress hard. A scanned invoice doesn't need photographic detail to remain legible.</li>
</ul>

<h2>How to do it</h2>
<p>Use <a href="/tool/pdf-compress">Oxvid Tools' PDF Compress</a> — it runs entirely in your browser (no upload to a server), lets you pick a compression level, and shows you the resulting file size before you download. For most everyday documents, a medium setting cuts file size dramatically with no visible quality loss. If you're preparing something for print, try the lightest setting first and compare it against the original before committing to more.</p>

<h2>A quick checklist before you compress</h2>
<ul>
<li>Check if the bloat is from images (scanned pages, screenshots) or fonts — image-heavy PDFs compress far more dramatically.</li>
<li>If the PDF was exported from Word/Docs, try re-exporting with "reduce file size" options enabled first, then compress on top of that.</li>
<li>Keep an uncompressed original — compression is generally one-directional in practice, even though it's not literally destructive to the source.</li>
</ul>`,
  },
  {
    slug: 'json-formatter-guide-why-when-you-need-one',
    title: 'JSON Formatter: What It Is and When You Actually Need One',
    description:
      "A plain-English explanation of JSON formatting, why minified JSON is unreadable, and when pretty-printing versus validating actually matters.",
    date: '2026-09-18',
    readingMinutes: 4,
    toolSlug: 'json-formatter',
    toolLabel: 'JSON Formatter',
    html: `
<p>If you've ever opened an API response or a config file and seen one impossibly long line of curly braces and commas, you've met minified JSON — and you've probably reached for a formatter without fully knowing what it's doing. Here's the short version.</p>

<h2>What JSON formatting actually changes</h2>
<p>JSON (JavaScript Object Notation) doesn't care about whitespace — <code>{"a":1,"b":2}</code> and a nicely indented multi-line version mean exactly the same thing to any program that parses it. A formatter (often called a "beautifier" or "pretty-printer") only adds line breaks and indentation so a <i>human</i> can see the structure — which keys are nested inside which objects, where an array starts and ends. It changes nothing about the data itself.</p>

<h2>Formatting vs. validating vs. minifying</h2>
<p>These three get used interchangeably but do different jobs:</p>
<ul>
<li><b>Formatting (pretty-printing)</b> — adds indentation and line breaks for readability. Use this when you're debugging or reading JSON a person needs to understand.</li>
<li><b>Validating</b> — checks whether the JSON is syntactically correct at all (matched brackets, quoted keys, no trailing commas). Use this when something is failing to parse and you need to find the exact broken character.</li>
<li><b>Minifying</b> — the opposite of formatting: strips all unnecessary whitespace to make the file as small as possible for transmission. Use this before shipping JSON over a network, never while you're trying to read it.</li>
</ul>

<h2>When it actually matters</h2>
<p>Three situations come up constantly:</p>
<ul>
<li><b>Debugging an API response</b> — most browser dev tools format JSON automatically now, but copy-pasted logs, webhook payloads, or JSON pasted into a ticket often aren't. Formatting it first turns a wall of text into something you can actually scan.</li>
<li><b>Editing a config file by hand</b> — package.json, tsconfig.json, and similar files should always be kept formatted; a minified config is a nightmare to review in a diff.</li>
<li><b>Finding a syntax error</b> — a missing comma or an extra bracket in a 500-line minified blob is nearly impossible to spot by eye. Validating first tells you a parse failed and usually where; formatting afterward makes the surrounding structure visible.</li>
</ul>

<h2>Try it</h2>
<p><a href="/tool/json-formatter">Oxvid Tools' JSON Formatter</a> pretty-prints instantly as you paste, and the site also has a separate <a href="/tool/json-validator">JSON Validator</a> and <a href="/tool/json-minifier">JSON Minifier</a> for the other two jobs — all running locally in your browser, so nothing you paste is sent anywhere.</p>`,
  },
  {
    slug: 'qr-codes-explained-types-uses-how-to-create',
    title: 'QR Codes Explained: Types, Uses and How to Create Your Own',
    description:
      'What a QR code actually stores, the difference between static and dynamic codes, and how to generate one that works reliably when scanned.',
    date: '2026-09-15',
    readingMinutes: 5,
    toolSlug: 'qr-code-generator',
    toolLabel: 'QR Code Generator',
    html: `
<p>QR codes went from a niche manufacturing tool to something on every menu, poster and product label. Most people can scan one without a second thought, but generating one that actually works reliably — every time, on every phone — has a few gotchas worth knowing.</p>

<h2>What's actually inside a QR code</h2>
<p>A QR code is just a compact, error-tolerant way of encoding text. That's it — the "magic" is in the camera app decoding a grid of black and white squares back into a string. What that string <i>contains</i> determines what happens when it's scanned:</p>
<ul>
<li><b>A URL</b> — the phone opens a browser to that address. This is the overwhelming majority of real-world use.</li>
<li><b>Plain text</b> — the phone just displays it, useful for short messages or instructions.</li>
<li><b>A vCard</b> (contact format) — the phone offers to save it as a new contact.</li>
<li><b>Wi-Fi credentials</b> — a specially formatted string that lets the phone offer to join a network directly.</li>
</ul>

<h2>Static vs. "dynamic" QR codes</h2>
<p>A QR code you generate for free — including with a tool like this one — is <b>static</b>: the data is baked directly into the pattern, permanently. Some paid services sell "dynamic" QR codes, where the code actually points to a short redirect URL on their server, which they can then repoint later without changing the printed code. That's genuinely useful if you're printing thousands of codes on physical products and might need to update the destination — but it also means the code stops working forever if you ever stop paying them. For most uses (a menu, a business card, a flyer for an event that isn't going to move), a static code is simpler, free, and never expires.</p>

<h2>Why some QR codes fail to scan</h2>
<p>A few practical things break real-world scanning more often than people expect:</p>
<ul>
<li><b>Too little contrast</b> — light gray on white, or a code printed on a busy background image, is the single most common cause of scan failures.</li>
<li><b>Too small for the distance</b> — a code meant to be scanned from across a room needs to be physically larger, not just higher resolution.</li>
<li><b>Damaged or covered corners</b> — the three large squares in three corners of the code are how the scanner orients itself; covering one with a logo or a fold in printed material can break decoding entirely.</li>
<li><b>Encoding way too much text</b> — very long URLs or blocks of text produce a denser, harder-to-scan pattern. Shortening the URL first keeps the code simpler and more reliable.</li>
</ul>

<h2>Generate one</h2>
<p><a href="/tool/qr-code-generator">Oxvid Tools' QR Code Generator</a> creates a static code from any text or URL, entirely in your browser, and lets you download it as a PNG at the size you need — no account, no expiring links, no tracking.</p>`,
  },
  {
    slug: 'how-to-calculate-bmi-and-what-it-really-means',
    title: "How to Calculate BMI (and What It Doesn't Tell You)",
    description:
      'The BMI formula explained simply, what the standard categories actually mean, and the well-documented limitations worth knowing before you read too much into a single number.',
    date: '2026-09-12',
    readingMinutes: 4,
    toolSlug: 'bmi-calculator',
    toolLabel: 'BMI Calculator',
    html: `
<p>Body Mass Index shows up on every medical intake form and fitness app, but it's also one of the most misunderstood numbers in everyday health. Here's what it actually measures, and — just as important — what it doesn't.</p>

<h2>The formula</h2>
<p>BMI is simply weight divided by height squared: <code>BMI = weight (kg) / height (m)²</code>. In imperial units, it's <code>703 × weight (lb) / height (in)²</code>. That's the entire calculation — no age, sex, muscle mass, or body composition factors into it at all. It was developed in the 1830s by a statistician studying population averages, not individual health, which explains a lot about its limitations.</p>

<h2>The standard categories</h2>
<table class="simple">
<tr><th>BMI range</th><th>Category</th></tr>
<tr><td>Below 18.5</td><td>Underweight</td></tr>
<tr><td>18.5–24.9</td><td>Normal weight</td></tr>
<tr><td>25.0–29.9</td><td>Overweight</td></tr>
<tr><td>30.0 and above</td><td>Obese</td></tr>
</table>
<p>These thresholds are population-level guidelines used widely in public health and screening, and they correlate reasonably well with health risk <i>across large groups of people</i>. The trouble starts when the number is applied too literally to any one individual.</p>

<h2>Where BMI genuinely breaks down</h2>
<ul>
<li><b>Muscular people</b> — since BMI can't distinguish muscle from fat, a muscular athlete with low body fat can score as "overweight" or even "obese" purely from muscle mass.</li>
<li><b>Older adults</b> — muscle naturally decreases with age while fat often increases; two people with the same BMI at 30 and 70 can have very different body compositions.</li>
<li><b>Different body types across populations</b> — the same BMI threshold doesn't carry identical health risk across all ethnic groups; several health bodies now recommend adjusted thresholds for some populations.</li>
<li><b>It says nothing about distribution</b> — where fat is carried (particularly around the waist) matters for health risk independent of overall BMI.</li>
</ul>

<h2>What to actually use it for</h2>
<p>BMI is a reasonable, free, instant screening number — a starting point for a conversation, not a diagnosis. It's genuinely useful for tracking your own trend over time (is it moving up or down) and as one input among several a doctor considers, alongside things like waist circumference, blood pressure and bloodwork. It's not a verdict on anyone's health from a single number in isolation.</p>

<h2>Calculate yours</h2>
<p><a href="/tool/bmi-calculator">Oxvid Tools' BMI Calculator</a> does the math instantly in metric or imperial units — useful for tracking your own numbers over time, understood with the context above.</p>`,
  },
  {
    slug: 'password-security-what-actually-makes-a-password-strong',
    title: 'Password Security in 2026: What Actually Makes a Password Strong',
    description:
      "Why 'P@ssw0rd1' is weaker than a string of random words, how password crackers actually work, and what actually matters for a password you'll remember or store.",
    date: '2026-09-08',
    readingMinutes: 6,
    toolSlug: 'password-generator',
    toolLabel: 'Password Generator',
    html: `
<p>Most password advice people absorbed years ago — add a capital letter, a number, a symbol — actively produces weaker passwords than it should, because it optimizes for the wrong thing. Here's what current password security actually comes down to.</p>

<h2>Length beats complexity</h2>
<p>The single biggest factor in how long a password takes to crack by brute force is length, not character variety. Each additional character multiplies the number of possible combinations; each additional <i>type</i> of character (adding symbols on top of letters, say) helps far less by comparison. A 16-character password using only lowercase letters is dramatically harder to brute-force than an 8-character password stuffed with symbols and numbers — because the attacker has to search a vastly larger space, even though each individual character has fewer options.</p>

<h2>Why "P@ssw0rd1" is still weak</h2>
<p>Predictable substitutions (@  for a, 0 for o, 1 for i) don't add real randomness — password-cracking tools have had these substitutions built in for over a decade, because so many people use exactly this pattern to satisfy "must contain a symbol and a number" rules. The password looks complex to a human eye but isn't meaningfully harder to crack than the plain word it's based on.</p>

<h2>How password crackers actually work</h2>
<p>Modern cracking rarely means guessing every possible combination from scratch. Attackers use:</p>
<ul>
<li><b>Dictionary attacks</b> — trying real words, names, and known-leaked passwords first, since people overwhelmingly reuse patterns.</li>
<li><b>Rule-based mutation</b> — taking dictionary words and automatically applying common substitutions (a→@, e→3, adding a trailing "1" or "!").</li>
<li><b>Credential stuffing</b> — trying passwords leaked from one breached site against other sites, which is why reusing a password anywhere is dangerous regardless of how "strong" it looks.</li>
</ul>
<p>True brute force — trying every possible character combination — is the last resort, used only against short passwords, because it's the slowest method by far.</p>

<h2>What actually works</h2>
<ul>
<li><b>Use a password manager and generate random passwords per site.</b> This sidesteps the entire "memorable vs. secure" trade-off — you only need to remember one master password.</li>
<li><b>For anything you must memorize, use a random passphrase</b> — four or five unrelated random words strung together is both long (defeating brute force) and genuinely memorable, unlike a random character string.</li>
<li><b>Never reuse a password across sites.</b> One breached site shouldn't be able to compromise your email, banking, and everything else.</li>
<li><b>Turn on two-factor authentication wherever it's offered</b> — it protects you even if a password does leak.</li>
</ul>

<h2>Generate a strong one</h2>
<p><a href="/tool/password-generator">Oxvid Tools' Password Generator</a> creates a cryptographically random password at the length and character set you choose, entirely in your browser — nothing generated is ever sent anywhere.</p>`,
  },
];

export const BLOG_POST_BY_SLUG = Object.fromEntries(BLOG_POSTS.map((p) => [p.slug, p]));
