export interface Event {
    _id?: string;

    id: number;
    page: string;
    title: string;

    // Media
    Image: string;
    description: string;

    // Requirements / flags
    paymentRequired: string;
    birthdayRequired: string;
    companyRequired: string;
    lockRegistration: string;
    IdentityConsent: string;
    fileUpload: string;
    countDown: string;
    textarea: string;
    fieldIcon: string;
    surveyForm: string;
    gic: string;
    loginRequired: string;
    use_member_card: string;
    vatEnabled: string;
    consultationEnabled: string;
    custom_whatsapp: string;
    otp: string;

    // Event info
    event_date: string;
    event_time: string;
    event_location: string;
    event_location_name: string;

    // Form / UI
    send_button_text: string;
    maxTokensPerGuest: number;

    // Payment / finance
    recordFee: number | null;
    currency: string | null;

    // Meta
    registration_code: string;
    metadata_json: string;
    archived: number;

    // Timestamps
    createdAt: string;
    modifiedAt: string;
}
