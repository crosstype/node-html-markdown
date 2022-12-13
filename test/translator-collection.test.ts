import { TranslatorCollection, TranslatorConfigFactory } from '../src';


describe('TranslatorCollection', () => {
  let collection: TranslatorCollection;
  beforeEach(() => {
    collection = new TranslatorCollection();
    collection.set('p', { ignore: true });
  });
  test('size', () =>
    expect(collection.size).toBe(1)
  );
  test('get', () => {
    expect(collection.get('p')).toEqual({ ignore: true });
    expect(collection.get('P')).toEqual({ ignore: true });
    expect(collection['P']).toEqual({ ignore: true });
  });
  test('set', () => {
    collection.set('p', { ignore: false });
    expect(collection.get('p')).toEqual({ ignore: false });
  });
  test('set with preserveBase', () => {
    collection.set('p', { recurse: true }, true);
    expect(collection.get('p')).toEqual({ ignore: true, recurse: true });
  });
  test('set with preserveBase and configFactory', () => {
    collection.set('p', () => ({ recurse: true }), true);
    expect(collection.get('p')).toBeInstanceOf(Function)
    expect((<Function>collection.get('p'))()).toEqual({ recurse: true });
    expect((<TranslatorConfigFactory>collection.get('p')).base).toEqual({ ignore: true });
  });
  test('set with multiple keys', () => {
    collection.set('p,div', { ignore: false });
    expect(collection.get('p')).toEqual({ ignore: false });
    expect(collection.get('div')).toEqual({ ignore: false });
  });
  test('entries', () => expect(collection.entries()).toEqual([ [ 'P', { ignore: true } ] ]));
  test('remove', () => {
    collection.remove('p');
    expect(collection.get('p')).toBeUndefined();
  });
});
