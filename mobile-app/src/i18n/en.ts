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
    documents: 'Documents',
    settings: 'Settings',
  },

  common: {
    close: 'Close',
    tryAgain: 'Try Again',
    free: 'Free',
    askLexi: 'Ask Lexi',
  },

  speech: {
    playLabel: 'Read this text aloud',
    stopLabel: 'Stop the voice',
    readAloud: 'Read aloud',
    readParagraph: (index: number) => `Read paragraph ${index} aloud`,
  },

  readingLevels: {
    belum: {
      name: 'Cannot read yet',
      desc: 'Largest text, words split into syllables, and everything read aloud.',
      example: 'Sun-shine',
    },
    mengeja: {
      name: 'Still sounding words out',
      desc: 'Words split into syllables, with the voice there whenever it is needed.',
      example: 'Sun-shine',
    },
    lancar: {
      name: 'Reads fluently',
      desc: 'Text appears as usual, without the voice.',
      example: 'Sunshine',
    },
  },

  auth: {
    appTagline: 'A dyslexia-friendly study buddy',

    stepLabel: (step: number, total: number, name: string) => `STEP ${step} / ${total} — ${name}`,
    stepHalo: 'HELLO!',
    stepMembaca: 'READING',

    tabNew: 'New here',
    tabExisting: 'I have an account',

    askNameTitle: 'What is your name?',
    askNameSubtitle: 'Introduce yourself to Lexi!',
    namePlaceholderLong: 'Tap here to write your name…',
    welcomeBackTitle: 'Welcome back!',
    welcomeBackSubtitle: 'Enter your name to continue.',


    askReadingTitle: 'Reading text is…',
    askReadingSubtitle: 'Lexi will get the right help ready for you.',

    readingChoice: {
      lancar: {
        title: 'I can read on my own',
        desc: 'I just want a calmer, friendlier layout.',
      },
      mengeja: {
        title: 'I still sound words out',
        desc: 'Split words into syllables, with the voice ready if I need it.',
      },
      belum: {
        title: 'I need the voice to help',
        desc: 'Every button and every text will be read out to me automatically.',
      },
    },

    voiceAutoNote: 'The voice turns on automatically. Tap anything and Lexi will read it aloud!',

    next: 'Continue',
    back: 'Back',
    finish: 'Start learning!',

    loginTitle: 'Welcome back',
    loginSubtitle: 'Sign in to keep reading',
    loginAction: 'Sign in',
    loginLoading: 'Signing in…',
    noAccount: 'No account yet?',
    toRegister: 'Create one here',

    registerTitle: 'Create a LexiScan account',
    registerSubtitle: 'So the app can adapt itself to you',
    registerAction: 'Sign up',
    registerLoading: 'Creating your account…',
    haveAccount: 'Already have an account?',
    toLogin: 'Sign in here',

    companionBanner: 'Fill this in together with a teacher or parent',

    nameLabel: 'Your name',
    namePlaceholder: 'For example: Rafi',
    usernameLabel: 'Username',
    usernamePlaceholder: 'For example: rafi123',
    usernameHint: 'Letters and numbers only, no spaces',
    passwordLabel: 'Password',
    passwordPlaceholder: 'At least 6 characters',
    showPassword: 'Show password',
    hidePassword: 'Hide password',

    readingLevelLabel: 'Can you read on your own yet?',
    readingLevelHint: 'You can change this any time from Settings.',

    skip: 'Just look around first',
    skipHint: 'You can sign up later from Settings.',

    fillEverything: 'Please fill in every field first.',
    unexpectedError: 'Something unexpected went wrong. Please try again.',

    needName: 'Write your name first.',
    needReading: 'Pick the one that fits you best first.',
  },

  dashboard: {
    greeting: 'Hello, Reader!',
    greetingNamed: (name: string) => `Hello, ${name}!`,
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
      ruler: { title: 'Reading Ruler', desc: 'Tap a line to move it there' },
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
    syllables: 'Syl-la-ble',
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
    rulerHintLead: 'Ruler on line ',
    rulerLineOf: (line: number, total: number) => `${line} of ${total}`,
    rulerUp: 'Move ruler up one line',
    rulerDown: 'Move ruler down one line',
    explainButton: 'Explain This Text',
    explainButtonLabel: 'Ask Lexi to explain this paragraph',
    tapWordHint: 'Tap a word to see its syllables',
    rulerTapHint: 'Tap a line to move the ruler. Press and hold a word for its syllables.',
    spellTapHint: 'Tap a word to hear its syllables',
    highlightFollowsVoice: 'The orange box follows the voice that is reading',
    spell: 'Spell',
    spellLabel: 'Spell by syllable',
    slow: 'Slow',
    slowLabel: 'Very slow voice',
    unexpectedError: 'Something unexpected went wrong.',
  },

  scanner: {
    badge: 'Smart Scan',
    title: 'Scan Document',
    subtitle: 'Photograph your book or notes and turn them into easy-to-read text',
    camera: 'Camera',
    upload: 'Upload File',
    aimAtDocument: 'Point at the document',
    fileTypes: 'PDF, Word (DOCX), JPG, or PNG',
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
    pickImage: 'Choose File',
    pickImageLabel: 'Choose an image or document',
    processing: 'Processing…',
    permissionText: 'LexiScan needs camera permission to scan your printed documents.',
    permissionButton: 'Grant Camera Permission',
    noTextTitle: 'No text found',
    noTextCamera: 'Try moving the camera closer and make sure the light is bright enough.',
    noTextUpload: 'This file does not seem to contain text, or the image is too blurry.',
    scanFailTitle: 'Scan failed',
    uploadFailTitle: 'Could not read the file',
    fileTooLarge: 'This file is larger than 10 MB. Choose a smaller file, or take a photo of the page you want to read.',
    genericError: 'Something went wrong.',
    cameraNoImage: 'The camera did not return an image.',
    typoWarning: 'AI typo correction failed, using the raw OCR text instead.',
  },

  documents: {
    title: 'My Documents',
    subtitle: 'Scans saved on this device',
    emptyTitle: 'No documents yet',
    emptyDesc: 'Documents you scan will be saved here, so you can open and read them again anytime.',
    emptyButton: 'Scan Now',
    open: 'Open',
    openLabel: (title: string) => `Open and read ${title}`,
    rename: 'Rename',
    renameTitle: 'Rename Document',
    renameLabel: 'Document name',
    delete: 'Delete',
    deleteTitle: 'Delete document?',
    deleteMessage: (title: string) => `"${title}" will be removed from this device.`,
    cancel: 'Cancel',
    wordCount: (count: number) => `${count} words`,
    savedAt: (when: string) => `Saved ${when}`,
    today: 'today',
    yesterday: 'yesterday',
  },

  settings: {
    role: 'Student',

    editAction: 'Edit',
    displayEyebrow: 'Display',
    displayTitle: 'Theme & Accessibility',
    prefsEyebrow: 'Preferences',
    prefsTitle: 'Notifications & Voice',
    profileTitle: 'Profile & Security',
    rowTheme: 'Colour Theme',
    rowDyslexia: 'Dyslexia Mode',
    rowDailyTip: 'Daily Study Tip',
    dailyTipOn: 'On · Every morning',
    dailyTipOff: 'Off',
    dailyTipDenied: 'Allow notifications in your phone settings first',
    rowVoice: 'Voice & Feedback',
    voiceOn: 'On',
    voiceOff: 'Off',
    rowLanguage: 'Language',
    rowReading: 'Reading Ability',
    rowFootprint: 'Carbon Footprint',
    rowFootprintDesc: 'Energy & emissions from AI requests',
    rowName: 'Change Name',
    rowHelp: 'Help & Support',
    rowHelpDesc: 'FAQ, report a problem',
    rowGuide: 'Companion Guide',
    rowGuideDesc: 'Feature tour for teachers and parents',
    nameSheetTitle: 'Change Name',
    nameSave: 'Save',
    logoutTitle: 'Sign out?',
    logoutBody: 'You will need to sign in again to use LexiScan. Your progress stays safe.',
    cancel: 'Cancel',
    logoutConfirm: 'Sign out',
    footer: (version: string) => `LexiScan · v${version} · For every student`,
    languageEyebrow: 'Language',
    languageTitle: 'App language',
    languageNote: 'Also changes the language of AI answers.',
    themeEyebrow: 'Colour theme',
    themeTitle: 'Gentle on dyslexic eyes',
    typeEyebrow: 'Text size',
    typeTitle: 'Used across every reading screen',
    fontChip: 'Font',
    spacingChip: 'Spacing',

    readingEyebrow: 'Reading ability',
    readingTitle: 'Where every adjustment comes from',
    readingNote:
      'Changing this resets the text size, syllable splitting, and voice. Afterwards you are still free to adjust each one below.',

    voiceEyebrow: 'Voice',
    voiceTitle: 'Read the text out loud',
    ttsTitle: 'Voice buttons',
    ttsDesc: 'Show a read-aloud button on every paragraph and on Lexi answers.',
    autoPlayTitle: 'Read automatically',
    autoPlayDesc: 'The paragraph you are on starts speaking without being tapped.',
    speakLabelsTitle: 'Read button names aloud',
    speakLabelsDesc: 'Every button says its own name when tapped, so you know what it does without reading.',
    syllableTitle: 'Split syllables',
    syllableDesc: 'Write words as "Sun-shine" so they are easier to sound out.',
    voiceOfflineNote: 'The voice uses your phone built-in engine, so it works without internet.',

    voicePickerTitle: 'Pick a voice',
    voiceLoading: 'Looking for voices on your phone…',
    voiceName: (index: number) => `Voice ${index}`,
    voiceAuto: 'Automatic',
    voiceAutoDesc: 'Let the app pick the clearest one.',
    voiceEnhanced: 'High quality',
    voiceNetwork: 'Clearest — needs internet',
    voiceStandard: 'Standard quality',
    rateTitle: 'Voice speed',
    rates: { verySlow: 'Very slow', slow: 'Slow', medium: 'Medium', normal: 'Normal' },
    switchOn: 'on',
    switchOff: 'off',
    voicePickerHint: 'Tap to listen. Keep whichever sounds best to you.',
    voiceSample: 'The sun is shining brightly. A little rabbit hops across the garden.',
    voiceOpenSettings: 'Open phone voice settings',
    voiceNone:
      'This phone has no voice for that language yet. Open Settings → Accessibility → Text-to-speech to install one.',

    accountEyebrow: 'Account',
    accountTitle: 'Your profile',
    guestName: 'Not signed in',
    guestSubtitle: 'Sign up so the app can adapt itself to you',
    loginAction: 'Sign in or sign up',
    logoutAction: 'Sign out',
    logoutLabel: 'Sign out of this account',

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
    rulerDesc: 'A line marking your place, tap a line to move it',
  },

  wordSheet: {
    badge: 'One word at a time',
    syllableCount: (count: number) => `${count} syllables`,
    askLexiLabel: (word: string) => `Ask Lexi to explain the word ${word}`,
    syllableHint: 'Tap a syllable to hear it.',
    syllableLabel: (syllable: string) => `Say the syllable ${syllable}`,
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
    rulerTapHint: 'Tap a word to move the ruler to its line.',
    focusTapHint: 'One sentence at a time. Tap a faded sentence to move to it.',
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

  tour: {
    counter: (step: number, total: number) => `Step ${step} of ${total}`,
    skip: 'Skip',
    next: 'Next',
    back: 'Back',
    done: 'Done',
    steps: {
      welcome: {
        title: 'Companion Mode',
        body: 'A short tour for the teacher or parent helping out. Each important button is highlighted along with what it is for.',
      },
      scanner: {
        title: 'Scan',
        body: 'Take a photo of a book page, or upload a PDF, Word file, or image. The text becomes dyslexia-friendly reading.',
      },
      documents: {
        title: 'Documents',
        body: 'Every scan is saved here, so the same text can be opened again any time.',
      },
      settings: {
        title: 'Settings',
        body: "Change the child's reading level, voice, colours, and font. This tour can be replayed from here under Companion Guide.",
      },
      reader: {
        title: 'Read',
        body: 'This is where the child reads. Tap Next to see the reading tools one by one.',
      },
      simplify: {
        title: 'Simplify with AI',
        body: "Makes hard sentences easier. Start with the original text and raise the level if the child doesn't understand it yet.",
      },
      focus: {
        title: 'Focus',
        body: "Dims the other paragraphs so the child's eyes don't jump ahead.",
      },
      ruler: {
        title: 'Ruler',
        body: 'The yellow line marks the line being read. Tap a line to move it there.',
      },
      bicolor: {
        title: 'Two Colours',
        body: 'Words alternate colours so the gaps between words are easier to see.',
      },
      syllables: {
        title: 'Syl-la-bles',
        body: 'Shows hyphens between syllables, helping a child who is still sounding words out.',
      },
      readAloud: {
        title: 'Read Aloud',
        body: 'Reads the active paragraph aloud. The orange box follows the word being spoken, so the child can follow along.',
      },
      explain: {
        title: 'Explain',
        body: "Explains the paragraph in simple words, for a child who can read it but doesn't understand it yet.",
      },
      spell: {
        title: 'Spell',
        body: 'When on, a tapped word is read syllable by syllable right in the text. Good for a child just learning to spell.',
      },
      slow: {
        title: 'Slow',
        body: 'Slows the voice down so the child has time to match sounds to letters.',
      },
      hint: {
        title: 'Tap a word',
        body: 'Tap a word in the text to see its syllables and meaning. This hint always says what tapping a word will do.',
      },
      finish: {
        title: 'Ready to help!',
        body: 'Let the child try reading alone first, then use the voice or Spell when they get stuck. Replay this tour from Settings, Companion Guide.',
      },
    },
  },

  themes: {
    krem: 'Warm Cream',
    kuning: 'Soft Yellow',
    biru: 'Pastel Blue',
    hijau: 'Soft Green',
    gelap: 'Dark Mode',
  },

  typeLevels: {
    ringan: {
      name: 'Young Fighter',
      desc: 'Slightly larger letters, comfortable spacing for learning to read',
    },
    sedang: {
      name: 'Explorer',
      desc: 'Wide spacing and bold word starts so lines are easy to follow',
    },
    berat: {
      name: 'Adventurer',
      desc: 'Full accessibility for readers who need extra support',
    },
  },

  simplifyLevels: {
    L1: { name: 'Original Text', short: 'Full', tagline: 'Academic wording from the source' },
    L2: { name: 'A Little Easier', short: 'Easier', tagline: 'Long sentences broken up' },
    L3: { name: 'Casual Language', short: 'Casual', tagline: 'Everyday words, still accurate' },
    L4: { name: 'Short Points', short: 'Points', tagline: 'Brief and to the point' },
    L5: { name: 'Simplest', short: 'Basic', tagline: 'Very short sentences, everyday words' },
  },

  explainStyles: {
    sederhana: {
      name: 'The simplest words',
      desc: 'The easiest wording there is',
      answer: [
        'Mitochondria are tiny parts inside a cell. Their job is making the energy your body moves with.',
      ],
    },
    analogi: {
      name: 'A simple analogy',
      desc: 'An image that is easy to picture',
      answer: ['Picture a cell as a small town. Mitochondria are its power plants.'],
    },
    nyata: {
      name: 'A real-life example',
      desc: 'From everyday experience',
      answer: [
        'When you run and get out of breath, the mitochondria in your muscles are working hard to make energy.',
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
    'Turn on the Ruler, then tap the next line or use the up and down buttons.',
    'Two Colours helps your eyes track where you are in a sentence.',
    'If a sentence feels heavy, move up one simplification level.',
    'Focus Mode dims the other paragraphs so your eyes stay put.',
    'Tap a difficult word — LexiScan will break it into syllables.',
  ],

  /**
   * Early dyslexia screening.
   *
   * ADDRESSED TO THE COMPANION, NOT THE CHILD. The parent or teacher reads this,
   * asks the child to speak, then marks the outcome. So the wording uses "you"
   * meaning the adult, not the child.
   *
   * EVERY STRING HERE IS DELIBERATELY CAREFUL. The app does NOT diagnose and does
   * NOT grade; it records signs and points to a professional. So there is no
   * "detected", no "high risk", no score, no number at all — each of those would
   * read as a claim the app has no right to make.
   */
  screening: {
    title: 'Early Check',
    cardTitle: 'Early Dyslexia Risk Check',
    cardDesc: 'Guided by an adult, no score. Then talk to a professional.',
    entryLabel: 'Open the early dyslexia risk check',

    introTitle: 'Before you start',
    introLead:
      'This page helps you notice signs of reading difficulty in a child. It is not an examination and not a diagnosis.',
    introPoints: [
      'You guide, the child speaks. Do not type the answer — just listen.',
      'The result is only a note of signs, not a judgement of the child.',
      'Only a doctor or psychologist can confirm anything.',
      'Never force it. If the child refuses, stop and try again another time.',
    ],
    introStart: 'Start',
    introLater: 'Maybe later',

    stepLabel: (step: number, total: number) => `Part ${step} of ${total}`,
    listenChip: 'Ask the child to speak',
    triggerLabel: 'Prompt word',
    expectLabel: 'Roughly what to expect',
    replay: 'Read the word aloud',
    howDidItGo: 'How did it go?',
    previous: 'Back',
    next: 'Next',

    markLancar: 'Smooth',
    markRagu: 'Hesitant',
    markBelum: 'Not yet',

    obsTitle: 'Everyday signs',
    obsLead:
      'Beyond the activity, tick any you often see when the child reads at home or school. It is fine if none apply.',
    observations: {
      reversal: 'Often reverses letters such as b/d, p/q when writing or reading',
      spelling: 'Spelling stays jumbled even after plenty of practice',
      'slow-read': 'Reads far more slowly and hesitantly than peers',
      avoid: 'Avoids reading or writing tasks',
      tired: 'Tires quickly or complains of headaches when reading',
      sequence: 'Often swaps order, e.g. reads "man" as "nam"',
      'spell-aloud': 'Struggles to spell words out loud',
      guessing: 'Often guesses words from pictures or context instead of reading them',
    },
    obsContinue: 'See the notes',

    resultTitle: 'Notes on signs',
    resultClearTitle: 'No strong signs noticed',
    resultClearBody:
      'Nothing stood out in this activity. If you still feel the child struggles with reading, it is perfectly fine to check with a professional anyway.',
    resultFlagsTitle: 'A few signs were noted',
    resultFlagsBody:
      'The signs below are also common in children who have dyslexia. This means nothing on its own — many children show them and are perfectly fine.',
    resultTaskSection: 'From the activity',
    resultObsSection: 'From everyday observation',
    resultConsult:
      'A good next step is to talk it over with a paediatrician, psychologist, or support teacher. Only they can examine and confirm.',
    resultDisclaimer:
      'This app does not diagnose. Nothing here replaces an assessment by a professional.',
    resultAgain: 'Do it again',
    resultDone: 'Finish',

    domainNames: {
      syllable: 'Spotting syllables',
      nonword: 'Blending word sounds',
      naming: 'Naming quickly',
    },
  },
};
