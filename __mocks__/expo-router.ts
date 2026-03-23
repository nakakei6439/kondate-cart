export const useRouter = () => ({
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  navigate: jest.fn(),
});

export const useLocalSearchParams = () => ({});
export const usePathname = () => '/';
export const useSegments = () => [];
export const Link = 'Link';
export const Stack = { Screen: 'Screen' };
export const Tabs = { Screen: 'Screen' };
export const Slot = 'Slot';
export default {};
