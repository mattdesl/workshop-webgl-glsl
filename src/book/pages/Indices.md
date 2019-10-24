import { Indices } from './InteractiveComponents.js';

export const metadata = {
  title: 'Indices',
  demo: Indices
};

In graphics programming, *indices* usually refers to an array that holds the index values into a `vertices` array.

This is a more memory-efficient way of storing vertex data, since it allows us to re-use vertices without re-defining them.