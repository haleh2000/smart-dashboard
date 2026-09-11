import { toCsv } from './csv';

describe('toCsv', () => {
  it('starts with a BOM so Excel reads UTF-8 Persian text', () => {
    expect(toCsv(['نام'], [['رضا']])).toBe('﻿نام\r\nرضا');
  });

  it('quotes cells containing separators, quotes or line breaks', () => {
    const csv = toCsv(
      ['a', 'b'],
      [
        ['x,y', 'say "hi"'],
        ['line\nbreak', null],
      ],
    );

    expect(csv).toBe('﻿a,b\r\n"x,y","say ""hi"""\r\n"line\nbreak",');
  });
});
