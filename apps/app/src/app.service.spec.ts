import { AppService } from './app.service';

describe('AppService', () => {
  it('returns the exact startup greeting "Hello World!"', () => {
    expect(new AppService().getHello()).toBe('Hello World!');
  });

  it('returns a greeting that is safe to emit as one stdout line', () => {
    const greeting = new AppService().getHello();

    expect(greeting).toMatch(/^Hello World!$/);
  });
});
