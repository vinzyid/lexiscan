import type { Translation } from './id';

/** Anotasi `Translation` yang menjaga kedua berkas tetap sinkron. */
export const en: Translation = {
  languageName: 'English',
  locale: 'en-US',

  splash: {
    title: 'LexiScan',
    tagline: 'Reading made easier',
    subTagline: 'for every student',
    chips: ['OCR Scan', 'AI Simplify', 'Focus Mode', 'Typography'],
    footer: 'DESIGNED FOR DYSLEXIA',
    loadingLabel: 'Opening LexiScan',
    skipHint: 'Tap to continue',
  },

  onboarding: {
    skip: 'Skip',
    next: 'Next',
    start: 'Start!',
    stepOf: (step: number, total: number) => `Step ${step} of ${total}`,
    slides: [
      {
        badge: 'OCR Smart Scan',
        title: 'Scan Fast, Scan Smart',
        desc: 'Turn text from a book or document into digital text in seconds.',
      },
      {
        badge: 'Adaptive Reading',
        title: 'Read More Comfortably',
        desc: 'A dyslexia-friendly font, a reading ruler, and focus mode for one paragraph at a time.',
      },
      {
        badge: 'AI-Powered',
        title: 'AI Is Here to Help',
        desc: 'Lexi turns difficult text into something easy to follow, across 5 AI levels.',
      },
    ],
  },

  tabs: {
    home: 'Home',
    scan: 'Scan',
    read: 'Read',
    settings: 'Settings',
  },

  common: {
    close: 'Close',
    tryAgain: 'Try Again',
    free: 'Free',
    askLexi: 'Ask Lexi',
  },

  dashboard: {
    /*
     * Sapaan tanpa nama: LexiScan tidak punya akun, jadi tidak ada nama
     * pengguna yang bisa disebut di sini. Sama alasannya dengan kartu di
     * layar Atur yang menyebut aplikasinya sendiri, bukan sebuah profil.
     */
    greeting: 'Hello, Reader!',
    statusBadge: 'Ready to learn',
    heroTitle: 'Ready for today’s\nadventure?',
    scanButton: 'Scan',
    scanButtonLabel: 'Scan a document',
    readButton: 'Read',
    readButtonLabel: 'Open the reading screen',
    featuresEyebrow: '5 Main Features',
    featuresTitle: 'Everything you need',
    innovationEyebrow: 'Exclusive Innovations',
    innovationTitle: 'Built for dyslexia',
    tipOfDay: 'Tip of the day',
    features: {
      scan: { label: 'Scan Document', desc: 'Photograph a book or notes, get digital text' },
      typography: { label: 'Adjust Text', desc: 'Letter size and line spacing that feel right' },
      simplify: {
        label: 'Simplify Text',
        desc: '5 levels, from the original wording to the simplest',
      },
      focus: { label: 'Focus Mode', desc: 'Read one paragraph without distractions' },
      explain: { label: 'Ask Lexi', desc: '3 explanation styles from Lexi, your helper' },
    },
    innovations: {
      bicolor: {
        title: 'Two-Colour Words',
        desc: 'Colours alternate per word so your eyes never lose the line',
        label: 'Two-Colour Words, open the reading screen',
      },
      ruler: { title: 'Reading Ruler', desc: 'Drag the line with your finger' },
      isolation: { title: 'Isolate a Word', desc: 'Tap any word while reading' },
    },
  },

  reader: {
    nowReading: 'Now reading',
    scanResult: 'Scan Result',
    scannedTextTitle: 'Scanned text',
    changeTypeLabel: 'Change text size, currently',
    aiBadge: 'AI',
    levelLabel: 'Level',
    focus: 'Focus',
    ruler: 'Ruler',
    bicolor: 'Two Colours',
    swipeHint: 'Swipe to change paragraph',
    prevParagraph: 'Previous paragraph',
    nextParagraph: 'Next paragraph',
    paragraphOf: (index: number, total: number) => `Paragraph ${index} of ${total}`,
    simplifying: (levelName: string) => `Lexi is simplifying this to ${levelName}…`,
    emptyText: 'Nothing to read yet.',
    sampleTitle: 'This is a sample text',
    sampleDesc: 'Tap here to scan your own book or notes.',
    sampleLabel: 'Scan your own document',
    retryLink: 'Tap to try again.',
    retryLabel: 'Try simplifying again',
    rulerHintLead: 'Drag the yellow line with your finger,\nor use these buttons. Line ',
    rulerLineOf: (line: number, total: number) => `${line} of ${total}`,
    rulerUp: 'Move ruler up one line',
    rulerDown: 'Move ruler down one line',
    explainButton: 'Explain This Text',
    explainButtonLabel: 'Ask Lexi to explain this paragraph',
    tapWordHint: 'Tap a word to see its syllables',
    unexpectedError: 'Something unexpected went wrong.',
  },

  scanner: {
    badge: 'Smart Scan',
    title: 'Scan Document',
    subtitle: 'Photograph your book or notes and turn them into easy-to-read text',
    camera: 'Camera',
    upload: 'Upload File',
    aimAtDocument: 'Point at the document',
    fileTypes: 'PDF, JPG, or PNG',
    tipsTitle: 'Tips for a good scan',
    tips: [
      'Make sure the light is bright enough',
      'Fit all the text inside the frame',
      'Tilted pages are straightened automatically',
      'Results appear in a dyslexia-friendly font',
    ],
    processTitle: 'Automatic processing',
    processSteps: [
      'Detecting page orientation',
      'Straightening the page',
      'Improving image quality',
      'Recognising the text (OCR)',
      'Text analysis complete!',
    ],
    detected: 'Text detected',
    success: 'Done!',
    tidyingUp: 'Tidying up the text…',
    paragraphCount: (count: number) => `${count} paragraphs`,
    autoFont: 'Auto font',
    aiReady: 'AI ready',
    openAndRead: 'Open and Read',
    openAndReadLabel: 'Open the scan in the reading screen',
    scanAnother: '← Scan another document',
    startScan: 'Start Scan',
    startScanLabel: 'Start scanning',
    pickImage: 'Choose Image',
    pickImageLabel: 'Choose an image',
    processing: 'Processing…',
    permissionText: 'LexiScan needs camera permission to scan your printed documents.',
    permissionButton: 'Grant Camera Permission',
    noTextTitle: 'No text found',
    noTextCamera: 'Try moving the camera closer and make sure the light is bright enough.',
    noTextUpload: 'This image does not seem to contain text, or it is too blurry.',
    scanFailTitle: 'Scan failed',
    uploadFailTitle: 'Could not read the image',
    genericError: 'Something went wrong.',
    cameraNoImage: 'The camera did not return an image.',
    typoWarning: 'AI typo correction failed, using the raw OCR text instead.',
  },

  settings: {
    role: 'Student',
    /*
     * Bukan profil pengguna: LexiScan tidak punya akun, jadi tidak ada nama
     * yang bisa ditampilkan di sini. Kartunya menyebut aplikasinya sendiri
     * supaya tidak ada identitas yang seolah-olah milik penggunanya.
     */
    title: 'LexiScan',
    subtitle: 'Reading assistant for dyslexia',
    profileTags: ['Free', 'Research-based', 'Inclusive'],
    languageEyebrow: 'Language',
    languageTitle: 'App language',
    languageNote: 'Also changes the language of AI answers.',
    themeEyebrow: 'Colour theme',
    themeTitle: 'Gentle on dyslexic eyes',
    typeEyebrow: 'Text size',
    typeTitle: 'Used across every reading screen',
    fontChip: 'Font',
    spacingChip: 'Spacing',
    aboutTagline: 'A reading companion for dyslexia',
    aboutTags: ['v1.0', 'Free', 'Inclusive'],
    aboutBody:
      'LexiScan applies research-based accessibility principles to create a reading experience that is comfortable and effective for everyone.',
  },

  feedback: {
    eyebrow: 'Feedback',
    title: 'Tell us how it went',
    intro: 'Your report goes straight to the LexiScan team.',
    typeFeedback: 'Feedback',
    typeOcrFailure: 'Scan failed',
    placeholderFeedback: 'What could we do better? Say as much as you can.',
    placeholderOcrFailure: 'What kind of page failed to scan? Describe it however you can.',
    charCount: (count: number, max: number) => `${count}/${max}`,
    attachTitle: 'Attach the last scanned text',
    attachDesc: 'It helps us find the cause. Only sent if you switch this on.',
    attachEmpty: 'There is no scanned text to attach yet.',
    privacyNote: 'Sent anonymously — only a random device marker goes with it.',
    submit: 'Send Report',
    submitLabel: 'Send the report to the LexiScan team',
    sending: 'Sending…',
    tooShort: 'Please write a message first, at least 3 characters.',
    sentTitle: 'Thank you!',
    sentBody: 'We have received your report.',
    sendAnother: 'Send another report',
    unexpectedError: 'Something unexpected went wrong. Please try again.',
  },

  footprint: {
    eyebrow: 'Environmental impact',
    title: 'AI carbon footprint',
    empty: 'No AI requests yet. Try simplifying a piece of text first.',
    spentLabel: 'Emissions used',
    avoidedLabel: 'Emissions avoided',
    requestsLabel: 'AI requests',
    energyLabel: 'Energy',
    cachedShare: (cached: number, total: number, percent: number) =>
      `${cached} of ${total} requests were answered from storage, without running the model again (${percent}%).`,
    equivalent: (percent: string) => `About the same as charging a phone by ${percent}%.`,
    // Small chip shown next to an AI result.
    chipCached: 'From storage · 0 g',
    chipSpent: (value: string) => `≈ ${value} CO₂e`,
    chipUnknown: 'Footprint not reported',
    methodNote:
      'These are estimates, not measurements: they come from the token counts the AI provider reports, multiplied by energy per token and the carbon intensity of the data centre’s electricity.',
    resetLabel: 'Reset the count',
  },

  typography: {
    title: 'Adjust Text',
    subtitle: 'Tune the text to whatever feels comfortable',
    closeLabel: 'Close text settings',
    preview: 'Reading becomes easier.',
    previewSettings: 'Reading becomes more comfortable.',
    bicolorTitle: 'Two-Colour Words',
    bicolorDesc: 'Colours alternate per word so your eyes never lose the line',
    rulerTitle: 'Reading Ruler',
    rulerDesc: 'A line marking your place that you can drag with your finger',
  },

  wordSheet: {
    badge: 'One word at a time',
    syllableCount: (count: number) => `${count} syllables`,
    askLexiLabel: (word: string) => `Ask Lexi to explain the word ${word}`,
  },

  explain: {
    title: 'Ask Lexi',
    fromLexi: 'Lexi’s explanation',
    about: (term: string) => `About: ${term}`,
    backLabel: 'Back to the style picker',
    thinking: 'Lexi is thinking…',
    cantAnswer: 'Sorry, I could not answer that.',
    retryLabel: 'Ask again',
    otherStyle: '← Try Another Style',
    otherStyleLabel: 'Try another explanation style',
    styleLabel: (name: string) => `Explain it in the ${name} style`,
    chooseStyle: 'How should Lexi explain it?',
    unexpectedError: 'Something unexpected went wrong. Please try again.',
  },

  api: {
    noBaseUrl:
      'This build has no backend address baked in. Set EXPO_PUBLIC_API_URL at build time (in eas.json for EAS builds), then rebuild.',
    timeout: 'The server took too long to respond. Please try again shortly.',
    unreachable:
      'Could not reach the server. Make sure the backend is running and the phone is on the same network as your laptop.',
    httpError: (status: number) => `Request failed (HTTP ${status}).`,
    noSimplifyResult: 'The server returned no simplified text.',
    noExplainResult: 'The server returned no explanation.',
    noCorrectionResult: 'The server returned no corrected text.',
  },

  themes: {
    krem: 'Warm Cream',
    kuning: 'Soft Yellow',
    biru: 'Pastel Blue',
    hijau: 'Soft Green',
    gelap: 'Dark Mode',
  },

  typeLevels: {
    ringan: { name: 'Light', desc: 'Slightly larger size and spacing' },
    sedang: { name: 'Medium', desc: 'Wide spacing, first letter of each word bolded' },
    berat: { name: 'Strong', desc: 'Maximum accessibility' },
  },

  simplifyLevels: {
    L1: { name: 'Original Text', short: 'Full', tagline: 'Academic wording from the source' },
    L2: { name: 'A Little Easier', short: 'Easier', tagline: 'Long sentences broken up' },
    L3: { name: 'Casual Language', short: 'Casual', tagline: 'Everyday words, still accurate' },
    L4: { name: 'Short Points', short: 'Points', tagline: 'Brief and to the point' },
    L5: { name: 'Simplest', short: 'Basic', tagline: 'Primary-school reading level' },
  },

  explainStyles: {
    anak10: {
      name: 'Like you are 10',
      desc: 'The simplest explanation',
      answer: [
        'Your body is made of a huge number of tiny cells. Inside every one of them sits something called a mitochondrion.',
        "A mitochondrion has just one job: making energy! That energy is called ATP — think of it as coins the cell spends to 'buy' everything it does.",
        "Without mitochondria your cells run out of coins and cannot do anything at all. That is why they are nicknamed the 'power plants of the cell'. ⚡",
      ],
    },
    analogi: {
      name: 'A simple analogy',
      desc: 'An image that is easy to picture',
      answer: [
        'Picture a cell as a small town. The town needs electricity to keep its lights, trains, and factories running.',
        'Mitochondria are its power plants. They burn "fuel" from the food you eat and turn it into electricity called ATP.',
        'The busier the town, the more power plants it needs. That is why muscle cells hold far more mitochondria than other cells do. 🏙️',
      ],
    },
    nyata: {
      name: 'A real-life example',
      desc: 'From everyday experience',
      answer: [
        'When you run around and suddenly find yourself out of breath, it is because your muscle cells need a lot of energy fast.',
        'The mitochondria inside those muscle cells immediately get to work turning sugar from your food into ATP.',
        'That is also why enough sleep and good food matter — they are the fuel your mitochondria run on! 😴🍎',
      ],
    },
  },

  sampleDoc: {
    title: 'Sample reading',
    sectionTitle: 'Mitochondria — The Power Plants of the Cell',
    term: 'Mitochondria',
    paragraphs: [
      'Mitochondria are cell organelles that produce energy in the form of ATP through the process of cellular respiration.',
      'These organelles have a double-membrane structure — a smooth outer membrane and a folded inner membrane that forms the cristae.',
      'The mitochondrial matrix contains the enzymes required for the Krebs cycle, as well as mitochondrial DNA, which lets the organelle reproduce semi-independently.',
    ],
  },

  dailyTips: [
    'Warm light is gentler on the eyes than a bright white screen.',
    'On the reading screen, swipe left or right to change paragraph.',
    'Turn on the Ruler, then drag the line along with your finger.',
    'Two Colours helps your eyes track where you are in a sentence.',
    'If a sentence feels heavy, move up one simplification level.',
    'Focus Mode dims the other paragraphs so your eyes stay put.',
    'Tap a difficult word — LexiScan will break it into syllables.',
  ],
};
