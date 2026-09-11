import type { Sentiment, SubjectPath, TranscriptLine } from '@/shared/domain/insights';

/** A courteous agent lifts the customer's mood one step; a curt one drags it down. */
const moodAfter = (customer: Sentiment, agent: Sentiment): Sentiment => {
  if (agent === 'positive') return customer === 'negative' ? 'neutral' : 'positive';
  if (agent === 'negative') return customer === 'positive' ? 'neutral' : 'negative';
  return customer;
};

/**
 * A believable two-sided conversation about the given subject, with a per-utterance sentiment
 * for each side (speech-to-text + AI scoring on the real backend).
 */
export const buildTranscript = (
  subject: SubjectPath,
  customer: Sentiment,
  agent: Sentiment = 'positive',
): TranscriptLine[] => {
  const end = moodAfter(customer, agent);
  const greeting: Record<Sentiment, string> = {
    positive: 'سلام، وقت‌تون بخیر. بیمه دی هستم، چطور می‌تونم کمک‌تون کنم؟',
    neutral: 'سلام، بیمه دی، بفرمایید.',
    negative: 'بله، بفرمایید.',
  };
  const opener: Record<Sentiment, string> = {
    positive: `سلام، وقت بخیر. می‌خواستم درباره «${subject.level3}» یک سؤال بپرسم.`,
    neutral: `سلام. درباره «${subject.level2}» تماس گرفتم، «${subject.level3}».`,
    negative: `سلام. چند بار تماس گرفتم و هنوز «${subject.level3}» حل نشده، واقعاً خسته شدم.`,
  };
  const askId: Record<Sentiment, string> = {
    positive: 'حتماً پیگیری می‌کنم. لطفاً کد ملی بیمه‌گذار را بفرمایید تا پرونده را ببینم.',
    neutral: 'کد ملی بیمه‌گذار را بفرمایید.',
    negative: 'کد ملی را بگویید، سریع‌تر لطفاً.',
  };
  const concern: Record<Sentiment, string> = {
    positive: 'عالیه، ممنونم. فقط می‌خواستم مطمئن بشم مدارکم کامله.',
    neutral: 'حدوداً چقدر طول می‌کشه تا نتیجه مشخص بشه؟',
    negative: 'یعنی باز هم باید منتظر بمونم؟ سه هفته گذشته و کسی جواب نمی‌ده!',
  };
  const answer: Record<Sentiment, string> = {
    positive:
      'کاملاً حق دارید. درخواست را با اولویت بالا ثبت کردم و تا ۴۸ ساعت آینده نتیجه برایتان پیامک می‌شود.',
    neutral: 'معمولاً تا یک هفته کاری بررسی می‌شود و نتیجه پیامک می‌شود.',
    negative: 'روال همین است، کاری از دست من برنمی‌آید.',
  };
  const closing: Record<Sentiment, string> = {
    positive: 'خیلی ممنون، کاملاً راهنمایی شدم.',
    neutral: 'باشه، منتظر پیامک می‌مانم.',
    negative: 'امیدوارم این بار واقعاً پیگیری بشه، وگرنه شکایت می‌کنم.',
  };
  const farewell: Record<Sentiment, string> = {
    positive: 'خواهش می‌کنم، روز خوبی داشته باشید. در خدمت‌تان هستیم.',
    neutral: 'خواهش می‌کنم. خدانگهدار.',
    negative: 'باشه. خداحافظ.',
  };

  return [
    { speaker: 'agent', atSec: 0, text: greeting[agent], sentiment: agent },
    { speaker: 'customer', atSec: 5, text: opener[customer], sentiment: customer },
    { speaker: 'agent', atSec: 16, text: askId[agent], sentiment: agent },
    { speaker: 'customer', atSec: 24, text: 'بله، الان می‌گویم.', sentiment: 'neutral' },
    {
      speaker: 'agent',
      atSec: 42,
      text: `پرونده شما در بخش «${subject.level1}» ثبت است و موضوع «${subject.level2}» را نشان می‌دهد.`,
      sentiment: 'neutral',
    },
    { speaker: 'customer', atSec: 55, text: concern[customer], sentiment: customer },
    { speaker: 'agent', atSec: 63, text: answer[agent], sentiment: agent },
    { speaker: 'customer', atSec: 80, text: closing[end], sentiment: end },
    { speaker: 'agent', atSec: 86, text: farewell[agent], sentiment: agent },
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
