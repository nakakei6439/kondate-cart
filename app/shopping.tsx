import React, { useEffect } from 'react';
import {
  Alert,
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
  const { mode, items, setMode, generate, toggleItem, removeByName } = useShoppingStore();

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

  function handleRegenerate() {
    Alert.alert(
      'リストを再生成',
      '献立の材料からリストを作り直します。手動で削除した項目も元に戻ります。',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '再生成する', onPress: () => fetchAndGenerate(mode) },
      ]
    );
  }

  const uncheckedItems = items.filter((item) => !item.checked);
  const checkedItems = items.filter((item) => item.checked);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Large Title */}
      <View style={styles.titleArea}>
        <Text style={styles.largeTitle}>買い物リスト</Text>
      </View>

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
            献立タブで来週の料理と{'\n'}材料を登録してください
          </Text>
          <View style={styles.emptyHint}>
            <Text style={styles.emptyHintText}>🍽️  献立タブから登録できます</Text>
          </View>
        </View>
      ) : (
        <ScrollView style={styles.list}>
          <Text style={styles.countText}>
            {uncheckedItems.length}品目
            {checkedItems.length > 0 && `（購入済み ${checkedItems.length}品目）`}
          </Text>

          {uncheckedItems.map((item) => (
            <ShoppingItemComp
              key={item.name}
              item={item}
              onToggle={() => toggleItem(item.name)}
              onRemove={() => removeByName(item.name)}
            />
          ))}

          {checkedItems.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>購入済み</Text>
              </View>
              {checkedItems.map((item) => (
                <ShoppingItemComp
                  key={item.name}
                  item={item}
                  onToggle={() => toggleItem(item.name)}
                  onRemove={() => removeByName(item.name)}
                />
              ))}
            </>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      )}

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
  segmentRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: '#E0E0E5',
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
    color: '#1C1C1E',
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  countText: {
    fontSize: 13,
    color: '#8E8E93',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginTop: 8,
  },
  sectionHeaderText: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 34,
    paddingTop: 12,
    backgroundColor: '#F2F2F7',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#C6C6C8',
  },
  regenerateBtn: {
    backgroundColor: '#E8692A',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#E8692A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  regenerateBtnText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
