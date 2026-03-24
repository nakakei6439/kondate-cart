import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FIRST_LAUNCH_KEY = '@first_launch_date';
const REVIEW_REQUESTED_KEY = '@review_requested';
const DAYS_THRESHOLD = 7;

export async function maybeRequestReview() {
  const requested = await AsyncStorage.getItem(REVIEW_REQUESTED_KEY);
  if (requested) return;

  const firstLaunch = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
  if (!firstLaunch) {
    await AsyncStorage.setItem(FIRST_LAUNCH_KEY, String(Date.now()));
    return;
  }

  const elapsed = Date.now() - Number(firstLaunch);
  const days = elapsed / (1000 * 60 * 60 * 24);
  if (days < DAYS_THRESHOLD) return;

  if (await StoreReview.hasAction()) {
    await StoreReview.requestReview();
    await AsyncStorage.setItem(REVIEW_REQUESTED_KEY, '1');
  }
}

export async function requestReviewAfterPurchase() {
  const requested = await AsyncStorage.getItem(REVIEW_REQUESTED_KEY);
  if (requested) return;

  if (await StoreReview.hasAction()) {
    await StoreReview.requestReview();
    await AsyncStorage.setItem(REVIEW_REQUESTED_KEY, '1');
  }
}
