import { mapCrmTicketToTicket, normalizeCrmTicketType } from './crmTicket';

const sample = {
  ticketid: '7998146',
  ticket_no: 'TT1065189',
  nationalcode: '0770098983',
  accountname: 'بنيادشهيد و امور ايثارگران استان خراسان رضوي',
  fname: 'معصومه',
  lname: 'برزگر',
  mobile: '09915860824',
  productname: 'درمان - درمان تکمیلی',
  branchname: 'مرکز ارتباط',
  mainticket: 'پس از صدور',
  subticket: 'ندارد',
  reqtypeticket: 'ندارد',
  createdtime: '2024-07-27 18:39:08',
  modifiedtime: '2024-07-30 13:14:01',
  tickettype: 'شکایات',
  inputchannel: 'تلفن',
  complainttext: 'باسلام و احترام',
  maincomplaint: 'فرآیند پرداخت خسارت',
  complaintstatus: 'در جریان',
  finalanswer: '',
  closeddate: null,
  description: '',
  mainrequest: '',
  mainoffer: '',
  ownername: '',
};

describe('mapCrmTicketToTicket', () => {
  it('normalizes CRM شکایات to شکایت', () => {
    expect(normalizeCrmTicketType('شکایات')).toBe('شکایت');
    expect(normalizeCrmTicketType('پیگیری')).toBe('پیگیری');
  });

  it('maps the CRM sample payload field-for-field', () => {
    const ticket = mapCrmTicketToTicket(sample);

    expect(ticket.id).toBe('7998146');
    expect(ticket.ticketNo).toBe('TT1065189');
    expect(ticket.type).toBe('شکایت');
    expect(ticket.channel).toBe('تلفن');
    expect(ticket.customer.nationalId).toBe('0770098983');
    expect(ticket.customer.mobile).toBe('09915860824');
    expect(ticket.customer.fullName).toBe('معصومه برزگر');
    expect(ticket.customer.firstName).toBe('معصومه');
    expect(ticket.customer.lastName).toBe('برزگر');
    expect(ticket.customer.corporateName).toBe(
      'بنيادشهيد و امور ايثارگران استان خراسان رضوي',
    );
    expect(ticket.insuranceLine).toBe('درمان - درمان تکمیلی');
    expect(ticket.branch).toBe('مرکز ارتباط');
    expect(ticket.mainComplaint).toBe('فرآیند پرداخت خسارت');
    expect(ticket.complaintText).toBe('باسلام و احترام');
    expect(ticket.detailStatus).toBe('در جریان');
    expect(ticket.status).toBe('inProgress');
    expect(ticket.finalResponse).toBeUndefined();
    expect(ticket.description).toBeUndefined();
    expect(ticket.mainOffer).toBeUndefined();
    expect(ticket.followUpRequest).toBeUndefined();
    expect(ticket.complaintOwner).toBe('');
    expect(ticket.followUpOwner).toBe('');
    expect(ticket.closedAt).toBeUndefined();
    expect(ticket.createdAt.toISOString()).toContain('2024-07-27');
    expect(ticket.modifiedAt?.toISOString()).toContain('2024-07-30');
    // شکایت has no subject tree in SMART UI; maincomplaint stays on mainComplaint.
    expect(ticket.subject).toBeUndefined();
  });
});
