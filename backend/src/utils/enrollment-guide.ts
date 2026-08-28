export type EnrollmentPaymentMethod = {
  name: string;
  accountNumber: string;
};

export type EnrollmentGuideContent = {
  guidelinesTitle: string;
  guidelinesSummary: string;
  guidelinesDescription: string;
  guidelines: string[];
  supportPhone: string;
  enrollmentTitle: string;
  enrollmentSummary: string;
  enrollmentDescription: string;
  enrollmentSteps: string[];
  videoUrl: string;
  paymentTitle: string;
  paymentSummary: string;
  paymentDescription: string;
  paymentMethods: EnrollmentPaymentMethod[];
};

export const DEFAULT_ENROLLMENT_GUIDE: EnrollmentGuideContent = {
  guidelinesTitle: 'Enrollment guidelines',
  guidelinesSummary: 'Select courses, pay the exact calculated total, and submit one application.',
  guidelinesDescription: 'Follow these steps carefully.',
  guidelines: [
    'Make sure you are logged in to the email account where you would like to receive access to the course materials.',
    'Fill out the enrollment form using your correct information.',
    'Select the course you wish to enroll in.',
    'Choose your preferred payment method. Currently, we accept bKash, Nagad, and Rocket.',
    'Complete the payment using the instructions and payment number provided in the enrollment form.',
    'After making the payment, collect your Transaction ID and enter it correctly in the form.',
    'Review your information carefully and submit the enrollment form.',
    'Once confirmed, you will receive access to the course materials. Confirmation may take up to 48 hours.',
    'If you have questions or need assistance, contact us at any time.',
  ],
  supportPhone: '01XXXXXXXXXX',
  enrollmentTitle: 'How to enroll',
  enrollmentSummary: 'Open the step-by-step enrollment walkthrough.',
  enrollmentDescription: 'Course selection and payment walkthrough.',
  enrollmentSteps: [
    'Select one or more courses.',
    'Pay the calculated total.',
    'Enter the transaction ID and submit.',
    'Wait up to 48 hours for Content Manager approval.',
  ],
  videoUrl: '',
  paymentTitle: 'Payment methods',
  paymentSummary: 'bKash, Rocket, or Nagad: 01XXXXXXXXXX (personal account).',
  paymentDescription: 'Send Money or Cash In using a personal account.',
  paymentMethods: [
    { name: 'bKash', accountNumber: '01XXXXXXXXXX' },
    { name: 'Rocket', accountNumber: '01XXXXXXXXXX' },
    { name: 'Nagad', accountNumber: '01XXXXXXXXXX' },
  ],
};

function stringValue(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value.trim() : fallback;
}

function stringList(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

function paymentMethods(value: unknown, fallback: EnrollmentPaymentMethod[]): EnrollmentPaymentMethod[] {
  if (!Array.isArray(value)) return fallback;
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      const name = stringValue(row.name, '');
      const accountNumber = stringValue(row.accountNumber, '');
      return name && accountNumber ? { name, accountNumber } : null;
    })
    .filter((item): item is EnrollmentPaymentMethod => item !== null);
}

export function normalizeEnrollmentGuide(
  value: unknown,
  fallback: EnrollmentGuideContent = DEFAULT_ENROLLMENT_GUIDE
): EnrollmentGuideContent {
  const input = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return {
    guidelinesTitle: stringValue(input.guidelinesTitle, fallback.guidelinesTitle),
    guidelinesSummary: stringValue(input.guidelinesSummary, fallback.guidelinesSummary),
    guidelinesDescription: stringValue(input.guidelinesDescription, fallback.guidelinesDescription),
    guidelines: stringList(input.guidelines, fallback.guidelines),
    supportPhone: stringValue(input.supportPhone, fallback.supportPhone),
    enrollmentTitle: stringValue(input.enrollmentTitle, fallback.enrollmentTitle),
    enrollmentSummary: stringValue(input.enrollmentSummary, fallback.enrollmentSummary),
    enrollmentDescription: stringValue(input.enrollmentDescription, fallback.enrollmentDescription),
    enrollmentSteps: stringList(input.enrollmentSteps, fallback.enrollmentSteps),
    videoUrl: stringValue(input.videoUrl, fallback.videoUrl),
    paymentTitle: stringValue(input.paymentTitle, fallback.paymentTitle),
    paymentSummary: stringValue(input.paymentSummary, fallback.paymentSummary),
    paymentDescription: stringValue(input.paymentDescription, fallback.paymentDescription),
    paymentMethods: paymentMethods(input.paymentMethods, fallback.paymentMethods),
  };
}
