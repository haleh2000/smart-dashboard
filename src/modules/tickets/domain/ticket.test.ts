import {
  closedDetailStatusesForType,
  detailStatusesForType,
  isClosedDetailStatus,
  isOpenDetailStatus,
  isReviewDetailStatus,
  openDetailStatusesForType,
  reviewDetailStatusesForType,
  ticketMatchesStatusFilter,
  ticketSearchTokens,
} from './ticket';

describe('detail statuses per module (employer session)', () => {
  it('covers شکایت open/closed lists exactly, in display order', () => {
    expect(openDetailStatusesForType('شکایت')).toEqual([
      'در جریان',
      'ثبت یادداشت توسط امور مشتریان',
      'ثبت شده',
    ]);
    expect(detailStatusesForType('شکایت')).toEqual([
      'در جریان',
      'ثبت یادداشت توسط امور مشتریان',
      'ثبت شده',
      'رد شده - عدم آگاهی',
      'رد شده - خارج از ضوابط',
      'وارده - رسیدگی شده',
      'وارده - خارج از اختیارات اجرایی',
    ]);
    expect(closedDetailStatusesForType('شکایت')).toEqual([
      'رد شده - عدم آگاهی',
      'رد شده - خارج از ضوابط',
      'وارده - رسیدگی شده',
      'وارده - خارج از اختیارات اجرایی',
    ]);
  });

  it('gives پیگیری everything شکایت has plus تبدیل به شکایت', () => {
    expect(openDetailStatusesForType('پیگیری')).toEqual(openDetailStatusesForType('شکایت'));
    expect(closedDetailStatusesForType('پیگیری')).toContain('تبدیل به شکایت');
    expect(closedDetailStatusesForType('پیگیری')).toEqual([
      ...closedDetailStatusesForType('شکایت'),
      'تبدیل به شکایت',
    ]);
  });

  it('keeps each module list in its own display order (پیگیری = شکایت + تبدیل به شکایت)', () => {
    expect(detailStatusesForType('پیگیری')).toEqual([
      ...detailStatusesForType('شکایت'),
      'تبدیل به شکایت',
    ]);
    expect(detailStatusesForType('درخواست')).toEqual([
      'ثبت شده',
      'در جریان',
      'ثبت یادداشت توسط مالک پیگیری',
      'ثبت یادداشت توسط امور مشتریان',
      'حل شده',
      'رد شده',
    ]);
    expect(detailStatusesForType('پیشنهاد')).toEqual([
      'ثبت شده',
      'در حال اجرا',
      'قابل قبول',
      'غیر قابل قبول',
    ]);
  });

  it('splits درخواست and پیشنهاد into their own open/closed lists', () => {
    expect(closedDetailStatusesForType('درخواست')).toEqual(['حل شده', 'رد شده']);
    expect(openDetailStatusesForType('درخواست')).toContain('ثبت یادداشت توسط مالک پیگیری');
    expect(closedDetailStatusesForType('پیشنهاد')).toEqual(['قابل قبول', 'غیر قابل قبول']);
    expect(openDetailStatusesForType('پیشنهاد')).toEqual(['ثبت شده', 'در حال اجرا']);
  });

  it('partitions every module list into open + closed with no overlap', () => {
    for (const type of ['شکایت', 'پیگیری', 'درخواست', 'پیشنهاد']) {
      const open = openDetailStatusesForType(type);
      const closed = closedDetailStatusesForType(type);
      expect([...open, ...closed].sort()).toEqual([...detailStatusesForType(type)].sort());
      expect(open.filter((s) => closed.includes(s))).toEqual([]);
    }
  });

  it('maps در حال بررسی to در جریان (در حال اجرا for پیشنهاد)', () => {
    expect(reviewDetailStatusesForType('شکایت')).toEqual(['در جریان']);
    expect(reviewDetailStatusesForType('پیگیری')).toEqual(['در جریان']);
    expect(reviewDetailStatusesForType('درخواست')).toEqual(['در جریان']);
    expect(reviewDetailStatusesForType('پیشنهاد')).toEqual(['در حال اجرا']);
  });
});

describe('ticketSearchTokens', () => {
  it('reads a ticket number however it was typed or rendered', () => {
    for (const typed of ['140003', '۱۴۰۰۰۳', 'T-140003', 'T-۱۴۰۰۰۳', 't ۱۴۰۰۰۳', 'تیکت۱۴۰۰۰۳', ' ۱۴۰,۰۰۳ ']) {
      expect(ticketSearchTokens(typed)).toEqual(['140003']);
    }
  });

  it('splits several words into tokens that all have to match', () => {
    expect(ticketSearchTokens('۱۴۰۰۰۳ رضایی')).toEqual(['140003', 'رضایی']);
    expect(ticketSearchTokens('   ')).toEqual([]);
  });

  it('leaves names and subjects exactly as typed', () => {
    expect(ticketSearchTokens('مریم احمدی')).toEqual(['مریم', 'احمدی']);
  });
});

describe('ticketMatchesStatusFilter', () => {
  it('follows the detail status inside the ticket modules', () => {
    expect(
      ticketMatchesStatusFilter({ type: 'شکایت', status: 'inProgress', detailStatus: 'در جریان' }, 'open'),
    ).toBe(true);
    expect(
      ticketMatchesStatusFilter({ type: 'شکایت', status: 'inProgress', detailStatus: 'در جریان' }, 'inReview'),
    ).toBe(true);
    expect(
      ticketMatchesStatusFilter(
        { type: 'پیگیری', status: 'pending', detailStatus: 'تبدیل به شکایت' },
        'closed',
      ),
    ).toBe(true);
    expect(
      ticketMatchesStatusFilter(
        { type: 'درخواست', status: 'pending', detailStatus: 'حل شده' },
        'closed',
      ),
    ).toBe(true);
    expect(
      ticketMatchesStatusFilter(
        { type: 'پیشنهاد', status: 'pending', detailStatus: 'در حال اجرا' },
        'inReview',
      ),
    ).toBe(true);
  });

  it('falls back to the CRM status when there is no detail status', () => {
    expect(ticketMatchesStatusFilter({ type: 'گفت‌وگو', status: 'pending' }, 'open')).toBe(true);
    expect(ticketMatchesStatusFilter({ type: 'گفت‌وگو', status: 'closed' }, 'open')).toBe(false);
    expect(ticketMatchesStatusFilter({ type: 'گفت‌وگو', status: 'closed' }, 'closed')).toBe(true);
    expect(
      ticketMatchesStatusFilter({ type: 'گفت‌وگو', status: 'underReview' }, 'inReview'),
    ).toBe(true);
  });

  it('keeps exact CRM-status matching for concrete statuses', () => {
    expect(
      ticketMatchesStatusFilter({ type: 'شکایت', status: 'closed', detailStatus: 'وارده - رسیدگی شده' }, 'closed'),
    ).toBe(true);
    expect(isOpenDetailStatus('وارده - رسیدگی شده', 'closed')).toBe(false);
    expect(isClosedDetailStatus('در جریان', 'inProgress')).toBe(false);
    expect(isReviewDetailStatus('ثبت شده', 'pending')).toBe(false);
  });
});
