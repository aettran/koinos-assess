const request = require('supertest');
const app = require('../../index');

jest.mock('fs', () => {
  const original = jest.requireActual('fs');
  return {
    ...original,
    promises: {
      readFile: jest.fn(),
      writeFile: jest.fn(),
    },
    watch: jest.fn(),
  };
});

const fs = require('fs');

const sampleData = [
  { id: 1, name: 'Laptop Pro', category: 'Electronics', price: 2499 },
  { id: 2, name: 'Noise Cancelling Headphones', category: 'Electronics', price: 399 },
  { id: 3, name: 'Ultra‑Wide Monitor', category: 'Electronics', price: 999 },
  { id: 4, name: 'Ergonomic Chair', category: 'Furniture', price: 799 },
  { id: 5, name: 'Standing Desk', category: 'Furniture', price: 1199 },
];

beforeEach(() => {
  fs.promises.readFile.mockResolvedValue(JSON.stringify(sampleData));
  fs.promises.writeFile.mockResolvedValue();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/items', () => {
  test('returns paginated items (happy path)', async () => {
    const res = await request(app).get('/api/items').expect(200);
    expect(res.body).toHaveProperty('total', sampleData.length);
    expect(res.body).toHaveProperty('page', 1);
    expect(res.body).toHaveProperty('limit', 10);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(sampleData.length);
  });

  test('search query filters results', async () => {
    const res = await request(app).get('/api/items').query({ q: 'monitor' }).expect(200);
    expect(res.body.total).toBe(1);
    expect(res.body.data[0].name.toLowerCase()).toContain('monitor');
  });
});

describe('GET /api/items/:id', () => {
  test('returns item when found', async () => {
    const res = await request(app).get('/api/items/1').expect(200);
    expect(res.body).toHaveProperty('id', 1);
    expect(res.body).toHaveProperty('name', 'Laptop Pro');
  });

  test('returns 404 when not found', async () => {
    const res = await request(app).get('/api/items/999').expect(404);
    expect(res.body).toHaveProperty('error');
  });
});

describe('POST /api/items', () => {
  test('creates new item and writes file', async () => {
    const now = 1600000000000;
    jest.spyOn(Date, 'now').mockReturnValue(now);

    const newItem = { name: 'Test Item', category: 'Test', price: 10 };
    const res = await request(app).post('/api/items').send(newItem).expect(201);

    expect(res.body).toHaveProperty('id', now);
    expect(res.body).toMatchObject({ name: 'Test Item', category: 'Test', price: 10 });
    // verify writeFile called with updated array containing new item
    expect(fs.promises.writeFile).toHaveBeenCalled();

    Date.now.mockRestore();
  });
});
