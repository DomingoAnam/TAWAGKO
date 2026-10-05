/**
 * In-app banner presenter.
 *
 * A notification channel cannot be created in Expo Go, and expo-notifications
 * hard-throws there on Android (SDK 53+). So in Expo Go we render our own
 * heads-up banner instead. Screens stay unaware of which path is used: they
 * call localBanner() and either a real system notification or this banner
 * appears, depending on the build.
 */
export type BannerTone = 'info' | 'success' | 'warn';

export type BannerPayload = {
  title: string;
  body?: string;
  tone?: BannerTone;
};

type Presenter = (payload: BannerPayload) => void;

let presenter: Presenter | null = null;

export const setBannerPresenter = (fn: Presenter | null) => {
  presenter = fn;
};

export const presentBanner = (title: string, body?: string, tone?: BannerTone) => {
  presenter?.({ title, body: body ?? '', tone });
};