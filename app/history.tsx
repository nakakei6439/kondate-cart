import React, { useEffect, useRef, useState } from 'react';
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
import { useDishStore } from '../src/store/dishStore';
import { DishRecord, Ingredient } from '../src/types';

function formatDate(isoString: string): string {
  const d = new Date(isoString);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function daysSince(isoString: string): number {
  const now = new Date();
  const then = new Date(isoString);
  return Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
}

function getTimeLabel(isoString: string): string {
  const diff = daysSince(isoString);
  if (diff < 7) return '今週';
  if (diff < 14) return '先週';
  if (diff < 30) return '今月';
  return 'それ以前';
}

function groupToSections(dishes: DishRecord[]): { title: string; data: DishRecord[] }[] {
  const order = ['今週', '先週', '今月', 'それ以前'];
  const map = new Map<string, DishRecord[]>();
  for (const dish of dishes) {
    const label = getTimeLabel(dish.updatedAt);
    const arr = map.get(label) ?? [];
    arr.push(dish);
    map.set(label, arr);
  }
  return order.filter((t) => map.has(t)).map((title) => ({ title, data: map.get(title)! }));
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
  const swipeRef = useRef<Swipeable>(null);

  function renderRightActions(progress: Animated.AnimatedInterpolation<number>) {
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
            Alert.alert('削除確認', `「${dish.name}」を履歴から削除しますか？`, [
              { text: 'キャンセル', style: 'cancel' },
              { text: '削除', style: 'destructive', onPress: onDelete },
            ]);
          }}
        >
          <Text style={styles.deleteBtnText}>削除</Text>
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
              <Text style={styles.noIngredients}>材料未登録</Text>
            )}
          </View>
          <Text style={styles.editHint}>›</Text>
        </TouchableOpacity>
      </Swipeable>
    </View>
  );
}

export default function HistoryScreen() {
  const { dishes, initialized, loadDishes, updateDish, deleteDish } = useDishStore();
  const [selectedDish, setSelectedDish] = useState<DishRecord | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
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
        <Text style={styles.largeTitle}>料理の履歴</Text>
      </View>

      {/* 検索バー */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="料理名で検索..."
          placeholderTextColor="#C7C7CC"
          clearButtonMode="while-editing"
          returnKeyType="search"
        />
      </View>

      {dishes.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyTitle}>料理履歴がありません</Text>
          <Text style={styles.emptyDesc}>
            献立タブで料理を登録すると{'\n'}ここに履歴が表示されます
          </Text>
          <View style={styles.emptyHint}>
            <Text style={styles.emptyHintText}>🍽️  献立タブから登録できます</Text>
          </View>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={styles.emptyTitle}>見つかりません</Text>
          <Text style={styles.emptyDesc}>「{query}」に一致する料理がありません</Text>
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
              <Text style={styles.sectionHeaderText}>{section.title}</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  titleArea: {
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
  emptyHintText: {
    fontSize: 14,
    color: '#E8692A',
    fontWeight: '500',
  },
});
