import type { Sentiment, SubjectPath, TranscriptLine } from '@/shared/domain/insights';

/** A believable short conversation about the given subject, tuned to the sentiment. */
export const buildTranscript = (subject: SubjectPath, sentiment: Sentiment): TranscriptLine[] => {
  const opener: Record<Sentiment, string> = {
    positive: `سلام، وقت بخیر. می‌خواستم درباره «${subject.level3}» یک سؤال بپرسم.`,
    neutral: `سلام. درباره «${subject.level2}» تماس گرفتم، «${subject.level3}».`,
    negative: `سلام. چند بار تماس گرفتم و هنوز «${subject.level3}» حل نشده، واقعاً خسته شدم.`,
  };
  const closing: Record<Sentiment, string> = {
    positive: 'خیلی ممنون، کاملاً راهنمایی شدم.',
    neutral: 'باشه، منتظر پیامک می‌مانم.',
    negative: 'امیدوارم این بار واقعاً پیگیری بشه.',
  };
  return [
    { speaker: 'agent', atSec: 0, text: 'سلام، بیمه دی، بفرمایید.' },
    { speaker: 'customer', atSec: 4, text: opener[sentiment] },
    {
      speaker: 'agent',
      atSec: 15,
      text: 'لطفاً کد ملی بیمه‌گذار را بفرمایید تا پرونده را بررسی کنم.',
    },
    { speaker: 'customer', atSec: 22, text: 'بله، الان می‌گویم.' },
    {
      speaker: 'agent',
      atSec: 41,
      text: `پرونده شما در بخش «${subject.level1}» ثبت است. درخواست را برای کارشناس مربوطه ارسال کردم.`,
    },
    { speaker: 'customer', atSec: 58, text: closing[sentiment] },
    { speaker: 'agent', atSec: 64, text: 'خواهش می‌کنم، روز خوبی داشته باشید.' },
  ];
};

export const autoLabelFor = (subject: SubjectPath) => `${subject.level2} — ${subject.level3}`;

export const summaryFor = (subject: SubjectPath, sentiment: Sentiment) =>
  `مشتری درباره «${subject.level3}» (${subject.level1}) تماس گرفت. ${
    sentiment === 'negative'
      ? 'نارضایتی از تاخیر در رسیدگی مشهود است و پیگیری فوری توصیه می‌شود.'
      : sentiment === 'positive'
        ? 'مشتری از راهنمایی راضی بود.'
        : 'درخواست ثبت و به کارشناس ارجاع شد.'
  }`;
