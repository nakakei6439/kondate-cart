import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  SafeAreaView,
  ScrollView,
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

  return (
    <SafeAreaView style={styles.safe}>
      {/* 検索バー */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="料理名で検索..."
          placeholderTextColor="#BBBBBB"
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
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={styles.emptyTitle}>見つかりません</Text>
          <Text style={styles.emptyDesc}>「{query}」に一致する料理がありません</Text>
        </View>
      ) : (
        <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
          <Text style={styles.countText}>{filtered.length}件の料理</Text>
          {filtered.map((dish) => (
            <DishRow
              key={dish.id}
              dish={dish}
              onPress={() => handleDishPress(dish)}
              onDelete={() => handleDelete(dish.id)}
            />
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
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
    backgroundColor: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    height: 40,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333333',
  },
  list: {
    flex: 1,
  },
  countText: {
    fontSize: 13,
    color: '#888888',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
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
    color: '#333333',
    flex: 1,
  },
  dishDate: {
    fontSize: 12,
    color: '#BBBBBB',
    marginLeft: 8,
  },
  dishIngredients: {
    fontSize: 13,
    color: '#888888',
    marginTop: 3,
  },
  noIngredients: {
    fontSize: 13,
    color: '#BBBBBB',
    marginTop: 3,
  },
  editHint: {
    fontSize: 18,
    color: '#CCCCCC',
    fontWeight: '300',
  },
  deleteAction: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: '#FF4444',
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
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 22,
  },
});
