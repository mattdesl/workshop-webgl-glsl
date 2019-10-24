import CartesianCoordinates from '../interactive/CartesianCoordinates';

export const metadata = {
  title: '3D Coordinates',
  demo: () => <CartesianCoordinates dimensions={3} perspective={0} />
};

In 3D coordinates, we add one more dimension so that we end up with `(x, y, z)`.

Shift the perspective below to see the third dimension: