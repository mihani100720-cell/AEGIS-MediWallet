export type Language = "en" | "hi" | "te";

export const translations = {
  en: {
    brand: "MEDIWALLET",
    tagline: "Your Health. Your Authority. Your Shield.",
    subtitle: "Patient-Owned Medical Vault & Zero-Knowledge Health Authority",
    nav: {
      vault: "Medical Vault",
      sharing: "QR Sharing & Consent",
      emergency: "Emergency Shield",
      family: "Family & Biometrics",
      ai: "AI Health Memory",
      rx: "RxScript OCR",
      medicines: "Medicine DB",
      appointments: "Appointments",
      wellness: "Diet & Nutrition",
      security: "Security & Audit",
      doctorPortal: "Doctor Portal",
      adminPortal: "Admin Panel"
    },
    hero: {
      badge: "ISO 27001 Cryptographic Architecture",
      title1: "Your Medical Memory.",
      title2: "Owned Exclusively by You.",
      description: "A secure, patient-controlled timeline of every diagnosis, laboratory report, and handwritten prescription. Share selectively with doctors in OPD or Admission mode. Never surrender authority.",
      ctaPatient: "Launch Patient Vault",
      ctaDoctor: "Doctor QR Access",
      ctaEmergency: "Offline Emergency QR",
      statsRecords: "Encrypted Records",
      statsConsent: "Zero-Leak Sharing",
      statsOffline: "100% Offline Shield"
    },
    vault: {
      title: "Smart Medical Record Vault",
      uploadBtn: "Upload Report / Scan",
      dragNotice: "Supports PDF, JPG, PNG up to 25MB • SHA-256 Deduplication Active",
      filterAll: "All Documents",
      filterLab: "Lab Reports",
      filterRx: "Prescriptions",
      filterImaging: "Imaging & Scans",
      filterDischarge: "Discharge Summaries",
      searchPlaceholder: "Search by condition, hospital, doctor or test name...",
      duplicateWarning: "Identical document already secured in vault (SHA-256 matched).",
      abnormalFlag: "Attention: Lab values outside printed reference range",
      normalBadge: "All Values Normal",
      viewSummary: "AI Clinical Summary",
      viewOriginal: "Inspect Document",
      deleteRecord: "Revoke from Vault"
    },
    consent: {
      title: "Granular Consent & QR Sharing",
      subtitle: "Share specific documents for a set duration. Revoke anytime with zero trace.",
      opdMode: "OPD Mode (15m - 2h Consultation)",
      admissionMode: "Admission Mode (24h - 7d Inpatient Care)",
      doctorVerified: "MCI Verified Clinician",
      timeRemaining: "Time Remaining",
      revokeNow: "Revoke Access Immediately",
      scanQr: "Scan Doctor Access QR",
      generateDoctorQr: "Display Doctor Access QR",
      revocationNotice: "Notice: Revocation cuts active network sessions immediately. Documents already viewed or copied physically cannot be erased."
    },
    emergency: {
      title: "Offline Emergency Medical Shield",
      subtitle: "First responders scan this offline code without internet to access vital allergies and contacts.",
      bloodGroup: "Blood Group",
      criticalAllergies: "Critical Allergies",
      conditions: "Chronic Conditions",
      contacts: "Emergency Contacts",
      printCard: "Print Medical Emergency Card",
      offlineBadge: "Zero-Network Verified Offline Shield"
    },
    family: {
      title: "Family Profiles & Biometric Authentication",
      subtitle: "Each family member is strictly partitioned. A face match unlocks only their own records.",
      enrollFace: "Enroll Biometric Face",
      verifyFace: "Authenticate via Camera",
      livenessCheck: "Anti-Spoofing Liveness Verified",
      fallbackOtp: "Switch to 6-Digit Phone OTP",
      cameraConsentNotice: "Camera is never activated without your explicit consent and stated purpose."
    },
    ai: {
      title: "Personal AI Health Memory",
      subtitle: "Grounded RAG assistant searching solely within your authorized medical documents.",
      placeholder: "Ask about your recent HbA1c, cholesterol, or prescription...",
      micStart: "Speak Query (EN / HI / TE)",
      micStop: "Listening...",
      citations: "Grounded Sources Cited",
      disclaimer: "AI responses are strictly informational summaries of your documents and do not constitute clinical diagnosis."
    },
    rx: {
      title: "RxScript Intelligence — Handwritten Prescription OCR",
      subtitle: "Heuristic handwriting AI extracts medicine candidates with confidence scoring.",
      originalImage: "Original Doctor's Prescription",
      extractedCandidates: "Candidate Medications",
      confidence: "Model Confidence",
      confirmReview: "Verify & Lock into Health Memory"
    }
  },
  hi: {
    brand: "मेडीवॉलेट (MEDIWALLET)",
    tagline: "आपका स्वास्थ्य। आपका अधिकार। आपकी ढाल।",
    subtitle: "मरीज-स्वामित्व वाला मेडिकल वॉल्ट और जीरो-नॉलेज हेल्थ प्लेटफॉर्म",
    nav: {
      vault: "मेडिकल वॉल्ट",
      sharing: "क्यूआर शेयरिंग व सहमति",
      emergency: "इमरजेंसी शील्ड",
      family: "परिवार व बायोमेट्रिक",
      ai: "एआई स्वास्थ्य मेमोरी",
      rx: "हस्तलिखित पर्चा ओसीआर",
      medicines: "दवा निर्देशिका",
      appointments: "अपॉइंटमेंट्स",
      wellness: "आहार व पोषण",
      security: "सुरक्षा व ऑडिट",
      doctorPortal: "डॉक्टर पोर्टल",
      adminPortal: "एडमिन पैनल"
    },
    hero: {
      badge: "आईएसओ 27001 प्रमाणित सुरक्षा",
      title1: "आपकी मेडिकल मेमोरी।",
      title2: "केवल आपके नियंत्रण में।",
      description: "हर रिपोर्ट, जांच और हस्तलिखित पर्चे की सुरक्षित टाइमलाइन। ओपीडी या भर्ती के दौरान केवल चयनित रिकॉर्ड साझा करें।",
      ctaPatient: "मरीज वॉल्ट खोलें",
      ctaDoctor: "डॉक्टर क्यूआर एक्सेस",
      ctaEmergency: "ऑफलाइन इमरजेंसी क्यूआर",
      statsRecords: "सुरक्षित रिकॉर्ड",
      statsConsent: "नियंत्रित साझाकरण",
      statsOffline: "बिना इंटरनेट इमरजेंसी"
    },
    vault: {
      title: "स्मार्ट मेडिकल रिकॉर्ड वॉल्ट",
      uploadBtn: "रिपोर्ट / स्कैन अपलोड करें",
      dragNotice: "पीडीएफ, जेपीजी, पीएनजी समर्थित • डुप्लिकेट सुरक्षा सक्रिय",
      filterAll: "सभी दस्तावेज",
      filterLab: "लैब रिपोर्ट",
      filterRx: "पर्चे (Prescriptions)",
      filterImaging: "इमेजिंग व स्कैन",
      filterDischarge: "डिस्चार्ज सारांश",
      searchPlaceholder: "अस्पताल, डॉक्टर या जांच के नाम से खोजें...",
      duplicateWarning: "यह दस्तावेज पहले से सुरक्षित है (SHA-256 मेल खाया)।",
      abnormalFlag: "ध्यान दें: कुछ मान सामान्य सीमा से बाहर हैं",
      normalBadge: "सभी जांच मान सामान्य हैं",
      viewSummary: "एआई मेडिकल सारांश",
      viewOriginal: "मूल दस्तावेज देखें",
      deleteRecord: "वॉल्ट से हटाएं"
    },
    consent: {
      title: "सहमति व सुरक्षित क्यूआर शेयरिंग",
      subtitle: "निर्धारित समय के लिए चुनिंदा दस्तावेज साझा करें। कभी भी अनुमति वापस लें।",
      opdMode: "ओपीडी मोड (15 मिनट - 2 घंटे)",
      admissionMode: "भर्ती मोड (24 घंटे - 7 दिन)",
      doctorVerified: "सत्यापित चिकित्सक",
      timeRemaining: "शेष समय",
      revokeNow: "तत्काल अनुमति रद्द करें",
      scanQr: "डॉक्टर क्यूआर स्कैन करें",
      generateDoctorQr: "डॉक्टर क्यूआर कोड दिखाएं",
      revocationNotice: "नोट: अनुमति रद्द करने से सक्रिय पहुंच समाप्त हो जाती है। पहले देखा गया डेटा मिटाया नहीं जा सकता।"
    },
    emergency: {
      title: "ऑफलाइन इमरजेंसी मेडिकल शील्ड",
      subtitle: "बिना इंटरनेट के आपातकालीन स्थिति में एलर्जी और संपर्कों को तुरंत स्कैन करें।",
      bloodGroup: "रक्त समूह (Blood Group)",
      criticalAllergies: "गंभीर एलर्जी",
      conditions: "पुरानी बीमारियां",
      contacts: "आपातकालीन संपर्क",
      printCard: "इमरजेंसी कार्ड प्रिंट करें",
      offlineBadge: "100% ऑफलाइन कार्यशील"
    },
    family: {
      title: "परिवार प्रोफाइल व फेस बायोमेट्रिक",
      subtitle: "परिवार के प्रत्येक सदस्य का रिकॉर्ड पूर्णतः अलग और सुरक्षित है।",
      enrollFace: "फेस बायोमेट्रिक पंजीकृत करें",
      verifyFace: "कैमरा से सत्यापन करें",
      livenessCheck: "एंटी-स्पूफिंग जीवंतता सत्यापित",
      fallbackOtp: "6-अंकों के ओटीपी पर स्विच करें",
      cameraConsentNotice: "आपकी स्पष्ट सहमति के बिना कैमरा कभी सक्रिय नहीं किया जाता।"
    },
    ai: {
      title: "व्यक्तिगत एआई स्वास्थ्य मेमोरी",
      subtitle: "केवल आपके अधिकृत मेडिकल दस्तावेजों से उत्तर देने वाला एआई सहायक।",
      placeholder: "अपने शुगर, कोलेस्ट्रॉल या दवाओं के बारे में पूछें...",
      micStart: "बोलकर पूछें (हिन्दी / English / తెలుగు)",
      micStop: "सुन रहा हूँ...",
      citations: "प्रमाणित संदर्भ दस्तावेज",
      disclaimer: "एआई उत्तर केवल जानकारी के लिए हैं और डॉक्टर की सलाह का विकल्प नहीं हैं।"
    },
    rx: {
      title: "RxScript इंटेलिजेंस — हस्तलिखित पर्चा ओसीआर",
      subtitle: "डॉक्टर के हाथ से लिखे पर्चे से दवाओं और खुराक की पहचान।",
      originalImage: "मूल पर्चे की तस्वीर",
      extractedCandidates: "पहचानी गई दवाएं",
      confidence: "सटीकता दर",
      confirmReview: "जांचें और वॉल्ट में सहेजें"
    }
  },
  te: {
    brand: "మెడివాలెట్ (MEDIWALLET)",
    tagline: "మీ ఆరోగ్యం. మీ అధికారం. మీ రక్షణ కవచం.",
    subtitle: "రోగి-యాజమాన్య మెడికల్ వాలెట్ & ప్రైవేట్ హెల్త్ రికార్డ్ సిస్టమ్",
    nav: {
      vault: "మెడికల్ వాలెట్",
      sharing: "క్యూఆర్ షేరింగ్ & సమ్మతి",
      emergency: "ఎమర్జెన్సీ షీల్డ్",
      family: "కుటుంబం & బయోమెట్రిక్",
      ai: "ఏఐ హెల్త్ మెమరీ",
      rx: "ప్రిస్క్రిప్షన్ ఓసీఆర్",
      medicines: "మందుల వివరాలు",
      appointments: "అపాయింట్‌మెంట్లు",
      wellness: "ఆహారం & పోషకాహారం",
      security: "భద్రత & ఆడిట్",
      doctorPortal: "డాక్టర్ పోర్టల్",
      adminPortal: "అడ్మిన్ ప్యానెల్"
    },
    hero: {
      badge: "ISO 27001 సెక్యూరిటీ ఆర్కిటెక్చర్",
      title1: "మీ వైద్య జ్ఞాపకం.",
      title2: "పూర్తిగా మీ ఆధీనంలో.",
      description: "ప్రతి రిపోర్టు, పరీక్ష మరియు ప్రిస్క్రిప్షన్ల సురక్షిత టైమ్‌లైన్. ఓపీడీ లేదా అడ్మిషన్ మోడ్‌లో మాత్రమే వైద్యులతో పంచుకోండి.",
      ctaPatient: "వాలెట్ ప్రారంభించండి",
      ctaDoctor: "డాక్టర్ క్యూఆర్ యాక్సెస్",
      ctaEmergency: "ఆఫ్‌లైన్ ఎమర్జెన్సీ క్యూఆర్",
      statsRecords: "ఎన్‌క్రిప్టెడ్ రికార్డులు",
      statsConsent: "పూర్తి నియంత్రణ",
      statsOffline: "ఇంటర్నెట్ లేకుండా రక్షణ"
    },
    vault: {
      title: "స్మార్ట్ మెడికల్ రికార్డ్ వాలెట్",
      uploadBtn: "రిపోర్ట్ అప్‌లోడ్ చేయండి",
      dragNotice: "PDF, JPG, PNG ఫైల్స్ సపోర్ట్ • డూప్లికేట్ రక్షణ యాక్టివ్",
      filterAll: "అన్ని పత్రాలు",
      filterLab: "ల్యాబ్ రిపోర్టులు",
      filterRx: "ప్రిస్క్రిప్షన్లు",
      filterImaging: "స్కాన్లు & ఎక్స్-రే",
      filterDischarge: "డిశ్చార్జ్ సమ్మరీలు",
      searchPlaceholder: "డాక్టర్, ఆసుపత్రి లేదా టెస్ట్ పేరుతో వెతకండి...",
      duplicateWarning: "ఈ పత్రం ఇప్పటికే వాలెట్‌లో భద్రపరచబడింది.",
      abnormalFlag: "గమనిక: కొన్ని పరీక్షలు సాధారణ పరిమితికి మించి ఉన్నాయి",
      normalBadge: "అన్ని విలువలు సాధారణ స్థితిలో ఉన్నాయి",
      viewSummary: "ఏఐ క్లినికల్ సారాంశం",
      viewOriginal: "అసలు పత్రం చూడండి",
      deleteRecord: "వాలెట్ నుండి తొలగించండి"
    },
    consent: {
      title: "క్యూఆర్ ఆధారిత సురక్షిత షేరింగ్",
      subtitle: "నిర్దేశిత సమయానికి మాత్రమే ఎంపిక చేసిన రికార్డులను పంచుకోండి. ఎప్పుడైనా రద్దు చేయండి.",
      opdMode: "ఓపీడీ మోడ్ (15 నిమిషాలు - 2 గంటలు)",
      admissionMode: "అడ్మిషన్ మోడ్ (24 గంటలు - 7 రోజులు)",
      doctorVerified: "ధృవీకరించబడిన వైద్యులు",
      timeRemaining: "మిగిలిన సమయం",
      revokeNow: "వెంటనే అనుమతి రద్దు చేయండి",
      scanQr: "డాక్టర్ క్యూఆర్ స్కాన్ చేయండి",
      generateDoctorQr: "డాక్టర్ క్యూఆర్ కోడ్ ప్రదర్శించండి",
      revocationNotice: "గమనిక: అనుమతి రద్దు చేసిన వెంటనే కొత్త యాక్సెస్ ఆగిపోతుంది. ఇప్పటికే చూసిన డేటాను చెరిపివేయలేము."
    },
    emergency: {
      title: "ఆఫ్‌లైన్ ఎమర్జెన్సీ మెడికల్ షీల్డ్",
      subtitle: "ఇంటర్నెట్ అవసరం లేకుండా అత్యవసర సమయాల్లో రక్తం గ్రూప్, అలర్జీలు మరియు ఫోన్ నంబర్లు.",
      bloodGroup: "బ్లడ్ గ్రూప్ (Blood Group)",
      criticalAllergies: "తీవ్రమైన అలర్జీలు",
      conditions: "దీర్ఘకాలిక సమస్యలు",
      contacts: "అత్యవసర సంప్రదింపులు",
      printCard: "ఎమర్జెన్సీ కార్డ్ ప్రింట్ చేయండి",
      offlineBadge: "నెట్‌వర్క్ లేకుండా పనిచేస్తుంది"
    },
    family: {
      title: "కుటుంబ ప్రొఫైల్స్ & ఫేస్ బయోమెట్రిక్",
      subtitle: "ప్రతి కుటుంబ సభ్యుని డేటా పూర్తి రక్షణతో వేరుగా ఉంటుంది.",
      enrollFace: "ఫేస్ బయోమెట్రిక్ నమోదు చేయండి",
      verifyFace: "కెమెరాతో ధృవీకరించండి",
      livenessCheck: "యాంటీ-స్పూఫింగ్ లైవ్‌నెస్ ధృవీకరణ",
      fallbackOtp: "6-అంకెల ఓటీపీని ఉపయోగించండి",
      cameraConsentNotice: "మీ అనుమతి లేకుండా కెమెరా ఎప్పటికీ ఆన్ చేయబడదు."
    },
    ai: {
      title: "వ్యక్తిగత ఏఐ హెల్త్ మెమరీ",
      subtitle: "మీ వైద్య రికార్డుల ఆధారంగా మాత్రమే సమాధానం ఇచ్చే స్మార్ట్ సహాయకుడు.",
      placeholder: "మీ షుగర్, కొలెస్ట్రాల్ లేదా మందుల గురించి అడగండి...",
      micStart: "మాట్లాడి అడగండి (తెలుగు / English / हिन्दी)",
      micStop: "వినబడుతోంది...",
      citations: "ఆధార పత్రాలు",
      disclaimer: "ఏఐ సమాధానాలు సమాచారం కొరకు మాత్రమే. వైద్య నిర్ణయాలకు మీ డాక్టర్‌ను సంప్రదించండి."
    },
    rx: {
      title: "RxScript ఇంటెలిజెన్స్ — చేతిరాత ప్రిస్క్రిప్షన్ ఓసీఆర్",
      subtitle: "చేతితో రాసిన ప్రిస్క్రిప్షన్ల నుండి మందుల వివరాలు మరియు మోతాదు గుర్తింపు.",
      originalImage: "అసలు ప్రిస్క్రిప్షన్ చిత్రం",
      extractedCandidates: "గుర్తించిన మందులు",
      confidence: "ఖచ్చితత్వ రేటు",
      confirmReview: "సరిచూసి వాలెట్‌లో భద్రపరచండి"
    }
  }
};
