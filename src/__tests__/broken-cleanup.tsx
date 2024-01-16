vi.mock('solid-js', () => ({ hydrate: () => {}, render: () => {} }));
import { render } from '..';

const errors: Event[] = [];
const handler = (ev: Event) => errors.push(ev);
globalThis.addEventListener('error', handler);

test('trigger auto-cleanup', () => {
  render(() => <div>Hi</div>);
});

test('check if auto-cleanup threw an error', () => {
  expect(errors).toEqual([]);
  globalThis.removeEventListener('error', handler);
});

