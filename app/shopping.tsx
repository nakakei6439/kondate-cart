import React, { useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ShoppingItemComp from '../src/components/ShoppingItem';
import { useShoppingStore } from '../src/store/shoppingStore';
import { loadWeekMenu } from '../src/storage/menuStorage';
import { WeekMenu } from '../src/types';
import { getCurrentWeekKey, nextWeekKey } from '../src/utils/weekUtils';

export default function ShoppingScreen() {
  const { mode, items, setMode, generate, removeItem } = useShoppingStore();

  // 買い物リストは来週・再来週が対象
  const nextWeekKey_ = nextWeekKey(getCurrentWeekKey());
  const weekAfterNextKey = nextWeekKey(nextWeekKey_);

  async function fetchAndGenerate(selectedMode: typeof mode) {
    const menus: WeekMenu[] = [];

    const nextMenu = await loadWeekMenu(nextWeekKey_);
    if (nextMenu) menus.push(nextMenu);

    if (selectedMode === 'twoWeeks') {
      const weekAfterNextMenu = await loadWeekMenu(weekAfterNextKey);
      if (weekAfterNextMenu) menus.push(weekAfterNextMenu);
    }

    generate(menus);
  }

  useEffect(() => {
    fetchAndGenerate(mode);
  }, [mode]);

  async function handleRegenerate() {
    await fetchAndGenerate(mode);
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* モード切替 */}
      <View style={styles.segmentRow}>
        <TouchableOpacity
          style={[styles.segmentBtn, mode === 'nextWeek' && styles.segmentActive]}
          onPress={() => setMode('nextWeek')}
        >
          <Text style={[styles.segmentText, mode === 'nextWeek' && styles.segmentTextActive]}>
            来週
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentBtn, mode === 'twoWeeks' && styles.segmentActive]}
          onPress={() => setMode('twoWeeks')}
        >
          <Text style={[styles.segmentText, mode === 'twoWeeks' && styles.segmentTextActive]}>
            再来週まで
          </Text>
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyTitle}>材料がありません</Text>
          <Text style={styles.emptyDesc}>
            献立タブで料理と材料を登録すると{'\n'}ここに自動で追加されます
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.list}>
          <Text style={styles.countText}>{items.length}品目</Text>
          {items.map((item, index) => (
            <ShoppingItemComp
              key={`${item.name}-${index}`}
              item={item}
              onRemove={() => removeItem(index)}
            />
          ))}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* 再生成ボタン */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.regenerateBtn} onPress={handleRegenerate}>
          <Text style={styles.regenerateBtnText}>↺  再生成</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  segmentRow: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentText: {
    fontSize: 15,
    color: '#888888',
    fontWeight: '500',
  },
  segmentTextActive: {
    color: '#333333',
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  countText: {
    fontSize: 13,
    color: '#888888',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
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
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 34,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  regenerateBtn: {
    backgroundColor: '#E8692A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  regenerateBtnText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
