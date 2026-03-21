let counter = 0;
export const randomUUID = jest.fn(() => `mock-uuid-${++counter}`);
export default { randomUUID };
