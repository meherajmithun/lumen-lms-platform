import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ENROLLMENT_GUIDE,
  normalizeEnrollmentGuide,
} from '../src/utils/enrollment-guide';

describe('normalizeEnrollmentGuide', () => {
  it('supplies the public enrollment defaults for an empty record', () => {
    expect(normalizeEnrollmentGuide(null)).toEqual(DEFAULT_ENROLLMENT_GUIDE);
  });

  it('trims editable lists and removes incomplete payment methods', () => {
    const guide = normalizeEnrollmentGuide({
      guidelines: ['  First step  ', '', 4],
      enrollmentSteps: [' Pay the total. '],
      paymentMethods: [
        { name: ' bKash ', accountNumber: ' 01700000000 ' },
        { name: 'Nagad', accountNumber: '' },
      ],
    });

    expect(guide.guidelines).toEqual(['First step']);
    expect(guide.enrollmentSteps).toEqual(['Pay the total.']);
    expect(guide.paymentMethods).toEqual([
      { name: 'bKash', accountNumber: '01700000000' },
    ]);
  });

  it('preserves existing values when a partial update omits them', () => {
    const guide = normalizeEnrollmentGuide(
      { videoUrl: ' https://example.com/video ' },
      { ...DEFAULT_ENROLLMENT_GUIDE, guidelinesTitle: 'Custom guidelines' }
    );

    expect(guide.videoUrl).toBe('https://example.com/video');
    expect(guide.guidelinesTitle).toBe('Custom guidelines');
  });
});
