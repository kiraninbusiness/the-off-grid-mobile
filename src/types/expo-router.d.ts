declare module 'expo-router' {
  import type { ComponentType, ReactNode } from 'react';

  export type TabBarIconProps = {
    color: string;
    focused: boolean;
    size: number;
  };

  export type ScreenOptions = {
    title?: string;
    headerShown?: boolean;
    tabBarIcon?: (props: TabBarIconProps) => ReactNode;
    [key: string]: unknown;
  };

  export type ScreenProps = {
    name: string;
    options?: ScreenOptions;
  };

  export const Tabs: ComponentType<Record<string, unknown>> & {
    Screen: ComponentType<ScreenProps>;
  };

  export const Stack: ComponentType<Record<string, unknown>> & {
    Screen: ComponentType<Record<string, unknown>>;
  };

  export function useRouter(): {
    push: (href: string | { pathname: string; params?: Record<string, unknown> }) => void;
    replace: (href: string | { pathname: string; params?: Record<string, unknown> }) => void;
    back: () => void;
    canGoBack: () => boolean;
  };

  export function useFocusEffect(effect: () => void | (() => void)): void;
  export function usePathname(): string;
  export function useLocalSearchParams<T extends Record<string, string | string[] | undefined> = Record<string, string | string[] | undefined>>(): T;
  export const router: {
    push: (href: string | { pathname: string; params?: Record<string, unknown> }) => void;
    replace: (href: string | { pathname: string; params?: Record<string, unknown> }) => void;
    back: () => void;
  };
  export const Redirect: ComponentType<{ href: string; [key: string]: unknown }>;
}
