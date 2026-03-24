import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Animated,
  SafeAreaView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import DishEditSheet from '../src/components/DishEditSheet';
import { SettingsModal } from '../src/components/SettingsModal';
import { useDishStore } from '../src/store/dishStore';
import { DishRecord, Ingredient } from '../src/types';
import { TimeLabelKey } from '../src/utils/weekUtils';

function formatDate(isoString: string): string {
  const d = new Date(isoString);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function daysSince(isoString: string): number {
  const now = new Date();
  const then = new Date(isoString);
  return Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
}

function getTimeLabelKey(isoString: string): TimeLabelKey {
  const diff = daysSince(isoString);
  if (diff < 7) return 'thisWeek';
  if (diff < 14) return 'lastWeek';
  if (diff < 30) return 'thisMonth';
  return 'earlier';
}

function groupToSections(dishes: DishRecord[]): { title: TimeLabelKey; data: DishRecord[] }[] {
  const order: TimeLabelKey[] = ['thisWeek', 'lastWeek', 'thisMonth', 'earlier'];
  const map = new Map<TimeLabelKey, DishRecord[]>();
  for (const dish of dishes) {
    const key = getTimeLabelKey(dish.updatedAt);
    const arr = map.get(key) ?? [];
    arr.push(dish);
    map.set(key, arr);
  }
  return order.filter((k) => map.has(k)).map((title) => ({ title, data: map.get(title)! }));
}

function DishRow({
  dish,
  onPress,
  onDelete,
}: {
  dish: DishRecord;
  onPress: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const swipeRef = useRef<Swipeable>(null);

  function renderRightActions(progress: Animated.AnimatedInterpolation<number>) {
    // 80 は styles.deleteAction.width と合わせる必要あり
    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [80, 0],
    });
    return (
      <Animated.View style={[styles.deleteAction, { transform: [{ translateX }] }]}>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => {
            swipeRef.current?.close();
            Alert.alert(t('history.deleteConfirmTitle'), t('history.deleteConfirmMessage', { name: dish.name }), [
              { text: t('common.cancel'), style: 'cancel' },
              { text: t('common.delete'), style: 'destructive', onPress: onDelete },
            ]);
          }}
        >
          <Text style={styles.deleteBtnText}>{t('common.delete')}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <View style={styles.cardWrapper}>
      <Swipeable ref={swipeRef} renderRightActions={renderRightActions} friction={2} overshootRight={false}>
        <TouchableOpacity style={styles.dishRow} onPress={onPress} activeOpacity={0.7}>
          <View style={styles.dishInfo}>
            <View style={styles.dishNameRow}>
              <Text style={styles.dishName}>{dish.name}</Text>
              <Text style={styles.dishDate}>{formatDate(dish.updatedAt)}</Text>
            </View>
            {dish.ingredients.length > 0 ? (
              <Text style={styles.dishIngredients} numberOfLines={1}>
                {dish.ingredients.map((i) => i.name).filter(Boolean).join('、')}
              </Text>
            ) : (
              <Text style={styles.noIngredients}>{t('history.noIngredients')}</Text>
            )}
          </View>
          <Text style={styles.editHint}>›</Text>
        </TouchableOpacity>
      </Swipeable>
    </View>
  );
}

export default function HistoryScreen() {
  const { t } = useTranslation();
  const { dishes, initialized, loadDishes, updateDish, deleteDish } = useDishStore();
  const [selectedDish, setSelectedDish] = useState<DishRecord | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!initialized) loadDishes();
  }, [initialized]);

  function handleDishPress(dish: DishRecord) {
    setSelectedDish(dish);
    setSheetVisible(true);
  }

  async function handleSave(id: string, name: string, ingredients: Ingredient[]) {
    await updateDish(id, name, ingredients);
  }

  async function handleDelete(id: string) {
    await deleteDish(id);
  }

  const filtered = query.trim()
    ? dishes.filter((d) => d.name.toLowerCase().includes(query.trim().toLowerCase()))
    : dishes;

  const sections = groupToSections(filtered);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Large Title */}
      <View style={styles.titleArea}>
        <Text style={styles.largeTitle}>{t('history.title')}</Text>
        <TouchableOpacity onPress={() => setSettingsVisible(true)} style={styles.settingsBtn}>
          <Ionicons name="settings-outline" size={24} color="#8E8E93" />
        </TouchableOpacity>
      </View>

      {/* 検索バー */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={15} color="#8E8E93" />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder={t('history.searchPlaceholder')}
          placeholderTextColor="#C7C7CC"
          clearButtonMode="while-editing"
          returnKeyType="search"
        />
      </View>

      {dishes.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="document-text-outline" size={56} color="#1C1C1E" />
          <Text style={styles.emptyTitle}>{t('history.emptyTitle')}</Text>
          <Text style={styles.emptyDesc}>{t('history.emptyDesc')}</Text>
          <View style={styles.emptyHint}>
            <View style={styles.emptyHintRow}>
              <Ionicons name="restaurant-outline" size={16} color="#E8692A" />
              <Text style={styles.emptyHintText}>{t('history.emptyHint')}</Text>
            </View>
          </View>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="search-outline" size={56} color="#1C1C1E" />
          <Text style={styles.emptyTitle}>{t('history.notFoundTitle')}</Text>
          <Text style={styles.emptyDesc}>{t('history.notFoundDesc', { query })}</Text>
        </View>
      ) : (
        <SectionList
          style={styles.list}
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DishRow
              dish={item}
              onPress={() => handleDishPress(item)}
              onDelete={() => handleDelete(item.id)}
            />
          )}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>{t(`timeLabel.${section.title}`)}</Text>
            </View>
          )}
          stickySectionHeadersEnabled
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}

      <DishEditSheet
        visible={sheetVisible}
        dish={selectedDish}
        onSave={handleSave}
        onDelete={handleDelete}
        onClose={() => {
          setSheetVisible(false);
          setSelectedDish(null);
        }}
      />

      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  titleArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
    backgroundColor: '#F2F2F7',
  },
  largeTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: 0.3,
  },
  settingsBtn: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#E5E5EA',
    borderRadius: 10,
    height: 36,
  },
  searchIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1C1C1E',
  },
  list: {
    flex: 1,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#F2F2F7',
  },
  sectionHeaderText: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardWrapper: {
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  dishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
  },
  dishInfo: {
    flex: 1,
  },
  dishNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginRight: 8,
  },
  dishName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
  },
  dishDate: {
    fontSize: 12,
    color: '#C7C7CC',
    marginLeft: 8,
  },
  dishIngredients: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 3,
  },
  noIngredients: {
    fontSize: 13,
    color: '#C7C7CC',
    marginTop: 3,
  },
  editHint: {
    fontSize: 18,
    color: '#C7C7CC',
    fontWeight: '300',
  },
  deleteAction: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyHint: {
    marginTop: 20,
    backgroundColor: '#FFF4EE',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  emptyHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  emptyHintText: {
    fontSize: 14,
    color: '#E8692A',
    fontWeight: '500',
  },
});
