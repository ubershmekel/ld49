export interface Toy {
  name: string;
  shape: string;
  price: number;
  color: string;
  id: number;
}

export const allToys: Toy[] = [
  {
    name: 'skuer',
    shape: '0 0, 50 0, 50 50, 0 50',
    color: '#e50000',
    price: 1,
    id: 0,
  },
  {
    name: 'pointer',
    shape: '40 0, 40 30, 100 30, 100 70, 40 70, 40 100, 0 50',
    color: '#89fe05',
    price: 1,
    id: 1,
  },
  {
    name: 'chuvvy',
    shape: '120 0, 75 50, 120 100, 25 100, -20 50, 25 0',
    color: '#96f97b',
    price: 1,
    id: 2,
  },
  {
    name: 'mariobait',
    shape: '50 0, 63 38, 100 38, 69 59, 82 100, 50 75, 18 100, 31 59, 0 38, 37 38',
    color: '#0343df',
    price: 1,
    id: 3,
  },
  {
    name: 'horse-shoe',
    shape: '35 7, 19 17, 14 38, 14 58, 25 79, 45 85, 95 84, 95 66, 46 67, 34 59, 30 44, 33 29, 45 23, 95 23, 95 7, 53 7',
    color: '#ff81c0',
    price: 1,
    id: 4,
  },
  {
    name: 'tri-tip',
    shape: '0 0, -50 -86.6, -100 0',
    color: '#c20078',
    price: 5,
    id: 5,
  },
  {
    name: '1x1',
    shape: '0 0, 100 0, 100 100, 0 100',
    color: '#653700',
    price: 5,
    id: 6,
  },
  {
    name: 'noodle',
    shape: '0 0, 150 0, 150 25, 0 25',
    color: '#ffff14',
    price: 10,
    id: 7,
  },
  {
    name: 'SirPatrickStewart',
    shape: '0 0, 60 -50, 90 0, 50 -150',
    color: '#9a0eea',
    price: 10,
    id: 8,
  },
  {
    name: 'Little L',
    shape: '0 0, 100 0, 100 100, 50 100, 50 50, 0 50',
    color: '#d1b26f',
    price: 10,
    id: 9,
  },
  {
    name: 'longnthicc',
    shape: '0 0, 250 0, 250 50, 0 50',
    color: '#029386',
    price: 50,
    id: 10,
  },
  {
    name: 't-bone',
    shape: '0 0, 240 0, 240 -80, 160 -80, 160 -160, 80 -160, 80 -80, 0 -80',
    color: '#ffb07c',
    price: 100,
    id: 11,
  },
  {
    name: 'koko',
    shape: '0 0, 80 0, 80 -80, 240 -80, 240 0, 160 0, 160 80, 0 80',
    color: '#ff796c',
    price: 100,
    id: 12,
  },
  {
    name: 'Pig God',
    shape: '0 0, 240 0, 240 240, 0 240',
    color: '#001146',
    price: 500,
    id: 13,
  },
];